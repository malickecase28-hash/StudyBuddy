import type { Charge } from "./charges";
import { EPS0, K_E } from "./constants";
import { norm, sub, type Vec3 } from "./vec";

/** Electric potential (V) with V(∞) = 0. Only point charges have a reference-free potential. */
export function potential(charges: readonly Charge[], p: Vec3): number {
  return charges.reduce((s, c) => {
    if (c.kind === "ball") {
      const d = norm(sub(p, c.center));
      if (d >= c.radius) return s + (K_E * (c.rhoV * 4 * Math.PI * c.radius ** 3)) / 3 / d;
      return s + (c.rhoV * (3 * c.radius ** 2 - d * d)) / (6 * EPS0);
    }
    if (c.kind !== "point") throw new Error("potential: line and sheet potentials are reference-dependent");
    return s + (K_E * c.q) / norm(sub(p, c.pos));
  }, 0);
}
