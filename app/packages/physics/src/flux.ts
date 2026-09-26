import { fluxDensity, type BallCharge, type Charge, type LineCharge, type SheetCharge } from "./charges";
import { contains, type Patch, type SurfaceShape } from "./surfaces";
import { add, dot, norm, scale, sub, type Vec3 } from "./vec";

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

function ballChargeInside(c: BallCharge, s: SurfaceShape): number {
  const total = (c.rhoV * 4 * Math.PI * c.radius ** 3) / 3;
  if (s.kind === "sphere" && norm(sub(s.center, c.center)) < 1e-12)
    return (c.rhoV * 4 * Math.PI * Math.min(s.radius, c.radius) ** 3) / 3;
  // ponytail: six-point containment test; exact intersection volume if a plate ever needs a straddling ball.
  const probes: Vec3[] = [c.center, ...([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] as Vec3[]).map((u) => add(c.center, scale(u, c.radius)))];
  const inside = probes.map((q) => contains(s, q));
  if (inside.every(Boolean)) return total;
  if (!inside.some(Boolean)) return 0;
  throw new Error("enclosedCharge: a ball partly inside a non-concentric surface is not supported");
}

/** Total charge strictly inside the closed surface (point, line and sheet distributions). */
export function enclosedCharge(charges: readonly Charge[], shape: SurfaceShape): number {
  return charges.reduce((s, c) => {
    if (c.kind === "point") return contains(shape, c.pos) ? s + c.q : s;
    if (c.kind === "ball") return s + ballChargeInside(c, shape);
    if (c.kind === "line") return s + c.rhoL * lineLengthInside(c, shape);
    return s + c.rhoS * sheetAreaInside(c, shape);
  }, 0);
}
