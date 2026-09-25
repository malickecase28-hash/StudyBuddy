import { fluxDensity, type Charge } from "./charges";
import { contains, type Patch, type SurfaceShape } from "./surfaces";
import { dot } from "./vec";

export function patchContributions(charges: readonly Charge[], patches: readonly Patch[]): number[] {
  return patches.map((p) => dot(fluxDensity(charges, p.center), p.dS));
}

/** Ψ = ∮ D · dS over the patches, in coulombs. */
export function fluxThrough(charges: readonly Charge[], patches: readonly Patch[]): number {
  return patchContributions(charges, patches).reduce((s, x) => s + x, 0);
}

/** Total point charge strictly inside the closed surface. */
export function enclosedCharge(charges: readonly Charge[], shape: SurfaceShape): number {
  return charges.reduce((s, c) => {
    if (c.kind === "line") throw new Error("enclosedCharge: line charges are not supported for closed surfaces");
    return contains(shape, c.pos) ? s + c.q : s;
  }, 0);
}
