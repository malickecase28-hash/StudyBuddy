import { gaussLegendre } from "./quadrature";
import { cross, dot, norm, scale, sub, type Vec3 } from "./vec";

/** Steady currents. Lines may point anywhere; loops, cylinders and sheets are centred on the z axis. */
export type Current =
  | { kind: "line"; I: number; point: Vec3; dir: Vec3 }
  | { kind: "segment"; I: number; from: Vec3; to: Vec3 }
  | { kind: "loop"; I: number; N: number; radius: number; z: number }
  | { kind: "cylinder"; I: number; a: number; b: number }
  | { kind: "sheet"; K: number; radius: number };

const ZERO: Vec3 = [0, 0, 0];
const aphi = (p: Vec3): Vec3 => { const r = Math.hypot(p[0], p[1]); return r === 0 ? ZERO : [-p[1] / r, p[0] / r, 0]; };
/** Current inside the circle of radius ρ about the z axis from a z-axis-centred source (lines count when parallel to z). */
function inside(c: Current, rho: number): number {
  if (c.kind === "cylinder") return rho <= c.a ? 0 : rho >= c.b ? c.I : (c.I * (rho * rho - c.a * c.a)) / (c.b * c.b - c.a * c.a);
  if (c.kind === "sheet") return rho > c.radius ? 2 * Math.PI * c.radius * c.K : 0;
  if (c.kind === "line" && c.dir[0] === 0 && c.dir[1] === 0) return Math.hypot(c.point[0], c.point[1]) < rho ? c.I * Math.sign(c.dir[2]) : 0;
  return 0;
}

/** H (A/m) at p. Lines and segments in closed form; loops by 96-point Gauss–Legendre Biot–Savart; cylinders and sheets by Ampère. */
export function magneticFieldH(currents: readonly Current[], p: Vec3): Vec3 {
  let H: Vec3 = [0, 0, 0];
  const add = (v: Vec3) => { H = [H[0] + v[0], H[1] + v[1], H[2] + v[2]]; };
  for (const c of currents) {
    if (c.kind === "line" || c.kind === "segment") {
      const a = c.kind === "line" ? c.point : c.from;
      const u = c.kind === "line" ? scale(c.dir, 1 / norm(c.dir)) : scale(sub(c.to, c.from), 1 / norm(sub(c.to, c.from)));
      const r1 = sub(p, a);
      const rho = sub(r1, scale(u, dot(r1, u)));
      const d = norm(rho);
      if (d === 0) continue;
      const k = c.kind === "line" ? 2 : dot(r1, u) / norm(r1) - dot(sub(p, c.to), u) / norm(sub(p, c.to));
      add(scale(cross(u, scale(rho, 1 / d)), (c.I * k) / (4 * Math.PI * d)));
    } else if (c.kind === "loop") {
      const { nodes, weights } = gaussLegendre(96);
      for (let i = 0; i < 96; i++) {
        const f = Math.PI * (1 + nodes[i]!);
        const q: Vec3 = [c.radius * Math.cos(f), c.radius * Math.sin(f), c.z];
        const dl: Vec3 = [-c.radius * Math.sin(f), c.radius * Math.cos(f), 0];
        const r = sub(p, q);
        add(scale(cross(dl, r), (c.N * c.I * Math.PI * weights[i]!) / (4 * Math.PI * norm(r) ** 3)));
      }
    } else {
      const rho = Math.hypot(p[0], p[1]);
      if (rho > 0) add(scale(aphi(p), inside(c, rho) / (2 * Math.PI * rho)));
    }
  }
  return H;
}

/** Ampère: the current enclosed by the circle through p about the z axis. */
export const enclosedCurrentAt = (currents: readonly Current[], p: Vec3) => currents.reduce((s, c) => s + inside(c, Math.hypot(p[0], p[1])), 0);
export const hphiAt = (H: Vec3, p: Vec3) => dot(H, aphi(p));

/** Self-inductance, henries. Coax and two-wire take the length; internal adds μ/8π per metre of conductor. */
export const indCoax = (a: number, b: number, length: number, mur = 1, internal = false) => ((mur * 4e-7 * Math.PI) / (2 * Math.PI)) * (Math.log(b / a) + (internal ? 0.25 : 0)) * length;
export const indTwoWire = (a: number, s: number, length: number, mur = 1, internal = false) => ((mur * 4e-7 * Math.PI) / Math.PI) * (Math.log((s - a) / a) + (internal ? 0.25 : 0)) * length;
export const indSolenoid = (N: number, radius: number, length: number, mur = 1) => (mur * 4e-7 * Math.PI * N * N * Math.PI * radius * radius) / length;
/** Toroid of rectangular cross-section: inner radius a, outer radius b, height h. */
export const indToroid = (N: number, a: number, b: number, h: number, mur = 1) => ((mur * 4e-7 * Math.PI * N * N * h) / (2 * Math.PI)) * Math.log(b / a);
