import { instantiate } from "@forma/engine";
import { coverageGaps, validateIdeas, validatePlate } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { checks, course, ideaPlates, plates, registry, templates } from "../src";

describe("idea lessons", () => {
  const all = Object.values(ideaPlates);
  it("exist and are reachable from a concept lesson", () => {
    expect(all.map((c) => c.plate.id)).toContain("flux-surface");
    for (const c of all) {
      expect(plates[c.plate.id]).toBe(c.plate);
      expect(course.concepts.some((k) => k.lessons.some((l) => l.blocks.some((b) => b.type === "plate" && b.plateId === c.plate.id)))).toBe(true);
    }
  });
  for (const c of all) {
    it(`${c.plate.id}: no validation errors or warnings, asks included`, () => {
      expect(validatePlate(registry, c.plate)).toEqual([]);
      expect(validateIdeas(registry, c)).toEqual([]);
    });
    it(`${c.plate.id}: coverage matrix passes`, () => {
      expect(coverageGaps(c.meta)).toEqual([]);
    });
    it(`${c.plate.id}: depth floor per idea (spec §1)`, () => {
      for (const idea of c.meta.ideas) {
        expect(idea.explain[1] - idea.explain[0] + 1, idea.id).toBeGreaterThanOrEqual(3);
        expect(idea.examples.map((e) => e.level), idea.id).toEqual(["basic", "tutorial", "exam"]);
        expect(idea.asks.length, idea.id).toBeGreaterThanOrEqual(6);
        expect(idea.checks.length, idea.id).toBeGreaterThanOrEqual(4);
        expect(idea.recap.points.length, idea.id).toBeGreaterThan(0);
      }
    });
    it(`${c.plate.id}: template checks agree with their template, and goal checks exist`, () => {
      for (const s of c.plate.steps) {
        const i = s.interaction;
        if (i?.type === "numeric" && i.template) {
          const t = templates.find((x) => x.id === i.template);
          expect(t, i.template).toBeDefined();
          expect(i.answer).toEqual(instantiate(t!, 1).spec.answer);
          expect(instantiate(t!, 1).worked.length).toBeGreaterThan(0);
        }
        if (i && (i.type === "manipulate-goal" || i.type === "place")) expect(checks[i.check], i.check).toBeDefined();
      }
    });
  }
});
