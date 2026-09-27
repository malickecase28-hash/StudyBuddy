import { describe, expect, it } from "vitest";
import { gaussApplications } from "../src/concepts/gauss-applications";
import { ideaPlates } from "../src/plates";
import { divergence } from "../src/concepts/electrostatics";

describe("G2 charge-density lesson", () => {
  it("starts the Gauss-applications concept with charge from a density", () => {
    expect(gaussApplications.objectives).toEqual([
      "Find total charge from ρL, ρS and ρv by integration in all three coordinate systems.",
      "Find the flux through part of a closed surface from its share of the whole.",
      "Use Gauss's law to find D and Q for spherical charge distributions, inside and outside.",
    ]);
    expect(gaussApplications.lessons.map((lesson) => lesson.id)).toContain("main");
    expect(gaussApplications.lessons[0]!.blocks[0]).toMatchObject({ id: "idea-charge-density", type: "plate", plateId: "idea-charge-density" });
    expect(ideaPlates["idea-charge-density"]?.meta.ideas.map((idea) => idea.id)).toEqual(["charge-density"]);
  });
  it("registers the patch-flux and spheres ideas in the Gauss-applications lesson", () => {
    expect(gaussApplications.lessons[0]!.blocks.map((block) => "plateId" in block ? block.plateId : null).filter(Boolean)).toEqual(["idea-charge-density", "idea-patch-flux", "idea-spheres"]);
    expect(ideaPlates["idea-patch-flux"]?.meta.ideas.map((idea) => idea.id)).toEqual(["patch-flux"]);
    expect(ideaPlates["idea-spheres"]?.meta.ideas.map((idea) => idea.id)).toEqual(["spheres"]);
  });
  it("makes point form and the divergence theorem the in-depth main lesson", () => {
    expect(divergence.title).toBe("Point form and the divergence theorem");
    expect(divergence.objectives).toEqual([
      "Use ∇·D = ρv to find the charge density from a given field.",
      "Apply the divergence theorem: net flux out equals the charge inside, computed either way.",
    ]);
    expect(divergence.lessons.map((lesson) => lesson.id)).toEqual(["main", "quick"]);
    expect(divergence.lessons[0]!.blocks.map((block) => "plateId" in block ? block.plateId : null).filter(Boolean)).toEqual(["idea-point-form"]);
  });
});
