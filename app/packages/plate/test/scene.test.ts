import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createEvaluator, defineComponent, isLerpable, lerpValue, Registry } from "../src";

let calls = 0;
const Source = defineComponent({
  id: "source",
  params: z.object({ q: z.number() }),
  model: (p) => ({ total: p.q }),
  handles: ["q"],
  readouts: { total: "µC" },
});
const Doubler = defineComponent({
  id: "doubler",
  params: z.object({ factor: z.number().default(2) }),
  model: (p, ctx) => {
    calls++;
    return { value: (ctx.link("from").model.total as number) * p.factor };
  },
  handles: [],
  readouts: { value: "µC" },
  links: ["from"],
});
const registry = new Registry().register(Source, Doubler);
const instances = [
  { id: "a", component: "source", params: { q: 3 }, visible: true },
  { id: "b", component: "doubler", params: {}, links: { from: "a" } },
];

describe("registry", () => {
  it("rejects duplicates and unknown ids", () => {
    expect(() => new Registry().register(Source, Source)).toThrow(/Duplicate/);
    expect(() => registry.get("nope")).toThrow(/Unknown component/);
  });
});

describe("evaluator", () => {
  it("evaluates linked models with parsed defaults", () => {
    const ev = createEvaluator(registry, instances);
    const f = ev({ a: { params: { q: 3 }, visible: true }, b: { params: {}, visible: false } });
    expect(f.b!.model.value).toBe(6);
    expect(f.b!.params.factor).toBe(2);
    expect(f.b!.visible).toBe(false);
  });
  it("memoises identical inputs and recomputes when an upstream param changes", () => {
    const ev = createEvaluator(registry, instances);
    calls = 0;
    ev({ a: { params: { q: 3 }, visible: true }, b: { params: {}, visible: true } });
    ev({ a: { params: { q: 3 }, visible: true }, b: { params: {}, visible: true } });
    expect(calls).toBe(1);
    ev({ a: { params: { q: 4 }, visible: true }, b: { params: {}, visible: true } });
    expect(calls).toBe(2);
  });
  it("reports bad params and link cycles clearly", () => {
    const ev = createEvaluator(registry, instances);
    expect(() => ev({ a: { params: { q: "x" }, visible: true }, b: { params: {}, visible: true } })).toThrow();
    const cyc = createEvaluator(registry, [
      { id: "x", component: "doubler", params: {}, links: { from: "y" } },
      { id: "y", component: "doubler", params: {}, links: { from: "x" } },
    ]);
    expect(() => cyc({ x: { params: {}, visible: true }, y: { params: {}, visible: true } })).toThrow(/cycle/);
  });
});

describe("lerp", () => {
  it("interpolates numbers, arrays and objects; switches non-numeric at 0.5", () => {
    expect(lerpValue(0, 10, 0.25)).toBe(2.5);
    expect(lerpValue([0, 0, 0], [2, 4, 6], 0.5)).toEqual([1, 2, 3]);
    expect(lerpValue({ r: 1, shape: "sphere" }, { r: 3, shape: "sphere" }, 0.5)).toEqual({ r: 2, shape: "sphere" });
    expect(lerpValue("sphere", "cube", 0.4)).toBe("sphere");
    expect(lerpValue("sphere", "cube", 0.6)).toBe("cube");
    expect(isLerpable([1, 2], [1, 2, 3])).toBe(false);
    expect(isLerpable({ id: "a", x: 1 }, { id: "a", x: 2 })).toBe(true);
  });
});
