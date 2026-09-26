# Forma Plan D: Teaching Engine (Explain → Work → Ask → Check) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach ideas properly. Add:
- idea-structured plate lessons, compiled from authored `explain / examples / asks / checks / recap` into one plate timeline;
- line-stepped worked examples;
- "questions students ask";
- a check gate with remediation;
- recap cards and a revision sheet;
- a coverage test;
- an exact-numbers lint;
- the components needed to teach flux.

Prove it all with one fully built idea, "Flux through a surface".

**Architecture:**
- `defineIdeaPlate()` (in `@forma/plate`) flattens ideas into ordinary `PlateDef` steps tagged with `kind` and `idea`, and returns an `IdeaMeta` index (step ranges, examples, asks, checks, recap, coverage requirements). The existing timeline, overrides, snapshots, player and validator all keep working.
- New lints make "text teaches" safe:
  - **Word budgets:** 180 words for steps and 80 for asks.
  - **Unbacked numbers:** any number with a physics unit in a note, ask or trap must equal a claim, a param or a model readout on that plate state.
- `coverageGaps(meta)` enforces the value guarantee.
- The web player reads `IdeaMeta` to show the location, the asks list, traps, the check gate and remediation, and recap cards.

**Tech Stack:** TypeScript, Zod 4, Vitest 5, Next.js 16 / React 19, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-09-25-forma-teaching-depth-desk-tools-design.md` §1, §3. It amends `2026-09-25-forma-identity-shell-plate-engine-design.md` §4.2, §5 and "Text discipline".

## Global Constraints

- **Word budgets:** explain, work, check and recap steps ≤ 180 words (lint warning); asks ≤ 80.
  - The "possible slide" lint applies to explain and work steps; recap steps are exempt.
- **Exactness:**
  - Every number followed by a physics unit (µC, nC, µC/m², nC/m², V/m, m², m) in a step note, ask answer or trap must be backed by a claim, param or model readout of that plate state. Otherwise the validator warns, and the course test treats any warning as a failure.
  - Worked-example answers come from claims or templates, never from free text alone.
- **Check gate:**
  - A check step (`kind: "check"`) unlocks the timeline only when it is answered correctly. A prediction unlocks on commit.
  - After 2 misses the learner sees a remediation: a worked example with new numbers (template checks), or links back to the idea's worked examples. Then they retry.
- **Coverage:** every declared objective has ≥ 1 explain, ≥ 1 example and ≥ 1 check. Every declared item is worked or checked. Every declared misconception has ≥ 1 ask and ≥ 1 check that detects it.
- **Tone:** no streaks or points. Tokens only for colour. Keyboard operable. Axe clean in both themes.
- **Commands** run from `F:\StudyBuddy\app` unless stated. Commit after each task.

## Review Focus

1. **A check answered wrongly in an earlier session** must not unlock the gate after a reload; only a correct answer does (predictions excepted). Tested in Task 7 (`answeredFromHistory` for `kind: "check"`).
2. **An ask preview or remediation shown while the learner has overrides** must not destroy their edits. "Back to the step" returns to exactly their setup. Tested in Task 10 (e2e).
3. **Numbers written with fewer decimals than the model** (e.g. "−2.6 µC" for −2.598…) are accepted; a genuinely wrong number ("10.4 µC" when nothing is 10.4) is flagged. Tested in Task 2.
4. **Recap cards are saved once per idea**, not on every revisit, and survive a reload. Tested in Task 10.
5. **Long timelines** (dozens of steps) stay usable: the scrub bar shows idea/example/check marks, not one tick per step. Tested in Task 8 (unit) and Task 10 (e2e).

---

## File Structure

```
app/packages/plate/src/plate.ts            Step gains kind, idea, latex
app/packages/plate/src/validate.ts          180-word budget by kind; recap exempt from slide; unbackedNumbers lint
app/packages/plate/src/ideas.ts             defineIdeaPlate, IdeaMeta, stepLocation, timelineMarks, coverageGaps, validateIdeas
app/packages/plate/src/components/em.ts     + uniform-field, flat-patch, vector, patch-tiling
app/packages/plate/test/{kinds,numbers,ideas,flux-components}.test.ts
app/packages/engine/src/templates.ts        TemplateDef.worked, Variant.worked
app/packages/engine/src/schema/interactions.ts  numeric.template
app/packages/course-em1/src/templates.ts    + flux-flat-patch
app/packages/course-em1/src/plates/flux-surface.ts   the proof idea
app/packages/course-em1/src/{checks,index}.ts, src/plates/index.ts, src/concepts/gauss-law.ts
app/packages/course-em1/test/{ideas,templates}.test.ts
app/packages/ui/src/primitives.tsx          Timeline marks
app/apps/web/components/plate/{views2d,idea}.tsx, PlatePlayer.tsx, interactions.tsx
app/apps/web/lib/{playback,workspace,commands,course}.ts
app/apps/web/app/c/[course]/[concept]/sheet/page.tsx
app/apps/web/e2e/ideas.spec.ts
```

---

### Task 1: Step kinds and budgets

**Files:**
- Modify: `app/packages/plate/src/plate.ts`, `app/packages/plate/src/validate.ts`, `app/packages/plate/test/validate.test.ts`
- Test: `app/packages/plate/test/kinds.test.ts`

**Interfaces:**
- Produces: `Step` gains `kind: "explain" | "work" | "ask" | "check" | "recap"` (default `"explain"`), `idea?: string` and `latex?: string`. The word budget is 180 for every step. Recap steps never raise "possible slide".

- [ ] **Step 1: Write the failing test**: `app/packages/plate/test/kinds.test.ts`

```ts
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { defineComponent, PlateDef, Registry, validatePlate } from "../src";

const Src = defineComponent({ id: "src", params: z.object({ q: z.number() }), model: (p) => ({ total: p.q }), handles: [], readouts: { total: "µC" } });
const reg = new Registry().register(Src);
const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const mk = (steps: unknown[]) => PlateDef.parse({ id: "p", title: "P", instances: [{ id: "a", component: "src", params: { q: 2 } }], steps });

describe("step kinds", () => {
  it("defaults to explain and keeps idea and latex", () => {
    const p = mk([{ id: "s1", title: "t", show: ["a"], note: "n", idea: "i1", latex: "x" }]);
    expect(p.steps[0]).toMatchObject({ kind: "explain", idea: "i1", latex: "x" });
  });
  it("allows 180 words per step and warns above", () => {
    const ok = validatePlate(reg, mk([{ id: "s1", title: "t", show: ["a"], note: words(170) }]));
    expect(ok.filter((i) => /words/.test(i.message))).toEqual([]);
    const long = validatePlate(reg, mk([{ id: "s1", title: "t", show: ["a"], note: words(190) }]));
    expect(long.map((i) => i.message)).toContainEqual(expect.stringMatching(/190 words \(budget 180\)/));
  });
  it("never calls a recap step a possible slide", () => {
    const p = mk([
      { id: "s1", title: "t", show: ["a"], note: "n" },
      { id: "s2", title: "t", kind: "recap", note: "Summary." },
    ]);
    expect(validatePlate(reg, p).filter((i) => /possible slide/.test(i.message))).toEqual([]);
  });
});
```

In `test/validate.test.ts`, change the long-note fixture from 70 to 190 words (`Array.from({ length: 190 }, …)`) and its expectation from `/70 words/` to `/190 words/`.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/plate/test/kinds.test.ts`
Expected: FAIL (`kind` is stripped; budget is 60).

- [ ] **Step 3: Implement**
- **`plate.ts`:** in `Step`, add after `id`:

```ts
  kind: z.enum(["explain", "work", "ask", "check", "recap"]).default("explain"),
  idea: z.string().optional(),
  latex: z.string().optional(),
```

- **`validate.ts`:**
  - replace `if (words > 60) add("warning", \`margin note has ${words} words (budget 60)\`, step.id);` with `if (words > 180) add("warning", \`margin note has ${words} words (budget 180)\`, step.id);`
  - add `step.kind !== "recap" &&` at the start of the possible-slide condition.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): step kinds (explain/work/ask/check/recap), 180-word budget, recap exempt from slide lint"
```

---

### Task 2: The unbacked-numbers lint

**Files:**
- Modify: `app/packages/plate/src/validate.ts`
- Test: `app/packages/plate/test/numbers.test.ts`

**Interfaces:**
- Produces:
  - `numbersOf(x: unknown): number[]`: every finite number found deep in params and models
  - `unbackedNumbers(text: string, candidates: readonly number[]): string[]`
  - `validatePlate` warns `unbacked number "…" in the note` per step, using that step's claims plus every number in its evaluated frame

- [ ] **Step 1: Write the failing test**: `app/packages/plate/test/numbers.test.ts`

```ts
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { defineComponent, numbersOf, PlateDef, Registry, unbackedNumbers, validatePlate } from "../src";

describe("unbackedNumbers", () => {
  it("accepts numbers that match a candidate at the written precision", () => {
    expect(unbackedNumbers("D = 3 µC/m² over 4 m² gives 12 µC", [3, 4, 12])).toEqual([]);
    expect(unbackedNumbers("about −2.6 µC", [-2.598076])).toEqual([]);
    expect(unbackedNumbers("a 2 m square", [2])).toEqual([]);
    expect(unbackedNumbers("Ψ = 10.93 µC", [10.928203])).toEqual([]);
  });
  it("flags a number with a unit that nothing on the plate backs", () => {
    expect(unbackedNumbers("Ψ = 6 µC, not 10.4 µC", [6])).toEqual(["10.4 µC"]);
    expect(unbackedNumbers("E = 4494 V/m", [4493.8])).toEqual([]);
    expect(unbackedNumbers("E = 4500 V/m", [4493.8])).toEqual(["4500 V/m"]);
  });
  it("ignores unitless numbers, angles and vector components", () => {
    expect(unbackedNumbers("cos 60° = 0.5, D = 4x̂ + 3ẑ, 3 × 1 × 0.5", [])).toEqual([]);
  });
  it("collects numbers deep inside params and models", () => {
    expect(numbersOf({ a: 1, b: [2, { c: 3 }], d: "4", e: Number.NaN }).sort()).toEqual([1, 2, 3]);
  });
});

