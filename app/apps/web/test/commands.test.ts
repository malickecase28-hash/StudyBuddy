import { rankCommands } from "@forma/ui";
import { expect, it } from "vitest";
import { buildCommands } from "@/lib/commands";
import { conceptHref, course } from "@/lib/course";

const cmds = buildCommands({ dueReviews: 3 });

it("offers every unlocked concept in all four modes and no locked concept", () => {
  for (const c of course.concepts) {
    const mine = cmds.filter((x) => x.id.startsWith(`c:${c.id}:`));
    expect(mine, c.id).toHaveLength(c.locked ? 0 : 4);
    if (!c.locked) expect(mine.map((m) => m.action)).toContainEqual({ kind: "href", href: conceptHref(c.id, "solve") });
  }
});

it("includes tools, formulas and pages, and ranks a concept+mode query", () => {
  expect(cmds.some((c) => c.action.kind === "tool" && c.action.tool === "calculator")).toBe(true);
  expect(cmds.some((c) => c.group === "Formulas")).toBe(true);
  expect(cmds.find((c) => c.id === "p:/review")!.label).toBe("Due reviews (3)");
  expect(rankCommands("gauss sol", cmds)[0]!.id).toBe("c:em1.electrostatics.gauss-law:solve");
});
it("lists every question students ask as a searchable command", () => {
  const q = cmds.filter((c) => c.group === "Questions");
  expect(q.length).toBeGreaterThanOrEqual(8);
  expect(rankCommands("negative flux", cmds)[0]!.id).toBe("q:flux-surface:negative");
  expect(q.find((c) => c.id === "q:flux-surface:negative")!.action).toEqual({ kind: "href", href: conceptHref("em1.electrostatics.gauss-law", "learn", { lesson: "flux-surface", ask: "negative" }) });
});
