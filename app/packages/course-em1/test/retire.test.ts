import { describe, expect, it } from "vitest";
import { course, questionBank, retiredConcepts } from "../src";

describe("flux-density is retired", () => {
  it("is gone from the course, and nothing points at it", () => {
    expect(course.concepts.some((c) => c.id === "em1.electrostatics.flux-density")).toBe(false);
    for (const c of course.concepts) for (const p of c.prerequisites) expect(p.conceptId).not.toBe("em1.electrostatics.flux-density");
    for (const q of questionBank) for (const k of q.concepts) expect(k.conceptId).not.toBe("em1.electrostatics.flux-density");
  });
  it("its blocks live on as Gauss's law, lesson flux-density", () => {
    const g = course.concepts.find((c) => c.id === "em1.electrostatics.gauss-law")!;
    expect(g.lessons.find((l) => l.id === "flux-density")!.blocks.map((b) => b.id)).toEqual(["psi", "faraday-lab", "q7a", "medium"]);
  });
  it("is declared retired, with its successor", () => {
    expect(retiredConcepts).toEqual([{ from: "em1.electrostatics.flux-density", to: "em1.electrostatics.gauss-law", lessonId: "flux-density" }]);
  });
});
