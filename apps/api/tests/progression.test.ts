import { assert, describe, it } from "@effect/vitest";

import {
  firstQuestion,
  followUpAllowed,
  followUpsUsed,
  nextQuestion,
  type StageNode,
} from "../src/modules/session/progression";

const stage1: StageNode = {
  id: "stage-1",
  maxFollowUps: 1,
  questions: [
    { id: "q1", stageId: "stage-1", text: "Q1" },
    { id: "q2", stageId: "stage-1", text: "Q2" },
  ],
};

const stage2: StageNode = {
  id: "stage-2",
  maxFollowUps: 0,
  questions: [{ id: "q3", stageId: "stage-2", text: "Q3" }],
};

const plan = [stage1, stage2];

describe("firstQuestion", () => {
  it("returns the first question", () => {
    assert.strictEqual(firstQuestion(plan)?.id, "q1");
  });

  it("returns null for an empty plan", () => {
    assert.strictEqual(firstQuestion([]), null);
  });
});

describe("nextQuestion", () => {
  it("advances within a stage", () => {
    assert.strictEqual(nextQuestion(plan, "stage-1", "q1")?.id, "q2");
  });

  it("crosses into the next stage", () => {
    assert.strictEqual(nextQuestion(plan, "stage-1", "q2")?.id, "q3");
  });

  it("returns null when exhausted", () => {
    assert.strictEqual(nextQuestion(plan, "stage-2", "q3"), null);
  });
});

describe("followUpsUsed", () => {
  it("counts AI entries beyond the main question", () => {
    const used = followUpsUsed(
      [
        { role: "ai", questionId: "q1" },
        { role: "candidate", questionId: "q1" },
        { role: "ai", questionId: "q1" },
      ],
      "q1",
    );

    assert.strictEqual(used, 1);
  });

  it("ignores entries for other questions", () => {
    assert.strictEqual(followUpsUsed([{ role: "ai", questionId: "q2" }], "q1"), 0);
  });
});

describe("followUpAllowed", () => {
  it("respects the toggle and per-question budget", () => {
    assert.isTrue(followUpAllowed(true, stage1, 0));
    assert.isFalse(followUpAllowed(true, stage1, 1));
    assert.isFalse(followUpAllowed(false, stage1, 0));
    assert.isFalse(followUpAllowed(true, stage2, 0));
  });
});
