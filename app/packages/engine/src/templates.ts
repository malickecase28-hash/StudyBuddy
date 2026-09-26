import type { NumericSpec } from "./answer";
import type { AuthoredQuantity, Dimension, Distractor } from "./schema/common";

export type ParamSpec = { min: number; max: number; step: number };

export type TemplateDef<P extends Record<string, number>> = {
  id: string;
  params: { [K in keyof P]: ParamSpec };
  prompt: (p: P) => string;
  solve: (p: P) => { answer: AuthoredQuantity; distractors?: Distractor[] };
  hints?: (p: P) => string[];
  relTol?: number;
  dimension: Dimension;
  tags: { concepts: string[]; misconceptions: string[]; difficulty: 1 | 2 | 3 | 4 | 5 };
};

export const defineTemplate = <P extends Record<string, number>>(t: TemplateDef<P>): TemplateDef<P> => t;

/** Small, fast, well-distributed 32-bit PRNG; the same seed always gives the same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleParams<P extends Record<string, number>>(t: TemplateDef<P>, seed: number): P {
  const rand = mulberry32(seed);
  const out: Record<string, number> = {};
  for (const key of Object.keys(t.params).sort()) {
    const { min, max, step } = t.params[key as keyof P];
    const count = Math.floor((max - min) / step + 1e-9) + 1;
    out[key] = Math.round((min + step * Math.floor(rand() * count)) * 1e9) / 1e9;
  }
  return out as P;
}

export type Variant<P extends Record<string, number>> = {
  key: string;
  seed: number;
  params: P;
  prompt: string;
  spec: NumericSpec;
  hints: string[];
  dimension: Dimension;
  tags: TemplateDef<P>["tags"];
};

export function instantiate<P extends Record<string, number>>(t: TemplateDef<P>, seed: number): Variant<P> {
  const params = sampleParams(t, seed);
  const solved = t.solve(params);
  return {
    key: `${t.id}#${seed}`,
    seed,
    params,
    prompt: t.prompt(params),
    spec: { answer: solved.answer, relTol: t.relTol ?? 0.02, distractors: solved.distractors ?? [] },
    hints: t.hints?.(params) ?? [],
    dimension: t.dimension,
    tags: t.tags,
  };
}
