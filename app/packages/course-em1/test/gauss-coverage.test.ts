import { coverageGaps, type IdeaMeta } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { course, ideaPlates } from "../src";

const G = "em1.electrostatics.gauss-law";
const concept = course.concepts.find((c) => c.id === G)!;
const mainPlates = concept.lessons.find((l) => l.id === "main")!.blocks.flatMap((b) => (b.type === "plate" ? [b.plateId] : []));
const REQUIRES = {
  objectives: [0, 1, 2, 3],
  items: ["tutorial:q06", "tutorial:q08", "tutorial:q09a", "past:f2425-q2a", "past:f2324-q2b-i"],
  misconceptions: concept.misconceptions.map((m) => m.tag),
};
const merged = (ids: string[]): IdeaMeta => ({ plateId: "gauss-law", requires: REQUIRES, ideas: ids.flatMap((id) => ideaPlates[id]!.meta.ideas) });

describe("Gauss's law, concept-wide", () => {
  it("the main lesson is the five ideas, in order", () => {
    expect(mainPlates).toEqual(["idea-faraday", "flux-surface", "idea-closed", "idea-gauss-law", "idea-symmetry"]);
  });
  it("covers every objective, mapped question and misconception", () => {
    expect(coverageGaps(merged(mainPlates))).toEqual([]);
  });
  it("names the gap when an idea is missing", () => {
    expect(coverageGaps(merged(mainPlates.filter((p) => p !== "idea-symmetry")))).toContain("objective 3: no idea teaches it");
  });
  it("keeps the short tour for review", () => {
    expect(concept.lessons.find((l) => l.id === "quick")!.blocks.map((b) => b.id)).toEqual(["faraday", "gauss"]);
  });
});
