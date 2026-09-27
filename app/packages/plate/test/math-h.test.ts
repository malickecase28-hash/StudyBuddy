import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const m = (component: string, params: Record<string, unknown>, extra: unknown[] = [], links?: Record<string, string>) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances: [...extra, { id: "a", component, params, visible: true, ...(links ? { links } : {}) }], steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0)).a!.model as Record<string, number>;
};
const ARC = { kind: "arc", center: [0, 0, 1], radius: 1, from: 0, to: (Math.atan2(0.6, 0.8) * 180) / Math.PI };

describe("line-work", () => {
  it("lecture 2b Example 4: W = −0.96 J along the arc, and along the straight line", () => {
    expect(m("line-work", { field: "ex4-E", q: 2, path: ARC }).W).toBeCloseTo(-0.96, 10);
    expect(m("line-work", { field: "ex4-E", q: 2, path: { kind: "segment", from: [1, 0, 1], to: [0.8, 0.6, 1] } }).W).toBeCloseTo(-0.96, 10);
  });
  it("round a closed loop, W = 0", () => {
    expect(m("line-work", { field: "ex4-E", q: 2, path: { ...ARC, to: 360 } }).W).toBeCloseTo(0, 10);
  });
  it("Vab = V(end) − V(start) = W/Q", () => {
    expect(m("line-work", { field: "ex4-E", q: 2, path: ARC }).Vab).toBeCloseTo(-0.48, 10);
  });
});

describe("conductor", () => {
  it("copper wire, 1 mm radius, 1 km, 10 A", () => {
    const c = m("conductor", { radius: 1e-3, length: 1000, sigma: 5.8e7, current: 10 });
    expect(c.J).toBeCloseTo(3.18310e6, -1);
    expect(c.E).toBeCloseTo(0.0548810, 7);
    expect(c.R).toBeCloseTo(5.48810, 5);
    expect(c.P).toBeCloseTo(548.810, 3);
  });
});

describe("e-probe V and coulomb-force U", () => {
  const q = { id: "q", component: "charges", params: { items: [{ id: "a", kind: "point", q: -4, pos: [2, -1, 3] }, { id: "b", kind: "point", q: 5, pos: [0, 4, -2] }] }, visible: true };
  it("V at (1, 0, 1) is −5864 V", () => {
    expect(m("e-probe", { point: [1, 0, 1] }, [q], { charges: "q" }).V).toBeCloseTo(-5863.59, 1);
  });
  it("the pair's energy is −0.02446 J", () => {
    expect(m("coulomb-force", { on: "b" }, [q], { charges: "q" }).U).toBeCloseTo(-0.024461, 6);
  });
  it("V is absent when a line charge is present (it has no zero at infinity)", () => {
    const line = { id: "q", component: "charges", params: { items: [{ id: "l", kind: "line", rhoL: 1000, x: 0, y: 0 }] }, visible: true };
    expect("V" in m("e-probe", { point: [1, 0, 0] }, [line], { charges: "q" })).toBe(false);
  });
});
