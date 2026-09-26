# Forma Plan F1: Codex Brief, Assessments, Question Bank, and 3D Vector Plates

> **For agentic workers (Codex):** Read `AGENTS.md` at the repo root first. Execute this plan task by task, in order. Every step has an exact command and an `Expected:` line. Compare real output against it. Steps use checkbox (`- [ ]`) syntax. Do not skip the failing-test steps. Do not edit tests to make them pass unless a step says to.

**Goal:**
- Give Codex a standing brief.
- Make the app aware of ICT 1, ICT 2 and finals: countdown, review timing, per-assessment readiness, and filtering.
- Replace the two-item past-paper list with a question bank. It holds every in-scope question from the 2023-24 mid-semester test, ICT 2 2024-25, HW01–HW04, and Finals 2024-25.
- Add a 3D plate toolkit (oblique projection, axes, vectors, a coordinate frame) for the vectors content in Plan F2.

**Architecture:**
- **Assessments.** Course data gains `assessments`. The engine gets pure helpers (`nextAssessment`, `daysUntil`). The web app reads them for the countdown, the scheduler and Revise.
- **Question bank.** `packages/course-em1/src/questions.ts` holds typed bank items, keyed to catalog ids from `docs/superpowers/resources/emag-catalog.md`. It replaces `pastPapers`.
- **3D plates.** Plates stay 2D SVG. 3D content uses a cabinet-oblique projection in the textbook orientation (x toward the viewer, drawn down-left; y right; z up). New components live in `packages/plate/src/components/vec.ts` and are added to `emComponents`. Coordinate maths lives in `@forma/physics`.

**Tech stack:** TypeScript 7, pnpm 11, Vitest 5, Zod 4, Next.js 16 / React 19, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-09-26-forma-emag-electrostatics-assessments-design.md` (§1, §2, §4). Resources: `docs/superpowers/resources/emag-catalog.md`.

**Ledger:** `.superpowers/sdd/2026-09-27-forma-plan-f1-assessments-bank-3d/progress.md`. Create it with its first line `# SDD ledger — plan: docs/superpowers/plans/2026-09-27-forma-plan-f1-assessments-bank-3d.md`.

## Global Constraints

- Run commands from `F:\StudyBuddy\app` unless stated otherwise. The shell is Git Bash on Windows.
- Test commands:
  - `pnpm test` runs all unit tests.
  - `pnpm typecheck` checks the packages.
  - `cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json` checks the web app.
  - `cd apps/web && pnpm build` builds the web app.
  - `cd apps/web && pnpm e2e` runs Playwright; the build must be run first.
- Assessment dates:

  | id | Date | Notes |
  |---|---|---|
  | `ict1` | 2026-10-12 | Group A's sitting (the user is in Group A); the date is posted but not yet final, so keep it in the one place it lives (`course-em1/src/assessments.ts`) |
  | `ict2` | 2026-11-16 | |
  | `finals` | 2026-12-15 | equals `course.examDate` |

  - Times are 09:00 Jamaica time (UTC−5, no DST).
  - An assessment counts as "next" until the end of its day.
- Weights (% of the module): `ict1` 15, `ict2` 15, `finals` 60. The outline gives semester tests 30% in total; the 15/15 split is an assumption.
- Every question-bank item cites a catalog id in `source`.
- **Item text rule:** item text is a faithful short statement of the question: the data and what is asked. When a value is unclear in the source, the text says "(see source)" rather than guessing.
- **Brand:** colours only through CSS tokens (`var(--flux)` and the rest), never hex. Plate labels use the `plate-label` class. No new fonts.
- Commit after each task. Commit messages end with a blank line, then `Co-Authored-By: Codex <noreply@openai.com>`.

## Review Focus

1. **Countdown at a boundary.** On 2026-10-12 at 23:00 Jamaica time the Desk still says "ICT 1 today". At 2026-10-13 00:01 it says "ICT 2 in 34 days". Tested in Task 3.
2. **Scheduler compression by scope.** A Unit 2 concept's review interval compresses toward ICT 1 (within 21 days). A Unit 4 concept's compresses toward ICT 2 or finals, never ICT 1. Tested in Task 5.
3. **Question bank safety.** Every item's concepts exist, the weights sum to 1, and the `source` is a catalog id. An item whose weakest concept is locked renders without a crash and without a "Strengthen" link to a missing lesson. Tested in Tasks 4 and 6.
4. **Oblique projection round trip.** For any screen point and a fixed x, `fromSvg3(toSvg3(p), p.x)` returns `p`, so dragging the coord-frame point stays exact. Tested in Task 7.
5. **Coordinate conversions.** Tutorial P(1, 3, 5) gives ρ = 3.1623, φ = 71.565°, r = 5.9161, θ = 32.312°. A second-quadrant point gives φ = 135°, not −45°. Tested in Task 2.

---

## File Structure

```
AGENTS.md                                                 NEW  Codex standing brief
app/packages/physics/src/coords.ts                        NEW  cart ↔ cyl ↔ sph, unit vectors
app/packages/engine/src/schema/course.ts                  MOD  Assessment schema, Course.assessments
app/packages/engine/src/assessments.ts                    NEW  nextAssessment, daysUntil, assessmentTime
app/packages/engine/src/quantities.ts                     MOD  degrees unit
app/packages/course-em1/src/assessments.ts                NEW  EMag assessments
app/packages/course-em1/src/questions.ts                  NEW  question bank
app/packages/course-em1/src/concepts/electrostatics.ts    MOD  locked placeholders
app/packages/course-em1/src/index.ts, reference.ts        MOD  Unit 1, bank export, pastPapers removed
app/packages/plate/src/geometry2d.ts                      MOD  toSvg3 / fromSvg3
app/packages/plate/src/components/vec.ts                  NEW  axes3, vector3, coord-frame
app/apps/web/lib/assessments.ts                           NEW  countdown, readiness, dates per concept
app/apps/web/lib/store.ts                                 MOD  scheduler date per concept
app/apps/web/components/screens/DeskScreen.tsx            MOD  countdown + readiness
app/apps/web/components/workspace/ReviseMode.tsx          MOD  countdown + filter
app/apps/web/app/past-papers/page.tsx                     MOD  question bank page
app/apps/web/app/dashboard/page.tsx                       MOD  bank rename
app/apps/web/components/plate/views3d.tsx                 NEW  3D views
app/apps/web/components/plate/{views2d,Readouts}.tsx      MOD  register 3D views, labels
```

---

### Task 1: The Codex brief (`AGENTS.md`)

**Files:** `AGENTS.md` at the repo root **already exists**: Claude committed it before handoff so Codex could read it first. This task only checks it.

- [ ] **Step 1: Check `AGENTS.md`.** It must match the text below exactly. If it differs, restore this text. If it matches, skip Step 2 and log `Task 1: complete (already present)`.

````markdown
# AGENTS.md — Forma (StudyBuddy)

Forma is a study app with exact physics, living "plates" (animated, interactive diagrams), and deep teaching. EMag (UTech ELE3001) is the first course. Claude writes the plans; you (Codex) implement them.

## Where things are
- `app/` — pnpm monorepo. Packages:
  - `@forma/physics` — exact field maths
  - `@forma/engine` — course schema, learner state, scheduler, templates
  - `@forma/plate` — plate components, timeline, lints, idea lessons
  - `@forma/ui` — primitives, tokens
  - `@forma/course-em1` — EMag content
  - `apps/web` — Next.js 16 app
- `docs/superpowers/specs/` — design specs (the authority)
- `docs/superpowers/plans/` — implementation plans (what you execute)
- `docs/superpowers/resources/emag-catalog.md` — every course source by id
- `Resources/Electromagnetics/` — the source PDFs (restricted; private study use only)

## Commands (run from `app/`)
- `pnpm test` — all unit tests (Vitest). Must pass after every task.
- `pnpm typecheck` — packages.
- `cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json` — web types.
- `cd apps/web && pnpm build` — must pass before e2e.
- `cd apps/web && pnpm e2e` — Playwright + axe. Visual baselines live in `apps/web/e2e/*-snapshots/`.

## How to execute a plan
1. Read the whole plan, its spec, and this file.
2. Create the ledger the plan names (`.superpowers/sdd/<plan>/progress.md`).
3. For each task, in order:
   1. write the failing test;
   2. run it and see it fail for the stated reason;
   3. implement;
   4. run it and see it pass;
   5. run the task's full test command;
   6. commit.
4. After each task, append to the ledger:
   `Task N: complete (commits <base7>..<head7>, tests: <command> → <result>)`.
5. When output differs from a step's `Expected:` line, do not improvise:
   - **The code is wrong:** fix the code.
   - **The plan is wrong:** make the smallest change that satisfies the spec, and log it as
     `Task N: Ruling: <what was wrong> — <what you did> — <cost if wrong>`.
6. When done, stop and report. Claude reviews the branch before anything merges.

## Content rules (course content is the product)
- Never invent teaching text, numbers, or physics. Plans give every explanation, worked example, ask, check and recap word for word. Transcribe exactly.
- Every unit-bearing number in teaching text must be backed by one of:
  - a visible readout,
  - a declared quotable value,
  - a visible param (metres),
  - a claim,
  - a step `given`.

  The lint (`validatePlate`, `validateIdeas`) enforces this.
- If a claim or the number lint fails, the message prints the model value.
  - Fix the text **and** the claim together, keeping the text's precision.
  - Never add a `given` for a value the plate could show.
  - Log a `Ruling:` line.
- Word budget: explanation steps ≤ 180 words, asks ≤ 80 words.
- Item and question ids follow `docs/superpowers/resources/emag-catalog.md`.

## Never
- Commit with `--no-verify`, skip hooks, or force-push.
- Weaken, skip, or delete a test to make it pass (unless the plan says to change that test).
- Add a dependency the plan doesn't name.
- Use hex colours in components or CSS. Use tokens (`var(--flux)`, `var(--charge)`, `var(--surface)`, `var(--field)`, `var(--graphite)`, `var(--ink)`).
- Publish, push, or merge. Pushing is the user's call.

