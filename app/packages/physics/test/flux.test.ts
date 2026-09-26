import { describe, expect, it } from "vitest";
import { enclosedCharge, fluxThrough, surfacePatches, vec, type Charge, type SurfaceShape } from "../src";

const q = 4e-6;
const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("Gauss's law numerically", () => {
  it("centred charge through a sphere gives Q (1e-9)", () => {
    const shape: SurfaceShape = { kind: "sphere", center: vec(0, 0, 0), radius: 1 };
    const psi = fluxThrough([{ kind: "point", q, pos: vec(0, 0, 0) }], surfacePatches(shape, 16));
    expect(rel(psi, q)).toBeLessThan(1e-9);
  });

  it("flux does not depend on sphere radius (FLUX_SCALES_WITH_AREA is wrong)", () => {
    const charges: Charge[] = [{ kind: "point", q, pos: vec(0, 0, 0) }];
    const small = fluxThrough(charges, surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 1 }, 16));
    const big = fluxThrough(charges, surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 2 }, 16));
    expect(rel(big, small)).toBeLessThan(1e-9);
  });

  const offCentre: Charge[] = [{ kind: "point", q, pos: vec(0.3, 0.2, -0.1) }];
  const shapes: [string, SurfaceShape, number][] = [
    ["sphere", { kind: "sphere", center: vec(0, 0, 0), radius: 1 }, 64],
    ["cube", { kind: "cube", center: vec(0, 0, 0), side: 2 }, 48],
    ["blob", { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 }, 96],
  ];
  for (const [name, shape, n] of shapes) {
    it(`off-centre charge through ${name} gives Q (1e-6)`, () => {
      expect(rel(fluxThrough(offCentre, surfacePatches(shape, n)), q)).toBeLessThan(1e-6);
    });
    it(`charge outside ${name} gives net flux ~0 (OUTSIDE_CHARGE_CONTRIBUTES is wrong)`, () => {
      const outside: Charge[] = [{ kind: "point", q, pos: vec(2.5, 0.4, 0) }];
      expect(Math.abs(fluxThrough(outside, surfacePatches(shape, n))) / q).toBeLessThan(1e-6);
    });
  }

  it("enclosedCharge sums point charges inside", () => {
    const charges: Charge[] = [
      { kind: "point", q: 1e-6, pos: vec(0, 0, 0) },
      { kind: "point", q: -3e-6, pos: vec(0.5, 0, 0) },
      { kind: "point", q: 7e-6, pos: vec(3, 0, 0) },
    ];
    expect(enclosedCharge(charges, { kind: "sphere", center: vec(0, 0, 0), radius: 1 })).toBeCloseTo(-2e-6, 18);
  });
  it("enclosedCharge rejects line charges in a blob", () => {
    expect(() =>
      enclosedCharge([{ kind: "line", rhoL: 1e-9, x: 0, y: 0 }], { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 }),
    ).toThrow(/blob/);
  });
});
