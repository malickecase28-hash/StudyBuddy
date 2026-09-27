import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const m = (component: string, params: Record<string, unknown>) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances: [{ id: "a", component, params, visible: true }], steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0)).a!.model as Record<string, number>;
};
const ICT = { D1: [-10, -20, 14], normal: [-6, 8, 0], er1: 21, er2: 7 };

describe("boundary", () => {
  it("shows only the readout groups asked for", () => {
    const r = m("boundary", { ...ICT, show: ["n", "split"] });
    expect(r.nx).toBeCloseTo(-0.6, 12);
    expect(r.D1tx).toBeCloseTo(-16, 12);
    expect("D2x" in r).toBe(false);
    expect("th1" in r).toBe(false);
  });
  it("the default groups are split, D and angles", () => {
    const r = m("boundary", ICT);
    expect(r.D2x).toBeCloseTo(0.666667, 5);
    expect(r.th2).toBeCloseTo(39.1377, 3);
    expect("E2x" in r).toBe(false);
  });
  it("measure: tangent reports 90° − θ", () => {
    const r = m("boundary", { D1: [-10, -20, 14], normal: [-3, 0, 4], er1: 8, er2: 5, measure: "tangent", show: ["angles", "mag"] });
    expect(r.th1).toBeCloseTo(40.6899, 3);
    expect(r.th2).toBeCloseTo(53.987, 3);
    expect(r.E2mag! / r.E1mag!).toBeCloseTo(1.2896, 4);
  });
  it("free space has P exactly 0; a conductor has no th2 and exact zeros", () => {
    expect(m("boundary", { D1: [1, 3, -7], normal: [1, 0, 0], er1: 5, er2: 1, show: ["P"] }).P2y).toBe(0);
    const c = m("boundary", { D1: [0, 0, 5e-9], normal: [0, 0, 1], er1: 1, er2: 1, conductor: true, show: ["rhoS", "E", "angles"] });
    expect(c.rhoS).toBeCloseTo(5e-9, 20);
    expect(c.E2z).toBe(0);
    expect("th2" in c).toBe(false);
  });
});

describe("capacitor", () => {
  it("parallel plates: C, Q, W, E and the energy density", () => {
    const c = m("capacitor", { kind: "parallel", area: 0.01, d: 1e-3, V: 100 });
    expect(c.C).toBeCloseTo(8.85419e-11, 15);
    expect(c.Q).toBeCloseTo(8.85419e-9, 13);
    expect(c.W).toBeCloseTo(4.42709e-7, 11);
    expect(c.Eg).toBeCloseTo(1e5, 6);
    expect(c.wE).toBeCloseTo(0.0442709, 6);
    expect(c.S).toBe(0.01);
  });
  it("MST Q5(b): εr 33.464 at 15 V stores 50 µJ with w_E = 5.208 J/m³", () => {
    const c = m("capacitor", { kind: "parallel", area: 0.12, d: 8e-5, er: 33.46397, V: 15 });
    expect(c.C).toBeCloseTo(4.44444e-7, 11);
    expect(c.W).toBeCloseTo(5e-5, 9);
    expect(c.wE).toBeCloseTo(5.20833, 4);
  });
  it("coax: 100.4 pF per metre, largest E at the core; MST Q4(c) quotes its diameters", () => {
    const c = m("capacitor", { kind: "coax", a: 1e-3, b: 3.5e-3, length: 1, er: 2.26, V: 100 });
    expect(c.C).toBeCloseTo(1.00362e-10, 14);
    expect(c.Eg).toBeCloseTo(79823.6, 0);
    const mst = m("capacitor", { kind: "coax", a: 0.007112, b: 0.01143, length: 1e5, er: 6.78 });
    expect(mst.C).toBeCloseTo(7.94988e-5, 9);
    expect(mst.outerD).toBeCloseTo(0.02286, 10);
  });
  it("a sphere with no b is isolated", () => {
    expect(m("capacitor", { kind: "sphere", a: 0.05 }).C).toBeCloseTo(5.56325e-12, 16);
  });
  it("bad parameters throw clear errors", () => {
    expect(() => m("capacitor", { kind: "coax", a: 2e-3, b: 1e-3, length: 1 })).toThrow(/a < b/);
    expect(() => m("capacitor", { kind: "parallel", area: 0.01 })).toThrow(/area and d/);
  });
});
