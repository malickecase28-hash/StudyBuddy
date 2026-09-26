import type { PlateDef } from "./plate";
import type { SceneState } from "./scene";

export type Overrides = Readonly<Record<string, { params?: Record<string, unknown>; visible?: boolean }>>;

/** Assessment steps lock forward travel: the furthest reachable step given answered interaction ids. */
export function lockIndex(plate: PlateDef, answered: ReadonlySet<string>): number {
  const i = plate.steps.findIndex((s) => s.interaction && !answered.has(s.interaction.id));
  return i < 0 ? plate.steps.length - 1 : i;
}

/** Close when within relTol of the truth, with the tolerance floored at relTol × 10% of the range (so a truth of 0 is gradable). */
export function gradePrediction(guess: number, truth: number, relTol: number, range: readonly [number, number]): "close" | "far" {
  const tol = relTol * Math.max(Math.abs(truth), 0.1 * Math.abs(range[1] - range[0]));
  return Math.abs(guess - truth) <= tol ? "close" : "far";
}

/** Learner edits layered over the authored state: params merged, visibility replaced; unknown ids ignored. */
export function applyOverrides(state: SceneState, overrides: Overrides): SceneState {
  const out: SceneState = { ...state };
  for (const [id, o] of Object.entries(overrides)) {
    const s = out[id];
    if (!s) continue;
    out[id] = { params: { ...s.params, ...(o.params ?? {}) }, visible: o.visible ?? s.visible };
  }
  return out;
}

/** Readouts the plate must not show yet: an unanswered predict-drag's target. */
export function hiddenReadouts(plate: PlateDef, index: number, answered: ReadonlySet<string>): { instance: string; readout: string }[] {
  const i = plate.steps[index]?.interaction;
  return i?.type === "predict-drag" && !answered.has(i.id) ? [{ instance: i.target.instance, readout: i.target.readout }] : [];
}

/** What the device reader speaks: the transcript if authored, else the note, then the speech of any equation this step shows or changes. */
export function readAloudText(plate: PlateDef, index: number): string {
  const step = plate.steps[index]!;
  const speech = plate.instances
    .filter((i) => i.component === "equation" && (step.show.includes(i.id) || i.id in step.patch))
    .map((i) => ({ ...i.params, ...(step.patch[i.id] ?? {}) }).speech)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
  return [step.narration?.transcript ?? step.note, ...speech].join(" ");
}
