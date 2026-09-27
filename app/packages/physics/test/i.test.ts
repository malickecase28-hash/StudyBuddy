import { describe, expect, it } from "vitest";
import { capCoax, capParallel, capSphere, dielectricBoundary, norm } from "../src";

const rel = (a: number, b: number) => expect(a / b).toBeCloseTo(1, 4);
const relV = (a: readonly number[], b: readonly number[]) => a.forEach((x, i) => (b[i] === 0 ? expect(x).toBeCloseTo(0, 9) : rel(x, b[i]!)));

describe("dielectricBoundary", () => {
  it("Finals 2024-25 Q2(b): D2, E2 and θ2", () => {
    const r = dielectricBoundary({ D1: [1, 3, -7], normal: [1, 0, 0], er1: 5, er2: 1 });
    relV(r.D2, [1, 0.6, -1.4]);
    relV(r.E2, [1.12941e11, 6.77645e10, -1.58117e11]);
    rel(r.theta1, 82.5195);
    rel(r.theta2!, 56.7138);
    r.P2.forEach((v) => expect(Math.abs(v)).toBe(0));
  });
  it("Finals 2023-24 Q2(a): E2 and θ1", () => {
    const r = dielectricBoundary({ D1: [3, -4, 6], normal: [1, 0, 0], er1: 1, er2: 3.5 });
    relV(r.E2, [9.68065e10, -4.51764e11, 6.77645e11]);
    rel(r.theta1, 67.4115);
    rel(r.theta2!, 83.2214);
  });
  it("HW03 3.2: D2, E2 in terms of ε0, the angles from the tangent and the cos ratio", () => {
    const r = dielectricBoundary({ D1: [-10, -20, 14], normal: [-3, 0, 4], er1: 8, er2: 5 });
    relV(r.D1n, [-10.32, 0, 13.76]);
    relV(r.D1t, [0.32, -20, 0.24]);
    relV(r.D2, [-10.12, -12.5, 13.91]);
    relV(r.E2.map((v) => v * 8.8541878128e-12), [-2.024, -2.5, 2.782]);
    rel(90 - r.theta1, 40.6899);
    rel(90 - r.theta2!, 53.987);
    rel(norm(r.E2) / norm(r.E1), 1.2896);
  });
  it("ICT 2 Q2: the split, D2 and E2", () => {
    const r = dielectricBoundary({ D1: [-10, -20, 14], normal: [-6, 8, 0], er1: 21, er2: 7 });
    relV(r.n, [-0.6, 0.8, 0]);
    relV(r.D1n, [6, -8, 0]);
    relV(r.D1t, [-16, -12, 14]);
    relV(r.D2, [0.666667, -12, 4.666667]);
    relV(r.E2, [1.07563e10, -1.9361e11, 7.52939e10]);
    rel(Math.tan((r.theta1 * Math.PI) / 180) / Math.tan((r.theta2! * Math.PI) / 180), 3);
  });
  it("flipping the normal changes nothing when ρs = 0", () => {
    const a = dielectricBoundary({ D1: [-10, -20, 14], normal: [-3, 0, 4], er1: 8, er2: 5 });
    const b = dielectricBoundary({ D1: [-10, -20, 14], normal: [3, 0, -4], er1: 8, er2: 5 });
    relV(b.D2, a.D2);
    rel(b.theta2!, a.theta2!);
  });
  it("free surface charge: D1n − D2n = ρs, with n̂ from region 2 into region 1", () => {
    const r = dielectricBoundary({ D1: [3, 0, 5], normal: [0, 0, 1], er1: 2, er2: 4, rhoS: 2 });
    relV(r.D2, [6, 0, 3]);
    const sheet = dielectricBoundary({ D1: [0, 0, 6e-5], normal: [0, 0, 1], er1: 1, er2: 1, rhoS: 1.2e-4 });
    relV(sheet.D2, [0, 0, -6e-5]);
  });
  it("conductor as region 2: ρs = D1·n̂, and D2 = E2 = 0 exactly", () => {
    const r = dielectricBoundary({ D1: [0, 0, 5e-9], normal: [0, 0, 1], er1: 1, er2: 1, conductor: true });
    rel(r.rhoS, 5e-9);
    rel(r.E1[2], 564.705);
    expect(r.D2).toEqual([0, 0, 0]);
    expect(r.E2).toEqual([0, 0, 0]);
    expect(r.theta2).toBeNull();
    rel(dielectricBoundary({ D1: [0, 0, -5e-9], normal: [0, 0, 1], er1: 1, er2: 1, conductor: true }).rhoS, -5e-9);
  });
  it("a zero normal throws", () => {
    expect(() => dielectricBoundary({ D1: [1, 0, 0], normal: [0, 0, 0], er1: 1, er2: 2 })).toThrow(/normal/);
  });
});

describe("capacitance", () => {
  it("parallel plates: 100 cm², 1 mm, air = 88.54 pF", () => rel(capParallel(0.01, 1e-3), 8.85419e-11));
  it("MST Q4(c): 100 km coax, 0.28 inch core, 0.90 inch insulation, εr 6.78 = 79.50 µF", () => rel(capCoax(0.28 * 0.0254, 0.45 * 0.0254, 1e5, 6.78), 7.94988e-5));
  it("concentric spheres 5 cm and 10 cm in air = 11.13 pF; isolated = 5.563 pF", () => {
    rel(capSphere(0.05, 0.1), 1.11265e-11);
    rel(capSphere(0.05, Infinity), 5.56325e-12);
  });
});
