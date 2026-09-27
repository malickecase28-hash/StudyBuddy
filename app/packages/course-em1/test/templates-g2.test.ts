import { instantiate } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { templates } from "../src";

describe("G2 templates", () => {
  for (const id of ["charge-line-poly", "flux-patch", "ball-d", "rhov-from-d"]) {
    it(`${id}: 50 seeds, finite, worked, distractors differ`, () => {
      const t = templates.find((x) => x.id === id)!;
      expect(t, id).toBeDefined();
      for (let s = 1; s <= 50; s++) {
        const v = instantiate(t, s);
        expect(Number.isFinite(v.spec.answer.value)).toBe(true);
        expect(v.worked.length).toBeGreaterThan(0);
        for (const d of v.spec.distractors) expect(Math.abs(d.value / v.spec.answer.value - 1) > 1e-6).toBe(true);
      }
    });
  }
  it("charge-line-poly reproduces HW02 2.5(a): a = 12 on 1..5 gives 496 mC", () => {
    expect(templates.find((x) => x.id === "charge-line-poly")!.solve({ a: 12, x1: 1, x2: 5 } as never).answer.value).toBe(496);
  });
  it("ball-d inside and outside", () => {
    const t = templates.find((x) => x.id === "ball-d")!;
    expect(t.solve({ rv: 3, a: 10, r: 5 } as never).answer.value).toBeCloseTo(0.5, 10);
    expect(t.solve({ rv: 3, a: 10, r: 15 } as never).answer.value).toBeCloseTo(0.444444, 5);
  });
});
