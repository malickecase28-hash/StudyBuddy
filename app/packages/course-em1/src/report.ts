import { walkBlocks, type Block, type Concept, type Course } from "@studybuddy/engine";

/** The spec's per-concept publish checklist (§6.4), computed from the content itself. */
export const CHECKS = [
  "objectives",
  "prerequisites mapped",
  "intuition",
  "formal statement",
  "visual",
  "interaction",
  "misconceptions + remediation",
  "practice",
  "assessment mapping",
  "sources",
  "advanced path",
] as const;
export type Check = (typeof CHECKS)[number];

const blocksOf = (c: Concept): Block[] => {
  const out: Block[] = [];
  for (const l of c.lessons) walkBlocks(l.blocks, (b) => out.push(b));
  return out;
};

export function publishChecklist(course: Course, c: Concept): Record<Check, boolean> {
  const blocks = blocksOf(c);
  const has = (...types: Block["type"][]) => blocks.some((b) => types.includes(b.type));
  const lessonIds = new Set(course.concepts.flatMap((x) => x.lessons.map((l) => `${x.id}/${l.id}`)));
  return {
    objectives: c.objectives.length > 0,
    "prerequisites mapped": c.prerequisites.length > 0 || c.id === "em1.math.vectors",
    intuition: has("prose", "predict"),
    "formal statement": has("equation-build") || blocks.some((b) => b.type === "prose" && b.text.includes("$")),
    visual: has("sim-3d", "sim-2d", "manipulate", "figure"),
    interaction: has("predict", "manipulate", "branch", "order", "identify"),
    "misconceptions + remediation": c.misconceptions.length > 0 && c.misconceptions.every((m) => lessonIds.has(m.remediation)),
    practice: has("numeric", "step-solve", "challenge"),
    "assessment mapping": c.examLinks.length > 0,
    sources: c.sources.length > 0,
    "advanced path": blocks.some((b) => b.type === "branch" && b.options.some((o) => o.id === "advanced")),
  };
}

/** Markdown table of the checklist for every unlocked concept. */
export function publishReport(course: Course): string {
  const rows = course.concepts
    .filter((c) => !c.locked)
    .map((c) => {
      const r = publishChecklist(course, c);
      const passed = CHECKS.filter((k) => r[k]).length;
      return `| ${c.title} | ${c.status} | ${CHECKS.map((k) => (r[k] ? "✓" : "·")).join(" | ")} | ${passed}/${CHECKS.length} |`;
    });
  return [
    `| Concept | Status | ${CHECKS.join(" | ")} | Score |`,
    `|---|---|${CHECKS.map(() => ":-:").join("|")}|:-:|`,
    ...rows,
  ].join("\n");
}
