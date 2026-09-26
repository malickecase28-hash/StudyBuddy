import { z } from "zod";
import { describe, expect, it } from "vitest";
import { defineComponent, numbersOf, PlateDef, Registry, unbackedNumbers, validatePlate } from "../src";

describe("unbackedNumbers", () => {
  it("accepts numbers that match a candidate at the written precision", () => {
    expect(unbackedNumbers("D = 3 µC/m² over 4 m² gives 12 µC", [3, 4, 12])).toEqual([]);
    expect(unbackedNumbers("about −2.6 µC", [-2.598076])).toEqual([]);
    expect(unbackedNumbers("a 2 m square", [2])).toEqual([]);
    expect(unbackedNumbers("Ψ = 10.93 µC", [10.928203])).toEqual([]);
  });
  it("flags a number with a unit that nothing on the plate backs", () => {
    expect(unbackedNumbers("Ψ = 6 µC, not 10.4 µC", [6])).toEqual(["10.4 µC"]);
    expect(unbackedNumbers("E = 4494 V/m", [4493.8])).toEqual([]);
    expect(unbackedNumbers("E = 4600 V/m", [4493.8])).toEqual(["4600 V/m"]);
  });
  it("ignores unitless numbers, angles and vector components", () => {
    expect(unbackedNumbers("cos 60° = 0.5, D = 4x̂ + 3ẑ, 3 × 1 × 0.5", [])).toEqual([]);
  });
  it("collects numbers deep inside params and models", () => {
    expect(numbersOf({ a: 1, b: [2, { c: 3 }], d: "4", e: Number.NaN }).sort()).toEqual([1, 2, 3]);
  });
});

describe("validatePlate number lint", () => {
  const Src = defineComponent({ id: "src", params: z.object({ q: z.number() }), model: (p) => ({ total: p.q * 2 }), handles: [], readouts: { total: "µC" } });
  const reg = new Registry().register(Src);
  it("warns on a step note number that the plate state does not back", () => {
    const p = PlateDef.parse({
      id: "p", title: "P", instances: [{ id: "a", component: "src", params: { q: 2 } }],
      steps: [{ id: "s1", title: "t", show: ["a"], note: "q = 2 µC, doubled gives 4 µC, not 5 µC." }],
    });
    expect(validatePlate(reg, p).map((i) => i.message)).toEqual([expect.stringMatching(/unbacked number "5 µC"/)]);
  });
});
