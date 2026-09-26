import { enclosedCharge, fluxThrough, surfacePatches, type Charge, type SurfaceShape, type Vec3 } from "@forma/physics";
import { z } from "zod";

/**
 * Config for the "gauss-lab" 3D scene. Lengths in metres, charges in µC.
 * Authored in lessons as sim-3d / manipulate `config`; parsed by the web lab.
 */
const V3 = z.tuple([z.number(), z.number(), z.number()]);
export const LabCharge = z.object({ id: z.string(), q: z.number(), pos: V3, draggable: z.boolean().default(true) });
export const LabSurface = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("sphere"), center: V3.default([0, 0, 0]), radius: z.number().positive() }),
  z.object({ kind: z.literal("cube"), center: V3.default([0, 0, 0]), side: z.number().positive() }),
  z.object({ kind: z.literal("blob"), center: V3.default([0, 0, 0]), radius: z.number().positive(), amplitude: z.number().default(0.2), lobes: z.number().int().default(3) }),
]);
export const GaussLabConfig = z.object({
  charges: z.array(LabCharge).default([]),
  surface: LabSurface.nullable().default(null),
  shapes: z.array(z.enum(["sphere", "cube", "blob"])).default([]),
  resizable: z.boolean().default(false),
  show: z
    .object({
      field: z.boolean().default(true),
      normals: z.boolean().default(false),
      contributions: z.boolean().default(false),
      readout: z.boolean().default(true),
    })
    .default({ field: true, normals: false, contributions: false, readout: true }),
  toggles: z.array(z.enum(["field", "normals", "contributions"])).default([]),
  addCharge: z.boolean().default(false),
});
export type GaussLabConfig = z.infer<typeof GaussLabConfig>;
export type LabCharge = z.infer<typeof LabCharge>;
export type LabSurface = z.infer<typeof LabSurface>;

/** Live lab state as reported by the scene (same shape as the config's movable parts). */
export type LabState = { charges: LabCharge[]; surface: LabSurface | null };

export const toCharges = (s: LabState): Charge[] =>
  s.charges.map((c) => ({ kind: "point", q: c.q * 1e-6, pos: c.pos as Vec3 }));

export const toShape = (s: LabSurface): SurfaceShape =>
  s.kind === "sphere"
    ? { kind: "sphere", center: s.center as Vec3, radius: s.radius }
    : s.kind === "cube"
      ? { kind: "cube", center: s.center as Vec3, side: s.side }
      : { kind: "blob", center: s.center as Vec3, radius: s.radius, amplitude: s.amplitude, lobes: s.lobes };

/** Ψ through the lab surface (µC) and enclosed charge (µC). */
export function labReadout(s: LabState, n = 24): { psi: number; qenc: number } | null {
  if (!s.surface) return null;
  const shape = toShape(s.surface);
  const charges = toCharges(s);
  return { psi: fluxThrough(charges, surfacePatches(shape, n)) * 1e6, qenc: enclosedCharge(charges, shape) * 1e6 };
}

const size = (s: LabSurface) => (s.kind === "cube" ? s.side : s.radius);

/** Goal checks referenced by `manipulate.check`. Each gets (current, initial) and returns true when achieved. */
export const LAB_CHECKS: Record<string, (now: LabState, start: LabState) => boolean> = {
  /** A draggable charge has been moved outside the surface, so it contributes nothing to Ψ. */
  "outside-zero": (now) => {
    if (!now.surface) return false;
    const surface = now.surface;
    return now.charges.some((c) => c.draggable && Math.abs(labReadout({ charges: [c], surface })!.qenc) < 1e-12);
  },
  /** Surface resized by ≥ 40% while the charge stays enclosed. */
  "resize-constant": (now, start) => {
    if (!now.surface || !start.surface) return false;
    const r = labReadout(now);
    return !!r && Math.abs(r.qenc) > 1e-9 && Math.abs(size(now.surface) / size(start.surface) - 1) >= 0.4;
  },
  /** Surface shape changed with a charge still enclosed. */
  "shape-swap": (now, start) => {
    const r = labReadout(now);
    return !!now.surface && !!start.surface && now.surface.kind !== start.surface.kind && !!r && Math.abs(r.qenc) > 1e-9;
  },
  /** Every charge is enclosed. */
  "enclose-all": (now) => {
    const r = labReadout(now);
    if (!r) return false;
    const total = now.charges.reduce((s, c) => s + c.q, 0);
    return Math.abs(r.qenc - total) < 1e-9 && now.charges.length > 1;
  },
};
