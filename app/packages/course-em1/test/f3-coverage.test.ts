import { coverageGaps, type IdeaMeta } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { course, ideaPlates } from "../src";

const mainOf = (id: string) => course.concepts.find((c) => c.id === id)!.lessons.find((l) => l.id === "main")!.blocks.flatMap((b) => (b.type === "plate" ? [b.plateId] : []));
const merged = (conceptId: string, plates: string[]): IdeaMeta => {
  const c = course.concepts.find((k) => k.id === conceptId)!;
  const items = [...new Set(plates.flatMap((p) => ideaPlates[p]!.meta.requires?.items ?? []))];
  return { plateId: conceptId, requires: { objectives: c.objectives.map((_, i) => i), items, misconceptions: c.misconceptions.map((m) => m.tag) }, ideas: plates.flatMap((p) => ideaPlates[p]!.meta.ideas) };
};

describe("F3/F4 concepts", () => {
  it("Unit 1's main lesson is two ideas; vectors' is four", () => {
    expect(mainOf("em1.intro.em-world")).toEqual(["idea-em-world", "idea-units"]);
    expect(mainOf("em1.math.vectors")).toEqual(["idea-vec-basics", "idea-vec-products", "idea-coords", "idea-elements"]);
    expect(mainOf("em1.math.vector-calculus")).toEqual(["idea-gradient", "idea-divergence", "idea-curl"]);
    expect(mainOf("em1.electrostatics.coulomb")).toEqual(["idea-coulomb-law", "idea-superposition"]);
    expect(mainOf("em1.electrostatics.field")).toEqual(["idea-e-point", "idea-e-superposition", "idea-e-continuous"]);
    expect(mainOf("em1.electrostatics.gauss-applications")).toEqual(["idea-charge-density", "idea-patch-flux", "idea-spheres"]);
    expect(mainOf("em1.electrostatics.divergence")).toEqual(["idea-point-form", "idea-div-theorem"]);
    expect(mainOf("em1.electrostatics.potential")).toEqual(["idea-work", "idea-v-point", "idea-grad-v", "idea-energy"]);
    expect(mainOf("em1.electrostatics.current")).toEqual(["idea-ohm", "idea-continuity"]);
    expect(mainOf("em1.electrostatics.dielectrics")).toEqual(["idea-polarization", "idea-bc-tangential", "idea-bc-normal", "idea-refraction", "idea-conductor-bc"]);
    expect(mainOf("em1.electrostatics.capacitance")).toEqual(["idea-parallel-plate", "idea-cap-energy", "idea-coax-sphere"]);
  });
  for (const id of ["em1.intro.em-world", "em1.math.vectors", "em1.math.vector-calculus", "em1.electrostatics.coulomb", "em1.electrostatics.field", "em1.electrostatics.gauss-applications", "em1.electrostatics.divergence", "em1.electrostatics.potential", "em1.electrostatics.current", "em1.electrostatics.dielectrics", "em1.electrostatics.capacitance", "em1.magnetostatics.ampere", "em1.magnetostatics.materials", "em1.magnetostatics.inductance"]) {
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
