# Maths Foundations N1: setup (second course, graph plate, routing, Desk card)

> **For agentic workers:** execute task by task as AGENTS.md says: implement → run the task's checks → commit → ledger line. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make room for a second, prerequisite course, "Maths Foundations for Engineering" (id `math0`). This plan adds:
- a `graph-1d` plate component for single-variable calculus;
- the course registry and routes in the web app;
- a Desk card that recommends foundation lessons the readiness check found you need.

N2 then fills the course with its first unit.

**Architecture:**
- **Where the course lives.** The foundations course is a second `Course` exported by `@forma/course-em1`, from `src/foundations/`. Its idea plates go into the same `plates`/`ideaPlates` maps, so every existing plate, idea and coverage test checks them with no new tests. Extract it into its own package when a second module arrives.
- **Exact maths.** The maths for `graph-1d` lives in `@forma/physics` (`maths.ts`): each function has exact derivatives, and antiderivatives where they exist.
- **Web registry.** The web app gets a small course registry (`courses`, `courseOf`, `getCourse`), so concept links, routes and crumbs resolve the right course.

**Tech stack:** existing only. zod, React 19, Next 16. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-02-forma-maths-foundations-design.md`.

**Branch:** work on `feat/em1-slice` after the owner has merged `feat/polish` into it. The spec, the Formulas toolkit and the calculator arrive with that merge. If `docs/superpowers/specs/2026-10-02-forma-maths-foundations-design.md` is missing, stop and say so.

**Ledger:** `.superpowers/sdd/2026-10-02-forma-plan-n1-foundations-setup/progress.md`.

## Global Constraints

- **No new tests**: no new test files, cases or e2e specs. Task 3 edits three existing assertions because this plan's change breaks them. Each is named exactly, and you must log each edit.
- **Colours:** tokens only (`var(--flux)`, `var(--surface)`, `var(--graphite)`, `var(--charge)`, `var(--ink)`, `var(--grid)`). No hex.
- **Course boundaries:** `course` keeps meaning the EMag course everywhere it is used today: Desk route, map, assessments, dashboard and status footer. Only the places this plan names learn about `foundations`.
- **Voice:** plain, exact and warm. No emoji in UI text.

## Review Focus

1. **Every concept link resolves:**
   - `conceptHref` for an `m0.*` id produces `/c/math0/...`;
   - for an `em1.*` id it is unchanged;
   - the static params include both courses, or the page 404s in the build.
2. **EMag is unchanged:** the Desk route, `/c/em1` map, dashboard and assessments still list only EMag concepts.
3. **Interpolated frames evaluate:** `graph-1d` evaluates at every mid-transition frame. Integer-like params (`rects`) tween through fractions, and `area` and `probe` switch between `null` and values.
4. **Exact zeros:** `graph-1d` signed areas that are exactly zero report 0, not 1e-17, so `0` claims pass.
5. **Skip is honoured:** the Desk card never blocks anything. "Skip for now" hides it across reloads, and it stays hidden when the route has no unfinished `m0.*` concepts.

---

### Task 1: Exact single-variable functions in `@forma/physics`

**Files:**
- Create: `app/packages/physics/src/maths.ts`
- Modify: `app/packages/physics/src/index.ts` (add `export * from "./maths";`)

**Produces:** `functions1d: Record<string, Fn1>`, `type Fn1 = { label: string; f(x): number; df(x): number; F?(x): number }`, `areaUnder(fn, a, b): number`, `midpointSum(fn, a, b, n): number`.

- [ ] **Step 1: Create `maths.ts` with exactly this content.**

```ts
import { gaussLegendre } from "./quadrature";

/** A function of one variable with its exact derivative and, where it has one, an exact antiderivative. */
export type Fn1 = { label: string; f: (x: number) => number; df: (x: number) => number; F?: (x: number) => number };

const { exp, sin, cos, log, sqrt } = Math;

/**
 * The curves the Maths Foundations lessons draw, by id. `label` is plain text for the plate (SVG can't typeset).
 * Ids are named for what they draw; lessons pick them in plate params.
 */
