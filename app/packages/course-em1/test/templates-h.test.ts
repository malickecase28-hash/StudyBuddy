import { instantiate } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { templates } from "../src";

describe("H templates", () => {
  for (const id of ["v-point", "work-move", "current-density", "ohm-wire", "continuity-rate"]) {
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
  it("v-point: 2 nC at 100 cm is 17.98 V", () => {
    expect(templates.find((x) => x.id === "v-point")!.solve({ q: 2, r: 100 } as never).answer.value).toBeCloseTo(17.98, 2);
  });
  it("current-density reproduces Finals 24-25 Q4(a)(ii): 50 A in 8 mm radius", () => {
    expect(templates.find((x) => x.id === "current-density")!.solve({ I: 50, r: 8 } as never).answer.value).toBeCloseTo(248680, -1);
  });
});
