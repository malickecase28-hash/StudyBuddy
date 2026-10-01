import { templates } from "@forma/course-em1";
import { checkChoice, checkNumeric, instantiate } from "@forma/engine";
import { course, templatesFor } from "@/lib/course";
import { pool } from "@/lib/retrieval";

export const LIMIT_MS = 45_000;
export const BATTLE_SIZE = 5;
export const MAX_PLAYERS = 8;

/** Only auto-checked items: seeded template variants (numeric) and the retrieval MCQs. */
export type BattleItem = { kind: "template"; id: string; seed: number } | { kind: "mcq"; conceptId: string; blockId: string };
export type Shown = { prompt: string; options: { id: string; label: string }[] | null; unit: string | null };

const mcqsFor = (conceptId: string) => pool.filter((i) => i.conceptId === conceptId);
export const battleConcepts = () => course.concepts.filter((c) => !c.locked && templatesFor(c.id).length + mcqsFor(c.id).length > 0);

export function pickItems(concepts: string[]): BattleItem[] {
  const all: BattleItem[] = concepts.flatMap((c) => [
    ...templatesFor(c).map((t) => ({ kind: "template" as const, id: t.id, seed: Math.floor(Math.random() * 2 ** 31) })),
    ...mcqsFor(c).map((i) => ({ kind: "mcq" as const, conceptId: c, blockId: i.block.id })),
  ]);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  return all.slice(0, BATTLE_SIZE);
}

const variant = (item: Extract<BattleItem, { kind: "template" }>) => {
  const t = templates.find((x) => x.id === item.id);
  if (!t) throw new Error(`Unknown template: ${item.id}`);
  return instantiate(t, item.seed);
};
const mcq = (item: Extract<BattleItem, { kind: "mcq" }>) => {
  const m = pool.find((i) => i.conceptId === item.conceptId && i.block.id === item.blockId);
  if (!m) throw new Error(`Unknown question: ${item.blockId}`);
  return m.block;
};

export function showItem(item: BattleItem): Shown {
  if (item.kind === "template") {
    const v = variant(item);
    return { prompt: v.prompt, options: null, unit: v.spec.answer.unit };
  }
  const b = mcq(item);
  return { prompt: b.prompt, options: b.options.map(({ id, label }) => ({ id, label })), unit: null };
}

export function gradeItem(item: BattleItem, input: string): boolean {
  if (item.kind === "template") return checkNumeric(variant(item).spec, input).correct;
  const b = mcq(item);
  return b.options.some((o) => o.id === input) && checkChoice(b.options, input).correct;
}

export function answerText(item: BattleItem): string {
  if (item.kind === "template") {
    const a = variant(item).spec.answer;
    return `${a.value} ${a.unit}`;
  }
  return mcq(item).options.find((o) => o.correct)?.label ?? "";
}

/** Faster correct answers score more: 1000 at once, 500 at the bell (kahoot-alternative's curve, halved). */
export const scoreFor = (correct: boolean, elapsedMs: number) => (correct ? Math.round(1000 - 500 * Math.min(elapsedMs / LIMIT_MS, 1)) : 0);
