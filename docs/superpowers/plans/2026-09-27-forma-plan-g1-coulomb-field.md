# Forma Plan G1: Coulomb's Law and the Electric Field at Full Depth

> **For agentic workers (Codex):** read `AGENTS.md` first. **Plans F1–F4 must be complete.** This plan uses the question bank, the oblique projection (`toSvg3`), the templates pattern and the lint rules. Transcribe the content exactly. Every value was solved in Python from the source questions (`scratchpad/g1.py`), using the physics package's ε₀ = 8.8541878128 × 10⁻¹² F/m. The papers print 8.854 × 10⁻¹², and every stated 4-significant-figure value is the same either way.

**Goal:** five in-depth ideas.
- `em1.electrostatics.coulomb`:
  - ① Coulomb's law in vector form
  - ② Superposition of forces
- `em1.electrostatics.field`:
  - ③ E = F/q and the point-charge field
  - ④ Superposing fields
  - ⑤ Fields of line and sheet charges

Two new plate components carry the physics:
- `coulomb-force`: the force on one charge, in N.
- `e-probe`: E at any point, in V/m.

`charges` gains labels, a draw scale and an oblique 3D view, so nanometre, micrometre and millimetre problems draw at a readable size while the readouts stay exact.

**Sources (catalog ids):** `lec2b` (Example 1), `mst2324` (Q1, Q2(a, b), Q3(b)), `f2425` (Q1(b)), `hw02-2324` (2.4), and the Hayt four-charge example already in the course.

**Ledger:** `.superpowers/sdd/2026-09-27-forma-plan-g1-coulomb-field/progress.md`

## Global Constraints

These are the same as Plan F3: the depth floor, the number lint, the givens policy, and item ids. There are three new points:
- **Forces are in newtons (N), which the lint does not read.** Force readouts are backed by claims. Fields in V/m are linted, so write field values as plain numbers (e.g. "17975 V/m") or in scientific form ("6.776 × 10⁶ V/m", which the lint does not read). Never split digits with spaces, as in "35 950 V/m".
- **Charges on the plate are in µC.** A nanocoulomb charge is written `q: 0.025` with a `label` such as "q1 = 25 nC".
- **Answers are vectors when the question asks for a force or a field.** The lecturer deducts heavily for magnitude-only answers (a graded HW02 2.4(a) lost most of its marks this way). Every force or field example states the vector.

## Review Focus

1. **Force on the right charge.** `coulomb-force` with `on: "b"` gives the force on b due to all the others, never including b itself. Tested in Task 1 against lecture Example 1: F12 = −9.986âₓ + 19.97âᵧ − 19.97âz N.
2. **Nanometre scale.** `e-probe` must not return null at nanometre distances. Its singular radius is 1e-15 m, not the field-arrows' 1e-9 m. Tested in Task 1 with HW02 2.4(b) at 2.45 nm.
3. **Oblique drawing matches the readouts.** In oblique mode, `charges`, `coulomb-force` and `e-probe` all draw with `toSvg3(pos × drawScale)`. A drag divides by `drawScale`. Tested in Task 1: a view unit test compares the projected positions.
4. **The MST Q2(b) signs.** E = −47.65âₓ + 46.39âᵧ − 77.99âz TV/m, with all three signs checked. The OCR of the lecturer's solution loses the signs; ours come from the geometry. Tested by claims in Task 5.
5. **Coverage per concept.** Each idea owns an objective. Tested in Task 7.

---

### Task 1: `charges` labels, draw scale and oblique view; `coulomb-force`; `e-probe`

**Files:**
- Modify: `app/packages/plate/src/components/em.ts`, `app/apps/web/components/plate/views2d.tsx` (charges view and the new views), `app/apps/web/components/plate/Readouts.tsx`
- Test: `app/packages/plate/test/em-g1.test.ts` (new)

**Interfaces:**
- **`charges`:** the point item gains `label?: string`, and the params gain `drawScale = 1` and `oblique = false`. Neither affects the model.
- **`coulomb-force`**
  - params: `{ on: string, drawScale = 1, oblique = false }`; links `charges`.
  - model: `{ Fx, Fy, Fz, Fmag, R?, at }` in N and m. `R` is present only when exactly one other point charge exists. `at` is the target's position.
  - readouts: `Fx`, `Fy`, `Fz`, `Fmag` (unit "N") and `R` (unit "m").
- **`e-probe`**
  - params: `{ point: V3, drawScale = 1, oblique = false, draggable = false }`; links `charges`; handles `["point"]`.
  - model: `{ Ex, Ey, Ez, Emag }` in V/m. Each value is null within 1e-15 m of a point charge.

- [ ] **Step 1: Write the failing test** at `app/packages/plate/test/em-g1.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const frame = (items: unknown[], extra: unknown[]) => {
  const p = PlateDef.parse({
    id: "t", title: "t",
    instances: [{ id: "q", component: "charges", params: { items }, visible: true }, ...extra],
    steps: [{ id: "s", title: "t", note: "n" }],
  });
  return createEvaluator(reg, p.instances)(stateAt(p, 0));
};
const pt = (id: string, q: number, pos: number[]) => ({ id, kind: "point", q, pos });

describe("coulomb-force", () => {
  it("lecture 2b Example 1: F12 on Q2 = −9.986, 19.97, −19.97 N, R = 3 m", () => {
    const f = frame([pt("a", 300, [1, 2, 3]), pt("b", -100, [2, 0, 5])], [{ id: "f", component: "coulomb-force", params: { on: "b" }, links: { charges: "q" }, visible: true }]);
    const m = f.f!.model as Record<string, number>;
    expect(m.Fx).toBeCloseTo(-9.98617, 4);
    expect(m.Fy).toBeCloseTo(19.9723, 3);
    expect(m.Fz).toBeCloseTo(-19.9723, 3);
    expect(m.R).toBeCloseTo(3, 12);
  });
  it("Newton's third law: the force on a is minus the force on b", () => {
    const items = [pt("a", 2, [-0.8, 0, 0]), pt("b", -1, [0.8, 0, 0])];
    const on = (id: string) => frame(items, [{ id: "f", component: "coulomb-force", params: { on: id }, links: { charges: "q" }, visible: true }]).f!.model.Fx as number;
    expect(on("a")).toBeCloseTo(-on("b"), 15);
    expect(on("b")).toBeCloseTo(-0.00702152, 7);
  });
  it("omits R with three charges", () => {
    const m = frame([pt("a", 2, [0, 0, 0]), pt("b", -1, [1, 0, 0]), pt("c", 1, [0, 0, 1])], [{ id: "f", component: "coulomb-force", params: { on: "c" }, links: { charges: "q" }, visible: true }]).f!.model;
    expect("R" in m).toBe(false);
    expect(m.Fx as number).toBeCloseTo(0.00317758, 7);
    expect(m.Fz as number).toBeCloseTo(0.0147975, 6);
  });
});

describe("e-probe", () => {
  it("HW02 2.4(b): 2.45 nm from −6.76 µC, |E| = 1.012e22 V/m, pointing at the charge", () => {
    const m = frame([pt("a", -6.76, [0, 0, 0])], [{ id: "e", component: "e-probe", params: { point: [2.45e-9, 0, 0] }, links: { charges: "q" }, visible: true }]).e!.model as Record<string, number>;
    expect(m.Emag).toBeCloseTo(1.01218e22, -17);
    expect(m.Ex).toBeLessThan(0);
  });
  it("MST Q2(b): E at P(1, 2, 5) µm", () => {
    const u = 1e-6;
    const m = frame([pt("a", 0.5, [4 * u, -3 * u, 7 * u]), pt("b", -0.3, [2 * u, -3 * u, 1 * u])], [{ id: "e", component: "e-probe", params: { point: [u, 2 * u, 5 * u] }, links: { charges: "q" }, visible: true }]).e!.model as Record<string, number>;
    expect(m.Ex / 1e12).toBeCloseTo(-47.6464, 3);
    expect(m.Ey / 1e12).toBeCloseTo(46.3906, 3);
    expect(m.Ez / 1e12).toBeCloseTo(-77.9913, 3);
  });
  it("is null on a charge", () => {
    expect(frame([pt("a", 1, [0, 0, 0])], [{ id: "e", component: "e-probe", params: { point: [0, 0, 0] }, links: { charges: "q" }, visible: true }]).e!.model.Emag).toBeNull();
  });
});
```

Check the MST value by hand: with the package ε₀, E = (−47.6464, 46.3906, −77.9913) × 10¹² V/m. The paper's ε₀ = 8.854 × 10⁻¹² gives (−47.6468, 46.3914, −77.9925) × 10¹²; the two agree to 4 significant figures.

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/plate/test/em-g1.test.ts`
Expected: FAIL (unknown component `coulomb-force`).

- [ ] **Step 3: Implement** in `em.ts`
- **`ChargeItem` point variant:** add `label: z.string().optional()`.
- **`Charges.params`:** becomes `z.object({ items: z.array(ChargeItem).min(1), drawScale: z.number().positive().default(1), oblique: z.boolean().default(false) })`.
- **New components**, placed after `FaradaySpheres`:

```ts
const itemToSI = toSI; // the existing mapper, reused

export const CoulombForce = defineComponent({
  id: "coulomb-force",
  params: z.object({ on: z.string(), drawScale: z.number().positive().default(1), oblique: z.boolean().default(false) }),
  links: ["charges"],
  model: (p, ctx) => {
    const items = ctx.link("charges").params.items as Item[];
    const target = items.find((i) => i.id === p.on && i.kind === "point");
    if (!target || target.kind !== "point") return {};
    const at = target.pos as Vec3;
    const others = items.filter((i) => i.id !== p.on);
    const E = electricField(others.map(itemToSI), at);
    const q = target.q * 1e-6;
    const F: Vec3 = [E[0] * q, E[1] * q, E[2] * q];
    const pts = others.filter((i) => i.kind === "point") as Extract<Item, { kind: "point" }>[];
    const R = pts.length === 1 && others.length === 1 ? norm([at[0] - pts[0]!.pos[0], at[1] - pts[0]!.pos[1], at[2] - pts[0]!.pos[2]]) : undefined;
    return { Fx: F[0], Fy: F[1], Fz: F[2], Fmag: norm(F), at, ...(R === undefined ? {} : { R }) };
  },
  handles: [],
  readouts: { Fx: "N", Fy: "N", Fz: "N", Fmag: "N", R: "m" },
  quotable: { Fx: "N", Fy: "N", Fz: "N", Fmag: "N", R: "m" },
});

