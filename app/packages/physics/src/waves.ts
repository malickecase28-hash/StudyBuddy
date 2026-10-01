import { EPS0, MU0 } from "./constants";

/** Principal square root of a + jb, real part ≥ 0. */
export const csqrt = (a: number, b: number): [number, number] => {
  const r = Math.hypot(a, b);
  return [Math.sqrt((r + a) / 2), (b < 0 ? -1 : 1) * Math.sqrt((r - a) / 2)];
};

export type WaveMedium = { f: number; er?: number; mur?: number; sigma?: number };
/**
 * Uniform plane wave: γ = √(jωμ(σ + jωε)) = α + jβ and η = √(jωμ/(σ + jωε)) = |η|∠θη.
 * Exact for σ = 0: α = 0 and θη = 0.
 */
export function planeWave({ f, er = 1, mur = 1, sigma = 0 }: WaveMedium) {
  const w = 2 * Math.PI * f, eps = er * EPS0, mu = mur * MU0;
  const [alpha, beta] = csqrt(-w * w * mu * eps, w * mu * sigma);
  const den = sigma * sigma + (w * eps) ** 2;
  const [nr, ni] = csqrt((w * mu * w * eps) / den, (w * mu * sigma) / den);
  return { omega: w, alpha, beta, eta: Math.hypot(nr, ni), thetaEta: (Math.atan2(ni, nr) * 180) / Math.PI, lossTan: sigma / (w * eps), lambda: (2 * Math.PI) / beta, u: w / beta };
}