describe("validatePlate number lint", () => {
  const Src = defineComponent({ id: "src", params: z.object({ q: z.number() }), model: (p) => ({ total: p.q * 2 }), handles: [], readouts: { total: "µC" } });
  const reg = new Registry().register(Src);
  it("warns on a step note number that the plate state does not back", () => {
    const p = PlateDef.parse({
      id: "p", title: "P", instances: [{ id: "a", component: "src", params: { q: 2 } }],
      steps: [{ id: "s1", title: "t", show: ["a"], note: "q = 2 µC, doubled gives 4 µC, not 5 µC." }],
    });
    expect(validatePlate(reg, p).map((i) => i.message)).toEqual([expect.stringMatching(/unbacked number "5 µC"/)]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/plate/test/numbers.test.ts`
Expected: FAIL (`unbackedNumbers` is not exported).

- [ ] **Step 3: Implement**: in `validate.ts`, add (exported):

```ts
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
```

In `validatePlate`, after the claims loop, add:

```ts
    const candidates = [...numbersOf(frame), ...step.claims.map((c) => c.value)];
    for (const n of unbackedNumbers(step.note, candidates)) add("warning", `unbacked number "${n}" in the note`, step.id);
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/plate packages/course-em1 && pnpm typecheck`
Expected: PASS. The course plates must still have no warnings. If a Plan A/B note trips the lint, the text is wrong or imprecise: fix the **note** (e.g. write the value the model gives), never the lint.

- [ ] **Step 5: Commit**

```bash
git add packages/plate packages/course-em1 && git commit -m "feat(plate): unbacked-numbers lint: every unit-bearing number must match the plate state"
```

---

### Task 3: Flux-teaching components

**Files:**
- Modify: `app/packages/plate/src/components/em.ts`
- Test: `app/packages/plate/test/flux-components.test.ts`

**Interfaces:**
- Produces (added to `emComponents`):
  - `uniform-field`
    - params `{ Dx = 3, Dz = 0, spacing = 0.45 }` (µC/m², m)
    - model `{ D: Vec3 (µC/m²), magnitude, directionDeg }`
    - readouts `{ magnitude: "µC/m^2" }`
    - handles `["Dx", "Dz"]`
  - `flat-patch` (link `field`)
    - params `{ center = [0,0,0], size = 1, depth?, normalAngle = 0 (° from +x in the x–z plane), showNormal = true, showShadow = false }`
    - model `{ n, area, Dn, dPsi, theta, shadow }`
    - readouts `{ dPsi: "µC", Dn: "µC/m^2", area: "m^2", shadow: "m^2", theta: "°" }`
    - handles `["normalAngle", "size", "center"]`
  - `vector`
    - params `{ from, to, label, tone = "ink", arcTo? }`
    - model `{}`
  - `patch-tiling` (link `charges`)
    - params `{ shape: "sphere" | "cube" = "sphere", center, size = 1, n = 2 }`
    - model `{ sum (µC), count, segments: { p, dn }[] }`
    - readouts `{ sum: "µC", count: "" }`
    - handles `["n"]`

- [ ] **Step 1: Write the failing test**: `app/packages/plate/test/flux-components.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const frameOf = (patch: Record<string, unknown>, field: Record<string, unknown> = {}) => {
  const p = PlateDef.parse({
    id: "t", title: "t",
    instances: [
      { id: "field", component: "uniform-field", params: field, visible: true },
      { id: "patch", component: "flat-patch", params: patch, links: { field: "field" }, visible: true },
    ],
    steps: [{ id: "s1", title: "t", note: "n" }],
  });
  return createEvaluator(reg, p.instances)(stateAt(p, 0));
};

describe("flat-patch in a uniform field", () => {
  it("square-on: dΨ = |D| A", () => {
    const m = frameOf({ size: 1, normalAngle: 0 }, { Dx: 3 }).patch!.model;
    expect(m.dPsi).toBeCloseTo(3, 12);
    expect(m.area).toBe(1);
    expect(m.theta).toBeCloseTo(0, 9);
  });
  it("tilted 60°: dΨ = |D| A cos θ and the shadow is A cos θ", () => {
    const m = frameOf({ size: 1, normalAngle: 60 }, { Dx: 3 }).patch!.model;
    expect(m.dPsi).toBeCloseTo(1.5, 12);
    expect(m.shadow).toBeCloseTo(0.5, 12);
    expect(m.theta).toBeCloseTo(60, 9);
  });
  it("against the normal the flux is negative", () => {
    expect(frameOf({ size: 1, normalAngle: 150 }, { Dx: 3 }).patch!.model.dPsi as number).toBeCloseTo(-3 * Math.sqrt(3) / 2, 12);
  });
  it("vector D and a rectangular patch: dΨ = (D·n̂) a b", () => {
    const m = frameOf({ size: 3, depth: 0.5, normalAngle: 90 }, { Dx: 4, Dz: 3 }).patch!.model;
    expect(m.Dn).toBeCloseTo(3, 12);
    expect(m.area).toBeCloseTo(1.5, 12);
    expect(m.dPsi).toBeCloseTo(4.5, 12);
  });
  it("uniform-field magnitude and direction", () => {
    const f = frameOf({}, { Dx: 2, Dz: 2 }).field!.model;
    expect(f.magnitude).toBeCloseTo(2 * Math.SQRT2, 12);
    expect(f.directionDeg).toBeCloseTo(45, 12);
  });
});

describe("patch-tiling", () => {
  it("the patch sum converges to the enclosed charge", () => {
    const p = PlateDef.parse({
      id: "t", title: "t",
      instances: [
        { id: "q", component: "charges", params: { items: [{ id: "a", kind: "point", q: 2, pos: [0.3, 0, 0.2] }] }, visible: true },
        { id: "tiles", component: "patch-tiling", params: { n: 24 }, links: { charges: "q" }, visible: true },
      ],
      steps: [{ id: "s1", title: "t", note: "n" }],
    });
    const m = createEvaluator(reg, p.instances)(stateAt(p, 0)).tiles!.model;
    expect(m.sum as number).toBeCloseTo(2, 4);
    expect(m.count).toBe(24 * 48);
    expect((m.segments as unknown[]).length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/plate/test/flux-components.test.ts`
Expected: FAIL (`Unknown component: uniform-field`).

- [ ] **Step 3: Implement**: in `components/em.ts`:
  - add `fluxThrough` to the `@forma/physics` import;
  - add the definitions below;
  - append `UniformField, FlatPatch, Vector, PatchTiling` to `emComponents`.

```ts
export const UniformField = defineComponent({
  id: "uniform-field",
  params: z.object({ Dx: z.number().default(3), Dz: z.number().default(0), spacing: z.number().positive().default(0.45) }),
  model: (p) => {
    const D: Vec3 = [p.Dx, 0, p.Dz];
    return { D, magnitude: norm(D), directionDeg: (Math.atan2(p.Dz, p.Dx) * 180) / Math.PI };
  },
  handles: ["Dx", "Dz"],
  readouts: { magnitude: "µC/m^2" },
});

export const FlatPatch = defineComponent({
  id: "flat-patch",
  params: z.object({
    center: V3.default([0, 0, 0]),
    size: z.number().positive().default(1),
    depth: z.number().positive().optional(),
    normalAngle: z.number().default(0),
    showNormal: z.boolean().default(true),
    showShadow: z.boolean().default(false),
  }),
  model: (p, ctx) => {
    const D = ctx.link("field").model.D as Vec3;
    const a = (p.normalAngle * Math.PI) / 180;
    const n: Vec3 = [Math.cos(a), 0, Math.sin(a)];
    const area = p.size * (p.depth ?? p.size);
    const Dn = dot(D, n);
    const mag = norm(D);
    const theta = mag > 0 ? (Math.acos(Math.max(-1, Math.min(1, Dn / mag))) * 180) / Math.PI : null;
    return { n, area, Dn, dPsi: Dn * area, theta, shadow: mag > 0 ? (area * Math.abs(Dn)) / mag : 0 };
  },
  handles: ["normalAngle", "size", "center"],
  readouts: { dPsi: "µC", Dn: "µC/m^2", area: "m^2", shadow: "m^2", theta: "°" },
  links: ["field"],
});

export const Vector = defineComponent({
  id: "vector",
  params: z.object({
    from: V3,
    to: V3,
    label: z.string().min(1),
    tone: z.enum(["charge", "field", "flux", "surface", "ink"]).default("ink"),
    arcTo: V3.optional(),
  }),
  model: () => ({}),
  handles: [],
  readouts: {},
});

export const PatchTiling = defineComponent({
  id: "patch-tiling",
  params: z.object({ shape: z.enum(["sphere", "cube"]).default("sphere"), center: V3.default([0, 0, 0]), size: z.number().positive().default(1), n: int(1, 48, 2) }),
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const center = p.center as Vec3;
    const shape: SurfaceShape = p.shape === "cube" ? { kind: "cube", center, side: p.size } : { kind: "sphere", center, radius: p.size };
    const pts = outlineOf(shape, Math.max(8, 4 * p.n));
    const normals = outlineNormals(pts, center);
    const segments = pts.map((pt, i) => {
      const v = dot(fluxDensity(cs, pt), normals[i]!) * 1e6;
      return { p: pt, dn: Number.isFinite(v) ? v : null };
    });
    return { sum: fluxThrough(cs, surfacePatches(shape, p.n)) * 1e6, count: surfacePatches(shape, p.n).length, segments };
  },
  handles: ["n"],
  readouts: { sum: "µC", count: "" },
  links: ["charges"],
});
```

(`count` for a sphere is `n × 2n`, which is 1152 at `n = 24`, matching the test. For a cube it is `6n²`.)

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): uniform-field, flat-patch, vector and patch-tiling components"
```

---

### Task 4: Ideas: compiler, location, marks, coverage and ask validation

**Files:**
- Create: `app/packages/plate/src/ideas.ts`
- Modify: `app/packages/plate/src/index.ts`
- Test: `app/packages/plate/test/ideas.test.ts`

**Interfaces:**
- Produces:
  - Authoring types:
    - `StepInput`
    - `ExampleInput = { id; level: "basic" | "tutorial" | "exam"; title; problem; setup; show?; hide?; lines: { text; latex?; focus?; patch?; claims? }[]; trap?; covers? }`
    - `AskInput = { id; q; a; patch?; show?; hide?; focus?; tags? }`
    - `IdeaInput = { id; title; objectives: number[]; explain: StepInput[]; examples: ExampleInput[]; asks: AskInput[]; checks: (StepInput & { covers?: string[] })[]; recap: { points: string[]; traps: string[] } }`
    - `Requires = { objectives: number[]; items: string[]; misconceptions: string[] }`
  - `IdeaMeta = { plateId; requires?; ideas: IdeaIndex[] }`
  - `IdeaIndex = { id; title; objectives; start; end; explain: [number, number]; examples: { id; level; title; start; end; trap?; covers }[]; asks: AskInput[]; checks: { index; id; covers; tags }[]; recap: { index; points; traps } }`
  - `defineIdeaPlate(input): { plate: PlateDef; meta: IdeaMeta }`
  - `stepLocation(meta, index): string`
  - `timelineMarks(meta): { index: number; label: string }[]`
  - `coverageGaps(meta): string[]`
  - `askState(plate, idea, ask): SceneState`
  - `validateIdeas(registry, compiled): PlateIssue[]`: ask ≤ 80 words, ask patches evaluate, unbacked numbers in asks and traps

- [ ] **Step 1: Write the failing test**: `app/packages/plate/test/ideas.test.ts`

```ts
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { coverageGaps, defineComponent, defineIdeaPlate, Registry, stepLocation, timelineMarks, validateIdeas, validatePlate } from "../src";

const Src = defineComponent({ id: "src", params: z.object({ q: z.number() }), model: (p) => ({ total: p.q }), handles: ["q"], readouts: { total: "µC" } });
const reg = new Registry().register(Src);
const choose = (id: string, tag?: string) => ({
  id, type: "choose", prompt: "p", dimension: "conceptual",
  options: [{ id: "a", label: "A", correct: true, feedback: "f" }, { id: "b", label: "B", correct: false, feedback: "f", ...(tag ? { tag } : {}) }],
});

const lesson = defineIdeaPlate({
  id: "demo", title: "Demo",
  instances: [{ id: "a", component: "src", params: { q: 1 } }],
  requires: { objectives: [0], items: ["past:q1"], misconceptions: ["SIGN_SLIP"] },
  ideas: [{
    id: "one", title: "First idea", objectives: [0],
    explain: [{ id: "e1", title: "E1", show: ["a"], note: "q is 1 µC." }, { id: "e2", title: "E2", patch: { a: { q: 2 } }, note: "Now 2 µC." }],
    examples: [{ id: "x1", level: "basic", title: "Ex", problem: "Find q.", setup: { a: { q: 3 } }, lines: [{ text: "It reads 3 µC.", focus: ["a"] }], trap: "Not q squared.", covers: ["past:q1"] }],
    asks: [{ id: "k1", q: "Why?", a: "Because 4 µC.", patch: { a: { q: 4 } }, tags: ["SIGN_SLIP"] }],
    checks: [{ id: "c1", title: "Check", note: "Answer.", interaction: choose("c1", "SIGN_SLIP") }],
    recap: { points: ["q is what the plate says."], traps: ["Reading the wrong readout."] },
  }],
});

describe("defineIdeaPlate", () => {
  it("flattens ideas into kinded steps with a meta index", () => {
    expect(lesson.plate.steps.map((s) => `${s.kind}:${s.id}`)).toEqual([
      "explain:one-e1", "explain:one-e2", "work:one-x1", "work:one-x1-l1", "check:one-c1", "recap:one-recap",
    ]);
    const idea = lesson.meta.ideas[0]!;
    expect(idea).toMatchObject({ start: 0, end: 5, explain: [0, 1], checks: [{ index: 4, id: "c1", covers: [], tags: ["SIGN_SLIP"] }] });
    expect(idea.examples[0]).toMatchObject({ start: 2, end: 3, trap: "Not q squared." });
  });
  it("says where the learner is, and marks the timeline", () => {
    expect(stepLocation(lesson.meta, 1)).toBe("Idea 1 · First idea · Explanation 2 of 2");
    expect(stepLocation(lesson.meta, 3)).toBe("Idea 1 · First idea · Worked example 1 of 1 · line 1");
    expect(stepLocation(lesson.meta, 4)).toBe("Idea 1 · First idea · Check 1 of 1");
    expect(stepLocation(lesson.meta, 5)).toBe("Idea 1 · First idea · Recap");
    expect(timelineMarks(lesson.meta)).toEqual([
      { index: 0, label: "1 First idea" }, { index: 2, label: "Example 1" }, { index: 4, label: "Check" }, { index: 5, label: "Recap" },
    ]);
  });
  it("coverage passes when objectives, items and misconceptions are all taught", () => {
    expect(coverageGaps(lesson.meta)).toEqual([]);
    const bare = { ...lesson.meta, requires: { objectives: [0, 1], items: ["past:q9"], misconceptions: ["OTHER"] } };
    expect(coverageGaps(bare)).toEqual([
      "objective 1: no idea teaches it",
      "item past:q9: not worked or checked",
      "misconception OTHER: no ask",
      "misconception OTHER: no check detects it",
    ]);
  });
  it("validates plate steps and asks (numbers backed, word budget)", () => {
    expect(validatePlate(reg, lesson.plate)).toEqual([]);
    expect(validateIdeas(reg, lesson)).toEqual([]);
    const bad = { ...lesson, meta: { ...lesson.meta, ideas: [{ ...lesson.meta.ideas[0]!, asks: [{ id: "k2", q: "?", a: `It is 7 µC. ${"word ".repeat(85)}` }] }] } };
    expect(validateIdeas(reg, bad).map((i) => i.message)).toEqual([
      expect.stringMatching(/ask k2 has \d+ words \(budget 80\)/),
      expect.stringMatching(/ask k2: unbacked number "7 µC"/),
    ]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/plate/test/ideas.test.ts`
Expected: FAIL (`defineIdeaPlate` is not exported).

- [ ] **Step 3: Implement `src/ideas.ts`**

```ts
import type { Registry } from "./component";
import { applyStep, PlateDef, stateAt } from "./plate";
import { createEvaluator, type SceneState } from "./scene";
import { numbersOf, unbackedNumbers, wordCount, type PlateIssue } from "./validate";

type Patch = Record<string, Record<string, unknown>>;
export type StepInput = {
  id: string; title: string; note: string; patch?: Patch; show?: string[]; hide?: string[]; focus?: string[];
  why?: string; derivation?: string; interaction?: unknown; claims?: unknown[]; cues?: unknown[]; narration?: unknown; latex?: string;
};
export type ExampleInput = {
  id: string; level: "basic" | "tutorial" | "exam"; title: string; problem: string; setup: Patch; show?: string[]; hide?: string[];
  lines: { text: string; latex?: string; focus?: string[]; patch?: Patch; claims?: unknown[] }[]; trap?: string; covers?: string[];
};
export type AskInput = { id: string; q: string; a: string; patch?: Patch; show?: string[]; hide?: string[]; focus?: string[]; tags?: string[] };
export type IdeaInput = {
  id: string; title: string; objectives: number[]; explain: StepInput[]; examples: ExampleInput[]; asks: AskInput[];
  checks: (StepInput & { covers?: string[] })[]; recap: { points: string[]; traps: string[] };
};
export type Requires = { objectives: number[]; items: string[]; misconceptions: string[] };
export type IdeaIndex = {
  id: string; title: string; objectives: number[]; start: number; end: number; explain: [number, number];
  examples: { id: string; level: ExampleInput["level"]; title: string; start: number; end: number; trap?: string; covers: string[] }[];
  asks: AskInput[]; checks: { index: number; id: string; covers: string[]; tags: string[] }[];
  recap: { index: number; points: string[]; traps: string[] };
};
export type IdeaMeta = { plateId: string; requires?: Requires; ideas: IdeaIndex[] };
export type CompiledIdeas = { plate: PlateDef; meta: IdeaMeta };

const tagsOf = (i: unknown): string[] => {
  const x = i as { tag?: string; options?: { tag?: string }[]; targets?: { tag?: string }[]; distractors?: { tag?: string }[] } | undefined;
  return [...new Set([x?.tag, ...(x?.options ?? []).map((o) => o.tag), ...(x?.targets ?? []).map((o) => o.tag), ...(x?.distractors ?? []).map((o) => o.tag)].filter((t): t is string => !!t))];
};

/** Authored ideas → one plate timeline (explain, then each worked example's problem and lines, then checks, then recap) plus an index. */
export function defineIdeaPlate(input: { id: string; title: string; instances: unknown[]; bindings?: Record<string, string[]>; requires?: Requires; ideas: IdeaInput[] }): CompiledIdeas {
  const steps: Record<string, unknown>[] = [];
  const ideas: IdeaIndex[] = [];
  for (const idea of input.ideas) {
    const start = steps.length;
    for (const s of idea.explain) steps.push({ ...s, id: `${idea.id}-${s.id}`, kind: "explain", idea: idea.id });
    const explainEnd = steps.length - 1;
    const examples = idea.examples.map((ex) => {
      const s0 = steps.length;
      steps.push({ id: `${idea.id}-${ex.id}`, title: ex.title, kind: "work", idea: idea.id, note: ex.problem, patch: ex.setup, show: ex.show ?? [], hide: ex.hide ?? [] });
      ex.lines.forEach((ln, k) =>
        steps.push({ id: `${idea.id}-${ex.id}-l${k + 1}`, title: `${ex.title} · line ${k + 1}`, kind: "work", idea: idea.id, note: ln.text, focus: ln.focus ?? [], patch: ln.patch ?? {}, claims: ln.claims ?? [], ...(ln.latex ? { latex: ln.latex } : {}) }),
      );
      return { id: ex.id, level: ex.level, title: ex.title, start: s0, end: steps.length - 1, ...(ex.trap ? { trap: ex.trap } : {}), covers: ex.covers ?? [] };
    });
    const checks = idea.checks.map(({ covers, ...c }) => {
      steps.push({ ...c, id: `${idea.id}-${c.id}`, kind: "check", idea: idea.id });
      return { index: steps.length - 1, id: (c.interaction as { id: string }).id, covers: covers ?? [], tags: tagsOf(c.interaction) };
    });
    steps.push({ id: `${idea.id}-recap`, title: `Recap · ${idea.title}`, kind: "recap", idea: idea.id, note: idea.recap.points.join(" ") });
    ideas.push({ id: idea.id, title: idea.title, objectives: idea.objectives, start, end: steps.length - 1, explain: [start, explainEnd], examples, asks: idea.asks, checks, recap: { index: steps.length - 1, ...idea.recap } });
  }
  const plate = PlateDef.parse({ id: input.id, title: input.title, instances: input.instances, bindings: input.bindings ?? {}, steps });
  return { plate, meta: { plateId: plate.id, ...(input.requires ? { requires: input.requires } : {}), ideas } };
}

export function stepLocation(meta: IdeaMeta, index: number): string {
  const n = meta.ideas.findIndex((i) => index >= i.start && index <= i.end);
  if (n < 0) return "";
  const idea = meta.ideas[n]!;
  const head = `Idea ${n + 1} · ${idea.title}`;
  if (index <= idea.explain[1]) return `${head} · Explanation ${index - idea.start + 1} of ${idea.explain[1] - idea.start + 1}`;
  const e = idea.examples.findIndex((x) => index >= x.start && index <= x.end);
  if (e >= 0) {
    const line = index - idea.examples[e]!.start;
    return `${head} · Worked example ${e + 1} of ${idea.examples.length}${line ? ` · line ${line}` : ""}`;
  }
  const c = idea.checks.findIndex((x) => x.index === index);
  return c >= 0 ? `${head} · Check ${c + 1} of ${idea.checks.length}` : `${head} · Recap`;
}

/** Scrub-bar marks: each idea, each worked example, the first check, and the recap. */
export function timelineMarks(meta: IdeaMeta): { index: number; label: string }[] {
  return meta.ideas.flatMap((idea, n) => [
    { index: idea.start, label: `${n + 1} ${idea.title}` },
    ...idea.examples.map((ex, k) => ({ index: ex.start, label: `Example ${k + 1}` })),
    ...(idea.checks[0] ? [{ index: idea.checks[0].index, label: "Check" }] : []),
    { index: idea.recap.index, label: "Recap" },
  ]);
}

/** The value guarantee: every declared objective, item and misconception is taught, worked and checked. */
export function coverageGaps(meta: IdeaMeta): string[] {
  const r = meta.requires;
  if (!r) return ["no coverage requirements declared"];
  const gaps: string[] = [];
  for (const o of r.objectives) {
    const ideas = meta.ideas.filter((i) => i.objectives.includes(o));
    if (!ideas.length) gaps.push(`objective ${o}: no idea teaches it`);
    else if (!ideas.some((i) => i.explain[1] >= i.explain[0] && i.examples.length > 0 && i.checks.length > 0)) gaps.push(`objective ${o}: needs an explanation, a worked example and a check`);
  }
  for (const item of r.items)
    if (!meta.ideas.some((i) => i.examples.some((e) => e.covers.includes(item)) || i.checks.some((c) => c.covers.includes(item)))) gaps.push(`item ${item}: not worked or checked`);
  for (const tag of r.misconceptions) {
    if (!meta.ideas.some((i) => i.asks.some((a) => a.tags?.includes(tag)))) gaps.push(`misconception ${tag}: no ask`);
    if (!meta.ideas.some((i) => i.checks.some((c) => c.tags.includes(tag)))) gaps.push(`misconception ${tag}: no check detects it`);
  }
  return gaps;
}

/** The plate state an ask shows: the idea's final state with the ask's visibility and params applied. */
export function askState(plate: PlateDef, idea: IdeaIndex, ask: AskInput): SceneState {
  return applyStep(stateAt(plate, idea.end), {
    id: "ask", title: "ask", kind: "ask", note: ask.a, patch: ask.patch ?? {}, show: ask.show ?? [], hide: ask.hide ?? [], focus: ask.focus ?? [],
    view: "2d", claims: [], cues: [],
  } as PlateDef["steps"][number]);
}

export function validateIdeas(registry: Registry, { plate, meta }: CompiledIdeas): PlateIssue[] {
  const issues: PlateIssue[] = [];
  const evaluate = createEvaluator(registry, plate.instances);
  const warn = (message: string) => issues.push({ plate: plate.id, level: "warning", message });
  for (const idea of meta.ideas) {
    for (const ask of idea.asks) {
      const w = wordCount(ask.a);
      if (w > 80) warn(`ask ${ask.id} has ${w} words (budget 80)`);
      try {
        const frame = evaluate(askState(plate, idea, ask));
        for (const n of unbackedNumbers(ask.a, numbersOf(frame))) warn(`ask ${ask.id}: unbacked number "${n}"`);
      } catch (e) {
        issues.push({ plate: plate.id, level: "error", message: `ask ${ask.id} does not evaluate: ${(e as Error).message}` });
      }
    }
    for (const ex of idea.examples)
      if (ex.trap) for (const n of unbackedNumbers(ex.trap, numbersOf(evaluate(stateAt(plate, ex.end))))) warn(`example ${ex.id} trap: unbacked number "${n}"`);
  }
  return issues;
}
```

Append to `src/index.ts`: `export * from "./ideas";`

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): idea lessons: compiler, location, timeline marks, coverage and ask validation"
```

---

### Task 5: Engine: worked lines for templates, template numeric checks

**Files:**
- Modify: `app/packages/engine/src/templates.ts`, `app/packages/engine/src/schema/interactions.ts`
- Test: `app/packages/engine/test/templates.test.ts` (append)

**Interfaces:**
- Produces:
  - `TemplateDef.worked?: (p: P) => { text: string; latex?: string }[]`
  - `Variant.worked: { text: string; latex?: string }[]`
  - `Interaction` numeric gains optional `template: string`

- [ ] **Step 1: Write the failing test**: append to `test/templates.test.ts`:

```ts
import { Interaction } from "../src";

describe("worked lines and template checks", () => {
  const t = defineTemplate<{ Q: number }>({
    id: "w", params: { Q: { min: 2, max: 2, step: 1 } }, prompt: (p) => `Q = ${p.Q}`,
    solve: (p) => ({ answer: { value: p.Q / 2, unit: "µC" } }),
    worked: (p) => [{ text: `Half of ${p.Q} is ${p.Q / 2}.` }],
    dimension: "computational", tags: { concepts: [], misconceptions: [], difficulty: 1 },
  });
  it("instantiates worked lines with the variant's numbers", () => {
    expect(instantiate(t, 1).worked).toEqual([{ text: "Half of 2 is 1." }]);
    expect(instantiate(octant, 1).worked).toEqual([]);
  });
  it("numeric interactions may name a template", () => {
    const i = Interaction.parse({ id: "n", type: "numeric", prompt: "p", answer: { value: 1, unit: "µC" }, template: "w", dimension: "computational" });
    expect(i.type === "numeric" && i.template).toBe("w");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/templates.test.ts`
Expected: FAIL (`worked` undefined; `template` stripped).

- [ ] **Step 3: Implement**
- **`templates.ts`:**
  - add `worked?: (p: P) => { text: string; latex?: string }[];` to `TemplateDef`;
  - add `worked: { text: string; latex?: string }[];` to `Variant`;
  - in `instantiate`, add `worked: t.worked?.(params) ?? [],`.
- **`schema/interactions.ts`:** in the numeric variant object, add `template: z.string().min(1).optional(),`.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/engine && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine && git commit -m "feat(engine): template worked lines and template-backed numeric checks"
```

---

### Task 6: Course: the flux template and the proof idea "Flux through a surface"

**Files:**
- Modify: `app/packages/course-em1/src/templates.ts`, `src/checks.ts`, `src/plates/index.ts`, `src/index.ts`, `src/concepts/gauss-law.ts`
- Create: `app/packages/course-em1/src/plates/flux-surface.ts`
- Test: `app/packages/course-em1/test/ideas.test.ts`; append a truth entry in `test/templates.test.ts`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces:
  - template `flux-flat-patch`
  - check `patch-flux-3`
  - `ideaPlates: Record<plateId, CompiledIdeas>`, with `plates` including the compiled plates
  - lesson `em1.electrostatics.gauss-law/flux-surface`

- [ ] **Step 1: Write the failing test**: `app/packages/course-em1/test/ideas.test.ts`

```ts
import { instantiate } from "@forma/engine";
import { coverageGaps, validateIdeas, validatePlate } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { checks, course, ideaPlates, plates, registry, templates } from "../src";

describe("idea lessons", () => {
  const all = Object.values(ideaPlates);
  it("exist and are reachable from a concept lesson", () => {
    expect(all.map((c) => c.plate.id)).toContain("flux-surface");
    for (const c of all) {
      expect(plates[c.plate.id]).toBe(c.plate);
      expect(course.concepts.some((k) => k.lessons.some((l) => l.blocks.some((b) => b.type === "plate" && b.plateId === c.plate.id)))).toBe(true);
    }
  });
  for (const c of all) {
    it(`${c.plate.id}: no validation errors or warnings, asks included`, () => {
      expect(validatePlate(registry, c.plate)).toEqual([]);
      expect(validateIdeas(registry, c)).toEqual([]);
    });
    it(`${c.plate.id}: coverage matrix passes`, () => {
      expect(coverageGaps(c.meta)).toEqual([]);
    });
    it(`${c.plate.id}: depth floor per idea (spec §1)`, () => {
      for (const idea of c.meta.ideas) {
        expect(idea.explain[1] - idea.explain[0] + 1, idea.id).toBeGreaterThanOrEqual(3);
        expect(idea.examples.map((e) => e.level), idea.id).toEqual(["basic", "tutorial", "exam"]);
        expect(idea.asks.length, idea.id).toBeGreaterThanOrEqual(6);
        expect(idea.checks.length, idea.id).toBeGreaterThanOrEqual(4);
        expect(idea.recap.points.length, idea.id).toBeGreaterThan(0);
      }
    });
    it(`${c.plate.id}: template checks agree with their template, and goal checks exist`, () => {
      for (const s of c.plate.steps) {
        const i = s.interaction;
        if (i?.type === "numeric" && i.template) {
          const t = templates.find((x) => x.id === i.template);
          expect(t, i.template).toBeDefined();
          expect(i.answer).toEqual(instantiate(t!, 1).spec.answer);
          expect(instantiate(t!, 1).worked.length).toBeGreaterThan(0);
        }
        if (i && (i.type === "manipulate-goal" || i.type === "place")) expect(checks[i.check], i.check).toBeDefined();
      }
    });
  }
});
```

Append to `test/templates.test.ts` (inside `truth`):

```ts
  "flux-flat-patch": (p) => dot(vec(p.D! * 1e-6, 0, 0), vec(Math.cos((p.theta! * Math.PI) / 180), 0, Math.sin((p.theta! * Math.PI) / 180))) * p.a! * p.b!,
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/course-em1`
Expected: FAIL (`ideaPlates` is not exported; the template is missing).

- [ ] **Step 3: The template**: append to `src/templates.ts` before the `templates` array, then add `fluxFlat` to it:

```ts
const fluxFlat = defineTemplate<{ D: number; a: number; b: number; theta: number }>({
  id: "flux-flat-patch",
  params: { D: { min: 2, max: 9, step: 1 }, a: { min: 0.5, max: 3, step: 0.5 }, b: { min: 1, max: 4, step: 0.5 }, theta: { min: 20, max: 80, step: 10 } },
  prompt: (p) => `A flat ${p.a} m × ${p.b} m rectangle sits in a uniform field D = ${p.D} µC/m², with its normal at ${p.theta}° to D. Find the flux through it.`,
  solve: (p) => {
    const A = p.a * p.b;
    const c = Math.cos((p.theta * Math.PI) / 180);
    const s = Math.sin((p.theta * Math.PI) / 180);
    return {
      answer: { value: r4(p.D * A * c), unit: "µC" },
      distractors: [
        { value: r4(p.D * A * s), unit: "µC", errorClass: "conceptual", feedback: "That's sin θ. The angle is measured from the normal, so use cos θ." },
        { value: r4(p.D * A), unit: "µC", errorClass: "conceptual", feedback: "That ignores the tilt. Only the part of D along the normal, D cos θ, crosses." },
      ],
    };
  },
  hints: () => ["The field is uniform and the surface flat: one multiplication will do.", "Ψ = |D| A cos θ, with θ measured from the normal.", "Area first, then D cos θ, then multiply."],
  worked: (p) => {
    const A = r4(p.a * p.b);
    const dn = r4(p.D * Math.cos((p.theta * Math.PI) / 180));
    return [
      { text: `Area: A = ${p.a} × ${p.b} = ${A} m².` },
      { text: `Part of D along the normal: D cos θ = ${p.D} × cos ${p.theta}° = ${dn} µC/m².` },
      { text: `Multiply: Ψ = ${dn} × ${A} = ${r4(p.D * p.a * p.b * Math.cos((p.theta * Math.PI) / 180))} µC.` },
    ];
  },
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.gauss-law"], misconceptions: [], difficulty: 2 },
});
```

(θ starts at 20°, so the "ignores the tilt" distractor is always more than 2% away from the answer: cos 20° = 0.94. The existing coincidence test checks this for seeds 1–200.)

- [ ] **Step 4: The goal check**: add to `checks` in `src/checks.ts`:

```ts
  /** The flat patch passes 3 µC, within 2%. */
  "patch-flux-3": (now) => Math.abs(Number(now.patch?.model.dPsi) - 3) <= 0.06,
```

- [ ] **Step 5: The idea**: `src/plates/flux-surface.ts`

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const fluxTemplate = templates.find((t) => t.id === "flux-flat-patch")!;
const seed1 = instantiate(fluxTemplate, 1);
const PLATE_ONLY = ["q", "tiles", "dvec", "svec", "eq"];
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });

export const fluxSurface = defineIdeaPlate({
  id: "flux-surface",
  title: "Flux through a surface",
  requires: { objectives: [2], items: [], misconceptions: ["SURFACE_NORMAL_DIRECTION"] },
  instances: [
    { id: "field", component: "uniform-field", params: { Dx: 3, Dz: 0 } },
    { id: "patch", component: "flat-patch", params: { center: [0.3, 0, 0], size: 1, normalAngle: 0, showNormal: true, showShadow: false }, links: { field: "field" } },
    { id: "dvec", component: "vector", params: { from: [-1.8, 0, -1.3], to: [-0.8, 0, -1.3], label: "D", tone: "flux" } },
    { id: "svec", component: "vector", params: { from: [0.3, 0, 0], to: [0.55, 0, 0.433], label: "dS", tone: "surface", arcTo: [0.8, 0, 0] } },
    { id: "q", component: "charges", params: { items: [{ id: "q1", kind: "point", q: 2, pos: [0.3, 0, 0.2] }] } },
    { id: "tiles", component: "patch-tiling", params: { shape: "sphere", size: 1, n: 2 }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`d\Psi`, speech: "d psi, the flux through the patch", shortSpeech: "flux" } },
  ],
  ideas: [
    {
      id: "flux-surface",
      title: "Flux through a surface",
      objectives: [2],
      explain: [
        {
          id: "stream", title: "A steady stream of D", show: ["field", "patch"], focus: ["patch"],
          note: "Picture D as a steady stream flowing to the right, the same everywhere: D = 3 µC/m² in the +x direction. Hold a flat patch of area 1 m² square-on to the stream, so its normal n̂ (the arrow sticking out of its face) points along D. Everything the stream carries crosses the patch. How much? D times the area: 3 µC/m² × 1 m² = 3 µC. That amount is the electric flux through the patch, written dΨ. Its unit is the coulomb, because flux counts the charge-worth of field passing through, not the field strength.",
          claims: [{ instance: "patch", readout: "dPsi", value: 3, unit: "µC" }, { instance: "patch", readout: "area", value: 1, unit: "m^2" }],
        },
        {
          id: "tilt", title: "Tilt the patch", patch: { patch: { normalAngle: 60, showShadow: true } }, focus: ["patch"],
          latex: R`d\Psi=|\mathbf D|\,dS\cos\theta`,
          note: "Now turn the patch so its normal makes an angle θ with D. The stream still flows right, but seen along the flow the patch looks narrower: its shadow on a wall facing the stream is only A cos θ. Only the stream that meets that shadow gets through. At θ = 60°, cos θ = 0.5, so the shadow is 0.5 m² and dΨ = 3 × 0.5 = 1.5 µC. Turn it further and the shadow shrinks; when the patch lies along the stream, nothing crosses. θ is always measured from the normal, not from the face of the patch.",
          claims: [{ instance: "patch", readout: "dPsi", value: 1.5, unit: "µC" }, { instance: "patch", readout: "shadow", value: 0.5, unit: "m^2" }],
        },
        {
          id: "negative", title: "Past 90°: negative flux", patch: { patch: { normalAngle: 150, showShadow: false } }, focus: ["patch"],
          note: "Keep turning until the normal points back against the stream, θ = 150°. Now cos θ is negative, and so is the flux: dΨ = 3 × cos 150° ≈ −2.6 µC. A negative flux does not mean less field. It means the field crosses the patch in the direction opposite to the normal you chose. For an open patch you choose which face n̂ points out of, and flipping that choice flips the sign. For a closed surface the choice is fixed (outward), which is why the sign will carry meaning in Gauss's law.",
          claims: [{ instance: "patch", readout: "dPsi", value: -2.598, unit: "µC" }],
        },
        {
          id: "dot", title: "Why a dot product", show: ["dvec", "svec", "eq"], patch: { patch: { normalAngle: 60 }, eq: { latex: R`d\Psi=\mathbf D\cdot d\mathbf S=|\mathbf D|\,|d\mathbf S|\cos\theta`, speech: "d psi equals D dot d S, which is the size of D times the size of d S times cos theta", shortSpeech: "D dot d S" } },
          focus: ["dvec", "svec"],
          note: "Give the patch a vector of its own: dS, pointing along the normal, with length equal to the patch's area. Then 'field strength × area × cos θ' is exactly the dot product of D and dS. One symbol now carries everything: how strong the field is, how big the patch is, and how it is tilted. It also handles the sign automatically. In components, D · dS = Dx dSx + Dz dSz, which is how you compute it when D is given as a vector such as 4x̂ + 3ẑ. Here: 3 × 1 × 0.5 = 1.5 µC.",
          claims: [{ instance: "patch", readout: "dPsi", value: 1.5, unit: "µC" }],
        },
        {
          id: "whole", title: "A whole flat surface", hide: ["dvec", "svec"], patch: { patch: { size: 1.5, normalAngle: 0 }, eq: { latex: R`\Psi=\mathbf D\cdot\mathbf S=|\mathbf D|\,A\cos\theta`, speech: "psi equals D dot S, which is the size of D times A times cos theta", shortSpeech: "flux through a flat surface" } },
          focus: ["patch"],
          note: "For a flat surface in a uniform field, every small piece has the same D and the same normal, so the pieces add up to one multiplication: Ψ = D · S = |D| A cos θ, where A is the whole area. Stretch the patch to 1.5 m on a side and turn it square-on: A = 2.25 m² and Ψ = 3 × 2.25 = 6.75 µC. This shortcut needs both conditions: a flat surface, and a field that is the same everywhere on it. Break either one and you must go patch by patch.",
          claims: [{ instance: "patch", readout: "area", value: 2.25, unit: "m^2" }, { instance: "patch", readout: "dPsi", value: 6.75, unit: "µC" }],
        },
        {
          id: "curved", title: "Curved surfaces: add up patches", hide: ["field", "patch", "eq"], show: ["q", "tiles"], focus: ["tiles"],
          note: "Most surfaces are curved, and most fields change from place to place. The fix is the same idea, repeated: cut the surface into patches small enough to be flat, with D nearly constant across each; work out D · dS on each; add them up. The plate has tiled a sphere around a 2 µC charge into a few patches, and the readout shows their sum. Shaded segments are where flux leaves (blue) or enters (ochre).",
        },
        {
          id: "limit", title: "Shrink the patches", patch: { tiles: { n: 12 } }, focus: ["tiles"],
          latex: R`\Psi=\int_S\mathbf D\cdot d\mathbf S`,
          note: "With many more, smaller patches the sum stops changing in the digits shown. That limit is what the integral sign means: not a new idea, just 'add up D · dS over pieces too small to matter'. Every flux problem is this sum. The tricks you will learn (flat surfaces, symmetry, Gauss's law) are ways to get the answer without adding thousands of pieces by hand.",
        },
      ],
      examples: [
        {
          id: "square", level: "basic", title: "A 2 m square at 60°",
          show: ["field", "patch"], hide: PLATE_ONLY, setup: { field: { Dx: 3, Dz: 0 }, patch: { size: 2, normalAngle: 60, showShadow: false, center: [0.3, 0, 0] } },
          problem: "A flat 2 m × 2 m square sits in a uniform field D = 3 µC/m², with its normal at 60° to D. Find the flux through it.",
          lines: [
            { text: "The field is the same everywhere on a flat surface, so one multiplication will do. First the area: A = 2 × 2 = 4 m².", focus: ["patch"], claims: [{ instance: "patch", readout: "area", value: 4, unit: "m^2" }] },
            { text: "Next, the part of D along the normal: D · n̂ = 3 × cos 60° = 1.5 µC/m².", latex: R`\mathbf D\cdot\hat{\mathbf n}=3\cos 60^\circ=1.5`, focus: ["patch"], claims: [{ instance: "patch", readout: "Dn", value: 1.5, unit: "µC/m^2" }] },
            { text: "Multiply: Ψ = 1.5 × 4 = 6 µC. The plate's readout agrees.", latex: R`\Psi=1.5\times4=6\ \mu\mathrm C`, focus: ["patch"], claims: [{ instance: "patch", readout: "dPsi", value: 6, unit: "µC" }] },
          ],
          trap: "Measuring 60° from the surface instead of the normal means using sin 60°, and the answer comes out about 1.7 times too big.",
        },
        {
          id: "vector", level: "tutorial", title: "D given as a vector",
          show: ["field", "patch"], hide: PLATE_ONLY, setup: { field: { Dx: 4, Dz: 3 }, patch: { size: 3, depth: 0.5, normalAngle: 90, center: [0, 0, 0] } },
          problem: "A flat 3 m × 0.5 m rectangle lies in the plane z = 0 of a uniform field D = 4x̂ + 3ẑ µC/m². Its normal is +ẑ. Find the flux through it.",
          lines: [
            { text: "The normal is n̂ = ẑ, so only the z-part of D pierces the rectangle: D · n̂ = 4 × 0 + 3 × 1 = 3 µC/m².", focus: ["patch"], claims: [{ instance: "patch", readout: "Dn", value: 3, unit: "µC/m^2" }] },
            { text: "Area: A = 3 × 0.5 = 1.5 m².", focus: ["patch"], claims: [{ instance: "patch", readout: "area", value: 1.5, unit: "m^2" }] },
            { text: "Ψ = 3 × 1.5 = 4.5 µC.", latex: R`\Psi=3\times1.5=4.5\ \mu\mathrm C`, focus: ["patch"], claims: [{ instance: "patch", readout: "dPsi", value: 4.5, unit: "µC" }] },
          ],
          trap: "The x-part of D, 4 µC/m², runs along the rectangle and adds nothing. Using the full |D| = 5 µC/m² instead overestimates the flux.",
        },
        {
          id: "tilted", level: "exam", title: "A tilted plate, both ways",
          show: ["field", "patch"], hide: PLATE_ONLY, setup: { field: { Dx: 2, Dz: 2 }, patch: { size: 2, normalAngle: 30, center: [0.3, 0, 0] } },
          problem: "In a uniform field D = 2x̂ + 2ẑ µC/m², a flat 2 m × 2 m plate has its normal at 30° above the +x axis. (a) Find the flux through the plate. (b) Find the angle between D and the normal, and confirm that Ψ = |D| A cos θ gives the same answer.",
          lines: [
            { text: "(a) Write the normal as a vector: n̂ = (cos 30°, sin 30°) = (0.866, 0.5).", latex: R`\hat{\mathbf n}=(\cos30^\circ,\ \sin30^\circ)=(0.866,\ 0.5)`, focus: ["patch"] },
            { text: "D · n̂ = 2 × 0.866 + 2 × 0.5 = 2.732 µC/m².", focus: ["patch"], claims: [{ instance: "patch", readout: "Dn", value: 2.732, unit: "µC/m^2" }] },
            { text: "The area is 4 m², so Ψ = 2.732 × 4 = 10.93 µC.", focus: ["patch"], claims: [{ instance: "patch", readout: "area", value: 4, unit: "m^2" }, { instance: "patch", readout: "dPsi", value: 10.928, unit: "µC" }] },
            { text: "(b) D points at 45° and the normal at 30°, so θ = 15°. Its size is |D| = √(2² + 2²) = 2.828 µC/m².", focus: ["field", "patch"], claims: [{ instance: "field", readout: "magnitude", value: 2.8284, unit: "µC/m^2" }, { instance: "patch", readout: "theta", value: 15, unit: "°" }] },
            { text: "Check: |D| A cos θ = 2.828 × 4 × cos 15° = 10.93 µC, the same as (a). Both routes are the same dot product.", focus: ["patch"], claims: [{ instance: "patch", readout: "dPsi", value: 10.928, unit: "µC" }] },
          ],
          trap: "Adding the angles (45° + 30°) instead of taking the difference gives the wrong θ. Always use the angle between the two directions.",
        },
      ],
      asks: [
        { id: "why-cos", q: "Why cos θ and not sin θ?", show: ["field", "patch"], patch: { field: { Dx: 3, Dz: 0 }, patch: { size: 1, normalAngle: 60, showShadow: true } }, focus: ["patch"],
          a: "Because θ is measured from the normal, not from the face of the patch. Square-on means θ = 0°, when everything passes, and cos 0° = 1. Measuring from the face instead needs sin, which gives the same number, but mixing the two conventions is the most common slip. Forma always measures from the normal." },
        { id: "curved", q: "What if the patch is curved?", show: ["q", "tiles"], patch: { tiles: { n: 12 } }, focus: ["tiles"],
          a: "Cut it into pieces small enough to be flat, work out D · dS on each, and add them. The integral ∫S D · dS is exactly that sum, with the pieces shrunk until the answer stops changing." },
        { id: "units", q: "Why is flux measured in coulombs?",
          a: "D is in coulombs per square metre and area is in square metres, so D · S is in coulombs. Flux counts the charge-worth of field passing through, which is why Gauss's law can set it equal to a charge." },
        { id: "negative", q: "Can flux be negative?", show: ["field", "patch"], patch: { field: { Dx: 3, Dz: 0 }, patch: { size: 1, normalAngle: 150 } }, focus: ["patch"],
          a: "Yes. When D crosses the patch against the normal (θ above 90°), cos θ is negative, so the flux is too. At 150° this patch reads about −2.6 µC. The size says how much crosses; the sign says which way, relative to the normal you chose." },
        { id: "size-angle", q: "Does the size of the patch matter, or only its angle?",
          a: "Both: Ψ = |D| A cos θ. Doubling the side of a square quadruples its area and its flux; tilting it scales the flux by cos θ. A big patch edge-on to the field catches nothing." },
        { id: "which-normal", q: "Which way does the normal point on an open surface?", tags: ["SURFACE_NORMAL_DIRECTION"], show: ["field", "patch"], patch: { patch: { size: 1, normalAngle: 180 } }, focus: ["patch"],
          a: "You choose, and the choice sets the sign of Ψ: a flat sheet has two faces and nothing picks one for you. A closed surface is different: there the normal always points outward, and that convention is what gives Gauss's law its meaning. Letting dS 'follow D' instead is a classic mistake." },
        { id: "flux-vs-field", q: "Is flux the same thing as field strength?",
          a: "No. D is a density: how much flux per square metre at a point. Flux is a total through a given surface. A strong field gives zero flux through a patch that is edge-on to it." },
        { id: "ninety", q: "What happens at exactly 90°?", show: ["field", "patch"], patch: { field: { Dx: 3, Dz: 0 }, patch: { size: 1, normalAngle: 90 } }, focus: ["patch"],
          a: "The field runs along the face of the patch, so none of it crosses: cos 90° = 0, and the readout shows dΨ = 0." },
      ],
      checks: [
        {
          id: "edge-on", title: "Check: edge-on", show: ["field", "patch"], hide: PLATE_ONLY, patch: { field: { Dx: 3, Dz: 0 }, patch: { size: 1, normalAngle: 0, showShadow: false, center: [0.3, 0, 0] } },
          note: "Five quick checks, on the plate and in the margin. Get each right to move on.",
          interaction: { id: "edge-on", type: "choose", prompt: "A patch is turned until its normal is perpendicular to D. The flux through it is…", dimension: "conceptual",
            options: [
              choice("zero", "Zero", true, "Right: the field skims along the face, and cos 90° = 0."),
              choice("max", "The largest it can be", false, "The largest is when the normal points along D (θ = 0°)."),
              choice("neg", "Negative", false, "Negative needs θ beyond 90°. At exactly 90°, nothing crosses."),
            ] },
        },
        {
          id: "predict-45", title: "Check: predict the tilt", patch: { patch: { size: 2, normalAngle: 0 } },
          note: "Predict before you look: commit a value, then the plate shows the truth.",
          interaction: { id: "predict-45", type: "predict-drag", prompt: "The 2 m square is turned so its normal is at 45° to D. Drag Ψ to your prediction.", target: { instance: "patch", readout: "dPsi" }, range: [0, 14], unit: "µC", relTol: 0.05, reveal: { patch: { normalAngle: 45 } }, dimension: "conceptual",
            feedback: { close: "Right: 3 × 4 × cos 45° ≈ 8.49 µC.", far: "Ψ = |D| A cos θ = 3 × 4 × cos 45° ≈ 8.49 µC. The tilt removes about 30%." } },
        },
        {
          id: "tilt-to-3", title: "Check: tilt to a target", patch: { patch: { size: 2, normalAngle: 60 } },
          note: "Now do it by hand: turn the square until the readout says 3 µC.",
          interaction: { id: "tilt-to-3", type: "manipulate-goal", goal: "Turn the 2 m square until exactly 3 µC passes through it (within 2%). Drag the patch, or focus it and use the arrow keys.", check: "patch-flux-3", dimension: "application" },
        },
        {
          id: "numbers", title: "Check: your own numbers",
          note: "A problem with your own numbers. Two misses show a worked example with new numbers, then you try again.",
          interaction: { id: "numbers", type: "numeric", prompt: seed1.prompt, answer: seed1.spec.answer, distractors: seed1.spec.distractors, relTol: seed1.spec.relTol, hints: seed1.hints, template: "flux-flat-patch", dimension: "computational" },
        },
        {
          id: "flip", title: "Check: flip the normal",
          note: "Last one: what the choice of normal does.",
          interaction: { id: "flip", type: "choose", prompt: "On an open patch you decide to point the normal out of the other face. The flux you calculate…", dimension: "conceptual",
            options: [
              choice("sign", "Flips sign, same size", true, "Yes: dS flips, so D · dS flips sign."),
              choice("same", "Is unchanged, because the field hasn't changed", false, "The field is the same, but dS now points the other way, so D · dS changes sign.", "SURFACE_NORMAL_DIRECTION"),
              choice("double", "Doubles", false, "Nothing doubles; only the direction of dS changed."),
            ] },
        },
      ],
      recap: {
        points: [
          "Flux through a flat patch: Ψ = D · S = |D| A cos θ, with θ measured from the normal.",
          "Units: coulombs (C/m² × m²). Flux counts the charge-worth of field crossing a surface.",
          "Sign: negative when D crosses against the chosen normal (θ above 90°).",
          "Curved surfaces or changing fields: add D · dS over small patches, which is the surface integral ∫S D · dS.",
        ],
        traps: ["Using sin θ (measuring θ from the face).", "Counting the part of D that runs along the surface.", "Adding angles instead of taking the angle between directions."],
      },
    },
  ],
});
```

- [ ] **Step 6: Register and wire the lesson**
- **`src/plates/index.ts`:** add `import { fluxSurface } from "./flux-surface";`. Include `fluxSurface.plate` in the array that builds `plates`. Add:

```ts
export const ideaPlates: Record<string, CompiledIdeas> = { [fluxSurface.plate.id]: fluxSurface };
```

  (import `type CompiledIdeas` from `@forma/plate`).
- **`src/index.ts`:** export `ideaPlates` alongside `plates`.
- **`src/concepts/gauss-law.ts`:** add a lesson right after `main`:

```ts
    {
      id: "flux-surface",
      title: "Flux through a surface (in depth)",
      minutes: 20,
      blocks: [{ ...meta("vivid", src(SLIDES, "pp. 31-36")), id: "flux-surface", type: "plate", plateId: "flux-surface" }],
    },
```

- [ ] **Step 7: Run tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS.
- If a claim fails, compute the model's value (the claim message prints it). Correct the **claim and the text** together, keeping the text's precision.
- If a number lint fires, the text states a value the plate doesn't show: fix the text.
- Never loosen a lint or a tolerance.

- [ ] **Step 8: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): 'Flux through a surface' in depth: 7 explanations, 3 worked examples, 8 asks, 5 checks, recap"
```

---

### Task 7: Web: views for the new components; check-gate history rule

**Files:**
- Modify: `app/apps/web/components/plate/views2d.tsx`, `components/plate/PlateStage.tsx` (markers for every tone), `components/plate/Readouts.tsx` (labels), `app/apps/web/lib/playback.ts`
- Test: `app/apps/web/test/playback.test.ts` (append)

**Interfaces:**
- Produces:
  - `views2d` gains `uniform-field`, `flat-patch` (keyboard/pointer handle for `normalAngle` when editable), `vector` and `patch-tiling`
  - `answeredFromHistory`: check-kind steps count only once correct (predictions excepted)

- [ ] **Step 1: Write the failing test**: append to `test/playback.test.ts`:

```ts
it("a check step answered wrongly in an earlier session stays locked", () => {
  const plate = plates["flux-surface"]!;
  const h = [
    { type: "answer", conceptId: "c", blockId: "flux-surface.edge-on", blockType: "plate", dimensions: [], correct: false, attempt: 1, at: 1 },
    { type: "answer", conceptId: "c", blockId: "flux-surface.edge-on", blockType: "plate", dimensions: [], correct: false, attempt: 2, at: 2 },
    { type: "answer", conceptId: "c", blockId: "flux-surface.predict-45", blockType: "plate", dimensions: [], correct: false, attempt: 1, at: 3 },
  ];
  expect([...answeredFromHistory(h as never, plate)].sort()).toEqual(["predict-45"]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run apps/web/test/playback.test.ts`
Expected: FAIL (the two wrong `choose` attempts count as answered under the Plan B rule).

- [ ] **Step 3: Implement**
- **History rule:** in `answeredFromHistory`, compute `done` as:

```ts
      const done =
        i.type === "predict-drag" ? mine.length > 0
        : s.kind === "check" ? mine.some((e) => e.correct)
        : i.type === "choose" || i.type === "identify" ? mine.some((e) => e.correct) || mine.length >= 2
        : mine.some((e) => e.correct);
```

- **Views:** add to `views2d.tsx` (and to the `views2d` map):

```tsx
function UniformFieldView({ ev }: ViewProps) {
  const d = ev.model.D as number[];
  const m = ev.model.magnitude as number;
  if (!m) return null;
  const ux = d[0]! / m, uz = d[2]! / m;
  const s = ev.params.spacing as number;
  const L = 0.22;
  const arrows: [number, number][] = [];
  for (let x = -2.4; x <= 2.4 + 1e-9; x += s) for (let z = -1.7; z <= 1.7 + 1e-9; z += s) arrows.push([x, z]);
  return (
    <g className="v-uniform" role="img" aria-label={`Uniform field D of ${m.toFixed(2)} µC per square metre`}>
      {arrows.map(([x, z], i) => {
        const [x1, y1] = toSvg([x - (ux * L) / 2, 0, z - (uz * L) / 2]);
        const [x2, y2] = toSvg([x + (ux * L) / 2, 0, z + (uz * L) / 2]);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="ink-flux" markerEnd="url(#arrow-flux)" opacity={0.55} />;
      })}
    </g>
  );
}

function FlatPatchView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const p = ev.params as { center: number[]; size: number; normalAngle: number; showNormal: boolean; showShadow: boolean };
  const n = ev.model.n as number[];
  const t = [-n[2]!, 0, n[0]!];
  const c = p.center;
  const half = p.size / 2;
  const [x1, y1] = toSvg([c[0]! - t[0]! * half, 0, c[2]! - t[2]! * half]);
  const [x2, y2] = toSvg([c[0]! + t[0]! * half, 0, c[2]! + t[2]! * half]);
  const [cx, cy] = toSvg(c);
  const [nx, ny] = toSvg([c[0]! + n[0]! * 0.55, 0, c[2]! + n[2]! * 0.55]);
  const can = stage.editable(id);
  const turn = (deg: number) => stage.edit(id, { normalAngle: Math.round(deg * 2) / 2 });
  const a11y = can
    ? {
        tabIndex: 0, role: "slider", "aria-label": "Patch tilt: angle of the normal from the +x axis. Arrow keys turn it by half a degree.",
        "aria-valuenow": p.normalAngle, "aria-valuemin": -180, "aria-valuemax": 180, "aria-valuetext": `${p.normalAngle}°`,
        onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
          const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 0.5 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -0.5 : 0;
          if (!d) return;
          e.preventDefault();
          turn(p.normalAngle + d);
        },
        onPointerDown: (e: PointerEvent<SVGGElement>) => e.currentTarget.setPointerCapture(e.pointerId),
        onPointerMove: (e: PointerEvent<SVGGElement>) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
          turn((Math.atan2(mz - c[2]!, mx - c[0]!) * 180) / Math.PI);
        },
      }
    : { role: "img", "aria-label": `Flat patch, normal at ${p.normalAngle}° from the +x axis` };
  return (
    <g className={`v-patch${can ? " handle" : ""}`} {...a11y}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="patch-edge" />
      {p.showNormal && (
        <>
          <line x1={cx} y1={cy} x2={nx} y2={ny} className="ink-surface" markerEnd="url(#arrow-surface)" />
          <text x={nx + 6} y={ny} className="plate-label">n̂</text>
        </>
      )}
      {p.showShadow && (() => {
        // The patch's shadow on a wall facing the field: its edge projected across D (half-length size·|cos θ|/2).
        const d = (p.size * Math.abs(Math.cos((((ev.model.theta as number | null) ?? 0) * Math.PI) / 180))) / 2;
        const [sx1, sy1] = toSvg([c[0]! - 0.9, 0, c[2]! - d]);
        const [sx2, sy2] = toSvg([c[0]! - 0.9, 0, c[2]! + d]);
        return (
          <g>
            <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} className="ink-graphite" strokeDasharray="4 3" strokeWidth={3} />
            <text x={sx1 - 8} y={(sy1 + sy2) / 2} textAnchor="end" className="plate-label">A cos θ</text>
          </g>
        );
      })()}
      {can && <circle cx={cx} cy={cy} r={14} className="handle-ring" />}
    </g>
  );
}

const TONE_CLASS: Record<string, string> = { charge: "ink-charge", field: "ink-field", flux: "ink-flux", surface: "ink-surface", ink: "ink" };

function VectorView({ ev }: ViewProps) {
  const p = ev.params as { from: number[]; to: number[]; label: string; tone: string; arcTo?: number[] };
  const [x1, y1] = toSvg(p.from);
  const [x2, y2] = toSvg(p.to);
  const arc = p.arcTo
    ? (() => {
        const a1 = Math.atan2(p.to[2]! - p.from[2]!, p.to[0]! - p.from[0]!);
        const a2 = Math.atan2(p.arcTo[2]! - p.from[2]!, p.arcTo[0]! - p.from[0]!);
        const r = 0.28;
        const [ax1, ay1] = toSvg([p.from[0]! + r * Math.cos(a1), 0, p.from[2]! + r * Math.sin(a1)]);
        const [ax2, ay2] = toSvg([p.from[0]! + r * Math.cos(a2), 0, p.from[2]! + r * Math.sin(a2)]);
        const mid = (a1 + a2) / 2;
        const [lx, ly] = toSvg([p.from[0]! + (r + 0.12) * Math.cos(mid), 0, p.from[2]! + (r + 0.12) * Math.sin(mid)]);
        return (
          <g>
            <path d={`M${ax1} ${ay1} A${r * PX} ${r * PX} 0 0 ${a1 > a2 ? 1 : 0} ${ax2} ${ay2}`} fill="none" className="ink" />
            <text x={lx} y={ly} className="plate-label">θ</text>
          </g>
        );
      })()
    : null;
  return (
    <g className="v-vector" role="img" aria-label={`Vector ${p.label}`}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className={TONE_CLASS[p.tone] ?? "ink"} strokeWidth={2} markerEnd={`url(#arrow-${p.tone === "ink" ? "graphite" : p.tone})`} />
      <text x={x2 + 6} y={y2 - 4} className="plate-label">{p.label}</text>
      {arc}
    </g>
  );
}

function PatchTilingView({ ev }: ViewProps) {
  const segs = ev.model.segments as { p: number[]; dn: number | null }[];
  const max = Math.max(1e-30, ...segs.map((s) => Math.abs(s.dn ?? 0)));
  const per = Math.max(1, Math.round(segs.length / (4 * Math.max(1, ev.params.n as number))));
  return (
    <g className="v-tiling" role="img" aria-label={`Surface split into ${String(ev.model.count)} patches`}>
      {segs.map((s, i) => {
        const b = segs[(i + 1) % segs.length]!;
        const [x1, y1] = toSvg(s.p);
        const [x2, y2] = toSvg(b.p);
        const c = s.dn ?? 0;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={c >= 0 ? "shade-out" : "shade-in"} strokeOpacity={0.15 + (0.85 * Math.abs(c)) / max} />;
      })}
      <path d={pathD(segs.map((s) => s.p))} className="ink-surface" fill="none" />
      {segs.filter((_, i) => i % per === 0).map((s, i) => {
        const [x, y] = toSvg(s.p);
        return <circle key={i} cx={x} cy={y} r={2} className="fill-paper ink" />;
      })}
    </g>
  );
}
```

Add to `forma.css`: `.patch-edge { stroke: var(--surface); stroke-width: 7; stroke-linecap: round; }`.

- **`PlateStage.tsx`:** make the arrow markers loop over `["flux", "surface", "graphite", "charge", "field"]`.
- **`Readouts.tsx`:** extend `LABEL` with:

```ts
  dPsi: "dΨ through the patch", Dn: "D·n̂", shadow: "Shadow A cos θ", theta: "θ (D to normal)", magnitude: "|D|", sum: "Σ D·dS over the patches", count: "Patches",
```

  and extend `TONE` with `dPsi: "flux", Dn: "flux", shadow: "surface", theta: "surface", magnitude: "flux", sum: "flux"`.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run apps/web && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS. The views test covers the new components, the hex-scan test covers the new code, and the readout-label test covers the new readouts.

- [ ] **Step 5: Commit**

```bash
git add apps/web packages/ui && git commit -m "feat(web): views for uniform field, flat patch (keyboard-turnable), vectors and patch tiling; check gate history rule"
```

---

### Task 8: Timeline marks

**Files:**
- Modify: `app/packages/ui/src/primitives.tsx`
- Test: `app/packages/ui/test/timeline.test.ts`

**Interfaces:**
- Produces:
  - `Timeline` accepts `marks?: { index: number; label: string }[]`. When given, ticks render only for the marks (labelled), not for every step.
  - `visibleTicks(stepsCount, marks?)` (pure).

- [ ] **Step 1: Write the failing test**: `app/packages/ui/test/timeline.test.ts`

```ts
import { expect, it } from "vitest";
import { visibleTicks } from "../src/primitives";

it("shows one tick per step for short lessons, and only the marks for long ones", () => {
  expect(visibleTicks(3)).toEqual([{ index: 0, label: "§1" }, { index: 1, label: "§2" }, { index: 2, label: "§3" }]);
  expect(visibleTicks(40, [{ index: 0, label: "1 Flux" }, { index: 9, label: "Example 1" }])).toEqual([{ index: 0, label: "1 Flux" }, { index: 9, label: "Example 1" }]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/ui/test/timeline.test.ts`
Expected: FAIL (`visibleTicks` is not exported).

- [ ] **Step 3: Implement**: in `primitives.tsx`, add:

```tsx
export const visibleTicks = (count: number, marks?: { index: number; label: string }[]) =>
  marks ?? Array.from({ length: count }, (_, k) => ({ index: k, label: `§${k + 1}` }));
```

Change `Timeline` to accept `marks?: { index: number; label: string }[]`. Replace the ticks list with:

```tsx
        <ol className="timeline-ticks">
          {visibleTicks(steps.length, marks).map((t) => (
            <li key={t.index} style={marks ? { position: "absolute", left: `${(100 * t.index) / Math.max(1, steps.length - 1)}%` } : undefined}>
              <button type="button" disabled={t.index > lock} aria-current={t.index === i ? "step" : undefined} onClick={() => onScrub(t.index)}>
                {t.label}
                <span className="sr-only"> {steps[t.index]?.title}</span>
              </button>
            </li>
          ))}
        </ol>
```

and add `.timeline-ticks { position: relative; min-height: 1.4em; }` to `forma.css`, keeping the existing flex rule for the unmarked case.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/ui && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui && git commit -m "feat(ui): timeline marks for long lessons"
```

---

### Task 9: Web: idea-aware player: location, latex, asks, traps, gate and remediation, recap cards, sheet, ⌘K asks

**Files:**
- Create: `app/apps/web/components/plate/idea.tsx`, `app/apps/web/app/c/[course]/[concept]/sheet/page.tsx`
- Modify:
  - `components/plate/PlatePlayer.tsx`, `components/plate/interactions.tsx`
  - `components/workspace/LearnMode.tsx`
  - `lib/workspace.ts` (`ask` param), `lib/commands.ts` (asks), `lib/course.ts` (`ideaMetaFor`)
- Test: `app/apps/web/test/workspace.test.ts` and `test/commands.test.ts` (append)

**Interfaces:**
- Consumes: `IdeaMeta`, `stepLocation`, `timelineMarks`, `askState` (`@forma/plate`); `ideaPlates`, `templates` (`@forma/course-em1`); `instantiate`, `seedOf` (`@forma/engine`).
- Produces:
  - `WorkspaceParams.ask?: string`
  - commands `q:<plate>:<ask>` in group "Questions"
  - `ideaMetaFor(plateId)`
  - route `/c/em1/<concept>/sheet`

- [ ] **Step 1: Write the failing tests**: append to `test/workspace.test.ts`:

```ts
it("reads an ask id, and drops malformed ones", () => {
  expect(parse("lesson=flux-surface&ask=why-cos").ask).toBe("why-cos");
  expect(parse("ask=Bad%20Id").ask).toBeUndefined();
});
```

Append to `test/commands.test.ts`:

```ts
it("lists every question students ask as a searchable command", () => {
  const q = cmds.filter((c) => c.group === "Questions");
  expect(q.length).toBeGreaterThanOrEqual(8);
  expect(rankCommands("negative flux", cmds)[0]!.id).toBe("q:flux-surface:negative");
  expect(q.find((c) => c.id === "q:flux-surface:negative")!.action).toEqual({ kind: "href", href: conceptHref("em1.electrostatics.gauss-law", "learn", { lesson: "flux-surface", ask: "negative" }) });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run apps/web`
Expected: FAIL (`ask` missing; no Questions commands).

- [ ] **Step 3: Params, course helper, commands**
- **`lib/workspace.ts`:**
  - add `ask?: string` to `WorkspaceParams`;
  - in `parseWorkspaceParams`, `const k = search.get("ask");`, then `...(k && /^[a-z0-9-]+$/.test(k) ? { ask: k } : {}),`.
- **`lib/course.ts`:**

```ts
import { ideaPlates } from "@forma/course-em1";
export const ideaMetaFor = (plateId: string) => ideaPlates[plateId]?.meta;
```

- **`lib/commands.ts`:** add after `formulas`:

```ts
  const questions = course.concepts.flatMap((c) =>
    c.lessons.flatMap((l) =>
      l.blocks.flatMap((b) => {
        const meta = b.type === "plate" ? ideaMetaFor(b.plateId) : undefined;
        return (meta?.ideas ?? []).flatMap((idea) =>
          idea.asks.map((a) => ({ id: `q:${meta!.plateId}:${a.id}`, label: a.q, group: "Questions", keywords: `${idea.title} ${a.a.slice(0, 80)}`, action: { kind: "href" as const, href: conceptHref(c.id, "learn", { lesson: l.id, ask: a.id }) } })),
        );
      }),
    ),
  );
```

  and return `[...concepts, ...tools, ...formulas, ...questions, ...pages]`.

- [ ] **Step 4: `components/plate/idea.tsx`**

```tsx
"use client";

import type { AskInput } from "@forma/plate";
import { Tex } from "../Tex";

export function AsksList({ asks, open, onOpen }: { asks: AskInput[]; open: string | null; onOpen: (id: string | null) => void }) {
  const current = asks.find((a) => a.id === open);
  return (
    <section className="asks space-y-2" aria-labelledby="asks-title">
      {current ? (
        <div className="ask-open card space-y-2" role="region" aria-label={current.q}>
          <p className="kicker">Question students ask</p>
          <h3 className="text-lg">{current.q}</h3>
          <p className="margin-body">{current.a}</p>
          <button className="btn text-sm" onClick={() => onOpen(null)}>Back to the step</button>
        </div>
      ) : (
        <details>
          <summary id="asks-title">Questions students ask ({asks.length})</summary>
          <ul className="mt-2 space-y-1">
            {asks.map((a) => (
              <li key={a.id}>
                <button className="text-left underline" onClick={() => onOpen(a.id)}>{a.q}</button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function TrapNote({ text }: { text: string }) {
  return (
    <div className="fb fb-again text-sm" role="note">
      <strong>Trap.</strong> {text}
    </div>
  );
}

export function WorkedLines({ title, lines }: { title: string; lines: { text: string; latex?: string }[] }) {
  return (
    <div className="card space-y-2" role="region" aria-label={title}>
      <p className="kicker">{title}</p>
      <ol className="list-decimal space-y-1 pl-5">
        {lines.map((l, i) => (
          <li key={i}>
            {l.text}
            {l.latex && <Tex latex={l.latex} display />}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RecapCard({ title, points, traps }: { title: string; points: string[]; traps: string[] }) {
  return (
    <section className="recap-card card space-y-2" aria-label={`Recap: ${title}`}>
      <p className="kicker">Recap</p>
      <h3 className="text-lg">{title}</h3>
      <ul className="list-disc space-y-1 pl-5">{points.map((p, i) => <li key={i}>{p}</li>)}</ul>
      {traps.length > 0 && (
        <>
          <p className="label">Traps</p>
          <ul className="list-disc space-y-1 pl-5">{traps.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </>
      )}
    </section>
  );
}

export const recapMarkdown = (title: string, points: string[], traps: string[]) =>
  [`Recap · ${title}`, "", ...points.map((p) => `- ${p}`), ...(traps.length ? ["", "Traps:", ...traps.map((t) => `- ${t}`)] : [])].join("\n");
```

- [ ] **Step 5: Interactions: strict checks, misses, template variants**: in `interactions.tsx`:
- Extend `Props` with:
  - `strict?: boolean` (a check step: unlock only when correct);
  - `onMiss?: () => void`;
  - `numericVariant?: { key: string; prompt: string; spec: NumericSpec; hints: string[] }`.

  Import `type NumericSpec` from `@forma/engine`.
- **`Choose` and `Identify`:** accept `strict` and `onMiss`. Replace `if (o.correct || a >= 2) onComplete();` (and the Identify equivalent) with:

```tsx
    if (!o.correct) onMiss?.();
    if (o.correct || (!strict && a >= 2)) onComplete();
```

- **Numeric branch:**

```tsx
    case "numeric": {
      const v = p.numericVariant;
      let lastCorrect = false;
      return (
        <NumericField
          key={v?.key ?? i.id}
          spec={v?.spec ?? { answer: i.answer, relTol: i.relTol, distractors: i.distractors }}
          prompt={v?.prompt ?? i.prompt}
          hints={v?.hints ?? i.hints}
          onAnswer={(verdict, attempt) => {
            lastCorrect = verdict.correct;
            if (!verdict.correct) p.onMiss?.();
            const fx = p.onAnswer({ correct: verdict.correct, attempt, ...(verdict.tag ? { tag: verdict.tag } : {}), ...(verdict.errorClass ? { errorClass: verdict.errorClass } : {}) });
            return { revealWorked: fx.some((e) => e.type === "revealWorkedStep") };
          }}
          onSolved={() => (!p.strict || lastCorrect) && p.onComplete()}
        />
      );
    }
```

- Pass `strict={p.strict}` and `onMiss={p.onMiss}` into `Choose` and `Identify` in `InteractionView`.

- [ ] **Step 6: PlatePlayer**: in `PlateRun`:
- **Props:** add `initialAsk?: string` to `PlatePlayer` and `PlateRun`. Thread it from `LearnMode` (`{...(p.ask ? { initialAsk: p.ask } : {})}`) and only to the starting block (`bi === start`).
- **State and derived values** (after `const step = …`):

```tsx
  const meta = ideaMetaFor(plate.id);
  const idea = meta?.ideas.find((x) => index >= x.start && index <= x.end);
  const learner = useStudy((s) => s.learner);
  const nextVariant = useStudy((s) => s.nextVariant);
  const [askOpen, setAskOpen] = useState<string | null>(initialAsk ?? null);
  const [misses, setMisses] = useState<Record<string, number>>({});
  const ask = askOpen ? meta?.ideas.flatMap((x) => x.asks.map((a) => ({ a, x }))).find((y) => y.a.id === askOpen) : undefined;
```

- **Ask preview:** replace `let state = applyOverrides(tl.state, overrides);` with:

```tsx
  let state = ask ? applyOverrides(askState(plate, ask.x, ask.a), overrides) : applyOverrides(tl.state, overrides);
```

  The learner's overrides stay layered and untouched. Closing the ask returns to the step, with the overrides still there.
- **Template variant for numeric checks:**

```tsx
  const tpl = interaction?.type === "numeric" && interaction.template ? templates.find((t) => t.id === interaction.template) : undefined;
  const variant = tpl ? instantiate(tpl, seedOf(learner, tpl.id)) : undefined;
  const remediation = tpl ? instantiate(tpl, seedOf(learner, tpl.id) + 1000) : undefined;
```

- **Recap save (once per idea):**

```tsx
  const notebook = learner.notebook;
  useEffect(() => {
    for (const x of meta?.ideas ?? []) {
      const title = `Recap · ${x.title}`;
      if (x.checks.every((c) => answered.has(c.id)) && !notebook.some((n) => n.title === title))
        void addNote({ conceptId, kind: "note", title, body: recapMarkdown(x.title, x.recap.points, x.recap.traps) });
    }
  }, [meta, answered, notebook, addNote, conceptId]);
```

- **Margin changes:**
  - `MarginNote` kicker: `meta ? stepLocation(meta, index) : …existing kicker…`.
  - After `<p>{step.note}</p>`, add `{step.latex && <Tex latex={step.latex} display />}`.
  - Then show the trap on each example's last line:

```tsx
  {(() => { const ex = idea?.examples.find((e) => e.end === index); return ex?.trap ? <TrapNote text={ex.trap} /> : null; })()}
```

  - On recap steps, replace the note body with `<RecapCard title={idea.title} points={idea.recap.points} traps={idea.recap.traps} />`. Add a link `Open the revision sheet →` to `/c/${course.id}/${encodeURIComponent(conceptId)}/sheet`.
  - Under the `MarginNote`, when `idea`, add `<AsksList asks={idea.asks} open={askOpen} onOpen={setAskOpen} />`.
  - **`InteractionView`:** pass
    - `strict={step.kind === "check"}`
    - `onMiss={() => setMisses((m) => ({ ...m, [interaction.id]: (m[interaction.id] ?? 0) + 1 }))}`
    - `numericVariant={variant ? { key: variant.key, prompt: variant.prompt, spec: variant.spec, hints: variant.hints } : undefined}`
  - **Remediation**, right after the interaction, when `(misses[interaction.id] ?? 0) >= 2 && step.kind === "check" && !answered.has(interaction.id)`:

```tsx
            <div className="space-y-2" role="status">
              {remediation ? (
                <>
                  <WorkedLines title="Worked example with new numbers" lines={[{ text: remediation.prompt }, ...remediation.worked]} />
                  <button className="btn" onClick={() => { nextVariant(tpl!.id); setMisses((m) => ({ ...m, [interaction.id]: 0 })); }}>Try a new one</button>
                </>
              ) : (
                <p className="text-sm">
                  Look again at{" "}
                  {idea?.examples.map((ex, k) => (
                    <button key={ex.id} className="underline mr-2" onClick={() => pb.go(ex.start)}>worked example {k + 1}</button>
                  ))}
                  then try this check again.
                </p>
              )}
            </div>
```

  (Going back is always allowed; the lock only limits forward travel.)
- **Timeline:** pass `marks={meta ? timelineMarks(meta) : undefined}`.
- **Imports:**
  - `askState`, `stepLocation`, `timelineMarks` from `@forma/plate`;
  - `instantiate`, `seedOf` from `@forma/engine`;
  - `templates` from `@forma/course-em1`;
  - `ideaMetaFor` and `course` from `@/lib/course`;
  - `Tex`;
  - `AsksList`, `RecapCard`, `TrapNote`, `WorkedLines`, `recapMarkdown` from `./idea`.
- **`LearnMode.tsx`:** pass `initialAsk`.

- [ ] **Step 7: Revision sheet**: `app/c/[course]/[concept]/sheet/page.tsx`

```tsx
import { course } from "@forma/course-em1";
import { RevisionSheet } from "@/components/plate/RevisionSheet";

export function generateStaticParams() {
  return course.concepts.filter((c) => !c.locked).map((c) => ({ course: course.id, concept: c.id }));
}
export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  return <RevisionSheet conceptId={decodeURIComponent(concept)} />;
}
```

`components/plate/RevisionSheet.tsx`:

```tsx
"use client";

import Link from "next/link";
import { conceptHref, getConcept, ideaMetaFor } from "@/lib/course";
import { RecapCard } from "./idea";

export function RevisionSheet({ conceptId }: { conceptId: string }) {
  const concept = getConcept(conceptId);
  const ideas = (concept?.lessons ?? []).flatMap((l) => l.blocks.flatMap((b) => (b.type === "plate" ? ideaMetaFor(b.plateId)?.ideas ?? [] : [])));
  return (
    <article className="revision-sheet mx-auto max-w-3xl space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="kicker">Revision sheet</p>
          <h1 className="text-3xl">{concept?.title ?? "Unknown concept"}</h1>
        </div>
        <button className="btn print:hidden" onClick={() => window.print()}>Print</button>
      </header>
      {ideas.length ? ideas.map((x) => <RecapCard key={x.id} title={x.title} points={x.recap.points} traps={x.recap.traps} />) : <p className="text-soft">This concept has no in-depth ideas yet.</p>}
      <Link className="underline print:hidden" href={conceptHref(conceptId, "learn")}>Back to the concept</Link>
    </article>
  );
}
```

Append to `forma.css`:

```css
@media print { .topbar, .tool-dock, .status-footer, .tool-pane, .split-handle { display: none !important; } .shell-main { padding: 0; } .recap-card { break-inside: avoid; } }
```

- [ ] **Step 8: Run tests, typechecks and build**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all pass. The build lists `/c/em1/[concept]/sheet`.

- [ ] **Step 9: Commit**

```bash
git add -A apps/web packages/ui && git commit -m "feat(web): idea-aware player (location, derivations, asks, traps, check gate with remediation, recap cards), revision sheet, ⌘K questions"
```

---

### Task 10: Playwright: the idea, end to end

**Files:**
- Create: `app/apps/web/e2e/ideas.spec.ts`

- [ ] **Step 1: Write the spec**

```ts
import { expect, test } from "@playwright/test";
import { choose, concept, G, margin, next, open } from "./helpers";

const url = concept(G, "mode=learn&lesson=flux-surface");
const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("an idea teaches, works examples line by line, answers asks, gates checks, and saves a recap", async ({ page }) => {
  await open(page, url);
  await margin(page, "A steady stream of D");
  await expect(kicker(page)).toHaveText("Idea 1 · Flux through a surface · Explanation 1 of 7");
  for (let k = 0; k < 7; k++) await next(page);
  await margin(page, "A 2 m square at 60°");
  await next(page);
  await next(page);
  await expect(kicker(page)).toHaveText("Idea 1 · Flux through a surface · Worked example 1 of 3 · line 2");
  await next(page);
  await expect(page.getByRole("note")).toContainText("about 1.7 times too big");

  // An ask previews its own plate state and then returns to the step.
  await page.getByText("Questions students ask (8)").click();
  await page.getByRole("button", { name: "Can flux be negative?" }).click();
  await expect(page.getByText("dΨ through the patch")).toBeVisible();
  await expect(page.locator(".readouts")).toContainText("-2.598");
  await page.getByRole("button", { name: "Back to the step" }).click();
  await expect(page.locator(".readouts")).toContainText("6");

  // Walk through the remaining worked examples to the first check.
  for (let k = 0; k < 11; k++) await next(page);
  await margin(page, "Check: edge-on");
  await next(page); // locked
  await margin(page, "Check: edge-on");
  await choose(page, "Negative");
  await choose(page, "The largest it can be");
  await expect(page.getByRole("button", { name: "worked example 1" })).toBeVisible(); // remediation after two misses
  await next(page);
  await margin(page, "Check: edge-on"); // still locked: checks need a correct answer
  await choose(page, "Zero");
  await next(page);

  await margin(page, "Check: predict the tilt");
  await page.getByRole("slider", { name: "Your prediction, in µC" }).fill("8.5");
  await page.getByRole("button", { name: "Commit prediction" }).click();
  await next(page);

  await margin(page, "Check: tilt to a target");
  const tilt = page.getByRole("slider", { name: /Patch tilt/ });
  await tilt.focus();
  for (let k = 0; k < 31; k++) await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Done. Look at the readouts.")).toBeVisible();
  await next(page);

  await margin(page, "Check: your own numbers");
  const answerBox = page.getByRole("textbox", { name: "Your answer, with units" });
  await answerBox.fill("1 µC");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await answerBox.fill("2 µC");
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByRole("region", { name: "Worked example with new numbers" })).toBeVisible();
  await page.getByRole("button", { name: "Try a new one" }).click();
  const prompt = (await page.getByText(/A flat .* rectangle sits in a uniform field/).textContent())!;
  const [, a, b, D, th] = prompt.match(/flat ([\d.]+) m × ([\d.]+) m rectangle .* D = ([\d.]+) µC\/m², with its normal at ([\d.]+)°/)!;
  const psi = Math.round(Number(D) * Number(a) * Number(b) * Math.cos((Number(th) * Math.PI) / 180) * 1e4) / 1e4;
  await answerBox.fill(`${psi} µC`);
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await expect(page.getByText("✓ Understood.")).toBeVisible();
  await next(page);

  await margin(page, "Check: flip the normal");
  await choose(page, "Flips sign, same size");
  await next(page);
  await margin(page, "Recap · Flux through a surface");
  await expect(page.getByRole("region", { name: "Recap: Flux through a surface" })).toBeVisible();

  await page.reload();
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15_000 });
  await page.goto("/notebook");
  await expect(page.getByText("Recap · Flux through a surface")).toHaveCount(1);
  await page.goto(`/c/em1/${G}/sheet`);
  await expect(page.getByRole("region", { name: "Recap: Flux through a surface" })).toBeVisible();
});

test("⌘K finds a question students ask and opens it on its plate", async ({ page }) => {
  await open(page, "/");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("negative flux");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/ask=negative/);
  await expect(page.getByRole("region", { name: "Can flux be negative?" })).toBeVisible();
});

test("a long lesson's scrub bar shows marks, not one tick per step", async ({ page }) => {
  await open(page, url);
  const ticks = page.locator(".timeline-ticks button");
  expect(await ticks.count()).toBeLessThan(12);
  await expect(page.locator(".timeline-ticks")).toContainText("Example 1");
});
```

Notes for the executor:
- The explain count (7), the example line counts (3, 3, 5) and the tilt presses (31 × 0.5° from 60° to 75.5°) come from Task 6's content. If Task 6 changes the content, update these numbers.
- After example 1's last line, 11 steps reach the first check: the example 2 problem plus 3 lines (4), the example 3 problem plus 5 lines (6), and 1 onto the check.
- The "Check" button on the choose interaction and the NumericField's "Check" share a name. Choose's is used only on choose steps.

- [ ] **Step 2: Run the spec, then the whole suite**

```bash
cd /f/StudyBuddy/app/apps/web
pnpm e2e -g "idea|question students|scrub bar"
pnpm e2e
```

Expected: all pass. The a11y spec already visits the Gauss concept in Learn. Add `concept(G, "mode=learn&lesson=flux-surface")` and `/c/em1/${G}/sheet` to its `SCREENS` so the new margin, asks, cards and sheet are scanned in both themes.

- [ ] **Step 3: Commit**

```bash
git add -A apps/web && git commit -m "test(e2e): idea lesson end to end, ⌘K questions, timeline marks, axe on new screens"
```

---

### Task 11: Verification and handoff

- [ ] **Step 1:** Run `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`. All green.
- [ ] **Step 2:** Walk the idea in the built-in browser at 1360×900.
  - Read every explain step and example line against the plate.
  - Open 3 asks.
  - Miss a check twice.
  - Print the revision sheet (browser print preview).
  - Fix anything visibly wrong or unclear in the text or plate. Record it in the commit.
- [ ] **Step 3:** In `app/README.md`, add a short "Teaching model" paragraph:
  - ideas: Explain → Worked examples → Questions students ask → Checks → Recap;
  - the coverage and number lints, and where lessons are authored (`packages/course-em1/src/plates/*.ts` via `defineIdeaPlate`).

  Commit with `git commit -m "docs: teaching model"`.

---

## Self-Review Notes

- **Spec coverage (amendment §1 and §3):**
  - **Teaching model:**
    - Explain 3–6+ steps with derivations in view (`latex` rendered inline, Task 9).
    - Three worked examples at rising difficulty, line-stepped with a trap on the last line (Tasks 4, 6 and 9).
    - Asks: 6–10, ≤ 80 words, plate-previewed, searchable in ⌘K (Tasks 4, 6 and 9).
    - Checks: concept, plate task, template numeric variant and prediction, with the gate and remediation (Tasks 5, 7 and 9).
    - Recap cards saved once and merged into the revision sheet (Task 9).
  - **Value guarantee:** `coverageGaps` plus the course test (Tasks 4 and 6), and the depth-floor test (Task 6).
  - **Lints:** 180/80 words and the slide rule by kind (Tasks 1 and 4); unbacked numbers (Task 2).
  - **Components:** uniform-field, flat-patch, vector, patch-tiling (Tasks 3 and 7). Line and sheet charges, and cylinder/pillbox surfaces, already have views (Plan B `ChargesView`, the gaussian-surface outline).
  - **Narration hooks:** kept. Every compiled step has the `narration` slot and cue track.
- **Type consistency:**
  - `CompiledIdeas`, `IdeaMeta`, `AskInput` are defined in Task 4 and used in Tasks 6 and 9.
  - `Variant.worked` comes from Task 5 and is used in Tasks 6 and 9.
  - `Step.kind` comes from Task 1 and is used in Tasks 4, 7 and 9.
  - The `patch-flux-3` check is defined in Task 6 and used by the flux-surface content.
  - Readout names match between Task 3 (models) and Task 7 (labels).
- **Known ceilings:**
  - LaTeX lines are not number-linted: only text is. Keep every number that appears in a `latex` line in the matching `text` too, as the content does.
  - Asks preview in the idea's final visibility state plus their own `show`/`hide`.
