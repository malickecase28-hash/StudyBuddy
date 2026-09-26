import { z } from "zod";
import { describe, expect, it } from "vitest";
import { defineComponent, PlateDef, Registry, validatePlate } from "../src";

const Src = defineComponent({ id: "src", params: z.object({ q: z.number() }), model: (p) => ({ total: p.q }), handles: [], readouts: { total: "µC" } });
const reg = new Registry().register(Src);
const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const mk = (steps: unknown[]) => PlateDef.parse({ id: "p", title: "P", instances: [{ id: "a", component: "src", params: { q: 2 } }], steps });

describe("step kinds", () => {
  it("defaults to explain and keeps idea and latex", () => {
    const p = mk([{ id: "s1", title: "t", show: ["a"], note: "n", idea: "i1", latex: "x" }]);
    expect(p.steps[0]).toMatchObject({ kind: "explain", idea: "i1", latex: "x" });
  });
  it("allows 180 words per step and warns above", () => {
    const ok = validatePlate(reg, mk([{ id: "s1", title: "t", show: ["a"], note: words(170) }]));
    expect(ok.filter((i) => /words/.test(i.message))).toEqual([]);
    const long = validatePlate(reg, mk([{ id: "s1", title: "t", show: ["a"], note: words(190) }]));
    expect(long.map((i) => i.message)).toContainEqual(expect.stringMatching(/190 words \(budget 180\)/));
  });
  it("never calls a recap step a possible slide", () => {
    const p = mk([
      { id: "s1", title: "t", show: ["a"], note: "n" },
      { id: "s2", title: "t", kind: "recap", note: "Summary." },
    ]);
    expect(validatePlate(reg, p).filter((i) => /possible slide/.test(i.message))).toEqual([]);
  });
});
