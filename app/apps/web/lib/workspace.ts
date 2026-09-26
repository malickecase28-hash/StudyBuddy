import type { Concept, LearnerState, Mode } from "@forma/engine";

export const MODES: readonly Mode[] = ["learn", "solve", "explore", "revise"];
export type WorkspaceParams = { mode: Mode; lessonId: string; returnTo?: string; snapshotId?: string; step?: number; blockId?: string };

/** URL → workspace state. Unknown values fall back; `return` must be a same-site path (no open redirect). */
export function parseWorkspaceParams(search: URLSearchParams, concept: Concept, learner: LearnerState): WorkspaceParams {
  const m = search.get("mode");
  const mode = MODES.includes(m as Mode) ? (m as Mode) : learner.workspace.lastMode;
  const l = search.get("lesson");
  const lessonId = l && concept.lessons.some((x) => x.id === l) ? l : concept.lessons[0]!.id;
  const snap = search.get("snapshot");
  const r = search.get("return");
  const st = search.get("step");
  const b = search.get("block");
  return {
    mode,
    lessonId,
    ...(r && r.startsWith("/") && !r.startsWith("//") ? { returnTo: r } : {}),
    ...(snap && learner.notebook.some((n) => n.id === snap && n.plate) ? { snapshotId: snap } : {}),
    ...(st !== null && /^\d+$/.test(st) ? { step: Number(st) } : {}),
    ...(b && concept.lessons.some((x) => x.blocks.some((k) => k.id === b)) ? { blockId: b } : {}),
  };
}
