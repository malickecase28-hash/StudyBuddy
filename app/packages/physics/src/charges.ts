import { EPS0, K_E } from "./constants";
import { add, norm, scale, sub, type Vec3 } from "./vec";

export type PointCharge = { kind: "point"; q: number; pos: Vec3 };
/** Uniform volume charge, rhoV in C/m^3. */
export type BallCharge = { kind: "ball"; rhoV: number; radius: number; center: Vec3 };
/** Infinite uniform line charge parallel to the z-axis through (x, y). */
export type LineCharge = { kind: "line"; rhoL: number; x: number; y: number };
/** Infinite uniform sheet charge on the plane z = z0. */
export type SheetCharge = { kind: "sheet"; rhoS: number; z0: number };
export type Charge = PointCharge | BallCharge | LineCharge | SheetCharge;

function fieldOf(c: Charge, p: Vec3): Vec3 {
  if (c.kind === "point") {
    const r = sub(p, c.pos);
    const d = norm(r);
    return scale(r, (K_E * c.q) / (d * d * d));
  }
  if (c.kind === "ball") {
    const r = sub(p, c.center);
    const d = norm(r);
    if (d < c.radius) return scale(r, c.rhoV / (3 * EPS0));
    const Q = (c.rhoV * 4 * Math.PI * c.radius ** 3) / 3;
    return scale(r, (K_E * Q) / (d * d * d));
  }
  if (c.kind === "sheet") {
    const side = Math.sign(p[2] - c.z0);
    return [0, 0, (side * c.rhoS) / (2 * EPS0)];
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
