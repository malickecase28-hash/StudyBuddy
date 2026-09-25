import { describe, expect, it } from "vitest";
import { Course, emptyProgress, initialState, lintCourse, topoOrder, unmetPrerequisites } from "../src";

const meta = { mood: "quiet", source: { doc: "d", locator: "p1" }, licence: "original" } as const;
const concept = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  title: id,
  unit: 2,
  objectives: ["o"],
  prerequisites: [],
  misconceptions: [],
  examLinks: [],
  sources: [],
  status: "draft",
  lessons: [{ id: "main", title: "t", minutes: 5, blocks: [{ ...meta, id: "p", type: "prose", text: "x" }] }],
  rules: [],
  ...extra,
});
const course = (concepts: unknown[]) =>
  Course.parse({ id: "em1", code: "ELE3001", title: "EM1", examDate: "2026-12-15", units: [], concepts });

describe("graph", () => {
  it("orders prerequisites before dependants and detects cycles", () => {
    const c = course([concept("em1.a.gauss", { prerequisites: [{ conceptId: "em1.a.flux", minMastery: 0.6 }] }), concept("em1.a.flux")]);
    expect(topoOrder(c)).toEqual(["em1.a.flux", "em1.a.gauss"]);
    const cyc = course([
      concept("em1.a.x", { prerequisites: [{ conceptId: "em1.a.y", minMastery: 0.5 }] }),
      concept("em1.a.y", { prerequisites: [{ conceptId: "em1.a.x", minMastery: 0.5 }] }),
    ]);
    expect(() => topoOrder(cyc)).toThrow(/cycle/);
  });
  it("reports unmet prerequisites from learner mastery", () => {
    const c = course([concept("em1.a.gauss", { prerequisites: [{ conceptId: "em1.a.flux", minMastery: 0.6 }] }), concept("em1.a.flux")]);
    const s = initialState();
    s.concepts["em1.a.flux"] = {
      ...emptyProgress(),
      dimensions: { conceptual: 1, computational: 1, recognition: 0, independent: 0, application: 0 },
    };
    expect(unmetPrerequisites(c, "em1.a.gauss", s)).toEqual([{ conceptId: "em1.a.flux", minMastery: 0.6, current: 0.4 }]);
  });
});

describe("lintCourse", () => {
  it("passes a clean course", () => {
    expect(lintCourse(course([concept("em1.a.flux")]))).toEqual([]);
  });
  it("catches the structural problems the spec lists", () => {
    const bad = course([
      concept("em1.a.gauss", {
        prerequisites: [{ conceptId: "em1.a.missing", minMastery: 0.5 }],
        misconceptions: [{ tag: "FLUX_SCALES_WITH_AREA", description: "d", remediation: "em1.a.gauss/nope" }],
        rules: [{ id: "r", when: { type: "tagCount", tag: "UNDECLARED", gte: 2 }, then: [{ type: "offerSkip" }] }],
        lessons: [
          {
            id: "main",
            title: "t",
            minutes: 5,
            blocks: [
              { ...meta, id: "dup", type: "prose", text: "x" },
              { ...meta, id: "dup", type: "prose", text: "y" },
              {
                ...meta,
                id: "m",
                type: "mcq",
                prompt: "?",
                dimension: "conceptual",
                options: [
                  { id: "a", label: "A", correct: false, feedback: "f", tag: "NOT_DECLARED" },
                  { id: "b", label: "B", correct: false, feedback: "f" },
                ],
              },
              {
                ...meta,
                id: "o",
                type: "order",
                prompt: "?",
                dimension: "conceptual",
                items: [
                  { id: "x", label: "X" },
                  { id: "y", label: "Y" },
                ],
                correctOrder: ["x", "z"],
                feedback: "f",
              },
              { ...meta, id: "n", type: "numeric", prompt: "?", dimension: "computational", answer: { value: 1, unit: "furlong" } },
            ],
          },
        ],
      }),
    ]);
    const msgs = lintCourse(bad).map((i) => i.message);
    expect(msgs).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/prerequisite em1\.a\.missing does not exist/),
        expect.stringMatching(/remediation em1\.a\.gauss\/nope does not resolve/),
        expect.stringMatching(/rule r uses undeclared tag UNDECLARED/),
        expect.stringMatching(/duplicate block id dup/),
        expect.stringMatching(/tag NOT_DECLARED is not declared/),
        expect.stringMatching(/mcq m has no correct option/),
        expect.stringMatching(/order o: correctOrder must be a permutation of item ids/),
        expect.stringMatching(/unit "furlong"/),
      ]),
    );
  });
});
