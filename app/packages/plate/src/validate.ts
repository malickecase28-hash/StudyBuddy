import type { Registry } from "./component";
import { applyStep, diffStates, initialState, isEmptyDiff, type PlateDef } from "./plate";
import { createEvaluator, type SceneState } from "./scene";

export type PlateIssue = { plate: string; step?: string; level: "error" | "warning"; message: string };

const tokens = (s: string) => s.toLowerCase().match(/[a-z0-9\u00b5\u0370-\u03ff]+/g) ?? [];
export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
export function tokenOverlap(a: string, b: string): number {
  const ta = tokens(a);
  if (ta.length === 0) return 0;
  const tb = new Set(tokens(b));
  return ta.filter((t) => tb.has(t)).length / ta.length;
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
    let frame;
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
      const v = Number(frame[c.instance]!.model[c.readout]);
      if (!Number.isFinite(v) || Math.abs(v - c.value) > c.relTol * Math.max(Math.abs(c.value), 1e-12)) {
        add("error", `claim ${c.instance}.${c.readout} says ${c.value} ${c.unit} but the model gives ${v}`, step.id);
      }
    }
    const words = wordCount(step.note);
    if (words > 60) add("warning", `margin note has ${words} words (budget 60)`, step.id);
    if (prev && isEmptyDiff(diffStates(prev, state)) && !step.interaction && step.focus.length === 0 && step.cues.length === 0) {
      add("warning", "possible slide: the note changes but the plate does not", step.id);
    }
    if (step.narration && tokenOverlap(step.narration.transcript, step.note) > 0.6) {
      add("warning", "narration transcript repeats the margin note; narrate alongside the plate instead", step.id);
    }
    prev = state;
  });
  return issues;
}
