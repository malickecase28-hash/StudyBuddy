import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineComponent, instanceTerms, PlateDef, Registry, termTargets, tokenOverlap, validatePlate, wordCount } from "../src";

const Src = defineComponent({ id: "src", params: z.object({ q: z.number() }), model: (p) => ({ total: p.q }), handles: [], readouts: { total: "µC" } });
const registry = new Registry().register(Src);
const mk = (steps: unknown[], extra: Record<string, unknown> = {}) =>
  PlateDef.parse({ id: "p", title: "P", instances: [{ id: "a", component: "src", params: { q: 2 } }], steps, ...extra });

describe("focus links", () => {
  it("maps terms to instances and back", () => {
    const p = mk([{ id: "s1", title: "t", show: ["a"], note: "n" }], { bindings: { "t-charge": ["a"] } });
    expect(termTargets(p, "t-charge")).toEqual(["a"]);
    expect(instanceTerms(p, "a")).toEqual(["t-charge"]);
    expect(termTargets(p, "nope")).toEqual([]);
  });
});

describe("validatePlate", () => {
  it("passes a good plate with a correct claim", () => {
    const p = mk([{ id: "s1", title: "t", show: ["a"], note: "A charge.", claims: [{ instance: "a", readout: "total", value: 2, unit: "µC" }] }]);
    expect(validatePlate(registry, p)).toEqual([]);
  });
  it("errors on wrong claims, wrong units and unknown instances without throwing", () => {
    const p = mk([
      { id: "s1", title: "t", show: ["a"], note: "n", claims: [{ instance: "a", readout: "total", value: 3, unit: "µC" }] },
      { id: "s2", title: "t", show: ["ghost"], note: "n" },
    ]);
    const msgs = validatePlate(registry, p).map((i) => `${i.level}:${i.step}:${i.message}`);
    expect(msgs).toEqual(expect.arrayContaining([expect.stringMatching(/^error:s1:claim a\.total says 3 µC but the model gives 2/), expect.stringMatching(/^error:s2:Unknown instance "ghost"/)]));
    const unit = mk([{ id: "s1", title: "t", show: ["a"], note: "n", claims: [{ instance: "a", readout: "total", value: 2, unit: "C" }] }]);
    expect(validatePlate(registry, unit)[0]!.message).toMatch(/unit/);
  });
  it("errors on unknown components and bindings", () => {
    const p = PlateDef.parse({ id: "p", title: "P", instances: [{ id: "a", component: "nope", params: {} }], bindings: { t: ["zz"] }, steps: [{ id: "s1", title: "t", note: "n" }] });
    const msgs = validatePlate(registry, p).map((i) => i.message);
    expect(msgs).toEqual(expect.arrayContaining([expect.stringMatching(/Unknown component "nope"/), expect.stringMatching(/binding "t" targets unknown instance "zz"/)]));
  });
  it("warns on word budget, possible slides and verbatim narration", () => {
    const long = Array.from({ length: 70 }, () => "word").join(" ");
    const p = mk([
      { id: "s1", title: "t", show: ["a"], note: long },
      { id: "s2", title: "t", note: "Nothing changes here at all.", narration: { transcript: "Nothing changes here at all." } },
    ]);
    const msgs = validatePlate(registry, p).filter((i) => i.level === "warning").map((i) => i.message);
    expect(msgs).toEqual(expect.arrayContaining([expect.stringMatching(/70 words/), expect.stringMatching(/possible slide/), expect.stringMatching(/repeats the margin note/)]));
  });
  it("counts words and overlap", () => {
    expect(wordCount("  Flux counts what is inside. ")).toBe(5);
    expect(tokenOverlap("flux counts charge", "Flux counts only charge inside")).toBe(1);
  });
});
