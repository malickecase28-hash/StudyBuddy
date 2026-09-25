import { EPS0, K_E } from "./constants";
import { add, norm, scale, sub, type Vec3 } from "./vec";

export type PointCharge = { kind: "point"; q: number; pos: Vec3 };
/** Infinite uniform line charge parallel to the z-axis through (x, y). */
export type LineCharge = { kind: "line"; rhoL: number; x: number; y: number };
export type Charge = PointCharge | LineCharge;

function fieldOf(c: Charge, p: Vec3): Vec3 {
  if (c.kind === "point") {
    const r = sub(p, c.pos);
    const d = norm(r);
    return scale(r, (K_E * c.q) / (d * d * d));
  }
  const rho: Vec3 = [p[0] - c.x, p[1] - c.y, 0];
  const d = norm(rho);
  return scale(rho, c.rhoL / (2 * Math.PI * EPS0 * d * d));
}

/** Free-space electric field intensity E (V/m) by superposition. */
export function electricField(charges: readonly Charge[], p: Vec3): Vec3 {
  return charges.reduce<Vec3>((acc, c) => add(acc, fieldOf(c, p)), [0, 0, 0]);
}

/** Electric flux density D = ε₀E (C/m²); depends only on free charge. */
export function fluxDensity(charges: readonly Charge[], p: Vec3): Vec3 {
  return scale(electricField(charges, p), EPS0);
}

/** E inside a homogeneous linear dielectric of relative permittivity epsR. */
export function electricFieldInMedium(charges: readonly Charge[], p: Vec3, epsR: number): Vec3 {
  return scale(electricField(charges, p), 1 / epsR);
}
