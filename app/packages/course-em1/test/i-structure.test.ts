import { describe, expect, it } from "vitest";
import { course, ideaPlates, plates } from "../src";

describe("Plan I dielectrics", () => {
  it("unlocks the first three boundary ideas", () => {
    const concept = course.concepts.find((c) => c.id === "em1.electrostatics.dielectrics")!;
    expect(concept.status).toBe("verified");
    expect(concept.lessons.find((l) => l.id === "main")!.blocks.slice(0, 3).map((b) => b.id)).toEqual(["idea-polarization", "idea-bc-tangential", "idea-bc-normal"]);
    for (const id of ["idea-polarization", "idea-bc-tangential", "idea-bc-normal"]) {
      expect(plates[id], id).toBeDefined();
      expect(ideaPlates[id], id).toBeDefined();
    }
  });
  it("adds the refraction and conductor boundary ideas", () => {
    const concept = course.concepts.find((c) => c.id === "em1.electrostatics.dielectrics")!;
    expect(concept.lessons.find((l) => l.id === "main")!.blocks.map((b) => b.id)).toEqual(["idea-polarization", "idea-bc-tangential", "idea-bc-normal", "idea-refraction", "idea-conductor-bc"]);
    for (const id of ["idea-refraction", "idea-conductor-bc"]) {
      expect(plates[id], id).toBeDefined();
      expect(ideaPlates[id], id).toBeDefined();
    }
  });
});
