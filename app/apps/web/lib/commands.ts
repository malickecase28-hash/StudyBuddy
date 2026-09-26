import type { ToolId } from "@forma/engine";
import type { Command } from "@forma/ui";
import { conceptHref, course, formulaSheet, ideaMetaFor } from "./course";
import { TOOLS } from "./tools";

export type PaletteCommand = Command & { action: { kind: "href"; href: string } | { kind: "tool"; tool: ToolId } };

const MODES = [["learn", "Learn"], ["solve", "Solve"], ["explore", "Explore"], ["revise", "Revise"]] as const;

export function buildCommands({ dueReviews }: { dueReviews: number }): PaletteCommand[] {
  const concepts = course.concepts
    .filter((c) => !c.locked)
    .flatMap((c) =>
      MODES.map(([m, label]) => ({ id: `c:${c.id}:${m}`, label: `${c.title} · ${label}`, group: "Concepts", keywords: `unit ${c.unit}`, action: { kind: "href" as const, href: conceptHref(c.id, m) } })),
    );
  const tools = TOOLS.map((t) => ({ id: `t:${t.id}`, label: t.label, group: "Tools", keywords: t.keywords, action: { kind: "tool" as const, tool: t.id } }));
  const formulas = formulaSheet.map((f) => ({ id: `f:${f.id}`, label: f.title, group: "Formulas", keywords: "formula equation", action: { kind: "tool" as const, tool: "formulas" as const } }));
  const questions = course.concepts.flatMap((c) =>
    c.lessons.flatMap((l) =>
      l.blocks.flatMap((b) => {
        const meta = b.type === "plate" ? ideaMetaFor(b.plateId) : undefined;
        return (meta?.ideas ?? []).flatMap((idea) =>
          idea.asks.map((a) => ({ id: `q:${meta!.plateId}:${a.id}`, label: a.q, group: "Questions", keywords: `${idea.title} ${a.a.slice(0, 80)}`, action: { kind: "href" as const, href: conceptHref(c.id, "learn", { lesson: l.id, block: b.id, ask: a.id }) } })),
        );
      }),
    ),
  );
  const pages = (
    [
      ["/", "Desk"], ["/courses", "Library"], [`/c/${course.id}`, `${course.title} overview`], ["/notebook", "Notebook"],
      ["/dashboard", "Progress dashboard"], ["/past-papers", "Past papers"], ["/review", `Due reviews (${dueReviews})`], ["/diagnostic", "Readiness check"],
    ] as const
  ).map(([href, label]) => ({ id: `p:${href}`, label, group: "Pages", action: { kind: "href" as const, href } }));
  return [...concepts, ...tools, ...formulas, ...questions, ...pages];
}
