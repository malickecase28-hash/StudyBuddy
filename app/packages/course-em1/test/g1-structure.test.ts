import { describe, expect, it } from "vitest";
import { coulomb } from "../src/concepts/electrostatics";
import { ideaPlates } from "../src/plates";

describe("G1 Coulomb lesson", () => {
  it("starts with the vector-form idea and retains the quick refresher", () => {
    expect(coulomb.objectives).toEqual([
      "Compute the force between two point charges in vector form, with units.",
      "Apply superposition to find the net force from several charges.",
    ]);
    expect(coulomb.lessons.map((lesson) => lesson.id)).toEqual(["main", "quick"]);
    expect(coulomb.lessons[0]!.blocks[0]).toMatchObject({ type: "plate", plateId: "idea-coulomb-law" });
    expect(ideaPlates["idea-coulomb-law"]?.meta.ideas.map((idea) => idea.id)).toEqual(["coulomb-law"]);
  });
});
