import { describe, expect, it } from "vitest";
import { course, ideaPlates } from "../src";

describe("F4 gradient", () => {
  it("registers an in-depth vector calculus concept and gradient idea", () => {
    const concept = course.concepts.find((c) => c.id === "em1.math.vector-calculus");
    expect(concept?.lessons.find((l) => l.id === "main")?.blocks.map((b) => b.type === "plate" ? b.plateId : "")).toEqual(["idea-gradient"]);
    expect(ideaPlates["idea-gradient"]?.meta.ideas.map((idea) => idea.id)).toEqual(["gradient"]);
  });
});
