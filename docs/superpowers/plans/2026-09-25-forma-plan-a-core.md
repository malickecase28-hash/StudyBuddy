# Forma Plan A: Core (physics, engine, plate engine, Gauss content) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Forma's headless core. Rename the packages to `@forma/*`. Extend physics (sheet charges, cylinders and pillboxes, potential, line/sheet enclosed charge). Add the engine grammar (plate block, on-plate interactions, branching routes, question templates, symbolic checking, learner-state v2). Create the new `@forma/plate` engine (components, scene evaluation, steps, timeline with cues, focus links, validation). Rebuild Gauss's law as physics-verified plates.

**Architecture:** Pure TypeScript packages, no DOM.
- `@forma/plate` owns the component contract and timeline. Component *models* live here; React *views* are registered later by the app (Plan B).
- Course content composes plates from components.
- A replay validator checks every plate step against the component schemas and the physics.

**Tech Stack:** Node 24, pnpm 11, TypeScript 7, Vitest 5, Zod 4, `@cortex-js/compute-engine` 0.135.

**Spec:** `docs/superpowers/specs/2026-09-25-forma-identity-shell-plate-engine-design.md` (§2, §4, §5, §6, §7, §8). The v1 spec `docs/superpowers/specs/2026-09-25-em1-vertical-slice-design.md` still governs the engine, physics and verification rules.

**Plan series:** A Core (this) → B Interface (`@forma/ui`, plate renderer and views, app shell, modes, e2e). Plan B is written and reviewed before it's executed.

## Global Constraints

- Runtime makes zero network or LLM calls; all core packages are pure functions.
- Physics in SI internally. Content-facing units: charge in **µC**, lengths in **m**, D readouts in **µC/m^2**, E in **V/m**. `EPS0 = 8.8541878128e-12`.
- Content may set only component **params**. Derived values (flux, field, enclosed charge) come only from component models, which call `@forma/physics`.
- Dependency rules:
  - `physics` depends on nothing.
  - `engine` depends on `physics` types only.
  - `plate` core depends on `physics` and on `engine` (types and schemas only).
  - Courses depend on `engine`, `plate` and `physics`.
- Margin note budget is **60 words** (lint warning above). Narration transcript overlap with the note above **60%** of tokens triggers a warning.
- Timeline phases (fraction of a step transition): exits `[0, 0.25]`, tweens `[0.2, 0.8]`, enters `[0.45, 1]`; focus switches at `0.9`. Easing is `easeInOutCubic`.
- Every block and plate step carries `source` / `licence` (blocks) or belongs to a sourced lesson.
- Commands run from `F:\StudyBuddy\app` unless stated. Commit after each task.

## Review Focus

1. **Scrubbing past either end** (`pos < 0`, `pos > steps−1`, `NaN`) should clamp to the first/last state and never throw. Tested in Task 9.
2. **A step patch, show, focus or claim naming an instance that doesn't exist** should produce a `validatePlate` error with the step id, not an uncaught exception. Tested in Task 10.
3. **A point charge dragged exactly onto the Gaussian surface** should keep finite readouts (flux = enclosed + ½·charge on the surface, `onSurface: true`), never `NaN`/`Infinity`. Tested in Task 11.
4. **A template seed that makes a distractor coincide with the answer** must never happen: across seeds 1–200 no distractor is within tolerance of the answer. Tested in Task 13.
5. **Real v1 saved data** (theme `"night"`, notebook `"drawing"` entries, position without a plate step) should migrate to v2 with nothing lost. Tested in Task 6.

---

## File Structure

```
app/
  package.json                          name → "forma"
  packages/
    physics/src/{charges,surfaces,flux,potential,index}.ts   (+ sheet, cylinder, potential)
    engine/src/schema/interactions.ts   on-plate interaction grammar + routes
    engine/src/schema/blocks.ts         (+ PlateBlock)
    engine/src/routes.ts                pickRoute()
    engine/src/templates.ts             seeded question templates
    engine/src/symbolic.ts              LaTeX equivalence via Compute Engine
    engine/src/learner-state.ts         v2 state + v1→v2 migration
    plate/                              NEW @forma/plate
      src/component.ts                  defineComponent, Registry, types
      src/lerp.ts                       lerpValue, isLerpable, deepEqual, clone
      src/scene.ts                      createEvaluator (memoised)
      src/plate.ts                      PlateDef/Step/Cue/Narration/Claim schemas, stateAt, diffStates
      src/timeline.ts                   frameAt, applyCues, easing
      src/focus.ts                      termTargets, instanceTerms
      src/validate.ts                   validatePlate
      src/components/em.ts              EMag component models
      src/index.ts
      test/*.test.ts
    course-em1/src/plates/{faraday,gauss,detours}.ts
    course-em1/src/checks.ts            goal checks over frames
    course-em1/src/templates.ts         Q.06, Q.08, Q.09a, Finals 2024-25 Q2(a)
    course-em1/src/{index,report}.ts    (modified)
    course-em1/test/{plates,templates}.test.ts
```

---

### Task 1: Rename packages to `@forma/*`

**Files:**
- Modify: every `package.json`, `.ts`, `.tsx` and `next.config.ts` under `app/` that references `@studybuddy/` (list: `grep -rl "@studybuddy/" --include=*.{ts,tsx,json} . | grep -v node_modules | grep -v .next`)
- Modify: `app/package.json` (`"name": "forma"`)

**Interfaces:**
- Produces: packages named `@forma/physics`, `@forma/engine`, `@forma/course-em1`. Directory names are unchanged.

- [ ] **Step 1: Rewrite references**

```bash
cd /f/StudyBuddy/app
grep -rl "@studybuddy/" --include=*.ts --include=*.tsx --include=*.json . | grep -v node_modules | grep -v "/.next/" | xargs sed -i 's#@studybuddy/#@forma/#g'
sed -i 's/"name": "studybuddy"/"name": "forma"/' package.json
pnpm install
```

- [ ] **Step 2: Verify nothing still references the old scope**

Run: `grep -rn "@studybuddy/" --include=*.ts --include=*.tsx --include=*.json . | grep -v node_modules | grep -v "/.next/" | wc -l`
Expected: `0`

- [ ] **Step 3: Run tests and typecheck**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: all tests pass (108), both typechecks exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A . && git commit -m "refactor: rename packages to @forma/*"
```

---

### Task 2: Physics: sheet charges, cylinders, line/sheet enclosed charge, potential

**Files:**
- Modify: `app/packages/physics/src/charges.ts`, `src/surfaces.ts`, `src/flux.ts`, `src/index.ts`
- Create: `app/packages/physics/src/potential.ts`
- Test: `app/packages/physics/test/extended.test.ts`; modify `test/flux.test.ts` (the "rejects line charges" case)

**Interfaces:**
- Produces:
  - `SheetCharge = { kind: "sheet"; rhoS: number; z0: number }` (infinite plane z = z0, C/m²); `Charge = PointCharge | LineCharge | SheetCharge`
  - `SurfaceShape` gains `{ kind: "cylinder"; center: Vec3; radius: number; height: number }` (axis ∥ z)
  - `enclosedCharge(charges, shape)`: point, line and sheet on sphere/cube/cylinder. Throws only for line/sheet with `blob`.
  - `potential(charges, p): number` (V; point charges only; throws on line/sheet: "reference-dependent")
  - `surfaceArea(shape, n?): number`

- [ ] **Step 1: Write the failing test**: `app/packages/physics/test/extended.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  EPS0, K_E, electricField, enclosedCharge, fluxThrough, potential, surfaceArea, surfacePatches, vec, type Charge, type SurfaceShape,
} from "../src";

const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe("sheet charge", () => {
  it("E = rhoS/(2 eps0), pointing away on both sides", () => {
    const s: Charge = { kind: "sheet", rhoS: 2e-6, z0: 0.5 };
    expect(electricField([s], vec(0, 0, 2))[2]).toBeCloseTo(2e-6 / (2 * EPS0), 3);
    expect(electricField([s], vec(0, 0, -1))[2]).toBeCloseTo(-2e-6 / (2 * EPS0), 3);
  });
});

describe("cylinder surface", () => {
  const cyl: SurfaceShape = { kind: "cylinder", center: vec(0, 0, 0), radius: 0.5, height: 2 };
  it("area = 2 pi R h + 2 pi R^2", () => {
    expect(surfaceArea(cyl, 24)).toBeCloseTo(2 * Math.PI * 0.5 * 2 + 2 * Math.PI * 0.25, 6);
  });
  it("coaxial line charge: flux = rhoL * h", () => {
    const line: Charge[] = [{ kind: "line", rhoL: 3e-9, x: 0, y: 0 }];
    expect(rel(fluxThrough(line, surfacePatches(cyl, 32)), 3e-9 * 2)).toBeLessThan(1e-6);
    expect(enclosedCharge(line, cyl)).toBeCloseTo(6e-9, 18);
  });
  it("pillbox across a sheet: flux = rhoS * pi R^2", () => {
    const sheet: Charge[] = [{ kind: "sheet", rhoS: 1e-6, z0: 0.2 }];
    const pill: SurfaceShape = { kind: "cylinder", center: vec(0, 0, 0), radius: 0.4, height: 1 };
    expect(rel(fluxThrough(sheet, surfacePatches(pill, 24)), 1e-6 * Math.PI * 0.16)).toBeLessThan(1e-6);
    expect(enclosedCharge(sheet, pill)).toBeCloseTo(1e-6 * Math.PI * 0.16, 15);
  });
});

describe("enclosed charge for line and sheet in other shapes", () => {
  it("line through a sphere encloses rhoL x chord", () => {
    const line: Charge[] = [{ kind: "line", rhoL: 1e-9, x: 0.3, y: 0 }];
    const sph: SurfaceShape = { kind: "sphere", center: vec(0, 0, 0), radius: 1 };
    const chord = 2 * Math.sqrt(1 - 0.09);
    expect(enclosedCharge(line, sph)).toBeCloseTo(1e-9 * chord, 18);
    expect(rel(fluxThrough(line, surfacePatches(sph, 64)), 1e-9 * chord)).toBeLessThan(1e-5);
  });
  it("sheet through a cube encloses rhoS x side^2; blob is rejected", () => {
    const sheet: Charge[] = [{ kind: "sheet", rhoS: 2e-6, z0: 0.1 }];
    expect(enclosedCharge(sheet, { kind: "cube", center: vec(0, 0, 0), side: 2 })).toBeCloseTo(8e-6, 15);
    expect(() => enclosedCharge(sheet, { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 })).toThrow(/blob/);
  });
});