export const functions1d: Record<string, Fn1> = {
  x2: { label: "y = x²", f: (x) => x * x, df: (x) => 2 * x, F: (x) => x ** 3 / 3 },
  x3: { label: "y = x³", f: (x) => x ** 3, df: (x) => 3 * x * x, F: (x) => x ** 4 / 4 },
  "x3-over-3": { label: "y = x³/3", f: (x) => x ** 3 / 3, df: (x) => x * x, F: (x) => x ** 4 / 12 },
  "neg-cos": { label: "y = −cos x", f: (x) => -cos(x), df: (x) => sin(x), F: (x) => -sin(x) },
  sin: { label: "y = sin x", f: (x) => sin(x), df: (x) => cos(x), F: (x) => -cos(x) },
  lin: { label: "y = 2x + 1", f: (x) => 2 * x + 1, df: () => 2, F: (x) => x * x + x },
  "poly-d1": { label: "y = 2x³ − 2x² + 5x", f: (x) => 2 * x ** 3 - 2 * x * x + 5 * x, df: (x) => 6 * x * x - 4 * x + 5, F: (x) => x ** 4 / 2 - (2 * x ** 3) / 3 + (5 * x * x) / 2 },
  "ex-d1-basic": { label: "y = x⁴ − x² + 7x", f: (x) => x ** 4 - x * x + 7 * x, df: (x) => 4 * x ** 3 - 2 * x + 7 },
  "ex-d1-tut": { label: "y = 1.5e^(2x) + 2 sin 3x", f: (x) => 1.5 * exp(2 * x) + 2 * sin(3 * x), df: (x) => 3 * exp(2 * x) + 6 * cos(3 * x) },
  "neg-inv": { label: "y = −1/x", f: (x) => -1 / x, df: (x) => 1 / (x * x), F: (x) => -log(Math.abs(x)) },
  "sub-a": { label: "y = (x² + 1)⁴/4", f: (x) => (x * x + 1) ** 4 / 4, df: (x) => 2 * x * (x * x + 1) ** 3 },
  "sin3x-over-3": { label: "y = (sin 3x)/3", f: (x) => sin(3 * x) / 3, df: (x) => cos(3 * x), F: (x) => -cos(3 * x) / 9 },
  "two-x-exp-x2": { label: "y = 2x e^(x²)", f: (x) => 2 * x * exp(x * x), df: (x) => (2 + 4 * x * x) * exp(x * x), F: (x) => exp(x * x) },
  "rho-exp": { label: "y = x e^(−x²)", f: (x) => x * exp(-x * x), df: (x) => (1 - 2 * x * x) * exp(-x * x), F: (x) => -0.5 * exp(-x * x) },
  "ex-sub-basic": { label: "y = (x³ + 2)⁵/5", f: (x) => (x ** 3 + 2) ** 5 / 5, df: (x) => 3 * x * x * (x ** 3 + 2) ** 4 },
  "sin-cos": { label: "y = sin x cos x", f: (x) => sin(x) * cos(x), df: (x) => cos(2 * x), F: (x) => sin(x) ** 2 / 2 },
  ring: { label: "y = x/(x² + 1)^(3/2)", f: (x) => x / (x * x + 1) ** 1.5, df: (x) => (1 - 2 * x * x) / (x * x + 1) ** 2.5, F: (x) => -1 / sqrt(x * x + 1) },
  "x-exp": { label: "y = x eˣ", f: (x) => x * exp(x), df: (x) => (x + 1) * exp(x), F: (x) => (x - 1) * exp(x) },
  "x-minus-1-exp": { label: "y = (x − 1)eˣ", f: (x) => (x - 1) * exp(x), df: (x) => x * exp(x), F: (x) => (x - 2) * exp(x) },
  "x-sin": { label: "y = x sin x", f: (x) => x * sin(x), df: (x) => sin(x) + x * cos(x), F: (x) => sin(x) - x * cos(x) },
  "x-sin-plus-cos": { label: "y = x sin x + cos x", f: (x) => x * sin(x) + cos(x), df: (x) => x * cos(x) },
  "x-exp-neg": { label: "y = x e^(−x)", f: (x) => x * exp(-x), df: (x) => (1 - x) * exp(-x), F: (x) => -(x + 1) * exp(-x) },
  "x-ln-x-minus-x": { label: "y = x ln x − x", f: (x) => x * log(x) - x, df: (x) => log(x) },
  sin2: { label: "y = sin²x", f: (x) => sin(x) ** 2, df: (x) => sin(2 * x), F: (x) => x / 2 - sin(2 * x) / 4 },
  cos2: { label: "y = cos²x", f: (x) => cos(x) ** 2, df: (x) => -sin(2 * x), F: (x) => x / 2 + sin(2 * x) / 4 },
  "x-plus-ln-x": { label: "y = x + ln x", f: (x) => x + log(x), df: (x) => 1 + 1 / x },
  "expand-ex": { label: "y = x⁵/5 + 2x³/3 + x", f: (x) => x ** 5 / 5 + (2 * x ** 3) / 3 + x, df: (x) => (x * x + 1) ** 2 },
};

