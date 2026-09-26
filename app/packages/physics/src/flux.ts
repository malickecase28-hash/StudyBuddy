import { fluxDensity, type Charge, type LineCharge, type SheetCharge } from "./charges";
import { contains, type Patch, type SurfaceShape } from "./surfaces";
import { dot } from "./vec";

export function patchContributions(charges: readonly Charge[], patches: readonly Patch[]): number[] {
  return patches.map((p) => dot(fluxDensity(charges, p.center), p.dS));
}

/** Ψ = ∮ D · dS over the patches, in coulombs. */
export function fluxThrough(charges: readonly Charge[], patches: readonly Patch[]): number {
  return patchContributions(charges, patches).reduce((s, x) => s + x, 0);
}

function lineLengthInside(c: LineCharge, s: SurfaceShape): number {
  const dx = c.x - s.center[0];
  const dy = c.y - s.center[1];
  const d = Math.hypot(dx, dy);
  switch (s.kind) {
    case "sphere":
      return d < s.radius ? 2 * Math.sqrt(s.radius * s.radius - d * d) : 0;
    case "cube":
      return Math.abs(dx) < s.side / 2 && Math.abs(dy) < s.side / 2 ? s.side : 0;
    case "cylinder":
      return d < s.radius ? s.height : 0;
    case "blob":
      throw new Error("enclosedCharge: line charges in a blob are not supported");
  }
}

function sheetAreaInside(c: SheetCharge, s: SurfaceShape): number {
  const dz = Math.abs(c.z0 - s.center[2]);
  switch (s.kind) {
    case "sphere":
      return dz < s.radius ? Math.PI * (s.radius * s.radius - dz * dz) : 0;
    case "cube":
      return dz < s.side / 2 ? s.side * s.side : 0;
    case "cylinder":
      return dz < s.height / 2 ? Math.PI * s.radius * s.radius : 0;
    case "blob":
      throw new Error("enclosedCharge: sheet charges in a blob are not supported");
  }
}

/** Total charge strictly inside the closed surface (point, line and sheet distributions). */
export function enclosedCharge(charges: readonly Charge[], shape: SurfaceShape): number {
  return charges.reduce((s, c) => {
    if (c.kind === "point") return contains(shape, c.pos) ? s + c.q : s;
    if (c.kind === "line") return s + c.rhoL * lineLengthInside(c, shape);
    return s + c.rhoS * sheetAreaInside(c, shape);
  }, 0);
}
