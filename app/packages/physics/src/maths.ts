import { gaussLegendre } from "./quadrature";

/** A function of one variable with its exact derivative and, where it has one, an exact antiderivative. */
export type Fn1 = { label: string; f: (x: number) => number; df: (x: number) => number; F?: (x: number) => number };

const { exp, sin, cos, log, sqrt } = Math;

/**
 * The curves the Maths Foundations lessons draw, by id. `label` is plain text for the plate (SVG can't typeset).
 * Ids are named for what they draw; lessons pick them in plate params.
 */
export const functions1d: Record<string, Fn1> = {
  x2: { label: "y = x²", f: (x) => x * x, df: (x) => 2 * x, F: (x) => x ** 3 / 3 },
  x3: { label: "y = x³", f: (x) => x ** 3, df: (x) => 3 * x * x, F: (x) => x ** 4 / 4 },
  "x3-over-3": { label: "y = x³/3", f: (x) => x ** 3 / 3, df: (x) => x * x, F: (x) => x ** 4 / 12 },
  "neg-cos": { label: "y = −cos x", f: (x) => -cos(x), df: (x) => sin(x), F: (x) => -sin(x) },
  sin: { label: "y = sin x", f: (x) => sin(x), df: (x) => cos(x), F: (x) => -cos(x) },
  lin: { label: "y = 2x + 1", f: (x) => 2 * x + 1, df: () => 2, F: (x) => x * x + x },
  "poly-d1": { label: "y = 2x³ − 2x² + 5x", f: (x) => 2 * x ** 3 - 2 * x * x + 5 * x, df: (x) => 6 * x * x - 4 * x + 5, F: (x) => x ** 4 / 2 - (2 * x ** 3) / 3 + (5 * x * x) / 2 },
  "ex-d1-basic": { label: "y = x⁴ − x² + 7x", f: (x) => x ** 4 - x * x + 7 * x, df: (x) => 4 * x ** 3 - 2 * x + 7 },
  "ex-d1-tut": { label: "y = 1.5e²ˣ + 2 sin 3x", f: (x) => 1.5 * exp(2 * x) + 2 * sin(3 * x), df: (x) => 3 * exp(2 * x) + 6 * cos(3 * x) },
  "neg-inv": { label: "y = −1/x", f: (x) => -1 / x, df: (x) => 1 / (x * x), F: (x) => -log(Math.abs(x)) },
  "sub-a": { label: "y = (x² + 1)⁴/4", f: (x) => (x * x + 1) ** 4 / 4, df: (x) => 2 * x * (x * x + 1) ** 3 },
  "sin3x-over-3": { label: "y = (sin 3x)/3", f: (x) => sin(3 * x) / 3, df: (x) => cos(3 * x), F: (x) => -cos(3 * x) / 9 },
  "two-x-exp-x2": { label: "y = 2x eˣ²", f: (x) => 2 * x * exp(x * x), df: (x) => (2 + 4 * x * x) * exp(x * x), F: (x) => exp(x * x) },
  "rho-exp": { label: "y = x e⁻ˣ²", f: (x) => x * exp(-x * x), df: (x) => (1 - 2 * x * x) * exp(-x * x), F: (x) => -0.5 * exp(-x * x) },
  "ex-sub-basic": { label: "y = (x³ + 2)⁵/5", f: (x) => (x ** 3 + 2) ** 5 / 5, df: (x) => 3 * x * x * (x ** 3 + 2) ** 4 },
  "sin-cos": { label: "y = sin x cos x", f: (x) => sin(x) * cos(x), df: (x) => cos(2 * x), F: (x) => sin(x) ** 2 / 2 },
  ring: { label: "y = x/√(x² + 1)³", f: (x) => x / (x * x + 1) ** 1.5, df: (x) => (1 - 2 * x * x) / (x * x + 1) ** 2.5, F: (x) => -1 / sqrt(x * x + 1) },
  "x-exp": { label: "y = x eˣ", f: (x) => x * exp(x), df: (x) => (x + 1) * exp(x), F: (x) => (x - 1) * exp(x) },
  "x-minus-1-exp": { label: "y = (x − 1)eˣ", f: (x) => (x - 1) * exp(x), df: (x) => x * exp(x), F: (x) => (x - 2) * exp(x) },
  "x-sin": { label: "y = x sin x", f: (x) => x * sin(x), df: (x) => sin(x) + x * cos(x), F: (x) => sin(x) - x * cos(x) },
  "x-sin-plus-cos": { label: "y = x sin x + cos x", f: (x) => x * sin(x) + cos(x), df: (x) => x * cos(x) },
  "x-exp-neg": { label: "y = x e⁻ˣ", f: (x) => x * exp(-x), df: (x) => (1 - x) * exp(-x), F: (x) => -(x + 1) * exp(-x) },
  "x-ln-x-minus-x": { label: "y = x ln x − x", f: (x) => x * log(x) - x, df: (x) => log(x) },
  sin2: { label: "y = sin²x", f: (x) => sin(x) ** 2, df: (x) => sin(2 * x), F: (x) => x / 2 - sin(2 * x) / 4 },
  cos2: { label: "y = cos²x", f: (x) => cos(x) ** 2, df: (x) => -sin(2 * x), F: (x) => x / 2 + sin(2 * x) / 4 },
  "x-plus-ln-x": { label: "y = x + ln x", f: (x) => x + log(x), df: (x) => 1 + 1 / x },
  "expand-ex": { label: "y = x⁵/5 + 2x³/3 + x", f: (x) => x ** 5 / 5 + (2 * x ** 3) / 3 + x, df: (x) => (x * x + 1) ** 2 },
};

/** Values within 1e-12 of zero are zero: exact cancellations (∫ sin over a period) must read 0. */
const snap = (v: number) => (Math.abs(v) < 1e-12 ? 0 : v);

/** Signed area ∫ₐᵇ f dx: exact through F when the function has one, otherwise 8 panels of 16-point Gauss–Legendre. */
export function areaUnder(fn: Fn1, a: number, b: number): number {
  if (fn.F) return snap(fn.F(b) - fn.F(a));
  const { nodes, weights } = gaussLegendre(16);
  const panels = 8, h = (b - a) / panels;
  let sum = 0;
  for (let p = 0; p < panels; p++) {
    const mid = a + (p + 0.5) * h;
    for (let i = 0; i < 16; i++) sum += weights[i]! * fn.f(mid + (h / 2) * nodes[i]!);
  }
  return snap((sum * h) / 2);
}

/** Midpoint Riemann sum with n strips. */
export function midpointSum(fn: Fn1, a: number, b: number, n: number): number {
  const w = (b - a) / n;
  let sum = 0;
  for (let k = 0; k < n; k++) sum += fn.f(a + (k + 0.5) * w);
  return snap(sum * w);
}