import type { Vec3 } from "./vec";

export type CoordSystem = "cart" | "cyl" | "sph";
const TAU = 2 * Math.PI;
const wrap = (a: number) => ((a % TAU) + TAU) % TAU;

/** Cylindrical coordinates of a cartesian point. φ in [0, 2π). */
export const toCyl = (p: Vec3) => ({ rho: Math.hypot(p[0], p[1]), phi: wrap(Math.atan2(p[1], p[0])), z: p[2] });

/** Spherical coordinates of a cartesian point. θ in [0, π] from +z; φ in [0, 2π). */
export const toSph = (p: Vec3) => {
  const r = Math.hypot(p[0], p[1], p[2]);
  return { r, theta: r === 0 ? 0 : Math.acos(p[2] / r), phi: wrap(Math.atan2(p[1], p[0])) };
};

export const fromCyl = (rho: number, phi: number, z: number): Vec3 => [rho * Math.cos(phi), rho * Math.sin(phi), z];
export const fromSph = (r: number, theta: number, phi: number): Vec3 => [
  r * Math.sin(theta) * Math.cos(phi),
  r * Math.sin(theta) * Math.sin(phi),
  r * Math.cos(theta),
];

/** The system's unit vectors at p, in the order the system names them. */
export function unitVectors(p: Vec3, system: CoordSystem): [Vec3, Vec3, Vec3] {
  if (system === "cart") return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const { phi } = toCyl(p);
  const c = Math.cos(phi), s = Math.sin(phi);
  if (system === "cyl") return [[c, s, 0], [-s, c, 0], [0, 0, 1]];
  const { theta } = toSph(p);
  const ct = Math.cos(theta), st = Math.sin(theta);
  return [[st * c, st * s, ct], [ct * c, ct * s, -st], [-s, c, 0]];
}

/** A cartesian vector v expressed in the system's components at point p. */
export function componentsIn(v: Vec3, p: Vec3, system: CoordSystem): Vec3 {
  const [u1, u2, u3] = unitVectors(p, system);
  const d = (a: Vec3) => a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
  return [d(u1), d(u2), d(u3)];
}
