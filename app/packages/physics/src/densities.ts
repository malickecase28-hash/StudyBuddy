import { gaussLegendre } from "./quadrature";
import type { CoordSystem } from "./coords";
import type { Native } from "./fields";

export type Density = {
  id: string; text: string; system: CoordSystem;
  kind: "line" | "surface" | "volume";
  /** line: the coordinate that varies; surface: the coordinate held fixed (at its range's upper end). */
  axis: 0 | 1 | 2;
  /** Multiply the formula's value by this to get SI (C/m, C/m², C/m³). */
  scale: number;
  f: (n: Native) => number;
};

const { sin } = Math;
export const densities: Record<string, Density> = {
  "demo-line": { id: "demo-line", text: "ρL = 3x µC/m", system: "cart", kind: "line", axis: 0, scale: 1e-6, f: ([x]) => 3 * x },
  "demo-sphere": { id: "demo-sphere", text: "ρS = 2 µC/m²", system: "sph", kind: "surface", axis: 0, scale: 1e-6, f: () => 2 },
  "demo-cyl": { id: "demo-cyl", text: "ρv = ρ µC/m³", system: "cyl", kind: "volume", axis: 0, scale: 1e-6, f: ([r]) => r },
  "hw-2.5a": { id: "hw-2.5a", text: "ρL = 12x² mC/m", system: "cart", kind: "line", axis: 0, scale: 1e-3, f: ([x]) => 12 * x * x },
  "hw-2.5b": { id: "hw-2.5b", text: "ρS = πρz² pC/m²", system: "cyl", kind: "surface", axis: 0, scale: 1e-12, f: ([r, , z]) => Math.PI * r * z * z },
  "hw-2.5c": { id: "hw-2.5c", text: "ρv = 3.05/(r sin θ) C/m³", system: "sph", kind: "volume", axis: 0, scale: 1, f: ([r, t]) => 3.05 / (r * sin(t)) },
  "mst-4b": { id: "mst-4b", text: "ρv = ρ² sin φ µC/m³", system: "cyl", kind: "volume", axis: 0, scale: 1e-6, f: ([r, p]) => r * r * sin(p) },
  "hw-2.6": { id: "hw-2.6", text: "ρv = 3y C/m³", system: "cart", kind: "volume", axis: 0, scale: 1, f: ([, y]) => 3 * y },
};

const H: Record<CoordSystem, (n: Native) => Native> = {
  cart: () => [1, 1, 1],
  cyl: ([r]) => [1, r, 1],
  sph: ([r, t]) => [1, r, r * sin(t)],
};

/** Total charge (C) of a density over native ranges (angles in radians), by Gauss–Legendre quadrature with the scale factors. */
export function totalCharge(d: Density, ranges: [number, number][], n = 16): number {
  const { nodes, weights } = gaussLegendre(n);
  const free = d.kind === "volume" ? [0, 1, 2] : d.kind === "line" ? [d.axis] : [0, 1, 2].filter((k) => k !== d.axis);
  const at = (k: number) => (d.kind === "surface" && k === d.axis ? ranges[k]![1] : ranges[k]![0]);
  let sum = 0;
  const walk = (i: number, u: Native, w: number) => {
    if (i === free.length) {
      const h = H[d.system](u);
      const jac = free.reduce((j, k) => j * h[k]!, 1);
      sum += w * jac * d.f(u);
      return;
    }
    const k = free[i]!;
    const [a, b] = ranges[k]!;
    const half = (b - a) / 2, mid = (a + b) / 2;
    for (let m = 0; m < n; m++) {
      const v = [...u] as Native;
      v[k] = mid + half * nodes[m]!;
      walk(i + 1, v, w * weights[m]! * half);
    }
  };
  walk(0, [at(0), at(1), at(2)], 1);
  return sum * d.scale;
}