/** Values within 1e-12 of zero are zero: exact cancellations (∫ sin over a period) must read 0. */
const snap = (v: number) => (Math.abs(v) < 1e-12 ? 0 : v);

/** Signed area ∫ₐᵇ f dx: exact through F when the function has one, otherwise 8 panels of 16-point Gauss–Legendre. */
export function areaUnder(fn: Fn1, a: number, b: number): number {
  if (fn.F) return snap(fn.F(b) - fn.F(a));
  const { nodes, weights } = gaussLegendre(16);
  const panels = 8, h = (b - a) / panels;
  let sum = 0;
  for (let p = 0; p < panels; p++) {
    const mid = a + (p + 0.5) * h;
    for (let i = 0; i < 16; i++) sum += weights[i]! * fn.f(mid + (h / 2) * nodes[i]!);
  }
  return snap((sum * h) / 2);
}

/** Midpoint Riemann sum with n strips. */
export function midpointSum(fn: Fn1, a: number, b: number, n: number): number {
  const w = (b - a) / n;
  let sum = 0;
  for (let k = 0; k < n; k++) sum += fn.f(a + (k + 0.5) * w);
  return snap(sum * w);
}
```

- [ ] **Step 2: Export it.** Append `export * from "./maths";` to `app/packages/physics/src/index.ts`.
- [ ] **Step 3: Checks.** Run `pnpm typecheck` and `pnpm test` from `app/`. Expected: PASS (nothing uses it yet).
- [ ] **Step 4: Commit** with the message `feat(physics): exact single-variable functions, areas and midpoint sums for Maths Foundations`.

---

### Task 2: The `graph-1d` plate component and its view

**Files:**
- Modify: `app/packages/plate/src/components/math.ts`: add `Graph1D`, and add it to `mathComponents`.
- Modify: `app/apps/web/components/plate/viewsMath.tsx`: add `Graph1DView`.
- Modify: `app/apps/web/components/plate/views2d.tsx`: import and register `"graph-1d": Graph1DView`.
- Modify: `app/apps/web/components/plate/Readouts.tsx`: add labels.

**Consumes:** `functions1d`, `areaUnder`, `midpointSum` (Task 1).
**Produces:** component `graph-1d`.
- **Params:**

  | Param | Type | Default |
  |---|---|---|
  | `fn` | `string` | required |
  | `x` | `[number, number]` | required |
  | `y` | `[number, number]` | required |
  | `probe` | `number \| null` | `null` |
  | `tangent` | `boolean` | `false` |
  | `area` | `[number, number] \| null` | `null` |
  | `rects` | `number` | `0` |
  | `label` | `string` | `""` |

- **Readouts:** `gx`, `gfx`, `gslope` (when `probe` is set), `garea` (when `area` is set) and `gsum` (when `rects ≥ 1`). All are unitless.

- [ ] **Step 1: The component.** In `math.ts`:
  - Add `functions1d, areaUnder, midpointSum` to the existing `@forma/physics` import.
  - Add the code below before `export const C0`.
  - Change the last line to `export const mathComponents = [ScalarSlice, VectorSlice, CoordRegion, Spectrum, UnitConvert, LineWork, Conductor, Graph1D];`.

```ts
const Fn1Id = z.enum(Object.keys(functions1d) as [string, ...string[]]);
const Window = z.tuple([z.number(), z.number()]).refine(([a, b]) => b > a, "window must increase");

