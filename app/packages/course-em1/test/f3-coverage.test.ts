import { coverageGaps, type IdeaMeta } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { course, ideaPlates } from "../src";

const mainOf = (id: string) => course.concepts.find((c) => c.id === id)!.lessons.find((l) => l.id === "main")!.blocks.flatMap((b) => (b.type === "plate" ? [b.plateId] : []));
const merged = (conceptId: string, plates: string[]): IdeaMeta => {
  const c = course.concepts.find((k) => k.id === conceptId)!;
  const items = [...new Set(plates.flatMap((p) => ideaPlates[p]!.meta.requires?.items ?? []))];
  return { plateId: conceptId, requires: { objectives: c.objectives.map((_, i) => i), items, misconceptions: c.misconceptions.map((m) => m.tag) }, ideas: plates.flatMap((p) => ideaPlates[p]!.meta.ideas) };
};

describe("F3 concepts", () => {
  it("Unit 1's main lesson is two ideas; vectors' is four", () => {
    expect(mainOf("em1.intro.em-world")).toEqual(["idea-em-world", "idea-units"]);
    expect(mainOf("em1.math.vectors")).toEqual(["idea-vec-basics", "idea-vec-products", "idea-coords", "idea-elements"]);
  });
  for (const id of ["em1.intro.em-world", "em1.math.vectors"]) {
    it(`${id}: full coverage, and every idea is load-bearing`, () => {
      const plates = mainOf(id);
      expect(coverageGaps(merged(id, plates))).toEqual([]);
      for (const p of plates) {
        const without = plates.filter((x) => x !== p);
        const req = merged(id, plates).requires!;
        expect(coverageGaps({ ...merged(id, without), requires: req }), `${id} without ${p}`).not.toEqual([]);
      }
    });
  }
  it("the old vectors lesson survives as the quick refresher", () => {
    expect(course.concepts.find((c) => c.id === "em1.math.vectors")!.lessons.map((l) => l.id)).toContain("quick");
  });
});