## Brand in one paragraph
Forma: "Shape how you understand." The visual direction is a drafting table: paper and graphite, hatch patterns, and semantic colours (charge, field, flux, surface). The type and palette are already set in `@forma/ui` (`themeCss`, `forma.css`). The voice is plain, exact and warm: short sentences, no hype, no emoji in the UI.

## Definition of done (per plan)
- All of these pass:
  - `pnpm test`
  - `pnpm typecheck`
  - the web `tsc`
  - `pnpm build`
  - `pnpm e2e`
- Every task has a ledger line, and every deviation has a `Ruling:` line.
````

- [ ] **Step 2: Commit**

```bash
cd /f/StudyBuddy && git add AGENTS.md && git commit -m "docs: AGENTS.md, the Codex brief

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: Coordinate systems in `@forma/physics`

**Files:**
- Create: `app/packages/physics/src/coords.ts`, `app/packages/physics/test/coords.test.ts`
- Modify: `app/packages/physics/src/index.ts`

**Interfaces:**
- Produces: `toCyl(p) → { rho, phi, z }`, `toSph(p) → { r, theta, phi }`, `fromCyl(rho, phi, z)`, `fromSph(r, theta, phi)`, `unitVectors(p, system)`, `componentsIn(v, p, system)`.
  - Angles are in radians.
  - φ is in [0, 2π) and θ in [0, π].
  - `system` is `"cart" | "cyl" | "sph"`.
  - `unitVectors` returns three `Vec3`s in the order the system names them: `[ax, ay, az]`, `[aρ, aφ, az]` or `[ar, aθ, aφ]`.
  - `componentsIn` returns the vector's three components along those unit vectors.

- [ ] **Step 1: Write the failing test** at `app/packages/physics/test/coords.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { componentsIn, fromCyl, fromSph, toCyl, toSph, unitVectors } from "../src";

const deg = (r: number) => (r * 180) / Math.PI;

