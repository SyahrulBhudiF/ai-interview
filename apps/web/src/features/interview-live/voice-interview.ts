import type { AnswerRequest, SessionAnswerResponse } from "@ai-interview/shared";
import type {
  RealtimeAdapter,
  RealtimeConnection,
  RealtimeMode,
  RealtimeStatus,
  RealtimeToken,
} from "@tanstack/ai";

export interface VoiceInterviewState {
  status: RealtimeStatus;
  mode: RealtimeMode;
  muted: boolean;
  saving: boolean;
  completed: boolean;
  candidateText: string;
  interviewerText: string;
  error: string | null;
}

export const initialVoiceState: VoiceInterviewState = {
  status: "idle",
  mode: "idle",
  muted: false,
  saving: false,
  completed: false,
  candidateText: "",
  interviewerText: "",
  error: null,
};

export class VoiceInterview {
  private connection: RealtimeConnection | null = null;
  private generation = 0;
  private state = { ...initialVoiceState };
  private replyTo = "";
  private spokenQuestion = "";
  private pendingAnswer: AnswerRequest | null = null;
  private toolCallId: string | null = null;
  private subscriptions: Array<() => void> = [];
  private answerTimer: ReturnType<typeof setInterval> | null = null;
  private playbackTimer: ReturnType<typeof setInterval> | null = null;
  private cancelSetup: (() => void) | null = null;
  private lastTranscriptAt = 0;

  constructor(
    private readonly options: {
      adapter: RealtimeAdapter;
      getToken: () => Promise<RealtimeToken>;
      saveAnswer: (answer: AnswerRequest) => Promise<SessionAnswerResponse>;
      onChange: (state: VoiceInterviewState) => void;
      onSaved: (result: SessionAnswerResponse) => void;
    },
  ) {}

  private update(patch: Partial<VoiceInterviewState>) {
    this.state = { ...this.state, ...patch };
    this.options.onChange(this.state);
  }

  async connect(replyTo: string) {
    if (
      this.connection ||
      this.state.status === "connecting" ||
      this.pendingAnswer ||
      this.state.completed
    )
      return;
    const generation = ++this.generation;
    this.replyTo = replyTo;
    this.spokenQuestion = "";
    this.update({ status: "connecting", error: null, muted: false, interviewerText: "" });
    try {
      const token = await this.options.getToken();
      if (generation !== this.generation) return;
      const connection = await this.options.adapter.connect(token);
      if (generation !== this.generation) {
        await connection.disconnect();
        return;
      }
      this.connection = connection;
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("The interviewer did not connect. Please try again.")),
          20000,
        );

