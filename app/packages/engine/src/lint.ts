import { topoOrder } from "./graph";
import { toSI } from "./quantities";
import type { Block } from "./schema/blocks";
import type { AuthoredQuantity } from "./schema/common";
import type { Course } from "./schema/course";
import { walkBlocks } from "./walk";

export type LintIssue = { conceptId?: string; blockId?: string; message: string };

export function resolvesLessonRef(course: Course, ref: string): boolean {
  const [conceptId, lessonId] = ref.split("/");
  const c = course.concepts.find((x) => x.id === conceptId);
  return !!c && c.lessons.some((l) => l.id === lessonId);
}

function tagsIn(b: Block): string[] {
  const choiceTags = (opts: { tag?: string }[]) => opts.flatMap((o) => (o.tag ? [o.tag] : []));
  switch (b.type) {
    case "mcq":
      return [...choiceTags(b.options), ...choiceTags(b.selfExplain?.options ?? [])];
    case "predict":
      return choiceTags(b.options);
    case "identify":
      return choiceTags(b.targets);
    case "numeric":
    case "challenge":
      return choiceTags(b.distractors);
    case "step-solve":
      return b.steps.flatMap((s) => choiceTags(s.distractors));
    case "remediate":
      return [b.tag];
    default:
      return [];
  }
}

function quantitiesIn(b: Block): AuthoredQuantity[] {
  if (b.type === "numeric" || b.type === "challenge") return [b.answer, ...b.distractors];
  if (b.type === "step-solve") return b.steps.flatMap((s) => [s.answer, ...s.distractors]);
  return [];
}

export function lintCourse(course: Course): LintIssue[] {
  const issues: LintIssue[] = [];
  const ids = new Set(course.concepts.map((c) => c.id));
  try {
    topoOrder(course);
  } catch (e) {
    issues.push({ message: (e as Error).message });
  }

  for (const c of course.concepts) {
    const add = (message: string, blockId?: string) =>
      issues.push({ conceptId: c.id, ...(blockId ? { blockId } : {}), message });
    const declared = new Set(c.misconceptions.map((m) => m.tag));

    for (const p of c.prerequisites) if (!ids.has(p.conceptId)) add(`prerequisite ${p.conceptId} does not exist`);
    for (const m of c.misconceptions) if (!resolvesLessonRef(course, m.remediation)) add(`remediation ${m.remediation} does not resolve`);
    for (const r of c.rules) {
      if (r.when.type === "tagCount" && !declared.has(r.when.tag)) add(`rule ${r.id} uses undeclared tag ${r.when.tag}`);
      for (const eff of r.then) {
        if (eff.type === "offerRemediation" && !resolvesLessonRef(course, eff.lessonRef)) {
          add(`rule ${r.id} lessonRef ${eff.lessonRef} does not resolve`);
        }
      }
    }

    const seen = new Set<string>();
    for (const lesson of c.lessons) {
      walkBlocks(lesson.blocks, (b) => {
        if (seen.has(b.id)) add(`duplicate block id ${b.id}`, b.id);
        seen.add(b.id);
        for (const t of tagsIn(b)) if (!declared.has(t)) add(`tag ${t} is not declared in misconceptions`, b.id);
        if ((b.type === "mcq" || b.type === "predict") && !b.options.some((o) => o.correct)) {
          add(`${b.type} ${b.id} has no correct option`, b.id);
        }
        if (b.type === "identify" && !b.targets.some((o) => o.correct)) add(`identify ${b.id} has no correct target`, b.id);
        if (b.type === "order") {
          const itemIds = b.items.map((i) => i.id).sort().join();
          if ([...b.correctOrder].sort().join() !== itemIds) add(`order ${b.id}: correctOrder must be a permutation of item ids`, b.id);
        }
        if (b.type === "remediate" && !resolvesLessonRef(course, b.lessonRef)) {
          add(`remediate ${b.id} lessonRef ${b.lessonRef} does not resolve`, b.id);
        }
        const dims = new Set<string>();
        for (const q of quantitiesIn(b)) {
          try {
            dims.add(toSI(q.value, q.unit).dim);
          } catch {
            add(`unit "${q.unit}" cannot be parsed`, b.id);
          }
        }
        if (dims.size > 1) add(`answer and distractors have mixed dimensions in ${b.id}`, b.id);
      });
    }
  }
  return issues;
}
