import type { Route } from "./schema/interactions";

export type RouteCtx = {
  outcome: "correct" | "incorrect";
  choice?: string;
  reason?: string;
  attempt: number;
  tag?: string;
  tags: Record<string, number>;
  mastery: (conceptId: string) => number;
};

function matches(r: Route, c: RouteCtx): boolean {
  const w = r.when;
  if (w.outcome !== "any" && w.outcome !== c.outcome) return false;
  if (w.choice && w.choice !== c.choice) return false;
  if (w.reason && w.reason !== c.reason) return false;
  if (w.attemptGte && c.attempt < w.attemptGte) return false;
  if (w.tag && c.tag !== w.tag && !(c.tags[w.tag] ?? 0)) return false;
  if (w.masteryBelow && c.mastery(w.masteryBelow.conceptId) >= w.masteryBelow.value) return false;
  return true;
}

/** Deterministic branching: the first authored route whose conditions all hold. */
export function pickRoute(routes: readonly Route[], ctx: RouteCtx): Route | null {
  return routes.find((r) => matches(r, ctx)) ?? null;
}
