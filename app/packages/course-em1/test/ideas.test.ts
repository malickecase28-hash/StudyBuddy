import { instantiate } from "@forma/engine";
import { coverageGaps, validateIdeas, validatePlate } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { checks, course, foundations, ideaPlates, plates, registry, templates } from "../src";

describe("idea lessons", () => {
  const all = Object.values(ideaPlates);
  it("exist and are reachable from a concept lesson", () => {
    expect(all.map((c) => c.plate.id)).toContain("flux-surface");
    for (const c of all) {
      expect(plates[c.plate.id]).toBe(c.plate);
      expect([course, foundations].some((k) => k.concepts.some((x) => x.lessons.some((l) => l.blocks.some((b) => b.type === "plate" && b.plateId === c.plate.id))))).toBe(true);
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

it("the 'curved' ask shows the charge and its tiled sphere, not the uniform field and patch", async () => {
  const { askState } = await import("@forma/plate");
  const c = ideaPlates["flux-surface"]!;
  const idea = c.meta.ideas[0]!;
  const s = askState(c.plate, idea, idea.asks.find((a) => a.id === "curved")!);
  expect([s.q!.visible, s.tiles!.visible, s.field!.visible, s.patch!.visible]).toEqual([true, true, false, false]);
});

it("potential concept exposes work and point-potential ideas through the registered plates", () => {
  const concept = course.concepts.find((c) => c.id === "em1.electrostatics.potential")!;
  expect(concept.locked).not.toBe(true);
  expect(concept.lessons.find((l) => l.id === "main")!.blocks.filter((b) => b.type === "plate").map((b) => b.plateId)).toEqual(["idea-work", "idea-v-point", "idea-grad-v", "idea-energy"]);
  expect(plates["idea-work"]).toBeDefined();
  expect(plates["idea-v-point"]).toBeDefined();
});

it("potential concept includes field-from-potential and energy ideas", () => {
  const concept = course.concepts.find((c) => c.id === "em1.electrostatics.potential")!;
  expect(concept.lessons.find((l) => l.id === "main")!.blocks.filter((b) => b.type === "plate").map((b) => b.plateId)).toEqual(["idea-work", "idea-v-point", "idea-grad-v", "idea-energy"]);
  expect(plates["idea-grad-v"]).toBeDefined();
  expect(plates["idea-energy"]).toBeDefined();
});

it("current concept exposes current density and continuity ideas through registered plates", () => {
  const concept = course.concepts.find((c) => c.id === "em1.electrostatics.current")!;
  expect(concept.locked).not.toBe(true);
  expect(concept.lessons.find((l) => l.id === "main")!.blocks.filter((b) => b.type === "plate").map((b) => b.plateId)).toEqual(["idea-ohm", "idea-continuity"]);
  expect(plates["idea-ohm"]).toBeDefined();
  expect(plates["idea-continuity"]).toBeDefined();
});
