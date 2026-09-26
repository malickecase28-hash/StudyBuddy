import type { Frame } from "@forma/plate";
import { contains, type SurfaceShape, type Vec3 } from "@forma/physics";

export type Check = (now: Frame, start: Frame) => boolean;

type Item = { id: string; kind: string; pos?: number[]; draggable?: boolean };
const shapeOf = (f: Frame): SurfaceShape | null => {
  const s = f.surface;
  if (!s) return null;
  const p = s.params as { shape: string; center: number[]; size: number; height: number; amplitude: number; lobes: number };
  const center = p.center as unknown as Vec3;
  if (p.shape === "cube") return { kind: "cube", center, side: p.size };
  if (p.shape === "blob") return { kind: "blob", center, radius: p.size, amplitude: p.amplitude, lobes: p.lobes };
  if (p.shape === "cylinder") return { kind: "cylinder", center, radius: p.size, height: p.height };
  return { kind: "sphere", center, radius: p.size };
};

export const checks: Record<string, Check> = {
  /** A draggable point charge has been moved outside the surface. */
  "outside-zero": (now) => {
    const shape = shapeOf(now);
    const items = (now.q?.params.items ?? []) as Item[];
    return !!shape && items.some((it) => it.kind === "point" && it.draggable && it.pos && !contains(shape, it.pos as unknown as Vec3));
  },
  /** The surface size changed by at least 40% while charge stays enclosed. */
  "resize-constant": (now, start) => {
    const a = Number(start.surface?.params.size);
    const b = Number(now.surface?.params.size);
    return Math.abs(b / a - 1) >= 0.4 && Math.abs(Number(now.surface?.model.enclosed)) > 1e-9;
  },
  /** The surface shape changed while charge stays enclosed. */
  "shape-swap": (now, start) =>
    now.surface?.params.shape !== start.surface?.params.shape && Math.abs(Number(now.surface?.model.enclosed)) > 1e-9,
  /** The flat patch passes 3 µC, within 2%. */
  "patch-flux-3": (now) => Math.abs(Number(now.patch?.model.dPsi) - 3) <= 0.06,
};
