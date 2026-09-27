import { instantiate } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { templates } from "../src";

describe("Plan I templates", () => {
  for (const id of ["bnd-tangent", "bnd-angle", "cap-parallel", "cap-energy", "cap-coax"]) {
    it(`${id}: 50 seeds, finite, worked, distractors differ`, () => {
      const t = templates.find((x) => x.id === id)!;
      expect(t, id).toBeDefined();
      for (let seed = 1; seed <= 50; seed++) {
        const v = instantiate(t, seed);
        expect(Number.isFinite(v.spec.answer.value)).toBe(true);
        expect(v.worked.length).toBeGreaterThan(0);
        for (const d of v.spec.distractors) expect(Math.abs(d.value / v.spec.answer.value - 1) > 1e-6, `${id}#${seed}`).toBe(true);
      }
    });
  }
  const t = (id: string) => templates.find((x) => x.id === id)!;
  it("bnd-tangent reproduces Finals 2024-25 Q2(b): D2y = 0.6", () => {
    expect(t("bnd-tangent").solve({ er: 5, dir: 0, Dx: 1, Dy: 3 } as never).answer.value).toBeCloseTo(0.6, 6);
  });
  it("bnd-angle: 60° from εr 2 into free space bends to 40.89°", () => {
    expect(t("bnd-angle").solve({ th1: 60, er: 2, dir: 0 } as never).answer.value).toBeCloseTo(40.89, 2);
  });
  it("cap-parallel: 100 cm², 1 mm, air = 88.54 pF", () => {
    expect(t("cap-parallel").solve({ S: 100, d: 1, er: 1 } as never).answer.value).toBeCloseTo(88.54, 2);
  });
  it("cap-energy: 10 nF at 100 V = 50 µJ", () => {
    expect(t("cap-energy").solve({ C: 10, V: 100 } as never).answer.value).toBeCloseTo(50, 6);
  });
  it("cap-coax: 1 mm and 4 mm in air = 40.13 pF/m", () => {
    expect(t("cap-coax").solve({ a: 1, b: 4, er: 1 } as never).answer.value).toBeCloseTo(40.13, 2);
  });
});