        this.cancelSetup = () => {
          clearTimeout(timeout);
          reject(new Error("Connection cancelled."));
        };
        this.subscriptions.push(
          connection.on("status_change", ({ status }) => {
            this.update({ status });
            if (status === "connected") {
              clearTimeout(timeout);
              resolve();
            }
            if (status === "idle" || status === "error") {
              clearTimeout(timeout);
              this.fail(
                "Voice connection closed. Your saved answers are kept. Reconnect to continue.",
              );
            }
          }),
          connection.on("error", ({ error }) => {
            clearTimeout(timeout);
            reject(error);
            this.fail(error.message);
          }),
          connection.on("mode_change", ({ mode }) => this.update({ mode })),
          connection.on("transcript", ({ role, transcript }) => {
            if (role === "user" && !this.state.saving && !this.pendingAnswer) {
              this.lastTranscriptAt = Date.now();
              this.update({ candidateText: this.state.candidateText + transcript });
            }
            if (role === "assistant") this.update({ interviewerText: transcript });
          }),
          connection.on("message_complete", ({ message }) => {
            const text = message.parts
              .flatMap((part) => (part.type === "text" ? [part.content] : []))
              .join("")
              .trim();

            if (text) this.spokenQuestion = [this.spokenQuestion, text].filter(Boolean).join("\n");
            if (this.state.completed) this.finishPlayback();
          }),
          connection.on("tool_call", ({ toolCallId, toolName }) => {
            if (
              toolName !== "submit_answer" ||
              this.state.saving ||
              this.pendingAnswer ||
              this.state.completed
            )
              return;
            this.toolCallId = toolCallId;
            this.waitForAnswerEnd();
          }),
          connection.on("go_away", () =>
            this.fail(
              "The voice connection needs to be renewed. Reconnect to continue from your saved question.",
            ),
          ),
        );
        connection.updateSession({ outputModalities: ["audio", "text"] });
      });
      this.cancelSetup = null;
      if (generation !== this.generation) return;
      this.update({ status: "connected" });
      connection.sendText(
        "Begin the interview by reading the current question aloud. Wait for my spoken answer.",
      );
    } catch (error) {
      if (generation !== this.generation) return;
      const message = error instanceof Error ? error.message : "Could not connect the microphone.";
      this.fail(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone access is blocked. Allow it in your browser's site settings, then reconnect, or use text instead."
          : error instanceof DOMException && error.name === "NotFoundError"
            ? "No microphone was found. Connect a microphone, then reconnect, or use text instead."
            : message,
      );
    }
  }

  private waitForAnswerEnd() {
    if (this.answerTimer) clearInterval(this.answerTimer);
    let quietSince = Date.now();
    this.answerTimer = setInterval(() => {
      const inputLevel = this.connection?.getAudioVisualization().inputLevel ?? 0;
      if (inputLevel > 0.025 || Date.now() - this.lastTranscriptAt < 800) {
        quietSince = Date.now();
      }
      if (Date.now() - quietSince >= 1800) void this.submitAnswer();
    }, 100);
  }

  async submitAnswer() {
    if (this.state.saving || this.state.completed) return;
    if (this.answerTimer) clearInterval(this.answerTimer);
    this.answerTimer = null;
    const text = this.state.candidateText.trim();
    if (!this.pendingAnswer && !text) {
      if (this.toolCallId)
        this.connection?.sendToolResult(
          this.toolCallId,
          JSON.stringify({
            error: "No speech transcript was received. Ask the candidate to repeat their answer.",
          }),
        );
      return;
    }
    this.pendingAnswer ??= {
      text,
      replyTo: this.replyTo,
      spokenQuestion: this.spokenQuestion.trim() || undefined,
    };
    this.connection?.stopAudioCapture();
    this.update({ saving: true, error: null });
    let result: SessionAnswerResponse;
    try {
      result = await this.options.saveAnswer(this.pendingAnswer);
    } catch {
      this.connection?.interrupt();
      this.update({
        saving: false,
        error:
          "Your answer has not been confirmed saved. It is kept here. Retry saving before continuing.",
      });
      return;
    }
    this.replyTo = result.interviewerEntryId;
    this.pendingAnswer = null;
    this.spokenQuestion = "";
    this.update({
      saving: false,
      candidateText: "",
      interviewerText: "",
      completed: result.finished,
    });
    if (this.toolCallId && this.connection) {
      this.connection.sendToolResult(this.toolCallId, JSON.stringify(result));
    } else if (this.connection) {
      this.connection.sendText(
        `The answer has been saved. Read this interviewer message verbatim: ${result.interviewerMessage}`,
      );
    }
    this.toolCallId = null;
    this.options.onSaved(result);
    if (!result.finished && !this.state.muted) {
      try {
        await this.connection?.startAudioCapture();
      } catch {
        this.fail("Your answer is saved, but the microphone stopped. Reconnect to continue.");
      }
    }
    return result;
  }

  takeDraft() {
    const text = this.state.candidateText;
    this.pendingAnswer = null;
    this.update({ candidateText: "", error: null });
    return text;
  }

  toggleMute() {
    if (!this.connection || this.state.saving || this.state.completed) return;
    const muted = !this.state.muted;
    if (muted) this.connection.stopAudioCapture();
    else
      void this.connection
        .startAudioCapture()
        .catch(() => this.fail("Microphone access was lost. Reconnect to continue."));
    this.update({ muted });
  }

  interrupt() {
    this.connection?.interrupt();
  }

  getAudioLevel() {
    const audio = this.connection?.getAudioVisualization();
    return Math.max(audio?.inputLevel ?? 0, audio?.outputLevel ?? 0);
  }

  private fail(error: string) {
    void this.disconnect();
    this.update({ status: "error", error });
  }

  private finishPlayback() {
    if (this.playbackTimer) clearInterval(this.playbackTimer);
    let quietSince = Date.now();
    this.playbackTimer = setInterval(() => {
      const level = this.connection?.getAudioVisualization().outputLevel ?? 0;
      if (level > 0.01) quietSince = Date.now();
      if (Date.now() - quietSince > 1800) void this.disconnect();
    }, 100);
  }

  async disconnect() {
    ++this.generation;
    this.cancelSetup?.();
    this.cancelSetup = null;
    if (this.answerTimer) clearInterval(this.answerTimer);
    this.answerTimer = null;
    if (this.playbackTimer) clearInterval(this.playbackTimer);
    this.playbackTimer = null;
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions = [];
    const connection = this.connection;
    this.connection = null;
    this.toolCallId = null;
    this.update({ status: "idle", mode: "idle" });
    await connection?.disconnect();
  }
}