/**
 * A function on axes: a probe point with its value and slope (the tangent), and a shaded signed area from a to b
 * with optional midpoint rectangles. `rects` is rounded, so it can tween through fractions between steps.
 */
export const Graph1D = defineComponent({
  id: "graph-1d",
  params: z.object({
    fn: Fn1Id,
    x: Window,
    y: Window,
    probe: z.number().nullable().default(null),
    tangent: z.boolean().default(false),
    area: z.tuple([z.number(), z.number()]).nullable().default(null),
    rects: z.number().min(0).max(64).default(0),
    label: z.string().default(""),
  }),
  model: (p) => {
    const fn = functions1d[p.fn]!;
    const out: Record<string, number | null> = {};
    if (p.probe !== null) {
      out.gx = p.probe;
      out.gfx = finite(fn.f(p.probe));
      out.gslope = finite(fn.df(p.probe));
    }
    if (p.area !== null) {
      out.garea = finite(areaUnder(fn, p.area[0], p.area[1]));
      const n = Math.round(p.rects);
      if (n >= 1) out.gsum = finite(midpointSum(fn, p.area[0], p.area[1], n));
    }
    return out;
  },
  handles: [],
  readouts: { gx: "", gfx: "", gslope: "", garea: "", gsum: "" },
  quotable: { gx: "", gfx: "", gslope: "", garea: "", gsum: "" },
});
```

- [ ] **Step 2: The view.** In `viewsMath.tsx`:
  - Add `functions1d` to the `@forma/physics` import.
  - Add `PX` if it is not already imported from `@forma/plate`.
  - Append the code below.

```tsx
const GX0 = -2.4, GX1 = 2.4, GY0 = -1.7, GY1 = 1.7;

