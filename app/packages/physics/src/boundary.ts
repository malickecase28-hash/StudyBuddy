import { EPS0, MU0 } from "./constants";
import { add, dot, norm, scale, sub, type Vec3 } from "./vec";

export type BoundaryInput = { D1: Vec3; normal: Vec3; er1: number; er2: number; rhoS?: number; conductor?: boolean };
export type BoundaryResult = {
  n: Vec3; D1n: Vec3; D1t: Vec3; D2: Vec3; E1: Vec3; E2: Vec3; P1: Vec3; P2: Vec3;
  /** Free surface charge: the given ρs, or D1·n̂ when region 2 is a conductor. */
  rhoS: number;
  /** Degrees from the normal. theta2 is null when region 2 is a conductor. */
  theta1: number; theta2: number | null;
};

const ZERO: Vec3 = [0, 0, 0];
const angle = (t: Vec3, n: number) => (Math.atan2(norm(t), Math.abs(n)) * 180) / Math.PI;

/**
 * Boundary conditions for D and E at a plane with the given normal (any length, any offset).
 * n̂ = normal/|normal| points from region 2 into region 1, and D1n − D2n = ρs. Tangential E is continuous.
 * P = (1 − 1/εr)D, so free space gives an exact zero.
 */
export function dielectricBoundary({ D1, normal, er1, er2, rhoS = 0, conductor = false }: BoundaryInput): BoundaryResult {
  const len = norm(normal);
  if (!(len > 0)) throw new Error("boundary normal must be non-zero");
  const n = scale(normal, 1 / len);
  const d1n = dot(D1, n);
  const D1n = scale(n, d1n);
  const D1t = sub(D1, D1n);
  const E1 = scale(D1, 1 / (er1 * EPS0));
  const P1 = scale(D1, 1 - 1 / er1);
  if (conductor) return { n, D1n, D1t, D2: ZERO, E1, E2: ZERO, P1, P2: ZERO, rhoS: d1n, theta1: angle(D1t, d1n), theta2: null };
  const d2n = d1n - rhoS;
  const D2t = scale(D1t, er2 / er1);
  const D2 = add(scale(n, d2n), D2t);
  return { n, D1n, D1t, D2, E1, E2: scale(D2, 1 / (er2 * EPS0)), P1, P2: scale(D2, 1 - 1 / er2), rhoS, theta1: angle(D1t, d1n), theta2: angle(D2t, d2n) };
}

/** The magnetic twin of dielectricBoundary (K = 0): B ↔ D, H ↔ E, μr ↔ εr, M = (B/μ₀)(1 − 1/μr). Normal B and tangential H are continuous. */
export function magneticBoundary({ B1, normal, mur1, mur2 }: { B1: Vec3; normal: Vec3; mur1: number; mur2: number }) {
  const r = dielectricBoundary({ D1: B1, normal, er1: mur1, er2: mur2 });
  const k = EPS0 / MU0;
  return {
    n: r.n, B1n: r.D1n, B1t: r.D1t, B2: r.D2,
    H1: scale(r.E1, k), H2: scale(r.E2, k),
    M1: scale(r.P1, 1 / MU0), M2: scale(r.P2, 1 / MU0),
    theta1: r.theta1, theta2: r.theta2!,
  };
}
