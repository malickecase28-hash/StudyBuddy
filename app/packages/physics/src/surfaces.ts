import { gaussLegendre } from "./quadrature";
import { add, cross, norm, scale, sub, type Vec3 } from "./vec";

export type Patch = { center: Vec3; dS: Vec3 };

export type SurfaceShape =
  | { kind: "sphere"; center: Vec3; radius: number }
  | { kind: "cube"; center: Vec3; side: number }
  | { kind: "blob"; center: Vec3; radius: number; amplitude: number; lobes: number };

type Param = {
  r: (u: number, v: number) => Vec3;
  u: readonly [number, number];
  v: readonly [number, number];
  vPeriodic: boolean;
};

const spherical = (c: Vec3, rad: (t: number, p: number) => number): Param => ({
  r: (t, p) => add(c, scale([Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), Math.cos(t)], rad(t, p))),
  u: [0, Math.PI],
  v: [0, 2 * Math.PI],
  vPeriodic: true,
});

export function blobRadius(s: Extract<SurfaceShape, { kind: "blob" }>, theta: number, phi: number): number {
  return s.radius * (1 + s.amplitude * Math.sin(s.lobes * theta) * Math.cos(s.lobes * phi));
}

function params(shape: SurfaceShape): Param[] {
  if (shape.kind === "sphere") return [spherical(shape.center, () => shape.radius)];
  if (shape.kind === "blob") return [spherical(shape.center, (t, p) => blobRadius(shape, t, p))];
  const a = shape.side / 2;
  const c = shape.center;
  const face = (f: (u: number, v: number) => Vec3): Param => ({
    r: (u, v) => add(c, f(u, v)),
    u: [-a, a],
    v: [-a, a],
    vPeriodic: false,
  });
  // Each parametrisation is ordered so that r_u × r_v points outward.
  return [
    face((u, v) => [a, u, v]),
    face((u, v) => [-a, v, u]),
    face((u, v) => [v, a, u]),
    face((u, v) => [u, -a, v]),
    face((u, v) => [u, v, a]),
    face((u, v) => [v, u, -a]),
  ];
}

function rule(range: readonly [number, number], n: number, periodic: boolean): { x: number[]; w: number[] } {
  const [a, b] = range;
  if (periodic) {
    const h = (b - a) / n;
    return { x: Array.from({ length: n }, (_, i) => a + (i + 0.5) * h), w: new Array<number>(n).fill(h) };
  }
  const { nodes, weights } = gaussLegendre(n);
  const half = (b - a) / 2;
  return { x: nodes.map((t) => a + half * (t + 1)), w: weights.map((w) => w * half) };
}

function discretize(p: Param, n: number): Patch[] {
  const U = rule(p.u, n, false);
  const V = rule(p.v, p.vPeriodic ? 2 * n : n, p.vPeriodic);
  const hu = (p.u[1] - p.u[0]) * 1e-6;
  const hv = (p.v[1] - p.v[0]) * 1e-6;
  const out: Patch[] = [];
  U.x.forEach((u, i) => {
    V.x.forEach((v, j) => {
      const ru = scale(sub(p.r(u + hu, v), p.r(u - hu, v)), 1 / (2 * hu));
      const rv = scale(sub(p.r(u, v + hv), p.r(u, v - hv)), 1 / (2 * hv));
      out.push({ center: p.r(u, v), dS: scale(cross(ru, rv), U.w[i]! * V.w[j]!) });
    });
  });
  return out;
}

/** Quadrature patches over a closed surface; dS is outward. n = nodes per direction per face. */
export function surfacePatches(shape: SurfaceShape, n: number): Patch[] {
  return params(shape).flatMap((p) => discretize(p, n));
}

export function contains(shape: SurfaceShape, p: Vec3): boolean {
  const d = sub(p, shape.center);
  if (shape.kind === "sphere") return norm(d) < shape.radius;
  if (shape.kind === "cube") return Math.max(Math.abs(d[0]), Math.abs(d[1]), Math.abs(d[2])) < shape.side / 2;
  const r = norm(d);
  if (r === 0) return true;
  const theta = Math.acos(d[2] / r);
  const phi = Math.atan2(d[1], d[0]);
  return r < blobRadius(shape, theta, phi);
}