export const EProbe = defineComponent({
  id: "e-probe",
  params: z.object({ point: V3, drawScale: z.number().positive().default(1), oblique: z.boolean().default(false), draggable: z.boolean().default(false) }),
  links: ["charges"],
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const pt = p.point as Vec3;
    const onCharge = cs.some((c) => c.kind === "point" && norm([pt[0] - c.pos[0], pt[1] - c.pos[1], pt[2] - c.pos[2]]) < 1e-15);
    if (onCharge) return { Ex: null, Ey: null, Ez: null, Emag: null };
    const E = electricField(cs, pt);
    return { Ex: E[0], Ey: E[1], Ez: E[2], Emag: norm(E) };
  },
  handles: ["point"],
  readouts: { Ex: "V/m", Ey: "V/m", Ez: "V/m", Emag: "V/m" },
  quotable: { Ex: "V/m", Ey: "V/m", Ez: "V/m", Emag: "V/m" },
});
```

- Import `norm` from `@forma/physics` if it isn't already imported.
- Add `CoulombForce` and `EProbe` to `emComponents`.
- If `Charge`'s point type names its position differently, adapt `c.pos` to match. The `Charge` type in `@forma/physics` uses `pos`.

- [ ] **Step 4: Views** (in `views2d.tsx`).
  - Import `toSvg3` from `@forma/plate`.
  - Add one helper, and use it everywhere a charge, force or probe position is drawn:

    ```ts
    const place = (p: readonly number[], k: number, oblique: boolean) => (oblique ? toSvg3(p.map((v) => v * k)) : toSvg(p.map((v) => v * k)));
    ```

  - **`ChargesView`:**
    - Read `drawScale` (k) and `oblique` from `ev.params`.
    - Point charges are drawn at `place(it.pos, k, oblique)`.
    - The label becomes `it.label ?? \`${it.q > 0 ? "+" : ""}${it.q} µC\``.
    - A drag divides by k: `move(it.id, [r2(mx / k), it.pos[1], r2(mz / k)])`. Disable dragging when `oblique` is true (set `can` false). Keyboard moves step by `STEP / k`.
    - Line and sheet items: scale their `x` and `z0` by k in the 2D drawing.
  - **`CoulombForceView`:** an arrow from `place(model.at)` along F's direction, with a fixed drawn length of 70 px, label "F", tone `charge`, and `aria-label="Force F on {on}"`. Compute the direction in screen space: `place(at + F̂·0.01/k) − place(at)`, then normalise. This keeps the arrow direction correct in oblique mode.
  - **`EProbeView`:**
    - A small cross at `place(point)`, plus an arrow along E drawn the same way as the force arrow (70 px, tone `field`, label "E").
    - If `draggable` and editable (2D only), add a drag handle exactly like the charges view, dividing by k.
    - `aria-label` reads `Field probe at x …, y …, z … m`.
  - Register both views: `"coulomb-force": CoulombForceView, "e-probe": EProbeView`.
  - **Labels** in `Readouts.tsx`:
    - `LABEL`: `Fx: "Fₓ", Fy: "Fᵧ", Fz: "F_z", Fmag: "|F|", R: "Separation R", Ex: "Eₓ", Ey: "Eᵧ", Ez: "E_z", Emag: "|E|"`.
    - `TONE`: `Fmag: "charge", Emag: "field"`.

- [ ] **Step 5: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS. Existing plates are unchanged because `drawScale` defaults to 1 and `oblique` to false.

- [ ] **Step 6: Commit**

```bash
git add packages apps/web && git commit -m "feat(plate): coulomb-force and e-probe; charges get labels, draw scale and an oblique view

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: Templates

**Files:** Modify `app/packages/course-em1/src/templates.ts`. Test: `app/packages/course-em1/test/templates-g1.test.ts` (new).

- [ ] **Step 1: Write the failing test**

```ts
import { instantiate } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { templates } from "../src";

describe("G1 templates", () => {
  for (const id of ["coulomb-mag", "e-point", "e-line"]) {
    it(`${id}: 50 seeds, finite, worked, distractors differ`, () => {
      const t = templates.find((x) => x.id === id)!;
      expect(t, id).toBeDefined();
      for (let s = 1; s <= 50; s++) {
        const v = instantiate(t, s);
        expect(Number.isFinite(v.spec.answer.value)).toBe(true);
        expect(v.worked.length).toBeGreaterThan(0);
        for (const d of v.spec.distractors) expect(Math.abs(d.value / v.spec.answer.value - 1) > 1e-6).toBe(true);
      }
    });
  }
  it("coulomb-mag: 1 µC and 1 µC at 5 cm is 3.595 N", () => {
    expect(templates.find((x) => x.id === "coulomb-mag")!.solve({ q1: 1, q2: 1, d: 5 } as never).answer.value).toBeCloseTo(3.595, 3);
  });
  it("e-line: 2000 nC/m at 100 cm is 35950 V/m", () => {
    expect(templates.find((x) => x.id === "e-line")!.solve({ rl: 2000, rho: 100 } as never).answer.value).toBeCloseTo(35950, 0);
  });
});
```

- [ ] **Step 2: Run it** (`pnpm vitest run packages/course-em1/test/templates-g1.test.ts`). Expected: FAIL.

- [ ] **Step 3: Implement.** Reuse `EPS0` (already in `templates.ts`) and F3's `sig`.

```ts
const KE = 1 / (4 * Math.PI * EPS0);

const coulombMag = defineTemplate<{ q1: number; q2: number; d: number }>({
  id: "coulomb-mag",
  params: { q1: { min: 1, max: 9, step: 1 }, q2: { min: 1, max: 9, step: 1 }, d: { min: 5, max: 50, step: 5 } },
  prompt: (p) => `Two point charges, ${p.q1} µC and −${p.q2} µC, are ${p.d} cm apart in free space. Find the size of the force between them.`,
  solve: (p) => ({
    answer: { value: sig((KE * p.q1 * 1e-6 * p.q2 * 1e-6) / (p.d / 100) ** 2), unit: "N" },
    distractors: [{ value: sig((KE * p.q1 * 1e-6 * p.q2 * 1e-6) / p.d ** 2), unit: "N", errorClass: "unit", feedback: "That leaves the distance in centimetres. Convert to metres before squaring." }],
  }),
  hints: () => ["|F| = |Q1Q2| / (4πε₀R²).", "Charges in coulombs, R in metres.", "k = 1/(4πε₀) ≈ 8.988 × 10⁹ N·m²/C²."],
  worked: (p) => [
    { text: `Q1 = ${p.q1} × 10⁻⁶ C, Q2 = ${p.q2} × 10⁻⁶ C, R = ${p.d / 100} m.` },
    { text: `|F| = 8.988 × 10⁹ × ${p.q1 * p.q2} × 10⁻¹² / ${sig((p.d / 100) ** 2, 4)} = ${sig((KE * p.q1 * 1e-6 * p.q2 * 1e-6) / (p.d / 100) ** 2)} N, attractive (opposite signs).` },
  ],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.coulomb"], misconceptions: [], difficulty: 1 },
});

