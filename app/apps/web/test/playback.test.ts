import { plates } from "@forma/course-em1";
import { describe, expect, it } from "vitest";
import { answeredFromHistory, attemptedIds, resumeStepFor, shouldCredit } from "@/lib/playback";

const ans = (blockId: string, correct: boolean, attempt = 1) => ({ type: "answer", conceptId: "c", blockId, blockType: "plate", dimensions: [], correct, attempt, at: attempt }) as const;
const gauss = plates.gauss!;

describe("answeredFromHistory", () => {
  it("unlocks exactly as a live session does, per interaction type", () => {
    const h = [
      ans("gauss.flux-guess", false), // predict-drag: any commit counts
      ans("gauss.normal-direction", false), // choose: one wrong attempt does not unlock
      ans("gauss.cube-flux", false, 1), // numeric: only a correct answer unlocks
      ans("gauss.cube-flux", false, 2),
      ans("faraday.faraday-predict", true), // another plate
      { type: "blockViewed", conceptId: "c", blockId: "gauss#charge", at: 3 },
    ];
    expect([...answeredFromHistory(h as never, gauss)].sort()).toEqual(["flux-guess"]);
  });
  it("counts choose after a correct answer or two attempts, and goals once met", () => {
    const h = [ans("gauss.normal-direction", false, 1), ans("gauss.normal-direction", false, 2), ans("gauss.drag-out", true), ans("gauss.cube-flux", true, 3)];
    expect([...answeredFromHistory(h as never, gauss)].sort()).toEqual(["cube-flux", "drag-out", "normal-direction"]);
    expect([...answeredFromHistory([], gauss)]).toEqual([]);
  });
});

it("a deep-linked step applies only to the block it names", () => {
  const base = { stepCount: 6, snapshotStep: undefined, position: null };
  expect(resumeStepFor({ ...base, blockId: "gauss", initialBlock: "gauss", initialStep: 2 })).toBe(2);
  expect(resumeStepFor({ ...base, blockId: "gauss", initialBlock: "faraday", initialStep: 1 })).toBe(0);
  expect(resumeStepFor({ ...base, blockId: "gauss", initialBlock: undefined, initialStep: undefined, position: { blockId: "gauss", plateStep: 4 } })).toBe(4);
  expect(resumeStepFor({ ...base, blockId: "gauss", initialBlock: undefined, initialStep: undefined, snapshotStep: 3 })).toBe(3);
});

it("goals and experiments are credited once, not on every revisit", () => {
  expect(shouldCredit("drag-out", new Set())).toBe(true);
  expect(shouldCredit("drag-out", new Set(["drag-out"]))).toBe(false);
  expect([...attemptedIds([ans("gauss-lab.resize", true), ans("gauss.flux-guess", true)] as never, "gauss-lab")]).toEqual(["resize"]);
});
