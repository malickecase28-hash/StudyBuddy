import type { Registry } from "./component";
import { applyStep, PlateDef, stateAt } from "./plate";
import { createEvaluator, type SceneState } from "./scene";
import { numbersOf, unbackedNumbers, wordCount, type PlateIssue } from "./validate";

type Patch = Record<string, Record<string, unknown>>;
export type StepInput = {
  id: string; title: string; note: string; patch?: Patch; show?: string[]; hide?: string[]; focus?: string[];
  why?: string; derivation?: string; interaction?: unknown; claims?: unknown[]; cues?: unknown[]; narration?: unknown; latex?: string;
};
export type ExampleInput = {
  id: string; level: "basic" | "tutorial" | "exam"; title: string; problem: string; setup: Patch; show?: string[]; hide?: string[];
  lines: { text: string; latex?: string; focus?: string[]; patch?: Patch; claims?: unknown[] }[]; trap?: string; covers?: string[];
};
export type AskInput = { id: string; q: string; a: string; patch?: Patch; show?: string[]; hide?: string[]; focus?: string[]; tags?: string[] };
export type IdeaInput = {
  id: string; title: string; objectives: number[]; explain: StepInput[]; examples: ExampleInput[]; asks: AskInput[];
  checks: (StepInput & { covers?: string[] })[]; recap: { points: string[]; traps: string[] };
};
export type Requires = { objectives: number[]; items: string[]; misconceptions: string[] };
export type IdeaIndex = {
  id: string; title: string; objectives: number[]; start: number; end: number; explain: [number, number];
  examples: { id: string; level: ExampleInput["level"]; title: string; start: number; end: number; trap?: string; covers: string[] }[];
  asks: AskInput[]; checks: { index: number; id: string; covers: string[]; tags: string[] }[];
  recap: { index: number; points: string[]; traps: string[] };
};
export type IdeaMeta = { plateId: string; requires?: Requires; ideas: IdeaIndex[] };
export type CompiledIdeas = { plate: PlateDef; meta: IdeaMeta };

const tagsOf = (i: unknown): string[] => {
  const x = i as { tag?: string; options?: { tag?: string }[]; targets?: { tag?: string }[]; distractors?: { tag?: string }[] } | undefined;
  return [...new Set([x?.tag, ...(x?.options ?? []).map((o) => o.tag), ...(x?.targets ?? []).map((o) => o.tag), ...(x?.distractors ?? []).map((o) => o.tag)].filter((t): t is string => !!t))];
};

/** Authored ideas → one plate timeline (explain, then each worked example's problem and lines, then checks, then recap) plus an index. */
export function defineIdeaPlate(input: { id: string; title: string; instances: unknown[]; bindings?: Record<string, string[]>; requires?: Requires; ideas: IdeaInput[] }): CompiledIdeas {
  const steps: Record<string, unknown>[] = [];
  const ideas: IdeaIndex[] = [];
  for (const idea of input.ideas) {
    const start = steps.length;
    for (const s of idea.explain) steps.push({ ...s, id: `${idea.id}-${s.id}`, kind: "explain", idea: idea.id });
    const explainEnd = steps.length - 1;
    const examples = idea.examples.map((ex) => {
      const s0 = steps.length;
      steps.push({ id: `${idea.id}-${ex.id}`, title: ex.title, kind: "work", idea: idea.id, note: ex.problem, patch: ex.setup, show: ex.show ?? [], hide: ex.hide ?? [] });
      ex.lines.forEach((ln, k) =>
        steps.push({ id: `${idea.id}-${ex.id}-l${k + 1}`, title: `${ex.title} · line ${k + 1}`, kind: "work", idea: idea.id, note: ln.text, focus: ln.focus ?? [], patch: ln.patch ?? {}, claims: ln.claims ?? [], ...(ln.latex ? { latex: ln.latex } : {}) }),
      );
      return { id: ex.id, level: ex.level, title: ex.title, start: s0, end: steps.length - 1, ...(ex.trap ? { trap: ex.trap } : {}), covers: ex.covers ?? [] };
    });
    const checks = idea.checks.map(({ covers, ...c }) => {
      steps.push({ ...c, id: `${idea.id}-${c.id}`, kind: "check", idea: idea.id });
      return { index: steps.length - 1, id: (c.interaction as { id: string }).id, covers: covers ?? [], tags: tagsOf(c.interaction) };
    });
    steps.push({ id: `${idea.id}-recap`, title: `Recap · ${idea.title}`, kind: "recap", idea: idea.id, note: idea.recap.points.join(" ") });
    ideas.push({ id: idea.id, title: idea.title, objectives: idea.objectives, start, end: steps.length - 1, explain: [start, explainEnd], examples, asks: idea.asks, checks, recap: { index: steps.length - 1, ...idea.recap } });
  }
  const plate = PlateDef.parse({ id: input.id, title: input.title, instances: input.instances, bindings: input.bindings ?? {}, steps });
  return { plate, meta: { plateId: plate.id, ...(input.requires ? { requires: input.requires } : {}), ideas } };
}

