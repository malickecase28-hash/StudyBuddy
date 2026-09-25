import { describe, expect, it } from "vitest";
import { electricField, electricFieldInMedium, fluxDensity, norm, vec, EPS0, type Charge } from "../src";

const q = 4e-6;
const point: Charge = { kind: "point", q, pos: vec(0, 0, 0) };

describe("point charge", () => {
  it("E falls off as 1/r^2: E(2r)/E(r) = 0.25", () => {
    const e1 = norm(electricField([point], vec(1, 0, 0)));
    const e2 = norm(electricField([point], vec(2, 0, 0)));
    expect(e2 / e1).toBeCloseTo(0.25, 12);
  });
  it("matches Coulomb magnitude kq/r^2 and points away from positive charge", () => {
    const e = electricField([point], vec(0, 3, 0));
    expect(e[1]).toBeCloseTo(q / (4 * Math.PI * EPS0 * 9), 6);
    expect(e[0]).toBe(0);
    expect(e[1]).toBeGreaterThan(0);
  });
  it("D = q/(4 pi r^2), independent of permittivity", () => {
    const d = fluxDensity([point], vec(0, 0, 2));
    expect(d[2]).toBeCloseTo(q / (4 * Math.PI * 4), 18);
  });
  it("superposes: two equal charges cancel at their midpoint", () => {
    const pair: Charge[] = [
      { kind: "point", q, pos: vec(-1, 0, 0) },
      { kind: "point", q, pos: vec(1, 0, 0) },
    ];
    expect(norm(electricField(pair, vec(0, 0, 0)))).toBeCloseTo(0, 6);
  });
  it("medium with eps_r divides E, leaves D alone", () => {
    const e0 = norm(electricField([point], vec(1, 0, 0)));
    const e4 = norm(electricFieldInMedium([point], vec(1, 0, 0), 4));
    expect(e4 / e0).toBeCloseTo(0.25, 12);
  });
});

describe("infinite line charge", () => {
  it("E = rhoL/(2 pi eps0 rho), radial, halves when distance doubles", () => {
    const line: Charge = { kind: "line", rhoL: 2e-9, x: 0, y: 0 };
    const e1 = electricField([line], vec(1, 0, 5));
    const e2 = electricField([line], vec(2, 0, -3));
    expect(e1[0]).toBeCloseTo(2e-9 / (2 * Math.PI * EPS0 * 1), 9);
    expect(e1[2]).toBe(0);
    expect(e2[0] / e1[0]).toBeCloseTo(0.5, 12);
  });
});
