import { createEvaluator, stateAt, validatePlate } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { checks, classicLesson, course, plates, registry } from "../src";

describe("plates", () => {
  for (const plate of Object.values(plates)) {
    it(`${plate.id}: no validation errors`, () => {
      expect(validatePlate(registry, plate).filter((i) => i.level === "error")).toEqual([]);
    });
    it(`${plate.id}: no word-budget or possible-slide warnings`, () => {
      expect(validatePlate(registry, plate).filter((i) => i.level === "warning")).toEqual([]);
    });
  }

  it("every plate block in the course references an existing plate", () => {
    for (const c of course.concepts)
      for (const l of c.lessons)
        for (const b of l.blocks) if (b.type === "plate") expect(plates[b.plateId], `${c.id}/${l.id}`).toBeDefined();
  });

  it("every plate maps to an existing classic lesson in the concept that uses it", () => {
    for (const c of course.concepts)
      for (const l of c.lessons)
        for (const b of l.blocks)
          if (b.type === "plate") expect(c.lessons.some((x) => x.id === classicLesson[b.plateId]), `${b.plateId} -> ${classicLesson[b.plateId]}`).toBe(true);
  });

  it("every step interaction check exists", () => {
    for (const p of Object.values(plates))
      for (const s of p.steps)
        if (s.interaction && (s.interaction.type === "place" || s.interaction.type === "manipulate-goal")) expect(checks[s.interaction.check], s.interaction.check).toBeDefined();
  });

  it("gauss: the predict-drag reveal really keeps flux constant", () => {
    const g = plates.gauss!;
    const i = g.steps.findIndex((s) => s.interaction?.type === "predict-drag");
    const step = g.steps[i]!;
    if (step.interaction?.type !== "predict-drag") throw new Error("no predict-drag");
    const ev = createEvaluator(registry, g.instances);
    const before = ev(stateAt(g, i));
    const revealed = stateAt(g, i);
    for (const [id, patch] of Object.entries(step.interaction.reveal)) revealed[id]!.params = { ...revealed[id]!.params, ...patch };
    const after = ev(revealed);
    expect(after.surface!.model.flux as number).toBeCloseTo(before.surface!.model.flux as number, 4);
  });

  it("outside-zero passes only once the draggable charge leaves the surface", () => {
    const g = plates.gauss!;
    const i = g.steps.findIndex((s) => s.interaction?.type === "manipulate-goal");
    const ev = createEvaluator(registry, g.instances);
    const start = ev(stateAt(g, i));
    expect(checks["outside-zero"]!(start, start)).toBe(false);
    const moved = stateAt(g, i);
    const items = (moved.q!.params.items as { id: string; pos: number[]; draggable?: boolean }[]).map((it) => (it.draggable ? { ...it, pos: [3, 0, 0] } : it));
    moved.q!.params = { ...moved.q!.params, items };
    expect(checks["outside-zero"]!(ev(moved), start)).toBe(true);
  });
});
