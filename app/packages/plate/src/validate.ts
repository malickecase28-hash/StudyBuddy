import type { Registry } from "./component";
import { applyStep, diffStates, initialState, isEmptyDiff, type PlateDef } from "./plate";
import { createEvaluator, type Frame, type SceneState } from "./scene";
import { frameAt } from "./timeline";

export type PlateIssue = { plate: string; step?: string; level: "error" | "warning"; message: string };

const tokens = (s: string) => s.toLowerCase().match(/[a-z0-9\u00b5\u0370-\u03ff]+/g) ?? [];
export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
export function tokenOverlap(a: string, b: string): number {
  const ta = tokens(a);
  if (ta.length === 0) return 0;
  const tb = new Set(tokens(b));
  return ta.filter((t) => tb.has(t)).length / ta.length;
}

/** Every finite number found anywhere in a value (params, models, claims). */
export function numbersOf(x: unknown, out: number[] = []): number[] {
  if (typeof x === "number") {
    if (Number.isFinite(x)) out.push(x);
  } else if (Array.isArray(x)) x.forEach((y) => numbersOf(y, out));
  else if (x && typeof x === "object") Object.values(x).forEach((y) => numbersOf(y, out));
  return out;
}

const WITH_UNIT = /([−-]?\d+(?:\.\d+)?)\s*(µC\/m²|µC\/m\^2|nC\/m²|nC\/m\^2|V\/m|µC|nC|m²|m\^2|m)(?![\w/²^])/g;

/** Numbers followed by a physics unit that no candidate value matches at the written precision (or within 0.5%). */
export function unbackedNumbers(text: string, candidates: readonly number[]): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(WITH_UNIT)) {
    const raw = m[1]!.replace("−", "-");
    const value = Number(raw);
    const decimals = (raw.split(".")[1] ?? "").length;
    const backed = candidates.some((c) => Math.abs(Number(c.toFixed(decimals)) - value) < 1e-9 || Math.abs(c - value) <= 0.005 * Math.abs(value));
    if (!backed) out.push(m[0].replace(/\s+/g, " "));
  }
  return out;
}

