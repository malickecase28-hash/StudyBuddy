import { describe, expect, it } from "vitest";
import { DAY_MS, initialState, reduce, type LearnEvent, type Rule } from "../src";

const cid = "em1.electrostatics.gauss-law";
const rules: Rule[] = [
  {
    id: "area-twice",
    when: { type: "tagCount", tag: "FLUX_SCALES_WITH_AREA", gte: 2 },
    then: [{ type: "offerRemediation", tag: "FLUX_SCALES_WITH_AREA", lessonRef: `${cid}/why-area` }],
    once: true,
  },
  {
    id: "fast-pass",
    when: { type: "challengePassed", firstAttempt: true },
    then: [{ type: "offerSkip" }, { type: "credit", dimension: "application", amount: 0.8 }],
    once: true,
  },
  { id: "stuck", when: { type: "attemptsFailed", blockType: "step-solve", gte: 3 }, then: [{ type: "revealWorkedStep" }], once: false },
];
const concept = { id: cid, rules };
const t0 = Date.UTC(2026, 8, 25);

const wrong = (at: number): LearnEvent => ({
  type: "answer",
  conceptId: cid,
  blockId: "q1",
  blockType: "mcq",
  dimensions: ["conceptual"],
  correct: false,
  attempt: 1,
  tag: "FLUX_SCALES_WITH_AREA",
  at,
});

describe("reduce", () => {
  it("does not mutate input and records history + seen", () => {
    const s0 = initialState();
    const { state } = reduce(s0, { type: "blockViewed", conceptId: cid, blockId: "b1", at: t0 }, concept);
    expect(s0.concepts).toEqual({});
    expect(state.concepts[cid]!.seen).toBe(true);
    expect(state.history).toHaveLength(1);
  });

  it("fires tagCount remediation on the second occurrence, only once", () => {
    let r = reduce(initialState(), wrong(t0), concept);
    expect(r.effects).toEqual([]);
    r = reduce(r.state, wrong(t0 + 1), concept);
    expect(r.effects).toEqual([{ type: "offerRemediation", tag: "FLUX_SCALES_WITH_AREA", lessonRef: `${cid}/why-area` }]);
    r = reduce(r.state, wrong(t0 + 2), concept);
    expect(r.effects).toEqual([]);
    expect(r.state.concepts[cid]!.tags.FLUX_SCALES_WITH_AREA).toBe(3);
  });

  it("first-attempt challenge pass offers skip and credits application", () => {
    const r = reduce(
      initialState(),
      { type: "answer", conceptId: cid, blockId: "ch", blockType: "challenge", dimensions: ["independent"], correct: true, attempt: 1, at: t0 },
      concept,
    );
    expect(r.effects.map((e) => e.type)).toEqual(["offerSkip", "credit"]);
    expect(r.state.concepts[cid]!.dimensions.application).toBe(0.8);
  });

  it("repeating attemptsFailed rule fires every 3rd failure", () => {
    let s = initialState();
    const fail = (i: number): LearnEvent => ({
      type: "answer",
      conceptId: cid,
      blockId: "ws",
      blockType: "step-solve",
      dimensions: ["computational"],
      correct: false,
      attempt: i,
      at: t0 + i,
    });
    let fired = 0;
    for (let i = 1; i <= 6; i++) {
      const r = reduce(s, fail(i), concept);
      fired += r.effects.filter((e) => e.type === "revealWorkedStep").length;
      s = r.state;
    }
    expect(fired).toBe(2);
  });

  it("schedules a review once a dimension reaches the mastery threshold, and retrieval updates it", () => {
    let s = initialState();
    for (let i = 0; i < 5; i++) {
      s = reduce(
        s,
        { type: "answer", conceptId: cid, blockId: `c${i}`, blockType: "mcq", dimensions: ["conceptual"], correct: true, attempt: 1, at: t0 },
        concept,
      ).state;
    }
    const review = s.concepts[cid]!.review.conceptual!;
    expect(review.intervalDays).toBe(1);
    expect(review.due).toBe(t0 + DAY_MS);
    s = reduce(s, { type: "retrieval", conceptId: cid, dimension: "conceptual", correct: true, at: t0 + DAY_MS }, concept).state;
    expect(s.concepts[cid]!.review.conceptual!.intervalDays).toBe(2);
  });
});
