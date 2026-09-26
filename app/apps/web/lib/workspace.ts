import type { Concept, LearnerState, Mode } from "@forma/engine";

export const MODES: readonly Mode[] = ["learn", "solve", "explore", "revise"];
export type WorkspaceParams = { mode: Mode; lessonId: string; returnTo?: string; snapshotId?: string; step?: number; blockId?: string };

/** The URL's mode if it is a real one, else the learner's last mode. */
export const currentMode = (search: URLSearchParams, lastMode: Mode): Mode => {
  const m = search.get("mode");
  return MODES.includes(m as Mode) ? (m as Mode) : lastMode;
};

const PROBE_ORIGIN = "https://forma.invalid";

/** A same-site path only. Browsers resolve "/\evil.com" and "/<tab>/evil.com" off-site, so resolve and compare origins. */
const sameSitePath = (r: string) => {
  if (!r.startsWith("/") || /[\\\u0000-\u001f]/.test(r)) return false;
  try {
    return new URL(r, PROBE_ORIGIN).origin === PROBE_ORIGIN;
  } catch {
    return false;
  }
};

/** URL → workspace state. Unknown values fall back; `return` must be a same-site path (no open redirect). */
export function parseWorkspaceParams(search: URLSearchParams, concept: Concept, learner: LearnerState): WorkspaceParams {
  const mode = currentMode(search, learner.workspace.lastMode);
  const l = search.get("lesson");
  const lessonId = l && concept.lessons.some((x) => x.id === l) ? l : concept.lessons[0]!.id;
  const snap = search.get("snapshot");
  const r = search.get("return");
  const st = search.get("step");
  const b = search.get("block");
  return {
    mode,
    lessonId,
    ...(r && sameSitePath(r) ? { returnTo: r } : {}),
    ...(snap && learner.notebook.some((n) => n.id === snap && n.plate) ? { snapshotId: snap } : {}),
    ...(st !== null && /^\d+$/.test(st) ? { step: Number(st) } : {}),
    ...(b && concept.lessons.some((x) => x.blocks.some((k) => k.id === b)) ? { blockId: b } : {}),
  };
}
