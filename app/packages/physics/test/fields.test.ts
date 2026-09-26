import { describe, expect, it } from "vitest";
import { cartOf, fromCyl, fromSph, nativeOf, scalarFields, vectorFields, type Vec3 } from "../src";

const H = 1e-5;
const pts: Vec3[] = [[1.1, 0.7, 0.9], [-0.6, 1.3, -0.8], [0.4, -1.2, 1.5]];
const shift = (p: Vec3, k: number, d: number): Vec3 => p.map((v, i) => (i === k ? v + d : v)) as unknown as Vec3;

describe("scalar fields: analytic gradient = finite differences (cartesian)", () => {
  for (const s of Object.values(scalarFields)) {
    it(s.id, () => {
      const f = (p: Vec3) => s.f(nativeOf(p, s.system));
      for (const p of pts) {
        const g = cartOf(s.grad(nativeOf(p, s.system)), p, s.system);
        for (let k = 0; k < 3; k++) expect(g[k]).toBeCloseTo((f(shift(p, k, H)) - f(shift(p, k, -H))) / (2 * H), 5);
      }
    });
  }
});

describe("vector fields: analytic divergence and curl = finite differences (cartesian)", () => {
  for (const v of Object.values(vectorFields)) {
    it(v.id, () => {
      const F = (p: Vec3) => cartOf(v.F(nativeOf(p, v.system)), p, v.system);
      const d = (p: Vec3, comp: number, k: number) => (F(shift(p, k, H))[comp] - F(shift(p, k, -H))[comp]) / (2 * H);
      for (const p of pts) {
        expect(v.div(nativeOf(p, v.system))).toBeCloseTo(d(p, 0, 0) + d(p, 1, 1) + d(p, 2, 2), 5);
        const c = cartOf(v.curl(nativeOf(p, v.system)), p, v.system);
        expect(c[0]).toBeCloseTo(d(p, 2, 1) - d(p, 1, 2), 5);
        expect(c[1]).toBeCloseTo(d(p, 0, 2) - d(p, 2, 0), 5);
        expect(c[2]).toBeCloseTo(d(p, 1, 0) - d(p, 0, 1), 5);
      }
    });
  }
});

describe("source answers (solved from the questions)", () => {
  it("tutorial 3.4: ∇Φ at (1, 2, 3) = 5, 4, 3", () => {
    expect(scalarFields["tut-3.4"]!.grad([1, 2, 3])).toEqual([5, 4, 3]);
  });
  it("HW02 2.1(a): ∇V at P(−1, 4, 3) = 132, −30, −42", () => {
    expect(scalarFields["hw-2.1a"]!.grad([-1, 4, 3])).toEqual([132, -30, -42]);
  });
  it("HW02 2.1(b): ∇U at Q(2, 90°, −1) = aρ + 2az", () => {
    const g = scalarFields["hw-2.1b"]!.grad([2, Math.PI / 2, -1]);
    expect(g[0]).toBeCloseTo(1, 12);
    expect(g[1]).toBeCloseTo(0, 12);
    expect(g[2]).toBeCloseTo(2, 12);
  });
  it("HW02 2.1(c): ∇W at R(1, π/6, π/2) = −4 aφ (the 1/(r sin θ) factor matters)", () => {
    const g = scalarFields["hw-2.1c"]!.grad([1, Math.PI / 6, Math.PI / 2]);
    expect(g[0]).toBeCloseTo(0, 12);
    expect(g[1]).toBeCloseTo(0, 12);
    expect(g[2]).toBeCloseTo(-4, 12);
  });
  it("MST Q5(a): −∇V at (2, π, 3) = −108 aρ − 103 az", () => {
    const g = scalarFields["mst-5a"]!.grad([2, Math.PI, 3]);
    expect(-g[0]).toBeCloseTo(-108, 10);
    expect(-g[1]).toBeCloseTo(0, 10);
    expect(-g[2]).toBeCloseTo(-103, 10);
  });
  it("Finals 24-25 Q1(c): ∇V at (2, −2, 1) = −10.9116, −3.32917, 20 (kV/m)", () => {
    const g = scalarFields["f2425-1c"]!.grad([2, -2, 1]);
    expect(g[0]).toBeCloseTo(-10.9116, 4);
    expect(g[1]).toBeCloseTo(-3.32917, 5);
    expect(g[2]).toBe(20);
  });
  it("tutorial 3.6: divergences 4, −1, 2.598 at their points", () => {
    expect(vectorFields["tut-3.6a"]!.div([1, -2, 3])).toBe(4);
    expect(vectorFields["tut-3.6b"]!.div([5, Math.PI / 2, 1])).toBeCloseTo(-1, 12);
    expect(vectorFields["tut-3.6c"]!.div([1, Math.PI / 6, Math.PI / 3])).toBeCloseTo(2.598076, 6);
  });
  it("tutorial 3.8: curls at their points", () => {
    expect(vectorFields["tut-3.6a"]!.curl([1, -2, 3])).toEqual([1, -2, -11]);
    const b = vectorFields["tut-3.6b"]!.curl([5, Math.PI / 2, 1]);
    expect(b[0]).toBeCloseTo(0, 12);
    expect(b[1]).toBeCloseTo(5, 12);
    expect(b[2]).toBeCloseTo(0, 12);
    const c = vectorFields["tut-3.6c"]!.curl([1, Math.PI / 6, Math.PI / 3]);
    expect(c[0]).toBeCloseTo(1.732051, 6);
    expect(c[1]).toBeCloseTo(-4.5, 12);
    expect(c[2]).toBeCloseTo(0.5, 12);
  });
  it("HW02 2.2: divergences", () => {
    expect(vectorFields["hw-2.2a"]!.div([2, 1, 5])).toBe(1); // 3y − x
    expect(vectorFields["hw-2.2b"]!.div([2, Math.PI / 4, 3])).toBeCloseTo(2 * 9 + 1 + 2 * 2 * 0.5, 12); // 2z² + sin2φ + 2ρ sin²φ
    expect(vectorFields["hw-2.2c"]!.div([4, 1, 2])).toBe(3);
  });
  it("round-trips native coordinates", () => {
    expect(nativeOf(fromCyl(2, 1, -1), "cyl")[1]).toBeCloseTo(1, 12);
    expect(nativeOf(fromSph(3, 0.8, 2), "sph")[1]).toBeCloseTo(0.8, 12);
  });
});
