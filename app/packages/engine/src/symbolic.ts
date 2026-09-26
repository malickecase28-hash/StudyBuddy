import { ComputeEngine } from "@cortex-js/compute-engine";
import { mulberry32 } from "./templates";

const ce = new ComputeEngine();

// API confirmed against 0.135 typings: ce.parse, expr.isValid, expr.unknowns, expr.subs, expr.N().re.
// Compute Engine parses ε₀ and μ₀ as unit-bearing physical constants with no plain numeric value;
// rewrite them as ordinary symbols so they are sampled like any other variable.
const constantsAsSymbols = (latex: string) =>
  latex.replace(/\\(varepsilon|epsilon|mu)_(?:0|\{0\})/g, (_, name: string) => `\\operatorname{${name}zero}`);

/**
 * Deterministic equivalence of two LaTeX expressions: substitute the same pseudo-random values
 * for every free variable (seeded, 6 samples in [0.5, 2.5]) and compare numerically.
 * Sampling avoids depending on the CAS's symbolic simplifier for equality.
 */
export function checkExpression(expectedLatex: string, inputLatex: string): { parsed: boolean; equivalent: boolean } {
  const a = ce.parse(constantsAsSymbols(expectedLatex));
  const b = ce.parse(constantsAsSymbols(inputLatex));
  if (!b.isValid || !a.isValid) return { parsed: false, equivalent: false };
  const vars = [...new Set([...a.unknowns, ...b.unknowns])].sort();
  const rand = mulberry32(20260925);
  for (let i = 0; i < 6; i++) {
    const subs: Record<string, number> = {};
    for (const v of vars) subs[v] = 0.5 + 2 * rand();
    const va = Number(a.subs(subs).N().re);
    const vb = Number(b.subs(subs).N().re);
    if (!Number.isFinite(va) || !Number.isFinite(vb)) return { parsed: true, equivalent: false };
    if (Math.abs(va - vb) > 1e-9 * Math.max(1, Math.abs(va))) return { parsed: true, equivalent: false };
  }
  return { parsed: true, equivalent: true };
}
