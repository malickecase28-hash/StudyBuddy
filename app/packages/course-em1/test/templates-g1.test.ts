import { instantiate } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { templates } from "../src";

describe("G1 templates", () => {
  for (const id of ["coulomb-mag", "e-point", "e-line"]) {
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
  it("coulomb-mag: 1 µC and 1 µC at 5 cm is 3.595 N", () => {
    expect(templates.find((x) => x.id === "coulomb-mag")!.solve({ q1: 1, q2: 1, d: 5 } as never).answer.value).toBeCloseTo(3.595, 3);
  });
  it("e-line: 2000 nC/m at 100 cm is 35950 V/m", () => {
    expect(templates.find((x) => x.id === "e-line")!.solve({ rl: 2000, rho: 100 } as never).answer.value).toBeCloseTo(35950, 0);
  });
});
