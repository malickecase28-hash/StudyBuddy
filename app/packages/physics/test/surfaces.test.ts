import { describe, expect, it } from "vitest";
import { contains, dot, gaussLegendre, norm, sub, surfacePatches, vec, type SurfaceShape } from "../src";

const area = (shape: SurfaceShape, n: number) => surfacePatches(shape, n).reduce((s, p) => s + norm(p.dS), 0);

describe("gaussLegendre", () => {
  it("weights sum to 2 and integrate x^8 exactly with n=5", () => {
    const { nodes, weights } = gaussLegendre(5);
    expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(2, 14);
    const integral = nodes.reduce((s, x, i) => s + weights[i]! * x ** 8, 0);
    expect(integral).toBeCloseTo(2 / 9, 14);
  });
});

describe("surfacePatches", () => {
  it("sphere area is 4 pi R^2", () => {
    expect(area({ kind: "sphere", center: vec(0, 0, 0), radius: 2 }, 24)).toBeCloseTo(16 * Math.PI, 7);
  });
  it("cube area is 6 a^2", () => {
    expect(area({ kind: "cube", center: vec(1, 1, 1), side: 3 }, 4)).toBeCloseTo(54, 7);
  });
  it("patch normals point outward", () => {
    const shapes: SurfaceShape[] = [
      { kind: "sphere", center: vec(1, 0, 0), radius: 1 },
      { kind: "cube", center: vec(0, 2, 0), side: 2 },
      { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 },
    ];
    for (const s of shapes) {
      for (const p of surfacePatches(s, 8)) expect(dot(sub(p.center, s.center), p.dS)).toBeGreaterThan(0);
    }
  });
  it("contains() distinguishes inside and outside", () => {
    const blob: SurfaceShape = { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 };
    expect(contains(blob, vec(0.1, 0.1, 0.1))).toBe(true);
    expect(contains(blob, vec(2, 0, 0))).toBe(false);
    expect(contains({ kind: "cube", center: vec(0, 0, 0), side: 2 }, vec(0.9, -0.9, 0.9))).toBe(true);
    expect(contains({ kind: "sphere", center: vec(0, 0, 0), radius: 1 }, vec(0.8, 0.8, 0))).toBe(false);
  });
});
