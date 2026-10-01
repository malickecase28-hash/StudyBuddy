import { conceptHref, getConcept, getLesson, questionBank } from "@/lib/course";

/** A place in the course a thread or room is about: a plate step, a lesson block, a concept, or a bank question. */
export type Anchor = { conceptId: string; lessonId?: string; blockId?: string; step?: number; bankItemId?: string; label: string };

export const anchorKey = (a: Anchor) =>
  a.bankItemId ? `bank:${a.bankItemId}` : [a.conceptId, a.lessonId, a.blockId, a.step].filter((x) => x !== undefined).join("/");

export function anchorHref(a: Anchor): string | null {
  if (a.bankItemId) return questionBank.some((q) => q.id === a.bankItemId) ? `/past-papers#${encodeURIComponent(a.bankItemId)}` : null;
  if (!getConcept(a.conceptId)) return null;
  const q: Record<string, string> = {};
  if (a.lessonId) q.lesson = a.lessonId;
  if (a.blockId) q.block = a.blockId;
  if (a.step !== undefined) q.step = String(a.step);
  return conceptHref(a.conceptId, "learn", q);
}

/** Untrusted input (the URL or the database) → a valid anchor, or null. */
export function parseAnchor(v: unknown): Anchor | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const str = (k: string) => (typeof o[k] === "string" && (o[k] as string).length <= 160 ? (o[k] as string) : undefined);
  const conceptId = str("conceptId");
  const label = str("label");
  if (!conceptId || !label || !getConcept(conceptId)) return null;
  const a: Anchor = { conceptId, label };
  const lessonId = str("lessonId");
  const blockId = str("blockId");
  const bankItemId = str("bankItemId");
  if (lessonId && getLesson(conceptId, lessonId)) a.lessonId = lessonId;
  if (blockId && a.lessonId) a.blockId = blockId;
  if (typeof o.step === "number" && Number.isInteger(o.step) && o.step >= 0 && o.step < 200) a.step = o.step;
  if (bankItemId && questionBank.some((q) => q.id === bankItemId)) a.bankItemId = bankItemId;
  return a;
}

export const anchorParam = (a: Anchor) => `a=${encodeURIComponent(JSON.stringify(a))}`;

export function readAnchorParam(raw: string | null): Anchor | null {
  if (!raw) return null;
  try {
    return parseAnchor(JSON.parse(raw));
  } catch {
    return null;
  }
}
