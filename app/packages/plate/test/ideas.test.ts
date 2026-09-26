import { z } from "zod";
import { describe, expect, it } from "vitest";
import { coverageGaps, defineComponent, defineIdeaPlate, Registry, stepLocation, timelineMarks, validateIdeas, validatePlate } from "../src";

const Src = defineComponent({ id: "src", params: z.object({ q: z.number() }), model: (p) => ({ total: p.q }), handles: ["q"], readouts: { total: "µC" } });
const reg = new Registry().register(Src);
const choose = (id: string, tag?: string) => ({
  id, type: "choose", prompt: "p", dimension: "conceptual",
  options: [{ id: "a", label: "A", correct: true, feedback: "f" }, { id: "b", label: "B", correct: false, feedback: "f", ...(tag ? { tag } : {}) }],
});

const lesson = defineIdeaPlate({
  id: "demo", title: "Demo",
  instances: [{ id: "a", component: "src", params: { q: 1 } }],
  requires: { objectives: [0], items: ["past:q1"], misconceptions: ["SIGN_SLIP"] },
  ideas: [{
    id: "one", title: "First idea", objectives: [0],
    explain: [{ id: "e1", title: "E1", show: ["a"], note: "q is 1 µC." }, { id: "e2", title: "E2", patch: { a: { q: 2 } }, note: "Now 2 µC." }],
    examples: [{ id: "x1", level: "basic", title: "Ex", problem: "Find q.", setup: { a: { q: 3 } }, lines: [{ text: "It reads 3 µC.", focus: ["a"] }], trap: "Not q squared.", covers: ["past:q1"] }],
    asks: [{ id: "k1", q: "Why?", a: "Because 4 µC.", patch: { a: { q: 4 } }, tags: ["SIGN_SLIP"] }],
    checks: [{ id: "c1", title: "Check", note: "Answer.", interaction: choose("c1", "SIGN_SLIP") }],
    recap: { points: ["q is what the plate says."], traps: ["Reading the wrong readout."] },
  }],
});

describe("defineIdeaPlate", () => {
  it("flattens ideas into kinded steps with a meta index", () => {
    expect(lesson.plate.steps.map((s) => `${s.kind}:${s.id}`)).toEqual([
      "explain:one-e1", "explain:one-e2", "work:one-x1", "work:one-x1-l1", "check:one-c1", "recap:one-recap",
    ]);
    const idea = lesson.meta.ideas[0]!;
    expect(idea).toMatchObject({ start: 0, end: 5, explain: [0, 1], checks: [{ index: 4, id: "c1", covers: [], tags: ["SIGN_SLIP"] }] });
    expect(idea.examples[0]).toMatchObject({ start: 2, end: 3, trap: "Not q squared." });
  });
  it("says where the learner is, and marks the timeline", () => {
    expect(stepLocation(lesson.meta, 1)).toBe("Idea 1 · First idea · Explanation 2 of 2");
    expect(stepLocation(lesson.meta, 3)).toBe("Idea 1 · First idea · Worked example 1 of 1 · line 1");
    expect(stepLocation(lesson.meta, 4)).toBe("Idea 1 · First idea · Check 1 of 1");
    expect(stepLocation(lesson.meta, 5)).toBe("Idea 1 · First idea · Recap");
    expect(timelineMarks(lesson.meta)).toEqual([
      { index: 0, label: "1 First idea" }, { index: 2, label: "Example 1" }, { index: 4, label: "Check" }, { index: 5, label: "Recap" },
    ]);
  });
  it("coverage passes when objectives, items and misconceptions are all taught", () => {
    expect(coverageGaps(lesson.meta)).toEqual([]);
    const bare = { ...lesson.meta, requires: { objectives: [0, 1], items: ["past:q9"], misconceptions: ["OTHER"] } };
    expect(coverageGaps(bare)).toEqual([
      "objective 1: no idea teaches it",
      "item past:q9: not worked or checked",
      "misconception OTHER: no ask",
      "misconception OTHER: no check detects it",
    ]);
  });
  it("validates plate steps and asks (numbers backed, word budget)", () => {
    expect(validatePlate(reg, lesson.plate)).toEqual([]);
    expect(validateIdeas(reg, lesson)).toEqual([]);
    const bad = { ...lesson, meta: { ...lesson.meta, ideas: [{ ...lesson.meta.ideas[0]!, asks: [{ id: "k2", q: "?", a: `It is 7 µC. ${"word ".repeat(85)}` }] }] } };
    expect(validateIdeas(reg, bad).map((i) => i.message)).toEqual([
      expect.stringMatching(/ask k2 has \d+ words \(budget 80\)/),
      expect.stringMatching(/ask k2: unbacked number "7 µC"/),
    ]);
  });
});