describe("coordinate systems", () => {
  it("tutorial P(1, 3, 5) in cylindrical and spherical", () => {
    const c = toCyl([1, 3, 5]);
    expect(c.rho).toBeCloseTo(3.16228, 5);
    expect(deg(c.phi)).toBeCloseTo(71.56505, 4);
    expect(c.z).toBe(5);
    const s = toSph([1, 3, 5]);
    expect(s.r).toBeCloseTo(5.91608, 5);
    expect(deg(s.theta)).toBeCloseTo(32.31153, 4);
    expect(deg(s.phi)).toBeCloseTo(71.56505, 4);
  });
  it("puts φ in the right quadrant", () => {
    expect(deg(toCyl([-2, 2, 1]).phi)).toBeCloseTo(135, 10);
    expect(deg(toCyl([1, -1, 0]).phi)).toBeCloseTo(315, 10);
    expect(deg(toSph([-2, 2, 1]).theta)).toBeCloseTo(70.52878, 4);
  });
  it("converts back", () => {
    const a = fromCyl(2, (120 * Math.PI) / 180, -1);
    expect(a[0]).toBeCloseTo(-1, 12);
    expect(a[1]).toBeCloseTo(1.7320508, 7);
    expect(a[2]).toBe(-1);
    const b = fromSph(4, Math.PI / 3, Math.PI / 6);
    expect(b[0]).toBeCloseTo(3, 12);
    expect(b[1]).toBeCloseTo(1.7320508, 7);
    expect(b[2]).toBeCloseTo(2, 12);
  });
  it("unit vectors are orthonormal and right-handed", () => {
    for (const sys of ["cart", "cyl", "sph"] as const) {
      const [u, v, w] = unitVectors([1, 3, 5], sys);
      const d = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
      expect(d(u, u)).toBeCloseTo(1, 12);
      expect(d(u, v)).toBeCloseTo(0, 12);
      expect(d(v, w)).toBeCloseTo(0, 12);
      const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      expect(d(cr, w)).toBeCloseTo(1, 12);
    }
  });
  it("expresses a cartesian vector in cylindrical components at a point", () => {
    // Q = y ax + x ay at (1, 1, 0): Q = aρ·(2 sinφ cosφ) + aφ·(cos²φ − sin²φ) → (1, 0, 0) at φ = 45°
    const q = componentsIn([1, 1, 0], [1, 1, 0], "cyl");
    expect(q[0]).toBeCloseTo(Math.SQRT2, 12);
    expect(q[1]).toBeCloseTo(0, 12);
    expect(q[2]).toBeCloseTo(0, 12);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/physics/test/coords.test.ts`
Expected: FAIL (`toCyl` is not exported).

- [ ] **Step 3: Implement** `app/packages/physics/src/coords.ts`

```ts
import type { Vec3 } from "./vec";

export type CoordSystem = "cart" | "cyl" | "sph";
const TAU = 2 * Math.PI;
const wrap = (a: number) => ((a % TAU) + TAU) % TAU;

/** Cylindrical coordinates of a cartesian point. φ in [0, 2π). */
export const toCyl = (p: Vec3) => ({ rho: Math.hypot(p[0], p[1]), phi: wrap(Math.atan2(p[1], p[0])), z: p[2] });

/** Spherical coordinates of a cartesian point. θ in [0, π] from +z; φ in [0, 2π). */
export const toSph = (p: Vec3) => {
  const r = Math.hypot(p[0], p[1], p[2]);
  return { r, theta: r === 0 ? 0 : Math.acos(p[2] / r), phi: wrap(Math.atan2(p[1], p[0])) };
};

export const fromCyl = (rho: number, phi: number, z: number): Vec3 => [rho * Math.cos(phi), rho * Math.sin(phi), z];
export const fromSph = (r: number, theta: number, phi: number): Vec3 => [
  r * Math.sin(theta) * Math.cos(phi),
  r * Math.sin(theta) * Math.sin(phi),
  r * Math.cos(theta),
];

/** The system's unit vectors at p, in the order the system names them. */
export function unitVectors(p: Vec3, system: CoordSystem): [Vec3, Vec3, Vec3] {
  if (system === "cart") return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const { phi } = toCyl(p);
  const c = Math.cos(phi), s = Math.sin(phi);
  if (system === "cyl") return [[c, s, 0], [-s, c, 0], [0, 0, 1]];
  const { theta } = toSph(p);
  const ct = Math.cos(theta), st = Math.sin(theta);
  return [[st * c, st * s, ct], [ct * c, ct * s, -st], [-s, c, 0]];
}

/** A cartesian vector v expressed in the system's components at point p. */
export function componentsIn(v: Vec3, p: Vec3, system: CoordSystem): Vec3 {
  const [u1, u2, u3] = unitVectors(p, system);
  const d = (a: Vec3) => a[0] * v[0] + a[1] * v[1] + a[2] * v[2];
  return [d(u1), d(u2), d(u3)];
}
```

In `app/packages/physics/src/index.ts`, add the line `export * from "./coords";`.

- [ ] **Step 4: Run it and see it pass**

Run: `pnpm vitest run packages/physics/test/coords.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/physics && git commit -m "feat(physics): cartesian, cylindrical and spherical coordinates with unit vectors

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: Assessments in the engine

**Files:**
- Create: `app/packages/engine/src/assessments.ts`, `app/packages/engine/test/assessments.test.ts`
- Modify: `app/packages/engine/src/schema/course.ts`, `app/packages/engine/src/index.ts`, `app/packages/engine/src/quantities.ts`

**Interfaces:**
- Produces:
  - `Assessment` (a Zod schema and a type): `{ id, title, short, date, weight, scope: { concepts: string[] } }`.
  - `Course.assessments` (default `[]`).
  - `assessmentTime(a) → ms`.
  - `nextAssessment(course, now, conceptId?) → Assessment | undefined`.
  - `daysUntil(a, now) → number` (0 on the day).
  - The degree unit `°` in quantities.

- [ ] **Step 1: Write the failing test** at `app/packages/engine/test/assessments.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { assessmentTime, daysUntil, nextAssessment, parseQuantity } from "../src";

const course = {
  assessments: [
    { id: "finals", title: "Final exam", short: "Finals", date: "2026-12-15", weight: 60, scope: { concepts: ["a.x", "a.y", "a.z"] } },
    { id: "ict1", title: "In-Course Test 1", short: "ICT 1", date: "2026-10-12", weight: 15, scope: { concepts: ["a.x"] } },
    { id: "ict2", title: "In-Course Test 2", short: "ICT 2", date: "2026-11-16", weight: 15, scope: { concepts: ["a.y"] } },
  ],
};
const ja = (iso: string) => Date.parse(`${iso}-05:00`);

describe("assessments", () => {
  it("counts 09:00 Jamaica time as the sitting", () => {
    expect(assessmentTime(course.assessments[1]!)).toBe(Date.parse("2026-10-12T14:00:00Z"));
  });
  it("is next until the end of its day, then the following one takes over", () => {
    expect(nextAssessment(course, ja("2026-09-26T12:00:00"))!.id).toBe("ict1");
    expect(nextAssessment(course, ja("2026-10-12T23:00:00"))!.id).toBe("ict1");
    expect(nextAssessment(course, ja("2026-10-13T00:01:00"))!.id).toBe("ict2");
    expect(nextAssessment(course, ja("2026-12-16T00:01:00"))).toBeUndefined();
  });
  it("filters by concept scope", () => {
    expect(nextAssessment(course, ja("2026-09-26T12:00:00"), "a.y")!.id).toBe("ict2");
    expect(nextAssessment(course, ja("2026-09-26T12:00:00"), "a.z")!.id).toBe("finals");
    expect(nextAssessment(course, ja("2026-10-13T08:00:00"), "a.x")!.id).toBe("finals");
  });
  it("counts whole days, 0 on the day", () => {
    const ict1 = course.assessments[1]!;
    expect(daysUntil(ict1, ja("2026-09-26T12:00:00"))).toBe(16);
    expect(daysUntil(ict1, ja("2026-10-12T20:00:00"))).toBe(0);
    expect(daysUntil(course.assessments[2]!, ja("2026-10-13T00:01:00"))).toBe(34);
  });
  it("reads degrees as a unit", () => {
    expect(parseQuantity("71.57 °")).toEqual({ value: 71.57, dim: "°" });
  });
});
```

Check the name of the quantity parser before running: `grep -n "^export function" packages/engine/src/quantities.ts`. If it is not `parseQuantity`, use the exported name that turns `"3 µC"` into `{ value, dim }`, and log a ruling.

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/engine/test/assessments.test.ts`
Expected: FAIL (`nextAssessment` is not exported).

- [ ] **Step 3: Implement**

In `packages/engine/src/schema/course.ts`, import `Id` alongside `Source` and `Tag` from `./common` (add it if it isn't there). Then add, before `export const Course`:

```ts
export const Assessment = z.object({
  id: Id,
  title: z.string().min(1),
  short: z.string().min(1),
  date: z.iso.date(),
  weight: z.number().positive().max(100),
  scope: z.object({ concepts: z.array(ConceptId).min(1) }),
});
export type Assessment = z.infer<typeof Assessment>;
```

and in `Course` add `assessments: z.array(Assessment).default([]),` after `examDate`.

Create `packages/engine/src/assessments.ts`:

```ts
import { DAY_MS } from "./scheduler";
import type { Assessment } from "./schema/course";

const HOUR = 3_600_000;

/** A sitting starts 09:00 Jamaica time (UTC−5, no daylight saving). */
export const assessmentTime = (a: Pick<Assessment, "date">) => Date.parse(`${a.date}T09:00:00-05:00`);

/** Until the end of the sitting's day (midnight Jamaica time). */
const endOfDay = (a: Pick<Assessment, "date">) => assessmentTime(a) + 15 * HOUR;

/** The first assessment still ahead (its day not over), optionally only those whose scope has the concept. */
export function nextAssessment(course: { assessments: Assessment[] }, now: number, conceptId?: string): Assessment | undefined {
  return [...course.assessments]
    .filter((a) => !conceptId || a.scope.concepts.includes(conceptId))
    .sort((a, b) => assessmentTime(a) - assessmentTime(b))
    .find((a) => endOfDay(a) > now);
}

/** Whole days to the sitting; 0 on the day itself. */
export function daysUntil(a: Pick<Assessment, "date">, now: number): number {
  const startOfDay = assessmentTime(a) - 9 * HOUR;
  return Math.max(0, Math.ceil((startOfDay - now) / DAY_MS));
}
```

Add `export * from "./assessments";` to `packages/engine/src/index.ts`.

In `quantities.ts` `BASE`, add `"°": "°",` after `"": "1",`.

Check the day arithmetic by hand:
- 2026-09-26 12:00 to 2026-10-12 00:00 is 15.5 days, which rounds up to 16.
- 2026-10-13 00:01 to 2026-11-16 00:00 is 33.999 days, which rounds up to 34.

- [ ] **Step 4: Run it and see it pass**

Run: `pnpm vitest run packages/engine && pnpm typecheck`
Expected: PASS, and typecheck clean. `Course.parse` accepts existing data because `assessments` defaults to `[]`.

- [ ] **Step 5: Commit**

```bash
git add packages/engine && git commit -m "feat(engine): assessments (next sitting, days until, scope) and a degrees unit

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: EMag assessments, Unit 1, placeholders, and the question bank

**Files:**
- Create: `app/packages/course-em1/src/assessments.ts`, `app/packages/course-em1/src/questions.ts`, `app/packages/course-em1/test/questions.test.ts`
- Modify: `app/packages/course-em1/src/concepts/electrostatics.ts` (locked placeholders), `app/packages/course-em1/src/index.ts`, `app/packages/course-em1/src/reference.ts` (remove `pastPapers`), `app/packages/course-em1/test/course.test.ts`

**Interfaces:**
- Produces:
  - `course.assessments`.
  - Unit 1 in `course.units`.
  - Locked concepts `em1.intro.em-world` (unit 1), `em1.math.vector-calculus` (unit 2) and `em1.electrostatics.current` (unit 2).
  - `questionBank: BankItem[]`, where

    ```ts
    BankItem = { id; source; kind: "finals" | "mst" | "ict" | "hw" | "tutorial"; paper; question; marks?; text; concepts: { conceptId, weight }[]; seenIn?: string[]; practice?: string }
    ```

  - `assessmentsForItem(item) → string[]` (assessment ids whose scope covers any of its concepts).
  - `pastPapers` is removed.

- [ ] **Step 1: Write the failing test** at `app/packages/course-em1/test/questions.test.ts`

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assessmentsForItem, course, questionBank } from "../src";

const ids = new Set(course.concepts.map((c) => c.id));
const catalog = readFileSync(fileURLToPath(new URL("../../../../docs/superpowers/resources/emag-catalog.md", import.meta.url)), "utf8");

describe("question bank", () => {
  it("every item maps to real concepts with weights summing to 1, and cites a catalog id", () => {
    for (const q of questionBank) {
      expect(q.concepts.reduce((s, c) => s + c.weight, 0), q.id).toBeCloseTo(1, 10);
      for (const c of q.concepts) expect(ids.has(c.conceptId), `${q.id} → ${c.conceptId}`).toBe(true);
      expect(catalog, `${q.id} source ${q.source}`).toContain(`\`${q.source}\``);
    }
  });
  it("ids are unique", () => {
    expect(new Set(questionBank.map((q) => q.id)).size).toBe(questionBank.length);
  });
  it("holds every in-scope question from the test, ICT, homework and finals sources", () => {
    const want = [
      "mst-2324-q1a", "mst-2324-q1b", "mst-2324-q2a", "mst-2324-q2b", "mst-2324-q2c", "mst-2324-q3a", "mst-2324-q3b",
      "mst-2324-q4a", "mst-2324-q4b", "mst-2324-q4c", "mst-2324-q5a", "mst-2324-q5b",
      "f2425-q1a", "f2425-q1b", "f2425-q1c", "f2425-q2a", "f2425-q2b", "f2425-q3a", "f2425-q3b", "f2425-q4a", "f2425-q4b", "f2425-q4c",
      "f2324-q2b",
      "ict2-2425-q1", "ict2-2425-q2", "ict2-2425-q3",
      "hw-2324-2.1", "hw-2324-2.2", "hw-2324-2.3", "hw-2324-2.4", "hw-2324-2.5", "hw-2324-2.6",
      "hw03-2425-3.1a", "hw03-2425-3.1b", "hw03-2425-3.2", "hw03-2425-3.3",
      "hw04-2425-4.1", "hw04-2425-4.2", "hw04-2425-4.3",
    ];
    expect(questionBank.map((q) => q.id).sort()).toEqual([...want].sort());
  });
  it("derives assessments from concept scope: a Coulomb item is ICT 1 and finals; a wave item is finals only", () => {
    expect(assessmentsForItem(questionBank.find((q) => q.id === "mst-2324-q1b")!)).toEqual(["ict1", "finals"]);
    expect(assessmentsForItem(questionBank.find((q) => q.id === "f2425-q4c")!)).toEqual(["finals"]);
    expect(assessmentsForItem(questionBank.find((q) => q.id === "ict2-2425-q1")!)).toEqual(["ict1", "ict2", "finals"]);
  });
  it("records that HW02 2023-24 was reissued as HW01 2024-25", () => {
    expect(questionBank.find((q) => q.id === "hw-2324-2.1")!.seenIn).toEqual(["hw02-2324", "hw01-2425"]);
  });
});

describe("assessments", () => {
  it("ICT 1 covers all of units 1–2 plus Ampère; ICT 2 covers units 3–4; finals covers everything", () => {
    const a = Object.fromEntries(course.assessments.map((x) => [x.id, x]));
    const unit = (n: number) => course.concepts.filter((c) => c.unit === n).map((c) => c.id);
    expect(a.ict1!.scope.concepts).toEqual([...unit(1), ...unit(2), "em1.magnetostatics.ampere"]);
    expect(a.ict2!.scope.concepts).toEqual([...unit(3), ...unit(4)]);
    expect(a.finals!.scope.concepts).toEqual(course.concepts.map((c) => c.id));
    expect(a.finals!.date).toBe(course.examDate);
  });
});
```

(Ampère sits in ICT 1 because the outline puts it in week 6, before the test, and the test covers "aspects of Unit 3". So `ict2-2425-q1`, which maps to Ampère, is in all three.)

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/course-em1/test/questions.test.ts`
Expected: FAIL (`questionBank` is not exported).

- [ ] **Step 3: Locked placeholders.** In `concepts/electrostatics.ts`, add three entries to `lockedConcepts`, ahead of the existing ones:

```ts
  locked("em1.intro.em-world", "EM in the world, and SI units", 1),
  locked("em1.math.vector-calculus", "Gradient, divergence and curl", 2),
  locked("em1.electrostatics.current", "Current density, continuity and Ohm's law", 2),
```

- [ ] **Step 4: Assessments** in `app/packages/course-em1/src/assessments.ts`

```ts
import type { Concept } from "@forma/engine";

const EXAM = "2026-12-15";

/** ICT dates are Group A's sittings (Group B sits three days later); see the 2026-27 module outline. */
export function assessmentsFor(concepts: Pick<Concept, "id" | "unit">[]) {
  const unit = (...n: number[]) => concepts.filter((c) => n.includes(c.unit)).map((c) => c.id);
  return [
    { id: "ict1", title: "In-Course Test 1", short: "ICT 1", date: "2026-10-12", weight: 15, scope: { concepts: [...unit(1), ...unit(2), "em1.magnetostatics.ampere"] } },
    { id: "ict2", title: "In-Course Test 2", short: "ICT 2", date: "2026-11-16", weight: 15, scope: { concepts: unit(3, 4) } },
    { id: "finals", title: "Final exam", short: "Finals", date: EXAM, weight: 60, scope: { concepts: concepts.map((c) => c.id) } },
  ];
}
export const EXAM_DATE = EXAM;
```

The `ict1` scope order must match the test: unit 1, then unit 2, then Ampère. `unit(1)` and `unit(2)` are separate calls for that reason; `unit(1, 2)` would also work, because `filter` keeps the concepts' order.

In `src/index.ts`:
- Import `{ assessmentsFor, EXAM_DATE } from "./assessments"`.
- Build the list first (`const concepts = [vectors, …, ...lockedConcepts];`).
- Parse `Course` with `examDate: EXAM_DATE, units: [{ number: 1, title: "Introduction" }, …existing…], concepts, assessments: assessmentsFor(concepts)`.
- Export `{ questionBank, assessmentsForItem, type BankItem } from "./questions"`.
- Drop `pastPapers` from the `./reference` export line.

- [ ] **Step 5: The question bank** in `app/packages/course-em1/src/questions.ts`

Move the two existing items from `reference.ts` into this file (keeping their text and concepts), and delete `pastPapers` from `reference.ts`. Also remove any `F2324`/`F2425` imports there that become unused.

```ts
import { F2324, F2425 } from "./sources";

export type BankItem = {
  id: string;
  /** Catalog id in docs/superpowers/resources/emag-catalog.md. */
  source: string;
  kind: "finals" | "mst" | "ict" | "hw" | "tutorial";
  paper: string;
  question: string;
  marks?: number;
  text: string;
  concepts: { conceptId: string; weight: number }[];
  /** Catalog ids of every paper this question appeared in (the lecturer reuses homework). */
  seenIn?: string[];
  /** conceptId/lessonId to practise it, when a lesson exists. */
  practice?: string;
};

const K = {
  vec: "em1.math.vectors",
  calc: "em1.math.vector-calculus",
  surf: "em1.math.surface-integrals",
  world: "em1.intro.em-world",
  coul: "em1.electrostatics.coulomb",
  field: "em1.electrostatics.field",
  flux: "em1.electrostatics.flux-density",
  gauss: "em1.electrostatics.gauss-law",
  gapp: "em1.electrostatics.gauss-applications",
  div: "em1.electrostatics.divergence",
  cur: "em1.electrostatics.current",
  pot: "em1.electrostatics.potential",
  diel: "em1.electrostatics.dielectrics",
  cap: "em1.electrostatics.capacitance",
  amp: "em1.magnetostatics.ampere",
  dyn: "em1.dynamic.faraday",
  wave: "em1.waves.plane-waves",
} as const;
const w = (...pairs: [string, number][]) => pairs.map(([conceptId, weight]) => ({ conceptId, weight }));

const MST = "Mid-semester test 2023-24";
const ICT2 = "ICT 2 2024-25";
const HW2324 = "HW02 2023-24 (reissued as HW01 2024-25)";
const HW03 = "HW03 2024-25";
const HW04 = "HW04 2024-25";

export const questionBank: BankItem[] = [
  // Mid-semester test, 23 Oct 2023 (catalog: mst2324)
  { id: "mst-2324-q1a", source: "mst2324", kind: "mst", paper: MST, question: "Q1(a)", marks: 3, text: "State the vector form of Coulomb's law for two isolated charges.", concepts: w([K.coul, 1]) },
  { id: "mst-2324-q1b", source: "mst2324", kind: "mst", paper: MST, question: "Q1(b)", marks: 13, text: "In a vacuum, q1 = +25.0 nC at P1(2, 2, 13) mm and q2 = −42.0 nC at P2(10, 2, 7) mm. (i) Find the displacement vector R12 and its length, in metres. (ii) Calculate F12, the electrostatic force on q2 due to q1. (iii) State the effect of changing only q2 to +42.0 nC.", concepts: w([K.coul, 0.7], [K.vec, 0.3]) },
  { id: "mst-2324-q2a", source: "mst2324", kind: "mst", paper: MST, question: "Q2(a)", marks: 2, text: "Define electric field intensity, E, at a point.", concepts: w([K.field, 1]) },
  { id: "mst-2324-q2b", source: "mst2324", kind: "mst", paper: MST, question: "Q2(b)", marks: 10, text: "In a vacuum, QA = 0.5 µC at A(4, −3, 7) µm and QB = −0.3 µC at B(2, −3, 1) µm. Calculate E at P(1, 2, 5) µm.", concepts: w([K.field, 0.8], [K.vec, 0.2]) },
  { id: "mst-2324-q2c", source: "mst2324", kind: "mst", paper: MST, question: "Q2(c)", marks: 5, text: "A thin metallic sphere of diameter 12.8 cm is charged to +200 mC. Calculate V, the electric potential at its surface.", concepts: w([K.pot, 1]) },
  { id: "mst-2324-q3a", source: "mst2324", kind: "mst", paper: MST, question: "Q3(a)", marks: 10, text: "A 100 µC point charge is at the origin. Calculate the total electric flux Ψ through the part of the sphere r = 25.0 cm bounded by 0 < θ < π/3 and π/6 < φ < π/4.", concepts: w([K.gapp, 0.5], [K.surf, 0.5]) },
  { id: "mst-2324-q3b", source: "mst2324", kind: "mst", paper: MST, question: "Q3(b)", marks: 7, text: "An infinite plane at z = 5.00 m in free space carries ρS = 120 µC/m². (i) State the formula relating E, D and ε0. (ii) Calculate E at P(4, 5, 6) m. (iii) Hence compute D at the same point.", concepts: w([K.gapp, 0.6], [K.flux, 0.4]) },
  { id: "mst-2324-q4a", source: "mst2324", kind: "mst", paper: MST, question: "Q4(a)", marks: 4, text: "State Gauss's law (i) descriptively and (ii) in integral form.", concepts: w([K.gauss, 1]) },
  { id: "mst-2324-q4b", source: "mst2324", kind: "mst", paper: MST, question: "Q4(b)", marks: 10, text: "Calculate Q_T, the total charge within 0 ≤ ρ ≤ 0.2 m, 0 ≤ φ ≤ π, −4 ≤ z ≤ −2 m, for the nonlinear charge density ρv = ρ² sin φ µC/m³.", concepts: w([K.gapp, 0.6], [K.vec, 0.4]) },
  { id: "mst-2324-q4c", source: "mst2324", kind: "mst", paper: MST, question: "Q4(c)", marks: 6, text: "Calculate the capacitance of a 100 km coaxial cable with a solid core of radius 0.28 inch, insulated to a 0.90 inch diameter by a material of dielectric constant εr = 6.78.", concepts: w([K.cap, 1]) },
  { id: "mst-2324-q5a", source: "mst2324", kind: "mst", paper: MST, question: "Q5(a)", marks: 10, text: "(i) State the equation relating E to the potential V. (ii) Given V = ρ²z³ + 5z cos φ (volts), find E at P(2, π, 3).", concepts: w([K.pot, 0.6], [K.calc, 0.4]) },
  { id: "mst-2324-q5b", source: "mst2324", kind: "mst", paper: MST, question: "Q5(b)", marks: 10, text: "A parallel-plate capacitor has plate area S = 0.120 m² and separation d = 80 µm. At V0 = 15.0 V it stores WE = 50.0 µJ. Calculate (i) the energy density wE (the paper asks for J·m⁻²), (ii) the capacitance C, (iii) the relative permittivity εr of its dielectric.", concepts: w([K.cap, 1]) },

  // Finals, Dec 2024 (catalog: f2425)
  { id: "f2425-q1a", source: "f2425", kind: "finals", paper: F2425, question: "Q1(a)", marks: 4, text: "Very briefly comment on how electromagnetics theory has been important to technological advances in a chosen critical infrastructure.", concepts: w([K.world, 1]) },
  { id: "f2425-q1b", source: "f2425", kind: "finals", paper: F2425, question: "Q1(b)", marks: 11, text: "qA = +2.5 µC and qB = −3.8 µC are fixed at A(1, 2, 3) nm and B(0, 2, 8) nm. (i) Calculate F_AB, the force qA exerts on qB. (ii) Hence compute E_B, the field at the location of qB.", concepts: w([K.coul, 0.6], [K.field, 0.3], [K.vec, 0.1]) },
  { id: "f2425-q1c", source: "f2425", kind: "finals", paper: F2425, question: "Q1(c)", marks: 10, text: "In a region of permittivity ε, the potential is V = x³ sin y + 10z² kV. (i) Develop an expression for D in C·m⁻². (ii) Evaluate D at P(2, −2, 1) m.", concepts: w([K.pot, 0.5], [K.calc, 0.3], [K.flux, 0.2]) },
  {
    id: "f2425-q2a", source: "f2425", kind: "finals", paper: F2425, question: "Q2(a)", marks: 8,
    text: "In a region of free space, D = 5.0r² a_r (nC/m²). A sphere of radius r = 10.0 m is centred at the origin. (i) Compute Q_T, the total charge inside the sphere. (ii) Stating your reason, deduce the total electric flux leaving the sphere.",
    concepts: w([K.gauss, 0.5], [K.gapp, 0.3], [K.surf, 0.2]),
    practice: "em1.electrostatics.gauss-applications/past-paper",
  },
  { id: "f2425-q2b", source: "f2425", kind: "finals", paper: F2425, question: "Q2(b)", marks: 17, text: "Region 1 (x < 0) is a dielectric with εr1 = 5; region 2 (x > 0) is free space. Given D1 = ax + 3ay − 7az C·m⁻², calculate (i) E2, (ii) D2, (iii) the angle θ2.", concepts: w([K.diel, 1]) },
  { id: "f2425-q3a", source: "f2425", kind: "finals", paper: F2425, question: "Q3(a)", marks: 8, text: "A coaxial line has inner radius a and outer radius b, separated by an insulator of relative permeability μr. The inner conductor carries total current I along the x-axis. Develop an expression for H between the conductors.", concepts: w([K.amp, 1]) },
  { id: "f2425-q3b", source: "f2425", kind: "finals", paper: F2425, question: "Q3(b)", marks: 17, text: "H1 = ax + 3ay + 2az A·m⁻¹ fills the region y + 2x − 4 ≤ 0, where μ1 = 2μ0. Calculate (i) the magnetization M1, (ii) B1, (iii) H2 and B2 in the region y + 2x − 4 > 0, where μ2 = 8μ0.", concepts: w([K.amp, 1]) },
  { id: "f2425-q4a", source: "f2425", kind: "finals", paper: F2425, question: "Q4(a)", marks: 15, text: "A long, straight, nonmagnetic conductor of radius 8.00 mm carries a uniformly distributed direct current I = 50.0 A along the z-axis. (i) State Ampère's circuital law. (ii) Find J within the conductor. (iii) Develop H and B inside (0 < ρ ≤ r). (iv) State and justify ∇ × H outside.", concepts: w([K.amp, 0.8], [K.calc, 0.2]) },
  { id: "f2425-q4b", source: "f2425", kind: "finals", paper: F2425, question: "Q4(b)", marks: 5, text: "From the principle of conservation of charge, prove the continuity equation in point form, ∇·J = −∂ρv/∂t.", concepts: w([K.cur, 1]) },
  { id: "f2425-q4c", source: "f2425", kind: "finals", paper: F2425, question: "Q4(c)", marks: 5, text: "State Poynting's theorem and comment on how it supports an important conservation law.", concepts: w([K.wave, 1]) },

  // Finals 2023-24 (catalog: f2324), kept from the old list
  {
    id: "f2324-q2b", source: "f2324", kind: "finals", paper: F2324, question: "Q2(b)", marks: 12,
    text: "An electric field E(r) in a vacuum is given in spherical coordinates. (i) State Gauss's law. Compute the charge density ρ_v at (ii) r = 2 m and (iii) r = 5 m.",
    concepts: w([K.gauss, 0.4], [K.div, 0.6]),
    practice: "em1.electrostatics.divergence/main",
  },

  // ICT 02, 18 Nov 2024 (catalog: ict2-2425; solved by hand, so exact data comes from the source in content plans)
  { id: "ict2-2425-q1", source: "ict2-2425", kind: "ict", paper: ICT2, question: "Q1", text: "(a) State Biot-Savart's law and use it to find H on the axis of an N-turn circular coil. (b) State Ampère's circuital law in point and integral form, and use it to find H and J for a current-carrying conductor (see source).", concepts: w([K.amp, 1]) },
  { id: "ict2-2425-q2", source: "ict2-2425", kind: "ict", paper: ICT2, question: "Q2", text: "A dielectric boundary lies on the plane 6x + 8y = 16. Split D1 into normal and tangential parts, then find D2, E2 and the field angles (see source).", concepts: w([K.diel, 1]) },
  { id: "ict2-2425-q3", source: "ict2-2425", kind: "ict", paper: ICT2, question: "Q3", text: "A magnetic boundary across a general plane: find B2 and H2, the angle B2 makes with the normal, and the magnetizations (see source).", concepts: w([K.amp, 1]) },

  // HW02 2023-24 = HW01 2024-25 (catalog: hw02-2324, hw01-2425)
  { id: "hw-2324-2.1", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.1", marks: 15, seenIn: ["hw02-2324", "hw01-2425"], text: "Find the gradient and evaluate it at the point: (a) V = 10xyz − 2x²z at P(−1, 4, 3); (b) U = 2ρ sin φ + ρz at Q(2, 90°, −1); (c) W = (4/r) sin θ cos φ at R(1, π/6, π/2).", concepts: w([K.calc, 1]) },
  { id: "hw-2324-2.2", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.2", marks: 12, seenIn: ["hw02-2324", "hw01-2425"], text: "Evaluate the divergence of three vector fields, one each in rectangular, cylindrical and spherical coordinates (see source).", concepts: w([K.calc, 1]) },
  { id: "hw-2324-2.3", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.3", marks: 9, seenIn: ["hw02-2324", "hw01-2425"], text: "(a) State Coulomb's law in vector form for two point charges. (b) Define electric field intensity, E. (c) State Gauss's law, and deduce Coulomb's law from it.", concepts: w([K.coul, 0.4], [K.field, 0.2], [K.gauss, 0.4]) },
  { id: "hw-2324-2.4", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.4", marks: 10, seenIn: ["hw02-2324", "hw01-2425"], text: "(a) Q1 = 5 µC and Q2 = −4 µC are at (2, 1, 3) cm and (−4, 0, 6) cm. Determine the force on Q1. (b) Calculate the field intensity 2.45 nm from a −6.76 µC point charge.", concepts: w([K.coul, 0.6], [K.field, 0.4]) },
  { id: "hw-2324-2.5", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.5", marks: 21, seenIn: ["hw02-2324", "hw01-2425"], text: "Determine the total charge: (a) on the line 1 < x < 5 m with ρL = 12x² mC/m; (b) on the cylinder 0 < z < 7 m, ρ = 4 m, with ρS = πρz² pC/m²; (c) within the sphere r = 5.25 m for the given ρv (see source).", concepts: w([K.gapp, 0.6], [K.vec, 0.4]) },
  { id: "hw-2324-2.6", source: "hw02-2324", kind: "hw", paper: HW2324, question: "2.6", marks: 18, seenIn: ["hw02-2324", "hw01-2425"], text: "Given D = 3xy ax + x² ay C/m², calculate (a) the volume charge density ρv, (b) the total flux through the surface 0 < x, y < 1 m at z = −3 m, (c) the total charge in the region 0 < x, y, z < 2 m.", concepts: w([K.div, 0.6], [K.gauss, 0.4]) },

  // HW03 2024-25 (catalog: hw03-2425)
  { id: "hw03-2425-3.1a", source: "hw03-2425", kind: "hw", paper: HW03, question: "3.1(a)", marks: 15, text: "A 200-turn coil of radius 30.0 cm, parallel to the x–y plane and centred at the origin, carries 2.82 A in the −aφ direction. (i) State Biot-Savart's law with a diagram. (ii) Calculate H at P(0, 0, −50) cm.", concepts: w([K.amp, 1]) },
  { id: "hw03-2425-3.1b", source: "hw03-2425", kind: "hw", paper: HW03, question: "3.1(b)", marks: 15, text: "A long vertical solid conductor of radius 20.0 mm carries current uniformly, with J = 95.49 kA·m⁻² inside. (i) State Ampère's circuital law and express it mathematically. (ii) Give one drawback and one advantage of the law. (iii) Using it, find B at P(0, 0, 15) mm.", concepts: w([K.amp, 1]) },
  { id: "hw03-2425-3.2", source: "hw03-2425", kind: "hw", paper: HW03, question: "3.2", marks: 25, text: "Region 1 (ε1 = 8ε0) and region 2 (ε2 = 5ε0) meet at the plane −3x + 4z = 15. In region 1, D1 = −10.0ax − 20.0ay + 14.0az C·m⁻². Stating assumptions, calculate (a) D2, (b) E2 in terms of ε0, (c) θ1 and θ2, the angles between the field vectors and the interface tangent, (d) the ratio cos θ1 / cos θ2, and comment on it.", concepts: w([K.diel, 1]) },
  { id: "hw03-2425-3.3", source: "hw03-2425", kind: "hw", paper: HW03, question: "3.3", marks: 25, text: "Region 1 (μr1 = 4.66) and region 2 (μr2 = 1.5μr1) meet at the plane 5x + 4y + 10z − 12 = 0. In region 1, H1 = (1/μ0)(9.44ax + 6.87ay − 12.2az) A·m⁻¹. Calculate (a) H2 in terms of μ0, (b) B2, (c) θ1 and θ2 from the interface normal, (d) the magnetizations M1 and M2.", concepts: w([K.amp, 1]) },

  // HW04 2024-25 (catalog: hw04-2425)
  { id: "hw04-2425-4.1", source: "hw04-2425", kind: "hw", paper: HW04, question: "4.1", marks: 8, text: "State, and express mathematically, (a) the current continuity equation and (b) Faraday's law of induction.", concepts: w([K.cur, 0.5], [K.dyn, 0.5]) },
  { id: "hw04-2425-4.2", source: "hw04-2425", kind: "hw", paper: HW04, question: "4.2", marks: 12, text: "For E(z, t) = E0 e^(−αz) cos(ωt ± βz + φ) ay: (a) What is a TEM wave? (b) Name the terms α, ω, β and φ. (c) State the matching H(z, t). (d) Relate E(z, t), H(z, t) and the wave velocity u.", concepts: w([K.wave, 1]) },
  { id: "hw04-2425-4.3", source: "hw04-2425", kind: "hw", paper: HW04, question: "4.3", marks: 20, text: "(a) With diagrams, describe how wave propagation in dielectrics differs from propagation in conductors. (b) (i) What is Poynting's theorem? (ii) On what conservation principle is it based? (iii) State how the Poynting vector and the average power of a TEM wave are computed.", concepts: w([K.wave, 1]) },
];
```

Do **not** import `course` into `questions.ts`: `index.ts` imports `questions.ts`, so that would be a circular import. Put this helper in `index.ts`, after `course` is parsed:

```ts
/** Assessment ids (in date order) whose scope covers any of the item's concepts. */
export const assessmentsForItem = (item: BankItem) =>
  [...course.assessments]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((a) => item.concepts.some((c) => a.scope.concepts.includes(c.conceptId)))
    .map((a) => a.id);
```

Import `type BankItem` there.

`F2324` and `F2425` already exist in `sources.ts`. If `F2425` isn't exported, check with `grep -n "export const F2" packages/course-em1/src/sources.ts` and add `export const F2425 = "UTech ELE3001 Finals 2024-25 Sem 1";` in the same style.

- [ ] **Step 6: Update `course.test.ts`.** Its past-paper test imports `pastPapers`.
  - Change the import to `questionBank`.
  - Change the loop `for (const p of pastPapers)` to `for (const p of questionBank)`.
  - Rename the test to "every bank item's concept weights sum to 1".

- [ ] **Step 7: Run the tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected:
- PASS.
- `lintCourse` stays clean: locked concepts need no lessons.
- If `lintCourse` complains that a unit-1 concept has no unit title, check that `units` now includes `{ number: 1, title: "Introduction" }`.

- [ ] **Step 8: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): assessments (ICT 1, ICT 2, finals), Unit 1, placeholders, question bank from tests and homework

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 5: The web app counts down to the next assessment and schedules by it

**Files:**
- Create: `app/apps/web/lib/assessments.ts`, `app/apps/web/test/assessments.test.ts`
- Modify: `app/apps/web/lib/course.ts` (replace the `pastPapers` re-export with `questionBank`, `assessmentsForItem`), `app/apps/web/lib/store.ts`, `app/apps/web/components/screens/DeskScreen.tsx`, `app/apps/web/components/workspace/ReviseMode.tsx`

**Interfaces:**
- Produces:
  - `countdownText(now, conceptId?) → string` (e.g. "ICT 1 in 16 days", "ICT 1 today", "Finals in 80 days"; `""` after finals).
  - `reviewDateFor(conceptId, now) → number | undefined`.
  - `readiness(learner, assessmentId) → { ready: number; total: number }`, counting unlocked in-scope concepts whose state is `DEMONSTRATED` or `MASTERED`.

- [ ] **Step 1: Write the failing test** at `app/apps/web/test/assessments.test.ts`

```ts
import { initialState } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { countdownText, readiness, reviewDateFor } from "@/lib/assessments";

const ja = (iso: string) => Date.parse(`${iso}-05:00`);

describe("assessment countdown", () => {
  it("names the next sitting, then the one after", () => {
    expect(countdownText(ja("2026-09-26T12:00:00"))).toBe("ICT 1 in 16 days");
    expect(countdownText(ja("2026-10-12T23:00:00"))).toBe("ICT 1 today");
    expect(countdownText(ja("2026-10-13T00:01:00"))).toBe("ICT 2 in 34 days");
    expect(countdownText(ja("2026-12-16T00:01:00"))).toBe("");
  });
  it("follows a concept's own scope", () => {
    expect(countdownText(ja("2026-09-26T12:00:00"), "em1.waves.plane-waves")).toBe("Finals in 80 days");
  });
});

describe("scheduler dates by scope", () => {
  it("a Unit 2 concept reviews toward ICT 1; a Unit 4 concept toward finals", () => {
    const now = ja("2026-09-26T12:00:00");
    expect(reviewDateFor("em1.electrostatics.coulomb", now)).toBe(Date.parse("2026-10-12T14:00:00Z"));
    expect(reviewDateFor("em1.dynamic.faraday", now)).toBe(Date.parse("2026-11-16T14:00:00Z"));
    expect(reviewDateFor("em1.waves.plane-waves", now)).toBe(Date.parse("2026-12-15T14:00:00Z"));
  });
});

describe("readiness", () => {
  it("counts unlocked in-scope concepts, none ready at the start", () => {
    const r = readiness(initialState(), "ict1");
    expect(r.ready).toBe(0);
    expect(r.total).toBeGreaterThan(5);
  });
});
```

Check the days by hand: 2026-09-26 12:00 to 2026-12-15 00:00 is 79.5 days, which rounds up to 80. `em1.dynamic.faraday` is unit 4, so it is in ICT 2's scope.

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run apps/web/test/assessments.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement** `app/apps/web/lib/assessments.ts`

```ts
import { assessmentTime, daysUntil, nextAssessment, type LearnerState } from "@forma/engine";
import { course } from "./course";
import { conceptProgress } from "./progress";

/** "ICT 1 in 16 days" / "ICT 1 today" / "" when nothing is ahead. */
export function countdownText(now: number, conceptId?: string): string {
  const a = nextAssessment(course, now, conceptId);
  if (!a) return "";
  const d = daysUntil(a, now);
  return d === 0 ? `${a.short} today` : `${a.short} in ${d} day${d === 1 ? "" : "s"}`;
}

/** The date reviews for this concept should compress toward: its next in-scope sitting. */
export const reviewDateFor = (conceptId: string, now: number): number | undefined => {
  const a = nextAssessment(course, now, conceptId);
  return a ? assessmentTime(a) : undefined;
};

/** Unlocked in-scope concepts at Demonstrated or better. */
export function readiness(learner: LearnerState, assessmentId: string) {
  const a = course.assessments.find((x) => x.id === assessmentId);
  const open = (a?.scope.concepts ?? []).filter((id) => !course.concepts.find((c) => c.id === id)?.locked);
  const ready = open.filter((id) => ["DEMONSTRATED", "MASTERED"].includes(conceptProgress(learner, id).state)).length;
  return { ready, total: open.length };
}
```

In `lib/course.ts`:
- Change the first import and re-export from `pastPapers` to `questionBank, assessmentsForItem`.
- Keep `examDateMs`; it is still the finals date.

In `lib/store.ts`:
- Import `reviewDateFor` from `./assessments`.
- In `dispatch`, replace `examDateMs` in the `reduce` call with `reviewDateFor(e.conceptId, event.at) ?? examDateMs`. `event.at` is already set to `get().now()`.

`DeskScreen.tsx`:
- Remove `DAY_MS`, `examDateMs` and the `days` const.
- Import `{ countdownText, readiness }` from `@/lib/assessments` and `nextAssessment` from `@forma/engine`.
- Replace the line `<p className="text-sm text-soft">Finals in {days} days · {course.code}</p>` with:

```tsx
        {(() => {
          const next = nextAssessment(course, now);
          if (!next) return null;
          const r = readiness(learner, next.id);
          return (
            <>
              <p className="text-sm text-soft">{countdownText(now)} · {course.code}</p>
              <p className="text-sm text-soft">{next.short} readiness: {r.ready} of {r.total} topics demonstrated</p>
            </>
          );
        })()}
```

`ReviseMode.tsx`:
- Replace `DAY_MS` and `examDateMs` with `countdownText` and `pastPapers` with `questionBank`.
- The countdown becomes `<p className="text-sm text-soft">{countdownText(now(), conceptId)}</p>`.
- The item list header shows `{q.paper} · {q.question}{q.marks ? ` · ${q.marks} marks` : ""}`.
- The empty text becomes "No bank questions map to this concept yet."

- [ ] **Step 4: Run the tests**

Run: `pnpm test && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected:
- The unit tests PASS.
- tsc reports errors only in `app/past-papers/page.tsx` and `app/dashboard/page.tsx`, which still import `pastPapers`. Task 6 fixes them.
- If you prefer a clean tsc now, do Task 6 Step 3 first and note it in the ledger.

- [ ] **Step 5: Commit**

```bash
git add apps/web && git commit -m "feat(web): countdown to the next assessment, reviews timed by each concept's sitting, readiness on the Desk

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 6: The question bank page

**Files:**
- Modify: `app/apps/web/app/past-papers/page.tsx`, `app/apps/web/app/dashboard/page.tsx`, `app/apps/web/components/shell/*` (only if a nav label says "Past papers"; check with `grep -rn "Past papers" apps/web/components apps/web/lib`)
- Create: `app/apps/web/e2e/bank.spec.ts`

- [ ] **Step 1: Write the failing e2e test** at `app/apps/web/e2e/bank.spec.ts`

```ts
import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test("the question bank filters by assessment and never links to a missing lesson", async ({ page }) => {
  await open(page, "/past-papers");
  await expect(page.getByRole("heading", { level: 1, name: "Question bank" })).toBeVisible();
  const all = await page.locator("article").count();
  expect(all).toBeGreaterThanOrEqual(39);
  await page.getByRole("radio", { name: "ICT 1" }).check();
  await expect(page.getByText("Mid-semester test 2023-24 · Q1(b)")).toBeVisible();
  await expect(page.getByText("HW04 2024-25 · 4.2")).toHaveCount(0);
  await page.getByRole("radio", { name: "Finals" }).check();
  await expect(page.getByText("HW04 2024-25 · 4.2")).toBeVisible();
  // A locked-only item shows no "Work this question" or "Strengthen" link.
  const coax = page.locator("article", { hasText: "UTech ELE3001 Finals 2024-25 Sem 1 · Q3(a)" });
  await expect(coax.getByRole("link", { name: /Work this question|Strengthen/ })).toHaveCount(0);
  await expect(coax.getByText("Coming in a later build")).toBeVisible();
});
```

Check `F2425`'s string with `grep -n "F2425" packages/course-em1/src/sources.ts`. The page renders `${q.paper} · ${q.question}`. If `F2425` is not "Finals 2024-25", change the test's `UTech ELE3001 Finals 2024-25 Sem 1 · Q3(a)` to match it and log a ruling.

- [ ] **Step 2: Implement the page.** Rewrite `app/past-papers/page.tsx` with these changes:
  - Import `questionBank` and `assessmentsForItem` instead of `pastPapers`.
  - Title: kicker `Question bank`, `h1` "Question bank". Lede: "Every question from past tests, homework and finals, split into the ideas it tests. The lecturer reuses homework, so these are worth knowing cold."
  - **Filter.** A `role="radiogroup"` with `aria-label="Assessment"`. It holds radio inputs "All", "ICT 1", "ICT 2" and "Finals" (`name="scope"`); state lives in `useState<string>("all")`, and "All" is the default. Filter with `scope === "all" || assessmentsForItem(q).includes(scope)`. The radio values are `all`, `ict1`, `ict2` and `finals`.
  - Each `article` heading reads `{q.paper} · {q.question}`, with `{q.marks} marks` shown only when `marks` exists. If `q.seenIn && q.seenIn.length > 1`, show `<p className="label">Set {q.seenIn.length} times</p>`.
  - **Links, guarded.**
    - `const weak = [...q.concepts].map((c) => getConcept(c.conceptId)!).filter((k) => !k.locked && mainLesson(k)).sort(...)[0]`, sorting by mastery ascending.
    - "Work this question →" renders only when `q.practice`.
    - "Strengthen X" renders only when `weak` exists.
    - When every concept is locked, show `<p className="text-sm text-soft">Coming in a later build.</p>` instead.
    - "Readiness" and "Most marks at risk" render only when `weak` exists.
  - `dashboard/page.tsx`: replace `pastPapers` with `questionBank`, and show only items that have `marks` (so the coverage bars stay meaningful). Rename its label from "Exam coverage" to "Question bank coverage".

- [ ] **Step 3: Build and run e2e**

Run: `cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e`
Expected:
- tsc is clean and the build passes.
- e2e: the new bank test PASSES.
- `desk.spec.ts` fails on `/Finals in \d+ days/`. Fix it in Step 4.

- [ ] **Step 4: Update the desk e2e.** In `e2e/desk.spec.ts`:
  - Replace both `page.getByText(/Finals in \d+ days/)` with `page.getByText(/(ICT \d|Finals) (in \d+ days?|today)/).first()`.
  - Replace `.not.toContainText("Finals")` with `.not.toContainText(/(ICT \d|Finals) (in|today)/)`.
  - Rerun `pnpm e2e`. Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web && git commit -m "feat(web): question bank page filtered by assessment, guarded links, desk e2e follows the next sitting

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 7: 3D vector plates (oblique projection, axes, vectors, coordinate frame)

**Files:**
- Modify: `app/packages/plate/src/geometry2d.ts`, `app/packages/plate/src/components/em.ts` (add to `emComponents`), `app/packages/plate/src/index.ts` (export vec), `app/apps/web/components/plate/views2d.tsx` (register views), `app/apps/web/components/plate/Readouts.tsx` (labels)
- Create: `app/packages/plate/src/components/vec.ts`, `app/packages/plate/test/vec.test.ts`, `app/apps/web/components/plate/views3d.tsx`

**Interfaces:**
- Produces:
  - `toSvg3(p) → [sx, sy]` and `fromSvg3(sx, sy, x) → Vec3`, using the textbook oblique view: x toward the viewer (drawn down-left at 45°, half length), y right, z up.
  - Components:
    - `axes3`: params `{ length = 2 }`. No readouts.
    - `vector3`: params `{ from: V3, to: V3, label, tone = "ink", components = false }`. Readouts `vx`, `vy`, `vz`, `vmag` (unitless `""`). The quotable values are the same.
    - `coord-frame`: params `{ point: V3, system: "cart" | "cyl" | "sph", unitVectors = true, draggable = false }`, handles `["point"]`. The readouts present depend on `system` (absent keys are hidden by `PlateReadouts`):
      - cart: `px`, `py`, `pz`
      - cyl: `pRho`, `pPhi`, `pz`
      - sph: `pR`, `pTheta`, `pPhi`

      Units are `m`, and `°` for angles.

- [ ] **Step 1: Write the failing test** at `app/packages/plate/test/vec.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, fromSvg3, PlateDef, Registry, stateAt, toSvg3 } from "../src";

const reg = new Registry().register(...emComponents);
const frameOf = (instances: unknown[]) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances, steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0));
};

describe("oblique projection", () => {
  it("draws y right, z up, x down-left at half length", () => {
    expect(toSvg3([0, 1, 0])).toEqual([100, -0]);
    expect(toSvg3([0, 0, 1])).toEqual([0, -100]);
    const [sx, sy] = toSvg3([1, 0, 0]);
    expect(sx).toBeCloseTo(-35.3553, 3);
    expect(sy).toBeCloseTo(35.3553, 3);
  });
  it("round-trips a screen point at a fixed x", () => {
    for (const p of [[0.4, -1.2, 0.7], [-1, 2, -0.3], [1.5, 0, 0]] as const) {
      const [sx, sy] = toSvg3(p);
      const q = fromSvg3(sx, sy, p[0]);
      q.forEach((v, i) => expect(v).toBeCloseTo(p[i]!, 10));
    }
  });
});

describe("vector3 and coord-frame", () => {
  it("vector3 reports components and magnitude", () => {
    const f = frameOf([{ id: "a", component: "vector3", params: { from: [0, 0, 0], to: [2, -3, 6], label: "A" }, visible: true }]);
    expect(f.a!.model).toMatchObject({ vx: 2, vy: -3, vz: 6, vmag: 7 });
  });
  it("vector3 in metres keys its readouts by unit (MST R12 = 8, 0, −6 mm)", () => {
    const f = frameOf([{ id: "r", component: "vector3", params: { from: [0.002, 0.002, 0.013], to: [0.01, 0.002, 0.007], label: "R12", unit: "m", drawScale: 150 }, visible: true }]);
    expect(f.r!.model.vmagm as number).toBeCloseTo(0.01, 12);
    expect("vmag" in f.r!.model).toBe(false);
  });
  it("coord-frame shows only its system's coordinates", () => {
    const cyl = frameOf([{ id: "c", component: "coord-frame", params: { point: [1, 3, 5], system: "cyl" }, visible: true }]).c!.model;
    expect(cyl.pRho as number).toBeCloseTo(3.16228, 5);
    expect(cyl.pPhi as number).toBeCloseTo(71.56505, 4);
    expect(cyl.pz).toBe(5);
    expect("pR" in cyl || "px" in cyl).toBe(false);
    const sph = frameOf([{ id: "c", component: "coord-frame", params: { point: [1, 3, 5], system: "sph" }, visible: true }]).c!.model;
    expect(sph.pR as number).toBeCloseTo(5.91608, 5);
    expect(sph.pTheta as number).toBeCloseTo(32.31153, 4);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/plate/test/vec.test.ts`
Expected: FAIL (`toSvg3` is not exported).

- [ ] **Step 3: Implement the projection.** Append to `geometry2d.ts`:

```ts
/** Oblique (cabinet) view in the textbook orientation: y right, z up, x toward the viewer drawn down-left at 45°, half length. */
const OB = 0.5 * Math.SQRT1_2;
export const toSvg3 = (p: readonly number[]): [number, number] => {
  const x = p[0] ?? 0, y = p[1] ?? 0, z = p[2] ?? 0;
  return [(y - OB * x) * PX, -(z - OB * x) * PX];
};
/** Inverse of toSvg3 for a known x (dragging keeps x fixed). */
export const fromSvg3 = (sx: number, sy: number, x: number): [number, number, number] => [x, sx / PX + OB * x, -sy / PX + OB * x];
```

`toSvg3([0, 1, 0])` gives `[100, -0]`, and `toEqual` treats `-0` and `0` as equal.

- [ ] **Step 4: Implement the components** in `packages/plate/src/components/vec.ts`

```ts
import { toCyl, toSph } from "@forma/physics";
import { z } from "zod";
import { defineComponent } from "../component";

const V3 = z.tuple([z.number(), z.number(), z.number()]);
const DEG = 180 / Math.PI;

export const Axes3 = defineComponent({
  id: "axes3",
  params: z.object({ length: z.number().positive().default(2) }),
  model: () => ({}),
  handles: [],
  readouts: {},
});

export const Vector3 = defineComponent({
  id: "vector3",
  params: z.object({
    from: V3,
    to: V3,
    label: z.string().min(1),
    tone: z.enum(["charge", "field", "flux", "surface", "ink"]).default("ink"),
    components: z.boolean().default(false),
    /** "m" when from/to are positions in metres: readouts then carry the metre unit (vxm…). */
    unit: z.enum(["", "m"]).default(""),
    /** Drawing magnification only (tiny mm vectors or long ones); readouts always use the true values. */
    drawScale: z.number().positive().default(1),
  }),
  model: (p) => {
    const d = [p.to[0] - p.from[0], p.to[1] - p.from[1], p.to[2] - p.from[2]] as const;
    const mag = Math.hypot(d[0], d[1], d[2]);
    return p.unit === "m" ? { vxm: d[0], vym: d[1], vzm: d[2], vmagm: mag } : { vx: d[0], vy: d[1], vz: d[2], vmag: mag };
  },
  handles: [],
  readouts: { vx: "", vy: "", vz: "", vmag: "", vxm: "m", vym: "m", vzm: "m", vmagm: "m" },
  quotable: { vx: "", vy: "", vz: "", vmag: "", vxm: "m", vym: "m", vzm: "m", vmagm: "m" },
});

export const CoordFrame = defineComponent({
  id: "coord-frame",
  params: z.object({
    point: V3,
    system: z.enum(["cart", "cyl", "sph"]).default("cart"),
    unitVectors: z.boolean().default(true),
    draggable: z.boolean().default(false),
    /** Drawing magnification only; readouts use the true point. */
    drawScale: z.number().positive().default(1),
  }),
  model: (p) => {
    const pt = p.point as [number, number, number];
    if (p.system === "cart") return { px: pt[0], py: pt[1], pz: pt[2] };
    const c = toCyl(pt);
    if (p.system === "cyl") return { pRho: c.rho, pPhi: c.phi * DEG, pz: c.z };
    const s = toSph(pt);
    return { pR: s.r, pTheta: s.theta * DEG, pPhi: s.phi * DEG };
  },
  handles: ["point"],
  readouts: { px: "m", py: "m", pz: "m", pRho: "m", pPhi: "°", pR: "m", pTheta: "°" },
  quotable: { px: "m", py: "m", pz: "m", pRho: "m", pPhi: "°", pR: "m", pTheta: "°" },
});

export const vecComponents = [Axes3, Vector3, CoordFrame];
```

In `em.ts`:
- Add `import { vecComponents } from "./vec";`.
- Change `emComponents` to `[Charges, …, PatchTiling, ...vecComponents]`.

In `packages/plate/src/index.ts`, export `./components/vec` (check how `em` is exported and mirror it).

`backingValues` already skips readouts absent from the model (it checks `typeof v === "number"`), so cart mode needs no lint change. A claim on an absent readout is correctly an error.

- [ ] **Step 5: Run the plate tests**

Run: `pnpm vitest run packages/plate`
Expected: PASS.

- [ ] **Step 6: Implement the views** in `apps/web/components/plate/views3d.tsx`

```tsx
"use client";

import { fromSvg3, toSvg3, unitVectorsAt } from "@forma/plate";
import type { KeyboardEvent, PointerEvent } from "react";
import { usePlateStage } from "./stage-context";
import type { ViewProps } from "./views2d";

const r2 = (v: number) => Math.round(v * 100) / 100;
const STEP = 0.1;

function Arrow({ from, to, tone, label }: { from: readonly number[]; to: readonly number[]; tone: string; label?: string }) {
  const [x1, y1] = toSvg3(from);
  const [x2, y2] = toSvg3(to);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: `var(--${tone})` }} strokeWidth={1.6} markerEnd={`url(#arrow-${tone === "ink" ? "graphite" : tone})`} />
      {label && <text x={x2 + 6} y={y2 - 6} className="plate-label">{label}</text>}
    </g>
  );
}

export function Axes3View({ ev }: ViewProps) {
  const L = (ev.params as { length: number }).length;
  return (
    <g className="v-axes3" role="img" aria-label="x, y and z axes">
      <Arrow from={[0, 0, 0]} to={[L, 0, 0]} tone="graphite" label="x" />
      <Arrow from={[0, 0, 0]} to={[0, L, 0]} tone="graphite" label="y" />
      <Arrow from={[0, 0, 0]} to={[0, 0, L]} tone="graphite" label="z" />
    </g>
  );
}

export function Vector3View({ ev }: ViewProps) {
  const raw = ev.params as { from: number[]; to: number[]; label: string; tone: string; components: boolean; drawScale: number };
  const p = { ...raw, from: raw.from.map((v) => v * raw.drawScale), to: raw.to.map((v) => v * raw.drawScale) };
  const m = { vmag: (ev.model.vmag ?? ev.model.vmagm) as number };
  const [fx, fy, fz] = p.from as [number, number, number];
  const [tx, ty, tz] = p.to as [number, number, number];
  const dashed = (a: number[], b: number[]) => {
    const [x1, y1] = toSvg3(a);
    const [x2, y2] = toSvg3(b);
    return <line x1={x1} y1={y1} x2={x2} y2={y2} className="ink" strokeDasharray="3 3" />;
  };
  return (
    <g className="v-vector3" role="img" aria-label={`Vector ${p.label}, magnitude ${m.vmag.toFixed(3)}`}>
      {p.components && (
        <g opacity={0.7}>
          {dashed([fx, fy, fz], [tx, fy, fz])}
          {dashed([tx, fy, fz], [tx, ty, fz])}
          {dashed([tx, ty, fz], [tx, ty, tz])}
        </g>
      )}
      <Arrow from={p.from} to={p.to} tone={p.tone} label={p.label} />
    </g>
  );
}

const SYS_LABELS = { cart: ["aₓ", "a_y", "a_z"], cyl: ["a_ρ", "a_φ", "a_z"], sph: ["a_r", "a_θ", "a_φ"] } as const;

export function CoordFrameView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const raw = ev.params as { point: [number, number, number]; system: "cart" | "cyl" | "sph"; unitVectors: boolean; draggable: boolean; drawScale: number };
  const k = raw.drawScale;
  // Draw at k × the true point; edits divide back out so the model always holds the true coordinates.
  const p = { ...raw, point: raw.point.map((v) => v * k) as [number, number, number] };
  const [x, y, z] = p.point;
  const can = p.draggable && stage.editable(id);
  const move = (pt: [number, number, number]) => stage.edit(id, { point: pt.map((v) => r2(v / k)) });
  const [sx, sy] = toSvg3(p.point);
  const foot = toSvg3([x, y, 0]);
  const origin = toSvg3([0, 0, 0]);
  const onPointerDown = (e: PointerEvent<SVGGElement>) => can && e.currentTarget.setPointerCapture(e.pointerId);
  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    if (!can || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
    move(fromSvg3(mx * 100, -mz * 100, x) as [number, number, number]);
  };
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (!can) return;
    const d: Record<string, [number, number, number]> = e.shiftKey
      ? { ArrowUp: [-STEP, 0, 0], ArrowDown: [STEP, 0, 0] }
      : { ArrowLeft: [0, -STEP, 0], ArrowRight: [0, STEP, 0], ArrowUp: [0, 0, STEP], ArrowDown: [0, 0, -STEP] };
    const k = d[e.key];
    if (!k) return;
    e.preventDefault();
    move([x + k[0], y + k[1], z + k[2]]);
  };
  const label = `Point at x ${x.toFixed(2)} m, y ${y.toFixed(2)} m, z ${z.toFixed(2)} m`;
  const a11y = can
    ? { tabIndex: 0, role: "button", "aria-label": `${label}. Drag, or use the arrow keys (y and z) and Shift with Up or Down (x), to move it.`, onPointerDown, onPointerMove, onKeyDown }
    : { role: "img", "aria-label": label };
  const units = p.unitVectors ? unitVectorsAt(p.point, p.system) : [];
  return (
    <g className="v-coord-frame">
      <line x1={origin[0]} y1={origin[1]} x2={foot[0]} y2={foot[1]} className="ink" strokeDasharray="4 3" />
      <line x1={foot[0]} y1={foot[1]} x2={sx} y2={sy} className="ink" strokeDasharray="4 3" />
      {units.map((u, i) => (
        <Arrow key={i} from={p.point} to={[x + 0.6 * u[0], y + 0.6 * u[1], z + 0.6 * u[2]]} tone={["field", "flux", "surface"][i]!} label={SYS_LABELS[p.system][i]} />
      ))}
      <g transform={`translate(${sx} ${sy})`} className={can ? "handle" : undefined} {...a11y}>
        <circle r={5} className="fill-charge" />
        {can && <circle r={14} className="handle-ring" />}
      </g>
    </g>
  );
}
```

Details:
- **`stage.toMetres`** returns `fromSvg(x, y)` = `[x / PX, 0, −y / PX]`. The drag handler converts back to SVG pixels (`mx * 100` and `-mz * 100`, where 100 is `PX`) before calling `fromSvg3`. Import `PX` from `@forma/plate` and use `mx * PX` and `-mz * PX` instead of the literal 100 if `PX` is exported (it is, from `geometry2d`).
- **`unitVectorsAt`:** export it from `@forma/plate` as a re-export of physics `unitVectors`. In `vec.ts` add `export { unitVectors as unitVectorsAt } from "@forma/physics";`. The web app imports from `@forma/plate` only.
- **Register the views.** In `views2d.tsx`, import `{ Axes3View, CoordFrameView, Vector3View }` from `./views3d` and add `axes3: Axes3View, vector3: Vector3View, "coord-frame": CoordFrameView,` to the `views2d` record.

- [ ] **Step 7: Readout labels.** In `Readouts.tsx`:
  - Add to `LABEL`:

    ```ts
    vx: "x-component", vy: "y-component", vz: "z-component", vmag: "Magnitude",
    vxm: "x-component", vym: "y-component", vzm: "z-component", vmagm: "Length",
    px: "x", py: "y", pz: "z", pRho: "ρ", pPhi: "φ", pR: "r", pTheta: "θ (from +z)",
    ```

  - Add to `TONE`: `vmag: "field"`.
  - `pretty` must not mangle `°`: `pretty("°")` returns `"°"` unchanged, which is fine.
  - When a vector3 is visible, prefix its labels with the vector's label. In the `.map` that builds rows, set `label: (inst.component === "vector3" ? `${String(ev.params.label)} ` : "") + (LABEL[name] ?? name)`. Then pass `label={r.label}` to `Readout` instead of computing it at render time.

- [ ] **Step 8: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all PASS. The web `views.test.ts` now checks that `axes3`, `vector3` and `coord-frame` have views and that every new readout has a label.

- [ ] **Step 9: Commit**

```bash
git add packages/plate packages/physics apps/web && git commit -m "feat(plate): 3D vector plates (oblique textbook view, axes, vectors, coordinate frame with draggable point)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 8: Verification and handback