const ePoint = defineTemplate<{ q: number; r: number }>({
  id: "e-point",
  params: { q: { min: 1, max: 9, step: 1 }, r: { min: 5, max: 50, step: 5 } },
  prompt: (p) => `Find |E| at ${p.r} cm from a ${p.q} nC point charge in free space.`,
  solve: (p) => ({
    answer: { value: sig((KE * p.q * 1e-9) / (p.r / 100) ** 2), unit: "V/m" },
    distractors: [{ value: sig((KE * p.q * 1e-9) / (p.r / 100)), unit: "V/m", errorClass: "conceptual", feedback: "E falls as 1/R², not 1/R. Square the distance." }],
  }),
  hints: () => ["|E| = Q / (4πε₀R²).", "R in metres, Q in coulombs.", "Square R."],
  worked: (p) => [{ text: `|E| = 8.988 × 10⁹ × ${p.q} × 10⁻⁹ / (${p.r / 100})² = ${sig((KE * p.q * 1e-9) / (p.r / 100) ** 2)} V/m.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.field"], misconceptions: [], difficulty: 1 },
});

const eLine = defineTemplate<{ rl: number; rho: number }>({
  id: "e-line",
  params: { rl: { min: 500, max: 5000, step: 500 }, rho: { min: 10, max: 100, step: 10 } },
  prompt: (p) => `An infinite line carries ρL = ${p.rl} nC/m. Find |E| at ${p.rho} cm from it.`,
  solve: (p) => ({
    answer: { value: sig((p.rl * 1e-9) / (2 * Math.PI * EPS0 * (p.rho / 100))), unit: "V/m" },
    distractors: [{ value: sig((p.rl * 1e-9) / (4 * Math.PI * EPS0 * (p.rho / 100))), unit: "V/m", errorClass: "conceptual", tag: "LINE_FIELD_FORM", feedback: "A line's field is ρL/(2πε₀ρ): 2π, not 4π." }],
  }),
  hints: () => ["E = ρL / (2πε₀ρ) for an infinite line.", "ρ in metres.", "It falls as 1/ρ, not 1/ρ²."],
  worked: (p) => [{ text: `E = ${p.rl} × 10⁻⁹ / (2π × 8.854 × 10⁻¹² × ${p.rho / 100}) = ${sig((p.rl * 1e-9) / (2 * Math.PI * EPS0 * (p.rho / 100)))} V/m.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.field"], misconceptions: ["LINE_FIELD_FORM"], difficulty: 2 },
});
```

Append `coulombMag, ePoint, eLine` to `templates`. Then run the test and see it PASS. Commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Coulomb, point-field and line-field templates

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: The Coulomb concept, and Idea ①, Coulomb's law in vector form

**Files:**
- Modify: `concepts/electrostatics.ts` (the `coulomb` header and lessons), `plates/index.ts`
- Create: `plates/idea-coulomb-law.ts`

- [ ] **Step 1: The concept header.** In `coulomb`:
  - `objectives`: `["Compute the force between two point charges in vector form, with units.", "Apply superposition to find the net force from several charges."]`
  - `misconceptions`:

    ```ts
    [
      { tag: "FORCE_MAGNITUDE_ONLY", description: "Gives |F| when the question asks for the force (a vector).", remediation: "em1.electrostatics.coulomb/main" },
      { tag: "COULOMB_DIRECTION", description: "Points the force the wrong way: wrong R order or ignoring the sign of Q1Q2.", remediation: "em1.electrostatics.coulomb/main" },
      { tag: "SUPERPOSITION_MAGNITUDES", description: "Adds force magnitudes instead of vectors.", remediation: "em1.electrostatics.coulomb/main" },
    ]
    ```

  - Lessons: rename the existing `main` to `quick` ("Quick refresher: force between point charges"). Put a new `main` first ("Coulomb's law (in depth)", minutes 50) whose blocks are the two idea plates. Task 3 adds `idea-coulomb-law`; Task 4 appends `idea-superposition`.
  - Run `grep -rn "coulomb/main" app --include=*.ts --include=*.tsx`. Point any hit that meant the classic lesson at `quick`.

- [ ] **Step 2: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const cm = instantiate(templates.find((t) => t.id === "coulomb-mag")!, 1);
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const BASE = [pt("a", 2, [-0.8, 0, 0], "Q1 = +2 µC"), pt("b", 1, [0.8, 0, 0], "Q2 = +1 µC")];
const EX1 = { items: [pt("a", 300, [1, 2, 3], "Q1 = 3×10⁻⁴ C at M"), pt("b", -100, [2, 0, 5], "Q2 = −1×10⁻⁴ C at N")], oblique: true, drawScale: 0.3 };
const mm = 1e-3;
const MST = { items: [pt("a", 0.025, [2 * mm, 2 * mm, 13 * mm], "q1 = +25.0 nC"), pt("b", -0.042, [10 * mm, 2 * mm, 7 * mm], "q2 = −42.0 nC")], oblique: true, drawScale: 120 };
const nm = 1e-9;
const F2425 = { items: [pt("a", 2.5, [1 * nm, 2 * nm, 3 * nm], "qA = +2.5 µC"), pt("b", -3.8, [0, 2 * nm, 8 * nm], "qB = −3.8 µC")], oblique: true, drawScale: 2e8 };

export const ideaCoulombLaw = defineIdeaPlate({
  id: "idea-coulomb-law",
  title: "Coulomb's law in vector form",
  requires: { objectives: [0], items: ["mst-2324-q1a", "mst-2324-q1b", "f2425-q1b", "hw-2324-2.4", "lecture:lec2b-ex1"], misconceptions: ["FORCE_MAGNITUDE_ONLY", "COULOMB_DIRECTION"] },
  instances: [
    { id: "q", component: "charges", params: { items: BASE } },
    { id: "fc", component: "coulomb-force", params: { on: "b" }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`|\mathbf F|=\dfrac{|Q_1Q_2|}{4\pi\varepsilon_0R^2}`, speech: "the size of F is Q1 Q2 over four pi epsilon nought R squared", shortSpeech: "Coulomb's law" } },
  ],
  ideas: [
    {
      id: "coulomb-law",
      title: "Coulomb's law in vector form",
      objectives: [0],
      explain: [
        {
          id: "law", title: "The law", show: ["q", "fc", "eq"], focus: ["q", "fc"],
          note: "Coulomb's law (1785): the force between two point charges is proportional to the product of the charges and inversely proportional to the square of their separation. In free space |F| = |Q1Q2|/(4πε₀R²), with ε₀ = 8.854 × 10⁻¹² F/m, so 1/(4πε₀) is about 8.988 × 10⁹ N·m²/C². On the plate, +2 µC and +1 µC sit 1.6 m apart, and the force on each is 0.007022 N.",
          claims: [{ instance: "fc", readout: "Fmag", value: 0.00702152, unit: "N" }, { instance: "fc", readout: "R", value: 1.6, unit: "m" }],
        },
        {
          id: "vector", title: "The vector form", patch: { eq: { latex: R`\mathbf F_{12}=\dfrac{Q_1Q_2}{4\pi\varepsilon_0R_{12}^2}\,\mathbf a_{12},\qquad \mathbf a_{12}=\dfrac{\mathbf R_{12}}{|\mathbf R_{12}|}`, speech: "F one two equals Q1 Q2 over four pi epsilon nought R squared, times the unit vector a one two", shortSpeech: "Coulomb's law, vector form" } }, focus: ["fc", "eq"],
          note: "A force is a vector, so the full law carries a direction. F12, the force on Q2 due to Q1, points along a12, the unit vector from Q1 to Q2: R12 = r2 − r1, divided by its length. When Q1Q2 is positive (like charges), F12 points along a12, away from Q1. That is repulsion. On the plate, the force on Q2 is +0.007022âₓ N: straight away from Q1.",
          claims: [{ instance: "fc", readout: "Fx", value: 0.00702152, unit: "N" }],
        },
        {
          id: "attract", title: "Opposite signs attract", patch: { q: { items: [BASE[0], pt("b", -1, [0.8, 0, 0], "Q2 = −1 µC")] } }, focus: ["q", "fc"],
          note: "Flip Q2 to −1 µC. Now Q1Q2 is negative, so F12 = (negative number) × a12 points against a12, back toward Q1: attraction. You never decide the direction by eye. The sign of Q1Q2 does it for you, as long as a12 runs from the charge exerting the force to the charge feeling it. On the plate, the force on Q2 is now −0.007022âₓ N.",
          claims: [{ instance: "fc", readout: "Fx", value: -0.00702152, unit: "N" }],
        },
        {
          id: "third-law", title: "Action and reaction", patch: { fc: { on: "a" } }, focus: ["fc"],
          note: "Switch to the force on Q1. It is F21 = −F12: the same size, opposite direction, as Newton's third law demands, even when the charges differ in size. The +2 µC charge pulls on the −1 µC charge exactly as hard as the −1 µC charge pulls on it. On the plate, F21 = +0.007022âₓ N, toward Q2.",
          claims: [{ instance: "fc", readout: "Fx", value: 0.00702152, unit: "N" }],
        },
        {
          id: "inverse-square", title: "Inverse square", patch: { fc: { on: "b" }, q: { items: [BASE[0], pt("b", -1, [1.6, 0, 0], "Q2 = −1 µC")] } }, focus: ["q", "fc"],
          note: "Move Q2 so the separation grows from 1.6 m to 2.4 m, one and a half times as far. The force falls by 1.5², to 0.003121 N. Double the distance and the force drops to a quarter. That steep fall-off is why a charge a few centimetres away can matter more than a much bigger one metres away.",
          claims: [{ instance: "fc", readout: "Fmag", value: 0.00312068, unit: "N" }, { instance: "fc", readout: "R", value: 2.4, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "lec-ex1", level: "basic", title: "Lecture 2b, Example 1",
          setup: { q: EX1, fc: { on: "b", oblique: true, drawScale: 0.3 } },
          problem: "Calculate the force that Q1 = 3 × 10⁻⁴ C at M(1, 2, 3) exerts on Q2 = −1 × 10⁻⁴ C at N(2, 0, 5), in a vacuum.",
          lines: [
            { text: "R12 = N − M = âₓ − 2âᵧ + 2âz, so R12 = 3 m and a12 = (âₓ − 2âᵧ + 2âz)/3.", focus: ["q"], claims: [{ instance: "fc", readout: "R", value: 3, unit: "m" }] },
            { text: "Size and sign: Q1Q2/(4πε₀R²) = (3 × 10⁻⁴)(−1 × 10⁻⁴)/(4π × 8.854 × 10⁻¹² × 9) = −29.96 N.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fmag", value: 29.9585, unit: "N" }] },
            { text: "F12 = −29.96 × (âₓ − 2âᵧ + 2âz)/3 = −9.986âₓ + 19.97âᵧ − 19.97âz N: Q2 is pulled back toward Q1.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: -9.98617, unit: "N" }, { instance: "fc", readout: "Fz", value: -19.9723, unit: "N" }] },
          ],
          covers: ["lecture:lec2b-ex1"],
          trap: "Writing |F| = 29.96 N and stopping. The question asks for the force, a vector: give all three components.",
        },
        {
          id: "mst", level: "tutorial", title: "MST 2023-24 Q1(b): millimetres and nanocoulombs",
          setup: { q: MST, fc: { on: "b", oblique: true, drawScale: 120 } },
          problem: "In a vacuum, q1 = +25.0 nC is at P1(2, 2, 13) mm and q2 = −42.0 nC is at P2(10, 2, 7) mm. (i) Find R12 and its length in metres. (ii) Calculate F12, the force on q2 due to q1. (iii) State the effect of changing only q2 to +42.0 nC.",
          lines: [
            { text: "R12 = P2 − P1 = 0.008âₓ − 0.006âz m, of length 0.010 m.", focus: ["q"], claims: [{ instance: "fc", readout: "R", value: 0.01, unit: "m" }] },
            { text: "Q1Q2/(4πε₀R²) = (25 × 10⁻⁹)(−42 × 10⁻⁹)/(4πε₀ × 10⁻⁴) = −0.09437 N; a12 = 0.8âₓ − 0.6âz.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fmag", value: 0.0943693, unit: "N" }] },
            { text: "F12 = −0.07550âₓ + 0.05662âz N: q2 is attracted toward q1.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: -0.0754954, unit: "N" }, { instance: "fc", readout: "Fz", value: 0.0566216, unit: "N" }] },
            { text: "(iii) With q2 = +42.0 nC the size is unchanged but the direction reverses: +0.07550âₓ − 0.05662âz N, a repulsion.", patch: { q: { items: [MST.items[0], pt("b", 0.042, [10 * mm, 2 * mm, 7 * mm], "q2 = +42.0 nC")] } }, focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 0.0754954, unit: "N" }] },
          ],
          covers: ["mst-2324-q1b"],
          trap: "Squaring 10 mm as if it were 10 m makes the force a million times too small. Convert R12 to metres first.",
        },
        {
          id: "finals", level: "exam", title: "Finals 2024-25 Q1(b)(i): nanometres",
          setup: { q: F2425, fc: { on: "b", oblique: true, drawScale: 2e8 } },
          problem: "qA = +2.5 µC and qB = −3.8 µC are fixed at A(1, 2, 3) nm and B(0, 2, 8) nm. Calculate F_AB, the force qA exerts on qB.",
          lines: [
            { text: "R_AB = B − A = (−1, 0, 5) nm, of length √26 nm = 5.099 × 10⁻⁹ m.", focus: ["q"], givens: [{ value: Math.sqrt(26) * 1e-9, unit: "m" }] },
            { text: "qAqB/(4πε₀R²) = (2.5 × 10⁻⁶)(−3.8 × 10⁻⁶)/(4πε₀ × 26 × 10⁻¹⁸) = −3.284 × 10¹⁵ N.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fmag", value: 3.28391e15, unit: "N" }] },
            { text: "a_AB = (−1, 0, 5)/√26, so F_AB = 6.440 × 10¹⁴ âₓ − 3.220 × 10¹⁵ âz N: huge, because the charges are only nanometres apart.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 6.44028e14, unit: "N" }, { instance: "fc", readout: "Fz", value: -3.22014e15, unit: "N" }] },
          ],
          covers: ["f2425-q1b"],
          trap: "Using R² = 26 instead of 26 × 10⁻¹⁸ m² gives a force 10¹⁸ times too small. The nm must become 10⁻⁹ m before squaring.",
        },
      ],
      asks: [
        { id: "k", q: "Should I use k = 9 × 10⁹ or 1/(4πε₀)?", a: "Use whatever the paper gives. The finals and the mid-semester test print ε₀ = 8.854 × 10⁻¹², which gives 1/(4πε₀) = 8.988 × 10⁹; the homework sheets allow k ≈ 9.00 × 10⁹. The difference is about 0.1%, so match the paper's constant and keep four significant figures." },
        { id: "which", q: "Is F12 the force on 1 or on 2?", tags: ["COULOMB_DIRECTION"], a: "On 2, due to 1. Read the subscripts as 'from 1 to 2'. R12 = r2 − r1, and F12 acts on Q2. Swap both and you get F21, the force on Q1: the same size, opposite direction." },
        { id: "vector-marks", q: "Why do I lose marks for giving |F|?", tags: ["FORCE_MAGNITUDE_ONLY"], a: "Because 'find the force' asks for a vector. A magnitude alone says nothing about direction, which is half the physics. Give F = Fₓâₓ + Fᵧâᵧ + F_zâz, and add |F| if you like." },
        { id: "point", q: "What makes a charge a point charge?", a: "Its size is tiny compared with the distances involved, so all of it sits effectively at one point. The question's phrase 'infinitely small, isolated charges' is telling you exactly that." },
        { id: "gravity", q: "How strong is the electric force compared with gravity?", a: "Enormously stronger. Between a proton and an electron it is about 2 × 10³⁹ times their gravitational pull. Gravity wins in daily life only because matter is almost perfectly neutral." },
        { id: "square", q: "Why an inverse square?", a: "The influence of a charge spreads over spheres, whose area grows as 4πR². The same total spread over more area gets weaker as 1/R². Gauss's law, which you have met, is the same statement." },
        { id: "units", q: "What units come out?", a: "Coulombs times coulombs, divided by (F/m × m²), gives newtons. If your answer isn't in N, a unit went in wrong, usually a distance left in mm, cm or nm." },
      ],
      checks: [
        {
          id: "state", title: "Check: state the law (MST Q1(a))", show: ["q", "fc", "eq"], patch: { q: { items: BASE, oblique: false, drawScale: 1 }, fc: { on: "b", oblique: false, drawScale: 1 } },
          note: "Five checks on Coulomb's law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "state", type: "choose", prompt: "The vector form of Coulomb's law for the force on Q2 due to Q1 is…", dimension: "recognition",
            options: [
              choice("right", "F12 = Q1Q2 / (4πε₀R12²) · a12, with a12 from Q1 to Q2", true, "Right: the size and the direction together."),
              choice("mag", "|F| = Q1Q2 / (4πε₀R²)", false, "That is only the size. The vector form needs a12.", "FORCE_MAGNITUDE_ONLY"),
              choice("flip", "F12 = Q1Q2 / (4πε₀R12²) · a21", false, "a21 points from Q2 to Q1, the wrong way for the force on Q2.", "COULOMB_DIRECTION"),
            ] },
          covers: ["mst-2324-q1a"],
        },
        {
          id: "predict-double", title: "Check: double the distance",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-double", type: "predict-drag", prompt: "Q2 moves so the separation doubles, from 1.6 m to 3.2 m. Drag |F| to your prediction.", target: { instance: "fc", readout: "Fmag" }, range: [0, 0.01], unit: "N", relTol: 0.05, reveal: { q: { items: [BASE[0], pt("b", 1, [2.4, 0, 0], "Q2 = +1 µC")] } }, dimension: "conceptual",
            feedback: { close: "Right: a quarter, 0.001755 N.", far: "Inverse square: double R and |F| falls to a quarter, 0.001755 N." } },
        },
        {
          id: "mag-num", title: "Check: a force, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "mag-num", type: "numeric", prompt: cm.prompt, answer: cm.spec.answer, distractors: cm.spec.distractors, relTol: cm.spec.relTol, hints: cm.hints, template: "coulomb-mag", dimension: "computational" },
        },
        {
          id: "hw24a", title: "Check: HW02 2.4(a)",
          note: "A homework question the lecturer reuses. Give the x-component.",
          interaction: { id: "hw24a", type: "numeric", prompt: "Q1 = 5 µC and Q2 = −4 µC are at (2, 1, 3) cm and (−4, 0, 6) cm. Find the x-component of the force on Q1.", answer: { value: -34.57, unit: "N" }, relTol: 0.01, dimension: "application",
            distractors: [
              { value: 34.57, unit: "N", errorClass: "sign", feedback: "The charges attract, so Q1 is pulled toward Q2, which lies at negative x relative to it." },
              { value: -0.003457, unit: "N", errorClass: "unit", feedback: "That keeps R in centimetres. Convert to metres before squaring." },
            ],
            hints: ["The force on Q1 is along R21 = r1 − r2 = (6, 1, −3) cm.", "|R21| = √46 cm = 0.06782 m.", "F = Q1Q2/(4πε₀R²) a21; its size is 39.08 N."] },
          covers: ["hw-2324-2.4"],
        },
        {
          id: "flip", title: "Check: flip a sign (MST Q1(b)(iii))",
          note: "Last one.",
          interaction: { id: "flip", type: "choose", prompt: "Changing only q2 from −42.0 nC to +42.0 nC makes F12…", dimension: "conceptual",
            options: [
              choice("rev", "the same size, pointing the opposite way", true, "Right: the sign of Q1Q2 flips, so the direction reverses."),
              choice("zero", "zero", false, "Both charges are still there; only the sign changed."),
              choice("same", "exactly the same", false, "The product Q1Q2 changed sign, and that flips F12.", "COULOMB_DIRECTION"),
            ] },
          covers: ["mst-2324-q1b"],
        },
      ],
      recap: {
        points: [
          "F12 = Q1Q2/(4πε₀R12²) a12, with R12 = r2 − r1 running from the source to the charge feeling the force.",
          "The sign of Q1Q2 sets the direction: positive repels, negative attracts.",
          "F21 = −F12 (Newton's third law).",
          "Inverse square: double R and the force falls to a quarter.",
          "Convert mm, cm and nm to metres, and nC and µC to coulombs, before substituting; give the vector.",
        ],
        traps: ["Giving |F| alone.", "Using R12 the wrong way round.", "Squaring a distance still in mm or nm."],
      },
    },
  ],
});
```

- [ ] **Step 3: Register it** in `plates/index.ts` and put it first in coulomb `main`. Then run:

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS. Two details:
- The Task 3 `predict-double` value is 0.00702152 / 4 = 0.00175538 N; the feedback states 0.001755.
- HW02 2.4(a) answer: Fₓ = −34.57 N (the full vector is −34.57âₓ − 5.762âᵧ + 17.28âz N).

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Coulomb at depth; Idea 1, Coulomb's law in vector form (lecture Example 1, MST Q1, Finals Q1(b))

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: Idea ②, Superposition of forces

**Files:** Create `plates/idea-superposition.ts`. Append its block to coulomb `main`, and register it.

- [ ] **Step 1: The idea plate**

```ts
import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const Q1 = pt("q1", 2, [0, 0, 0], "Q1 = +2 µC");
const Q2 = pt("q2", -1, [1, 0, 0], "Q2 = −1 µC");
const Q3 = pt("q3", 1, [0, 0, 1], "Q3 = +1 µC");
const mm = 1e-3;

export const ideaSuperposition = defineIdeaPlate({
  id: "idea-superposition",
  title: "Superposition of forces",
  requires: { objectives: [1], items: [], misconceptions: ["SUPERPOSITION_MAGNITUDES"] },
  instances: [
    { id: "q", component: "charges", params: { items: [Q1, Q3] } },
    { id: "fc", component: "coulomb-force", params: { on: "q3" }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\mathbf F_{3}=\mathbf F_{13}+\mathbf F_{23}+\cdots`, speech: "the force on Q3 is the vector sum of the forces from each other charge", shortSpeech: "superposition" } },
  ],
  ideas: [
    {
      id: "superposition",
      title: "Superposition of forces",
      objectives: [1],
      explain: [
        {
          id: "one", title: "One charge at a time", show: ["q", "fc", "eq"], focus: ["q", "fc"],
          note: "With several charges, the force on one of them is found one partner at a time. Start with just Q1 = +2 µC at the origin and Q3 = +1 µC at (0, 0, 1) m. The force on Q3 is straight up, 0.01798 N, pushed away from Q1.",
          claims: [{ instance: "fc", readout: "Fz", value: 0.0179751, unit: "N" }],
        },
        {
          id: "add", title: "Add a second charge: add vectors", patch: { q: { items: [Q1, Q2, Q3] } }, focus: ["q", "fc"],
          note: "Add Q2 = −1 µC at (1, 0, 0) m. On its own it would pull Q3 toward itself with 0.004494 N along (1, 0, −1)/√2, which is +0.003178âₓ − 0.003178âz N. Coulomb forces don't interfere with one another, so the total is simply the vector sum: F3 = 0.003178âₓ + 0.01480âz N, with |F3| = 0.01513 N. Notice that 0.01798 + 0.004494 = 0.02247 is not the answer: magnitudes don't add.",
          claims: [{ instance: "fc", readout: "Fx", value: 0.00317758, unit: "N" }, { instance: "fc", readout: "Fz", value: 0.0147975, unit: "N" }, { instance: "fc", readout: "Fmag", value: 0.0151349, unit: "N" }],
        },
        {
          id: "why", title: "Why superposition works", focus: ["q", "fc"], patch: { eq: { latex: R`\mathbf F_{Q}=\sum_{i}\dfrac{Q\,Q_i}{4\pi\varepsilon_0R_{iQ}^2}\,\mathbf a_{iQ}`, speech: "the force on Q is the sum over every other charge", shortSpeech: "superposition sum" } },
          note: "Electrostatics is linear. The force from Q1 on Q3 is the same whether or not Q2 is present, so each pair can be worked out separately and the results added. The recipe is the same for any number of charges: for each partner, find R (end minus start), the size with its sign, and the unit vector, then add components. For charge spread continuously, the sum becomes an integral, which is the next concept.",
        },
        {
          id: "cancel", title: "Symmetry cancels components", patch: { q: { items: [pt("a", 1, [0, 0, 0], "+1 µC"), pt("b", 1, [2, 0, 0], "+1 µC"), pt("t", -1, [1, 0, 1], "−1 µC")] }, fc: { on: "t" } }, focus: ["q", "fc"],
          note: "Place two equal +1 µC charges at (0, 0, 0) and (2, 0, 0) m, and a −1 µC charge at (1, 0, 1) m, midway above them. Each pulls it with 0.004494 N, one toward the lower left and one toward the lower right. The x-parts cancel exactly and the z-parts add: F = −0.006355âz N. Spot a symmetry like this and you can skip half the arithmetic.",
          claims: [{ instance: "fc", readout: "Fx", value: 0, unit: "N" }, { instance: "fc", readout: "Fz", value: -0.00635516, unit: "N" }],
        },
      ],
      examples: [
        {
          id: "three", level: "basic", title: "Three charges",
          setup: { q: { items: [Q1, Q2, Q3] }, fc: { on: "q3" } },
          problem: "Q1 = +2 µC at the origin, Q2 = −1 µC at (1, 0, 0) m and Q3 = +1 µC at (0, 0, 1) m. Find the force on Q3.",
          lines: [
            { text: "From Q1: R13 = (0, 0, 1) m, and the size is 8.988 × 10⁹ × 2 × 10⁻¹² / 1 = 0.01798 N, so F13 = 0.01798âz N (repulsion).", focus: ["q"] },
            { text: "From Q2: R23 = (−1, 0, 1) m, R = √2 m. Q2Q3 < 0, so the force points back toward Q2: F23 = 0.004494 × (1, 0, −1)/√2 = 0.003178âₓ − 0.003178âz N.", focus: ["q"] },
            { text: "Add: F3 = 0.003178âₓ + 0.01480âz N, with |F3| = 0.01513 N.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 0.00317758, unit: "N" }, { instance: "fc", readout: "Fmag", value: 0.0151349, unit: "N" }] },
          ],
          trap: "Pointing F23 away from Q2. Q2 is negative and Q3 positive, so they attract: the force on Q3 points toward Q2.",
        },
        {
          id: "symmetric", level: "tutorial", title: "Using symmetry",
          setup: { q: { items: [pt("a", 1, [0, 0, 0], "+1 µC"), pt("b", 1, [2, 0, 0], "+1 µC"), pt("t", -1, [1, 0, 1], "−1 µC")] }, fc: { on: "t" } },
          problem: "Two +1 µC charges sit at (0, 0, 0) and (2, 0, 0) m. Find the force on a −1 µC charge at (1, 0, 1) m.",
          lines: [
            { text: "Each partner is √2 m away, so each force has size 8.988 × 10⁹ × 10⁻¹² / 2 = 0.004494 N, pointing toward that partner (attraction).", focus: ["q"] },
            { text: "The x-parts, −0.003178 and +0.003178, cancel by symmetry.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 0, unit: "N" }] },
            { text: "The z-parts add: F = −2 × 0.003178âz = −0.006355âz N.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fz", value: -0.00635516, unit: "N" }] },
          ],
          trap: "Adding the two magnitudes, 0.008988 N, ignores their directions. Only the z-parts survive.",
        },
        {
          id: "mm", level: "exam", title: "Superposition in millimetres",
          setup: { q: { items: [pt("a", 0.01, [0, 0, 0], "Q1 = +10 nC"), pt("b", -0.02, [30 * mm, 0, 0], "Q2 = −20 nC"), pt("c", 0.005, [0, 0, 40 * mm], "Q3 = +5 nC")], drawScale: 30 }, fc: { on: "c", drawScale: 30 } },
          problem: "Q1 = +10 nC at the origin, Q2 = −20 nC at (30, 0, 0) mm and Q3 = +5 nC at (0, 0, 40) mm. Find the force on Q3, in vector form.",
          lines: [
            { text: "From Q1: R = 0.040 m, size 8.988 × 10⁹ × 50 × 10⁻¹⁸ / 0.0016 = 2.809 × 10⁻⁴ N, upward: F13 = 2.809 × 10⁻⁴ âz N.", focus: ["q"], givens: [{ value: 0.04, unit: "m" }] },
            { text: "From Q2: R23 = (−0.030, 0, 0.040) m, R = 0.050 m, size 3.595 × 10⁻⁴ N, pulled toward Q2: F23 = 3.595 × 10⁻⁴ × (0.6, 0, −0.8) = 2.157 × 10⁻⁴ âₓ − 2.876 × 10⁻⁴ âz N.", focus: ["q"], givens: [{ value: 0.05, unit: "m" }] },
            { text: "Add: F3 = 2.157 × 10⁻⁴ âₓ − 6.741 × 10⁻⁶ âz N. The vertical parts almost cancel, leaving a force pointing nearly along +x.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 0.000215701, unit: "N" }, { instance: "fc", readout: "Fz", value: -6.74066e-6, unit: "N" }] },
          ],
          trap: "Using the 30 mm or 40 mm gap directly as R for Q2. The distance from Q2 to Q3 is the hypotenuse, 50 mm.",
        },
      ],
      asks: [
        { id: "mags", q: "Why can't I just add the magnitudes?", tags: ["SUPERPOSITION_MAGNITUDES"], a: "Because forces in different directions partly cancel. Magnitudes add only when every force points the same way. Always add components: x with x, y with y, z with z." },
        { id: "order", q: "Does the order I add them in matter?", a: "No. Vector addition is commutative and associative. Add the forces in whatever order keeps your working tidy." },
        { id: "self", q: "Does a charge exert a force on itself?", a: "No. The sum runs over every other charge. On the plate, the force readout for Q3 never includes Q3." },
        { id: "linear", q: "What does 'linear system' mean here?", a: "Doubling any charge doubles its force, and adding a charge adds its force without changing the others. That is exactly what lets you work one pair at a time and then add." },
        { id: "many", q: "What about thousands of charges?", a: "The sum becomes an integral over a charge density ρL, ρS or ρv. The recipe doesn't change: a small piece of charge, its R and unit vector, then add everything up." },
        { id: "check", q: "How can I check a superposition answer?", a: "Look for symmetry: components that should cancel must come out zero. Also check the direction: each force points away from a like charge and toward an unlike one." },
      ],
      checks: [
        {
          id: "add-rule", title: "Check: how forces combine", show: ["q", "fc", "eq"], patch: { q: { items: [Q1, Q2, Q3], drawScale: 1 }, fc: { on: "q3", drawScale: 1 } },
          note: "Four checks on superposition. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "add-rule", type: "choose", prompt: "The net force on a charge from several others is…", dimension: "conceptual",
            options: [
              choice("vec", "the vector sum of the individual forces", true, "Right: add them component by component."),
              choice("mag", "the sum of their magnitudes", false, "Directions matter; forces can cancel.", "SUPERPOSITION_MAGNITUDES"),
              choice("biggest", "the largest single force", false, "Every partner contributes."),
            ] },
        },
        {
          id: "predict-remove", title: "Check: remove Q2",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-remove", type: "predict-drag", prompt: "Q2 is removed. Drag Fₓ on Q3 to your prediction.", target: { instance: "fc", readout: "Fx" }, range: [-0.01, 0.01], unit: "N", relTol: 0.05, reveal: { q: { items: [Q1, Q3] } }, dimension: "conceptual",
            feedback: { close: "Right: zero. Q1 is directly below Q3, so its force has no x-part.", far: "Only Q1 remains, straight below Q3, so Fₓ = 0." } },
        },
        {
          id: "cancel", title: "Check: symmetry",
          note: "Think before you compute.",
          interaction: { id: "cancel", type: "choose", prompt: "Four equal positive charges sit at the corners of a square. The net force on a positive charge at the square's centre is…", dimension: "conceptual",
            options: [
              choice("zero", "zero", true, "Right: opposite corners cancel in pairs."),
              choice("four", "four times one corner's force", false, "Opposite corners push in opposite directions.", "SUPERPOSITION_MAGNITUDES"),
              choice("up", "perpendicular to the square", false, "All four forces lie in the square's plane."),
            ] },
        },
        {
          id: "fz", title: "Check: the z-component",
          note: "Last one: the three-charge example.",
          interaction: { id: "fz", type: "numeric", prompt: "Q1 = +2 µC at the origin, Q2 = −1 µC at (1, 0, 0) m, Q3 = +1 µC at (0, 0, 1) m. Find F_z on Q3.", answer: { value: 0.0148, unit: "N" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0.02115, unit: "N", errorClass: "sign", feedback: "Q2 attracts Q3, so its z-part points down: subtract 0.003178, don't add it." }],
            hints: ["F13 is all z: 0.01798 N.", "F23's z-part is −0.004494/√2 = −0.003178 N.", "Add them."] },
        },
      ],
      recap: {
        points: [
          "The force on one charge is the vector sum of the forces from every other charge.",
          "Work one pair at a time: R (end minus start), the size with its sign, the unit vector.",
          "Add components, never magnitudes.",
          "Symmetry often cancels whole components.",
        ],
        traps: ["Adding magnitudes.", "Pointing an attractive force the wrong way.", "Using a side length where the hypotenuse is the distance."],
      },
    },
  ],
});
```

Check the distractor in `fz`: 0.01798 + 0.003178 = 0.02115, the sign slip.

- [ ] **Step 2: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 2 of Coulomb, superposition of forces

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 5: The field concept, and Ideas ③ and ④ (point-charge field; superposing fields)

**Files:**
- Modify: `concepts/electrostatics.ts` (the `field` header and lessons), `plates/index.ts`
- Create: `plates/idea-e-point.ts`, `plates/idea-e-superposition.ts`

- [ ] **Step 1: The concept header.** In `field`:
  - `objectives`: `["Define E and find the field of a point charge, as a vector.", "Superpose the fields of several point charges.", "Find E from infinite line and sheet charges."]`
  - `misconceptions`:

    ```ts
    [
      { tag: "E_DIRECTION_NEGATIVE", description: "Points E away from a negative charge.", remediation: "em1.electrostatics.field/main" },
      { tag: "LINE_FIELD_FORM", description: "Uses the point-charge form, or 4π instead of 2π, for a line charge.", remediation: "em1.electrostatics.field/main" },
      { tag: "SHEET_FIELD_DISTANCE", description: "Thinks an infinite sheet's field weakens with distance.", remediation: "em1.electrostatics.field/main" },
    ]
    ```

  - Rename the existing `main` to `quick`. Put a new `main` first ("The electric field (in depth)", minutes 70) holding the idea blocks: `idea-e-point`, then `idea-e-superposition` (both this task), then `idea-e-continuous` (Task 6).

- [ ] **Step 2: `plates/idea-e-point.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const ep = instantiate(templates.find((t) => t.id === "e-point")!, 1);
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const nm = 1e-9;

