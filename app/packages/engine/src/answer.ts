import { parseQuantity, toSI } from "./quantities";
import type { AuthoredQuantity, Choice, Distractor, ErrorClass } from "./schema/common";

export type NumericSpec = { answer: AuthoredQuantity; relTol: number; distractors: Distractor[] };
export type Verdict = { correct: boolean; errorClass?: ErrorClass; tag?: string; feedback: string };

const close = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol * Math.max(Math.abs(b), Number.MIN_VALUE);

export function checkNumeric(spec: NumericSpec, input: string): Verdict {
  const expected = toSI(spec.answer.value, spec.answer.unit);
  const got = parseQuantity(input);
  if (!got) {
    return { correct: false, errorClass: "notation", feedback: `Enter a number with units, e.g. ${spec.answer.value} ${spec.answer.unit}.` };
  }
  if (got.dim !== expected.dim) {
    const missing = got.dim === "1";
    return {
      correct: false,
      errorClass: "unit",
      feedback: missing
        ? `Include units: the answer is measured in ${spec.answer.unit}-type units.`
        : "Check the units: that quantity has a different dimension from what's asked.",
    };
  }
  if (close(got.value, expected.value, spec.relTol)) return { correct: true, feedback: "That's it." };
  for (const d of spec.distractors) {
    const dv = toSI(d.value, d.unit).value;
    if (close(got.value, dv, spec.relTol)) {
      return { correct: false, errorClass: d.errorClass, ...(d.tag ? { tag: d.tag } : {}), feedback: d.feedback };
    }
  }
  if (close(-got.value, expected.value, spec.relTol)) {
    return { correct: false, errorClass: "sign", feedback: "The magnitude is right. Check the sign and direction." };
  }
  const k = Math.log10(Math.abs(got.value / expected.value));
  if (Math.abs(k - Math.round(k)) < 0.01 && Math.round(k) !== 0) {
    return { correct: false, errorClass: "unit", feedback: `Off by a factor of 10^${Math.round(k)}. Check your prefixes.` };
  }
  const nearMiss = close(got.value, expected.value, 0.1);
  return {
    correct: false,
    errorClass: nearMiss ? "arithmetic" : "conceptual",
    feedback: nearMiss ? "Close. Recheck your arithmetic." : "Not quite. Revisit how the quantity is set up.",
  };
}

export function checkChoice(options: Choice[], selectedId: string): Verdict {
  const o = options.find((x) => x.id === selectedId);
  if (!o) throw new Error(`Unknown option: ${selectedId}`);
  if (o.correct) return { correct: true, feedback: o.feedback };
  return { correct: false, errorClass: "conceptual", ...(o.tag ? { tag: o.tag } : {}), feedback: o.feedback };
}