describe("potential", () => {
  it("V = kq/r and superposes; rejects line charges", () => {
    const cs: Charge[] = [{ kind: "point", q: 2e-9, pos: vec(0, 0, 0) }, { kind: "point", q: -1e-9, pos: vec(2, 0, 0) }];
    expect(potential(cs, vec(1, 0, 0))).toBeCloseTo(K_E * 2e-9 - K_E * 1e-9, 9);
    expect(() => potential([{ kind: "line", rhoL: 1, x: 0, y: 0 }], vec(1, 0, 0))).toThrow(/reference/);
  });
});
```

In `test/flux.test.ts`, replace the test `"enclosedCharge rejects line charges"` with:

```ts
  it("enclosedCharge rejects line charges in a blob", () => {
    expect(() =>
      enclosedCharge([{ kind: "line", rhoL: 1e-9, x: 0, y: 0 }], { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 }),
    ).toThrow(/blob/);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/physics`
Expected: FAIL. `surfaceArea` and `potential` are not exported, and there's no sheet kind.

- [ ] **Step 3: Implement sheet charge**: in `src/charges.ts`, replace the type block and `fieldOf`:

```ts
export type PointCharge = { kind: "point"; q: number; pos: Vec3 };
/** Infinite uniform line charge parallel to the z-axis through (x, y). */
export type LineCharge = { kind: "line"; rhoL: number; x: number; y: number };
/** Infinite uniform sheet charge on the plane z = z0. */
export type SheetCharge = { kind: "sheet"; rhoS: number; z0: number };
export type Charge = PointCharge | LineCharge | SheetCharge;

function fieldOf(c: Charge, p: Vec3): Vec3 {
  if (c.kind === "point") {
    const r = sub(p, c.pos);
    const d = norm(r);
    return scale(r, (K_E * c.q) / (d * d * d));
  }
  if (c.kind === "sheet") {
    const side = Math.sign(p[2] - c.z0);
    return [0, 0, (side * c.rhoS) / (2 * EPS0)];
  }
  const rho: Vec3 = [p[0] - c.x, p[1] - c.y, 0];
  const d = norm(rho);
  return scale(rho, c.rhoL / (2 * EPS0 * Math.PI * d * d));
}
```

- [ ] **Step 4: Implement the cylinder**: in `src/surfaces.ts`, extend the union, `params`, `contains`, and add `surfaceArea`:

```ts
export type SurfaceShape =
  | { kind: "sphere"; center: Vec3; radius: number }
  | { kind: "cube"; center: Vec3; side: number }
  | { kind: "blob"; center: Vec3; radius: number; amplitude: number; lobes: number }
  | { kind: "cylinder"; center: Vec3; radius: number; height: number };
```

In `params(shape)`, before the cube branch, add:

```ts
  if (shape.kind === "cylinder") {
    const c = shape.center;
    const R = shape.radius;
    const h = shape.height / 2;
    const at = (x: number, y: number, z: number): Vec3 => add(c, [x, y, z]);
    return [
      // Side: r(z, φ) = (R cos φ, −R sin φ, z) so that r_z × r_φ points outward.
      { r: (z, p) => at(R * Math.cos(p), -R * Math.sin(p), z), u: [-h, h], v: [0, 2 * Math.PI], vPeriodic: true },
      // Top cap (+z) and bottom cap (−z; φ reversed for an outward normal).
      { r: (rho, p) => at(rho * Math.cos(p), rho * Math.sin(p), h), u: [0, R], v: [0, 2 * Math.PI], vPeriodic: true },
      { r: (rho, p) => at(rho * Math.cos(p), -rho * Math.sin(p), -h), u: [0, R], v: [0, 2 * Math.PI], vPeriodic: true },
    ];
  }
```

In `contains`, before the final blob code, add:

```ts
  if (shape.kind === "cylinder") return Math.hypot(d[0], d[1]) < shape.radius && Math.abs(d[2]) < shape.height / 2;
```

Append:

```ts
export function surfaceArea(shape: SurfaceShape, n = 24): number {
  return surfacePatches(shape, n).reduce((s, p) => s + norm(p.dS), 0);
}
```

- [ ] **Step 5: Implement enclosed charge for line/sheet**: replace `enclosedCharge` in `src/flux.ts`:

```ts
import type { LineCharge, SheetCharge } from "./charges";

function lineLengthInside(c: LineCharge, s: SurfaceShape): number {
  const dx = c.x - s.center[0];
  const dy = c.y - s.center[1];
  const d = Math.hypot(dx, dy);
  switch (s.kind) {
    case "sphere":
      return d < s.radius ? 2 * Math.sqrt(s.radius * s.radius - d * d) : 0;
    case "cube":
      return Math.abs(dx) < s.side / 2 && Math.abs(dy) < s.side / 2 ? s.side : 0;
    case "cylinder":
      return d < s.radius ? s.height : 0;
    case "blob":
      throw new Error("enclosedCharge: line charges in a blob are not supported");
  }
}

function sheetAreaInside(c: SheetCharge, s: SurfaceShape): number {
  const dz = Math.abs(c.z0 - s.center[2]);
  switch (s.kind) {
    case "sphere":
      return dz < s.radius ? Math.PI * (s.radius * s.radius - dz * dz) : 0;
    case "cube":
      return dz < s.side / 2 ? s.side * s.side : 0;
    case "cylinder":
      return dz < s.height / 2 ? Math.PI * s.radius * s.radius : 0;
    case "blob":
      throw new Error("enclosedCharge: sheet charges in a blob are not supported");
  }
}

/** Total charge strictly inside the closed surface (point, line and sheet distributions). */
export function enclosedCharge(charges: readonly Charge[], shape: SurfaceShape): number {
  return charges.reduce((s, c) => {
    if (c.kind === "point") return contains(shape, c.pos) ? s + c.q : s;
    if (c.kind === "line") return s + c.rhoL * lineLengthInside(c, shape);
    return s + c.rhoS * sheetAreaInside(c, shape);
  }, 0);
}
```

- [ ] **Step 6: Implement potential**: `src/potential.ts`

```ts
import type { Charge } from "./charges";
import { K_E } from "./constants";
import { norm, sub, type Vec3 } from "./vec";

/** Electric potential (V) with V(∞) = 0. Only point charges have a reference-free potential. */
export function potential(charges: readonly Charge[], p: Vec3): number {
  return charges.reduce((s, c) => {
    if (c.kind !== "point") throw new Error("potential: line and sheet potentials are reference-dependent");
    return s + (K_E * c.q) / norm(sub(p, c.pos));
  }, 0);
}
```

Append to `src/index.ts`: `export * from "./potential";`

- [ ] **Step 7: Run tests**

Run: `pnpm vitest run packages/physics && pnpm typecheck`
Expected: PASS, and typecheck exits 0. (If a cylinder flux tolerance fails, raise `n` in that test, not the tolerance.)

- [ ] **Step 8: Commit**

```bash
git add packages/physics && git commit -m "feat(physics): sheet charges, cylinders/pillboxes, line+sheet enclosed charge, potential"
```

---

### Task 3: Engine: plate block, on-plate interactions, branching routes

**Files:**
- Create: `app/packages/engine/src/schema/interactions.ts`, `app/packages/engine/src/routes.ts`
- Modify: `app/packages/engine/src/schema/blocks.ts` (add `PlateBlock` to `LeafBlock`), `app/packages/engine/src/index.ts`
- Test: `app/packages/engine/test/interactions.test.ts`

**Interfaces:**
- Produces:
  - `PlateBlock = { ...base, type: "plate", plateId: string }`, part of `Block`
  - `Interaction` (Zod discriminated union on `type`): `"predict-drag" | "place" | "manipulate-goal" | "identify" | "build-equation" | "choose" | "numeric" | "step-solve" | "sketch"`. Every variant has `id` and `routes: Route[]`.
  - `Route = { when: { outcome: "correct"|"incorrect"|"any"; choice?; reason?; attemptGte?; tag?; masteryBelow?: { conceptId; value } }; goto: { step?; lessonRef? }; say? }`
  - `RouteCtx = { outcome: "correct"|"incorrect"; choice?: string; reason?: string; attempt: number; tag?: string; tags: Record<string, number>; mastery: (conceptId: string) => number }`
  - `pickRoute(routes: Route[], ctx: RouteCtx): Route | null` (first match wins)

- [ ] **Step 1: Write the failing test**: `app/packages/engine/test/interactions.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { Block, Interaction, pickRoute, type Route } from "../src";

const meta = { mood: "vivid", source: { doc: "d", locator: "p" }, licence: "original" } as const;

describe("plate block + interactions", () => {
  it("parses a plate block", () => {
    expect(Block.parse({ ...meta, id: "gauss", type: "plate", plateId: "gauss" }).type).toBe("plate");
  });
  it("parses a predict-drag with a reveal patch and fills defaults", () => {
    const i = Interaction.parse({
      id: "flux-guess",
      type: "predict-drag",
      prompt: "Drag Ψ to your prediction",
      target: { instance: "surface", readout: "flux" },
      range: [0, 10],
      unit: "µC",
      reveal: { surface: { size: 2 } },
      dimension: "conceptual",
      feedback: { close: "Yes: unchanged.", far: "Area grows, D falls: they cancel." },
      tag: "FLUX_SCALES_WITH_AREA",
    });
    expect(i.type === "predict-drag" && i.relTol).toBe(0.05);
    expect(i.routes).toEqual([]);
  });
  it("rejects an unknown interaction type", () => {
    expect(Interaction.safeParse({ id: "x", type: "dance", dimension: "conceptual" }).success).toBe(false);
  });
});

describe("pickRoute", () => {
  const routes: Route[] = [
    { when: { outcome: "incorrect", tag: "FLUX_SCALES_WITH_AREA", attemptGte: 2 }, goto: { lessonRef: "em1.x.y/why-area" } },
    { when: { outcome: "incorrect", masteryBelow: { conceptId: "em1.math.s", value: 0.3 } }, goto: { lessonRef: "em1.math.s/main" }, say: "Refresh surface integrals first." },
    { when: { outcome: "correct", attemptGte: 1 }, goto: { step: "s5" } },
  ];
  const base = { tags: {}, mastery: () => 0.9 };
  it("routes by outcome, tag and attempt; first match wins", () => {
    expect(pickRoute(routes, { ...base, outcome: "incorrect", tag: "FLUX_SCALES_WITH_AREA", attempt: 2 })?.goto.lessonRef).toBe("em1.x.y/why-area");
    expect(pickRoute(routes, { ...base, outcome: "incorrect", tag: "FLUX_SCALES_WITH_AREA", attempt: 1 })).toBeNull();
    expect(pickRoute(routes, { ...base, outcome: "correct", attempt: 1 })?.goto.step).toBe("s5");
  });
  it("routes on prerequisite mastery", () => {
    const r = pickRoute(routes, { tags: {}, mastery: (id) => (id === "em1.math.s" ? 0.1 : 1), outcome: "incorrect", attempt: 1 });
    expect(r?.say).toMatch(/surface integrals/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/interactions.test.ts`
Expected: FAIL (`Interaction` is not exported).

- [ ] **Step 3: Implement the schema**: `app/packages/engine/src/schema/interactions.ts`

```ts
import { z } from "zod";
import { StepSolveBlock } from "./blocks";
import { Choice, Dimension, Id, NumericAnswerFields, Tag } from "./common";

export const Route = z.object({
  when: z.object({
    outcome: z.enum(["correct", "incorrect", "any"]).default("any"),
    choice: Id.optional(),
    reason: Id.optional(),
    attemptGte: z.number().int().positive().optional(),
    tag: Tag.optional(),
    masteryBelow: z.object({ conceptId: z.string().min(1), value: z.number().min(0).max(1) }).optional(),
  }),
  goto: z.object({ step: Id.optional(), lessonRef: z.string().min(1).optional() }),
  say: z.string().optional(),
});
export type Route = z.infer<typeof Route>;

const base = { id: Id, routes: z.array(Route).default([]) };
const Patch = z.record(z.string(), z.record(z.string(), z.unknown()));

export const Interaction = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("predict-drag"),
    prompt: z.string().min(1),
    target: z.object({ instance: z.string().min(1), readout: z.string().min(1) }),
    range: z.tuple([z.number(), z.number()]),
    unit: z.string(),
    relTol: z.number().positive().default(0.05),
    reveal: Patch.default({}),
    dimension: Dimension,
    feedback: z.object({ close: z.string().min(1), far: z.string().min(1) }),
    tag: Tag.optional(),
  }),
  z.object({
    ...base,
    type: z.literal("place"),
    prompt: z.string().min(1),
    handle: z.object({ instance: z.string().min(1), param: z.string().min(1) }),
    check: z.string().min(1),
    hint: z.string().min(1),
    dimension: Dimension,
  }),
  z.object({ ...base, type: z.literal("manipulate-goal"), goal: z.string().min(1), check: z.string().min(1), dimension: Dimension }),
  z.object({ ...base, type: z.literal("identify"), prompt: z.string().min(1), targets: z.array(Choice).min(2), dimension: Dimension }),
  z.object({
    ...base,
    type: z.literal("build-equation"),
    prompt: z.string().min(1),
    template: z.string().min(1),
    answers: z.record(Id, z.string().min(1)),
    feedback: z.object({ correct: z.string().min(1), incorrect: z.string().min(1) }),
    tag: Tag.optional(),
    dimension: Dimension,
  }),
  z.object({
    ...base,
    type: z.literal("choose"),
    prompt: z.string().min(1),
    options: z.array(Choice).min(2),
    selfExplain: z.object({ prompt: z.string().min(1), options: z.array(Choice).min(2) }).optional(),
    dimension: Dimension,
  }),
  z.object({ ...base, type: z.literal("numeric"), prompt: z.string().min(1), ...NumericAnswerFields, hints: z.array(z.string()).max(3).default([]), dimension: Dimension }),
  z.object({ ...base, type: z.literal("step-solve"), prompt: z.string().min(1), steps: StepSolveBlock.shape.steps, dimension: Dimension }),
  z.object({ ...base, type: z.literal("sketch"), prompt: z.string().min(1), solution: z.string().min(1), dimension: Dimension }),
]);
export type Interaction = z.infer<typeof Interaction>;
```

- [ ] **Step 4: Add `PlateBlock`**: in `src/schema/blocks.ts`, after `RetrievalBlock`:

```ts
export const PlateBlock = z.object({ ...base, type: z.literal("plate"), plateId: Id });
export type PlateBlock = z.infer<typeof PlateBlock>;
```

and add `PlateBlock,` to the `LeafBlock` discriminated-union array.

- [ ] **Step 5: Implement routes**: `app/packages/engine/src/routes.ts`

```ts
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
```

Append to `src/index.ts`:

```ts
export * from "./schema/interactions";
export * from "./routes";
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run packages/engine && pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/engine && git commit -m "feat(engine): plate block, on-plate interaction grammar, deterministic branching routes"
```

---

### Task 4: Engine: seeded question templates

**Files:**
- Create: `app/packages/engine/src/templates.ts`
- Modify: `app/packages/engine/src/index.ts`
- Test: `app/packages/engine/test/templates.test.ts`

**Interfaces:**
- Consumes: `NumericSpec` (answer.ts), `AuthoredQuantity`, `Distractor`, `Dimension`.
- Produces:
  - `ParamSpec = { min: number; max: number; step: number }`
  - `TemplateDef<P extends Record<string, number>> = { id; params: { [K in keyof P]: ParamSpec }; prompt(p): string; solve(p): { answer: AuthoredQuantity; distractors?: Distractor[] }; hints?(p): string[]; relTol?: number; dimension: Dimension; tags: { concepts: string[]; misconceptions: string[]; difficulty: 1|2|3|4|5 } }`
  - `defineTemplate<P>(t: TemplateDef<P>): TemplateDef<P>`
  - `mulberry32(seed: number): () => number`
  - `sampleParams<P>(t, seed): P`
  - `Variant<P> = { key: string; seed: number; params: P; prompt: string; spec: NumericSpec; hints: string[]; dimension: Dimension; tags: TemplateDef<P>["tags"] }`
  - `instantiate<P>(t, seed): Variant<P>` (`key = "${id}#${seed}"`)

- [ ] **Step 1: Write the failing test**: `app/packages/engine/test/templates.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { checkNumeric, defineTemplate, instantiate, mulberry32, sampleParams } from "../src";

const octant = defineTemplate<{ Q: number }>({
  id: "q06-octant",
  params: { Q: { min: 10, max: 90, step: 5 } },
  prompt: (p) => `A ${p.Q} µC charge sits at the origin. Flux through the octant of a sphere around it?`,
  solve: (p) => ({
    answer: { value: p.Q / 8, unit: "µC" },
    distractors: [{ value: p.Q / 4, unit: "µC", errorClass: "conceptual", feedback: "That's a quarter; the octant is 1/8." }],
  }),
  dimension: "application",
  tags: { concepts: ["em1.electrostatics.gauss-applications"], misconceptions: [], difficulty: 2 },
});

describe("templates", () => {
  it("mulberry32 is deterministic and in [0,1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const xs = Array.from({ length: 5 }, () => a());
    expect(xs).toEqual(Array.from({ length: 5 }, () => b()));
    for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
  });
  it("samples on the step grid within range", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const { Q } = sampleParams(octant, seed);
      expect(Q).toBeGreaterThanOrEqual(10);
      expect(Q).toBeLessThanOrEqual(90);
      expect(Math.abs((Q - 10) / 5 - Math.round((Q - 10) / 5))).toBeLessThan(1e-9);
    }
  });
  it("instantiates a gradable variant, reproducible by seed", () => {
    const v = instantiate(octant, 7);
    expect(v).toEqual(instantiate(octant, 7));
    expect(v.key).toBe("q06-octant#7");
    expect(checkNumeric(v.spec, `${v.params.Q / 8} µC`).correct).toBe(true);
    expect(checkNumeric(v.spec, `${v.params.Q / 4} µC`).errorClass).toBe("conceptual");
  });
  it("different seeds give different variants", () => {
    const qs = new Set(Array.from({ length: 30 }, (_, i) => instantiate(octant, i + 1).params.Q));
    expect(qs.size).toBeGreaterThan(5);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/templates.test.ts`
Expected: FAIL (`defineTemplate` is not exported).

- [ ] **Step 3: Implement**: `app/packages/engine/src/templates.ts`

```ts
import type { NumericSpec } from "./answer";
import type { AuthoredQuantity, Dimension, Distractor } from "./schema/common";

export type ParamSpec = { min: number; max: number; step: number };

export type TemplateDef<P extends Record<string, number>> = {
  id: string;
  params: { [K in keyof P]: ParamSpec };
  prompt: (p: P) => string;
  solve: (p: P) => { answer: AuthoredQuantity; distractors?: Distractor[] };
  hints?: (p: P) => string[];
  relTol?: number;
  dimension: Dimension;
  tags: { concepts: string[]; misconceptions: string[]; difficulty: 1 | 2 | 3 | 4 | 5 };
};

export const defineTemplate = <P extends Record<string, number>>(t: TemplateDef<P>): TemplateDef<P> => t;

/** Small, fast, well-distributed 32-bit PRNG; the same seed always gives the same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleParams<P extends Record<string, number>>(t: TemplateDef<P>, seed: number): P {
  const rand = mulberry32(seed);
  const out: Record<string, number> = {};
  for (const key of Object.keys(t.params).sort()) {
    const { min, max, step } = t.params[key as keyof P];
    const count = Math.floor((max - min) / step + 1e-9) + 1;
    out[key] = Math.round((min + step * Math.floor(rand() * count)) * 1e9) / 1e9;
  }
  return out as P;
}

export type Variant<P extends Record<string, number>> = {
  key: string;
  seed: number;
  params: P;
  prompt: string;
  spec: NumericSpec;
  hints: string[];
  dimension: Dimension;
  tags: TemplateDef<P>["tags"];
};

export function instantiate<P extends Record<string, number>>(t: TemplateDef<P>, seed: number): Variant<P> {
  const params = sampleParams(t, seed);
  const solved = t.solve(params);
  return {
    key: `${t.id}#${seed}`,
    seed,
    params,
    prompt: t.prompt(params),
    spec: { answer: solved.answer, relTol: t.relTol ?? 0.02, distractors: solved.distractors ?? [] },
    hints: t.hints?.(params) ?? [],
    dimension: t.dimension,
    tags: t.tags,
  };
}
```

Append to `src/index.ts`: `export * from "./templates";`

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/engine && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine && git commit -m "feat(engine): seeded parameterised question templates"
```

---

### Task 5: Engine: symbolic equation checking

**Files:**
- Create: `app/packages/engine/src/symbolic.ts`
- Modify: `app/packages/engine/package.json` (dependency), `src/index.ts`
- Test: `app/packages/engine/test/symbolic.test.ts`

**Interfaces:**
- Produces: `checkExpression(expectedLatex: string, inputLatex: string): { parsed: boolean; equivalent: boolean }`

- [ ] **Step 1: Add the dependency**

Run: `pnpm --filter @forma/engine add @cortex-js/compute-engine@0.135.0`

- [ ] **Step 2: Confirm the API before coding.** Use context7 (`resolve-library-id` "compute-engine", then `query-docs` "parse latex isEqual subs N numeric value"). Record in the code comment the exact names used for: parsing (`ce.parse`), validity (`expr.isValid`), free variables (`expr.unknowns`), substitution (`expr.subs`), and numeric evaluation (`expr.N()` plus the property holding the JS number, e.g. `.re` or `.value`). If a name differs from the code below, adapt the code; the tests are the contract.

- [ ] **Step 3: Write the failing test**: `app/packages/engine/test/symbolic.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { checkExpression } from "../src";

describe("checkExpression", () => {
  it("accepts algebraically equivalent forms", () => {
    expect(checkExpression("\\frac{Q}{4\\pi r^{2}}", "\\frac{Q r^{-2}}{4\\pi}").equivalent).toBe(true);
    expect(checkExpression("\\frac{Q}{\\varepsilon_0}", "Q\\varepsilon_0^{-1}").equivalent).toBe(true);
    expect(checkExpression("D\\cdot 4\\pi r^2", "4\\pi r^2 D").equivalent).toBe(true);
  });
  it("rejects different expressions", () => {
    expect(checkExpression("\\frac{Q}{4\\pi r^{2}}", "\\frac{Q}{4\\pi r}").equivalent).toBe(false);
    expect(checkExpression("\\frac{Q}{\\varepsilon_0}", "Q\\varepsilon_0").equivalent).toBe(false);
  });
  it("reports unparseable input", () => {
    expect(checkExpression("Q", "\\frac{").parsed).toBe(false);
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/symbolic.test.ts`
Expected: FAIL (`checkExpression` is not exported).

- [ ] **Step 5: Implement**: `app/packages/engine/src/symbolic.ts`

```ts
import { ComputeEngine } from "@cortex-js/compute-engine";
import { mulberry32 } from "./templates";

const ce = new ComputeEngine();

/**
 * Deterministic equivalence of two LaTeX expressions: substitute the same pseudo-random values
 * for every free variable (seeded, 6 samples in [0.5, 2.5]) and compare numerically.
 * Sampling avoids depending on the CAS's symbolic simplifier for equality.
 */
export function checkExpression(expectedLatex: string, inputLatex: string): { parsed: boolean; equivalent: boolean } {
  const a = ce.parse(expectedLatex);
  const b = ce.parse(inputLatex);
  if (!b.isValid || !a.isValid) return { parsed: false, equivalent: false };
  const vars = [...new Set([...a.unknowns, ...b.unknowns])].sort();
  const rand = mulberry32(20260925);
  for (let i = 0; i < 6; i++) {
    const subs: Record<string, number> = {};
    for (const v of vars) subs[v] = 0.5 + 2 * rand();
    const va = Number(a.subs(subs).N().re);
    const vb = Number(b.subs(subs).N().re);
    if (!Number.isFinite(va) || !Number.isFinite(vb)) return { parsed: true, equivalent: false };
    if (Math.abs(va - vb) > 1e-9 * Math.max(1, Math.abs(va))) return { parsed: true, equivalent: false };
  }
  return { parsed: true, equivalent: true };
}
```

Append to `src/index.ts`: `export * from "./symbolic";`

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run packages/engine && pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/engine pnpm-lock.yaml && git commit -m "feat(engine): symbolic LaTeX equivalence checking"
```

---

### Task 6: Engine: learner state v2 and migration

**Files:**
- Modify: `app/packages/engine/src/learner-state.ts`
- Modify: `app/apps/web/components/shell/SettingsDialog.tsx`, `app/apps/web/app/tokens.css` (theme value `night` → `blueprint`)
- Test: modify `app/packages/engine/test/learner-state.test.ts` (append the v2 cases below)

**Interfaces:**
- Produces:
  - `STATE_VERSION = 2`
  - `Mode = "learn" | "solve" | "explore" | "revise"`; `ToolId = "paper" | "notebook" | "formulas" | "sources" | "calculator"`
  - `Settings.theme: "paper" | "blueprint" | "contrast"`; `Settings.narration: "off" | "device"`
  - `LearnerState` adds `workspace: { lastMode: Mode; layouts: Record<Mode, { split: number; pinned: ToolId[] }> }` and `seeds: Record<string, number>`; `position` adds optional `plateStep?: number`
  - `NotebookEntry` adds optional `plate?: { plateId: string; stepId: string; state: Record<string, { params: Record<string, unknown>; visible: boolean }> }`
  - `defaultWorkspace(): LearnerState["workspace"]`
  - `migrate(raw)` accepts v1 (upgraded in place) and v2

- [ ] **Step 1: Write the failing tests**: add `defaultWorkspace` to the existing `import { … } from "../src";` line at the top of `test/learner-state.test.ts`, then append:

```ts
describe("v2", () => {
  it("initial state is v2 with a default workspace", () => {
    const s = initialState();
    expect(s.version).toBe(2);
    expect(s.workspace.lastMode).toBe("learn");
    expect(s.workspace.layouts.solve.split).toBe(0.5);
    expect(s.settings.narration).toBe("off");
  });
  it("migrates real v1 data without losing anything", () => {
    const v1 = {
      version: 1,
      diagnostic: null,
      concepts: {},
      position: { conceptId: "em1.electrostatics.gauss-law", lessonId: "main", blockId: "hook", branchStack: [] },
      notebook: [{ id: "n1", createdAt: 1, conceptId: "c", kind: "drawing", title: "t", body: "<svg/>", text: "hi" }],
      settings: { theme: "night", motion: "reduced", density: "compact", simQuality: "low", equationDetail: "full" },
      history: [],
    };
    const out = migrate(v1);
    expect(out.reset).toBe(false);
    expect(out.state.version).toBe(2);
    expect(out.state.settings.theme).toBe("blueprint");
    expect(out.state.settings.motion).toBe("reduced");
    expect(out.state.notebook[0]).toMatchObject({ kind: "drawing", text: "hi" });
    expect(out.state.position?.blockId).toBe("hook");
    expect(out.state.workspace).toEqual(defaultWorkspace());
    expect(out.state.seeds).toEqual({});
  });
});
```

Also update the existing `"initial state is empty and versioned"` expectation from `STATE_VERSION` 1 to the new constant (it already compares with `STATE_VERSION`, so no edit is needed).

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/learner-state.test.ts`
Expected: FAIL (`defaultWorkspace` is not exported; the version is 1).

- [ ] **Step 3: Implement**: edit `src/learner-state.ts`:

1. Change `export const STATE_VERSION = 1;` to `2`.
2. Add after the imports:

```ts
export type Mode = "learn" | "solve" | "explore" | "revise";
export type ToolId = "paper" | "notebook" | "formulas" | "sources" | "calculator";
export type Workspace = { lastMode: Mode; layouts: Record<Mode, { split: number; pinned: ToolId[] }> };
type PlateSnapshot = { plateId: string; stepId: string; state: Record<string, { params: Record<string, unknown>; visible: boolean }> };

export const defaultWorkspace = (): Workspace => ({
  lastMode: "learn",
  layouts: {
    learn: { split: 0.7, pinned: [] },
    solve: { split: 0.5, pinned: ["paper"] },
    explore: { split: 1, pinned: [] },
    revise: { split: 0.33, pinned: [] },
  },
});
```

3. `NotebookEntry`: add `plate?: PlateSnapshot;`
4. `Settings`: `theme: "paper" | "blueprint" | "contrast";` and add `narration: "off" | "device";`
5. `LearnerState`: `version: 2;`, `position: { conceptId: string; lessonId: string; blockId: string; branchStack: string[]; plateStep?: number } | null;`, add `workspace: Workspace;` and `seeds: Record<string, number>;`
6. `initialState()`: `version: STATE_VERSION`, settings `theme: "paper", …, narration: "off"`, add `workspace: defaultWorkspace(), seeds: {}`.
7. Replace the `StateV1` schema and `migrate` with:

```ts
const ModeLayout = z.object({ split: z.number().min(0).max(1), pinned: z.array(z.enum(["paper", "notebook", "formulas", "sources", "calculator"])) });
const common = {
  diagnostic: z
    .object({ completedAt: z.number(), results: z.record(z.string(), z.enum(["ready", "partial", "gap"])), route: z.array(z.string()) })
    .nullable(),
  concepts: z.record(z.string(), ProgressS),
  position: z
    .object({ conceptId: z.string(), lessonId: z.string(), blockId: z.string(), branchStack: z.array(z.string()), plateStep: z.number().optional() })
    .nullable(),
  notebook: z.array(z.any()),
  history: z.array(z.any()),
};
const SettingsBase = {
  motion: z.enum(["standard", "reduced"]),
  density: z.enum(["comfortable", "compact"]),
  simQuality: z.enum(["high", "balanced", "low"]),
  equationDetail: z.enum(["progressive", "full"]),
};
const StateV1 = z.object({ version: z.literal(1), ...common, settings: z.object({ theme: z.enum(["paper", "night", "contrast"]), ...SettingsBase }) });
const StateV2 = z.object({
  version: z.literal(2),
  ...common,
  settings: z.object({ theme: z.enum(["paper", "blueprint", "contrast"]), narration: z.enum(["off", "device"]), ...SettingsBase }),
  workspace: z.object({
    lastMode: z.enum(["learn", "solve", "explore", "revise"]),
    layouts: z.object({ learn: ModeLayout, solve: ModeLayout, explore: ModeLayout, revise: ModeLayout }),
  }),
  seeds: z.record(z.string(), z.number()),
});

/** Validate persisted state, upgrading v1 → v2; anything else is backed up and reset. */
export function migrate(raw: unknown): { state: LearnerState; reset: boolean; backup?: unknown } {
  if (raw === null || raw === undefined) return { state: initialState(), reset: false };
  const v2 = StateV2.safeParse(raw);
  if (v2.success) return { state: v2.data as LearnerState, reset: false };
  const v1 = StateV1.safeParse(raw);
  if (v1.success) {
    const { theme, ...rest } = v1.data.settings;
    return {
      state: {
        ...(v1.data as unknown as Omit<LearnerState, "version" | "settings" | "workspace" | "seeds">),
        version: 2,
        settings: { ...rest, theme: theme === "night" ? "blueprint" : theme, narration: "off" },
        workspace: defaultWorkspace(),
        seeds: {},
      },
      reset: false,
    };
  }
  return { state: initialState(), reset: true, backup: raw };
}
```

- [ ] **Step 4: Keep the web app compiling**

```bash
cd /f/StudyBuddy/app/apps/web
sed -i 's/\["night", "Night"\]/["blueprint", "Blueprint"]/' components/shell/SettingsDialog.tsx
sed -i 's/\[data-theme="night"\]/[data-theme="blueprint"]/' app/tokens.css
grep -rn '"night"' --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v .next
```

Expected: the final grep prints nothing. (If it prints lines, replace `"night"` with `"blueprint"` there.)

- [ ] **Step 5: Run tests and both typechecks**

Run: `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS, and both typechecks exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A packages/engine apps/web && git commit -m "feat(engine): learner state v2 (modes workspace, seeds, plate snapshots, narration) with v1 migration"
```

---

### Task 7: Plate: component contract, registry, lerp, memoised scene evaluator

**Files:**
- Create: `app/packages/plate/package.json`, `src/component.ts`, `src/lerp.ts`, `src/scene.ts`, `src/index.ts`
- Test: `app/packages/plate/test/scene.test.ts`

**Interfaces:**
- Produces:
  - `Instance = { id: string; component: string; params: Record<string, unknown>; links?: Record<string, string>; visible?: boolean }`
  - `Evaluated = { params: Record<string, unknown>; model: Record<string, unknown>; visible: boolean }`
  - `ModelCtx = { link(name: string): Evaluated }`
  - `ComponentDef<P, M> = { id; params: z.ZodType<P>; model(params: P, ctx: ModelCtx): M; handles: readonly string[]; readouts: Readonly<Record<string, string>> /* name → unit */; links?: readonly string[] }`
  - `defineComponent<P, M>(def): ComponentDef<P, M>`; `AnyComponent = ComponentDef<any, any>`
  - `class Registry { register(...defs: AnyComponent[]): this; get(id): AnyComponent; has(id): boolean; ids(): string[] }`
  - `SceneState = Record<string, { params: Record<string, unknown>; visible: boolean }>`; `Frame = Record<string, Evaluated>`
  - `createEvaluator(registry, instances: Instance[], cacheSize = 512): (state: SceneState) => Frame`
  - `lerpValue(a, b, t)`, `isLerpable(a, b)`, `deepEqual(a, b)`, `clone<T>(x)`, `clamp01(x)`

- [ ] **Step 1: Package file**: `app/packages/plate/package.json`

```json
{
  "name": "@forma/plate",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "@forma/engine": "workspace:*", "@forma/physics": "workspace:*", "zod": "^4.6.5" }
}
```

Run: `pnpm install`

- [ ] **Step 2: Write the failing test**: `app/packages/plate/test/scene.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createEvaluator, defineComponent, isLerpable, lerpValue, Registry } from "../src";

let calls = 0;
const Source = defineComponent({
  id: "source",
  params: z.object({ q: z.number() }),
  model: (p) => ({ total: p.q }),
  handles: ["q"],
  readouts: { total: "µC" },
});
const Doubler = defineComponent({
  id: "doubler",
  params: z.object({ factor: z.number().default(2) }),
  model: (p, ctx) => {
    calls++;
    return { value: (ctx.link("from").model.total as number) * p.factor };
  },
  handles: [],
  readouts: { value: "µC" },
  links: ["from"],
});
const registry = new Registry().register(Source, Doubler);
const instances = [
  { id: "a", component: "source", params: { q: 3 }, visible: true },
  { id: "b", component: "doubler", params: {}, links: { from: "a" } },
];

describe("registry", () => {
  it("rejects duplicates and unknown ids", () => {
    expect(() => new Registry().register(Source, Source)).toThrow(/Duplicate/);
    expect(() => registry.get("nope")).toThrow(/Unknown component/);
  });
});

describe("evaluator", () => {
  it("evaluates linked models with parsed defaults", () => {
    const ev = createEvaluator(registry, instances);
    const f = ev({ a: { params: { q: 3 }, visible: true }, b: { params: {}, visible: false } });
    expect(f.b!.model.value).toBe(6);
    expect(f.b!.params.factor).toBe(2);
    expect(f.b!.visible).toBe(false);
  });
  it("memoises identical inputs and recomputes when an upstream param changes", () => {
    const ev = createEvaluator(registry, instances);
    calls = 0;
    ev({ a: { params: { q: 3 }, visible: true }, b: { params: {}, visible: true } });
    ev({ a: { params: { q: 3 }, visible: true }, b: { params: {}, visible: true } });
    expect(calls).toBe(1);
    ev({ a: { params: { q: 4 }, visible: true }, b: { params: {}, visible: true } });
    expect(calls).toBe(2);
  });
  it("reports bad params and link cycles clearly", () => {
    const ev = createEvaluator(registry, instances);
    expect(() => ev({ a: { params: { q: "x" }, visible: true }, b: { params: {}, visible: true } })).toThrow();
    const cyc = createEvaluator(registry, [
      { id: "x", component: "doubler", params: {}, links: { from: "y" } },
      { id: "y", component: "doubler", params: {}, links: { from: "x" } },
    ]);
    expect(() => cyc({ x: { params: {}, visible: true }, y: { params: {}, visible: true } })).toThrow(/cycle/);
  });
});

describe("lerp", () => {
  it("interpolates numbers, arrays and objects; switches non-numeric at 0.5", () => {
    expect(lerpValue(0, 10, 0.25)).toBe(2.5);
    expect(lerpValue([0, 0, 0], [2, 4, 6], 0.5)).toEqual([1, 2, 3]);
    expect(lerpValue({ r: 1, shape: "sphere" }, { r: 3, shape: "sphere" }, 0.5)).toEqual({ r: 2, shape: "sphere" });
    expect(lerpValue("sphere", "cube", 0.4)).toBe("sphere");
    expect(lerpValue("sphere", "cube", 0.6)).toBe("cube");
    expect(isLerpable([1, 2], [1, 2, 3])).toBe(false);
    expect(isLerpable({ id: "a", x: 1 }, { id: "a", x: 2 })).toBe(true);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm vitest run packages/plate`
Expected: FAIL (cannot resolve `../src`).

- [ ] **Step 4: Implement `src/lerp.ts`**

```ts
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

export const clamp01 = (x: number) => (Number.isNaN(x) ? 0 : Math.min(1, Math.max(0, x)));
export const clone = <T>(x: T): T => structuredClone(x);
export const deepEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** True when a and b have the same shape and differ only in numeric leaves (equal non-numeric leaves are fine). */
export function isLerpable(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => isLerpable(x, b[i]));
  if (isObj(a) && isObj(b)) {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return ka.join("\u0000") === kb.join("\u0000") && ka.every((k) => isLerpable(a[k], b[k]));
  }
  return deepEqual(a, b);
}

/** Interpolate numeric leaves; anything else switches from a to b at t = 0.5. */
export function lerpValue(a: unknown, b: unknown, t: number): unknown {
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * t;
  if (isLerpable(a, b)) {
    if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => lerpValue(x, b[i], t));
    if (isObj(a) && isObj(b)) return Object.fromEntries(Object.keys(a).map((k) => [k, lerpValue(a[k], b[k], t)]));
  }
  return t < 0.5 ? a : b;
}
```

- [ ] **Step 5: Implement `src/component.ts`**

```ts
import type { z } from "zod";

export type Instance = { id: string; component: string; params: Record<string, unknown>; links?: Record<string, string>; visible?: boolean };
export type Evaluated = { params: Record<string, unknown>; model: Record<string, unknown>; visible: boolean };
export type ModelCtx = { link: (name: string) => Evaluated };

export type ComponentDef<P, M> = {
  id: string;
  params: z.ZodType<P>;
  model: (params: P, ctx: ModelCtx) => M;
  /** Params the learner may manipulate directly. */
  handles: readonly string[];
  /** Model values the plate may display, with their units. */
  readouts: Readonly<Record<string, string>>;
  /** Named upstream inputs (instance links). */
  links?: readonly string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyComponent = ComponentDef<any, any>;

export const defineComponent = <P, M extends Record<string, unknown>>(def: ComponentDef<P, M>): ComponentDef<P, M> => def;

export class Registry {
  private readonly defs = new Map<string, AnyComponent>();
  register(...defs: AnyComponent[]): this {
    for (const d of defs) {
      if (this.defs.has(d.id)) throw new Error(`Duplicate component: ${d.id}`);
      this.defs.set(d.id, d);
    }
    return this;
  }
  get(id: string): AnyComponent {
    const d = this.defs.get(id);
    if (!d) throw new Error(`Unknown component: ${id}`);
    return d;
  }
  has(id: string): boolean {
    return this.defs.has(id);
  }
  ids(): string[] {
    return [...this.defs.keys()];
  }
}
```

- [ ] **Step 6: Implement `src/scene.ts`**

```ts
import type { Evaluated, Instance } from "./component";
import type { Registry } from "./component";

export type SceneState = Record<string, { params: Record<string, unknown>; visible: boolean }>;
export type Frame = Record<string, Evaluated>;

/**
 * Evaluates every instance's model in link order. Models are memoised on
 * (component, parsed params, upstream keys), so scrubbing and re-rendering are cheap.
 */
export function createEvaluator(registry: Registry, instances: readonly Instance[], cacheSize = 512): (state: SceneState) => Frame {
  const byId = new Map(instances.map((i) => [i.id, i]));
  const cache = new Map<string, Record<string, unknown>>();
  return (state) => {
    const out: Frame = {};
    const keys: Record<string, string> = {};
    const visiting = new Set<string>();
    const ev = (id: string): Evaluated => {
      const done = out[id];
      if (done) return done;
      if (visiting.has(id)) throw new Error(`Link cycle at instance "${id}"`);
      const inst = byId.get(id);
      if (!inst) throw new Error(`Unknown instance: ${id}`);
      visiting.add(id);
      const def = registry.get(inst.component);
      const s = state[id] ?? { params: inst.params, visible: inst.visible ?? false };
      const params = def.params.parse(s.params) as Record<string, unknown>;
      const upstream = Object.entries(inst.links ?? {})
        .map(([name, target]) => {
          ev(target);
          return `${name}=${keys[target]}`;
        })
        .join("|");
      const key = `${inst.component}|${JSON.stringify(params)}|${upstream}`;
      keys[id] = key;
      let model = cache.get(key);
      if (!model) {
        model = def.model(params, {
          link: (name) => {
            const target = inst.links?.[name];
            if (!target) throw new Error(`Instance "${id}" has no link "${name}"`);
            return ev(target);
          },
        }) as Record<string, unknown>;
        cache.set(key, model);
        if (cache.size > cacheSize) cache.delete(cache.keys().next().value as string);
      }
      const result: Evaluated = { params, model, visible: s.visible };
      out[id] = result;
      visiting.delete(id);
      return result;
    };
    for (const i of instances) ev(i.id);
    return out;
  };
}
```

- [ ] **Step 7: Index**: `src/index.ts`

```ts
export * from "./component";
export * from "./lerp";
export * from "./scene";
```

Add `"packages/*/src"` coverage is already in the root `tsconfig.json`; no change needed.

- [ ] **Step 8: Run tests**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/plate pnpm-lock.yaml && git commit -m "feat(plate): component contract, registry, lerp, memoised scene evaluator"
```

---

### Task 8: Plate: plate schema, cumulative step state, diffs

**Files:**
- Create: `app/packages/plate/src/plate.ts`
- Modify: `app/packages/plate/src/index.ts`
- Test: `app/packages/plate/test/plate.test.ts`

**Interfaces:**
- Consumes: `Interaction` (`@forma/engine`), `SceneState`, `clone`, `deepEqual`, `isLerpable`.
- Produces:
  - Zod + types: `Cue { t; action: "highlight"|"show"|"hide"|"tween"|"camera"; target; params }`, `Narration { transcript; captions?; audio?: { src; durationMs }; cues: Cue[] }`, `Claim { instance; readout; value; unit; relTol=0.01 }`, `Step { id; title; patch; show; hide; focus; view: "2d"|"3d"; note; why?; derivation?; interaction?; claims; cues; narration? }`, `PlateDef { id; title; instances: Instance[]; bindings: Record<string,string[]>; steps: Step[] }`
  - `initialState(plate): SceneState`; `applyStep(state, step): SceneState` (throws `Unknown instance "x" in step "y"`); `stateAt(plate, index): SceneState` (cached per plate)
  - `StepDiff = { enters: string[]; exits: string[]; tweens: { id; param; from; to }[]; sets: { id; param; to }[] }`; `diffStates(a, b): StepDiff`; `isEmptyDiff(d): boolean`

- [ ] **Step 1: Write the failing test**: `app/packages/plate/test/plate.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { diffStates, isEmptyDiff, PlateDef, stateAt } from "../src";

const plate = PlateDef.parse({
  id: "demo",
  title: "Demo",
  instances: [
    { id: "q", component: "charges", params: { items: [{ id: "q1", q: 2, pos: [0, 0, 0] }] } },
    { id: "s", component: "gaussian-surface", params: { shape: "sphere", size: 1 }, links: { charges: "q" } },
  ],
  steps: [
    { id: "s1", title: "Charge", show: ["q"], note: "A charge." },
    { id: "s2", title: "Surface", show: ["s"], note: "Wrap it." },
    { id: "s3", title: "Grow", patch: { s: { size: 2, shape: "cube" } }, note: "Grow it." },
  ],
});

describe("plate state", () => {
  it("accumulates steps", () => {
    expect(stateAt(plate, 0).s!.visible).toBe(false);
    expect(stateAt(plate, 1).s!.visible).toBe(true);
    expect(stateAt(plate, 2).s!.params).toMatchObject({ size: 2, shape: "cube" });
    expect(stateAt(plate, 1).s!.params.size).toBe(1);
  });
  it("diffs enters, tweens and sets", () => {
    const d1 = diffStates(stateAt(plate, 0), stateAt(plate, 1));
    expect(d1.enters).toEqual(["s"]);
    const d2 = diffStates(stateAt(plate, 1), stateAt(plate, 2));
    expect(d2.tweens).toEqual([{ id: "s", param: "size", from: 1, to: 2 }]);
    expect(d2.sets).toEqual([{ id: "s", param: "shape", to: "cube" }]);
    expect(isEmptyDiff(diffStates(stateAt(plate, 2), stateAt(plate, 2)))).toBe(true);
  });
  it("rejects a step that names an unknown instance", () => {
    const bad = PlateDef.parse({ ...plate, steps: [{ id: "x", title: "X", show: ["ghost"], note: "n" }] });
    expect(() => stateAt(bad, 0)).toThrow(/Unknown instance "ghost" in step "x"/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/plate/test/plate.test.ts`
Expected: FAIL (`PlateDef` is not exported).

- [ ] **Step 3: Implement**: `app/packages/plate/src/plate.ts`

```ts
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
```

Append to `src/index.ts`: `export * from "./plate";`

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): plate/step schema, cumulative step state, step diffs"
```

---

### Task 9: Plate: timeline frames and cue tracks

**Files:**
- Create: `app/packages/plate/src/timeline.ts`
- Modify: `app/packages/plate/src/index.ts`
- Test: `app/packages/plate/test/timeline.test.ts`

**Interfaces:**
- Consumes: `PlateDef`, `stateAt`, `diffStates`, `lerpValue`, `clamp01`, `clone`, `Cue`.
- Produces:
  - `PHASES = { exit: [0, 0.25], tween: [0.2, 0.8], enter: [0.45, 1], focusAt: 0.9 }`
  - `ease(t: number): number` (easeInOutCubic)
  - `TimelineFrame = { state: SceneState; appear: Record<string, number>; opacity: Record<string, number>; focus: string[]; stepIndex: number; fraction: number }`
  - `frameAt(plate, pos: number, opts?: { reducedMotion?: boolean }): TimelineFrame`. `pos` is a real number in `[0, steps−1]`; out-of-range and `NaN` clamp.
  - `applyCues(state, cues: Cue[], tMs: number): { state: SceneState; highlight: string[]; camera: Record<string, unknown> | null }`

- [ ] **Step 1: Write the failing test**: `app/packages/plate/test/timeline.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { applyCues, ease, frameAt, PlateDef, stateAt } from "../src";

const plate = PlateDef.parse({
  id: "demo",
  title: "Demo",
  instances: [
    { id: "q", component: "charges", params: { items: [{ id: "q1", q: 2, pos: [0, 0, 0] }] } },
    { id: "s", component: "gaussian-surface", params: { shape: "sphere", size: 1 }, links: { charges: "q" } },
  ],
  steps: [
    { id: "s1", title: "Charge", show: ["q"], focus: ["q"], note: "A charge." },
    { id: "s2", title: "Surface", show: ["s"], focus: ["s"], note: "Wrap it." },
    { id: "s3", title: "Grow", patch: { s: { size: 3 } }, focus: ["s"], note: "Grow it." },
  ],
});

describe("frameAt", () => {
  it("whole positions equal step states", () => {
    expect(frameAt(plate, 2).state).toEqual(stateAt(plate, 2));
    expect(frameAt(plate, 0).appear.q).toBe(1);
  });
  it("tweens numeric params through the tween window", () => {
    expect(frameAt(plate, 1.1).state.s!.params.size).toBe(1);
    const mid = frameAt(plate, 1.5).state.s!.params.size as number;
    expect(mid).toBeCloseTo(1 + 2 * ease(0.5), 10);
    expect(frameAt(plate, 1.85).state.s!.params.size).toBe(3);
  });
  it("draws entering instances on and switches focus late", () => {
    const f = frameAt(plate, 0.7);
    expect(f.state.s!.visible).toBe(true);
    expect(f.appear.s).toBeGreaterThan(0);
    expect(f.appear.s).toBeLessThan(1);
    expect(f.focus).toEqual(["q"]);
    expect(frameAt(plate, 0.95).focus).toEqual(["s"]);
  });
  it("clamps out-of-range and NaN positions", () => {
    expect(frameAt(plate, -3).stepIndex).toBe(0);
    expect(frameAt(plate, 99).state).toEqual(stateAt(plate, 2));
    expect(frameAt(plate, Number.NaN).stepIndex).toBe(0);
  });
  it("snaps under reduced motion", () => {
    expect(frameAt(plate, 1.3, { reducedMotion: true }).state.s!.params.size).toBe(3);
  });
});

describe("applyCues", () => {
  it("applies show, highlight window, tween and camera by time", () => {
    const base = stateAt(plate, 0);
    const cues = [
      { t: 0, action: "show" as const, target: "s", params: {} },
      { t: 100, action: "highlight" as const, target: "q", params: { durationMs: 500 } },
      { t: 200, action: "tween" as const, target: "s", params: { param: "size", to: 2, durationMs: 400 } },
      { t: 300, action: "camera" as const, target: "view", params: { yaw: 30 } },
    ];
    const early = applyCues(base, cues, 150);
    expect(early.state.s!.visible).toBe(true);
    expect(early.highlight).toEqual(["q"]);
    const late = applyCues(base, cues, 1000);
    expect(late.highlight).toEqual([]);
    expect(late.state.s!.params.size).toBe(2);
    expect(late.camera).toEqual({ yaw: 30 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/plate/test/timeline.test.ts`
Expected: FAIL (`frameAt` is not exported).

- [ ] **Step 3: Implement**: `app/packages/plate/src/timeline.ts`

```ts
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
  const p = Number.isFinite(pos) ? Math.min(Math.max(pos, 0), last) : 0;
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
```

Append to `src/index.ts`: `export * from "./timeline";`

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): scrubbable timeline frames with phased tweens and cue tracks"
```

---

### Task 10: Plate: focus links and plate validation

**Files:**
- Create: `app/packages/plate/src/focus.ts`, `app/packages/plate/src/validate.ts`
- Modify: `app/packages/plate/src/index.ts`
- Test: `app/packages/plate/test/validate.test.ts`

**Interfaces:**
- Consumes: `Registry`, `createEvaluator`, `PlateDef`, `stateAt`, `diffStates`, `isEmptyDiff`, `deepEqual`.
- Produces:
  - `termTargets(plate, key): string[]`; `instanceTerms(plate, instanceId): string[]`
  - `PlateIssue = { plate: string; step?: string; level: "error" | "warning"; message: string }`
  - `validatePlate(registry, plate): PlateIssue[]`
  - `wordCount(text): number`; `tokenOverlap(a, b): number` (share of `a`'s word tokens that appear in `b`)

- [ ] **Step 1: Write the failing test**: `app/packages/plate/test/validate.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineComponent, instanceTerms, PlateDef, Registry, termTargets, tokenOverlap, validatePlate, wordCount } from "../src";

const Src = defineComponent({ id: "src", params: z.object({ q: z.number() }), model: (p) => ({ total: p.q }), handles: [], readouts: { total: "µC" } });
const registry = new Registry().register(Src);
const mk = (steps: unknown[], extra: Record<string, unknown> = {}) =>
  PlateDef.parse({ id: "p", title: "P", instances: [{ id: "a", component: "src", params: { q: 2 } }], steps, ...extra });

describe("focus links", () => {
  it("maps terms to instances and back", () => {
    const p = mk([{ id: "s1", title: "t", show: ["a"], note: "n" }], { bindings: { "t-charge": ["a"] } });
    expect(termTargets(p, "t-charge")).toEqual(["a"]);
    expect(instanceTerms(p, "a")).toEqual(["t-charge"]);
    expect(termTargets(p, "nope")).toEqual([]);
  });
});

describe("validatePlate", () => {
  it("passes a good plate with a correct claim", () => {
    const p = mk([{ id: "s1", title: "t", show: ["a"], note: "A charge.", claims: [{ instance: "a", readout: "total", value: 2, unit: "µC" }] }]);
    expect(validatePlate(registry, p)).toEqual([]);
  });
  it("errors on wrong claims, wrong units and unknown instances without throwing", () => {
    const p = mk([
      { id: "s1", title: "t", show: ["a"], note: "n", claims: [{ instance: "a", readout: "total", value: 3, unit: "µC" }] },
      { id: "s2", title: "t", show: ["ghost"], note: "n" },
    ]);
    const msgs = validatePlate(registry, p).map((i) => `${i.level}:${i.step}:${i.message}`);
    expect(msgs).toEqual(expect.arrayContaining([expect.stringMatching(/^error:s1:claim a\.total says 3 µC but the model gives 2/), expect.stringMatching(/^error:s2:Unknown instance "ghost"/)]));
    const unit = mk([{ id: "s1", title: "t", show: ["a"], note: "n", claims: [{ instance: "a", readout: "total", value: 2, unit: "C" }] }]);
    expect(validatePlate(registry, unit)[0]!.message).toMatch(/unit/);
  });
  it("errors on unknown components and bindings", () => {
    const p = PlateDef.parse({ id: "p", title: "P", instances: [{ id: "a", component: "nope", params: {} }], bindings: { t: ["zz"] }, steps: [{ id: "s1", title: "t", note: "n" }] });
    const msgs = validatePlate(registry, p).map((i) => i.message);
    expect(msgs).toEqual(expect.arrayContaining([expect.stringMatching(/Unknown component "nope"/), expect.stringMatching(/binding "t" targets unknown instance "zz"/)]));
  });
  it("warns on word budget, possible slides and verbatim narration", () => {
    const long = Array.from({ length: 70 }, () => "word").join(" ");
    const p = mk([
      { id: "s1", title: "t", show: ["a"], note: long },
      { id: "s2", title: "t", note: "Nothing changes here at all.", narration: { transcript: "Nothing changes here at all." } },
    ]);
    const msgs = validatePlate(registry, p).filter((i) => i.level === "warning").map((i) => i.message);
    expect(msgs).toEqual(expect.arrayContaining([expect.stringMatching(/70 words/), expect.stringMatching(/possible slide/), expect.stringMatching(/repeats the margin note/)]));
  });
  it("counts words and overlap", () => {
    expect(wordCount("  Flux counts what is inside. ")).toBe(5);
    expect(tokenOverlap("flux counts charge", "Flux counts only charge inside")).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/plate/test/validate.test.ts`
Expected: FAIL (`validatePlate` is not exported).

- [ ] **Step 3: Implement `src/focus.ts`**

```ts
import type { PlateDef } from "./plate";

export const termTargets = (plate: PlateDef, key: string): string[] => plate.bindings[key] ?? [];

export const instanceTerms = (plate: PlateDef, instanceId: string): string[] =>
  Object.entries(plate.bindings)
    .filter(([, ids]) => ids.includes(instanceId))
    .map(([k]) => k);
```

- [ ] **Step 4: Implement `src/validate.ts`**

```ts
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
```

Append to `src/index.ts`:

```ts
export * from "./focus";
export * from "./validate";
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): focus links and plate validation (claims, structure, text discipline)"
```

---

### Task 11: Plate: electromagnetics component models

**Files:**
- Create: `app/packages/plate/src/components/em.ts`
- Modify: `app/packages/plate/src/index.ts`
- Test: `app/packages/plate/test/em.test.ts`

**Interfaces:**
- Consumes: `defineComponent`, `@forma/physics` (`electricField`, `fluxDensity`, `enclosedCharge`, `fluxThrough`, `surfacePatches`, `surfaceArea`, `norm`, `dot`, `scale`, `EPS0`, `Charge`, `SurfaceShape`, `Vec3`).
- Produces (component ids and readouts):
  - `charges`: params `{ items: ({ id; kind: "point"; q /*µC*/; pos; draggable } | { id; kind: "line"; rhoL /*nC/m*/; x; y } | { id; kind: "sheet"; rhoS /*µC/m²*/; z0 })[] }`; model `{ charges: Charge[] (SI), total: µC (point charges) }`; readouts `{ total: "µC" }`
  - `field-arrows` (link `charges`): params `{ grid=5, extent=1.6, plane: "xz"|"3d"="xz", probe=1, epsR=1 }`; model `{ samples: { p: Vec3; dir: Vec3; mag: number /*µC/m²*/ }[], probeD, probeE }`; readouts `{ probeD: "µC/m^2", probeE: "V/m" }`
  - `field-profile` (link `charges`): params `{ rMin=0.3, rMax=3, samples=60, quantity: "D"|"E"="D" }`; model `{ points: { r: number; v: number }[] }`
  - `gaussian-surface` (link `charges`): params `{ shape: "sphere"|"cube"|"blob"|"cylinder"="sphere", center=[0,0,0], size=1, height=1, amplitude=0.2, lobes=3, showNormals=false, shading=false, readout=true, quality=24 }`; model `{ flux, enclosed, area, onSurface, patches: { center; normal; area; contribution }[] }`; readouts `{ flux: "µC", enclosed: "µC", area: "m^2" }`
  - `equation`: params `{ latex; terms: { key; speech }[]=[]; speech; shortSpeech }`; model `{}`
  - `faraday-spheres`: params `{ innerQ=2; material: "Air"|"Glass"|"Sulphur"|"Shellac"="Air"; revealed=false }`; model `{ outerQ /*µC*/, epsR, eMid /*V/m at r=0.5 m*/ }`; readouts `{ outerQ: "µC", eMid: "V/m" }`
  - `axes`, `dimension-callout`: display-only (params `{ length=1.8 }` / `{ from: Vec3; to: Vec3; label: string }`; model `{}`)
  - `emComponents: AnyComponent[]` (all of the above)

- [ ] **Step 1: Write the failing test**: `app/packages/plate/test/em.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const registry = new Registry().register(...emComponents);
const plate = (surface: Record<string, unknown>, items: unknown[]) =>
  PlateDef.parse({
    id: "t",
    title: "t",
    instances: [
      { id: "q", component: "charges", params: { items }, visible: true },
      { id: "f", component: "field-arrows", params: {}, links: { charges: "q" }, visible: true },
      { id: "s", component: "gaussian-surface", params: surface, links: { charges: "q" }, visible: true },
      { id: "far", component: "faraday-spheres", params: { material: "Glass" }, visible: true },
    ],
    steps: [{ id: "s1", title: "t", note: "n" }],
  });
const frame = (p: PlateDef) => createEvaluator(registry, p.instances)(stateAt(p, 0));

describe("em components", () => {
  it("gaussian-surface flux equals enclosed charge (µC) for any shape", () => {
    for (const shape of ["sphere", "cube", "blob", "cylinder"]) {
      const f = frame(plate({ shape, size: 1.2, height: 2 }, [{ id: "a", kind: "point", q: 2, pos: [0.2, 0.1, 0] }]));
      expect(f.s!.model.flux as number).toBeCloseTo(2, 4);
      expect(f.s!.model.enclosed).toBeCloseTo(2, 12);
    }
  });
  it("field-arrows probe gives D = q/(4 pi r^2) in µC/m^2 and E = D/(eps0 epsR)", () => {
    const f = frame(plate({}, [{ id: "a", kind: "point", q: 2, pos: [0, 0, 0] }]));
    expect(f.f!.model.probeD as number).toBeCloseTo(2 / (4 * Math.PI), 9);
    expect((f.f!.model.probeE as number) / ((2e-6 / (4 * Math.PI)) / 8.8541878128e-12)).toBeCloseTo(1, 9);
    expect((f.f!.model.samples as unknown[]).length).toBeGreaterThan(10);
  });
  it("a charge sitting on the surface keeps finite readouts (half counted)", () => {
    const f = frame(plate({ shape: "sphere", size: 1 }, [{ id: "a", kind: "point", q: 2, pos: [1, 0, 0] }]));
    expect(f.s!.model.onSurface).toBe(true);
    expect(f.s!.model.flux).toBeCloseTo(1, 12);
    expect(Number.isFinite(f.s!.model.flux as number)).toBe(true);
  });
  it("faraday outer charge ignores the material; E does not", () => {
    const f = frame(plate({}, [{ id: "a", kind: "point", q: 1, pos: [0, 0, 0] }]));
    expect(f.far!.model.outerQ).toBe(2);
    expect(f.far!.model.epsR).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/plate/test/em.test.ts`
Expected: FAIL (`emComponents` is not exported).

- [ ] **Step 3: Implement**: `app/packages/plate/src/components/em.ts`

```ts
import {
  EPS0, dot, electricField, enclosedCharge, fluxDensity, fluxThrough, norm, scale, surfaceArea, surfacePatches,
  type Charge, type SurfaceShape, type Vec3,
} from "@forma/physics";
import { z } from "zod";
import { defineComponent, type AnyComponent } from "../component";

const V3 = z.tuple([z.number(), z.number(), z.number()]);
const ChargeItem = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("point"), q: z.number(), pos: V3, draggable: z.boolean().default(false) }),
  z.object({ id: z.string(), kind: z.literal("line"), rhoL: z.number(), x: z.number(), y: z.number() }),
  z.object({ id: z.string(), kind: z.literal("sheet"), rhoS: z.number(), z0: z.number() }),
]);
type Item = z.infer<typeof ChargeItem>;

const toSI = (it: Item): Charge =>
  it.kind === "point"
    ? { kind: "point", q: it.q * 1e-6, pos: it.pos as Vec3 }
    : it.kind === "line"
      ? { kind: "line", rhoL: it.rhoL * 1e-9, x: it.x, y: it.y }
      : { kind: "sheet", rhoS: it.rhoS * 1e-6, z0: it.z0 };

export const Charges = defineComponent({
  id: "charges",
  params: z.object({ items: z.array(ChargeItem).min(1) }),
  model: (p) => ({
    charges: p.items.map(toSI),
    items: p.items,
    total: p.items.reduce((s, it) => (it.kind === "point" ? s + it.q : s), 0),
  }),
  handles: ["items"],
  readouts: { total: "µC" },
});

const chargesOf = (ctx: { link: (n: string) => { model: Record<string, unknown> } }) => ctx.link("charges").model.charges as Charge[];
const nearPoint = (cs: Charge[], p: Vec3, r: number) => cs.some((c) => c.kind === "point" && norm([p[0] - c.pos[0], p[1] - c.pos[1], p[2] - c.pos[2]]) < r);

export const FieldArrows = defineComponent({
  id: "field-arrows",
  params: z.object({
    grid: z.number().int().min(3).max(9).default(5),
    extent: z.number().positive().default(1.6),
    plane: z.enum(["xz", "3d"]).default("xz"),
    probe: z.number().positive().default(1),
    epsR: z.number().positive().default(1),
  }),
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const t = (i: number) => -p.extent + (2 * p.extent * i) / (p.grid - 1);
    const pts: Vec3[] = [];
    for (let i = 0; i < p.grid; i++)
      for (let k = 0; k < p.grid; k++) {
        if (p.plane === "xz") pts.push([t(i), 0, t(k)]);
        else for (let j = 0; j < p.grid; j++) pts.push([t(i), t(j), t(k)]);
      }
    const minGap = (0.35 * 2 * p.extent) / (p.grid - 1);
    const samples = pts
      .filter((pt) => !nearPoint(cs, pt, minGap))
      .map((pt) => {
        const d = fluxDensity(cs, pt);
        const m = norm(d);
        return { p: pt, dir: m > 0 ? scale(d, 1 / m) : ([0, 0, 0] as Vec3), mag: m * 1e6 };
      });
    const probePt: Vec3 = [p.probe, 0, 0];
    return {
      samples,
      probeD: norm(fluxDensity(cs, probePt)) * 1e6,
      probeE: norm(electricField(cs, probePt)) / p.epsR,
    };
  },
  handles: ["probe", "epsR"],
  readouts: { probeD: "µC/m^2", probeE: "V/m" },
  links: ["charges"],
});

export const FieldProfile = defineComponent({
  id: "field-profile",
  params: z.object({
    rMin: z.number().positive().default(0.3),
    rMax: z.number().positive().default(3),
    samples: z.number().int().min(4).max(400).default(60),
    quantity: z.enum(["D", "E"]).default("D"),
  }),
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const points = Array.from({ length: p.samples }, (_, i) => {
      const r = p.rMin + ((p.rMax - p.rMin) * i) / (p.samples - 1);
      const v = p.quantity === "D" ? norm(fluxDensity(cs, [r, 0, 0])) * 1e6 : norm(electricField(cs, [r, 0, 0]));
      return { r, v };
    });
    return { points };
  },
  handles: [],
  readouts: {},
  links: ["charges"],
});

const SurfaceParams = z.object({
  shape: z.enum(["sphere", "cube", "blob", "cylinder"]).default("sphere"),
  center: V3.default([0, 0, 0]),
  size: z.number().positive().default(1),
  height: z.number().positive().default(1),
  amplitude: z.number().min(0).max(0.6).default(0.2),
  lobes: z.number().int().min(1).max(8).default(3),
  showNormals: z.boolean().default(false),
  shading: z.boolean().default(false),
  readout: z.boolean().default(true),
  quality: z.number().int().min(8).max(96).default(24),
});

const toShape = (p: z.infer<typeof SurfaceParams>): SurfaceShape => {
  const center = p.center as Vec3;
  switch (p.shape) {
    case "sphere":
      return { kind: "sphere", center, radius: p.size };
    case "cube":
      return { kind: "cube", center, side: p.size };
    case "blob":
      return { kind: "blob", center, radius: p.size, amplitude: p.amplitude, lobes: p.lobes };
    case "cylinder":
      return { kind: "cylinder", center, radius: p.size, height: p.height };
  }
};

export const GaussianSurface = defineComponent({
  id: "gaussian-surface",
  params: SurfaceParams,
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const shape = toShape(p);
    const fine = surfacePatches(shape, p.quality);
    // A point charge on (or within 1% of the size of) the surface makes the integrand singular.
    // Physically a smooth surface catches half of it, so count it as ½ and flag it.
    const tol = 0.01 * p.size;
    const onSurface = cs.filter((c) => c.kind === "point" && fine.some((pt) => norm([pt.center[0] - c.pos[0], pt.center[1] - c.pos[1], pt.center[2] - c.pos[2]]) < tol + 0.6 * Math.sqrt(norm(pt.dS))));
    const regular = cs.filter((c) => !onSurface.includes(c));
    const halfOnSurface = onSurface.reduce((s, c) => s + (c.kind === "point" ? c.q : 0), 0) / 2;
    const enclosed = enclosedCharge(regular.filter((c) => !(p.shape === "blob" && c.kind !== "point")), shape);
    const flux = onSurface.length ? enclosed + halfOnSurface : fluxThrough(regular, fine);
    const patches = surfacePatches(shape, 8).map((pt) => {
      const a = norm(pt.dS);
      const n = scale(pt.dS, 1 / a);
      return { center: pt.center, normal: n, area: a, contribution: dot(fluxDensity(regular, pt.center), pt.dS) * 1e6 };
    });
    return { flux: flux * 1e6, enclosed: (enclosed + halfOnSurface) * 1e6, area: surfaceArea(shape, 16), onSurface: onSurface.length > 0, patches };
  },
  handles: ["size", "shape", "center"],
  readouts: { flux: "µC", enclosed: "µC", area: "m^2" },
  links: ["charges"],
});

export const Equation = defineComponent({
  id: "equation",
  params: z.object({
    latex: z.string().min(1),
    terms: z.array(z.object({ key: z.string().min(1), speech: z.string().min(1) })).default([]),
    speech: z.string().min(1),
    shortSpeech: z.string().min(1),
  }),
  model: () => ({}),
  handles: [],
  readouts: {},
});

const MATERIAL_EPS_R = { Air: 1.0006, Glass: 5, Sulphur: 4, Shellac: 3.5 } as const;

export const FaradaySpheres = defineComponent({
  id: "faraday-spheres",
  params: z.object({
    innerQ: z.number().default(2),
    material: z.enum(["Air", "Glass", "Sulphur", "Shellac"]).default("Air"),
    revealed: z.boolean().default(false),
  }),
  model: (p) => {
    const epsR = MATERIAL_EPS_R[p.material];
    const d = (p.innerQ * 1e-6) / (4 * Math.PI * 0.25); // D at r = 0.5 m
    return { outerQ: p.innerQ, epsR, eMid: d / (EPS0 * epsR) };
  },
  handles: ["material"],
  readouts: { outerQ: "µC", eMid: "V/m" },
});

export const Axes = defineComponent({ id: "axes", params: z.object({ length: z.number().positive().default(1.8) }), model: () => ({}), handles: [], readouts: {} });

export const DimensionCallout = defineComponent({
  id: "dimension-callout",
  params: z.object({ from: V3, to: V3, label: z.string().min(1) }),
  model: () => ({}),
  handles: [],
  readouts: {},
});

export const emComponents: AnyComponent[] = [Charges, FieldArrows, FieldProfile, GaussianSurface, Equation, FaradaySpheres, Axes, DimensionCallout];
```

Append to `src/index.ts`: `export * from "./components/em";`

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS. If the on-surface detection misfires for the off-centre blob case in test 1 (flux ≠ 2), reduce the `0.6 * Math.sqrt(area)` factor to `0.4`. The test is the contract: interior charges must never be flagged.

- [ ] **Step 5: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): electromagnetics component models backed by @forma/physics"
```

---

### Task 12: Course: Faraday, Gauss and detour plates, goal checks, lesson rewiring

**Files:**
- Create: `app/packages/course-em1/src/plates/faraday.ts`, `src/plates/gauss.ts`, `src/plates/detours.ts`, `src/plates/index.ts`, `src/checks.ts`
- Modify: `app/packages/course-em1/package.json` (add `@forma/plate`), `src/index.ts`, `src/concepts/gauss-law.ts`, `src/report.ts`, `test/report.test.ts`
- Modify: `app/apps/web/components/blocks/BlockView.tsx` (placeholder renderer for `plate`), `app/apps/web/e2e/journey.spec.ts` (mark the old Gauss journey `test.fixme`)
- Test: `app/packages/course-em1/test/plates.test.ts`

**Interfaces:**
- Consumes: `Registry`, `emComponents`, `PlateDef`, `validatePlate`, `createEvaluator`, `stateAt`, `Frame` (`@forma/plate`); `contains`, `Vec3` (`@forma/physics`).
- Produces:
  - `plates: Record<string, PlateDef>` (ids: `faraday`, `gauss`, `why-area-plate`, `outside-charge-plate`, `normal-direction-plate`, `d-vs-e-plate`, `symmetry-plate`)
  - `registry: Registry` (EM components)
  - `Check = (now: Frame, start: Frame) => boolean`; `checks: Record<string, Check>` (`outside-zero`, `resize-constant`, `shape-swap`)
  - The `em1.electrostatics.gauss-law` lessons `main`, `why-area`, `outside-charge`, `normal-direction`, `d-vs-e` and `symmetry` each become plate blocks. The old block lessons are kept as `main-classic` and `<detour>-classic`.
  - `publishChecklist(course, concept, plates?)` treats plate blocks as satisfying: intuition (notes), formal (an `equation` instance), visual, interaction (any step interaction), practice (numeric/step-solve interaction) and advanced path (any `why`/`derivation`).

- [ ] **Step 1: Dependency**

Add `"@forma/plate": "workspace:*"` to `packages/course-em1/package.json` dependencies, then run `pnpm install`.

- [ ] **Step 2: Write the failing test**: `app/packages/course-em1/test/plates.test.ts`

```ts
import { createEvaluator, stateAt, validatePlate } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { checks, course, plates, registry } from "../src";

describe("plates", () => {
  for (const plate of Object.values(plates)) {
    it(`${plate.id}: no validation errors`, () => {
      expect(validatePlate(registry, plate).filter((i) => i.level === "error")).toEqual([]);
    });
    it(`${plate.id}: no word-budget or possible-slide warnings`, () => {
      expect(validatePlate(registry, plate).filter((i) => i.level === "warning")).toEqual([]);
    });
  }

  it("every plate block in the course references an existing plate", () => {
    for (const c of course.concepts)
      for (const l of c.lessons)
        for (const b of l.blocks) if (b.type === "plate") expect(plates[b.plateId], `${c.id}/${l.id}`).toBeDefined();
  });

  it("every step interaction check exists", () => {
    for (const p of Object.values(plates))
      for (const s of p.steps)
        if (s.interaction && (s.interaction.type === "place" || s.interaction.type === "manipulate-goal")) expect(checks[s.interaction.check], s.interaction.check).toBeDefined();
  });

  it("gauss: the predict-drag reveal really keeps flux constant", () => {
    const g = plates.gauss!;
    const i = g.steps.findIndex((s) => s.interaction?.type === "predict-drag");
    const step = g.steps[i]!;
    if (step.interaction?.type !== "predict-drag") throw new Error("no predict-drag");
    const ev = createEvaluator(registry, g.instances);
    const before = ev(stateAt(g, i));
    const revealed = stateAt(g, i);
    for (const [id, patch] of Object.entries(step.interaction.reveal)) revealed[id]!.params = { ...revealed[id]!.params, ...patch };
    const after = ev(revealed);
    expect(after.surface!.model.flux as number).toBeCloseTo(before.surface!.model.flux as number, 4);
  });

  it("outside-zero passes only once the draggable charge leaves the surface", () => {
    const g = plates.gauss!;
    const i = g.steps.findIndex((s) => s.interaction?.type === "manipulate-goal");
    const ev = createEvaluator(registry, g.instances);
    const start = ev(stateAt(g, i));
    expect(checks["outside-zero"]!(start, start)).toBe(false);
    const moved = stateAt(g, i);
    const items = (moved.q!.params.items as { id: string; pos: number[]; draggable?: boolean }[]).map((it) => (it.draggable ? { ...it, pos: [3, 0, 0] } : it));
    moved.q!.params = { ...moved.q!.params, items };
    expect(checks["outside-zero"]!(ev(moved), start)).toBe(true);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm vitest run packages/course-em1/test/plates.test.ts`
Expected: FAIL (`plates` is not exported).

- [ ] **Step 4: Goal checks**: `app/packages/course-em1/src/checks.ts`

```ts
import type { Frame } from "@forma/plate";
import { contains, type SurfaceShape, type Vec3 } from "@forma/physics";

export type Check = (now: Frame, start: Frame) => boolean;

type Item = { id: string; kind: string; pos?: number[]; draggable?: boolean };
const shapeOf = (f: Frame): SurfaceShape | null => {
  const s = f.surface;
  if (!s) return null;
  const p = s.params as { shape: string; center: number[]; size: number; height: number; amplitude: number; lobes: number };
  const center = p.center as unknown as Vec3;
  if (p.shape === "cube") return { kind: "cube", center, side: p.size };
  if (p.shape === "blob") return { kind: "blob", center, radius: p.size, amplitude: p.amplitude, lobes: p.lobes };
  if (p.shape === "cylinder") return { kind: "cylinder", center, radius: p.size, height: p.height };
  return { kind: "sphere", center, radius: p.size };
};

export const checks: Record<string, Check> = {
  /** A draggable point charge has been moved outside the surface. */
  "outside-zero": (now) => {
    const shape = shapeOf(now);
    const items = (now.q?.params.items ?? []) as Item[];
    return !!shape && items.some((it) => it.kind === "point" && it.draggable && it.pos && !contains(shape, it.pos as unknown as Vec3));
  },
  /** The surface size changed by at least 40% while charge stays enclosed. */
  "resize-constant": (now, start) => {
    const a = Number(start.surface?.params.size);
    const b = Number(now.surface?.params.size);
    return Math.abs(b / a - 1) >= 0.4 && Math.abs(Number(now.surface?.model.enclosed)) > 1e-9;
  },
  /** The surface shape changed while charge stays enclosed. */
  "shape-swap": (now, start) =>
    now.surface?.params.shape !== start.surface?.params.shape && Math.abs(Number(now.surface?.model.enclosed)) > 1e-9,
};
```

- [ ] **Step 5: The Faraday plate**: `app/packages/course-em1/src/plates/faraday.ts`

```ts
import { PlateDef } from "@forma/plate";

export const faraday = PlateDef.parse({
  id: "faraday",
  title: "Faraday's spheres",
  instances: [{ id: "spheres", component: "faraday-spheres", params: { innerQ: 2, material: "Air", revealed: false } }],
  steps: [
    {
      id: "setup",
      title: "One charge, four materials",
      show: ["spheres"],
      focus: ["spheres"],
      note: "1837: Faraday hung a charged ball, +Q, inside a hollow metal sphere and measured the charge that appeared on the outside. Then he packed glass, sulphur and shellac between the two.",
      interaction: {
        id: "faraday-predict",
        type: "choose",
        prompt: "With glass packed between the spheres, the outer sphere shows…",
        options: [
          { id: "same", label: "Exactly +Q", correct: true, feedback: "Yes: the same in every material." },
          { id: "less", label: "Less than +Q: glass soaks some up", correct: false, feedback: "The material changes E, not the flux.", tag: "D_VS_E_PERMITTIVITY" },
          { id: "more", label: "More than +Q", correct: false, feedback: "Nothing is created in between." },
        ],
        dimension: "conceptual",
      },
    },
    {
      id: "reveal",
      title: "Always +Q",
      patch: { spheres: { material: "Glass", revealed: true } },
      focus: ["spheres"],
      note: "Always +Q. Something passes from the inner charge to the outer sphere and ignores the material in between. We call it electric flux, and in SI units Ψ = Q.",
      claims: [{ instance: "spheres", readout: "outerQ", value: 2, unit: "µC" }],
      why: "The measured outer charge never depended on the dielectric. Only the field strength inside the material does, through E = D/ε.",
    },
  ],
});
```

- [ ] **Step 6: The Gauss plate**: `app/packages/course-em1/src/plates/gauss.ts`

```ts
import { PlateDef } from "@forma/plate";

const eq = (latex: string) => ({
  latex,
  terms: [
    { key: "t-flux", speech: "psi, the electric flux" },
    { key: "t-surface", speech: "over the closed surface S" },
    { key: "t-charge", speech: "Q enclosed" },
  ],
  speech: "psi equals the closed surface integral of D dot d S, which equals the charge enclosed",
  shortSpeech: "Gauss's law",
});

export const gauss = PlateDef.parse({
  id: "gauss",
  title: "Electric flux → Gauss's law",
  instances: [
    { id: "q", component: "charges", params: { items: [{ id: "q1", kind: "point", q: 2, pos: [0, 0, 0] }] } },
    { id: "field", component: "field-arrows", params: { grid: 5, probe: 1 }, links: { charges: "q" } },
    { id: "profile", component: "field-profile", params: { rMin: 0.3, rMax: 3 }, links: { charges: "q" } },
    { id: "surface", component: "gaussian-surface", params: { shape: "sphere", size: 1 }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: eq(String.raw`\htmlClass{t-flux}{\Psi}`) },
  ],
  bindings: { "t-flux": ["surface", "field"], "t-surface": ["surface"], "t-charge": ["q"], "t-field": ["field"] },
  steps: [
    {
      id: "charge",
      title: "§1 Charge",
      show: ["q"],
      focus: ["q"],
      note: "One point charge, +2 µC. Everything in this lesson is a way of counting what spreads out from it.",
      claims: [{ instance: "q", readout: "total", value: 2, unit: "µC" }],
    },
    {
      id: "field",
      title: "§2 Field",
      show: ["field", "profile"],
      focus: ["field"],
      note: "D points away from the charge and weakens with distance: twice as far, a quarter as strong. Arrows show D in space; the curve plots |D| against r.",
      claims: [{ instance: "field", readout: "probeD", value: 0.159155, unit: "µC/m^2" }],
      why: "D = Q/(4πr²): the same flux spread over a sphere whose area grows as r².",
    },
    {
      id: "surface",
      title: "§3 Surface",
      show: ["surface"],
      hide: ["profile"],
      patch: { surface: { showNormals: true } },
      focus: ["surface"],
      note: "Wrap the charge in a closed surface and chop it into patches. Each patch has an outward normal dS and lets through only the part of D that pierces it.",
      claims: [{ instance: "surface", readout: "area", value: 12.566, unit: "m^2" }],
      interaction: {
        id: "normal-direction",
        type: "choose",
        prompt: "On a closed surface, dS points…",
        options: [
          { id: "out", label: "Always outward", correct: true, feedback: "Right. That fixed convention gives Ψ its sign." },
          { id: "along", label: "Along D, whichever way D points", correct: false, feedback: "Then flux could never be negative. The normal is fixed outward.", tag: "SURFACE_NORMAL_DIRECTION" },
          { id: "in", label: "Inward, toward the charge", correct: false, feedback: "The convention is outward.", tag: "SURFACE_NORMAL_DIRECTION" },
        ],
        dimension: "recognition",
      },
    },
    {
      id: "flux",
      title: "§4 Flux",
      show: ["eq"],
      patch: { surface: { shading: true }, eq: eq(String.raw`\htmlClass{t-flux}{\Psi}=\oint_{\htmlClass{t-surface}{S}}\mathbf D\cdot d\mathbf S`) },
      focus: ["surface"],
      note: "Add up every patch and you get the flux Ψ. Now predict: if the sphere's radius doubles, what will Ψ read?",
      claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
      interaction: {
        id: "flux-guess",
        type: "predict-drag",
        prompt: "Drag Ψ to your prediction for a sphere of radius 2 m",
        target: { instance: "surface", readout: "flux" },
        range: [0, 10],
        unit: "µC",
        reveal: { surface: { size: 2 } },
        dimension: "conceptual",
        feedback: { close: "Unchanged. Area ×4, D ÷4: they cancel exactly.", far: "The area grows as r², but D falls as 1/r². Watch them cancel." },
        tag: "FLUX_SCALES_WITH_AREA",
      },
    },
    {
      id: "law",
      title: "§5 The law",
      patch: {
        surface: { size: 2 },
        q: { items: [{ id: "q1", kind: "point", q: 2, pos: [0, 0, 0] }, { id: "q2", kind: "point", q: 3, pos: [0.8, 0, 0.3], draggable: true }] },
        eq: eq(String.raw`\htmlClass{t-flux}{\Psi}=\oint_{\htmlClass{t-surface}{S}}\mathbf D\cdot d\mathbf S=\htmlClass{t-charge}{Q_{\mathrm{enc}}}`),
      },
      focus: ["q", "surface"],
      note: "Only enclosed charge counts. Drag the second charge out of the surface and watch Ψ fall back to exactly the charge left inside.",
      claims: [
        { instance: "surface", readout: "enclosed", value: 5, unit: "µC" },
        { instance: "surface", readout: "flux", value: 5, unit: "µC" },
      ],
      interaction: { id: "drag-out", type: "manipulate-goal", goal: "Drag the +3 µC charge outside the sphere.", check: "outside-zero", dimension: "conceptual" },
      derivation: "Flux from an outside charge enters the surface somewhere (D·dS < 0) and leaves somewhere else (D·dS > 0). Every line that enters also leaves, so the net contribution is zero.",
    },
    {
      id: "prove",
      title: "§6 Prove it",
      patch: {
        surface: { shape: "cube", size: 2, readout: false, shading: false },
        q: { items: [{ id: "q1", kind: "point", q: 4, pos: [0.3, 0, 0] }] },
      },
      focus: ["surface"],
      note: "A 4 µC charge sits 0.3 m off-centre inside a closed cube of side 2 m. What flux leaves the cube?",
      claims: [{ instance: "surface", readout: "flux", value: 4, unit: "µC" }],
      interaction: {
        id: "cube-flux",
        type: "numeric",
        prompt: "Total flux leaving the cube?",
        answer: { value: 4, unit: "µC" },
        distractors: [
          { value: 0.667, unit: "µC", errorClass: "conceptual", tag: "GAUSS_WITHOUT_SYMMETRY", feedback: "Splitting it into six equal faces needs the charge at the centre, and you don't need the faces at all." },
        ],
        hints: ["Which charge does the cube enclose?", "Where it sits inside doesn't matter.", "Ψ = Q_enc."],
        dimension: "computational",
      },
    },
  ],
});
```

- [ ] **Step 7: Detour plates**: `app/packages/course-em1/src/plates/detours.ts`

```ts
import { PlateDef } from "@forma/plate";

const point = (q: number, pos: [number, number, number], draggable = false) => ({ id: `q${q}${pos.join("")}`, kind: "point" as const, q, pos, draggable });
const base = (items: unknown[], surface: Record<string, unknown>) => [
  { id: "q", component: "charges", params: { items }, visible: true },
  { id: "field", component: "field-arrows", params: { grid: 5 }, links: { charges: "q" }, visible: true },
  { id: "surface", component: "gaussian-surface", params: { shading: true, ...surface }, links: { charges: "q" }, visible: true },
];

export const whyArea = PlateDef.parse({
  id: "why-area-plate",
  title: "Why a bigger surface doesn't catch more flux",
  instances: base([point(4, [0, 0, 0])], { shape: "sphere", size: 1 }),
  steps: [
    { id: "small", title: "r = 1 m", focus: ["surface"], note: "At r = 1 m, D is 4/(4π) µC/m² over 4π m² of surface: 4 µC in total.", claims: [{ instance: "surface", readout: "flux", value: 4, unit: "µC" }] },
    { id: "big", title: "r = 2.5 m", patch: { surface: { size: 2.5 } }, focus: ["surface"], note: "The patches pale as D weakens, but there are more of them. Still exactly 4 µC.", claims: [{ instance: "surface", readout: "flux", value: 4, unit: "µC" }] },
  ],
});

export const outsideCharge = PlateDef.parse({
  id: "outside-charge-plate",
  title: "Charges outside the surface",
  instances: base([point(1, [0, 0, 0]), point(4, [0.3, 0, 0.3], true)], { shape: "cube", size: 2 }),
  steps: [
    { id: "inside", title: "Both inside", focus: ["q"], note: "Both charges are inside: Ψ = 5 µC.", claims: [{ instance: "surface", readout: "flux", value: 5, unit: "µC" }] },
    {
      id: "drag",
      title: "Drag one out",
      focus: ["surface"],
      note: "Drag the +4 µC charge out of the cube. Amber patches (inflow) and violet patches (outflow) balance exactly.",
      interaction: { id: "drag-out-detour", type: "manipulate-goal", goal: "Move the +4 µC charge outside the cube.", check: "outside-zero", dimension: "conceptual" },
    },
  ],
});

export const normalDirection = PlateDef.parse({
  id: "normal-direction-plate",
  title: "Which way dS points",
  instances: base([point(-3, [0, 0, 0])], { shape: "sphere", size: 1, showNormals: true }),
  steps: [
    {
      id: "negative",
      title: "A negative charge",
      focus: ["surface"],
      note: "D points inward everywhere, but every normal still points outward. Each patch is inflow, so Ψ = −3 µC.",
      claims: [{ instance: "surface", readout: "flux", value: -3, unit: "µC" }],
    },
    {
      id: "check",
      title: "Check",
      focus: ["surface"],
      note: "On a patch where D points into the closed surface, what sign does D·dS have?",
      interaction: {
        id: "sign",
        type: "choose",
        prompt: "D·dS on an inflow patch is…",
        options: [
          { id: "neg", label: "Negative", correct: true, feedback: "Right: D is against the outward normal." },
          { id: "pos", label: "Positive, because dS follows D", correct: false, feedback: "dS never follows D; it is always outward.", tag: "SURFACE_NORMAL_DIRECTION" },
        ],
        dimension: "recognition",
      },
    },
  ],
});

export const dVsE = PlateDef.parse({
  id: "d-vs-e-plate",
  title: "D versus E in a material",
  instances: [
    { id: "q", component: "charges", params: { items: [point(2, [0, 0, 0])] }, visible: true },
    { id: "field", component: "field-arrows", params: { grid: 5, probe: 1, epsR: 1 }, links: { charges: "q" }, visible: true },
  ],
  steps: [
    {
      id: "vacuum",
      title: "Free space",
      focus: ["field"],
      note: "At 1 m from a 2 µC charge in free space, D = 0.159 µC/m².",
      claims: [{ instance: "field", readout: "probeD", value: 0.159155, unit: "µC/m^2" }],
    },
    {
      id: "oil",
      title: "In oil (ε_r = 4)",
      patch: { field: { epsR: 4 } },
      focus: ["field"],
      note: "Put the charge in a material with ε_r = 4. D stays 0.159 µC/m², set by free charge alone. E drops to a quarter.",
      claims: [
        { instance: "field", readout: "probeD", value: 0.159155, unit: "µC/m^2" },
        { instance: "field", readout: "probeE", value: 4493.8, unit: "V/m" },
      ],
    },
  ],
});

export const symmetry = PlateDef.parse({
  id: "symmetry-plate",
  title: "When Gauss's law finds D",
  instances: base([point(2, [0.4, 0.2, 0], true)], { shape: "blob", size: 1 }),
  steps: [
    {
      id: "lumpy",
      title: "Lumpy surface",
      focus: ["surface"],
      note: "Off-centre charge, lumpy surface: every patch differs, yet the total is exactly 2 µC. The law holds, but there's no single D to pull out of the integral.",
      claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
    },
    {
      id: "symmetric",
      title: "Symmetric surface",
      patch: { surface: { shape: "sphere", size: 1 }, q: { items: [point(2, [0, 0, 0])] } },
      focus: ["surface"],
      note: "A sphere centred on the charge: |D| is the same on every patch and normal to it. Now D × area = Q gives D in one line.",
      claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
    },
  ],
});
```

(The `oil` claim: E = D/(ε₀ε_r) = (2×10⁻⁶/(4π))/(8.8541878128×10⁻¹²·4) = 4493.8 V/m.)

- [ ] **Step 8: Index the plates and the registry**: `src/plates/index.ts`

```ts
import { emComponents, Registry, type PlateDef } from "@forma/plate";
import { dVsE, normalDirection, outsideCharge, symmetry, whyArea } from "./detours";
import { faraday } from "./faraday";
import { gauss } from "./gauss";

export const plates: Record<string, PlateDef> = Object.fromEntries(
  [faraday, gauss, whyArea, outsideCharge, normalDirection, dVsE, symmetry].map((p) => [p.id, p]),
);

export const registry = new Registry().register(...emComponents);
```

Append to `src/index.ts`:

```ts
export { plates, registry } from "./plates";
export { checks, type Check } from "./checks";
```

- [ ] **Step 9: Rewire the Gauss lessons**: in `src/concepts/gauss-law.ts`

1. Rename the existing lesson ids: `main` → `main-classic`, `why-area` → `why-area-classic`, `outside-charge` → `outside-charge-classic`, `normal-direction` → `normal-direction-classic`, `d-vs-e` → `d-vs-e-classic`, `symmetry` → `symmetry-classic`.
2. Prepend six plate lessons to the `lessons` array:

```ts
    {
      id: "main",
      title: "Electric flux → Gauss's law",
      minutes: 25,
      blocks: [
        { ...meta("vivid", src(SLIDES, "pp. 29-30")), id: "faraday", type: "plate", plateId: "faraday" },
        { ...meta("vivid", src(SLIDES, "pp. 31-38")), id: "gauss", type: "plate", plateId: "gauss" },
      ],
    },
    { id: "why-area", title: "Detour: why a bigger surface doesn't catch more flux", minutes: 3, blocks: [{ ...meta("vivid", orig()), id: "why-area-p", type: "plate", plateId: "why-area-plate" }] },
    { id: "outside-charge", title: "Detour: charges outside the surface", minutes: 3, blocks: [{ ...meta("vivid", orig()), id: "outside-charge-p", type: "plate", plateId: "outside-charge-plate" }] },
    { id: "normal-direction", title: "Detour: which way dS points", minutes: 3, blocks: [{ ...meta("vivid", src(WENT, "§2.6, p. 44")), id: "normal-direction-p", type: "plate", plateId: "normal-direction-plate" }] },
    { id: "d-vs-e", title: "Detour: D versus E in a material", minutes: 3, blocks: [{ ...meta("vivid", src(SLIDES, "pp. 30-34")), id: "d-vs-e-p", type: "plate", plateId: "d-vs-e-plate" }] },
    { id: "symmetry", title: "Detour: when Gauss's law finds D", minutes: 3, blocks: [{ ...meta("vivid", src(WENT, "§2.7, p. 47")), id: "symmetry-p", type: "plate", plateId: "symmetry-plate" }] },
```

The misconception remediation refs (`${ID}/why-area` etc.) now resolve to the plate detours; no edit is needed.

3. Inside the `-classic` lessons, block ids must stay unique per concept (`lintCourse` checks). They already are, because the plate blocks use new ids (`faraday`, `gauss`, `*-p`). If `lintCourse` reports a duplicate, rename the plate block id.

- [ ] **Step 10: Publish checklist understands plates**: in `src/report.ts`, change the signature and the inferences:

```ts
import type { PlateDef } from "@forma/plate";

export function publishChecklist(course: Course, c: Concept, plates: Record<string, PlateDef> = {}): Record<Check, boolean> {
  const blocks = blocksOf(c);
  const plateSteps = blocks.flatMap((b) => (b.type === "plate" ? (plates[b.plateId]?.steps ?? []) : []));
  const plateInstances = blocks.flatMap((b) => (b.type === "plate" ? (plates[b.plateId]?.instances ?? []) : []));
  const has = (...types: Block["type"][]) => blocks.some((b) => types.includes(b.type));
  const lessonIds = new Set(course.concepts.flatMap((x) => x.lessons.map((l) => `${x.id}/${l.id}`)));
  const stepHas = (...types: string[]) => plateSteps.some((s) => s.interaction && types.includes(s.interaction.type));
  return {
    objectives: c.objectives.length > 0,
    "prerequisites mapped": c.prerequisites.length > 0 || c.id === "em1.math.vectors",
    intuition: has("prose", "predict") || plateSteps.length > 0,
    "formal statement": has("equation-build") || blocks.some((b) => b.type === "prose" && b.text.includes("$")) || plateInstances.some((i) => i.component === "equation"),
    visual: has("sim-3d", "sim-2d", "manipulate", "figure", "plate"),
    interaction: has("predict", "manipulate", "branch", "order", "identify") || stepHas("predict-drag", "place", "manipulate-goal", "identify", "choose", "build-equation"),
    "misconceptions + remediation": c.misconceptions.length > 0 && c.misconceptions.every((m) => lessonIds.has(m.remediation)),
    practice: has("numeric", "step-solve", "challenge") || stepHas("numeric", "step-solve"),
    "assessment mapping": c.examLinks.length > 0,
    sources: c.sources.length > 0,
    "advanced path": blocks.some((b) => b.type === "branch" && b.options.some((o) => o.id === "advanced")) || plateSteps.some((s) => s.why || s.derivation),
  };
}
```

and update `publishReport(course, plates = {})` to pass `plates` through to `publishChecklist`. In `test/report.test.ts`, import `plates` from `../src` and pass it: `publishChecklist(course, gauss, plates)` and `publishReport(course, plates)`.

- [ ] **Step 11: Keep the web app working until Plan B**

In `apps/web/components/blocks/BlockView.tsx`, add to the `render` switch:

```tsx
    case "plate":
      return (
        <p className="rounded-md border border-line p-3 text-sm text-soft">
          This part uses Forma's new plate engine, which the next build of the interface renders. Open “{block.plateId}” in the classic lesson meanwhile.
        </p>
      );
```

In `apps/web/e2e/journey.spec.ts`:
- change `test("full learning journey", …)` to `test.fixme("full learning journey", …)`, with the comment `// Rewritten for plate lessons in Plan B.` above it;
- in the remaining tests ("return experience", "@perf lab …"), replace `/learn/em1.electrostatics.gauss-law/main"` with `/learn/em1.electrostatics.gauss-law/main-classic"` so they keep exercising the classic renderer until Plan B.

- [ ] **Step 12: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: all pass, and both typechecks exit 0. If a plate claim fails, fix the **authored claim value** only when the physics test in Task 2 or 11 proves the model right. Never loosen a tolerance to pass.

- [ ] **Step 13: Commit**

```bash
git add -A packages/course-em1 apps/web pnpm-lock.yaml && git commit -m "feat(course-em1): Faraday, Gauss and detour plates with physics claims and goal checks"
```

---

### Task 13: Course: question templates with independent verification

**Files:**
- Create: `app/packages/course-em1/src/templates.ts`
- Modify: `app/packages/course-em1/src/index.ts`
- Test: `app/packages/course-em1/test/templates.test.ts`

**Interfaces:**
- Consumes: `defineTemplate`, `instantiate`, `checkNumeric`, `toSI` (`@forma/engine`); `fluxThrough`, `surfacePatches`, `dot`, `norm`, `scale`, `EPS0`, `vec` (`@forma/physics`).
- Produces: `templates: TemplateDef<any>[]` with ids `q06-octant`, `q08-e`, `q08-q`, `q09a-cube`, `f2425-qt`. Each is tagged with `em1.electrostatics.gauss-applications`.

- [ ] **Step 1: Write the failing test**: `app/packages/course-em1/test/templates.test.ts`

```ts
import { checkNumeric, instantiate, toSI } from "@forma/engine";
import { EPS0, dot, fluxThrough, norm, scale, surfacePatches, vec, type Vec3 } from "@forma/physics";
import { describe, expect, it } from "vitest";
import { templates } from "../src";

const byId = Object.fromEntries(templates.map((t) => [t.id, t]));
/** Flux of a radial field D(r) = a·r² (nC/m²) through a sphere, integrated numerically. */
const radialFlux = (a: number, R: number) =>
  surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: R }, 24).reduce((s, p) => {
    const r = norm(p.center);
    return s + dot(scale(p.center, (a * 1e-9 * r * r) / r), p.dS);
  }, 0);

const truth: Record<string, (p: Record<string, number>) => number> = {
  "q06-octant": (p) =>
    fluxThrough(
      [{ kind: "point", q: p.Q! * 1e-6, pos: vec(0, 0, 0) }],
      surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 0.26 }, 32).filter((pt) => pt.center[0] > 0 && pt.center[1] > 0 && pt.center[2] > 0),
    ),
  "q08-e": (p) => (p.a! * 1e-9 * p.r! * p.r!) / EPS0,
  "q08-q": (p) => radialFlux(p.a!, p.r!),
  "q09a-cube": (p) =>
    fluxThrough(
      [
        { kind: "point", q: p.q1! * 1e-6, pos: vec(1, -2, 3) },
        { kind: "point", q: p.q2! * 1e-6, pos: vec(-1, 2, -2) },
      ],
      surfacePatches({ kind: "cube", center: vec(0, 0, 0), side: 10 }, 48),
    ),
  "f2425-qt": (p) => radialFlux(p.a!, p.R!),
};

describe("question templates", () => {
  it("defines exactly the expected templates", () => {
    expect(templates.map((t) => t.id).sort()).toEqual(Object.keys(truth).sort());
  });
  for (const id of Object.keys(truth)) {
    it(`${id}: answers match independent physics for seeds 1-50`, () => {
      for (let seed = 1; seed <= 50; seed++) {
        const v = instantiate(byId[id]!, seed);
        const authored = toSI(v.spec.answer.value, v.spec.answer.unit).value;
        const real = truth[id]!(v.params);
        expect(Math.abs(authored - real) / Math.abs(real), `${v.key}`).toBeLessThan(0.005);
        expect(checkNumeric(v.spec, `${v.spec.answer.value} ${v.spec.answer.unit}`).correct).toBe(true);
      }
    });
    it(`${id}: no distractor coincides with the answer (seeds 1-200)`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const v = instantiate(byId[id]!, seed);
        const a = toSI(v.spec.answer.value, v.spec.answer.unit).value;
        for (const d of v.spec.distractors) {
          const dv = toSI(d.value, d.unit).value;
          expect(Math.abs(dv - a) > v.spec.relTol * Math.abs(a), `${v.key} distractor ${d.value}`).toBe(true);
        }
      }
    });
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/course-em1/test/templates.test.ts`
Expected: FAIL (`templates` is not exported).

- [ ] **Step 3: Implement**: `app/packages/course-em1/src/templates.ts`

```ts
import { defineTemplate, type TemplateDef } from "@forma/engine";

const EPS0 = 8.8541878128e-12;
const concept = "em1.electrostatics.gauss-applications";
const r4 = (x: number) => Math.round(x * 1e4) / 1e4;

const q06 = defineTemplate<{ Q: number }>({
  id: "q06-octant",
  params: { Q: { min: 10, max: 90, step: 5 } },
  prompt: (p) => `A ${p.Q} µC point charge sits at the origin. Find the flux through the part of the sphere r = 26 cm with 0 < θ < π/2 and 0 < φ < π/2.`,
  solve: (p) => ({
    answer: { value: r4(p.Q / 8), unit: "µC" },
    distractors: [
      { value: r4(p.Q / 4), unit: "µC", errorClass: "conceptual", feedback: "That range is 1/8 of the sphere: half in θ, a quarter in φ." },
      { value: p.Q, unit: "µC", errorClass: "conceptual", feedback: "The whole closed sphere gets Q; this is only part of it." },
    ],
  }),
  hints: () => ["The charge is at the centre, so the flux spreads evenly.", "What fraction of the sphere is this?", "Half in θ × a quarter in φ."],
  dimension: "application",
  tags: { concepts: [concept], misconceptions: [], difficulty: 2 },
});

const q08e = defineTemplate<{ a: number; r: number }>({
  id: "q08-e",
  params: { a: { min: 0.1, max: 0.9, step: 0.1 }, r: { min: 1, max: 5, step: 1 } },
  prompt: (p) => `In free space D = ${p.a}r² a_r nC/m². Find |E| at r = ${p.r} m.`,
  solve: (p) => {
    const d = p.a * p.r * p.r; // nC/m²
    return {
      answer: { value: r4((d * 1e-9) / EPS0), unit: "V/m" },
      distractors: [{ value: r4(d), unit: "V/m", errorClass: "conceptual", tag: "D_VS_E_PERMITTIVITY", feedback: `${r4(d)} is D in nC/m². E = D/ε₀.` }],
    };
  },
  hints: (p) => ["In free space E = D/ε₀.", `D(${p.r}) = ${p.a} × ${p.r}² nC/m².`, "Divide by 8.854×10⁻¹² F/m."],
  dimension: "computational",
  tags: { concepts: [concept], misconceptions: ["D_VS_E_PERMITTIVITY"], difficulty: 2 },
});

const q08q = defineTemplate<{ a: number; r: number }>({
  id: "q08-q",
  params: { a: { min: 0.1, max: 0.9, step: 0.1 }, r: { min: 1, max: 5, step: 1 } },
  prompt: (p) => `In free space D = ${p.a}r² a_r nC/m². Find the total charge within the sphere r = ${p.r} m.`,
  solve: (p) => ({
    answer: { value: r4(p.a * p.r ** 4 * 4 * Math.PI), unit: "nC" },
    distractors: [{ value: r4(p.a * p.r * p.r), unit: "nC", errorClass: "conceptual", feedback: "That's D on the sphere. Multiply by its area, 4πr²." }],
  }),
  hints: (p) => ["Q_enc = ∮ D·dS.", "D is radial and constant on the sphere: ∮ D·dS = D × 4πr².", `${p.a} × ${p.r}² × 4π × ${p.r}² nC.`],
  dimension: "computational",
  tags: { concepts: [concept], misconceptions: [], difficulty: 3 },
});

const q09a = defineTemplate<{ q1: number; q2: number }>({
  id: "q09a-cube",
  params: { q1: { min: 0.1, max: 0.9, step: 0.1 }, q2: { min: 0.1, max: 0.9, step: 0.1 } },
  prompt: (p) => `Find the total flux leaving the cube x, y, z = ±5 m for point charges ${p.q1} µC at (1, −2, 3) and ${p.q2} µC at (−1, 2, −2).`,
  solve: (p) => ({
    answer: { value: r4(p.q1 + p.q2), unit: "µC" },
    distractors: [{ value: r4(Math.abs(p.q1 - p.q2)) || r4(p.q1 + p.q2 + 1), unit: "µC", errorClass: "sign", feedback: "Both charges are positive and inside: add them." }],
  }),
  hints: () => ["Are both charges inside |x|, |y|, |z| < 5?", "Both are inside.", "Ψ = Q_enc."],
  dimension: "computational",
  tags: { concepts: [concept], misconceptions: ["OUTSIDE_CHARGE_CONTRIBUTES"], difficulty: 1 },
});

const f2425 = defineTemplate<{ a: number; R: number }>({
  id: "f2425-qt",
  params: { a: { min: 1, max: 9, step: 1 }, R: { min: 5, max: 15, step: 1 } },
  prompt: (p) => `Finals 2024-25 Q2(a) style: in free space D = ${p.a}.0r² a_r nC/m². A sphere of radius r = ${p.R} m is centred at the origin. Compute Q_T, the total charge inside.`,
  solve: (p) => ({
    answer: { value: r4((p.a * p.R ** 4 * 4 * Math.PI) / 1000), unit: "µC" },
    distractors: [
      { value: r4((p.a * p.R ** 4 * 4 * Math.PI) / 1e6), unit: "µC", errorClass: "unit", feedback: "Check your prefixes: nC to µC is ÷1000, not ÷10⁶." },
      { value: r4((p.a * p.R * p.R) / 1000), unit: "µC", errorClass: "conceptual", feedback: "Multiply D by the sphere's area, 4πr²." },
    ],
  }),
  hints: (p) => [`|D| on the sphere = ${p.a} × ${p.R}² nC/m².`, "∮ D·dS = D × 4πR².", "Convert nC to µC at the end."],
  dimension: "application",
  tags: { concepts: [concept], misconceptions: [], difficulty: 3 },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const templates: TemplateDef<any>[] = [q06, q08e, q08q, q09a, f2425];
```

Append to `src/index.ts`: `export { templates } from "./templates";`

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS. If `q09a-cube`'s sign distractor coincides for `q1 == q2` (difference 0 is replaced by `sum + 1`), the no-coincidence test covers it. If any other seed collides, change that distractor's formula, not the test.

- [ ] **Step 5: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): seeded question templates verified against independent physics"
```

---

### Task 14: Full verification and handoff

**Files:**
- Modify: `app/README.md` (Forma naming, package table incl. `@forma/plate`, how to run the plate tests, and a note that Plan B renders plates)

- [ ] **Step 1: Run the whole suite**

Run: `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: every test passes, both typechecks exit 0, and `next build` succeeds.

- [ ] **Step 2: Regenerate and read the publish report**

Run: `pnpm vitest run packages/course-em1/test/report.test.ts && sed -n 1,20p packages/course-em1/PUBLISH_REPORT.md`
Expected: the "Gauss's Law" row shows 11/11.

- [ ] **Step 3: Update the README** with the package table:

| Package | Role |
|---|---|
| `@forma/physics` | Field, flux, surfaces (sphere, cube, blob, cylinder/pillbox), potential. |
| `@forma/engine` | Course grammar, answers, symbolic checking, templates, routes, mastery, state v2. |
| `@forma/plate` | Component contract, scene evaluation, steps, timeline + cues, focus links, validation, EM component models. |
| `@forma/course-em1` | EMag content: plates, templates, checks, classic lessons. |

Also add: "Plate views and the Forma interface are delivered by Plan B (`docs/superpowers/plans/…-forma-plan-b-interface.md`)."

- [ ] **Step 4: Commit**

```bash
git add README.md app/README.md && git commit -m "docs: Forma core handoff"
```

---

## Self-Review Notes

- **Spec coverage (Plan A scope):**
  - §2 package structure: Tasks 1 and 7
  - §4.1 component contract: Task 7; initial component set: Task 11
  - §4.2 plates and steps: Task 8
  - §4.3 timeline: Task 9
  - §4.4 focus links: Task 10
  - §4.5 learner edits: snapshots in state v2 (Task 6). Layering itself is UI, in Plan B.
  - §4.6 narration hooks: cue tracks (Task 9), narration schema and the verbatim lint (Tasks 8 and 10), equation speech (Task 11). The device reader is UI, in Plan B.
  - §4.7 memoisation: Task 7. Quality tiers are UI, in Plan B.
  - §5 interaction grammar, branching and templates: Tasks 3 and 4; symbolic checking: Task 5
  - §6 Gauss content: Tasks 12 and 13
  - §7 persistence v2: Task 6
  - §8 unit and plate-state replay tests: Tasks 10–13
- **Plan B covers:**
  - `@forma/ui`: tokens, fonts, wordmark, primitives
  - SVG/R3F/JSXGraph/MathLive views registered against these component ids
  - app shell, modes, ⌘K, themes, Solve/Explore/Revise, device narration reader
  - Playwright/axe/visual tests, and a rewrite of the fixme'd journey
- **Type consistency:**
  - `Frame`, `SceneState`, `Evaluated` and `Instance` are defined in Task 7 and used unchanged afterwards.
  - `Check` is defined in Task 12 and used by the Task 12 tests.
  - Readout units: `µC`, `µC/m^2`, `V/m`, `m^2`, used identically in the components (Task 11) and the claims (Task 12).