- [ ] **Step 1: Run the full suite**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`
Expected: everything green.

- [ ] **Step 2: Check it in the browser.**
  1. Run `pnpm --dir apps/web dev` (port 3100). Open `/`.
  2. The Desk shows "ICT 1 in N days · ELE3001" and a readiness line.
  3. Open `/past-papers`. Switch the radios between ICT 1, ICT 2 and Finals, and check the list changes.
  4. Open a concept in Revise mode. It shows its own countdown.
- [ ] **Step 3:** Append `Task 8: verification — <paste the pass counts>` to the ledger and stop. Claude reviews the branch next.

---

## Self-Review Notes

- **Spec coverage.**
  - §1: `AGENTS.md`, the ledger, rulings and the review gate (Task 1).
  - §2.1: data (Tasks 3–4).
  - §2.2: next assessment, countdown, scheduler, readiness and the Revise scope filter (Tasks 5–6).
  - §2.3: the item bank, with every in-scope source question and reuse recorded through `seenIn` (Task 4).
  - §4 (Plan F share): `coord-frame` and `vector3` (Task 7).
  - Unit 1 is added as a locked placeholder; Plan F2 writes its content.
- **Deferred to F2:** the ideas themselves; templates from the bank items; and `practice` links for new items, set once their lessons exist.
- **Type consistency.**
  - `BankItem.marks` is optional, and the pages guard it.
  - `assessmentsForItem` lives in `index.ts` to avoid a cycle.
  - `unitVectorsAt` is re-exported from plate for the web app.