/** Structural, physics and text-discipline checks for one plate. Never throws. */
export function validatePlate(registry: Registry, plate: PlateDef): PlateIssue[] {
  const issues: PlateIssue[] = [];
  const add = (level: PlateIssue["level"], message: string, step?: string) => issues.push({ plate: plate.id, level, message, ...(step ? { step } : {}) });
  const ids = new Set(plate.instances.map((i) => i.id));

  for (const inst of plate.instances) {
    if (!registry.has(inst.component)) {
      add("error", `Unknown component "${inst.component}" for instance "${inst.id}"`);
      continue;
    }
    const def = registry.get(inst.component);
    for (const [name, target] of Object.entries(inst.links ?? {})) {
      if (!def.links?.includes(name)) add("error", `instance "${inst.id}" has undeclared link "${name}"`);
      if (!ids.has(target)) add("error", `instance "${inst.id}" links to unknown instance "${target}"`);
    }
  }
  for (const [key, targets] of Object.entries(plate.bindings)) {
    for (const t of targets) if (!ids.has(t)) add("error", `binding "${key}" targets unknown instance "${t}"`);
  }
  if (issues.some((i) => i.level === "error")) return issues;

  const evaluate = createEvaluator(registry, plate.instances);
  const componentOf = (id: string) => registry.get(plate.instances.find((x) => x.id === id)!.component);

  /** Every instance/readout/param an interaction or cue names must exist; a reveal must evaluate. */
  const checkRefs = (step: PlateDef["steps"][number], state: SceneState) => {
    const known = (id: string, what: string) => {
      if (ids.has(id)) return true;
      add("error", `${what} targets unknown instance "${id}"`, step.id);
      return false;
    };
    const i = step.interaction;
    if (i?.type === "predict-drag" && known(i.target.instance, "predict-drag")) {
      const unit = componentOf(i.target.instance).readouts[i.target.readout];
      if (unit === undefined) add("error", `predict-drag readout ${i.target.instance}.${i.target.readout} is not a declared readout`, step.id);
      else if (unit !== i.unit) add("error", `predict-drag uses unit ${i.unit} but ${i.target.instance}.${i.target.readout} is in ${unit}`, step.id);
      const revealed = structuredClone(state);
      let ok = true;
      for (const [id, patch] of Object.entries(i.reveal)) {
        if (!known(id, "reveal")) ok = false;
        else revealed[id]!.params = { ...revealed[id]!.params, ...patch };
      }
      if (ok) {
        try {
          evaluate(revealed);
        } catch (e) {
          add("error", `reveal patch does not evaluate: ${(e as Error).message}`, step.id);
        }
      }
    }
    if (i?.type === "place" && known(i.handle.instance, "place handle") && !componentOf(i.handle.instance).handles.includes(i.handle.param)) {
      add("error", `place handle ${i.handle.instance}.${i.handle.param} is not a declared handle`, step.id);
    }
    for (const c of [...step.cues, ...(step.narration?.cues ?? [])]) if (c.action !== "camera") known(c.target, `${c.action} cue`);
  };

  let prev: SceneState | null = null;
  let running = initialState(plate);
  let broken = false;
  plate.steps.forEach((step) => {
    if (broken) return;
    let state: SceneState;
    try {
      // Build states step by step so an error is attributed to the step that caused it.
      state = applyStep(running, step);
      running = state;
    } catch (e) {
      add("error", (e as Error).message, step.id);
      broken = true;
      return;
    }
    checkRefs(step, state);
    let frame: Frame;
    try {
      frame = evaluate(state);
    } catch (e) {
      add("error", `evaluation failed: ${(e as Error).message}`, step.id);
      return;
    }
    for (const c of step.claims) {
      const inst = plate.instances.find((x) => x.id === c.instance);
      if (!inst) {
        add("error", `claim targets unknown instance "${c.instance}"`, step.id);
        continue;
      }
      const unit = registry.get(inst.component).readouts[c.readout];
      if (unit === undefined) {
        add("error", `claim ${c.instance}.${c.readout} is not a declared readout`, step.id);
        continue;
      }
      if (unit !== c.unit) {
        add("error", `claim ${c.instance}.${c.readout} uses unit ${c.unit} but the readout is in ${unit}`, step.id);
        continue;
      }
      const raw = frame[c.instance]!.model[c.readout];
      const v = typeof raw === "number" ? raw : Number.NaN;
      if (!Number.isFinite(v) || Math.abs(v - c.value) > c.relTol * Math.max(Math.abs(c.value), 1e-12)) {
        add("error", `claim ${c.instance}.${c.readout} says ${c.value} ${c.unit} but the model gives ${v}`, step.id);
      }
    }
    const candidates = [...numbersOf(frame), ...step.claims.map((c) => c.value)];
    for (const n of unbackedNumbers(step.note, candidates)) add("warning", `unbacked number "${n}" in the note`, step.id);
    const words = wordCount(step.note);
    if (words > 180) add("warning", `margin note has ${words} words (budget 180)`, step.id);
    if (step.kind !== "recap" && prev && isEmptyDiff(diffStates(prev, state)) && !step.interaction && step.focus.length === 0 && step.cues.length === 0) {
      add("warning", "possible slide: the note changes but the plate does not", step.id);
    }
    if (step.narration && tokenOverlap(step.narration.transcript, step.note) > 0.6) {
      add("warning", "narration transcript repeats the margin note; narrate alongside the plate instead", step.id);
    }
    prev = state;
  });
  if (issues.some((i) => i.level === "error")) return issues;
  // Mid-transition frames mix interpolated params; they must evaluate too (e.g. integer params mid-tween).
  plate.steps.forEach((step, k) => {
    if (k === 0) return;
    try {
      evaluate(frameAt(plate, k - 0.5).state);
    } catch (e) {
      add("error", `transition into this step does not evaluate: ${(e as Error).message}`, step.id);
    }
  });
  return issues;
}