export function stepLocation(meta: IdeaMeta, index: number): string {
  const n = meta.ideas.findIndex((i) => index >= i.start && index <= i.end);
  if (n < 0) return "";
  const idea = meta.ideas[n]!;
  const head = `Idea ${n + 1} · ${idea.title}`;
  if (index <= idea.explain[1]) return `${head} · Explanation ${index - idea.start + 1} of ${idea.explain[1] - idea.start + 1}`;
  const e = idea.examples.findIndex((x) => index >= x.start && index <= x.end);
  if (e >= 0) {
    const line = index - idea.examples[e]!.start;
    return `${head} · Worked example ${e + 1} of ${idea.examples.length}${line ? ` · line ${line}` : ""}`;
  }
  const c = idea.checks.findIndex((x) => x.index === index);
  return c >= 0 ? `${head} · Check ${c + 1} of ${idea.checks.length}` : `${head} · Recap`;
}

/** Scrub-bar marks: each idea, each worked example, the first check, and the recap. */
export function timelineMarks(meta: IdeaMeta): { index: number; label: string }[] {
  return meta.ideas.flatMap((idea, n) => [
    { index: idea.start, label: `${n + 1} ${idea.title}` },
    ...idea.examples.map((ex, k) => ({ index: ex.start, label: `Example ${k + 1}` })),
    ...(idea.checks[0] ? [{ index: idea.checks[0].index, label: "Check" }] : []),
    { index: idea.recap.index, label: "Recap" },
  ]);
}

/** The value guarantee: every declared objective, item and misconception is taught, worked and checked. */
export function coverageGaps(meta: IdeaMeta): string[] {
  const r = meta.requires;
  if (!r) return ["no coverage requirements declared"];
  const gaps: string[] = [];
  for (const o of r.objectives) {
    const ideas = meta.ideas.filter((i) => i.objectives.includes(o));
    if (!ideas.length) gaps.push(`objective ${o}: no idea teaches it`);
    else if (!ideas.some((i) => i.explain[1] >= i.explain[0] && i.examples.length > 0 && i.checks.length > 0)) gaps.push(`objective ${o}: needs an explanation, a worked example and a check`);
  }
  for (const item of r.items)
    if (!meta.ideas.some((i) => i.examples.some((e) => e.covers.includes(item)) || i.checks.some((c) => c.covers.includes(item)))) gaps.push(`item ${item}: not worked or checked`);
  for (const tag of r.misconceptions) {
    if (!meta.ideas.some((i) => i.asks.some((a) => a.tags?.includes(tag)))) gaps.push(`misconception ${tag}: no ask`);
    if (!meta.ideas.some((i) => i.checks.some((c) => c.tags.includes(tag)))) gaps.push(`misconception ${tag}: no check detects it`);
  }
  return gaps;
}

/** The plate state an ask shows: the idea's final state with the ask's visibility and params applied. */
export function askState(plate: PlateDef, idea: IdeaIndex, ask: AskInput): SceneState {
  return applyStep(stateAt(plate, idea.end), {
    id: "ask", title: "ask", kind: "ask", note: ask.a, patch: ask.patch ?? {}, show: ask.show ?? [], hide: ask.hide ?? [], focus: ask.focus ?? [],
    view: "2d", claims: [], cues: [],
  } as PlateDef["steps"][number]);
}

export function validateIdeas(registry: Registry, { plate, meta }: CompiledIdeas): PlateIssue[] {
  const issues: PlateIssue[] = [];
  const evaluate = createEvaluator(registry, plate.instances);
  const warn = (message: string) => issues.push({ plate: plate.id, level: "warning", message });
  for (const idea of meta.ideas) {
    for (const ask of idea.asks) {
      const w = wordCount(ask.a);
      if (w > 80) warn(`ask ${ask.id} has ${w} words (budget 80)`);
      try {
        const frame = evaluate(askState(plate, idea, ask));
        for (const n of unbackedNumbers(ask.a, numbersOf(frame))) warn(`ask ${ask.id}: unbacked number "${n}"`);
      } catch (e) {
        issues.push({ plate: plate.id, level: "error", message: `ask ${ask.id} does not evaluate: ${(e as Error).message}` });
      }
    }
    for (const ex of idea.examples)
      if (ex.trap) for (const n of unbackedNumbers(ex.trap, numbersOf(evaluate(stateAt(plate, ex.end))))) warn(`example ${ex.id} trap: unbacked number "${n}"`);
  }
  return issues;
}