export const ideaEPoint = defineIdeaPlate({
  id: "idea-e-point",
  title: "E = F/q and the point-charge field",
  requires: { objectives: [0], items: ["mst-2324-q2a", "hw-2324-2.4", "f2425-q1b"], misconceptions: ["E_DIRECTION_NEGATIVE"] },
  instances: [
    { id: "q", component: "charges", params: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")] } },
    { id: "ep", component: "e-probe", params: { point: [1, 0, 0] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\mathbf E=\dfrac{\mathbf F}{q}=\dfrac{Q}{4\pi\varepsilon_0R^2}\,\mathbf a_R`, speech: "E equals F over q, which is Q over four pi epsilon nought R squared, along a R", shortSpeech: "electric field" } },
  ],
  ideas: [
    {
      id: "e-point",
      title: "E = F/q and the point-charge field",
      objectives: [0],
      explain: [
        {
          id: "define", title: "Force per unit charge", show: ["q", "ep", "eq"], focus: ["ep"],
          note: "The electric field intensity at a point is the force a small positive test charge would feel there, divided by that charge: E = F/q. It belongs to the point, not to the test charge; the test charge is just how you'd measure it. Its units are newtons per coulomb, the same as volts per metre. On the plate, 1 m from a +2 µC charge, E = 17975 V/m, pointing straight away from the charge.",
          claims: [{ instance: "ep", readout: "Emag", value: 17975.1, unit: "V/m" }, { instance: "ep", readout: "Ex", value: 17975.1, unit: "V/m" }],
        },
        {
          id: "inverse", title: "It falls as 1/R²", patch: { ep: { point: [2, 0, 0] } }, focus: ["ep"],
          note: "Divide Coulomb's law by the test charge and the field of a point charge is E = Q/(4πε₀R²) a_R, where a_R points from the charge to the field point. It inherits the inverse square: at 2 m the field is a quarter as strong, 4494 V/m.",
          claims: [{ instance: "ep", readout: "Emag", value: 4493.78, unit: "V/m" }],
        },
        {
          id: "negative", title: "A negative charge: E points inward", patch: { q: { items: [pt("a", -2, [0, 0, 0], "Q = −2 µC")] }, ep: { point: [1, 0, 0] } }, focus: ["q", "ep"],
          note: "Make the charge −2 µC. The formula doesn't change, but Q is negative, so E points against a_R: toward the charge. At 1 m, E = −17975âₓ V/m. The rule never needs memorising: a positive test charge is pushed away from a positive charge and pulled toward a negative one, and E follows the positive test charge.",
          claims: [{ instance: "ep", readout: "Ex", value: -17975.1, unit: "V/m" }],
        },
        {
          id: "force-from-field", title: "From field to force: F = qE", focus: ["ep", "eq"], patch: { eq: { latex: R`\mathbf F=q\,\mathbf E`, speech: "F equals q E", shortSpeech: "force from field" } },
          note: "Once you know E at a point, the force on any charge q placed there is F = qE. A test charge of one microcoulomb at the probe would feel 0.01798 N toward the −2 µC charge; a negative one of the same size would be pushed away just as hard. This is why the finals ask for F first and then say 'hence, compute E': E = F/q with the same vector, divided by the charge that felt it.",
        },
      ],
      examples: [
        {
          id: "basic", level: "basic", title: "The field of +2 µC at 1 m and 2 m",
          setup: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")] }, ep: { point: [1, 0, 0] } },
          problem: "A +2 µC charge sits at the origin. Find E at (1, 0, 0) m and at (2, 0, 0) m.",
          lines: [
            { text: "At (1, 0, 0): E = 8.988 × 10⁹ × 2 × 10⁻⁶ / 1² âₓ = 17975âₓ V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: 17975.1, unit: "V/m" }] },
            { text: "At (2, 0, 0): a quarter of that, 4494âₓ V/m.", patch: { ep: { point: [2, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: 4493.78, unit: "V/m" }] },
          ],
          trap: "Halving the field when the distance doubles. The field falls as 1/R², so doubling R quarters E.",
        },
        {
          id: "hw24b", level: "tutorial", title: "HW02 2.4(b): 2.45 nm from −6.76 µC",
          setup: { q: { items: [pt("a", -6.76, [0, 0, 0], "−6.76 µC")], drawScale: 4e8 }, ep: { point: [2.45 * nm, 0, 0], drawScale: 4e8 } },
          problem: "Calculate the field intensity at a distance of 2.45 nm from a −6.76 µC point charge.",
          lines: [
            { text: "R = 2.45 × 10⁻⁹ m, so R² = 6.003 × 10⁻¹⁸ m².", focus: ["q"], givens: [{ value: 2.45e-9, unit: "m" }] },
            { text: "|E| = 8.988 × 10⁹ × 6.76 × 10⁻⁶ / 6.003 × 10⁻¹⁸ = 1.012 × 10²² V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Emag", value: 1.01218e22, unit: "V/m" }] },
            { text: "The charge is negative, so E points toward it: E = −1.012 × 10²² a_R V/m.", focus: ["ep"] },
          ],
          covers: ["hw-2324-2.4"],
          trap: "Stopping at the size. A negative charge's field points inward; say so, with −a_R.",
        },
        {
          id: "finals", level: "exam", title: "Finals 2024-25 Q1(b)(ii): hence E_B",
          setup: { q: { items: [pt("a", 2.5, [1 * nm, 2 * nm, 3 * nm], "qA = +2.5 µC")], oblique: true, drawScale: 2e8 }, ep: { point: [0, 2 * nm, 8 * nm], oblique: true, drawScale: 2e8 } },
          problem: "From part (i), F_AB = 6.440 × 10¹⁴ âₓ − 3.220 × 10¹⁵ âz N acts on qB = −3.8 µC at B(0, 2, 8) nm. Hence compute E_B, the field at qB's location.",
          lines: [
            { text: "E_B = F_AB / qB, dividing the whole vector by −3.8 × 10⁻⁶ C.", focus: ["ep"] },
            { text: "E_B = −1.695 × 10²⁰ âₓ + 8.474 × 10²⁰ âz V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: -1.69482e20, unit: "V/m" }, { instance: "ep", readout: "Ez", value: 8.47405e20, unit: "V/m" }] },
            { text: "Check: this is the field of qA alone at B, pointing away from the positive qA. Dividing by a negative qB flipped the force's direction back.", focus: ["q", "ep"] },
          ],
          covers: ["f2425-q1b"],
          trap: "Dividing by +3.8 µC. qB is negative, so E_B points opposite to F_AB.",
        },
      ],
      asks: [
        { id: "test", q: "Why must the test charge be tiny?", a: "A big test charge would push the source charges around and change the very field you're measuring. Mathematically it cancels out of E = F/q, so you can picture a 1 C test charge, as the lecture notes do." },
        { id: "units", q: "Are N/C and V/m really the same?", a: "Yes. A volt is a joule per coulomb, and a joule is a newton-metre. So V/m = J/(C·m) = N·m/(C·m) = N/C." },
        { id: "neg", q: "Which way does E point near a negative charge?", tags: ["E_DIRECTION_NEGATIVE"], a: "Toward it. E is the force on a positive test charge, which is pulled toward a negative charge. In the formula the negative Q flips a_R." },
        { id: "at-charge", q: "What is E at the charge itself?", a: "Undefined: R = 0 makes the formula blow up. A point charge is an idealisation, and the field is asked for elsewhere. The plate's probe shows '—' if you put it on a charge." },
        { id: "define-marks", q: "How should I word the definition in an exam?", a: "'The electric field intensity at a point is the force per unit charge experienced by an infinitesimally small, positive test charge placed at that point.' Add E = F/q and the units, N/C or V/m." },
        { id: "field-real", q: "Is the field real, or just a calculation?", a: "Real: it carries energy and momentum. When charges move, changes in the field travel outward at the speed of light, and that is what light and radio are." },
      ],
      checks: [
        {
          id: "define", title: "Check: the definition (MST Q2(a))", show: ["q", "ep", "eq"], patch: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], drawScale: 1, oblique: false }, ep: { point: [1, 0, 0], drawScale: 1, oblique: false } },
          note: "Four checks on the field of a point charge. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "define", type: "choose", prompt: "Electric field intensity at a point is…", dimension: "recognition",
            options: [
              choice("right", "the force per unit positive test charge placed at that point", true, "Right, with the test charge taken as vanishingly small."),
              choice("force", "the force on any charge at that point", false, "It is per unit charge; divide by q."),
              choice("pot", "the work done moving a charge to that point", false, "That is potential, V."),
            ] },
          covers: ["mst-2324-q2a"],
        },
        {
          id: "predict-3x", title: "Check: three times as far",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-3x", type: "predict-drag", prompt: "The probe moves from 1 m to 3 m from the +2 µC charge. Drag |E| to your prediction.", target: { instance: "ep", readout: "Emag" }, range: [0, 20000], unit: "V/m", relTol: 0.05, reveal: { ep: { point: [3, 0, 0] } }, dimension: "conceptual",
            feedback: { close: "Right: a ninth, 1997 V/m.", far: "Inverse square: 3 × the distance gives a ninth of the field, 1997 V/m." } },
        },
        {
          id: "e-num", title: "Check: a field, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "e-num", type: "numeric", prompt: ep.prompt, answer: ep.spec.answer, distractors: ep.spec.distractors, relTol: ep.spec.relTol, hints: ep.hints, template: "e-point", dimension: "computational" },
        },
        {
          id: "dir", title: "Check: direction near a negative charge",
          note: "Last one.",
          interaction: { id: "dir", type: "choose", prompt: "At a point to the right of a −5 nC charge, E points…", dimension: "conceptual",
            options: [
              choice("left", "left, toward the charge", true, "Right: E points toward a negative charge."),
              choice("right", "right, away from the charge", false, "That is the field of a positive charge.", "E_DIRECTION_NEGATIVE"),
              choice("none", "nowhere; E is zero", false, "Every charge has a field around it."),
            ] },
        },
      ],
      recap: {
        points: [
          "E = F/q: the force per unit positive test charge, in N/C or V/m.",
          "Point charge: E = Q/(4πε₀R²) a_R, away from a positive charge and toward a negative one.",
          "It falls as 1/R².",
          "F = qE; 'hence E' means divide the force vector by the charge that felt it, sign included.",
        ],
        traps: ["Pointing E away from a negative charge.", "Halving instead of quartering when R doubles.", "Dividing by the charge without its sign."],
      },
    },
  ],
});
```

Check the `predict-3x` value: 17975.1 / 9 = 1997.23 V/m.

- [ ] **Step 3: `plates/idea-e-superposition.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const DIPOLE = [pt("p", 0.004, [-1, 0, 0], "+4 nC"), pt("n", -0.004, [1, 0, 0], "−4 nC")];
const SQUARE = { items: [pt("a", 0.003, [1, 1, 0], "3 nC"), pt("b", 0.003, [-1, 1, 0], "3 nC"), pt("c", 0.003, [-1, -1, 0], "3 nC"), pt("d", 0.003, [1, -1, 0], "3 nC")], oblique: true, drawScale: 0.9 };
const u = 1e-6;
const MST = { items: [pt("a", 0.5, [4 * u, -3 * u, 7 * u], "QA = +0.5 µC"), pt("b", -0.3, [2 * u, -3 * u, 1 * u], "QB = −0.3 µC")], oblique: true, drawScale: 2e5 };

export const ideaESuperposition = defineIdeaPlate({
  id: "idea-e-superposition",
  title: "Superposing fields",
  requires: { objectives: [1], items: ["mst-2324-q2b", "text:hayt-four-charges"], misconceptions: [] },
  instances: [
    { id: "q", component: "charges", params: { items: DIPOLE } },
    { id: "ep", component: "e-probe", params: { point: [0, 0, 1] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\mathbf E(\mathbf r)=\sum_i\dfrac{Q_i}{4\pi\varepsilon_0|\mathbf r-\mathbf r_i|^3}(\mathbf r-\mathbf r_i)`, speech: "E at r is the sum over charges of Q i over four pi epsilon nought times r minus r i over its length cubed", shortSpeech: "superposed field" } },
  ],
  ideas: [
    {
      id: "e-superposition",
      title: "Superposing fields",
      objectives: [1],
      explain: [
        {
          id: "sum", title: "Fields add as vectors", show: ["q", "ep", "eq"], focus: ["q", "ep"],
          note: "Fields obey superposition just as forces do: the field at a point is the vector sum of the fields of every charge. A convenient form avoids separate unit vectors: each term is Qᵢ(r − rᵢ)/(4πε₀|r − rᵢ|³), where the cube in the denominator absorbs the unit vector. On the plate, +4 nC at (−1, 0, 0) and −4 nC at (1, 0, 0) make a field at (0, 0, 1) m of 25.42âₓ V/m.",
          claims: [{ instance: "ep", readout: "Ex", value: 25.4206, unit: "V/m" }, { instance: "ep", readout: "Ez", value: 0, unit: "V/m" }],
        },
        {
          id: "dipole", title: "Why the z-parts cancel", focus: ["q", "ep"], patch: { ep: { point: [0, 0, 1.5] } },
          note: "Each charge alone gives a field of the same size at the probe, since both are the same distance away. The positive charge's field points away from it (up and to the right); the negative charge's field points toward it (down and to the right). Their vertical parts cancel and their horizontal parts add. Move the probe higher and the field weakens, but it still points along +x, parallel to the line from + to −.",
          claims: [{ instance: "ep", readout: "Ez", value: 0, unit: "V/m" }],
        },
        {
          id: "square", title: "Four charges: symmetry again", patch: { q: SQUARE, ep: { point: [1, 1, 1], oblique: true, drawScale: 0.9 } }, focus: ["q", "ep"],
          note: "Four identical 3 nC charges sit at (±1, ±1, 0) m. At P(1, 1, 1) the field is 6.820âₓ + 6.820âᵧ + 32.78âz V/m. The x and y parts match because P sits on the diagonal x = y, so the square looks the same from both directions. The big z-part comes mostly from the charge at (1, 1, 0), just 1 m below P.",
          claims: [{ instance: "ep", readout: "Ex", value: 6.82046, unit: "V/m" }, { instance: "ep", readout: "Ez", value: 32.7845, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "dipole", level: "basic", title: "Two opposite charges",
          setup: { q: { items: DIPOLE, oblique: false, drawScale: 1 }, ep: { point: [0, 0, 1], oblique: false, drawScale: 1 } },
          problem: "+4 nC sits at (−1, 0, 0) m and −4 nC at (1, 0, 0) m. Find E at (0, 0, 1) m.",
          lines: [
            { text: "From +4 nC: r − r₁ = (1, 0, 1), length √2; E₁ = 8.988 × 10⁹ × 4 × 10⁻⁹ × (1, 0, 1)/(√2)³ = 12.71âₓ + 12.71âz V/m.", focus: ["q"] },
            { text: "From −4 nC: r − r₂ = (−1, 0, 1); E₂ = −35.95 × (−1, 0, 1)/(√2)³ = 12.71âₓ − 12.71âz V/m.", focus: ["q"] },
            { text: "Sum: E = 25.42âₓ V/m. The z-parts cancel.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: 25.4206, unit: "V/m" }] },
          ],
          trap: "Using |r − rᵢ|² with the full vector (r − rᵢ) in the numerator gives an answer √2 times too big here. With the vector on top, the denominator is cubed.",
        },
        {
          id: "square", level: "tutorial", title: "Four charges at a square's corners",
          setup: { q: SQUARE, ep: { point: [1, 1, 1], oblique: true, drawScale: 0.9 } },
          problem: "Four identical 3 nC charges are at (1, 1, 0), (−1, 1, 0), (−1, −1, 0) and (1, −1, 0) m. Find E at P(1, 1, 1) m.",
          lines: [
            { text: "The four vectors from the charges to P are (0, 0, 1), (2, 0, 1), (2, 2, 1) and (0, 2, 1), with lengths 1, √5, 3 and √5.", focus: ["q"] },
            { text: "Each term is 26.96 × (vector)/(length)³, since 8.988 × 10⁹ × 3 × 10⁻⁹ = 26.96.", focus: ["q"] },
            { text: "Sum: E = 6.820âₓ + 6.820âᵧ + 32.78âz V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: 6.82046, unit: "V/m" }, { instance: "ep", readout: "Ey", value: 6.82046, unit: "V/m" }, { instance: "ep", readout: "Ez", value: 32.7845, unit: "V/m" }] },
          ],
          covers: ["text:hayt-four-charges"],
          trap: "Forgetting that the charge directly below P, only 1 m away, dominates. Its term alone is 26.96âz V/m.",
        },
        {
          id: "mst", level: "exam", title: "MST 2023-24 Q2(b): micrometres",
          setup: { q: MST, ep: { point: [u, 2 * u, 5 * u], oblique: true, drawScale: 2e5 } },
          problem: "In a vacuum, QA = 0.5 µC is at A(4, −3, 7) µm and QB = −0.3 µC is at B(2, −3, 1) µm. Calculate E at P(1, 2, 5) µm.",
          lines: [
            { text: "From A: P − A = (−3, 5, −2) µm, length √38 µm. E_A = 8.988 × 10⁹ × 0.5 × 10⁻⁶ × (−3, 5, −2) × 10⁻⁶ / (√38 × 10⁻⁶)³ = (−57.55, 95.92, −38.37) × 10¹² V/m.", focus: ["q"] },
            { text: "From B: P − B = (−1, 5, 4) µm, length √42 µm. With QB negative, E_B = (9.906, −49.53, −39.62) × 10¹² V/m.", focus: ["q"] },
            { text: "Sum: E = −47.65âₓ + 46.39âᵧ − 77.99âz TV/m (1 TV/m = 10¹² V/m).", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: -4.76464e13, unit: "V/m" }, { instance: "ep", readout: "Ey", value: 4.63906e13, unit: "V/m" }, { instance: "ep", readout: "Ez", value: -7.79913e13, unit: "V/m" }] },
          ],
          covers: ["mst-2324-q2b"],
          trap: "Dropping QB's minus sign turns E_B around and gives E_z = −1.8 × 10¹² V/m, the wrong answer entirely. Carry every charge's sign into its term.",
        },
      ],
      asks: [
        { id: "cube", q: "Why is the denominator cubed?", a: "Because the numerator is the full vector r − rᵢ, not a unit vector. Dividing that vector by its length once gives the unit vector, and by its length squared gives the inverse square. That makes the length cubed in total." },
        { id: "zero", q: "Can the total field be zero somewhere?", a: "Yes. Between two equal positive charges, halfway, their fields cancel exactly. Superposition gives zeros that no single charge could." },
        { id: "sign", q: "Do I include each charge's sign?", a: "Always. A negative Qᵢ flips its whole term. Most superposition errors are a dropped minus sign." },
        { id: "tv", q: "What is TV/m?", a: "Teravolts per metre, 10¹² V/m. Micrometre distances make fields enormous, so the lecturer's answers use T (tera). It's just a prefix." },
        { id: "grid", q: "How do I keep the arithmetic organised?", a: "Make a table: for each charge, the vector r − rᵢ, its length, the factor kQᵢ/length³, then the three components. Add the columns at the end." },
        { id: "field-lines", q: "What do field lines show here?", a: "The direction of the total field at every point: they start on positive charges and end on negative ones, and never cross, because the total field has only one direction at any point." },
      ],
      checks: [
        {
          id: "cancel", title: "Check: where does it cancel?", show: ["q", "ep", "eq"], patch: { q: { items: DIPOLE, oblique: false, drawScale: 1 }, ep: { point: [0, 0, 1], oblique: false, drawScale: 1 } },
          note: "Four checks on superposed fields. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "cancel", type: "choose", prompt: "Two equal +q charges sit on the x-axis at ±1 m. Where is E zero?", dimension: "conceptual",
            options: [
              choice("mid", "At the midpoint, the origin", true, "Right: equal and opposite there."),
              choice("far", "Far away along the y-axis", false, "There both push outward, along +y: they add."),
              choice("none", "Nowhere", false, "Symmetry makes the midpoint cancel exactly."),
            ] },
        },
        {
          id: "predict-flip", title: "Check: flip the negative charge",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-flip", type: "predict-drag", prompt: "The −4 nC charge becomes +4 nC. Drag Eₓ at (0, 0, 1) m to your prediction.", target: { instance: "ep", readout: "Ex" }, range: [-30, 30], unit: "V/m", relTol: 0.05, reveal: { q: { items: [DIPOLE[0], pt("n", 0.004, [1, 0, 0], "+4 nC")] } }, dimension: "conceptual",
            feedback: { close: "Right: zero. Now the x-parts cancel and the z-parts add.", far: "With two equal positive charges, the x-parts cancel: Eₓ = 0 and E points straight up." } },
        },
        {
          id: "mst-z", title: "Check: MST Q2(b)'s z-component",
          note: "The mid-semester question, one component.",
          interaction: { id: "mst-z", type: "numeric", prompt: "QA = 0.5 µC at A(4, −3, 7) µm and QB = −0.3 µC at B(2, −3, 1) µm. Find E_z at P(1, 2, 5) µm, in V/m.", answer: { value: -7.799e13, unit: "V/m" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 1.255e12, unit: "V/m", errorClass: "sign", feedback: "That treats QB as positive. Its term must carry the minus sign." }],
            hints: ["Work each charge's term with (P − rᵢ)/|P − rᵢ|³.", "E_A,z = −38.37 × 10¹²; E_B,z = −39.62 × 10¹².", "Add them."] },
          covers: ["mst-2324-q2b"],
        },
        {
          id: "which-dom", title: "Check: which term dominates?",
          note: "Last one.",
          interaction: { id: "which-dom", type: "choose", prompt: "In the four-charge square, which charge contributes most to E at P(1, 1, 1)?", dimension: "conceptual",
            options: [
              choice("near", "The one at (1, 1, 0), directly below P", true, "Right: it is only 1 m away."),
              choice("far", "The one at (−1, −1, 0)", false, "That one is the farthest, 3 m away."),
              choice("equal", "They contribute equally", false, "Their distances are 1, √5, 3 and √5 m."),
            ] },
          covers: ["text:hayt-four-charges"],
        },
      ],
      recap: {
        points: [
          "The total field is the vector sum of every charge's field.",
          "Use Qᵢ(r − rᵢ)/(4πε₀|r − rᵢ|³): the full vector on top, the length cubed below.",
          "Carry each charge's sign; symmetry cancels whole components.",
          "Micrometre and nanometre problems give huge fields, so prefixes such as T keep them readable.",
        ],
        traps: ["Squaring instead of cubing with a full vector on top.", "Dropping a charge's minus sign.", "Adding field magnitudes."],
      },
    },
  ],
});
```

Check the `mst-z` distractor by hand: E_A,z − E_B,z = −38.37 + 39.62 = 1.25 (× 10¹²), the sign slip.

- [ ] **Step 4: Register both**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): electric field at depth; Ideas 1 and 2 (point-charge field, superposition incl. MST Q2(b))

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 6: Idea ⑤, Fields of line and sheet charges

**Files:** Create `plates/idea-e-continuous.ts`. Append it to field `main`, and register it.

- [ ] **Step 1: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const el = instantiate(templates.find((t) => t.id === "e-line")!, 1);
const LINE = { items: [{ id: "l", kind: "line" as const, rhoL: 2000, x: 0, y: 0 }] };

export const ideaEContinuous = defineIdeaPlate({
  id: "idea-e-continuous",
  title: "Fields of line and sheet charges",
  requires: { objectives: [2], items: ["mst-2324-q3b"], misconceptions: ["LINE_FIELD_FORM", "SHEET_FIELD_DISTANCE"] },
  instances: [
    { id: "q", component: "charges", params: LINE },
    { id: "ep", component: "e-probe", params: { point: [1, 0, 0] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\mathbf E=\dfrac{\rho_L}{2\pi\varepsilon_0\rho}\,\mathbf a_\rho`, speech: "E equals rho L over two pi epsilon nought rho, along a rho", shortSpeech: "line charge field" } },
  ],
  ideas: [
    {
      id: "e-continuous",
      title: "Fields of line and sheet charges",
      objectives: [2],
      explain: [
        {
          id: "line", title: "An infinite line charge", show: ["q", "ep", "eq"], focus: ["q", "ep"],
          note: "Spread charge along an infinite straight line at ρL coulombs per metre. Summing (integrating) the point-charge fields of every piece, the components along the line cancel by symmetry, and what's left points straight out: E = ρL/(2πε₀ρ) aρ, where ρ is the distance from the line. On the plate, ρL = 2000 nC/m, and 1 m away E = 35950 V/m.",
          claims: [{ instance: "ep", readout: "Emag", value: 35950.2, unit: "V/m" }],
        },
        {
          id: "line-falloff", title: "It falls as 1/ρ, not 1/ρ²", patch: { ep: { point: [0.5, 0, 0] } }, focus: ["ep"],
          note: "Halve the distance to 0.5 m and the field doubles, to 71900 V/m. That is 1/ρ, a gentler fall-off than a point charge's 1/R², because the line stretches forever: moving away, you leave only a thin slice of it behind. Gauss's law with a cylinder gave D = ρL/(2πρ); divide by ε₀ and you have this field.",
          claims: [{ instance: "ep", readout: "Emag", value: 71900.4, unit: "V/m" }],
        },
        {
          id: "sheet", title: "An infinite sheet", patch: { q: { items: [{ id: "s", kind: "sheet", rhoS: 3, z0: 0 }] }, ep: { point: [0.4, 0, 1] }, eq: { latex: R`\mathbf E=\dfrac{\rho_S}{2\varepsilon_0}\,\mathbf a_n`, speech: "E equals rho S over two epsilon nought along the normal", shortSpeech: "sheet field" } }, focus: ["q", "ep", "eq"],
          note: "For an infinite flat sheet of charge ρS coulombs per square metre, every sideways component cancels, and the field points straight away from the sheet on both sides: E = ρS/(2ε₀) aₙ. There is no distance in the formula. On the plate, ρS = 3 µC/m² gives 169411 V/m at 1 m above the sheet, and the same at any height.",
          claims: [{ instance: "ep", readout: "Emag", value: 169411, unit: "V/m" }],
        },
        {
          id: "sheet-constant", title: "Distance doesn't matter", patch: { ep: { point: [0.4, 0, 1.8] } }, focus: ["ep"],
          note: "Move the probe higher, to 1.8 m above the sheet. The field doesn't change: still 169411 V/m. Field lines from an infinite sheet stay parallel and never spread out, so nothing weakens them. Below the sheet the field has the same size but points down, away from the sheet. Real sheets are finite, so this holds near the middle and well inside the edges.",
          claims: [{ instance: "ep", readout: "Emag", value: 169411, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "line", level: "basic", title: "A line charge at 1 m and 0.5 m",
          setup: { q: LINE, ep: { point: [1, 0, 0] } },
          problem: "An infinite line along z carries ρL = 2000 nC/m. Find |E| at 1 m and at 0.5 m from it.",
          lines: [
            { text: "E = ρL/(2πε₀ρ) = 2 × 10⁻⁶ / (2π × 8.854 × 10⁻¹² × 1) = 35950 V/m, pointing away from the line.", focus: ["ep"], claims: [{ instance: "ep", readout: "Emag", value: 35950.2, unit: "V/m" }] },
            { text: "At half the distance, twice the field: 71900 V/m.", patch: { ep: { point: [0.5, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Emag", value: 71900.4, unit: "V/m" }] },
          ],
          trap: "Using 4πε₀ρ² as for a point charge. A line's field is ρL/(2πε₀ρ): 2π, and ρ to the first power.",
        },
        {
          id: "sheet-num", level: "tutorial", title: "A sheet at two heights",
          setup: { q: { items: [{ id: "s", kind: "sheet", rhoS: 3, z0: 0 }] }, ep: { point: [0.4, 0, 1] } },
          problem: "An infinite sheet at z = 0 carries ρS = 3 µC/m². Find E at 1 m above it and at 1.8 m above it.",
          lines: [
            { text: "E = ρS/(2ε₀) = 3 × 10⁻⁶ / (2 × 8.854 × 10⁻¹²) = 169411 V/m, along +z.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ez", value: 169411, unit: "V/m" }] },
            { text: "At 1.8 m, the same: 169411 V/m. The sheet's field doesn't depend on distance.", patch: { ep: { point: [0.4, 0, 1.8] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Ez", value: 169411, unit: "V/m" }] },
          ],
          trap: "Dividing by the distance. There is no distance in a sheet's field.",
        },
        {
          id: "mst", level: "exam", title: "MST 2023-24 Q3(b): a sheet at z = 5 m",
          setup: { q: { items: [{ id: "s", kind: "sheet", rhoS: 120, z0: 5 }], drawScale: 0.2 }, ep: { point: [4, 5, 6], drawScale: 0.2 } },
          problem: "An infinite plane at z = 5.00 m in free space carries ρS = 120 µC/m². (i) State the formula relating E, D and ε₀. (ii) Calculate E at P(4, 5, 6) m. (iii) Hence compute D there.",
          lines: [
            { text: "(i) In free space, D = ε₀E.", focus: ["eq"] },
            { text: "(ii) P is above the plane (z = 6 > 5), so the field points along +z: E = ρS/(2ε₀) âz = 120 × 10⁻⁶ / (2 × 8.854 × 10⁻¹²) = 6.776 × 10⁶ âz V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ez", value: 6.77645e6, unit: "V/m" }] },
            { text: "(iii) D = ε₀E = ρS/2 âz = 60 µC/m² âz.", focus: ["ep"], givens: [{ value: 60, unit: "µC/m^2" }] },
          ],
          covers: ["mst-2324-q3b"],
          trap: "Putting the distance from P to the plane into the formula. It doesn't appear; only which side P is on matters, and that sets the sign.",
        },
      ],
      asks: [
        { id: "why-2pi", q: "Why 2π for a line and 4π for a point?", tags: ["LINE_FIELD_FORM"], a: "A point's flux spreads over a sphere, of area 4πR². A line's flux spreads over a cylinder around it, whose side area per metre of length is 2πρ. Gauss's law turns those areas straight into the formulas." },
        { id: "infinite", q: "Real wires aren't infinite. When does this apply?", a: "When you're much closer to the wire than to either end. Then the far parts contribute almost nothing, and the infinite-line formula is an excellent approximation." },
        { id: "sheet-dist", q: "How can a sheet's field not weaken with distance?", tags: ["SHEET_FIELD_DISTANCE"], a: "Move away and each piece of the sheet is farther off, but you 'see' a larger area of the sheet at a useful angle. For an infinite sheet the two effects cancel exactly." },
        { id: "sides", q: "What happens on the other side of a sheet?", a: "The same size, pointing the other way, away from a positive sheet on both sides. Crossing the sheet, E jumps by ρS/ε₀, the first boundary condition you'll meet in dielectrics." },
        { id: "two-sheets", q: "What about two parallel sheets?", a: "With +ρS and −ρS, the fields add between the sheets, giving ρS/ε₀, and cancel outside. That is the ideal parallel-plate capacitor, coming up later in the course." },
        { id: "d-link", q: "How does D relate here?", a: "In free space D = ε₀E. For the sheet, D = ρS/2 on each side, which Gauss's law with a pillbox gave directly, with no ε₀ needed." },
      ],
      checks: [
        {
          id: "form", title: "Check: the line formula", show: ["q", "ep", "eq"], patch: { q: LINE, ep: { point: [1, 0, 0], drawScale: 1 }, eq: { latex: R`\mathbf E=\dfrac{\rho_L}{2\pi\varepsilon_0\rho}\,\mathbf a_\rho`, speech: "line charge field", shortSpeech: "line field" } },
          note: "Four checks on lines and sheets. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "form", type: "choose", prompt: "The field of an infinite line charge ρL at distance ρ is…", dimension: "recognition",
            options: [
              choice("right", "ρL / (2πε₀ρ) aρ", true, "Right: 2π, and 1/ρ."),
              choice("point", "ρL / (4πε₀ρ²) aρ", false, "That's the point-charge form. A line's field falls as 1/ρ.", "LINE_FIELD_FORM"),
              choice("sheet", "ρL / (2ε₀) aρ", false, "That's the sheet form, which has no distance in it."),
            ] },
        },
        {
          id: "line-num", title: "Check: a line charge, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "line-num", type: "numeric", prompt: el.prompt, answer: el.spec.answer, distractors: el.spec.distractors, relTol: el.spec.relTol, hints: el.hints, template: "e-line", dimension: "computational" },
        },
        {
          id: "predict-sheet", title: "Check: move away from the sheet", patch: { q: { items: [{ id: "s", kind: "sheet", rhoS: 3, z0: 0 }] }, ep: { point: [0.4, 0, 0.5] } },
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-sheet", type: "predict-drag", prompt: "The probe rises from 0.5 m to 1.5 m above the sheet. Drag |E| to your prediction.", target: { instance: "ep", readout: "Emag" }, range: [0, 400000], unit: "V/m", relTol: 0.05, reveal: { ep: { point: [0.4, 0, 1.5] } }, dimension: "conceptual", tag: "SHEET_FIELD_DISTANCE",
            feedback: { close: "Right: unchanged, 169411 V/m.", far: "An infinite sheet's field doesn't depend on distance: still 169411 V/m." } },
        },
        {
          id: "mst-e", title: "Check: MST Q3(b)(ii)",
          note: "Last one.",
          interaction: { id: "mst-e", type: "numeric", prompt: "An infinite plane at z = 5 m carries ρS = 120 µC/m². Find E_z at P(4, 5, 6) m, in V/m.", answer: { value: 6.776e6, unit: "V/m" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 1.355e7, unit: "V/m", errorClass: "conceptual", feedback: "That's ρS/ε₀. A single sheet gives ρS/(2ε₀)." }],
            hints: ["E = ρS/(2ε₀) on either side.", "P is above the plane, so +âz.", "120 × 10⁻⁶ / (2 × 8.854 × 10⁻¹²)."] },
          covers: ["mst-2324-q3b"],
        },
      ],
      recap: {
        points: [
          "Infinite line: E = ρL/(2πε₀ρ) aρ, falling as 1/ρ.",
          "Infinite sheet: E = ρS/(2ε₀) aₙ, pointing away on both sides with no distance dependence.",
          "Both come from symmetry, the same way Gauss's law gave D.",
          "In free space D = ε₀E: for a sheet, D = ρS/2.",
        ],
        traps: ["Using the point-charge form for a line.", "4π instead of 2π for a line.", "Putting a distance into the sheet formula."],
      },
    },
  ],
});
```

- [ ] **Step 2: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 3 of the field, line and sheet charges (MST Q3(b))

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 7: Coverage, e2e and axe

- [ ] **Step 1: Extend coverage.**
  - In `packages/course-em1/test/f3-coverage.test.ts`, add `"em1.electrostatics.coulomb"` and `"em1.electrostatics.field"` to the per-concept loop.
  - Add the assertions:

    ```ts
    expect(mainOf("em1.electrostatics.coulomb")).toEqual(["idea-coulomb-law", "idea-superposition"]);
    expect(mainOf("em1.electrostatics.field")).toEqual(["idea-e-point", "idea-e-superposition", "idea-e-continuous"]);
    ```

  - Run `pnpm vitest run packages/course-em1`. Expected: PASS.

- [ ] **Step 2: The e2e test** at `app/apps/web/e2e/coulomb-field.spec.ts`

```ts
import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("Coulomb and field ideas open at depth", async ({ page }) => {
  for (const [c, block, title, label] of [
    ["em1.electrostatics.coulomb", "idea-coulomb-law", "The law", "Idea 1 · Coulomb's law in vector form · Explanation 1 of 5"],
    ["em1.electrostatics.coulomb", "idea-superposition", "One charge at a time", "Idea 2 · Superposition of forces · Explanation 1 of 4"],
    ["em1.electrostatics.field", "idea-e-point", "Force per unit charge", "Idea 1 · E = F/q and the point-charge field · Explanation 1 of 4"],
    ["em1.electrostatics.field", "idea-e-superposition", "Fields add as vectors", "Idea 2 · Superposing fields · Explanation 1 of 3"],
    ["em1.electrostatics.field", "idea-e-continuous", "An infinite line charge", "Idea 3 · Fields of line and sheet charges · Explanation 1 of 4"],
  ] as const) {
    await open(page, concept(c, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("MST Q2(b) worked example shows E_z ≈ −7.799×10¹³ V/m", async ({ page }) => {
  await open(page, concept("em1.electrostatics.field", "mode=learn&lesson=main&block=idea-e-superposition&step=14"));
  await expect(page.locator(".readouts")).toContainText("7.799");
});
```

The step index is 14. There are 3 explanations (steps 0–2). Each example is a setup step plus its lines: dipole 3–6, square 7–10, mst 11–14. If the meta disagrees, check `ideaPlates["idea-e-superposition"].meta.ideas[0].examples.map((e) => e.end)`, use the MST example's end, and log a ruling.

- Add these screens to `a11y.spec.ts`: `concept("em1.electrostatics.coulomb", "mode=learn")` and `concept("em1.electrostatics.field", "mode=learn&lesson=main&block=idea-e-continuous")`.

- [ ] **Step 3: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web packages/course-em1 && git commit -m "test: Coulomb and field coverage, e2e and axe

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 8: Verification and handback

- [ ] Run the full suite.
- [ ] Walk every new idea's first explanation and exam example in the dev server at 1360×900:
  - The oblique views should show the charges and the force/field arrows inside the plate.
  - The labels should read "q1 = +25.0 nC" and similar.
  - The nm and µm examples should show exponent-formatted readouts.
- [ ] Write the ledger line `Task 8: verification — <counts>` and stop for Claude's review.

## Self-Review Notes

- **Solved in `scratchpad/g1.py`:**
  - Lecture Example 1: F12 = −9.986âₓ + 19.97âᵧ − 19.97âz N.
  - MST Q1(b): F12 = −0.07550âₓ + 0.05662âz N.
  - MST Q2(b): E = −47.65âₓ + 46.39âᵧ − 77.99âz TV/m.
  - MST Q3(b): E = 6.776 × 10⁶ âz V/m and D = 60 µC/m² âz.
  - Finals Q1(b): F_AB = 6.440 × 10¹⁴ âₓ − 3.220 × 10¹⁵ âz N and E_B = −1.695 × 10²⁰ âₓ + 8.474 × 10²⁰ âz V/m.
  - HW02 2.4(a): F on Q1 = −34.57âₓ − 5.762âᵧ + 17.28âz N; 2.4(b): 1.012 × 10²² V/m.
  - Hayt four charges: 6.820âₓ + 6.820âᵧ + 32.78âz V/m.
- **The graded HW02 2.4(a)** gave 0.76 N (magnitude only, and wrong). That became the FORCE_MAGNITUDE_ONLY misconception and the `hw24a` check.
- **Next:** Plan G2 (Gauss applications and point form) follows this plan.