/** graph-1d: the curve, an optional shaded area with midpoint rectangles, and a probe with its tangent. */
export function Graph1DView({ id, ev }: ViewProps) {
  const p = ev.params as { fn: string; x: [number, number]; y: [number, number]; probe: number | null; tangent: boolean; area: [number, number] | null; rects: number; label: string };
  const fn = functions1d[p.fn]!;
  const [x0, x1] = p.x, [y0, y1] = p.y;
  const sx = (x: number) => (GX0 + ((x - x0) / (x1 - x0)) * (GX1 - GX0)) * PX;
  const sy = (y: number) => -(GY0 + ((y - y0) / (y1 - y0)) * (GY1 - GY0)) * PX;
  const span = y1 - y0;
  const ok = (y: number) => Number.isFinite(y) && y > y0 - 4 * span && y < y1 + 4 * span;
  const curve: string[] = [];
  let run = "";
  for (let i = 0; i <= 320; i++) {
    const x = x0 + ((x1 - x0) * i) / 320, y = fn.f(x);
    if (!ok(y)) { if (run) curve.push(run); run = ""; continue; }
    run += `${run ? "L" : "M"}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
  }
  if (run) curve.push(run);
  const clip = `graph-clip-${id}`;
  const area = p.area ? (() => {
    const [a, b] = p.area!;
    let d = `M${sx(a).toFixed(1)} ${sy(0).toFixed(1)}`;
    for (let i = 0; i <= 160; i++) { const x = a + ((b - a) * i) / 160, y = fn.f(x); if (ok(y)) d += `L${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`; }
    return `${d}L${sx(b).toFixed(1)} ${sy(0).toFixed(1)}Z`;
  })() : null;
  const n = p.area ? Math.round(p.rects) : 0;
  const w = p.area && n >= 1 ? (p.area[1] - p.area[0]) / n : 0;
  const slope = p.probe !== null ? fn.df(p.probe) : NaN, fy = p.probe !== null ? fn.f(p.probe) : NaN, dx = (x1 - x0) * 0.18;
  return (
    <g role="img" aria-label={`Graph of ${p.label || p.fn}`}>
      <defs><clipPath id={clip}><rect x={GX0 * PX} y={-GY1 * PX} width={(GX1 - GX0) * PX} height={(GY1 - GY0) * PX} /></clipPath></defs>
      <rect x={GX0 * PX} y={-GY1 * PX} width={(GX1 - GX0) * PX} height={(GY1 - GY0) * PX} fill="none" style={{ stroke: "var(--grid)" }} />
      <g clipPath={`url(#${clip})`}>
        {x0 < 0 && x1 > 0 && <line x1={sx(0)} x2={sx(0)} y1={-GY1 * PX} y2={-GY0 * PX} style={{ stroke: "var(--graphite)" }} strokeWidth={1} />}
        {y0 < 0 && y1 > 0 && <line x1={GX0 * PX} x2={GX1 * PX} y1={sy(0)} y2={sy(0)} style={{ stroke: "var(--graphite)" }} strokeWidth={1} />}
        {area && <path d={area} style={{ fill: "var(--surface)" }} fillOpacity={0.22} />}
        {Array.from({ length: n }, (_, k) => {
          const a = p.area![0] + k * w, h = fn.f(a + w / 2);
          return <rect key={k} x={Math.min(sx(a), sx(a + w))} width={Math.abs(sx(a + w) - sx(a))} y={Math.min(sy(0), sy(h))} height={Math.abs(sy(h) - sy(0))} fill="none" style={{ stroke: "var(--surface)" }} strokeWidth={1.2} />;
        })}
        {curve.map((d, i) => <path key={i} d={d} fill="none" style={{ stroke: "var(--flux)" }} strokeWidth={2.4} />)}
        {p.probe !== null && p.tangent && Number.isFinite(slope) && (
          <line x1={sx(p.probe - dx)} y1={sy(fy - slope * dx)} x2={sx(p.probe + dx)} y2={sy(fy + slope * dx)} style={{ stroke: "var(--charge)" }} strokeWidth={1.6} strokeDasharray="6 4" />
        )}
        {p.probe !== null && Number.isFinite(fy) && <circle cx={sx(p.probe)} cy={sy(fy)} r={4.5} className="fill-charge" />}
      </g>
      {p.label && <text x={GX0 * PX + 8} y={-GY1 * PX + 16} className="plate-label">{p.label}</text>}
      <text x={GX0 * PX} y={-GY0 * PX + 14} className="plate-label">{x0}</text>
      <text x={GX1 * PX - 24} y={-GY0 * PX + 14} className="plate-label">{x1}</text>
      <text x={GX0 * PX - 30} y={-GY0 * PX} className="plate-label">{y0}</text>
      <text x={GX0 * PX - 30} y={-GY1 * PX + 10} className="plate-label">{y1}</text>
    </g>
  );
}
```

- [ ] **Step 3: Register the view.**
  - In `views2d.tsx`, add `Graph1DView` to the `./viewsMath` import.
  - Add `"graph-1d": Graph1DView,` to the `views2d` map, next to `"scalar-slice"`.
- [ ] **Step 4: Labels.** In `Readouts.tsx`, add these to the `LABEL` object:

```ts
  gx: "x at the probe", gfx: "Value at the probe", gslope: "Slope at the probe", garea: "Signed area, a to b", gsum: "Midpoint rectangle sum",
```

- [ ] **Step 5: Checks.** Run `pnpm typecheck`, `pnpm test`, and the web `tsc`. Expected: PASS.
- [ ] **Step 6: Commit** with the message `feat(plate): graph-1d component (value, slope, tangent, signed area, midpoint rectangles) and its view`.

---

### Task 3: The foundations course (empty) and the assertions that must see it

**Files:**
- Create: `app/packages/course-em1/src/foundations/index.ts`
- Modify: `app/packages/course-em1/src/index.ts` (export it)
- Modify three existing assertions; there are no new tests:
  - `app/packages/course-em1/test/ideas.test.ts:12`
  - `app/packages/course-em1/test/plates.test.ts:16` and `:22`
  - `app/packages/course-em1/test/course.test.ts:44`

**Produces:** `foundations: Course` (id `math0`). It has no concepts until N2.

- [ ] **Step 1: Create `src/foundations/index.ts`.**

```ts
import { Course } from "@forma/engine";
import { EXAM_DATE } from "../assessments";

/** Units and concepts of Maths Foundations; plans N2–N6 add theirs here. Course.parse validates them below. */
const foundationUnits: { number: number; title: string }[] = [];
const foundationConcepts: unknown[] = [];

/**
 * Maths Foundations for Engineering: the prerequisite course the readiness check recommends from. It shares EMag's
 * exam date so the scheduler spaces its reviews before the finals; it has no assessments of its own.
 */
export const foundations = Course.parse({
  id: "math0",
  code: "MATHS",
  title: "Maths Foundations for Engineering",
  examDate: EXAM_DATE,
  assessments: [],
  units: foundationUnits,
  concepts: foundationConcepts,
});
```

- [ ] **Step 2: Export it.** In `src/index.ts`, after `export { diagnostic } from "./diagnostic";`, add `export { foundations } from "./foundations";`.
- [ ] **Step 3: The three assertions.** These edits are allowed because this change breaks them. Log each one in the ledger as `Task 3: assertion edit: <file:line> — <why>`.
  1. **`ideas.test.ts`.**
     - Add `foundations` to the `../src` import.
     - Replace line 12 with:

       `expect([course, foundations].some((k) => k.concepts.some((x) => x.lessons.some((l) => l.blocks.some((b) => b.type === "plate" && b.plateId === c.plate.id))))).toBe(true);`

     - **Why:** foundation idea plates are reached from foundation concepts.
  2. **`plates.test.ts`.**
     - Add `foundations` to the import.
     - In both tests at lines 16 and 22, replace `for (const c of course.concepts)` with `for (const c of [...course.concepts, ...foundations.concepts])`.
     - **Why:** foundation lessons must reference existing plates too.
  3. **`course.test.ts`.**
     - Add `foundations` to the import.
     - Replace line 44 with:

       `const ids = new Set([...course.concepts, ...foundations.concepts].map((c) => c.id));`

     - **Why:** readiness-check refreshers may point at foundation concepts. The bank-item loop below still only meets EMag ids, which stays true.
- [ ] **Step 4: Checks.** Run `pnpm test` and `pnpm typecheck`. Expected: PASS, with the same test count as before.
- [ ] **Step 5: Commit** with the message `feat(course): Maths Foundations course shell (math0), exported beside EMag`.

---

### Task 4: The web app knows both courses

**Files:**
- Modify: `app/apps/web/lib/course.ts`
- Modify: `app/apps/web/app/c/[course]/layout.tsx`
- Modify: `app/apps/web/app/c/[course]/[concept]/page.tsx`
- Modify: `app/apps/web/app/c/[course]/[concept]/sheet/page.tsx`
- Modify: `app/apps/web/app/c/[course]/page.tsx`
- Modify: `app/apps/web/app/courses/page.tsx`
- Modify: `app/apps/web/components/workspace/ConceptWorkspace.tsx`
- Modify: `app/apps/web/components/plate/PlatePlayer.tsx`
- Modify: `app/apps/web/components/shell/AppShell.tsx`

**Produces:**
- `courses: Course[]`, with foundations first;
- `getCourse(id)`, `courseOf(conceptId)` and `foundationsOrder: string[]`;
- `conceptById` covering both courses;
- `conceptHref` pointing at the concept's own course.

- [ ] **Step 1: `lib/course.ts`.**
  - Change the first two lines and the exports to:

```ts
import { assessmentsForItem, course, diagnostic, formulaSheet, foundations, ideaPlates, questionBank } from "@forma/course-em1";
import { topoOrder, type Concept, type Course, type Lesson } from "@forma/engine";

export { assessmentsForItem, course, diagnostic, formulaSheet, foundations, questionBank };
export { templatesFor } from "@forma/course-em1";

/** Every course, prerequisite first. `course` stays the EMag course the Desk, map and assessments are built around. */
export const courses: Course[] = [foundations, course];
export const getCourse = (id: string): Course | undefined => courses.find((k) => k.id === id);
/** The course a concept belongs to (EMag when unknown). */
export const courseOf = (conceptId: string): Course => courses.find((k) => k.concepts.some((c) => c.id === conceptId)) ?? course;

export const conceptById = new Map(courses.flatMap((k) => k.concepts).map((c) => [c.id, c]));
```

  - Keep `examDateMs` and `conceptOrder` exactly as they are: they are EMag's.
  - After `conceptOrder`, add:

```ts
/** Foundation concepts in prerequisite order. */
export const foundationsOrder = topoOrder(foundations);
```

  - Change `conceptHref` to use the concept's course:

```ts
export const conceptHref = (conceptId: string, mode = "learn", query: Record<string, string> = {}) =>
  `/c/${courseOf(conceptId).id}/${encodeURIComponent(conceptId)}?${new URLSearchParams({ mode, ...query }).toString()}`;
```

  - Make `nextConcept` follow the concept's own course, so finishing a foundation lesson leads to the next foundation lesson, not into EMag:

```ts
export function nextConcept(conceptId: string): Concept | undefined {
  const order = courseOf(conceptId).id === course.id ? conceptOrder : foundationsOrder;
  const i = order.indexOf(conceptId);
  return order
    .slice(i + 1)
    .map((id) => conceptById.get(id)!)
    .find((c) => !c.locked);
}
```

    `foundationsOrder` is declared above it, after `conceptOrder`.
  - In `isDetour`, replace `course.concepts.some(` with `courses.some((k) => k.concepts.some(`, and close the extra parenthesis.
  - In `misconceptionInfo`, replace `course.concepts.flatMap(` with `courses.flatMap((k) => k.concepts).flatMap(`.

- [ ] **Step 2: Static params for both courses.**
  - In `app/c/[course]/layout.tsx`, `generateStaticParams` returns `[{ course: "em1" }, { course: "math0" }]`.
  - In both `[concept]/page.tsx` and `[concept]/sheet/page.tsx`:
    - replace `import { course } from "@forma/course-em1";` with `import { courses } from "@/lib/course";`;
    - make `generateStaticParams` return:

```ts
  return courses.flatMap((k) => k.concepts.filter((c) => !c.locked).map((c) => ({ course: k.id, concept: c.id })));
```

- [ ] **Step 3: The course page reads its course from the route.** In `app/c/[course]/page.tsx`:
  - Import `useParams` from `next/navigation`.
  - Import `getCourse` beside `conceptHref` and `course`.
  - At the top of the component, add:

```tsx
  const { course: courseId } = useParams<{ course: string }>();
  const k = getCourse(courseId) ?? course;
```

  - Then replace every `course.` in the JSX with `k.`.
  - Render `<ConceptMap height={420} />` only when `k.id === course.id`. The map is EMag's.

- [ ] **Step 4: `/courses` lists both courses.** Replace the single `<Link>` in `app/courses/page.tsx` with:
  - Import `courses` and `course` from `@/lib/course`.

```tsx
      {courses.filter((k) => k.concepts.some((c) => !c.locked)).map((k) => (
        <Link key={k.id} href={`/c/${k.id}`} className="card block space-y-1 hover:bg-sunken">
          <p className="label">{k.id === course.id ? k.code : `Prerequisite · ${k.code}`}</p>
          <h2 className="text-2xl">{k.title}</h2>
          <p className="text-soft">
            {k.concepts.filter((c) => !c.locked).length} concepts open
            {k.id === course.id ? ` · finals ${k.examDate}` : " · the maths Electromagnetics leans on"}
          </p>
        </Link>
      ))}
```

- [ ] **Step 5: Concept pages name their course.**
  - In `ConceptWorkspace.tsx`:
    - import `courseOf` beside `course`;
    - change the kicker to `Unit {concept.unit} · {courseOf(concept.id).title}`;
    - leave the "isn't open yet" link as it is.
  - In `PlatePlayer.tsx`:
    - remove `course` from the `@forma/course-em1` import;
    - import `courseOf` from `@/lib/course`;
    - make the revision-sheet link `` `/c/${courseOf(conceptId).id}/${encodeURIComponent(conceptId)}/sheet` ``.
  - In `AppShell.tsx`:
    - import `getCourse`;
    - in the crumbs, replace `{ label: course.title,` with `{ label: (getCourse(courseId ?? "") ?? course).title,`.

- [ ] **Step 6: Checks.** Run `pnpm test`, `pnpm typecheck`, the web `tsc` and `pnpm build`. Expected: PASS. `/c/math0` builds with no concept pages yet.
- [ ] **Step 7: Commit** with the message `feat(web): course registry; concept links, routes and crumbs follow the concept's course`.

---

### Task 5: Desk card: "Before Electromagnetics"

**Files:** Modify `app/apps/web/components/screens/DeskScreen.tsx`.

- [ ] **Step 1: The card.**
  - Imports:
    - add `useEffect` and `useState` from `react`;
    - `getConcept` and `conceptHref` are already imported.
  - Inside `DeskScreen`, after `const returning = …`, add:

```tsx
  const SKIP_KEY = "forma:skip-foundations";
  const [skipped, setSkipped] = useState(false);
  useEffect(() => { try { setSkipped(localStorage.getItem(SKIP_KEY) === "1"); } catch { /* private mode: the card shows */ } }, []);
  // Foundation lessons the readiness check put on the route and that aren't demonstrated yet. Recommend only; nothing locks.
  const foundationsDue = (learner.diagnostic?.route ?? []).filter((id) => {
    if (!id.startsWith("m0.") || !getConcept(id)) return false;
    const s = conceptProgress(learner, id).state;
    return s !== "DEMONSTRATED" && s !== "MASTERED";
  });
```

  - Render this section directly after the `returning` section, before the `desk-continue` section:

```tsx
      {!skipped && foundationsDue.length > 0 && (
        <section className="card space-y-2 desk-wide" aria-labelledby="foundations-title">
          <p className="kicker">Maths first</p>
          <h2 id="foundations-title" className="text-xl">Before Electromagnetics: {foundationsDue.length} foundation lesson{foundationsDue.length === 1 ? "" : "s"}</h2>
          <p className="text-soft">Your readiness check found maths that Electromagnetics leans on. Each lesson is short. You can skip them and come back any time from Learn.</p>
          <ol className="desk-route-list">
            {foundationsDue.map((id) => <li key={id}><Link href={conceptHref(id, "learn")}>{getConcept(id)!.title}</Link></li>)}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Link className="btn btn-primary" href={conceptHref(foundationsDue[0]!, "learn")}>Start →</Link>
            <button className="btn" onClick={() => { try { localStorage.setItem(SKIP_KEY, "1"); } catch { /* session only */ } setSkipped(true); }}>Skip for now</button>
          </div>
        </section>
      )}
```

- [ ] **Step 2: Checks.**
  - Run `pnpm test`, `pnpm typecheck`, the web `tsc`, `pnpm build` and `pnpm e2e`. Expected: PASS, 47/47, with visual baselines unchanged. The card can't show yet, because no `m0.*` concepts exist.
- [ ] **Step 3: Commit** with the message `feat(desk): recommend foundation lessons from the readiness check, with skip`.

---

### Task 6: Definition of done

- [ ] `pnpm test`, `pnpm typecheck`, the web `tsc`, `pnpm build` and `pnpm e2e` all pass.
- [ ] The ledger has a line for every task, every assertion edit and every `Ruling:`.
- [ ] Stop and report. N2 follows, and its last task walks the whole flow in the browser.
