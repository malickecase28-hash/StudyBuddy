import { describe, expect, it } from "vitest";
import { gaussApplications } from "../src/concepts/gauss-applications";
import { ideaPlates } from "../src/plates";

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
});
