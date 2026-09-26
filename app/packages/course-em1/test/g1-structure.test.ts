import { describe, expect, it } from "vitest";
import { coulomb, field } from "../src/concepts/electrostatics";
import { ideaPlates } from "../src/plates";

describe("G1 Coulomb lesson", () => {
  it("starts with the vector-form idea and retains the quick refresher", () => {
    expect(coulomb.objectives).toEqual([
      "Compute the force between two point charges in vector form, with units.",
      "Apply superposition to find the net force from several charges.",
    ]);
    expect(coulomb.lessons.map((lesson) => lesson.id)).toEqual(["main", "quick"]);
    expect(coulomb.lessons[0]!.blocks.map((block) => "plateId" in block ? block.plateId : null).filter(Boolean)).toEqual(["idea-coulomb-law", "idea-superposition"]);
    expect(ideaPlates["idea-coulomb-law"]?.meta.ideas.map((idea) => idea.id)).toEqual(["coulomb-law"]);
    expect(ideaPlates["idea-superposition"]?.meta.ideas.map((idea) => idea.id)).toEqual(["superposition"]);
  });
});

describe("G1 electric-field lesson", () => {
  it("starts with point-field and field-superposition ideas", () => {
    expect(field.objectives).toEqual([
      "Define E and find the field of a point charge, as a vector.",
      "Superpose the fields of several point charges.",
      "Find E from infinite line and sheet charges.",
    ]);
    expect(field.lessons.map((lesson) => lesson.id)).toEqual(["main", "quick"]);
    expect(field.lessons[0]!.blocks.map((block) => "plateId" in block ? block.plateId : null).filter(Boolean)).toEqual(["idea-e-point", "idea-e-superposition"]);
    expect(ideaPlates["idea-e-point"]?.meta.ideas.map((idea) => idea.id)).toEqual(["e-point"]);
    expect(ideaPlates["idea-e-superposition"]?.meta.ideas.map((idea) => idea.id)).toEqual(["e-superposition"]);
  });
});
