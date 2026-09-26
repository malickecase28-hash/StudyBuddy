import { instantiate } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { templates } from "../src";

describe("F4 templates", () => {
  for (const id of ["grad-comp", "grad-cyl-phi", "div-cart", "curl-z"]) {
    it(`${id}: 60 seeds, finite, worked, no distractor equals the answer`, () => {
      const t = templates.find((x) => x.id === id)!;
      expect(t, id).toBeDefined();
      for (let seed = 1; seed <= 60; seed++) {
        const v = instantiate(t, seed);
        expect(Number.isFinite(v.spec.answer.value)).toBe(true);
        expect(v.worked.length).toBeGreaterThan(0);
        for (const d of v.spec.distractors) expect(d.value !== v.spec.answer.value, `${id}#${seed}`).toBe(true);
      }
    });
  }
  it("grad-comp reproduces HW02 2.1(a): a = 10, b = 2, y = 4 gives 132", () => {
    expect(templates.find((x) => x.id === "grad-comp")!.solve({ a: 10, b: 2, y: 4 } as never).answer.value).toBe(132);
  });
  it("grad-cyl-phi divides by ρ: c = 2, ρ = 2, φ = 0° gives 2, and the distractor is 4", () => {
    const s = templates.find((x) => x.id === "grad-cyl-phi")!.solve({ c: 2, rho: 2, k: 0 } as never);
    expect(s.answer.value).toBe(2);
    expect(s.distractors![0]!.value).toBe(4);
  });
});
