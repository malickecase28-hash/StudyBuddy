import { describe, expect, it } from "vitest";
import { classicLesson, course, ideaPlates } from "../src";

describe("F3 vectors concept structure", () => {
  it("makes the in-depth idea lesson main and keeps the classic refresher as quick", () => {
    const concept = course.concepts.find((c) => c.id === "em1.math.vectors")!;
    expect(concept.title).toBe("Vectors and coordinate systems");
    expect(concept.lessons.map((lesson) => lesson.id)).toEqual(["main", "quick"]);
    expect(concept.lessons[0]!.blocks.map((block) => block.id)).toEqual(["idea-vec-basics", "idea-vec-products"]);
    expect(concept.lessons[1]!.title).toBe("Quick refresher: the dot product");
    expect(ideaPlates["idea-vec-basics"]).toBeDefined();
    expect(classicLesson["toolkit-preview"]).toBeUndefined();
  });

  it("registers the dot and cross products idea plate", () => {
    const concept = course.concepts.find((c) => c.id === "em1.math.vectors")!;
    expect(concept.lessons[0]!.blocks.map((block) => block.id)).toContain("idea-vec-products");
    expect(ideaPlates["idea-vec-products"]).toBeDefined();
  });
});
