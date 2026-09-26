import { z } from "zod";
import { describe, expect, it } from "vitest";
import { backingValues, defineComponent, PlateDef, Registry, unbackedNumbers, validatePlate } from "../src";

const c = (value: number, unit: string) => ({ value, unit });

describe("unbackedNumbers", () => {
  it("accepts numbers that match a same-unit value at the written precision", () => {
    expect(unbackedNumbers("D = 3 µC/m² over 4 m² gives 12 µC", [c(3, "µC/m^2"), c(4, "m^2"), c(12, "µC")])).toEqual([]);
    expect(unbackedNumbers("about −2.6 µC", [c(-2.598076, "µC")])).toEqual([]);
    expect(unbackedNumbers("a 2 m square", [c(2, "m")])).toEqual([]);
    expect(unbackedNumbers("Ψ = 10.93 µC", [c(10.928203, "µC")])).toEqual([]);
    expect(unbackedNumbers("E = 4494 V/m", [c(4493.8, "V/m")])).toEqual([]);
  });
  it("flags wrong numbers, including ones that only match a value in another unit", () => {
    expect(unbackedNumbers("Ψ = 6 µC, not 10.4 µC", [c(6, "µC")])).toEqual(["10.4 µC"]);
    expect(unbackedNumbers("E = 4600 V/m", [c(4493.8, "V/m")])).toEqual(["4600 V/m"]);
    expect(unbackedNumbers("dΨ = 2 µC", [c(1.5, "µC"), c(2, "m")])).toEqual(["2 µC"]);
    expect(unbackedNumbers("the shadow is 0.7 m²", [c(0.5, "m^2"), c(0.7, "µC")])).toEqual(["0.7 m²"]);
  });
  it("reads Greek μ and the coulomb, and does not misread ranges or bare decimals", () => {
    expect(unbackedNumbers("q = 2 μC", [c(2, "µC")])).toEqual([]);
    expect(unbackedNumbers("a charge of 2 C", [])).toEqual(["2 C"]);
    expect(unbackedNumbers("sizes 2-3 m", [c(3, "m")])).toEqual([]);
    expect(unbackedNumbers("about .5 m", [])).toEqual([]);
  });
  it("reads line-charge units", () => {
    expect(unbackedNumbers("ρL = 2000 nC/m", [c(2000, "nC/m")])).toEqual([]);
    expect(unbackedNumbers("ρL = 3 µC/m", [])).toEqual(["3 µC/m"]);
  });
  it("reads volumes, frequencies and inches as their own units", () => {
    expect(unbackedNumbers("V = 0.0082 m³", [c(0.0082, "m^3")])).toEqual([]);
    expect(unbackedNumbers("V = 0.0082 m³", [c(0.0082, "m")])).toEqual(["0.0082 m³"]);
    expect(unbackedNumbers("Wi-Fi at 2.45 GHz", [c(2.45e9, "Hz")])).toEqual([]);
    expect(unbackedNumbers("a 0.28 inch core", [c(0.007112, "m")])).toEqual([]);
    expect(unbackedNumbers("the 6 in region 1", [])).toEqual([]);
  });
  it("ignores unitless numbers, angles and vector components", () => {
    expect(unbackedNumbers("cos 60° = 0.5, D = 4x̂ + 3ẑ, 3 × 1 × 0.5", [])).toEqual([]);
  });
});

describe("backingValues", () => {
  const Src = defineComponent({ id: "src", params: z.object({ q: z.number(), size: z.number().default(1.5) }), model: (p) => ({ total: p.q * 2, junk: 99 }), handles: [], readouts: { total: "µC" } });
  const reg = new Registry().register(Src);
  it("takes only visible instances' readouts (with units), their numeric params as lengths, and claims", () => {
    const p = PlateDef.parse({
      id: "p", title: "P",
      instances: [{ id: "a", component: "src", params: { q: 2 } }, { id: "b", component: "src", params: { q: 7 } }],
      steps: [{ id: "s1", title: "t", show: ["a"], note: "n", claims: [{ instance: "a", readout: "total", value: 4, unit: "µC" }] }],
    });
    const vals = backingValues(reg, p, 0);
    expect(vals).toContainEqual({ value: 4, unit: "µC" });
    expect(vals).toContainEqual({ value: 1.5, unit: "m" });
    expect(vals.some((v) => v.value === 14 || v.value === 99)).toBe(false); // hidden instance, undeclared model value
  });
});

describe("validatePlate number lint", () => {
  const Src = defineComponent({ id: "src", params: z.object({ q: z.number() }), model: (p) => ({ total: p.q * 2 }), handles: [], readouts: { total: "µC" } });
  const reg = new Registry().register(Src);
  it("warns on a step note number that the plate state does not back", () => {
    const p = PlateDef.parse({
      id: "p", title: "P", instances: [{ id: "a", component: "src", params: { q: 2 } }],
      steps: [{ id: "s1", title: "t", show: ["a"], note: "Doubled it gives 4 µC, not 5 µC." }],
    });
    expect(validatePlate(reg, p).map((i) => i.message)).toEqual([expect.stringMatching(/unbacked number "5 µC"/)]);
  });
});

describe("quotable values and givens", () => {
  it("each point charge is quotable, and a step may declare a target it states", async () => {
    const { emComponents } = await import("../src");
    const reg = new Registry().register(...emComponents);
    const p = PlateDef.parse({
      id: "p", title: "P",
      instances: [{ id: "q", component: "charges", params: { items: [{ id: "a", kind: "point", q: 2, pos: [0, 0, 0] }, { id: "b", kind: "point", q: -1, pos: [1, 0, 0] }] } }],
      steps: [{ id: "s1", title: "t", show: ["q"], note: "Drag the −1 µC charge until the total reads 3 µC.", givens: [{ value: 3, unit: "µC" }] }],
    });
    expect(validatePlate(reg, p)).toEqual([]);
    expect(backingValues(reg, p, 0)).toContainEqual({ value: -1, unit: "µC" });
  });
});
