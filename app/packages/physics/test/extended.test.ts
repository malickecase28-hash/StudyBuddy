import { describe, expect, it } from "vitest";
import {
  EPS0, K_E, electricField, enclosedCharge, fluxThrough, potential, surfaceArea, surfacePatches, vec, type Charge, type SurfaceShape,
} from "../src";

const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("sheet charge", () => {
  it("E = rhoS/(2 eps0), pointing away on both sides", () => {
    const s: Charge = { kind: "sheet", rhoS: 2e-6, z0: 0.5 };
    expect(electricField([s], vec(0, 0, 2))[2]).toBeCloseTo(2e-6 / (2 * EPS0), 3);
    expect(electricField([s], vec(0, 0, -1))[2]).toBeCloseTo(-2e-6 / (2 * EPS0), 3);
  });
});

describe("cylinder surface", () => {
  const cyl: SurfaceShape = { kind: "cylinder", center: vec(0, 0, 0), radius: 0.5, height: 2 };
  it("area = 2 pi R h + 2 pi R^2", () => {
    expect(surfaceArea(cyl, 24)).toBeCloseTo(2 * Math.PI * 0.5 * 2 + 2 * Math.PI * 0.25, 6);
  });
  it("coaxial line charge: flux = rhoL * h", () => {
    const line: Charge[] = [{ kind: "line", rhoL: 3e-9, x: 0, y: 0 }];
    expect(rel(fluxThrough(line, surfacePatches(cyl, 32)), 3e-9 * 2)).toBeLessThan(1e-6);
    expect(enclosedCharge(line, cyl)).toBeCloseTo(6e-9, 18);
  });
  it("pillbox across a sheet: flux = rhoS * pi R^2", () => {
    const sheet: Charge[] = [{ kind: "sheet", rhoS: 1e-6, z0: 0.2 }];
    const pill: SurfaceShape = { kind: "cylinder", center: vec(0, 0, 0), radius: 0.4, height: 1 };
    expect(rel(fluxThrough(sheet, surfacePatches(pill, 24)), 1e-6 * Math.PI * 0.16)).toBeLessThan(1e-6);
    expect(enclosedCharge(sheet, pill)).toBeCloseTo(1e-6 * Math.PI * 0.16, 15);
  });
});

describe("enclosed charge for line and sheet in other shapes", () => {
  it("line through a sphere encloses rhoL x chord", () => {
    const line: Charge[] = [{ kind: "line", rhoL: 1e-9, x: 0.3, y: 0 }];
    const sph: SurfaceShape = { kind: "sphere", center: vec(0, 0, 0), radius: 1 };
    const chord = 2 * Math.sqrt(1 - 0.09);
    expect(enclosedCharge(line, sph)).toBeCloseTo(1e-9 * chord, 18);
    // The line pierces the surface, where D is singular: quadrature converges only O(1/n), so this is a loose cross-check.
    expect(rel(fluxThrough(line, surfacePatches(sph, 64)), 1e-9 * chord)).toBeLessThan(1e-2);
  });
  it("sheet through a cube encloses rhoS x side^2; blob is rejected", () => {
    const sheet: Charge[] = [{ kind: "sheet", rhoS: 2e-6, z0: 0.1 }];
    expect(enclosedCharge(sheet, { kind: "cube", center: vec(0, 0, 0), side: 2 })).toBeCloseTo(8e-6, 15);
    expect(() => enclosedCharge(sheet, { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 })).toThrow(/blob/);
  });
});

describe("potential", () => {
  it("V = kq/r and superposes; rejects line charges", () => {
    const cs: Charge[] = [{ kind: "point", q: 2e-9, pos: vec(0, 0, 0) }, { kind: "point", q: -1e-9, pos: vec(2, 0, 0) }];
    expect(potential(cs, vec(1, 0, 0))).toBeCloseTo(K_E * 2e-9 - K_E * 1e-9, 9);
    expect(() => potential([{ kind: "line", rhoL: 1, x: 0, y: 0 }], vec(1, 0, 0))).toThrow(/reference/);
  });
});
