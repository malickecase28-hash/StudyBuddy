import { Id, Interaction } from "@forma/engine";
import { z } from "zod";
import { clone, deepEqual, isLerpable } from "./lerp";
import type { SceneState } from "./scene";

export const Cue = z.object({
  t: z.number().nonnegative(),
  action: z.enum(["highlight", "show", "hide", "tween", "camera"]),
  target: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
});
export type Cue = z.infer<typeof Cue>;

export const Narration = z.object({
  transcript: z.string().min(1),
  captions: z.array(z.object({ t: z.number().nonnegative(), text: z.string() })).optional(),
  audio: z.object({ src: z.string().min(1), durationMs: z.number().positive() }).optional(),
  cues: z.array(Cue).default([]),
});

export const Claim = z.object({
  instance: z.string().min(1),
  readout: z.string().min(1),
  value: z.number(),
  unit: z.string(),
  relTol: z.number().positive().default(0.01),
});
export type Claim = z.infer<typeof Claim>;

const InstanceS = z.object({
  id: z.string().min(1),
  component: z.string().min(1),
  params: z.record(z.string(), z.unknown()),
  links: z.record(z.string(), z.string()).optional(),
  visible: z.boolean().default(false),
});

export const Step = z.object({
  id: Id,
  kind: z.enum(["explain", "work", "ask", "check", "recap"]).default("explain"),
  idea: z.string().optional(),
  latex: z.string().optional(),
  title: z.string().min(1),
  patch: z.record(z.string(), z.record(z.string(), z.unknown())).default({}),
  show: z.array(z.string()).default([]),
  hide: z.array(z.string()).default([]),
  focus: z.array(z.string()).default([]),
  view: z.enum(["2d", "3d"]).default("2d"),
  note: z.string().min(1),
  why: z.string().optional(),
  derivation: z.string().optional(),
  interaction: Interaction.optional(),
  claims: z.array(Claim).default([]),
  cues: z.array(Cue).default([]),
  narration: Narration.optional(),
});
export type Step = z.infer<typeof Step>;

export const PlateDef = z.object({
  id: Id,
  title: z.string().min(1),
  instances: z.array(InstanceS).min(1),
  bindings: z.record(z.string(), z.array(z.string())).default({}),
  steps: z.array(Step).min(1),
});
export type PlateDef = z.infer<typeof PlateDef>;

export function initialState(plate: PlateDef): SceneState {
  return Object.fromEntries(plate.instances.map((i) => [i.id, { params: clone(i.params), visible: i.visible }]));
}

export function applyStep(state: SceneState, step: Step): SceneState {
  const next = clone(state);
  const need = (id: string) => {
    const s = next[id];
    if (!s) throw new Error(`Unknown instance "${id}" in step "${step.id}"`);
    return s;
  };
  for (const [id, patch] of Object.entries(step.patch)) need(id).params = { ...need(id).params, ...clone(patch) };
  for (const id of step.show) need(id).visible = true;
  for (const id of step.hide) need(id).visible = false;
  for (const id of step.focus) need(id);
  return next;
}

const cache = new WeakMap<PlateDef, SceneState[]>();

/** Cumulative scene state after applying steps 0..index. */
export function stateAt(plate: PlateDef, index: number): SceneState {
  let states = cache.get(plate);
  if (!states) {
    states = [];
    let s = initialState(plate);
    for (const step of plate.steps) {
      s = applyStep(s, step);
      states.push(s);
    }
    cache.set(plate, states);
  }
  const i = Math.min(Math.max(0, Math.floor(index)), states.length - 1);
  return clone(states[i]!);
}

export type StepDiff = {
  enters: string[];
  exits: string[];
  tweens: { id: string; param: string; from: unknown; to: unknown }[];
  sets: { id: string; param: string; to: unknown }[];
};

export function diffStates(a: SceneState, b: SceneState): StepDiff {
  const d: StepDiff = { enters: [], exits: [], tweens: [], sets: [] };
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const sa = a[id];
    const sb = b[id];
    if (!sa || !sb) continue;
    if (!sa.visible && sb.visible) d.enters.push(id);
    if (sa.visible && !sb.visible) d.exits.push(id);
    for (const param of new Set([...Object.keys(sa.params), ...Object.keys(sb.params)])) {
      const from = sa.params[param];
      const to = sb.params[param];
      if (deepEqual(from, to)) continue;
      if (from !== undefined && to !== undefined && isLerpable(from, to)) d.tweens.push({ id, param, from, to });
      else d.sets.push({ id, param, to });
    }
  }
  return d;
}

export const isEmptyDiff = (d: StepDiff) => !d.enters.length && !d.exits.length && !d.tweens.length && !d.sets.length;
