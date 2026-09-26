import { clamp01, clone, lerpValue } from "./lerp";
import { diffStates, stateAt, type Cue, type PlateDef } from "./plate";
import type { SceneState } from "./scene";

export const PHASES = { exit: [0, 0.25], tween: [0.2, 0.8], enter: [0.45, 1], focusAt: 0.9 } as const;

export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const win = (f: number, [a, b]: readonly [number, number]) => clamp01((f - a) / (b - a));

export type TimelineFrame = {
  state: SceneState;
  appear: Record<string, number>;
  opacity: Record<string, number>;
  focus: string[];
  stepIndex: number;
  fraction: number;
};

const settled = (plate: PlateDef, i: number): TimelineFrame => {
  const state = stateAt(plate, i);
  const vis = (v: boolean) => (v ? 1 : 0);
  return {
    state,
    appear: Object.fromEntries(Object.entries(state).map(([id, s]) => [id, vis(s.visible)])),
    opacity: Object.fromEntries(Object.entries(state).map(([id, s]) => [id, vis(s.visible)])),
    focus: plate.steps[i]!.focus,
    stepIndex: i,
    fraction: 0,
  };
};

/** The plate at a continuous timeline position: whole numbers are steps, fractions are transitions. */
export function frameAt(plate: PlateDef, pos: number, opts: { reducedMotion?: boolean } = {}): TimelineFrame {
  const last = plate.steps.length - 1;
  const p = Number.isNaN(pos) ? 0 : Math.min(Math.max(pos, 0), last);
  const i = Math.floor(p);
  const f = p - i;
  if (f === 0 || i >= last) return settled(plate, i);
  if (opts.reducedMotion) return settled(plate, i + 1);

  const a = stateAt(plate, i);
  const b = stateAt(plate, i + 1);
  const d = diffStates(a, b);
  const state = clone(a);
  const base = settled(plate, i);
  const appear = { ...base.appear };
  const opacity = { ...base.opacity };

  const tw = ease(win(f, PHASES.tween));
  for (const t of d.tweens) state[t.id]!.params[t.param] = lerpValue(t.from, t.to, tw);
  if (f >= 0.5) for (const s of d.sets) state[s.id]!.params[s.param] = clone(s.to);
  for (const id of d.enters) {
    const e = ease(win(f, PHASES.enter));
    state[id]!.visible = e > 0;
    appear[id] = e;
    opacity[id] = e > 0 ? 1 : 0;
  }
  for (const id of d.exits) {
    const x = win(f, PHASES.exit);
    opacity[id] = 1 - x;
    state[id]!.visible = x < 1;
  }
  return { state, appear, opacity, focus: f >= PHASES.focusAt ? plate.steps[i + 1]!.focus : plate.steps[i]!.focus, stepIndex: i, fraction: f };
}

/** Apply a time-based cue track (e.g. driven by narration audio) on top of a step's state. */
export function applyCues(state: SceneState, cues: readonly Cue[], tMs: number): { state: SceneState; highlight: string[]; camera: Record<string, unknown> | null } {
  const next = clone(state);
  const highlight = new Set<string>();
  let camera: Record<string, unknown> | null = null;
  for (const c of [...cues].sort((x, y) => x.t - y.t)) {
    if (c.t > tMs) break;
    const target = next[c.target];
    switch (c.action) {
      case "show":
        if (target) target.visible = true;
        break;
      case "hide":
        if (target) target.visible = false;
        break;
      case "highlight": {
        const dur = Number(c.params.durationMs ?? 1200);
        if (tMs < c.t + dur) highlight.add(c.target);
        break;
      }
      case "tween": {
        if (!target) break;
        const param = String(c.params.param);
        const dur = Number(c.params.durationMs ?? 600);
        target.params[param] = lerpValue(target.params[param], c.params.to, ease(clamp01((tMs - c.t) / dur)));
        break;
      }
      case "camera":
        camera = c.params;
        break;
    }
  }
  return { state: next, highlight: [...highlight], camera };
}
