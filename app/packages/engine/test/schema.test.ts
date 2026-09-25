import { describe, expect, it } from "vitest";
import { Block, Concept, Course } from "../src";

const meta = { mood: "quiet", source: { doc: "Unit 2b slides", locator: "slide 14" }, licence: "restricted" } as const;

const mcq = {
  ...meta,
  id: "flux-radius",
  type: "mcq",
  prompt: "The sphere radius doubles. What happens to the total flux?",
  dimension: "conceptual",
  options: [
    { id: "a", label: "Doubles", correct: false, feedback: "Area grows but D weakens as 1/r².", tag: "FLUX_SCALES_WITH_AREA" },
    { id: "b", label: "Unchanged", correct: true, feedback: "Only enclosed charge matters." },
  ],
};

describe("Block schema", () => {
  it("accepts a valid mcq", () => {
    expect(Block.parse(mcq).type).toBe("mcq");
  });
  it("rejects a block without licence", () => {
    const { licence: _l, ...bad } = mcq;
    expect(Block.safeParse(bad).success).toBe(false);
  });
  it("accepts nested branches (recursive)", () => {
    const branch = {
      ...meta,
      id: "why-enclosed",
      type: "branch",
      prompt: "What would you like to explore?",
      options: [{ id: "geo", label: "Show me geometrically", blocks: [{ ...meta, id: "p1", type: "prose", text: "Field lines…" }] }],
    };
    expect(Block.parse(branch).type).toBe("branch");
  });
  it("fills numeric defaults", () => {
    const b = Block.parse({
      ...meta,
      id: "q1",
      type: "numeric",
      prompt: "Find Ψ",
      dimension: "computational",
      answer: { value: 4, unit: "µC" },
    });
    expect(b.type === "numeric" && b.relTol).toBe(0.02);
    expect(b.type === "numeric" && b.distractors).toEqual([]);
  });
});

describe("Concept and Course", () => {
  it("parses a minimal course", () => {
    const concept = Concept.parse({
      id: "em1.electrostatics.gauss-law",
      title: "Gauss's Law",
      unit: 2,
      objectives: ["State Gauss's law"],
      prerequisites: [],
      misconceptions: [{ tag: "FLUX_SCALES_WITH_AREA", description: "…", remediation: "em1.electrostatics.gauss-law/why-area" }],
      examLinks: [],
      sources: [meta.source],
      status: "draft",
      lessons: [{ id: "main", title: "Gauss", minutes: 30, blocks: [mcq] }],
      rules: [],
    });
    expect(concept.locked).toBe(false);
    const course = Course.parse({
      id: "em1",
      code: "ELE3001",
      title: "Electromagnetics I",
      examDate: "2026-12-15",
      units: [{ number: 2, title: "Electrostatic Fields" }],
      concepts: [concept],
    });
    expect(course.concepts).toHaveLength(1);
  });
});
