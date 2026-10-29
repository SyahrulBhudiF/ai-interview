import type { AnswerRequest, SessionAnswerResponse } from "@ai-interview/shared";
import { createRealtimeEventEmitter, type RealtimeConnection } from "@tanstack/ai";
import { afterEach, describe, expect, it, vi } from "vitest";

import { initialVoiceState, VoiceInterview } from "./voice-interview";

function room() {
  const events = createRealtimeEventEmitter();
  const answers: AnswerRequest[] = [];
  const spoken: string[] = [];
  let state = initialVoiceState;
  let capturing = true;
  let closed = false;
  let offline = false;
  let inputLevel = 0;
  let saved: SessionAnswerResponse | undefined;

  const connection: RealtimeConnection = {
    on: events.on,
    disconnect: async () => {
      closed = true;
      capturing = false;
    },
    startAudioCapture: async () => {
      capturing = true;
    },
    stopAudioCapture: () => {
      capturing = false;
    },
    sendText: (text) => {
      spoken.push(text);
    },
    sendImage: () => {},
    sendToolResult: (_id, result) => {
      spoken.push(result);
    },
    updateSession: () => events.emit("status_change", { status: "connected" }),
    interrupt: () => {},
    getAudioVisualization: () => ({
      inputLevel,
      outputLevel: 0,
      inputSampleRate: 16000,
      outputSampleRate: 24000,
      getInputFrequencyData: () => new Uint8Array(),
      getOutputFrequencyData: () => new Uint8Array(),
      getInputTimeDomainData: () => new Uint8Array(),
      getOutputTimeDomainData: () => new Uint8Array(),
    }),
  };

  const controller = new VoiceInterview({
    adapter: { provider: "test", connect: async () => connection },
    getToken: async () => ({
      provider: "test",
      token: "disposable",
      expiresAt: Date.now() + 60000,
      config: {},
    }),
    saveAnswer: async (answer) => {
      answers.push(answer);
      if (offline) throw new Error("offline");
      return {
        session: {
          id: "session",
          interviewId: "interview",
          status: "in_progress",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        interviewerMessage: "What tradeoff did you make?",
        interviewerEntryId: "follow-up",
        finished: false,
      };
    },
    onChange: (next) => {
      state = next;
    },
    onSaved: (result) => {
      saved = result;
    },
  });

  const speech = (transcript: string, isFinal = false) =>
    events.emit("transcript", { role: "user", transcript, isFinal });

  return {
    controller,
    events,
    speech,
    answers,
    spoken,
    connection,
    get state() {
      return state;
    },
    get saved() {
      return saved;
    },
    get capturing() {
      return capturing;
    },
    get closed() {
      return closed;
    },
    set offline(value: boolean) {
      offline = value;
    },
    set inputLevel(value: number) {
      inputLevel = value;
    },
  };
}

describe("voice interview", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps every speech chunk and advances only after saving the complete answer", async () => {
    const r = room();
    await r.controller.connect("question-1");
    r.events.emit("message_complete", {
      message: {
        id: "spoken-1",
        role: "assistant",
        timestamp: 1,
        parts: [{ type: "text", content: "Tell me about the cache you built." }],
      },
    });
    r.speech("I cached inventory");
    r.speech(" for 30 seconds.");
    r.speech(" Writes invalidated the cache.", true);
    expect(r.answers).toEqual([]);
    expect(r.state.candidateText).toBe(
      "I cached inventory for 30 seconds. Writes invalidated the cache.",
    );
    await r.controller.submitAnswer();
    expect(r.answers).toEqual([
      {
        replyTo: "question-1",
        text: "I cached inventory for 30 seconds. Writes invalidated the cache.",
        spokenQuestion: "Tell me about the cache you built.",
      },
    ]);
    expect(r.saved?.interviewerMessage).toBe("What tradeoff did you make?");
    expect(r.state.candidateText).toBe("");
    r.speech("We accepted a stale read.", true);
    await r.controller.submitAnswer();
    expect(r.answers[1]?.replyTo).toBe("follow-up");
    await r.controller.disconnect();
  });

  it("uses the microphone transcript, not model-generated tool arguments", async () => {
    vi.useFakeTimers();
    const r = room();
    await r.controller.connect("question-1");
    r.speech("I have not used Kubernetes.", true);
    r.events.emit("tool_call", {
      toolName: "submit_answer",
      toolCallId: "tool-1",
      input: { text: "I am a Kubernetes expert." },
    });
    await vi.advanceTimersByTimeAsync(3000);
    expect(r.saved).toBeDefined();
    expect(r.answers[0]?.text).toBe("I have not used Kubernetes.");
    await r.controller.disconnect();
  });

  it("waits for ongoing speech and late transcript chunks despite an early tool call", async () => {
    vi.useFakeTimers();
    const r = room();
    await r.controller.connect("question-1");
    r.inputLevel = 0.3;
    r.speech("I compared latency before and after");
    r.events.emit("tool_call", { toolName: "submit_answer", toolCallId: "early", input: {} });
    await vi.advanceTimersByTimeAsync(5000);
    expect(r.answers).toEqual([]);
    expect(r.capturing).toBe(true);
    r.inputLevel = 0;
    await vi.advanceTimersByTimeAsync(1700);
    r.speech(" under the same load. We accepted stale reads.");
    await vi.advanceTimersByTimeAsync(2000);
    expect(r.answers).toEqual([]);
    await vi.advanceTimersByTimeAsync(700);
    expect(r.answers[0]?.text).toBe(
      "I compared latency before and after under the same load. We accepted stale reads.",
    );
    await r.controller.disconnect();
  });

  it("retains the same answer on a failed save and respects mute after retry", async () => {
    const r = room();
    await r.controller.connect("question-1");
    r.speech("We reduced p95 from 800 to 210 milliseconds.", true);
    r.controller.toggleMute();
    r.offline = true;
    await r.controller.submitAnswer();
    expect(r.saved).toBeUndefined();
    expect(r.state.candidateText).toBe("We reduced p95 from 800 to 210 milliseconds.");
    expect(r.state.error).toContain("not been confirmed saved");
    r.offline = false;
    await r.controller.submitAnswer();
    expect(r.answers[1]).toEqual(r.answers[0]);
    expect(r.capturing).toBe(false);
    expect(r.state.muted).toBe(true);
    await r.controller.disconnect();
    expect(r.closed).toBe(true);
    r.speech("late event", true);
    expect(r.state.candidateText).toBe("");
  });

  it("releases a connection that arrives after the candidate has left", async () => {
    const r = room();
    const pending = Promise.withResolvers<RealtimeConnection>();
    let state = initialVoiceState;

    const controller = new VoiceInterview({
      adapter: { provider: "test", connect: () => pending.promise },
      getToken: async () => ({ provider: "test", token: "test", expiresAt: 1, config: {} }),
      saveAnswer: async () => {
        throw new Error("No answer expected");
      },
      onChange: (next) => {
        state = next;
      },
      onSaved: () => {},
    });

    const connecting = controller.connect("question-1");
    await Promise.resolve();
    await controller.disconnect();
    pending.resolve(r.connection);
    await connecting;
    expect(r.closed).toBe(true);
    expect(state.status).toBe("idle");
  });
});
