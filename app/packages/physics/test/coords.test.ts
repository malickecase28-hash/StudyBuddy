import { describe, expect, it } from "vitest";
import { componentsIn, fromCyl, fromSph, toCyl, toSph, unitVectors } from "../src";

const deg = (r: number) => (r * 180) / Math.PI;

describe("coordinate systems", () => {
  it("tutorial P(1, 3, 5) in cylindrical and spherical", () => {
    const c = toCyl([1, 3, 5]);
    expect(c.rho).toBeCloseTo(3.16228, 5);
    expect(deg(c.phi)).toBeCloseTo(71.56505, 4);
    expect(c.z).toBe(5);
    const s = toSph([1, 3, 5]);
    expect(s.r).toBeCloseTo(5.91608, 5);
    expect(deg(s.theta)).toBeCloseTo(32.31153, 4);
    expect(deg(s.phi)).toBeCloseTo(71.56505, 4);
  });
  it("puts φ in the right quadrant", () => {
    expect(deg(toCyl([-2, 2, 1]).phi)).toBeCloseTo(135, 10);
    expect(deg(toCyl([1, -1, 0]).phi)).toBeCloseTo(315, 10);
    expect(deg(toSph([-2, 2, 1]).theta)).toBeCloseTo(70.52878, 4);
  });
  it("converts back", () => {
    const a = fromCyl(2, (120 * Math.PI) / 180, -1);
    expect(a[0]).toBeCloseTo(-1, 12);
    expect(a[1]).toBeCloseTo(1.7320508, 7);
    expect(a[2]).toBe(-1);
    const b = fromSph(4, Math.PI / 3, Math.PI / 6);
    expect(b[0]).toBeCloseTo(3, 12);
    expect(b[1]).toBeCloseTo(1.7320508, 7);
    expect(b[2]).toBeCloseTo(2, 12);
  });
  it("unit vectors are orthonormal and right-handed", () => {
    for (const sys of ["cart", "cyl", "sph"] as const) {
      const [u, v, w] = unitVectors([1, 3, 5], sys);
      const d = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
      expect(d(u, u)).toBeCloseTo(1, 12);
      expect(d(u, v)).toBeCloseTo(0, 12);
      expect(d(v, w)).toBeCloseTo(0, 12);
      const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      expect(d(cr, w)).toBeCloseTo(1, 12);
    }
  });
  it("expresses a cartesian vector in cylindrical components at a point", () => {
    // Q = y ax + x ay at (1, 1, 0): Q = aρ·(2 sinφ cosφ) + aφ·(cos²φ − sin²φ) → (1, 0, 0) at φ = 45°
    const q = componentsIn([1, 1, 0], [1, 1, 0], "cyl");
    expect(q[0]).toBeCloseTo(Math.SQRT2, 12);
    expect(q[1]).toBeCloseTo(0, 12);
    expect(q[2]).toBeCloseTo(0, 12);
  });
});
