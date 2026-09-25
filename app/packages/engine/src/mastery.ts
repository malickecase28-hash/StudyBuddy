import { DIMENSIONS, type Dimension } from "./schema/common";

export type Dimensions = Record<Dimension, number>;
export type ConceptState = "NOT_STARTED" | "INTRODUCED" | "EXPLORED" | "PRACTICED" | "DEMONSTRATED" | "MASTERED";

export const zeroDimensions = (): Dimensions => Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Dimensions;

/** Success closes `weight` of the gap to 1; failure removes half of `weight` of the current value. */
export function applyEvidence(d: Dimensions, dims: readonly Dimension[], correct: boolean, weight = 0.35): Dimensions {
  const out = { ...d };
  for (const k of dims) {
    out[k] = correct ? Math.min(1, out[k] + weight * (1 - out[k])) : Math.max(0, out[k] - (weight / 2) * out[k]);
  }
  return out;
}

export function deriveState(d: Dimensions, seen: boolean): ConceptState {
  if (DIMENSIONS.every((k) => d[k] >= 0.8)) return "MASTERED";
  if (d.independent >= 0.6 && d.conceptual >= 0.7) return "DEMONSTRATED";
  if (d.computational >= 0.5) return "PRACTICED";
  if (d.conceptual >= 0.3) return "EXPLORED";
  return seen ? "INTRODUCED" : "NOT_STARTED";
}

export const overallMastery = (d: Dimensions): number => DIMENSIONS.reduce((s, k) => s + d[k], 0) / DIMENSIONS.length;
