# Forma Plan I: Dielectrics, Boundaries and Capacitance at Full Depth

> **For agentic workers (Codex):** read `AGENTS.md` first. **Plans F1–F4, G1, G2 and H must be complete.** Transcribe the content exactly. Every value was solved with Python from the source questions (`scratchpad/i/solve.py` and `solve2.py`; outputs in the Self-Review Notes), not from student work.

**Goal:** eight in-depth ideas, and retire `em1.electrostatics.flux-density`.
- `em1.electrostatics.dielectrics` (unlocked):
  - ① Polarization and permittivity
  - ② Tangential E is continuous
  - ③ Normal D and surface charge
  - ④ The refraction law
  - ⑤ Conductor boundaries
- `em1.electrostatics.capacitance` (unlocked):
  - ⑥ Capacitance and the parallel-plate capacitor
  - ⑦ Stored energy and energy density
  - ⑧ Coaxial and spherical capacitors

**New plate support:**
- `boundary`: two regions with εr1 and εr2, a boundary plane with any normal, a given D₁, optional free surface charge, or a conductor as region 2. It computes the normal/tangential split, D₂, E₁, E₂, P₁, P₂, both angles (from the normal or from the tangent) and ρs. Plan 6b reuses it with μ for magnetic boundaries.
- `capacitor`: parallel plates, coax or concentric spheres, with C, Q, W, the largest |E| and the energy density.
- Physics: `dielectricBoundary`, `capParallel`, `capCoax`, `capSphere`.
- The unit J/m³.
- An engine helper, `retireConcept`, that moves a learner's position and notebook off a retired concept.

**Sources (catalog ids):**
- `f2425`: Q2(b), the dielectric boundary (17 marks).
- `f2324`: Q2(a), the dielectric boundary (13 marks).
- `hw03-2425`: 3.2 (25 marks).
- `ict2-2425`: Q2. Only the lecturer's handwritten solution is in the drop, so the data is read from it: the plane is −6x + 8y = 16 (the catalog's "6x + 8y" drops the minus), εr1 = 21, εr2 = 7, D₁ = −10âₓ − 20âᵧ + 14âz C/m². Task 4 corrects the catalog and the bank text.
- `mst2324`: Q3(b) (the charged sheet, as a boundary with ρs), Q4(c) (coax), Q5(b) (parallel-plate energy).
- `lec2c`: dielectrics, boundary conditions, capacitance.

**Ledger:** `.superpowers/sdd/2026-09-29-forma-plan-i-dielectrics-capacitance/progress.md`

## Global Constraints

- Same as Plans F3, G1 and H.
- The lint reads only these units: V/m, m, m², m³, C, µC, nC, µC/m², nC/m², µC/m, nC/m, Hz and inch.
  - It does not read C/m², F, pF, µF, J, µJ, J/m³, V, kV/m, °, cm, mm or µm. Those values are backed by claims.
  - Boundary questions quote D in C/m². Write "C/m²" in text, never "C·m⁻²": the lint reads "7 C·m⁻²" as seven coulombs.
  - Write large fields as "(1.129, 0.678, −1.581) × 10¹¹ V/m" or "(…)/ε₀ V/m". The lint does not read a number that is followed by a superscript exponent.
- Write the energy as "½Q²/C", never "Q²/(2C)". The lint reads "2C" as two coulombs.
- The course's ε₀ is 8.854 × 10⁻¹² F/m (the package uses 8.8541878128 × 10⁻¹²). None of this plan's answers differ at four significant figures.
- **Angle conventions.** The plate measures θ from the normal unless `measure: "tangent"`. Each question's text says which convention it uses: HW03 3.2 measures from the tangent, Finals 2024-25 and 2023-24 from the normal, and ICT 2 shows both.

## Review Focus

1. **Which way n̂ points.**
   - `boundary` defines n̂ = normal/|normal| as pointing from region 2 into region 1, with D₁ₙ − D₂ₙ = ρs.
   - With ρs = 0, flipping the normal must change nothing: D₂, E₂ and the angles all stay the same.
   - With ρs ≠ 0 and in conductor mode, the sign matters.
   - Tested in Task 1.
2. **The four exam boundaries, to four significant figures** (the spec's success criterion):
   - Finals 2024-25 Q2(b): D₂ = (1, 0.6, −1.4), θ₂ = 56.71°.
   - Finals 2023-24 Q2(a): E₂ₓ = 9.681 × 10¹⁰, θ₁ = 67.41°.
   - HW03 3.2: D₂ = (−10.12, −12.5, 13.91), θ₁ = 40.69° and θ₂ = 53.99° from the tangent, cos ratio 1.290.
   - ICT 2 Q2: D₂ = (0.6667, −12, 4.667), E₂ᵧ = −1.936 × 10¹¹.
   - Tested in Task 1.
3. **Exact zeros.** Claims of 0 must hold exactly, because a claim's tolerance is relative:
   - P₂ in free space must be exactly 0, so compute P = (1 − 1/εr)D, not D − ε₀E.
   - In conductor mode, D₂ and E₂ must be exactly 0.
   - Tested in Tasks 1 and 2.
4. **A saved learner on the retired concept.**
   - A stored position on `em1.electrostatics.flux-density` (lesson `main`) resumes at Gauss's law, lesson `flux-density`, on the same block.
   - Notebook entries follow it to Gauss's law.
   - The old URLs redirect.
   - Tested in Task 4.
5. **Capacitor parameters per kind.**
   - A coax with b ≤ a, or a parallel-plate capacitor with no `d`, throws a clear error from the model instead of returning NaN.
   - A sphere with no `b` is an isolated sphere.
   - Tested in Task 2.

---

### Task 1: Physics and units

**Files:**
- Create: `app/packages/physics/src/boundary.ts`, `app/packages/physics/src/capacitance.ts`
- Modify: `app/packages/physics/src/index.ts` (export both), `app/packages/engine/src/quantities.ts` (J/m³)
- Test: `app/packages/physics/test/i.test.ts`, `app/packages/engine/test/quantities.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

`app/packages/engine/test/quantities.test.ts`, append:

```ts
it("reads capacitance, energy density and angle units", () => {
  expect(toSI(5.208, "J/m^3")).toEqual({ value: 5.208, dim: "J/m^3" });
  expect(toSI(88.54, "pF").value).toBeCloseTo(8.854e-11, 20);
  expect(toSI(100.4, "pF/m").dim).toBe("F/m");
  expect(toSI(79.5, "µF").value).toBeCloseTo(7.95e-5, 12);
  expect(toSI(56.71, "°").dim).toBe("°");
});
```

`app/packages/physics/test/i.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { capCoax, capParallel, capSphere, dielectricBoundary, norm } from "../src";

const rel = (a: number, b: number) => expect(a / b).toBeCloseTo(1, 4);
const relV = (a: readonly number[], b: readonly number[]) => a.forEach((x, i) => (b[i] === 0 ? expect(x).toBeCloseTo(0, 9) : rel(x, b[i]!)));

describe("dielectricBoundary", () => {
  it("Finals 2024-25 Q2(b): D2, E2 and θ2", () => {
    const r = dielectricBoundary({ D1: [1, 3, -7], normal: [1, 0, 0], er1: 5, er2: 1 });
    relV(r.D2, [1, 0.6, -1.4]);
    relV(r.E2, [1.12941e11, 6.77645e10, -1.58117e11]);
    rel(r.theta1, 82.5195);
    rel(r.theta2!, 56.7138);
    r.P2.forEach((v) => expect(Math.abs(v)).toBe(0));
  });
  it("Finals 2023-24 Q2(a): E2 and θ1", () => {
    const r = dielectricBoundary({ D1: [3, -4, 6], normal: [1, 0, 0], er1: 1, er2: 3.5 });
    relV(r.E2, [9.68065e10, -4.51764e11, 6.77645e11]);
    rel(r.theta1, 67.4115);
    rel(r.theta2!, 83.2214);
  });
  it("HW03 3.2: D2, E2 in terms of ε0, the angles from the tangent and the cos ratio", () => {
    const r = dielectricBoundary({ D1: [-10, -20, 14], normal: [-3, 0, 4], er1: 8, er2: 5 });
    relV(r.D1n, [-10.32, 0, 13.76]);
    relV(r.D1t, [0.32, -20, 0.24]);
    relV(r.D2, [-10.12, -12.5, 13.91]);
    relV(r.E2.map((v) => v * 8.8541878128e-12), [-2.024, -2.5, 2.782]);
    rel(90 - r.theta1, 40.6899);
    rel(90 - r.theta2!, 53.987);
    rel(norm(r.E2) / norm(r.E1), 1.2896);
  });
  it("ICT 2 Q2: the split, D2 and E2", () => {
    const r = dielectricBoundary({ D1: [-10, -20, 14], normal: [-6, 8, 0], er1: 21, er2: 7 });
    relV(r.n, [-0.6, 0.8, 0]);
    relV(r.D1n, [6, -8, 0]);
    relV(r.D1t, [-16, -12, 14]);
    relV(r.D2, [0.666667, -12, 4.666667]);
    relV(r.E2, [1.07563e10, -1.9361e11, 7.52939e10]);
    rel(Math.tan((r.theta1 * Math.PI) / 180) / Math.tan((r.theta2! * Math.PI) / 180), 3);
  });
  it("flipping the normal changes nothing when ρs = 0", () => {
    const a = dielectricBoundary({ D1: [-10, -20, 14], normal: [-3, 0, 4], er1: 8, er2: 5 });
    const b = dielectricBoundary({ D1: [-10, -20, 14], normal: [3, 0, -4], er1: 8, er2: 5 });
    relV(b.D2, a.D2);
    rel(b.theta2!, a.theta2!);
  });
  it("free surface charge: D1n − D2n = ρs, with n̂ from region 2 into region 1", () => {
    const r = dielectricBoundary({ D1: [3, 0, 5], normal: [0, 0, 1], er1: 2, er2: 4, rhoS: 2 });
    relV(r.D2, [6, 0, 3]);
    const sheet = dielectricBoundary({ D1: [0, 0, 6e-5], normal: [0, 0, 1], er1: 1, er2: 1, rhoS: 1.2e-4 });
    relV(sheet.D2, [0, 0, -6e-5]);
  });
  it("conductor as region 2: ρs = D1·n̂, and D2 = E2 = 0 exactly", () => {
    const r = dielectricBoundary({ D1: [0, 0, 5e-9], normal: [0, 0, 1], er1: 1, er2: 1, conductor: true });
    rel(r.rhoS, 5e-9);
    rel(r.E1[2], 564.705);
    expect(r.D2).toEqual([0, 0, 0]);
    expect(r.E2).toEqual([0, 0, 0]);
    expect(r.theta2).toBeNull();
    rel(dielectricBoundary({ D1: [0, 0, -5e-9], normal: [0, 0, 1], er1: 1, er2: 1, conductor: true }).rhoS, -5e-9);
  });
  it("a zero normal throws", () => {
    expect(() => dielectricBoundary({ D1: [1, 0, 0], normal: [0, 0, 0], er1: 1, er2: 2 })).toThrow(/normal/);
  });
});

describe("capacitance", () => {
  it("parallel plates: 100 cm², 1 mm, air = 88.54 pF", () => rel(capParallel(0.01, 1e-3), 8.85419e-11));
  it("MST Q4(c): 100 km coax, 0.28 inch core, 0.90 inch insulation, εr 6.78 = 79.50 µF", () => rel(capCoax(0.28 * 0.0254, 0.45 * 0.0254, 1e5, 6.78), 7.94988e-5));
  it("concentric spheres 5 cm and 10 cm in air = 11.13 pF; isolated = 5.563 pF", () => {
    rel(capSphere(0.05, 0.1), 1.11265e-11);
    rel(capSphere(0.05, Infinity), 5.56325e-12);
  });
});
```

The `P2` assertion uses `Math.abs` because a negative D₂ component times 0 is −0, which `toEqual` would reject.

- [ ] **Step 2: Run them and see them fail**

Run: `pnpm vitest run packages/engine/test/quantities.test.ts packages/physics/test/i.test.ts`
Expected: FAIL. `J/m^3` is an unknown unit, and `dielectricBoundary` is not exported.

- [ ] **Step 3: Implement.**

**Units** (`quantities.ts` `BASE`): add `"J/m^3": "J/m^3",`. The prefixes pF, µF and µJ already resolve through the existing prefix logic.

**`app/packages/physics/src/boundary.ts`:**

```ts
import { EPS0 } from "./constants";
import { add, dot, norm, scale, sub, type Vec3 } from "./vec";

export type BoundaryInput = { D1: Vec3; normal: Vec3; er1: number; er2: number; rhoS?: number; conductor?: boolean };
export type BoundaryResult = {
  n: Vec3; D1n: Vec3; D1t: Vec3; D2: Vec3; E1: Vec3; E2: Vec3; P1: Vec3; P2: Vec3;
  /** Free surface charge: the given ρs, or D1·n̂ when region 2 is a conductor. */
  rhoS: number;
  /** Degrees from the normal. theta2 is null when region 2 is a conductor. */
  theta1: number; theta2: number | null;
};

const ZERO: Vec3 = [0, 0, 0];
const angle = (t: Vec3, n: number) => (Math.atan2(norm(t), Math.abs(n)) * 180) / Math.PI;

/**
 * Boundary conditions for D and E at a plane with the given normal (any length, any offset).
 * n̂ = normal/|normal| points from region 2 into region 1, and D1n − D2n = ρs. Tangential E is continuous.
 * P = (1 − 1/εr)D, so free space gives an exact zero.
 */
export function dielectricBoundary({ D1, normal, er1, er2, rhoS = 0, conductor = false }: BoundaryInput): BoundaryResult {
  const len = norm(normal);
  if (!(len > 0)) throw new Error("boundary normal must be non-zero");
  const n = scale(normal, 1 / len);
  const d1n = dot(D1, n);
  const D1n = scale(n, d1n);
  const D1t = sub(D1, D1n);
  const E1 = scale(D1, 1 / (er1 * EPS0));
  const P1 = scale(D1, 1 - 1 / er1);
  if (conductor) return { n, D1n, D1t, D2: ZERO, E1, E2: ZERO, P1, P2: ZERO, rhoS: d1n, theta1: angle(D1t, d1n), theta2: null };
  const d2n = d1n - rhoS;
  const D2t = scale(D1t, er2 / er1);
  const D2 = add(scale(n, d2n), D2t);
  return { n, D1n, D1t, D2, E1, E2: scale(D2, 1 / (er2 * EPS0)), P1, P2: scale(D2, 1 - 1 / er2), rhoS, theta1: angle(D1t, d1n), theta2: angle(D2t, d2n) };
}
```

**`app/packages/physics/src/capacitance.ts`:**

```ts
import { EPS0 } from "./constants";

/** C = εS/d. */
export const capParallel = (area: number, d: number, er = 1) => (er * EPS0 * area) / d;
/** C = 2πεL/ln(b/a). */
export const capCoax = (a: number, b: number, length: number, er = 1) => (2 * Math.PI * er * EPS0 * length) / Math.log(b / a);
/** C = 4πε/(1/a − 1/b); b = Infinity gives an isolated sphere, 4πεa. */
export const capSphere = (a: number, b: number, er = 1) => (4 * Math.PI * er * EPS0) / (1 / a - 1 / b);
```

Add `export * from "./boundary";` and `export * from "./capacitance";` to `index.ts`. If `add` is not exported from `vec.ts` under that name, use the existing vector helper and log a ruling.

- [ ] **Step 4: Run everything**

Run: `pnpm test && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages && git commit -m "feat(physics): dielectric and conductor boundary conditions, capacitance of plates, coax and spheres; J/m³

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: The `boundary` and `capacitor` components

**Files:**
- Create: `app/packages/plate/src/components/media.ts`
- Modify: `app/packages/plate/src/components/em.ts` (spread `...mediaComponents` into `emComponents`), `app/apps/web/components/plate/views3d.tsx` (`BoundaryView`), `app/apps/web/components/plate/viewsMath.tsx` (`CapacitorView`), `views2d.tsx` (register), `Readouts.tsx` (labels)
- Test: `app/packages/plate/test/media.test.ts`

- [ ] **Step 1: Write the failing test** `app/packages/plate/test/media.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const m = (component: string, params: Record<string, unknown>) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances: [{ id: "a", component, params, visible: true }], steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0)).a!.model as Record<string, number>;
};
const ICT = { D1: [-10, -20, 14], normal: [-6, 8, 0], er1: 21, er2: 7 };

describe("boundary", () => {
  it("shows only the readout groups asked for", () => {
    const r = m("boundary", { ...ICT, show: ["n", "split"] });
    expect(r.nx).toBeCloseTo(-0.6, 12);
    expect(r.D1tx).toBeCloseTo(-16, 12);
    expect("D2x" in r).toBe(false);
    expect("th1" in r).toBe(false);
  });
  it("the default groups are split, D and angles", () => {
    const r = m("boundary", ICT);
    expect(r.D2x).toBeCloseTo(0.666667, 5);
    expect(r.th2).toBeCloseTo(39.1377, 3);
    expect("E2x" in r).toBe(false);
  });
  it("measure: tangent reports 90° − θ", () => {
    const r = m("boundary", { D1: [-10, -20, 14], normal: [-3, 0, 4], er1: 8, er2: 5, measure: "tangent", show: ["angles", "mag"] });
    expect(r.th1).toBeCloseTo(40.6899, 3);
    expect(r.th2).toBeCloseTo(53.987, 3);
    expect(r.E2mag / r.E1mag).toBeCloseTo(1.2896, 4);
  });
  it("free space has P exactly 0; a conductor has no th2 and exact zeros", () => {
    expect(m("boundary", { D1: [1, 3, -7], normal: [1, 0, 0], er1: 5, er2: 1, show: ["P"] }).P2y).toBe(0);
    const c = m("boundary", { D1: [0, 0, 5e-9], normal: [0, 0, 1], er1: 1, er2: 1, conductor: true, show: ["rhoS", "E", "angles"] });
    expect(c.rhoS).toBeCloseTo(5e-9, 20);
    expect(c.E2z).toBe(0);
    expect("th2" in c).toBe(false);
  });
});

describe("capacitor", () => {
  it("parallel plates: C, Q, W, E and the energy density", () => {
    const c = m("capacitor", { kind: "parallel", area: 0.01, d: 1e-3, V: 100 });
    expect(c.C).toBeCloseTo(8.85419e-11, 15);
    expect(c.Q).toBeCloseTo(8.85419e-9, 13);
    expect(c.W).toBeCloseTo(4.42709e-7, 11);
    expect(c.Eg).toBeCloseTo(1e5, 6);
    expect(c.wE).toBeCloseTo(0.0442709, 6);
    expect(c.S).toBe(0.01);
  });
  it("MST Q5(b): εr 33.464 at 15 V stores 50 µJ with w_E = 5.208 J/m³", () => {
    const c = m("capacitor", { kind: "parallel", area: 0.12, d: 8e-5, er: 33.46397, V: 15 });
    expect(c.C).toBeCloseTo(4.44444e-7, 11);
    expect(c.W).toBeCloseTo(5e-5, 9);
    expect(c.wE).toBeCloseTo(5.20833, 4);
  });
  it("coax: 100.4 pF per metre, largest E at the core; MST Q4(c) quotes its diameters", () => {
    const c = m("capacitor", { kind: "coax", a: 1e-3, b: 3.5e-3, length: 1, er: 2.26, V: 100 });
    expect(c.C).toBeCloseTo(1.00362e-10, 14);
    expect(c.Eg).toBeCloseTo(79823.6, 0);
    const mst = m("capacitor", { kind: "coax", a: 0.007112, b: 0.01143, length: 1e5, er: 6.78 });
    expect(mst.C).toBeCloseTo(7.94988e-5, 9);
    expect(mst.outerD).toBeCloseTo(0.02286, 10);
  });
  it("a sphere with no b is isolated", () => {
    expect(m("capacitor", { kind: "sphere", a: 0.05 }).C).toBeCloseTo(5.56325e-12, 16);
  });
  it("bad parameters throw clear errors", () => {
    expect(() => m("capacitor", { kind: "coax", a: 2e-3, b: 1e-3, length: 1 })).toThrow(/a < b/);
    expect(() => m("capacitor", { kind: "parallel", area: 0.01 })).toThrow(/area and d/);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/plate/test/media.test.ts`
Expected: FAIL (unknown components).

- [ ] **Step 3: Implement `app/packages/plate/src/components/media.ts`**

```ts
import { capCoax, capParallel, capSphere, dielectricBoundary, EPS0, norm } from "@forma/physics";
import { z } from "zod";
import { defineComponent } from "../component";

const V3 = z.tuple([z.number(), z.number(), z.number()]);
const GROUPS = {
  n: ["nx", "ny", "nz"],
  split: ["D1nx", "D1ny", "D1nz", "D1tx", "D1ty", "D1tz"],
  D: ["D1x", "D1y", "D1z", "D2x", "D2y", "D2z"],
  E: ["E1x", "E1y", "E1z", "E2x", "E2y", "E2z"],
  angles: ["th1", "th2"],
  mag: ["D1mag", "D2mag", "E1mag", "E2mag"],
  P: ["P1x", "P1y", "P1z", "P2x", "P2y", "P2z"],
  rhoS: ["rhoS"],
} as const;
type Group = keyof typeof GROUPS;
const unitOf = (k: string) => (k.startsWith("E") ? "V/m" : k.startsWith("th") ? "°" : k.startsWith("n") ? "" : "C/m^2");
const BOUNDARY_UNITS = Object.fromEntries(Object.values(GROUPS).flat().map((k) => [k, unitOf(k)]));

export const Boundary = defineComponent({
  id: "boundary",
  params: z.object({
    D1: V3, normal: V3, er1: z.number().positive(), er2: z.number().positive(),
    rhoS: z.number().default(0), conductor: z.boolean().default(false),
    measure: z.enum(["normal", "tangent"]).default("normal"),
    show: z.array(z.enum(Object.keys(GROUPS) as [Group, ...Group[]])).default(["split", "D", "angles"]),
    /** Where the plate draws the interface. The physics depends only on the normal, so the plane's offset is not modelled. */
    anchor: V3.default([0, 0, 0]),
  }),
  model: (p) => {
    const r = dielectricBoundary({ D1: p.D1, normal: p.normal, er1: p.er1, er2: p.er2, rhoS: p.rhoS, conductor: p.conductor });
    const from = (t: number) => (p.measure === "normal" ? t : 90 - t);
    const v = (name: string, x: readonly number[]) => ({ [`${name}x`]: x[0]!, [`${name}y`]: x[1]!, [`${name}z`]: x[2]! });
    const all: Record<string, number | null> = {
      nx: r.n[0], ny: r.n[1], nz: r.n[2],
      ...v("D1n", r.D1n), ...v("D1t", r.D1t), ...v("D1", p.D1), ...v("D2", r.D2), ...v("E1", r.E1), ...v("E2", r.E2), ...v("P1", r.P1), ...v("P2", r.P2),
      th1: from(r.theta1), th2: r.theta2 === null ? null : from(r.theta2),
      D1mag: norm(p.D1), D2mag: norm(r.D2), E1mag: norm(r.E1), E2mag: norm(r.E2),
      rhoS: r.rhoS,
    };
    const out: Record<string, unknown> = { draw: { n: r.n, D1: p.D1, D2: r.D2, D1n: r.D1n, D1t: r.D1t, split: p.show.includes("split") } };
    for (const g of p.show) for (const k of GROUPS[g]) if (all[k] !== null) out[k] = all[k];
    return out;
  },
  handles: [],
  readouts: BOUNDARY_UNITS,
  quotable: BOUNDARY_UNITS,
});

export const Capacitor = defineComponent({
  id: "capacitor",
  params: z.object({
    kind: z.enum(["parallel", "coax", "sphere"]),
    er: z.number().positive().default(1),
    /** Volts across the capacitor. */
    V: z.number().default(1),
    area: z.number().positive().optional(), d: z.number().positive().optional(),
    a: z.number().positive().optional(), b: z.number().positive().optional(), length: z.number().positive().optional(),
  }),
  model: (p) => {
    let C: number, Eg: number;
    if (p.kind === "parallel") {
      if (p.area === undefined || p.d === undefined) throw new Error("a parallel-plate capacitor needs area and d");
      C = capParallel(p.area, p.d, p.er);
      Eg = p.V / p.d;
    } else if (p.kind === "coax") {
      if (p.a === undefined || p.b === undefined || p.length === undefined || !(p.b > p.a)) throw new Error("a coax needs a < b and a length");
      C = capCoax(p.a, p.b, p.length, p.er);
      Eg = p.V / (p.a * Math.log(p.b / p.a));
    } else {
      const b = p.b ?? Infinity;
      if (p.a === undefined || !(b > p.a)) throw new Error("a spherical capacitor needs a < b");
      C = capSphere(p.a, b, p.er);
      Eg = p.V / (p.a * p.a * (1 / p.a - 1 / b));
    }
    const dims = p.kind === "parallel" ? { S: p.area } : { innerD: 2 * p.a!, ...(p.b !== undefined ? { outerD: 2 * p.b } : {}) };
    return { C, Q: C * p.V, W: 0.5 * C * p.V * p.V, Eg, wE: 0.5 * p.er * EPS0 * Eg * Eg, ...dims };
  },
  handles: [],
  readouts: { C: "F", Q: "C", W: "J", Eg: "V/m", wE: "J/m^3" },
  quotable: { C: "F", Q: "C", W: "J", Eg: "V/m", wE: "J/m^3", S: "m^2", innerD: "m", outerD: "m" },
});

export const mediaComponents = [Boundary, Capacitor];
```

- `Eg` is the largest field: uniform in the parallel gap, and at the inner surface for coax and spheres.
- `S`, `innerD` and `outerD` exist so the lint can back "0.120 m²" and "0.90 inch" (a diameter).
- In `em.ts`, import `mediaComponents` from `./media` and append `...mediaComponents` to `emComponents`.

**Views**

`BoundaryView` in `views3d.tsx`. Add `import { cross, dot, norm, normalize } from "@forma/physics";` if these are not already imported.

```tsx
export function BoundaryView({ ev }: ViewProps) {
  const p = ev.params as { er1: number; er2: number; conductor: boolean; anchor: [number, number, number] };
  const d = ev.model.draw as { n: Vec3; D1: Vec3; D2: Vec3; D1n: Vec3; D1t: Vec3; split: boolean };
  const c = p.anchor;
  const at = (...terms: [number, Vec3][]): number[] => terms.reduce((s, [k, v]) => [s[0]! + k * v[0], s[1]! + k * v[1], s[2]! + k * v[2]], [...c] as number[]);
  const t1 = normalize(cross(d.n, Math.abs(d.n[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
  const t2 = cross(d.n, t1);
  const quad = [at([1.2, t1], [1.2, t2]), at([1.2, t1], [-1.2, t2]), at([-1.2, t1], [-1.2, t2]), at([-1.2, t1], [1.2, t2])].map((q) => toSvg3(q).join(",")).join(" ");
  const k = 1.2 / Math.max(norm(d.D1), norm(d.D2), 1e-30);
  const into2 = dot(d.D1, d.n) < 0;
  const fmt = (x: number) => String(Number(x.toPrecision(4)));
  const label = (pt: number[], text: string) => { const [x, y] = toSvg3(pt); return <text x={x} y={y} className="plate-label">{text}</text>; };
  const [n0, n1] = [toSvg3(at([-1.3, d.n])), toSvg3(at([1.3, d.n]))];
  return (
    <g className="v-boundary" role="img" aria-label={`Boundary between region 1 (εr ${fmt(p.er1)}) and region 2 (${p.conductor ? "a conductor" : `εr ${fmt(p.er2)}`})`}>
      <polygon points={quad} fill={p.conductor ? "var(--graphite)" : "url(#hatch-graphite)"} fillOpacity={p.conductor ? 0.35 : 1} stroke="var(--surface)" />
      <line x1={n0[0]} y1={n0[1]} x2={n1[0]} y2={n1[1]} className="ink" strokeDasharray="3 3" />
      {label(at([1.4, d.n]), "n̂")}
      {label(at([0.9, d.n], [1, t1]), `Region 1 · εr = ${fmt(p.er1)}`)}
      {label(at([-0.9, d.n], [1, t1]), p.conductor ? "Region 2 · conductor" : `Region 2 · εr = ${fmt(p.er2)}`)}
      {into2 ? <Arrow from={at([-k, d.D1])} to={[...c]} tone="flux" label="D₁" /> : <Arrow from={[...c]} to={at([k, d.D1])} tone="flux" label="D₁" />}
      {!p.conductor && norm(d.D2) > 0 && (into2 ? <Arrow from={[...c]} to={at([k, d.D2])} tone="flux" label="D₂" /> : <Arrow from={at([-k, d.D2])} to={[...c]} tone="flux" label="D₂" />)}
      {d.split && (
        <g opacity={0.7}>
          <Arrow from={[...c]} to={at([k, d.D1n])} tone="surface" label="D₁ₙ" />
          <Arrow from={[...c]} to={at([k, d.D1t])} tone="surface" label="D₁ₜ" />
        </g>
      )}
    </g>
  );
}
```

The field line always runs through the anchor. When D₁ heads into region 2, D₁ ends at the interface and D₂ starts there; otherwise the order reverses. Use the file's existing text class if `plate-label` is not it (check `CoordFrameView`), and log a ruling if you change it.

`CapacitorView` in `viewsMath.tsx`: a schematic, not to scale, in plate coordinates (use the same helper `ConductorView` uses).
- `parallel`:
  - Two plates as filled rectangles, (−1.5, 0.5)–(1.5, 0.6) in `var(--charge)` and (−1.5, −0.6)–(1.5, −0.5) in `var(--field)`, labelled "+Q" and "−Q" at their right ends.
  - The gap (−1.5, −0.5)–(1.5, 0.5) filled with `url(#hatch-graphite)` when `er > 1`.
  - The text `εr = ${er} · d = ${len(d)} · S = ${area} m²` above.
- `coax` and `sphere`:
  - An inner disc of radius 0.4 in `var(--charge)`, and an outer circle of radius 1.2 with `stroke="var(--ink)"` and `strokeWidth={3}`.
  - When `er > 1`, fill the annulus with `url(#hatch-graphite)` (draw the hatched circle of radius 1.2 first, then the inner disc over it).
  - Labels "a" and "b" on radii drawn at 30°.
  - Caption "cross-section" for coax and "section through the centre" for sphere, plus `εr = ${er}`.
- `len(x)` formats metres: below 1e-3 as µm, below 1 as mm, otherwise m, with at most 4 significant figures.
- `aria-label`: `${kind === "parallel" ? "Parallel-plate" : kind === "coax" ? "Coaxial" : "Spherical"} capacitor, schematic`.

Register `boundary: BoundaryView` and `capacitor: CapacitorView` in `views2d.tsx`.

**Labels** (`Readouts.tsx`):
- `LABEL` additions:
  - normal: `nx: "n̂ₓ", ny: "n̂ᵧ", nz: "n̂z"`
  - normal part of D₁: `D1nx: "D₁ normal, x", D1ny: "D₁ normal, y", D1nz: "D₁ normal, z"`
  - tangential part of D₁: `D1tx: "D₁ tangential, x", D1ty: "D₁ tangential, y", D1tz: "D₁ tangential, z"`
  - D: `D1x: "D₁ x", D1y: "D₁ y", D1z: "D₁ z", D2x: "D₂ x", D2y: "D₂ y", D2z: "D₂ z"`
  - E: `E1x: "E₁ x", E1y: "E₁ y", E1z: "E₁ z", E2x: "E₂ x", E2y: "E₂ y", E2z: "E₂ z"`
  - P: `P1x: "P₁ x", P1y: "P₁ y", P1z: "P₁ z", P2x: "P₂ x", P2y: "P₂ y", P2z: "P₂ z"`
  - `th1: "θ₁", th2: "θ₂", rhoS: "ρs"`
  - magnitudes: `D1mag: "|D₁|", D2mag: "|D₂|", E1mag: "|E₁|", E2mag: "|E₂|"`
  - capacitor: `C: "Capacitance C", Q: "Charge Q", Eg: "Largest |E|", wE: "Energy density ½εE²"`
- `W` is already "Work done W" (Plan H). For `inst.component === "capacitor"`, label it "Stored energy W", using the same override pattern as the conductor's `E`.
- `TONE`: `D2x: "flux", D2y: "flux", D2z: "flux", E2x: "field", E2y: "field", E2z: "field", rhoS: "charge", Q: "charge", C: "surface", th1: "surface", th2: "surface"`.
- Change `pretty` to `(unit) => unit.replace("^2", "²").replace("^3", "³")`.

- [ ] **Step 4: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages apps/web && git commit -m "feat(plate): boundary (dielectric and conductor) and capacitor components with views

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: Templates

**Files:** `app/packages/course-em1/src/templates.ts`; test `app/packages/course-em1/test/templates-i.test.ts`.

- [ ] **Step 1: Write the failing test.** Use the G1 template-test shape (50 seeds, finite answers, worked lines, no distractor equal to the answer) over `["bnd-tangent", "bnd-angle", "cap-parallel", "cap-energy", "cap-coax"]`, plus:

```ts
const t = (id: string) => templates.find((x) => x.id === id)!;
it("bnd-tangent reproduces Finals 2024-25 Q2(b): D2y = 0.6", () => {
  expect(t("bnd-tangent").solve({ er: 5, dir: 0, Dx: 1, Dy: 3 } as never).answer.value).toBeCloseTo(0.6, 6);
});
it("bnd-angle: 60° from εr 2 into free space bends to 40.89°", () => {
  expect(t("bnd-angle").solve({ th1: 60, er: 2, dir: 0 } as never).answer.value).toBeCloseTo(40.89, 2);
});
it("cap-parallel: 100 cm², 1 mm, air = 88.54 pF", () => {
  expect(t("cap-parallel").solve({ S: 100, d: 1, er: 1 } as never).answer.value).toBeCloseTo(88.54, 2);
});
it("cap-energy: 10 nF at 100 V = 50 µJ", () => {
  expect(t("cap-energy").solve({ C: 10, V: 100 } as never).answer.value).toBeCloseTo(50, 6);
});
it("cap-coax: 1 mm and 4 mm in air = 40.13 pF/m", () => {
  expect(t("cap-coax").solve({ a: 1, b: 4, er: 1 } as never).answer.value).toBeCloseTo(40.13, 2);
});
```

- [ ] **Step 2: Run it** and see it FAIL.

- [ ] **Step 3: Implement.** Reuse `EPS0` and `sig`.

```ts
/** dir 0: dielectric region 1 into free space (Finals 24-25); dir 1: free space into a dielectric (Finals 23-24). */
const sides = (dir: number, er: number) => (dir === 0 ? { er1: er, er2: 1 } : { er1: 1, er2: er });
const DIEL = "em1.electrostatics.dielectrics";
const CAP = "em1.electrostatics.capacitance";

const bndTangent = defineTemplate<{ er: number; dir: number; Dx: number; Dy: number }>({
  id: "bnd-tangent",
  params: { er: { min: 2, max: 9, step: 1 }, dir: { min: 0, max: 1, step: 1 }, Dx: { min: 1, max: 5, step: 1 }, Dy: { min: 1, max: 9, step: 1 } },
  prompt: (p) => {
    const s = sides(p.dir, p.er);
    return `Region 1 (x < 0) has εr1 = ${s.er1}; region 2 (x > 0) has εr2 = ${s.er2}. There is no surface charge, and D₁ = ${p.Dx}âₓ + ${p.Dy}âᵧ C/m² at the boundary. Find D₂ᵧ, the y-component of D₂, in C/m².`;
  },
  solve: (p) => {
    const s = sides(p.dir, p.er);
    return {
      answer: { value: sig((p.Dy * s.er2) / s.er1), unit: "C/m^2" },
      distractors: [
        { value: p.Dy, unit: "C/m^2", errorClass: "conceptual", tag: "BND_D_TANGENT", feedback: "Tangential E is continuous, not tangential D. Multiply by ε₂/ε₁." },
        { value: sig((p.Dy * s.er1) / s.er2), unit: "C/m^2", errorClass: "conceptual", tag: "BND_RATIO_FLIP", feedback: "The ratio is upside down: D₂ₜ = (ε₂/ε₁)D₁ₜ." },
      ],
    };
  },
  hints: () => ["The boundary is x = 0, so y is a tangential direction.", "E₁ₜ = E₂ₜ, so D₂ₜ/ε₂ = D₁ₜ/ε₁.", "D₂ᵧ = (εr2/εr1)D₁ᵧ."],
  worked: (p) => {
    const s = sides(p.dir, p.er);
    return [{ text: `y is tangential to x = 0. D₂ᵧ = (εr2/εr1)D₁ᵧ = (${s.er2}/${s.er1}) × ${p.Dy} = ${sig((p.Dy * s.er2) / s.er1)} C/m².` }];
  },
  dimension: "computational",
  tags: { concepts: [DIEL], misconceptions: ["BND_D_TANGENT", "BND_RATIO_FLIP"], difficulty: 2 },
});

const deg = (x: number) => sig((Math.atan(x) * 180) / Math.PI);
const bndAngle = defineTemplate<{ th1: number; er: number; dir: number }>({
  id: "bnd-angle",
  params: { th1: { min: 10, max: 80, step: 10 }, er: { min: 2, max: 9, step: 1 }, dir: { min: 0, max: 1, step: 1 } },
  prompt: (p) => {
    const s = sides(p.dir, p.er);
    return `A field in region 1 (εr1 = ${s.er1}) meets a charge-free boundary at θ₁ = ${p.th1}° from the normal. Region 2 has εr2 = ${s.er2}. Find θ₂, also from the normal, in degrees.`;
  },
  solve: (p) => {
    const s = sides(p.dir, p.er);
    const t = Math.tan((p.th1 * Math.PI) / 180);
    return {
      answer: { value: deg((t * s.er2) / s.er1), unit: "°" },
      distractors: [{ value: deg((t * s.er1) / s.er2), unit: "°", errorClass: "conceptual", tag: "BND_RATIO_FLIP", feedback: "From the normal, tan θ₁/tan θ₂ = ε₁/ε₂, so tan θ₂ = (ε₂/ε₁) tan θ₁." }],
    };
  },
  hints: () => ["tan θ₁/tan θ₂ = εr1/εr2, with both angles from the normal.", "tan θ₂ = (εr2/εr1) tan θ₁.", "Take tan⁻¹, in degrees."],
  worked: (p) => {
    const s = sides(p.dir, p.er);
    const t = Math.tan((p.th1 * Math.PI) / 180);
    return [{ text: `tan θ₂ = (${s.er2}/${s.er1}) × tan ${p.th1}° = ${sig((t * s.er2) / s.er1)}, so θ₂ = ${deg((t * s.er2) / s.er1)}°.` }];
  },
  dimension: "computational",
  tags: { concepts: [DIEL], misconceptions: ["BND_RATIO_FLIP"], difficulty: 2 },
});

const capPlates = defineTemplate<{ S: number; d: number; er: number }>({
  id: "cap-parallel",
  params: { S: { min: 10, max: 100, step: 10 }, d: { min: 0.5, max: 5, step: 0.5 }, er: { min: 1, max: 8, step: 1 } },
  prompt: (p) => `Parallel plates of area ${p.S} cm² are ${p.d} mm apart, with a dielectric of εr = ${p.er} filling the gap. Find C in pF.`,
  solve: (p) => {
    const C = (p.er * EPS0 * p.S * 1e-4) / (p.d * 1e-3);
    return {
      answer: { value: sig(C / 1e-12), unit: "pF" },
      distractors: [{ value: sig(C / 1e-12 / 1000), unit: "pF", errorClass: "unit", tag: "CAP_UNITS", feedback: "The gap was left in millimetres. Convert it to metres first." }],
    };
  },
  hints: () => ["C = εr ε₀ S/d.", "S: 1 cm² = 10⁻⁴ m². d: 1 mm = 10⁻³ m.", "Divide the answer in F by 10⁻¹² for pF."],
  worked: (p) => [{ text: `C = ${p.er} × 8.854 × 10⁻¹² × ${p.S} × 10⁻⁴ / (${p.d} × 10⁻³) = ${sig((p.er * EPS0 * p.S * 1e-4) / (p.d * 1e-3) / 1e-12)} pF.` }],
  dimension: "computational",
  tags: { concepts: [CAP], misconceptions: ["CAP_UNITS"], difficulty: 1 },
});

const capEnergy = defineTemplate<{ C: number; V: number }>({
  id: "cap-energy",
  params: { C: { min: 10, max: 100, step: 10 }, V: { min: 10, max: 200, step: 10 } },
  prompt: (p) => `A ${p.C} nF capacitor is charged to ${p.V} V. Find the energy it stores, in µJ.`,
  solve: (p) => {
    const W = (0.5 * p.C * 1e-9 * p.V * p.V) / 1e-6;
    return {
      answer: { value: sig(W), unit: "µJ" },
      distractors: [{ value: sig(2 * W), unit: "µJ", errorClass: "conceptual", tag: "ENERGY_HALF", feedback: "That's CV². The stored energy is ½CV²." }],
    };
  },
  hints: () => ["W = ½CV².", "C in farads: 1 nF = 10⁻⁹ F.", "Divide by 10⁻⁶ for µJ."],
  worked: (p) => [{ text: `W = ½ × ${p.C} × 10⁻⁹ × ${p.V}² = ${sig((0.5 * p.C * 1e-9 * p.V * p.V) / 1e-6)} µJ.` }],
  dimension: "computational",
  tags: { concepts: [CAP], misconceptions: ["ENERGY_HALF"], difficulty: 1 },
});

const capCoaxT = defineTemplate<{ a: number; b: number; er: number }>({
  id: "cap-coax",
  params: { a: { min: 0.5, max: 2, step: 0.5 }, b: { min: 3, max: 10, step: 1 }, er: { min: 1, max: 6, step: 1 } },
  prompt: (p) => `A coaxial cable has an inner conductor of radius ${p.a} mm, an outer conductor of inner radius ${p.b} mm, and a dielectric of εr = ${p.er} between them. Find its capacitance per metre, in pF/m.`,
  solve: (p) => {
    const k = 2 * Math.PI * p.er * EPS0;
    return {
      answer: { value: sig(k / Math.log(p.b / p.a) / 1e-12), unit: "pF/m" },
      distractors: [{ value: sig(k / Math.log10(p.b / p.a) / 1e-12), unit: "pF/m", errorClass: "conceptual", tag: "CAP_LN", feedback: "That uses log₁₀. The formula's ln is the natural log." }],
    };
  },
  hints: () => ["C/L = 2πε/ln(b/a).", "Only the ratio b/a enters, so mm can stay mm inside the log.", "ln is the natural log."],
  worked: (p) => [{ text: `ln(${p.b}/${p.a}) = ${sig(Math.log(p.b / p.a))}; C/L = 2π × ${p.er} × 8.854 × 10⁻¹² / ${sig(Math.log(p.b / p.a))} = ${sig((2 * Math.PI * p.er * EPS0) / Math.log(p.b / p.a) / 1e-12)} pF/m.` }],
  dimension: "computational",
  tags: { concepts: [CAP], misconceptions: ["CAP_LN"], difficulty: 2 },
});
```

- Append the five to `templates`.
- Check by hand:
  - `bnd-tangent` with εr 5 into free space and D₁ᵧ = 3: 0.6.
  - `cap-coax` with 1 mm and 4 mm: 5.56325e-11/1.386294 = 40.13 pF/m.

- [ ] **Step 4: Run** `pnpm vitest run packages/course-em1`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): templates for boundary D, refraction angles, and plate, coax and energy capacitance

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: Retire `em1.electrostatics.flux-density`

The spec (§3) says: "Its content lives in Gauss Idea 1 and dielectrics Idea 1. Its route redirects to Gauss's law and its prerequisites move to Gauss's law."

**Files:**
- Modify: `concepts/electrostatics.ts`, `concepts/gauss-law.ts`, `course-em1/src/index.ts`, `questions.ts`
- Modify: `app/packages/engine/src/learner-state.ts` (`retireConcept`), `app/apps/web/lib/store.ts`, `app/apps/web/next.config.ts`
- Modify: `docs/superpowers/resources/emag-catalog.md` (the ICT 2 row)
- Test: `app/packages/engine/test/retire.test.ts`, `app/packages/course-em1/test/retire.test.ts`

- [ ] **Step 1: Write the failing tests**

`app/packages/engine/test/retire.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { initialState, retireConcept } from "../src";

const OLD = "em1.electrostatics.flux-density", NEW = "em1.electrostatics.gauss-law";
describe("retireConcept", () => {
  it("moves the position to the successor's lesson, keeping the block", () => {
    const s = { ...initialState(), position: { conceptId: OLD, lessonId: "main", blockId: "q7a", branchStack: [] } };
    expect(retireConcept(s, OLD, NEW, "flux-density").position).toEqual({ conceptId: NEW, lessonId: "flux-density", blockId: "q7a", branchStack: [] });
  });
  it("drops the old progress and moves notebook entries", () => {
    const base = initialState();
    const s = { ...base, concepts: { [OLD]: { ...base.concepts[OLD]!, seen: true } as never }, notebook: [{ id: "n1", conceptId: OLD } as never] };
    const r = retireConcept(s, OLD, NEW, "flux-density");
    expect(OLD in r.concepts).toBe(false);
    expect((r.notebook[0] as { conceptId: string }).conceptId).toBe(NEW);
  });
  it("returns the same state when nothing refers to the old concept", () => {
    const s = initialState();
    expect(retireConcept(s, OLD, NEW, "flux-density")).toBe(s);
  });
});
```

`app/packages/course-em1/test/retire.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { course, questionBank, retiredConcepts } from "../src";

describe("flux-density is retired", () => {
  it("is gone from the course, and nothing points at it", () => {
    expect(course.concepts.some((c) => c.id === "em1.electrostatics.flux-density")).toBe(false);
    for (const c of course.concepts) for (const p of c.prerequisites) expect(p.conceptId).not.toBe("em1.electrostatics.flux-density");
    for (const q of questionBank) for (const k of q.concepts) expect(k.conceptId).not.toBe("em1.electrostatics.flux-density");
  });
  it("its blocks live on as Gauss's law, lesson flux-density", () => {
    const g = course.concepts.find((c) => c.id === "em1.electrostatics.gauss-law")!;
    expect(g.lessons.find((l) => l.id === "flux-density")!.blocks.map((b) => b.id)).toEqual(["psi", "faraday-lab", "q7a", "medium"]);
  });
  it("is declared retired, with its successor", () => {
    expect(retiredConcepts).toEqual([{ from: "em1.electrostatics.flux-density", to: "em1.electrostatics.gauss-law", lessonId: "flux-density" }]);
  });
});
```

If a `NotebookEntry` needs more fields than `id` and `conceptId` to type-check, the `as never` casts cover it. Do not widen the engine types.

- [ ] **Step 2: Run them and see them fail**

Run: `pnpm vitest run packages/engine/test/retire.test.ts packages/course-em1/test/retire.test.ts`
Expected: FAIL (`retireConcept` and `retiredConcepts` are not exported).

- [ ] **Step 3: Implement.**

**Engine** (`learner-state.ts`; export it from the engine index if the index lists names):

```ts
/** Moves a learner off a retired concept: position and notebook go to its successor; its progress is dropped. */
export function retireConcept(s: LearnerState, from: string, to: string, lessonId: string): LearnerState {
  const touches = from in s.concepts || s.position?.conceptId === from || s.notebook.some((n) => n.conceptId === from);
  if (!touches) return s;
  const { [from]: _dropped, ...concepts } = s.concepts;
  return {
    ...s,
    concepts,
    position: s.position?.conceptId === from ? { ...s.position, conceptId: to, lessonId } : s.position,
    notebook: s.notebook.map((n) => (n.conceptId === from ? { ...n, conceptId: to } : n)),
  };
}
```

If `NotebookEntry` has no `conceptId` field, find its concept reference with `grep -n "NotebookEntry = " packages/engine/src/learner-state.ts`, use that field, and log a ruling.

**Course:**
1. Move the four blocks of `fluxDensity.lessons[0].blocks` (`psi`, `faraday-lab`, `q7a`, `medium`), unchanged, into `gauss-law.ts` as a new lesson, placed after `quick`:

   ```ts
   { id: "flux-density", title: "Flux density D (quick)", minutes: 10, blocks: [ /* the four blocks, verbatim */ ] },
   ```

   Add whatever imports they need (`orig`, `WENT`, `SLIDES`, `meta`, `src`).
2. Append the `de-twice` rule to `gaussLaw.rules`, unless a rule with the id `de-twice` is already there. Its tag `D_VS_E_PERMITTIVITY` is already a Gauss's law misconception.
3. Delete `fluxDensity` from `electrostatics.ts`, and remove the unused `GL` constant if nothing else uses it.
4. In `gauss-law.ts`, replace the prerequisite `{ conceptId: "em1.electrostatics.flux-density", minMastery: 0.3 }` with `{ conceptId: "em1.electrostatics.field", minMastery: 0.3 }`.
5. In `index.ts`:
   - remove `fluxDensity` from the import and from `concepts`;
   - add `export const retiredConcepts = [{ from: "em1.electrostatics.flux-density", to: "em1.electrostatics.gauss-law", lessonId: "flux-density" }] as const;`
   - make the test's `toEqual` pass. If `as const` makes the arrays compare unequal, drop `as const`.
6. In `questions.ts`:
   - `mst-2324-q3b`: `[K.flux, 0.4]` becomes `[K.diel, 0.4]`.
   - `f2425-q1c`: `[K.flux, 0.2]` becomes `[K.diel, 0.2]`.
   - Delete the `flux` key from `K`.
   - Replace the `ict2-2425-q2` text with: `"Region 1 (εr1 = 21) and region 2 (εr2 = 7) meet at the plane −6x + 8y = 16. D₁ = −10ax − 20ay + 14az C·m⁻². Find (a) the unit normal to the plane, (b) D₂, (c) E₂, (d) tan θ₁/tan θ₂. (Data read from the lecturer's solution.)"`
7. In `course.test.ts`:
   - keep the `q7a` and `de-num` entries in `derived` (the blocks still exist);
   - the `fluxDensity` import there is the physics function, so it stays.

**Web:**
- `store.ts`, at hydration:

  ```ts
  const { state: migrated, reset, backup } = migrate(raw);
  const state = retiredConcepts.reduce((s, r) => retireConcept(s, r.from, r.to, r.lessonId), migrated);
  ```

  Import `retireConcept` from `@forma/engine` and `retiredConcepts` from `@forma/course-em1`.
- `next.config.ts`:

  ```ts
  async redirects() {
    return [
      { source: "/c/:course/em1.electrostatics.flux-density", destination: "/c/:course/em1.electrostatics.gauss-law", permanent: true },
      { source: "/learn/em1.electrostatics.flux-density/:lesson", destination: "/learn/em1.electrostatics.gauss-law/flux-density", permanent: true },
    ];
  },
  ```

**Catalog:** in the `ict2-2425` row, change "general plane 6x + 8y = 16" to "general plane −6x + 8y = 16 (εr1 = 21, εr2 = 7, D₁ = −10ax − 20ay + 14az)".

- [ ] **Step 4: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS.
- The F1 bank test ("every mapped concept exists") now passes only because `K.flux` is gone.
- Any e2e or unit test that visits the flux-density concept must now visit Gauss's law. Change it, and log a ruling naming the test.

- [ ] **Step 5: Commit**

```bash
git add -A packages apps/web ../docs/superpowers/resources/emag-catalog.md && git commit -m "refactor: retire flux-density into Gauss's law (blocks, rule, prerequisites, bank, redirects, saved learners)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 5: The dielectrics concept, and Ideas ①, ② and ③

**Files:**
- Create: `concepts/dielectrics.ts`, `plates/idea-polarization.ts`, `plates/idea-bc-tangential.ts`, `plates/idea-bc-normal.ts`
- Modify: `concepts/electrostatics.ts` (remove `locked("em1.electrostatics.dielectrics", …)`), `index.ts` (add `dielectricsConcept` after `currentConcept`), `plates/index.ts`

All plate files in Tasks 5–7 open with the same helpers:

```ts
const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
```

- [ ] **Step 1: The concept** in `concepts/dielectrics.ts`

```ts
import { meta, src } from "../sources";

const ID = "em1.electrostatics.dielectrics";
const L2C = "UTech ELE3001 Lec 2c slides (G. D. Boswell)";
export const dielectricsConcept = {
  id: ID,
  title: "Dielectrics and boundary conditions",
  unit: 2,
  objectives: [
    "Relate D, E and P in a dielectric: D = ε₀E + P = εr ε₀E.",
    "Apply the tangential condition E₁ₜ = E₂ₜ, so that D₂ₜ = (ε₂/ε₁)D₁ₜ.",
    "Split D into normal and tangential parts at any plane, and apply D₁ₙ − D₂ₙ = ρs.",
    "Find the angles fields make at a boundary, and use tan θ₁/tan θ₂ = ε₁/ε₂.",
    "Apply the conductor conditions: E = 0 inside, and Eₜ = 0 and Dₙ = ρs at the surface.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.gauss-law", minMastery: 0.3 }, { conceptId: "em1.math.vectors", minMastery: 0.3 }],
  misconceptions: [
    { tag: "D_VS_E_PERMITTIVITY", description: "Thinks D changes with the medium when the free charge doesn't.", remediation: "em1.electrostatics.gauss-law/d-vs-e" },
    { tag: "EPS0_DROPPED", description: "Divides D by εr but forgets ε₀.", remediation: `${ID}/main` },
    { tag: "BND_D_TANGENT", description: "Treats tangential D as continuous; it is tangential E.", remediation: `${ID}/main` },
    { tag: "BND_E_NORMAL", description: "Treats normal E as continuous; it is normal D (when ρs = 0).", remediation: `${ID}/main` },
    { tag: "BND_NORMAL_UNIT", description: "Projects onto the plane's coefficients without normalising them.", remediation: `${ID}/main` },
    { tag: "BND_RATIO_FLIP", description: "Inverts the permittivity ratio in D₂ₜ or in the refraction law.", remediation: `${ID}/main` },
    { tag: "COND_E_INSIDE", description: "Allows a field inside a conductor, or a tangential field on its surface.", remediation: `${ID}/main` },
  ],
  examLinks: [
    { paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q2(b)", marks: 17, weight: 1 },
    { paper: "UTech ELE3001 Finals 2023-24 Sem 1", question: "Q2(a)", marks: 13, weight: 1 },
  ],
  sources: [src(L2C, "Dielectrics and boundary conditions")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Dielectrics and boundaries (in depth)",
      minutes: 100,
      blocks: [
        { ...meta("vivid", src(L2C, "Polarization")), id: "idea-polarization", type: "plate" as const, plateId: "idea-polarization" },
        { ...meta("vivid", src(L2C, "Boundary conditions: tangential")), id: "idea-bc-tangential", type: "plate" as const, plateId: "idea-bc-tangential" },
        { ...meta("vivid", src(L2C, "Boundary conditions: normal")), id: "idea-bc-normal", type: "plate" as const, plateId: "idea-bc-normal" },
      ],
    },
  ],
};
```

Task 6 appends `idea-refraction` and `idea-conductor-bc`.

- [ ] **Step 2: `plates/idea-polarization.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

// R, choice and eqp as above.
const F2425 = { D1: [1, 3, -7] as [number, number, number], normal: [1, 0, 0] as [number, number, number], er1: 5, er2: 1 };

export const ideaPolarization = defineIdeaPlate({
  id: "idea-polarization",
  title: "Polarization and permittivity",
  requires: { objectives: [0], items: [], misconceptions: ["D_VS_E_PERMITTIVITY", "EPS0_DROPPED"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "b", component: "boundary", params: { ...F2425, show: ["E", "P"] } },
    { id: "eq", component: "equation", params: eqp(R`\mathbf D=\varepsilon_0\mathbf E+\mathbf P`, "D equals epsilon nought E plus P") },
  ],
  ideas: [
    {
      id: "polarization",
      title: "Polarization and permittivity",
      objectives: [0],
      explain: [
        {
          id: "bound", title: "Why a material weakens E", show: ["axes", "b", "eq"], focus: ["b", "eq"],
          note: "Put a dielectric in a field and its molecules stretch into tiny dipoles: each nucleus shifts one way, its electrons the other. That is polarization, P: dipole moment per unit volume, in C/m². The dipoles' own fields point back against the applied field, so E inside the material is weaker. The free charge hasn't changed, and D counts only free charge, so D = ε₀E + P. On the plate, region 1 has εr1 = 5 and holds D₁ = âₓ + 3âᵧ − 7âz C/m², Finals 2024-25's data.",
          claims: [{ instance: "b", readout: "P1x", value: 0.8, unit: "C/m^2" }],
        },
        {
          id: "epsr", title: "εr: one number for a linear material", patch: { eq: eqp(R`\mathbf P=\chi_e\varepsilon_0\mathbf E\ \Rightarrow\ \mathbf D=\varepsilon_r\varepsilon_0\mathbf E=\varepsilon\mathbf E`, "D equals epsilon r epsilon nought E") }, focus: ["eq", "b"],
          note: "In most materials P is proportional to E: P = χe ε₀E, where χe is the electric susceptibility. Then D = ε₀E + χe ε₀E = (1 + χe)ε₀E = εr ε₀E = εE. The relative permittivity εr = 1 + χe says how strongly the material polarizes. In region 1, E₁ = D₁/(5ε₀) = (0.2, 0.6, −1.4)/ε₀ = (0.2259, 0.6776, −1.581) × 10¹¹ V/m.",
          claims: [{ instance: "b", readout: "E1x", value: 2.25882e10, unit: "V/m" }, { instance: "b", readout: "E1z", value: -1.58117e11, unit: "V/m" }],
        },
        {
          id: "p-share", title: "How D splits between ε₀E and P", focus: ["b"],
          note: "Take D₁ apart. ε₀E₁ = D₁/5 = (0.2, 0.6, −1.4) C/m², and the rest is polarization: P₁ = D₁ − ε₀E₁ = (0.8, 2.4, −5.6) C/m². In general P = (1 − 1/εr)D, so here four fifths of D is carried by the material's dipoles. Free space has no molecules to polarize: region 2 is free space (εr2 = 1), so P₂ = 0 whatever the field.",
          claims: [{ instance: "b", readout: "P1x", value: 0.8, unit: "C/m^2" }, { instance: "b", readout: "P1z", value: -5.6, unit: "C/m^2" }, { instance: "b", readout: "P2x", value: 0, unit: "C/m^2" }],
        },
        {
          id: "d-free", title: "D sees only free charge", patch: { b: { er1: 2 } }, focus: ["b"],
          note: "This is why D is the useful field at boundaries and in Gauss's law: ∮D·dS = Q_free, whatever the material. Keep D₁ and change εr1 from 5 to 2. P₁ drops to (0.5, 1.5, −3.5) C/m², and E₁ grows to (0.5, 1.5, −3.5)/ε₀. The free charges set D; the material only decides how it divides between ε₀E and P.",
          claims: [{ instance: "b", readout: "P1x", value: 0.5, unit: "C/m^2" }, { instance: "b", readout: "E1x", value: 5.64705e10, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "f2425-p", level: "basic", title: "E and P in Finals 2024-25's region 1",
          setup: { b: { ...F2425 } },
          problem: "Region 1 of Finals 2024-25 Q2(b) has εr1 = 5 and D₁ = âₓ + 3âᵧ − 7âz C/m². Find E₁ and P₁.",
          lines: [
            { text: "E₁ = D₁/(εr1 ε₀) = (0.2, 0.6, −1.4)/ε₀ V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E1y", value: 6.77645e10, unit: "V/m" }] },
            { text: "P₁ = D₁ − ε₀E₁ = (1 − 1/5)D₁ = (0.8, 2.4, −5.6) C/m².", focus: ["b"], claims: [{ instance: "b", readout: "P1y", value: 2.4, unit: "C/m^2" }] },
          ],
          trap: "Dividing D by εr alone gives ε₀E, not E. Divide by εr ε₀.",
        },
        {
          id: "hw03-p", level: "tutorial", title: "HW03 3.2's region 1",
          setup: { b: { D1: [-10, -20, 14], normal: [-3, 0, 4], er1: 8, er2: 5 } },
          problem: "In HW03 3.2, region 1 has ε₁ = 8ε₀ and D₁ = −10âₓ − 20âᵧ + 14âz C/m². Find E₁ in terms of ε₀, then P₁.",
          lines: [
            { text: "E₁ = D₁/(8ε₀) = (−1.25, −2.5, 1.75)/ε₀ V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E1x", value: -1.41176e11, unit: "V/m" }] },
            { text: "P₁ = (1 − 1/8)D₁ = 0.875D₁ = (−8.75, −17.5, 12.25) C/m².", focus: ["b"], claims: [{ instance: "b", readout: "P1x", value: -8.75, unit: "C/m^2" }] },
            { text: "Check: ε₀E₁ + P₁ = (−1.25 − 8.75, −2.5 − 17.5, 1.75 + 12.25) = D₁.", focus: ["b"] },
          ],
          trap: "Evaluating ε₀ when the question asks for E in terms of ε₀. Leave it as a symbol.",
        },
        {
          id: "ict-er", level: "exam", title: "Working back from P to εr",
          setup: { b: { D1: [-10, -20, 14], normal: [-6, 8, 0], er1: 21, er2: 7 } },
          problem: "In a dielectric, D₁ = −10âₓ − 20âᵧ + 14âz C/m² and P₁ = (−9.524, −19.05, 13.33) C/m². Find εr1 and the susceptibility χe.",
          lines: [
            { text: "P = (1 − 1/εr)D, so 1 − 1/εr1 = P₁ₓ/D₁ₓ = −9.524/−10 = 0.9524.", focus: ["b"], claims: [{ instance: "b", readout: "P1x", value: -9.52381, unit: "C/m^2" }] },
            { text: "1/εr1 = 0.04762, so εr1 = 21 and χe = εr1 − 1 = 20. (These are ICT 2's region 1 values.)", focus: ["b"] },
          ],
          trap: "Taking εr = D/P = 1.05. P is the material's share of D; the ratio P/D is 1 − 1/εr, not 1/εr.",
        },
      ],
      asks: [
        { id: "why-weaker", q: "Why is E smaller inside a dielectric?", a: "The material's dipoles line up with the field, and each dipole's own field points from its + end back to its − end, against the applied field. Their sum partly cancels it. The free charge is unchanged, so D is unchanged, and E = D/ε is smaller." },
        { id: "d-change", q: "Does D change when I fill the space with a dielectric?", tags: ["D_VS_E_PERMITTIVITY"], a: "Not if the free charges stay the same. Gauss's law, ∮D·dS = Q_free, doesn't mention the material. E and P change; D doesn't. At a boundary, D's tangential part does change: that's Idea 2." },
        { id: "units", q: "What are P's units?", a: "The same as D's: C/m². P is dipole moment (C·m) per unit volume (m³), which works out to charge per unit area." },
        { id: "chi", q: "What's the difference between χe and εr?", a: "εr = 1 + χe. Free space has χe = 0 and εr = 1. χe counts only the material's extra response; εr also includes the vacuum's own share." },
        { id: "eps-e0", q: "Why divide by εr ε₀ and not just εr?", tags: ["EPS0_DROPPED"], a: "D/εr is ε₀E: you still have ε₀ attached. E = D/(εr ε₀). Leaving ε₀ out gives an answer about 10¹¹ times too small, in C/m² instead of V/m." },
        { id: "free-space", q: "Why is P zero in free space?", a: "There are no molecules to polarize. With εr = 1, P = (1 − 1/εr)D = 0 and D = ε₀E exactly." },
        { id: "linear", q: "Is every material linear?", a: "No. Ferroelectrics, and any material in a very strong field, break P = χe ε₀E. This course and its exams assume linear, isotropic, homogeneous dielectrics, where one εr describes the material." },
      ],
      checks: [
        {
          id: "split-c", title: "Check: D in a dielectric", show: ["axes", "b", "eq"], patch: { b: { ...F2425 } },
          note: "Four checks on polarization and permittivity. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "split-c", type: "choose", prompt: "In a linear dielectric, D equals…", dimension: "recognition",
            options: [
              choice("sum", "ε₀E + P", true, "Right: the vacuum's share plus the material's."),
              choice("e0e", "ε₀E only", false, "That's free space. The material adds P."),
              choice("p", "P only", false, "P is the material's share; ε₀E is still there."),
            ] },
        },
        {
          id: "predict-p", title: "Check: a stronger dielectric",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-p", type: "predict-drag", prompt: "εr1 rises from 5 to 10, with the same D₁. Drag P₁ₓ to your prediction.", target: { instance: "b", readout: "P1x" }, range: [0, 1], unit: "C/m^2", relTol: 0.05, reveal: { b: { er1: 10 } }, dimension: "conceptual",
            feedback: { close: "Right: (1 − 1/10) × 1 = 0.9 C/m².", far: "P = (1 − 1/εr)D: 0.9 C/m²." } },
        },
        {
          id: "e-num", title: "Check: E from D",
          note: "Back to εr1 = 5.",
          patch: { b: { er1: 5 } },
          interaction: { id: "e-num", type: "numeric", prompt: "Region 1 has εr1 = 5 and D₁ = âₓ + 3âᵧ − 7âz C/m². Find E₁ₓ in V/m.", answer: { value: 2.25882e10, unit: "V/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0.2, unit: "V/m", errorClass: "conceptual", tag: "EPS0_DROPPED", feedback: "That's ε₀E₁ₓ. Divide by ε₀ as well." }],
            hints: ["E = D/(εr ε₀).", "D₁ₓ = 1, εr1 = 5.", "1/(5 × 8.854 × 10⁻¹²)."] },
        },
        {
          id: "d-same", title: "Check: what stays fixed",
          note: "Last one.",
          interaction: { id: "d-same", type: "choose", prompt: "The free charges stay fixed while a dielectric fills the space around them. Which is unchanged?", dimension: "conceptual",
            options: [
              choice("d", "D", true, "Right: D is set by the free charge alone."),
              choice("e", "E", false, "E drops by εr. It's D that stays.", "D_VS_E_PERMITTIVITY"),
              choice("p", "P", false, "P appears only because of the material."),
            ] },
        },
      ],
      recap: {
        points: [
          "Polarization P is dipole moment per unit volume, in C/m²; it weakens E inside the material.",
          "D = ε₀E + P = εr ε₀E = εE, with εr = 1 + χe.",
          "P = (1 − 1/εr)D; in free space P = 0.",
          "D depends only on free charge; E = D/(εr ε₀).",
        ],
        traps: ["Dividing by εr but not ε₀.", "Thinking a dielectric changes D.", "Evaluating ε₀ when asked for E in terms of ε₀."],
      },
    },
  ],
});
```

Check the exam line by hand: P₁ₓ = (20/21)(−10) = −9.5238.

- [ ] **Step 3: `plates/idea-bc-tangential.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice and eqp as above.
const bt = instantiate(templates.find((t) => t.id === "bnd-tangent")!, 1);
const F2425 = { D1: [1, 3, -7] as [number, number, number], normal: [1, 0, 0] as [number, number, number], er1: 5, er2: 1, rhoS: 0 };
const F2324 = { D1: [3, -4, 6] as [number, number, number], normal: [1, 0, 0] as [number, number, number], er1: 1, er2: 3.5, rhoS: 0 };

export const ideaBcTangential = defineIdeaPlate({
  id: "idea-bc-tangential",
  title: "Tangential E is continuous",
  requires: { objectives: [1], items: ["f2425-q2b", "f2324-q2a"], misconceptions: ["BND_D_TANGENT"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "b", component: "boundary", params: { ...F2425, show: ["split", "D", "E"] } },
    { id: "eq", component: "equation", params: eqp(R`\mathbf D_1=\mathbf D_{1n}+\mathbf D_{1t}`, "D one equals its normal part plus its tangential part") },
  ],
  ideas: [
    {
      id: "tangential",
      title: "Tangential E is continuous",
      objectives: [1],
      explain: [
        {
          id: "split", title: "First, split D", show: ["axes", "b", "eq"], focus: ["b", "eq"],
          note: "Every boundary problem starts the same way. Split the field into a part along the unit normal n̂ and a part lying in the boundary plane: D₁ₙ = (D₁·n̂)n̂ and D₁ₜ = D₁ − D₁ₙ. Finals 2024-25 Q2(b) uses the plane x = 0, so n̂ = âₓ and the split is just reading components: D₁ₙ = âₓ and D₁ₜ = 3âᵧ − 7âz C/m². A slanted plane needs the dot product; Idea 3 does that.",
          claims: [{ instance: "b", readout: "D1nx", value: 1, unit: "C/m^2" }, { instance: "b", readout: "D1ty", value: 3, unit: "C/m^2" }, { instance: "b", readout: "D1tz", value: -7, unit: "C/m^2" }],
        },
        {
          id: "loop", title: "A thin loop across the boundary", patch: { eq: eqp(R`\oint\mathbf E\cdot d\mathbf L=0\ \Rightarrow\ \mathbf E_{1t}=\mathbf E_{2t}`, "the loop integral of E is zero, so E one t equals E two t") }, focus: ["eq", "b"],
          note: "Draw a small rectangle straddling the interface: two long sides parallel to it, one in each region, and two short sides crossing it. An electrostatic field is conservative, so ∮E·dL = 0 round the rectangle. Shrink the short sides to nothing and only the long sides count: E₁ₜΔw − E₂ₜΔw = 0. The tangential component of E is the same on both sides. On the plate both regions have E's y-component 6.776 × 10¹⁰ V/m.",
          claims: [{ instance: "b", readout: "E1y", value: 6.77645e10, unit: "V/m" }, { instance: "b", readout: "E2y", value: 6.77645e10, unit: "V/m" }],
        },
        {
          id: "d-jumps", title: "So tangential D jumps", patch: { eq: eqp(R`\mathbf D_{2t}=\dfrac{\varepsilon_2}{\varepsilon_1}\mathbf D_{1t}`, "D two t equals epsilon two over epsilon one times D one t") }, focus: ["eq", "b"],
          note: "Now convert to D. D = εE on each side, so D₁ₜ/ε₁ = D₂ₜ/ε₂, or D₂ₜ = (ε₂/ε₁)D₁ₜ. In Finals 2024-25, region 1 (x < 0, εr1 = 5) holds D₁, and region 2 (x > 0) is free space. The tangential part 3âᵧ − 7âz shrinks by a factor of 5, to 0.6âᵧ − 1.4âz C/m².",
          claims: [{ instance: "b", readout: "D2y", value: 0.6, unit: "C/m^2" }, { instance: "b", readout: "D2z", value: -1.4, unit: "C/m^2" }],
        },
        {
          id: "free-e", title: "E₂ in free space", focus: ["b"],
          note: "Region 2 is free space, so E₂ = D₂/ε₀. With D₂ₙ = âₓ (Idea 3 explains why the normal part carries over) and D₂ₜ = 0.6âᵧ − 1.4âz, D₂ = âₓ + 0.6âᵧ − 1.4âz C/m² and E₂ = (1.129, 0.678, −1.581) × 10¹¹ V/m. Check the tangential part: E₂ᵧ = 0.6/ε₀ = 3/(5ε₀) = E₁ᵧ. Continuous, as promised.",
          claims: [{ instance: "b", readout: "E2x", value: 1.12941e11, unit: "V/m" }, { instance: "b", readout: "E2y", value: 6.77645e10, unit: "V/m" }, { instance: "b", readout: "E1y", value: 6.77645e10, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "basic", level: "basic", title: "Scaling the tangential part",
          setup: { b: { D1: [3, 0, 5], normal: [0, 0, 1], er1: 2, er2: 4, rhoS: 0 } },
          problem: "At the plane z = 0, region 1 (z > 0, εr1 = 2) has D₁ = 3âₓ + 5âz C/m², and region 2 (z < 0) has εr2 = 4. Find D₂'s tangential part.",
          lines: [
            { text: "Tangential to z = 0 means the x and y parts: D₁ₜ = 3âₓ C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D1tx", value: 3, unit: "C/m^2" }] },
            { text: "D₂ₜ = (ε₂/ε₁)D₁ₜ = (4/2)(3âₓ) = 6âₓ C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D2x", value: 6, unit: "C/m^2" }] },
          ],
          trap: "Copying D₁ₜ across unchanged. E's tangential part is continuous; D's is multiplied by ε₂/ε₁.",
        },
        {
          id: "f2324", level: "tutorial", title: "Finals 2023-24 Q2(a)(i): E₂",
          setup: { b: { ...F2324 } },
          problem: "Region 1 (x < 0) is free space; region 2 (x > 0) is a dielectric with εr2 = 3.5. Given D₁ = 3âₓ − 4âᵧ + 6âz C/m², compute E₂.",
          lines: [
            { text: "n̂ = âₓ: D₁ₙ = 3âₓ and D₁ₜ = −4âᵧ + 6âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D1nx", value: 3, unit: "C/m^2" }] },
            { text: "Tangential E carries over: E₂ₜ = E₁ₜ = (−4âᵧ + 6âz)/ε₀.", focus: ["b"], claims: [{ instance: "b", readout: "E2y", value: -4.51764e11, unit: "V/m" }] },
            { text: "Normal D carries over (no surface charge): D₂ₙ = 3âₓ, so E₂ₙ = 3âₓ/(3.5ε₀).", focus: ["b"] },
            { text: "E₂ = (0.857âₓ − 4âᵧ + 6âz)/ε₀ = (0.968, −4.518, 6.776) × 10¹¹ V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E2x", value: 9.68065e10, unit: "V/m" }, { instance: "b", readout: "E2z", value: 6.77645e11, unit: "V/m" }] },
          ],
          covers: ["f2324-q2a"],
          trap: "Dividing the tangential part by 3.5 as well. Only E's normal part changes across this boundary.",
        },
        {
          id: "f2425", level: "exam", title: "Finals 2024-25 Q2(b)(i)–(ii): E₂ and D₂",
          setup: { b: { ...F2425 } },
          problem: "Region 1 (x < 0) is a dielectric with εr1 = 5; region 2 (x > 0) is free space. Given D₁ = âₓ + 3âᵧ − 7âz C/m², calculate (i) E₂ and (ii) D₂.",
          lines: [
            { text: "n̂ = âₓ: D₁ₙ = âₓ and D₁ₜ = 3âᵧ − 7âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D1nx", value: 1, unit: "C/m^2" }] },
            { text: "E₂ₜ = E₁ₜ = D₁ₜ/(5ε₀), so D₂ₜ = ε₀E₂ₜ = (3âᵧ − 7âz)/5 = 0.6âᵧ − 1.4âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D2y", value: 0.6, unit: "C/m^2" }] },
            { text: "D₂ₙ = D₁ₙ = âₓ (ρs = 0), so D₂ = âₓ + 0.6âᵧ − 1.4âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D2x", value: 1, unit: "C/m^2" }, { instance: "b", readout: "D2z", value: -1.4, unit: "C/m^2" }] },
            { text: "E₂ = D₂/ε₀ = (1.129, 0.678, −1.581) × 10¹¹ V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E2x", value: 1.12941e11, unit: "V/m" }, { instance: "b", readout: "E2z", value: -1.58117e11, unit: "V/m" }] },
          ],
          covers: ["f2425-q2b"],
          trap: "Dividing D₂ by 5ε₀. Region 2 is free space, so E₂ = D₂/ε₀.",
        },
      ],
      asks: [
        { id: "why-t", q: "Why is it E, not D, whose tangential part is continuous?", tags: ["BND_D_TANGENT"], a: "The rule comes from ∮E·dL = 0, which is a statement about E. D = εE, and ε differs on the two sides, so if Eₜ matches, Dₜ can't: D₂ₜ = (ε₂/ε₁)D₁ₜ." },
        { id: "loop-short", q: "Why shrink the short sides of the loop?", a: "So the loop hugs the boundary. The short sides' contributions vanish as their length goes to zero, leaving only the tangential field just above and just below the surface." },
        { id: "which-t", q: "Which components are tangential?", a: "Those lying in the boundary plane. For x = 0 they're the y and z parts. For a slanted plane, subtract the normal part: Dₜ = D − (D·n̂)n̂." },
        { id: "vector", q: "Is the rule for the magnitude or the vector?", a: "The whole tangential vector. E₁ₜ = E₂ₜ component by component, direction within the plane included." },
        { id: "e0-symbol", q: "How do I give E₂ in terms of ε₀?", a: "Divide D₂ by ε₂ = εr2 ε₀ and leave ε₀ as a symbol, as HW03 3.2(b) asks: E₂ = D₂/(5ε₀). Only put in 8.854 × 10⁻¹² when the question wants V/m." },
        { id: "conductor-link", q: "What if region 2 is a conductor?", a: "Then E₂ = 0 inside it, and continuity forces E₁ₜ = 0 too: the field meets a conductor at right angles. Idea 5 does this properly." },
      ],
      checks: [
        {
          id: "which-cont", title: "Check: what's continuous", show: ["axes", "b", "eq"], patch: { b: { ...F2425 } },
          note: "Four checks on the tangential condition. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "which-cont", type: "choose", prompt: "Across a charge-free boundary between two dielectrics, which two are continuous?", dimension: "recognition",
            options: [
              choice("right", "Tangential E and normal D", true, "Right: Eₜ from the loop, Dₙ from the pillbox."),
              choice("swap", "Tangential D and normal E", false, "Swapped: it's Eₜ and Dₙ.", "BND_D_TANGENT"),
              choice("all", "All of E", false, "E's normal part jumps by ε₁/ε₂."),
            ] },
        },
        {
          id: "predict-er2", title: "Check: a dielectric in region 2",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-er2", type: "predict-drag", prompt: "Region 2 changes from free space to εr2 = 2.5. Drag D₂ᵧ to your prediction.", target: { instance: "b", readout: "D2y" }, range: [0, 3], unit: "C/m^2", relTol: 0.05, reveal: { b: { er2: 2.5 } }, dimension: "conceptual",
            feedback: { close: "Right: (2.5/5) × 3 = 1.5 C/m².", far: "D₂ₜ = (ε₂/ε₁)D₁ₜ: (2.5/5) × 3 = 1.5 C/m²." } },
        },
        {
          id: "t-num", title: "Check: a boundary, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "t-num", type: "numeric", prompt: bt.prompt, answer: bt.spec.answer, distractors: bt.spec.distractors, relTol: bt.spec.relTol, hints: bt.hints, template: "bnd-tangent", dimension: "computational" },
        },
        {
          id: "f2425-e2", title: "Check: Finals 2024-25 Q2(b)(i)",
          note: "Last one.",
          patch: { b: { ...F2425 } },
          interaction: { id: "f2425-e2", type: "numeric", prompt: "Finals 2024-25 Q2(b): εr1 = 5 (x < 0), free space for x > 0, D₁ = âₓ + 3âᵧ − 7âz C/m². Find E₂ₓ in V/m.", answer: { value: 1.12941e11, unit: "V/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 2.25882e10, unit: "V/m", errorClass: "conceptual", tag: "BND_E_NORMAL", feedback: "That's E₁ₓ. Normal E jumps; it's normal D that's continuous, so E₂ₓ = D₁ₓ/ε₀." }],
            hints: ["x is normal to x = 0.", "D₂ₓ = D₁ₓ = 1.", "E₂ₓ = 1/ε₀."] },
          covers: ["f2425-q2b"],
        },
      ],
      recap: {
        points: [
          "Split first: D₁ₙ = (D₁·n̂)n̂ and D₁ₜ = D₁ − D₁ₙ.",
          "∮E·dL = 0 gives E₁ₜ = E₂ₜ: tangential E is continuous.",
          "So D₂ₜ = (ε₂/ε₁)D₁ₜ: tangential D jumps.",
          "In free space E = D/ε₀.",
        ],
        traps: ["Treating tangential D as continuous.", "Scaling the normal part too.", "Dividing by the wrong region's ε."],
      },
    },
  ],
});
```

- [ ] **Step 4: `plates/idea-bc-normal.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

// R, choice and eqp as above.
type V3 = [number, number, number];
const ICT = { D1: [-10, -20, 14] as V3, normal: [-6, 8, 0] as V3, er1: 21, er2: 7, rhoS: 0 };
const HW03 = { D1: [-10, -20, 14] as V3, normal: [-3, 0, 4] as V3, er1: 8, er2: 5, rhoS: 0 };
const FREE = { D1: [3, 0, 5] as V3, normal: [0, 0, 1] as V3, er1: 2, er2: 4, rhoS: 2 };
const SHEET = { D1: [0, 0, 6e-5] as V3, normal: [0, 0, 1] as V3, er1: 1, er2: 1, rhoS: 1.2e-4 };

export const ideaBcNormal = defineIdeaPlate({
  id: "idea-bc-normal",
  title: "Normal D and surface charge",
  requires: { objectives: [2], items: ["ict2-2425-q2", "hw03-2425-3.2", "mst-2324-q3b"], misconceptions: ["BND_E_NORMAL", "BND_NORMAL_UNIT"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "b", component: "boundary", params: { ...ICT, show: ["n", "split"] } },
    { id: "eq", component: "equation", params: eqp(R`\mathbf D_{1n}-\mathbf D_{2n}=\rho_S\,\hat{\mathbf n}`, "D one n minus D two n equals rho S") },
  ],
  ideas: [
    {
      id: "normal",
      title: "Normal D and surface charge",
      objectives: [2],
      explain: [
        {
          id: "pillbox", title: "A pillbox across the boundary", show: ["axes", "b", "eq"], focus: ["eq", "b"],
          note: "Now a Gaussian pillbox: a flat cylinder with one face in each region and a height shrinking to zero. Gauss's law says the flux out equals the free charge inside. Only the two faces count, so (D₁ₙ − D₂ₙ)ΔS = ρsΔS, with n̂ pointing from region 2 into region 1: D₁ₙ − D₂ₙ = ρs. An ordinary interface between dielectrics carries no free surface charge, ρs = 0, so the normal component of D is continuous: D₁ₙ = D₂ₙ.",
        },
        {
          id: "unit-normal", title: "The unit normal of any plane", focus: ["b"],
          note: "ICT 2's boundary is the plane −6x + 8y = 16. The gradient of −6x + 8y gives its normal, (−6, 8, 0); divide by its length, 10, for the unit normal n̂ = (−0.6, 0.8, 0). Normalising matters: projecting onto (−6, 8, 0) makes every normal component ten times too big. The 16 only locates the plane; it never enters the field calculation.",
          claims: [{ instance: "b", readout: "nx", value: -0.6, unit: "" }, { instance: "b", readout: "ny", value: 0.8, unit: "" }],
        },
        {
          id: "project", title: "Project, then subtract", focus: ["b"],
          note: "With D₁ = −10âₓ − 20âᵧ + 14âz C/m² and εr1 = 21: D₁·n̂ = 6 − 16 + 0 = −10, so D₁ₙ = −10n̂ = 6âₓ − 8âᵧ C/m². The rest is tangential: D₁ₜ = D₁ − D₁ₙ = −16âₓ − 12âᵧ + 14âz C/m². The lecturer's advice: keep n̂ as a symbol until the dot product is done, and only then substitute, so nothing gets rounded early.",
          claims: [
            { instance: "b", readout: "D1nx", value: 6, unit: "C/m^2" }, { instance: "b", readout: "D1ny", value: -8, unit: "C/m^2" },
            { instance: "b", readout: "D1tx", value: -16, unit: "C/m^2" }, { instance: "b", readout: "D1ty", value: -12, unit: "C/m^2" }, { instance: "b", readout: "D1tz", value: 14, unit: "C/m^2" },
          ],
        },
        {
          id: "assemble", title: "Assemble D₂ and E₂", patch: { b: { show: ["n", "split", "D", "E"] } }, focus: ["b"],
          note: "Apply both rules. Normal D carries over: D₂ₙ = 6âₓ − 8âᵧ. Tangential E carries over, so D₂ₜ = (ε₂/ε₁)D₁ₜ = (7/21)(−16, −12, 14) = (−5.333, −4, 4.667) C/m². Add them: D₂ = 0.667âₓ − 12âᵧ + 4.667âz C/m². Then E₂ = D₂/(7ε₀) = (0.1076, −1.936, 0.7529) × 10¹¹ V/m, which matches the lecturer's (1.08, −19.4, 7.53) × 10¹⁰.",
          claims: [
            { instance: "b", readout: "D2x", value: 0.666667, unit: "C/m^2" }, { instance: "b", readout: "D2y", value: -12, unit: "C/m^2" }, { instance: "b", readout: "D2z", value: 4.66667, unit: "C/m^2" },
            { instance: "b", readout: "E2y", value: -1.9361e11, unit: "V/m" },
          ],
        },
        {
          id: "surface-charge", title: "When ρs isn't zero", patch: { b: { ...SHEET, show: ["D", "rhoS"] } }, focus: ["b"],
          note: "Free charge on the interface makes normal D jump by exactly ρs. The mid-semester test's infinite sheet with ρs = 120 µC/m² is the extreme case: the same medium on both sides, so symmetry splits the jump evenly. D is 60 µC/m² pointing away from the sheet on each side, so D₁ₙ − D₂ₙ = 60 − (−60) = 120 µC/m². In free space, E = D/ε₀ = 6.776 × 10⁶ V/m on either side.",
          claims: [{ instance: "b", readout: "rhoS", value: 1.2e-4, unit: "C/m^2" }, { instance: "b", readout: "D1z", value: 6e-5, unit: "C/m^2" }, { instance: "b", readout: "D2z", value: -6e-5, unit: "C/m^2" }],
        },
      ],
      examples: [
        {
          id: "free", level: "basic", title: "A charged interface",
          setup: { b: { ...FREE, show: ["D", "rhoS"] } },
          problem: "The plane z = 0 carries ρs = 2 C/m². Region 1 (z > 0, εr1 = 2) has D₁ = 3âₓ + 5âz C/m²; region 2 (z < 0) has εr2 = 4. Find D₂.",
          lines: [
            { text: "n̂ = âz points from region 2 into region 1. Normal: D₂ₙ = D₁ₙ − ρs = 5 − 2 = 3, so D₂ₙ = 3âz.", focus: ["b"], claims: [{ instance: "b", readout: "D2z", value: 3, unit: "C/m^2" }] },
            { text: "Tangential: D₂ₜ = (4/2)(3âₓ) = 6âₓ.", focus: ["b"], claims: [{ instance: "b", readout: "D2x", value: 6, unit: "C/m^2" }] },
            { text: "D₂ = 6âₓ + 3âz C/m².", focus: ["b"] },
          ],
          trap: "Getting n̂ backwards gives D₂ₙ = 5 + 2 = 7. The rule D₁ₙ − D₂ₙ = ρs needs n̂ pointing from region 2 into region 1.",
        },
        {
          id: "ict2", level: "tutorial", title: "ICT 2 (Nov 2024) Q2(a)–(c)",
          setup: { b: { ...ICT, show: ["n", "split", "D", "E"] } },
          problem: "Region 1 (εr1 = 21) and region 2 (εr2 = 7) meet at the plane −6x + 8y = 16. D₁ = −10âₓ − 20âᵧ + 14âz C/m². Find (a) the unit normal, (b) D₂, (c) E₂.",
          lines: [
            { text: "(a) ∇(−6x + 8y) = (−6, 8, 0); n̂ = (−6, 8, 0)/10 = (−0.6, 0.8, 0).", focus: ["b"], claims: [{ instance: "b", readout: "nx", value: -0.6, unit: "" }] },
            { text: "(b) D₁·n̂ = −10, so D₁ₙ = 6âₓ − 8âᵧ and D₁ₜ = −16âₓ − 12âᵧ + 14âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D1nx", value: 6, unit: "C/m^2" }, { instance: "b", readout: "D1tx", value: -16, unit: "C/m^2" }] },
            { text: "D₂ₙ = D₁ₙ and D₂ₜ = (7/21)D₁ₜ, so D₂ = 0.667âₓ − 12âᵧ + 4.667âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D2x", value: 0.666667, unit: "C/m^2" }, { instance: "b", readout: "D2z", value: 4.66667, unit: "C/m^2" }] },
            { text: "(c) E₂ = D₂/(7ε₀) = (1.076âₓ − 19.36âᵧ + 7.529âz) × 10¹⁰ V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E2x", value: 1.07563e10, unit: "V/m" }, { instance: "b", readout: "E2z", value: 7.52939e10, unit: "V/m" }] },
          ],
          covers: ["ict2-2425-q2"],
          trap: "Scaling the whole of D₁ by 7/21. Only the tangential part changes; the normal part crosses unchanged.",
        },
        {
          id: "hw03", level: "exam", title: "HW03 3.2(a)–(b)",
          setup: { b: { ...HW03, show: ["n", "split", "D", "E"] } },
          problem: "Region 1 (ε₁ = 8ε₀) and region 2 (ε₂ = 5ε₀) meet at the plane −3x + 4z = 15. D₁ = −10.0âₓ − 20.0âᵧ + 14.0âz C/m². Stating your assumptions, calculate (a) D₂ and (b) E₂ in terms of ε₀.",
          lines: [
            { text: "Assume no free charge on the interface (ρs = 0), and linear, isotropic, homogeneous media, so D = εE with one ε per region.", focus: ["b"] },
            { text: "n̂ = (−3, 0, 4)/5 = (−0.6, 0, 0.8). D₁·n̂ = 6 + 0 + 11.2 = 17.2.", focus: ["b"], claims: [{ instance: "b", readout: "nx", value: -0.6, unit: "" }, { instance: "b", readout: "nz", value: 0.8, unit: "" }] },
            { text: "D₁ₙ = 17.2n̂ = −10.32âₓ + 13.76âz; D₁ₜ = 0.32âₓ − 20âᵧ + 0.24âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D1nx", value: -10.32, unit: "C/m^2" }, { instance: "b", readout: "D1tz", value: 0.24, unit: "C/m^2" }] },
            { text: "(a) D₂ = D₁ₙ + (5/8)D₁ₜ = −10.12âₓ − 12.5âᵧ + 13.91âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D2x", value: -10.12, unit: "C/m^2" }, { instance: "b", readout: "D2y", value: -12.5, unit: "C/m^2" }, { instance: "b", readout: "D2z", value: 13.91, unit: "C/m^2" }] },
            { text: "(b) E₂ = D₂/(5ε₀) = (−2.024âₓ − 2.5âᵧ + 2.782âz)/ε₀ V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E2x", value: -2.28592e11, unit: "V/m" }] },
          ],
          covers: ["hw03-2425-3.2"],
          trap: "Normalising with 25 instead of 5: |(−3, 0, 4)| = √(9 + 16) = 5.",
        },
      ],
      asks: [
        { id: "flat", q: "Why must the pillbox be flat?", a: "With zero height, no flux leaves through the curved side, and the only charge inside is what sits on the surface itself: ρs times the face area." },
        { id: "normalise", q: "Why divide the normal by its length?", tags: ["BND_NORMAL_UNIT"], a: "The projection D·n̂ gives the normal component only when n̂ has length 1. ICT 2's (−6, 8, 0) has length 10, so skipping the step makes D₁ₙ ten times too large." },
        { id: "the-16", q: "What does the 16 in −6x + 8y = 16 do?", a: "It sets where the plane sits, not which way it faces. Every parallel plane has the same normal and gives the same D₂ and E₂." },
        { id: "which-side", q: "Does it matter which way n̂ points?", a: "Not when ρs = 0: the split into D₁ₙ and D₁ₜ is the same either way. With surface charge it does: D₁ₙ − D₂ₙ = ρs assumes n̂ points from region 2 into region 1." },
        { id: "en-jumps", q: "So is normal E continuous?", tags: ["BND_E_NORMAL"], a: "No. D₁ₙ = D₂ₙ means ε₁E₁ₙ = ε₂E₂ₙ, so E₂ₙ = (ε₁/ε₂)E₁ₙ. In ICT 2, E's normal part triples on the way from εr1 = 21 into εr2 = 7." },
        { id: "assumptions", q: "What assumptions should I state?", a: "No free surface charge on the interface (ρs = 0), and linear, isotropic, homogeneous media, so D = εE with a single ε on each side. HW03 3.2 gives marks for stating them." },
        { id: "sheet", q: "How is a charged sheet a boundary problem?", a: "It's an interface carrying ρs with the same medium on both sides. D₁ₙ − D₂ₙ = ρs, and symmetry makes the two sides equal and opposite: ρs/2 each, pointing away." },
      ],
      checks: [
        {
          id: "normal-c", title: "Check: the normal condition", show: ["axes", "b", "eq"], patch: { b: { ...ICT, show: ["n", "split", "D"] } },
          note: "Five checks on the normal condition. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "normal-c", type: "choose", prompt: "At a boundary with no free surface charge…", dimension: "recognition",
            options: [
              choice("dn", "D₁ₙ = D₂ₙ", true, "Right: from the pillbox, with ρs = 0."),
              choice("en", "E₁ₙ = E₂ₙ", false, "E's normal part jumps by ε₁/ε₂. It's D that's continuous.", "BND_E_NORMAL"),
              choice("d", "D₁ = D₂", false, "Only the normal part. Dₜ scales by ε₂/ε₁."),
            ] },
        },
        {
          id: "unit-n", title: "Check: a unit normal",
          note: "A new plane.",
          interaction: { id: "unit-n", type: "numeric", prompt: "Find the y-component of the unit normal to the plane 2x + 3y + 6z = 12.", answer: { value: 0.428571, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 3, unit: "", errorClass: "conceptual", tag: "BND_NORMAL_UNIT", feedback: "Divide by the length, √(4 + 9 + 36) = 7." }],
            hints: ["The normal is (2, 3, 6).", "Its length is √(4 + 9 + 36) = 7.", "n̂ᵧ = 3/7."] },
        },
        {
          id: "predict-rho", title: "Check: more surface charge",
          note: "Predict first; then the plate shows the result.",
          patch: { b: { ...FREE, show: ["D", "rhoS"] } },
          interaction: { id: "predict-rho", type: "predict-drag", prompt: "The interface's ρs rises from 2 to 4 C/m², with the same D₁. Drag D₂z to your prediction.", target: { instance: "b", readout: "D2z" }, range: [-5, 10], unit: "C/m^2", relTol: 0.05, reveal: { b: { rhoS: 4 } }, dimension: "conceptual",
            feedback: { close: "Right: 5 − 4 = 1 C/m².", far: "D₂ₙ = D₁ₙ − ρs = 5 − 4 = 1 C/m²." } },
        },
        {
          id: "mst-sheet", title: "Check: MST Q3(b)",
          note: "The charged sheet.",
          patch: { b: { ...SHEET, show: ["D", "rhoS"] } },
          interaction: { id: "mst-sheet", type: "numeric", prompt: "MST Q3(b): an infinite plane in free space carries ρs = 120 µC/m². Find |D| at a point off the plane, in µC/m².", answer: { value: 60, unit: "µC/m^2" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 120, unit: "µC/m^2", errorClass: "conceptual", feedback: "That's the whole jump. Half goes each way: ρs/2." }],
            hints: ["D₁ₙ − D₂ₙ = ρs.", "By symmetry D₁ₙ = −D₂ₙ.", "|D| = ρs/2."] },
          covers: ["mst-2324-q3b"],
        },
        {
          id: "hw03-d2", title: "Check: HW03 3.2(a)",
          note: "Last one.",
          patch: { b: { ...HW03, show: ["n", "split", "D"] } },
          interaction: { id: "hw03-d2", type: "numeric", prompt: "HW03 3.2: ε₁ = 8ε₀, ε₂ = 5ε₀, plane −3x + 4z = 15, D₁ = −10âₓ − 20âᵧ + 14âz C/m². Find D₂ᵧ in C/m².", answer: { value: -12.5, unit: "C/m^2" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: -20, unit: "C/m^2", errorClass: "conceptual", tag: "BND_D_TANGENT", feedback: "y is tangential to this plane, so D₂ᵧ = (5/8)D₁ᵧ." }],
            hints: ["n̂ = (−0.6, 0, 0.8) has no y part, so D₁ᵧ is all tangential.", "D₂ₜ = (ε₂/ε₁)D₁ₜ.", "(5/8) × (−20)."] },
          covers: ["hw03-2425-3.2"],
        },
      ],
      recap: {
        points: [
          "A pillbox gives D₁ₙ − D₂ₙ = ρs, with n̂ from region 2 into region 1; with ρs = 0, Dₙ is continuous.",
          "For a plane ax + by + cz = d, n̂ = (a, b, c)/√(a² + b² + c²); d doesn't matter.",
          "Recipe: n̂; D₁ₙ = (D₁·n̂)n̂; D₁ₜ = D₁ − D₁ₙ; D₂ = D₁ₙ + (ε₂/ε₁)D₁ₜ; E₂ = D₂/ε₂.",
          "A charged sheet in one medium: D = ρs/2 each side.",
        ],
        traps: ["Projecting onto an unnormalised normal.", "Scaling the normal part by ε₂/ε₁.", "Treating normal E as continuous."],
      },
    },
  ],
});
```

Check the sheet step by hand: 1.2 × 10⁻⁴ / 2 = 6 × 10⁻⁵, and 6 × 10⁻⁵/ε₀ = 6.7765 × 10⁶ V/m.

- [ ] **Step 5: Register.**
  - In `plates/index.ts`, add the three plates.
  - In `concepts/electrostatics.ts`, remove the `locked("em1.electrostatics.dielectrics", …)` line.
  - In `index.ts`, import `{ dielectricsConcept }` and add it after `currentConcept`.
  - Run `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS. Lint notes:
    - "60 µC/m²" is backed by `D1z` (6 × 10⁻⁵ C/m², converted to µC/m²).
    - "120 µC/m²" is backed by `rhoS`.
    - The ICT and HW03 D values in C/m² are not linted; claims cover them.

- [ ] **Step 6: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): dielectrics concept; polarization, the tangential condition (Finals 24-25 and 23-24 Q2) and the normal condition (ICT 2 Q2, HW03 3.2, MST Q3(b))

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 6: Ideas ④ and ⑤ (refraction; conductors)

**Files:** Create `plates/idea-refraction.ts` and `plates/idea-conductor-bc.ts`. Append both to the dielectrics `main` lesson, and register them.

- [ ] **Step 1: `plates/idea-refraction.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice and eqp as above.
type V3 = [number, number, number];
const ba = instantiate(templates.find((t) => t.id === "bnd-angle")!, 1);
const F2425 = { D1: [1, 3, -7] as V3, normal: [1, 0, 0] as V3, er1: 5, er2: 1, rhoS: 0, measure: "normal" as const };
const F2324 = { D1: [3, -4, 6] as V3, normal: [1, 0, 0] as V3, er1: 1, er2: 3.5, rhoS: 0, measure: "normal" as const };
const HW03 = { D1: [-10, -20, 14] as V3, normal: [-3, 0, 4] as V3, er1: 8, er2: 5, rhoS: 0, measure: "tangent" as const };

export const ideaRefraction = defineIdeaPlate({
  id: "idea-refraction",
  title: "The refraction law",
  requires: { objectives: [3], items: ["f2425-q2b", "f2324-q2a", "hw03-2425-3.2", "ict2-2425-q2"], misconceptions: ["BND_RATIO_FLIP"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "b", component: "boundary", params: { ...F2425, show: ["angles", "mag"] } },
    { id: "eq", component: "equation", params: eqp(R`\dfrac{\tan\theta_1}{\tan\theta_2}=\dfrac{\varepsilon_1}{\varepsilon_2}`, "tan theta one over tan theta two equals epsilon one over epsilon two") },
  ],
  ideas: [
    {
      id: "refraction",
      title: "The refraction law",
      objectives: [3],
      explain: [
        {
          id: "bend", title: "Field lines bend at the boundary", show: ["axes", "b", "eq"], focus: ["b", "eq"],
          note: "Measure each field's angle θ from the normal. Then tan θ is tangential over normal: tan θ = |Dₜ|/|Dₙ|. Dₙ is the same on both sides, and Dₜ scales by ε₂/ε₁, so tan θ₂ = (ε₂/ε₁) tan θ₁, or tan θ₁/tan θ₂ = ε₁/ε₂. In Finals 2024-25, D₁ meets the boundary at θ₁ = 82.52° in the εr1 = 5 region and bends to θ₂ = 56.71° in free space: closer to the normal on the lower-permittivity side.",
          claims: [{ instance: "b", readout: "th1", value: 82.5195, unit: "°" }, { instance: "b", readout: "th2", value: 56.7138, unit: "°" }],
        },
        {
          id: "direct", title: "Or compute θ directly", patch: { eq: eqp(R`\theta=\tan^{-1}\dfrac{|\mathbf D_t|}{|\mathbf D_n|}`, "theta equals the inverse tangent of D t over D n") }, focus: ["eq", "b"],
          note: "You can find θ₂ without the law: θ₂ = tan⁻¹(|D₂ₜ|/|D₂ₙ|). For Finals 2024-25, |D₂ₜ| = √(0.6² + 1.4²) = 1.523 and |D₂ₙ| = 1, so θ₂ = tan⁻¹ 1.523 = 56.71°. The law then checks it: tan 82.52°/tan 56.71° = 7.616/1.523 = 5 = εr1/εr2. Within one region D and E point the same way, so both make the same angle.",
          claims: [{ instance: "b", readout: "th2", value: 56.7138, unit: "°" }],
        },
        {
          id: "tangent", title: "Measured from the tangent instead", patch: { b: { ...HW03 } }, focus: ["b"],
          note: "Some questions measure θ from the interface itself. Then tan θ is normal over tangential, and the ratio flips: tan θ₁/tan θ₂ = ε₂/ε₁. HW03 3.2 does this: θ₁ = 40.69° and θ₂ = 53.99° from the tangent, and tan 40.69°/tan 53.99° = 0.625 = 5/8. The lecturer's ICT 2 solution shows both conventions. Read which one the question uses before you write the law.",
          claims: [{ instance: "b", readout: "th1", value: 40.6899, unit: "°" }, { instance: "b", readout: "th2", value: 53.987, unit: "°" }],
        },
        {
          id: "cos", title: "HW03's cos ratio", focus: ["b"],
          note: "HW03 3.2(d) asks for cos θ₁/cos θ₂, with θ from the tangent. Then cos θ = |Eₜ|/|E|, and Eₜ is the same on both sides, so the ratio is |E₂|/|E₁| = 4.803/3.724 = 1.290. The comment it wants: unlike the tangent ratio, this isn't fixed by the materials. It depends on D₁'s direction, and it exceeds 1 because the field is stronger in region 2, the lower-permittivity side.",
          claims: [{ instance: "b", readout: "E1mag", value: 3.72448e11, unit: "V/m" }, { instance: "b", readout: "E2mag", value: 4.80312e11, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "f2425", level: "basic", title: "Finals 2024-25 Q2(b)(iii): θ₂",
          setup: { b: { ...F2425 } },
          problem: "Continuing Finals 2024-25 Q2(b), with D₂ = âₓ + 0.6âᵧ − 1.4âz C/m², find the angle θ₂ that D₂ makes with the normal.",
          lines: [
            { text: "|D₂ₜ| = √(0.6² + 1.4²) = 1.523 and |D₂ₙ| = 1.", focus: ["b"] },
            { text: "θ₂ = tan⁻¹(1.523/1) = 56.71° from the normal.", focus: ["b"], claims: [{ instance: "b", readout: "th2", value: 56.7138, unit: "°" }] },
            { text: "Check: tan θ₁ = √(3² + 7²)/1 = 7.616, and 7.616/1.523 = 5 = εr1/εr2.", focus: ["b"], claims: [{ instance: "b", readout: "th1", value: 82.5195, unit: "°" }] },
          ],
          covers: ["f2425-q2b"],
          trap: "Answering 33.29° without saying so. That's the angle from the interface; from the normal it's 56.71°. State your convention.",
        },
        {
          id: "f2324", level: "tutorial", title: "Finals 2023-24 Q2(a)(ii): θ₁",
          setup: { b: { ...F2324 } },
          problem: "Region 1 (x < 0) is free space, region 2 (x > 0) has εr2 = 3.5, and D₁ = 3âₓ − 4âᵧ + 6âz C/m². Find θ₁ from the normal, then θ₂.",
          lines: [
            { text: "D₁ₙ = 3âₓ and D₁ₜ = −4âᵧ + 6âz, so tan θ₁ = √(16 + 36)/3 = 7.211/3 = 2.404.", focus: ["b"] },
            { text: "θ₁ = 67.41° from the normal.", focus: ["b"], claims: [{ instance: "b", readout: "th1", value: 67.4115, unit: "°" }] },
            { text: "tan θ₂ = 3.5 × 2.404 = 8.413, so θ₂ = 83.22°: the field swings away from the normal in the denser dielectric.", focus: ["b"], claims: [{ instance: "b", readout: "th2", value: 83.2214, unit: "°" }] },
          ],
          covers: ["f2324-q2a"],
          trap: "Inverting the ratio (tan θ₂ = 2.404/3.5) gives 34.48°, bending the wrong way.",
        },
        {
          id: "hw03", level: "exam", title: "HW03 3.2(c)–(d): angles from the tangent",
          setup: { b: { ...HW03 } },
          problem: "For HW03 3.2 (ε₁ = 8ε₀, ε₂ = 5ε₀, plane −3x + 4z = 15), find θ₁ and θ₂, the angles between the field vectors and the interface's tangent, then cos θ₁/cos θ₂, and comment.",
          lines: [
            { text: "From the tangent, tan θ = |Dₙ|/|Dₜ|. Region 1: tan θ₁ = 17.2/20.004 = 0.8598, so θ₁ = 40.69°.", focus: ["b"], claims: [{ instance: "b", readout: "th1", value: 40.6899, unit: "°" }] },
            { text: "Region 2: |D₂ₙ| = 17.2 and |D₂ₜ| = 12.502, so tan θ₂ = 1.376 and θ₂ = 53.99°.", focus: ["b"], claims: [{ instance: "b", readout: "th2", value: 53.987, unit: "°" }] },
            { text: "(d) cos θ₁/cos θ₂ = 0.7582/0.5880 = 1.290 = |E₂|/|E₁|. It isn't a material constant: the fixed ratio is tan θ₁/tan θ₂ = ε₂/ε₁ = 0.625.", focus: ["b"], claims: [{ instance: "b", readout: "E2mag", value: 4.80312e11, unit: "V/m" }] },
          ],
          covers: ["hw03-2425-3.2"],
          trap: "Using the from-the-normal law here. HW03 measures from the tangent, so tan θ₁/tan θ₂ = ε₂/ε₁.",
        },
      ],
      asks: [
        { id: "flip", q: "Which way up is the ratio?", tags: ["BND_RATIO_FLIP"], a: "From the normal, tan θ₁/tan θ₂ = ε₁/ε₂. From the tangent, flip it. A sanity check, measuring from the normal: the field lies closer to the normal on the lower-permittivity side." },
        { id: "same-dir", q: "Do D and E bend by the same angle?", a: "Yes. Within one region D = εE with a single ε, so D and E point the same way. Only their sizes differ." },
        { id: "head-on", q: "What if the field meets the boundary head-on?", a: "Then θ₁ = 0, there's no tangential part, and θ₂ = 0 too. The field crosses straight, with the same D and a different E." },
        { id: "grazing", q: "And if the field runs along the boundary?", a: "θ₁ = 90° from the normal: no normal part. Then D₂ₙ = 0 as well, and the field stays in the plane on both sides, with E unchanged and D scaled by ε₂/ε₁." },
        { id: "cos-comment", q: "What comment does HW03 3.2(d) want?", a: "That cos θ₁/cos θ₂ = |E₂|/|E₁|, because the tangential E is shared. It depends on the field's direction, unlike the tangent ratio, which the permittivities alone fix." },
        { id: "degrees", q: "Degrees or radians?", a: "Degrees, to two decimal places, and say which reference you measured from. The papers give marks for the convention as well as the number." },
      ],
      checks: [
        {
          id: "law-c", title: "Check: the law", show: ["axes", "b", "eq"], patch: { b: { ...F2425 } },
          note: "Four checks on the refraction law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "law-c", type: "choose", prompt: "With θ measured from the normal, tan θ₁/tan θ₂ =", dimension: "recognition",
            options: [
              choice("right", "ε₁/ε₂", true, "Right: Dₜ scales by ε₂/ε₁ while Dₙ stays."),
              choice("flip", "ε₂/ε₁", false, "That's the law from the tangent.", "BND_RATIO_FLIP"),
              choice("one", "1", false, "Only if ε₁ = ε₂."),
            ] },
        },
        {
          id: "predict-er1", title: "Check: a stronger region 1",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-er1", type: "predict-drag", prompt: "εr1 rises from 5 to 10, with the same D₁. Drag θ₂ to your prediction.", target: { instance: "b", readout: "th2" }, range: [0, 90], unit: "°", relTol: 0.05, reveal: { b: { er1: 10 } }, dimension: "conceptual",
            feedback: { close: "Right: tan θ₂ = 7.616/10, so θ₂ = 37.29°.", far: "tan θ₂ = (ε₂/ε₁) tan θ₁ = 7.616/10: θ₂ = 37.29°." } },
        },
        {
          id: "angle-num", title: "Check: an angle, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "angle-num", type: "numeric", prompt: ba.prompt, answer: ba.spec.answer, distractors: ba.spec.distractors, relTol: ba.spec.relTol, hints: ba.hints, template: "bnd-angle", dimension: "computational" },
        },
        {
          id: "ict-ratio", title: "Check: ICT 2 Q2(d)",
          note: "Last one.",
          interaction: { id: "ict-ratio", type: "numeric", prompt: "ICT 2: εr1 = 21 and εr2 = 7, with θ measured from the tangent. Find tan θ₁/tan θ₂.", answer: { value: 0.333333, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 3, unit: "", errorClass: "conceptual", tag: "BND_RATIO_FLIP", feedback: "That's the ratio from the normal. From the tangent it's ε₂/ε₁ = 7/21." }],
            hints: ["From the tangent, tan θ = |Dₙ|/|Dₜ|.", "Dₙ is shared; Dₜ scales by ε₂/ε₁.", "tan θ₁/tan θ₂ = ε₂/ε₁."] },
          covers: ["ict2-2425-q2"],
        },
      ],
      recap: {
        points: [
          "From the normal: tan θ = |Dₜ|/|Dₙ| and tan θ₁/tan θ₂ = ε₁/ε₂.",
          "From the tangent: the ratio flips to ε₂/ε₁.",
          "D and E share each region's angle.",
          "cos θ₁/cos θ₂ (from the tangent) = |E₂|/|E₁|; not a material constant.",
        ],
        traps: ["Mixing up the conventions.", "Inverting the ratio.", "Giving an angle without saying what it's measured from."],
      },
    },
  ],
});
```

Checks by hand:
- `predict-er1`: tan⁻¹(√58/10) = 37.292°.
- The `f2324` trap: tan⁻¹(2.4037/3.5) = 34.48°.

- [ ] **Step 2: `plates/idea-conductor-bc.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

// R, choice and eqp as above.
type V3 = [number, number, number];
const AIR = { D1: [0, 0, 5e-9] as V3, normal: [0, 0, 1] as V3, er1: 1, er2: 1, conductor: true, show: ["rhoS", "E", "D"] as ("rhoS" | "E" | "D")[] };

export const ideaConductorBc = defineIdeaPlate({
  id: "idea-conductor-bc",
  title: "Conductor boundaries",
  requires: { objectives: [4], items: [], misconceptions: ["COND_E_INSIDE"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "b", component: "boundary", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`\mathbf E_{\text{inside}}=0,\quad E_t=0,\quad D_n=\rho_S`, "inside, E is zero; at the surface, E t is zero and D n equals rho S") },
  ],
  ideas: [
    {
      id: "conductor",
      title: "Conductor boundaries",
      objectives: [4],
      explain: [
        {
          id: "inside", title: "E = 0 inside a conductor", show: ["axes", "b", "eq"], focus: ["b", "eq"],
          note: "A conductor is full of free electrons. If any field existed inside, they would move until their new arrangement cancelled it. In electrostatics that happens almost instantly, so inside a conductor E = 0, D = 0 and ρv = 0, and any excess charge sits on the surface. The whole conductor is one equipotential. On the plate, region 2 is the conductor: its field readouts are exactly zero.",
          claims: [{ instance: "b", readout: "E2z", value: 0, unit: "V/m" }, { instance: "b", readout: "D2z", value: 0, unit: "C/m^2" }],
        },
        {
          id: "tangential", title: "No tangential E at the surface", focus: ["b", "eq"],
          note: "Apply the loop rule with region 2 a conductor. E₂ₜ = 0, so E₁ₜ = 0 just outside as well. The field leaves a conductor's surface at right angles, which is why field lines always meet metal perpendicularly. If a tangential field existed, the surface charges would slide along until it vanished.",
          claims: [{ instance: "b", readout: "E1x", value: 0, unit: "V/m" }],
        },
        {
          id: "normal", title: "Normal D equals the surface charge", focus: ["b"],
          note: "Apply the pillbox rule. D₂ = 0 inside, so D₁ₙ − 0 = ρs: just outside, D = ρs n̂, with n̂ pointing out of the conductor. On the plate, D₁ = 5âz nC/m² above a conductor surface at z = 0, so ρs = 5 nC/m², and in air E₁ = ρs/ε₀ = 564.7 V/m.",
          claims: [{ instance: "b", readout: "rhoS", value: 5e-9, unit: "C/m^2" }, { instance: "b", readout: "E1z", value: 564.705, unit: "V/m" }],
        },
        {
          id: "sign", title: "Field into the surface means negative charge", patch: { b: { D1: [0, 0, -5e-9] } }, focus: ["b"],
          note: "Reverse the field so it points into the metal, and ρs = D₁·n̂ = −5 nC/m²: field lines end on negative charge. The sign comes straight out of the dot product, as long as n̂ points out of the conductor into the other region.",
          claims: [{ instance: "b", readout: "rhoS", value: -5e-9, unit: "C/m^2" }],
        },
      ],
      examples: [
        {
          id: "air", level: "basic", title: "ρs and E above a conductor",
          setup: { b: { ...AIR } },
          problem: "Just above a conductor's flat surface at z = 0, in air, D = 5âz nC/m². Find ρs and |E| there.",
          lines: [
            { text: "n̂ = âz points out of the conductor, so ρs = D·n̂ = 5 nC/m².", focus: ["b"], claims: [{ instance: "b", readout: "rhoS", value: 5e-9, unit: "C/m^2" }] },
            { text: "E = D/ε₀ = 564.7 V/m, normal to the surface.", focus: ["b"], claims: [{ instance: "b", readout: "E1z", value: 564.705, unit: "V/m" }] },
          ],
          trap: "Using ρs/(2ε₀). That's a lone sheet with field on both sides; a conductor has no field inside, so all of the flux goes outward.",
        },
        {
          id: "slanted", level: "tutorial", title: "A slanted conductor surface",
          setup: { b: { D1: [-1.8e-9, 2.4e-9, 0], normal: [-6, 8, 0], er1: 2.5, er2: 1, conductor: true, show: ["rhoS", "mag"] } },
          problem: "A conductor's surface lies in the plane −6x + 8y = 16, with n̂ pointing out of the metal. The dielectric outside has εr1 = 2.5, and just outside D₁ = −1.8âₓ + 2.4âᵧ nC/m². Find ρs and |E₁|.",
          lines: [
            { text: "n̂ = (−0.6, 0.8, 0), and D₁ is along it, as it must be at a conductor.", focus: ["b"] },
            { text: "ρs = D₁·n̂ = 1.08 + 1.92 = 3 nC/m².", focus: ["b"], claims: [{ instance: "b", readout: "rhoS", value: 3e-9, unit: "C/m^2" }] },
            { text: "|E₁| = |D₁|/(2.5ε₀) = 3 × 10⁻⁹/(2.5ε₀) = 135.5 V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E1mag", value: 135.529, unit: "V/m" }] },
          ],
          trap: "Forgetting the dielectric outside: E₁ = D₁/(εr ε₀), not D₁/ε₀.",
        },
        {
          id: "impossible", level: "exam", title: "Spotting an impossible field",
          setup: { b: { D1: [0, 0, -2.65626e-9], normal: [0, 0, 1], er1: 1, er2: 1, conductor: true, show: ["rhoS", "E"] } },
          problem: "A conductor fills z < 0. A student claims that just above its surface, in air, E = 200âₓ − 300âz V/m. What's wrong? Taking only the physically possible part, find ρs.",
          lines: [
            { text: "The 200âₓ part is tangential. Just outside a conductor in electrostatics Eₜ = 0, so that part can't be right; only the normal part survives.", focus: ["b"] },
            { text: "ρs = ε₀Eₙ = 8.854 × 10⁻¹² × (−300) = −2.656 nC/m².", focus: ["b"], claims: [{ instance: "b", readout: "rhoS", value: -2.65626e-9, unit: "C/m^2" }] },
            { text: "It's negative because the field points into the conductor.", focus: ["b"] },
          ],
          trap: "Using |E| = 360.6, tangential part included. At a conductor only Eₙ is physical.",
        },
      ],
      asks: [
        { id: "why-zero", q: "Why is E zero inside a conductor?", tags: ["COND_E_INSIDE"], a: "Any field inside would push the free electrons, and they'd keep moving until they had cancelled it. Static means they've stopped, so the field inside is zero." },
        { id: "where-charge", q: "Where does excess charge go on a conductor?", a: "To the surface. Gauss's law with E = 0 inside says there's no net charge within any surface drawn inside the metal." },
        { id: "perpendicular", q: "Why do field lines meet a conductor at right angles?", a: "Tangential E just outside equals tangential E just inside, which is zero. Only the normal part survives." },
        { id: "sheet-vs-cond", q: "Why ρs/ε₀ here but ρs/(2ε₀) for a sheet?", a: "A lone sheet sends half its flux each way. A conductor's surface charge sends all of it outward, because none goes into the metal. The same charge gives twice the field on the one side." },
        { id: "equipotential", q: "Why is a conductor an equipotential?", a: "With E = 0 inside, moving a charge anywhere in the conductor takes no work, so V is the same everywhere in it, surface included." },
        { id: "current", q: "But Ohm's law needs E in a wire?", tags: ["COND_E_INSIDE"], a: "Yes, while a steady current flows. 'E = 0 inside' is the electrostatic statement, once charges have stopped moving. The small field in a current-carrying wire is the non-static case." },
      ],
      checks: [
        {
          id: "inside-c", title: "Check: inside the metal", show: ["axes", "b", "eq"], patch: { b: { ...AIR } },
          note: "Four checks on conductors. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "inside-c", type: "choose", prompt: "In electrostatics, inside a conductor…", dimension: "recognition",
            options: [
              choice("zero", "E = 0 and ρv = 0", true, "Right: any charge sits on the surface."),
              choice("uniform", "E is uniform", false, "Any field would move the free charges until it vanished.", "COND_E_INSIDE"),
              choice("rhos", "E = ρs/ε₀", false, "That's just outside the surface."),
            ] },
        },
        {
          id: "rho-num", title: "Check: ρs from E",
          note: "A number.",
          interaction: { id: "rho-num", type: "numeric", prompt: "Just outside a conductor, in air, |E| = 1.2 kV/m, pointing away from the surface. Find ρs in nC/m².", answer: { value: 10.625, unit: "nC/m^2" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 5.3125, unit: "nC/m^2", errorClass: "conceptual", feedback: "That's the lone-sheet formula. A conductor's field is all on one side: ρs = ε₀E." }],
            hints: ["Dₙ = ρs, and D = ε₀E in air.", "ρs = 8.854 × 10⁻¹² × 1200.", "Convert C/m² to nC/m²."] },
        },
        {
          id: "predict-sign", title: "Check: the field reverses",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-sign", type: "predict-drag", prompt: "The field just outside flips to point into the conductor, at the same size. Drag ρs to your prediction.", target: { instance: "b", readout: "rhoS" }, range: [-1e-8, 1e-8], unit: "C/m^2", relTol: 0.05, reveal: { b: { D1: [0, 0, -5e-9] } }, dimension: "conceptual",
            feedback: { close: "Right: −5 × 10⁻⁹ C/m².", far: "ρs = D·n̂, now negative: −5 × 10⁻⁹ C/m²." } },
        },
        {
          id: "tangent-c", title: "Check: along the surface",
          note: "Last one.",
          interaction: { id: "tangent-c", type: "choose", prompt: "Just outside a charged conductor, the tangential part of E is…", dimension: "conceptual",
            options: [
              choice("zero", "zero", true, "Right: it matches the zero field inside."),
              choice("rhos", "ρs/ε₀", false, "That's the normal part."),
              choice("equal", "equal to the normal part", false, "Any tangential field would make the surface charges slide.", "COND_E_INSIDE"),
            ] },
        },
      ],
      recap: {
        points: [
          "Inside a conductor, E = 0, D = 0 and ρv = 0; excess charge sits on the surface.",
          "At the surface, Eₜ = 0: fields meet conductors at right angles.",
          "Dₙ = ρs, with n̂ out of the conductor; E = ρs/ε just outside.",
        ],
        traps: ["Using ρs/(2ε₀) for a conductor.", "Allowing a tangential field at a conductor.", "Losing ρs's sign."],
      },
    },
  ],
});
```

Checks by hand:
- 5 × 10⁻⁹/ε₀ = 564.70 V/m.
- 3 × 10⁻⁹/(2.5ε₀) = 135.53 V/m.
- 1200ε₀ = 1.0625 × 10⁻⁸ C/m².
- −300ε₀ = −2.6563 × 10⁻⁹ C/m².

- [ ] **Step 3: Register.**
  - In `plates/index.ts`, add both plates.
  - Append both blocks to the dielectrics `main` lesson:

    ```ts
    { ...meta("vivid", src(L2C, "Refraction of field lines")), id: "idea-refraction", type: "plate" as const, plateId: "idea-refraction" },
    { ...meta("vivid", src(L2C, "Conductor boundaries")), id: "idea-conductor-bc", type: "plate" as const, plateId: "idea-conductor-bc" },
    ```

  - Run `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS.
    - The `AIR.show` cast keeps the literal types. If the `show` enum type is exported from `@forma/plate`, use it instead.
    - "5 nC/m²", "−5 nC/m²", "3 nC/m²" and "−2.656 nC/m²" are backed by `rhoS`.
    - "564.7 V/m" and "135.5 V/m" are backed by `E1z` and `E1mag`.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): dielectrics Ideas 4 and 5, the refraction law (all four exam boundaries) and conductor boundaries

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 7: The capacitance concept, and Ideas ⑥, ⑦ and ⑧

**Files:**
- Create: `concepts/capacitance.ts`, `plates/idea-parallel-plate.ts`, `plates/idea-cap-energy.ts`, `plates/idea-coax-sphere.ts`
- Modify: `concepts/electrostatics.ts` (remove `locked("em1.electrostatics.capacitance", …)`), `index.ts` (add `capacitanceConcept` after `dielectricsConcept`), `plates/index.ts`

- [ ] **Step 1: The concept** in `concepts/capacitance.ts`

```ts
import { meta, src } from "../sources";

const ID = "em1.electrostatics.capacitance";
const L2C = "UTech ELE3001 Lec 2c slides (G. D. Boswell)";
export const capacitanceConcept = {
  id: ID,
  title: "Capacitance and stored energy",
  unit: 2,
  objectives: [
    "Define capacitance, C = Q/V, and find it for parallel plates: C = εS/d.",
    "Find the stored energy, W = ½CV² = ½QV = ½Q²/C, and the energy density w_E = ½εE².",
    "Find the capacitance of coaxial and spherical capacitors.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.dielectrics", minMastery: 0.3 }, { conceptId: "em1.electrostatics.potential", minMastery: 0.3 }],
  misconceptions: [
    { tag: "CAP_UNITS", description: "Leaves cm², mm or µm unconverted in C = εS/d.", remediation: `${ID}/main` },
    { tag: "ENERGY_HALF", description: "Drops the ½ in W = ½CV².", remediation: `${ID}/main` },
    { tag: "ENERGY_DENSITY_UNIT", description: "Gives energy density per area (J/m²) instead of per volume (J/m³).", remediation: `${ID}/main` },
    { tag: "CAP_LN", description: "Uses log₁₀, or diameters, in C = 2πεL/ln(b/a).", remediation: `${ID}/main` },
  ],
  examLinks: [
    { paper: "UTech ELE3001 Mid-semester test 2023-24", question: "Q4(c)", marks: 6, weight: 1 },
    { paper: "UTech ELE3001 Mid-semester test 2023-24", question: "Q5(b)", marks: 10, weight: 1 },
  ],
  sources: [src(L2C, "Capacitance")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Capacitance and energy (in depth)",
      minutes: 60,
      blocks: [
        { ...meta("vivid", src(L2C, "Parallel-plate capacitor")), id: "idea-parallel-plate", type: "plate" as const, plateId: "idea-parallel-plate" },
        { ...meta("vivid", src(L2C, "Energy stored")), id: "idea-cap-energy", type: "plate" as const, plateId: "idea-cap-energy" },
        { ...meta("vivid", src(L2C, "Coaxial and spherical capacitors")), id: "idea-coax-sphere", type: "plate" as const, plateId: "idea-coax-sphere" },
      ],
    },
  ],
};
```

- [ ] **Step 2: `plates/idea-parallel-plate.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice and eqp as in Task 5.
const cp = instantiate(templates.find((t) => t.id === "cap-parallel")!, 1);
const AIR = { kind: "parallel" as const, area: 0.01, d: 1e-3, er: 1, V: 100 };
const MST = { kind: "parallel" as const, area: 0.12, d: 8e-5, er: 33.46397, V: 15 };

export const ideaParallelPlate = defineIdeaPlate({
  id: "idea-parallel-plate",
  title: "Capacitance and the parallel-plate capacitor",
  requires: { objectives: [0], items: ["mst-2324-q5b"], misconceptions: ["CAP_UNITS"] },
  instances: [
    { id: "cap", component: "capacitor", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`C=\dfrac{Q}{V}`, "C equals Q over V") },
  ],
  ideas: [
    {
      id: "parallel",
      title: "Capacitance and the parallel-plate capacitor",
      objectives: [0],
      explain: [
        {
          id: "cq", title: "C = Q/V", show: ["cap", "eq"], focus: ["cap", "eq"],
          note: "A capacitor is two conductors holding equal and opposite charges, +Q and −Q. The voltage between them is proportional to Q, and the constant of proportionality is the capacitance: C = Q/V, in farads (coulombs per volt). It depends only on the geometry and the dielectric, never on Q or V. On the plate, plates of area 0.01 m² with a 1 mm air gap hold 8.854 nC at 100 V, so C = 88.54 pF.",
          claims: [{ instance: "cap", readout: "C", value: 8.85419e-11, unit: "F" }, { instance: "cap", readout: "Q", value: 8.85419e-9, unit: "C" }],
        },
        {
          id: "derive", title: "Deriving C = εS/d", patch: { eq: eqp(R`E=\dfrac{Q}{\varepsilon S},\quad V=Ed\ \Rightarrow\ C=\dfrac{\varepsilon S}{d}`, "C equals epsilon S over d") }, focus: ["eq"],
          note: "Put +Q on the top plate. Between wide plates the field is uniform, and the conductor rule gives E = ρs/ε = Q/(εS). The voltage is V = Ed = Qd/(εS). Divide: C = Q/V = εS/d, and Q cancels, as it always does. The same recipe works for every shape: assume ±Q, find E (usually with Gauss's law), integrate for V, and divide.",
          claims: [{ instance: "cap", readout: "C", value: 8.85419e-11, unit: "F" }],
        },
        {
          id: "dielectric", title: "A dielectric multiplies C by εr", patch: { cap: { er: 4 } }, focus: ["cap"],
          note: "Fill the gap with a dielectric of εr = 4 and C = εr ε₀S/d grows fourfold, to 354.2 pF. At the same 100 V the plates now hold 35.42 nC. The dielectric's polarization partly cancels the free charge's field, so more charge fits for the same voltage.",
          claims: [{ instance: "cap", readout: "C", value: 3.54168e-10, unit: "F" }, { instance: "cap", readout: "Q", value: 3.54168e-8, unit: "C" }],
        },
        {
          id: "scale", title: "More area, less gap", patch: { cap: { er: 1, area: 0.02, d: 5e-4 } }, focus: ["cap"],
          note: "C grows with the area and shrinks as the gap widens. Back in air, double the area to 0.02 m² and halve the gap to 0.5 mm: C = 4 × 88.54 = 354.2 pF, the same gain the dielectric gave. Real capacitors use all three tricks at once: large rolled-up foils, very thin films and high-εr materials.",
          claims: [{ instance: "cap", readout: "C", value: 3.54168e-10, unit: "F" }],
        },
      ],
      examples: [
        {
          id: "air", level: "basic", title: "Plates in air",
          setup: { cap: { ...AIR } },
          problem: "Plates of area 100 cm² are 1 mm apart in air. Find C, and Q at 100 V.",
          lines: [
            { text: "Convert: S = 100 cm² = 0.01 m², and d = 1 mm = 0.001 m.", focus: ["cap"] },
            { text: "C = ε₀S/d = 8.854 × 10⁻¹² × 0.01/0.001 = 88.54 pF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 8.85419e-11, unit: "F" }] },
            { text: "Q = CV = 8.854 nC.", focus: ["cap"], claims: [{ instance: "cap", readout: "Q", value: 8.85419e-9, unit: "C" }] },
          ],
          trap: "Leaving d in mm makes C a thousand times too small. And 1 cm² is 10⁻⁴ m², not 10⁻².",
        },
        {
          id: "dielectric", level: "tutorial", title: "The same plates, with a dielectric",
          setup: { cap: { ...AIR, er: 4 } },
          problem: "The same plates with a dielectric of εr = 4 filling the gap. Find C, and Q at 100 V.",
          lines: [
            { text: "C = εr ε₀S/d = 4 × 88.54 pF = 354.2 pF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 3.54168e-10, unit: "F" }] },
            { text: "Q = CV = 35.42 nC, four times the air value at the same voltage.", focus: ["cap"], claims: [{ instance: "cap", readout: "Q", value: 3.54168e-8, unit: "C" }] },
          ],
          trap: "Dividing by εr. A dielectric raises C; it lowers E for a given Q.",
        },
        {
          id: "mst5b", level: "exam", title: "MST Q5(b)(ii)–(iii): C and εr",
          setup: { cap: { ...MST } },
          problem: "A parallel-plate capacitor has plate area S = 0.120 m² and separation d = 80 µm. At V₀ = 15.0 V it stores W_E = 50.0 µJ. Calculate (ii) the capacitance C and (iii) the relative permittivity εr of its dielectric.",
          lines: [
            { text: "(ii) W = ½CV², so C = 2W/V² = 2 × 50 × 10⁻⁶/15² = 444.4 nF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 4.44444e-7, unit: "F" }] },
            { text: "(iii) C = εr ε₀S/d, so εr = Cd/(ε₀S) = 4.444 × 10⁻⁷ × 80 × 10⁻⁶/(8.854 × 10⁻¹² × 0.120) = 33.46.", focus: ["cap"] },
          ],
          covers: ["mst-2324-q5b"],
          trap: "C = W/V² (no factor of 2) halves both C and εr. And 80 µm is 8 × 10⁻⁵ m.",
        },
      ],
      asks: [
        { id: "depends", q: "Does C change if I raise the voltage?", a: "No. Q rises in proportion, so Q/V stays the same. Geometry and material alone fix C." },
        { id: "farad", q: "Why are capacitances so small in farads?", a: "ε₀ is only 8.854 × 10⁻¹² F/m. A 1 F air capacitor with a 1 mm gap would need about 113 square kilometres of plate." },
        { id: "fringe", q: "Is C = εS/d exact?", a: "Only when the plates are much wider than the gap, so the field is uniform and fringing at the edges is negligible. Exam questions assume this." },
        { id: "units", q: "Which units trip people up?", tags: ["CAP_UNITS"], a: "S in m² (1 cm² = 10⁻⁴ m², 1 mm² = 10⁻⁶ m²) and d in m (80 µm = 8 × 10⁻⁵ m). Convert both before dividing." },
        { id: "recipe", q: "How do I find C for any shape?", a: "Assume charges ±Q on the conductors. Find E between them, usually with Gauss's law, integrate to get V, then C = Q/V. Q always cancels." },
        { id: "why-er", q: "Why does a dielectric raise C?", a: "Its polarization puts bound charge on its faces that partly cancels the free charge's field. Less field means less voltage for the same Q, so Q/V is larger, by exactly εr." },
      ],
      checks: [
        {
          id: "q-v", title: "Check: C and V", show: ["cap", "eq"], patch: { cap: { ...AIR } },
          note: "Four checks on capacitance. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "q-v", type: "choose", prompt: "Doubling the voltage across a capacitor…", dimension: "conceptual",
            options: [
              choice("q", "doubles Q and leaves C unchanged", true, "Right: C is set by geometry and material."),
              choice("c2", "doubles C", false, "C doesn't depend on V."),
              choice("ch", "halves C", false, "Q doubles too, so Q/V is unchanged."),
            ] },
        },
        {
          id: "predict-gap", title: "Check: a narrower gap",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-gap", type: "predict-drag", prompt: "Halve the gap from 1 mm to 0.5 mm. Drag C to your prediction.", target: { instance: "cap", readout: "C" }, range: [0, 3e-10], unit: "F", relTol: 0.05, reveal: { cap: { d: 5e-4 } }, dimension: "conceptual",
            feedback: { close: "Right: C doubles, to 177.1 pF.", far: "C = εS/d: halve d and C doubles, to 177.1 pF." } },
        },
        {
          id: "cap-num", title: "Check: plates, your numbers",
          note: "Numbers of your own, in cm² and mm.",
          interaction: { id: "cap-num", type: "numeric", prompt: cp.prompt, answer: cp.spec.answer, distractors: cp.spec.distractors, relTol: cp.spec.relTol, hints: cp.hints, template: "cap-parallel", dimension: "computational" },
        },
        {
          id: "mst-er", title: "Check: MST Q5(b)(iii)",
          note: "Last one.",
          patch: { cap: { ...MST } },
          interaction: { id: "mst-er", type: "numeric", prompt: "MST Q5(b)(iii): C = 444.4 nF, S = 0.120 m², d = 80 µm. Find εr.", answer: { value: 33.46, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 33464, unit: "", errorClass: "unit", tag: "CAP_UNITS", feedback: "That reads 80 µm as 80 mm. 80 µm = 8 × 10⁻⁵ m." }],
            hints: ["εr = Cd/(ε₀S).", "d = 8 × 10⁻⁵ m.", "4.444 × 10⁻⁷ × 8 × 10⁻⁵ / (8.854 × 10⁻¹² × 0.120)."] },
          covers: ["mst-2324-q5b"],
        },
      ],
      recap: {
        points: [
          "C = Q/V, in farads; it depends only on geometry and material.",
          "Parallel plates: C = εr ε₀S/d.",
          "Recipe for any shape: assume ±Q, find E, integrate for V, divide.",
        ],
        traps: ["cm² → m² is 10⁻⁴; mm → m is 10⁻³; µm → m is 10⁻⁶.", "Thinking C depends on V.", "Dividing by εr."],
      },
    },
  ],
});
```

- [ ] **Step 3: `plates/idea-cap-energy.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice and eqp as in Task 5.
const ce = instantiate(templates.find((t) => t.id === "cap-energy")!, 1);
const AIR = { kind: "parallel" as const, area: 0.01, d: 1e-3, er: 1, V: 100 };
const MST = { kind: "parallel" as const, area: 0.12, d: 8e-5, er: 33.46397, V: 15 };

export const ideaCapEnergy = defineIdeaPlate({
  id: "idea-cap-energy",
  title: "Stored energy and energy density",
  requires: { objectives: [1], items: ["mst-2324-q5b"], misconceptions: ["ENERGY_HALF", "ENERGY_DENSITY_UNIT"] },
  instances: [
    { id: "cap", component: "capacitor", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`W=\tfrac12CV^2=\tfrac12QV=\dfrac{Q^2}{2C}`, "W equals one half C V squared") },
  ],
  ideas: [
    {
      id: "energy",
      title: "Stored energy and energy density",
      objectives: [1],
      explain: [
        {
          id: "work", title: "Charging costs work", show: ["cap", "eq"], focus: ["cap", "eq"],
          note: "Moving each bit of charge dq from one plate to the other, against the voltage v = q/C already there, takes dW = v dq. Add it all up from 0 to Q: W = ∫(q/C)dq = ½Q²/C = ½CV² = ½QV. The ½ appears because the voltage rises from zero as you charge; only the last bit of charge crosses the full V. The plate's 88.54 pF at 100 V stores 0.4427 µJ.",
          claims: [{ instance: "cap", readout: "W", value: 4.42709e-7, unit: "J" }],
        },
        {
          id: "density", title: "The energy lives in the field", patch: { eq: eqp(R`w_E=\tfrac12\varepsilon E^2=\tfrac12\mathbf D\cdot\mathbf E`, "w E equals one half epsilon E squared") }, focus: ["eq", "cap"],
          note: "Where is the energy stored? In the field between the plates. Write ½CV² with C = εS/d and V = Ed: W = ½(εS/d)(Ed)² = ½εE² × Sd. Sd is the volume of the gap, so the energy per unit volume is w_E = ½εE² = ½D·E, in J/m³. Here E = 100 kV/m and w_E = 0.04427 J/m³.",
          claims: [{ instance: "cap", readout: "Eg", value: 1e5, unit: "V/m" }, { instance: "cap", readout: "wE", value: 0.0442709, unit: "J/m^3" }],
        },
        {
          id: "battery", title: "Fixed V or fixed Q?", patch: { cap: { er: 4 } }, focus: ["cap"],
          note: "Slide a dielectric (εr = 4) into the gap while a battery holds V at 100 V: C quadruples, and so does W = ½CV², to 1.771 µJ; the battery supplies the extra. If the capacitor had been disconnected first, Q would be fixed instead: W = ½Q²/C would fall to a quarter, 0.1107 µJ, and the dielectric would be pulled in. Which formula to use depends on what's held constant.",
          claims: [{ instance: "cap", readout: "W", value: 1.77084e-6, unit: "J" }],
        },
      ],
      examples: [
        {
          id: "air", level: "basic", title: "Energy in the air capacitor",
          setup: { cap: { ...AIR } },
          problem: "Find the energy stored in the 88.54 pF air capacitor at 100 V, and the energy density in its gap.",
          lines: [
            { text: "W = ½CV² = ½ × 88.54 × 10⁻¹² × 100² = 0.4427 µJ.", focus: ["cap"], claims: [{ instance: "cap", readout: "W", value: 4.42709e-7, unit: "J" }] },
            { text: "E = V/d = 100/0.001 = 10⁵ V/m, so w_E = ½ε₀E² = 0.04427 J/m³.", focus: ["cap"], claims: [{ instance: "cap", readout: "wE", value: 0.0442709, unit: "J/m^3" }] },
            { text: "Check: w_E × volume = 0.04427 × 10⁻⁵ = 0.4427 µJ.", focus: ["cap"] },
          ],
          trap: "Dropping the ½ doubles the answer.",
        },
        {
          id: "mst5b-i", level: "tutorial", title: "MST Q5(b)(i): energy density",
          setup: { cap: { ...MST } },
          problem: "The capacitor has S = 0.120 m², d = 80 µm, V₀ = 15.0 V and W_E = 50.0 µJ. Calculate the energy density w_E. (The paper asks for J·m⁻²; energy density is per volume, J/m³.)",
          lines: [
            { text: "The field fills the gap uniformly, so w_E = W_E/(Sd) = 50 × 10⁻⁶/(0.120 × 80 × 10⁻⁶) = 5.208 J/m³.", focus: ["cap"], claims: [{ instance: "cap", readout: "wE", value: 5.20833, unit: "J/m^3" }] },
            { text: "Check with fields: E = V₀/d = 15/(80 × 10⁻⁶) = 187.5 kV/m, and ½εr ε₀E² = 5.208 J/m³ with εr = 33.46.", focus: ["cap"], claims: [{ instance: "cap", readout: "Eg", value: 187500, unit: "V/m" }] },
          ],
          covers: ["mst-2324-q5b"],
          trap: "Answering in J/m² because the paper prints it. Give J/m³ and say why: energy per unit volume.",
        },
        {
          id: "switch", level: "exam", title: "Disconnected, or still connected?",
          setup: { cap: { ...AIR } },
          problem: "The 88.54 pF air capacitor is charged to 100 V and disconnected. A dielectric with εr = 4 is then slid in to fill the gap. Find the new V and W. What if it had stayed connected?",
          lines: [
            { text: "Disconnected: Q = 8.854 nC is fixed, and C becomes 354.2 pF.", focus: ["cap"], claims: [{ instance: "cap", readout: "Q", value: 8.85419e-9, unit: "C" }] },
            { text: "V = Q/C = 25 V, and W = ½QV = 0.1107 µJ, a quarter of before.", patch: { cap: { er: 4, V: 25 } }, focus: ["cap"], claims: [{ instance: "cap", readout: "W", value: 1.10677e-7, unit: "J" }, { instance: "cap", readout: "Q", value: 8.85419e-9, unit: "C" }] },
            { text: "Connected: V stays at 100 V, Q rises to 35.42 nC, and W = 1.771 µJ, four times as much.", patch: { cap: { V: 100 } }, focus: ["cap"], claims: [{ instance: "cap", readout: "Q", value: 3.54168e-8, unit: "C" }, { instance: "cap", readout: "W", value: 1.77084e-6, unit: "J" }] },
          ],
          trap: "Using ½CV² with the old V after disconnecting. Once the capacitor is isolated, Q is the constant and V changes.",
        },
      ],
      asks: [
        { id: "half", q: "Where does the ½ come from?", tags: ["ENERGY_HALF"], a: "While charging, the voltage climbs from 0 to V. On average each bit of charge crosses only half the final voltage, so the work is ½QV, not QV." },
        { id: "three-forms", q: "Which of ½CV², ½QV and ½Q²/C should I use?", a: "They're equal. Use the one whose quantities you know, or the one whose quantity is held constant when something changes." },
        { id: "density-units", q: "J/m² or J/m³?", tags: ["ENERGY_DENSITY_UNIT"], a: "J/m³: energy per unit volume, because the energy fills the gap's volume. MST Q5(b) printed J·m⁻²; note the slip in your answer and give J/m³." },
        { id: "d-dot-e", q: "Why ½D·E?", a: "In a linear dielectric D = εE, so ½D·E = ½εE². The D·E form also works when D and E are given as vectors." },
        { id: "where", q: "Is the energy on the plates or in the gap?", a: "In the field. The energy-density picture assigns ½εE² to every point where E exists, which is what lets electromagnetic waves carry energy through empty space." },
        { id: "pulled-in", q: "Why is a dielectric pulled into an isolated charged capacitor?", a: "With Q fixed, W = ½Q²/C falls as C rises. Systems move toward lower energy, so the fringing field draws the slab in." },
      ],
      checks: [
        {
          id: "half-c", title: "Check: the energy formula", show: ["cap", "eq"], patch: { cap: { ...AIR } },
          note: "Four checks on stored energy. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "half-c", type: "choose", prompt: "A capacitor C at voltage V stores…", dimension: "recognition",
            options: [
              choice("half", "½CV²", true, "Right."),
              choice("full", "CV²", false, "Missing the ½: the voltage builds up from zero.", "ENERGY_HALF"),
              choice("cv", "CV", false, "CV is the charge, Q."),
            ] },
        },
        {
          id: "predict-v", title: "Check: double the voltage",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-v", type: "predict-drag", prompt: "Double the voltage from 100 V to 200 V. Drag W to your prediction.", target: { instance: "cap", readout: "W" }, range: [0, 3e-6], unit: "J", relTol: 0.05, reveal: { cap: { V: 200 } }, dimension: "conceptual",
            feedback: { close: "Right: four times as much, 1.771 µJ.", far: "W ∝ V²: four times, 1.771 µJ." } },
        },
        {
          id: "energy-num", title: "Check: stored energy, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "energy-num", type: "numeric", prompt: ce.prompt, answer: ce.spec.answer, distractors: ce.spec.distractors, relTol: ce.spec.relTol, hints: ce.hints, template: "cap-energy", dimension: "computational" },
        },
        {
          id: "density-c", title: "Check: MST Q5(b)(i)",
          note: "Last one.",
          patch: { cap: { ...MST } },
          interaction: { id: "density-c", type: "numeric", prompt: "MST Q5(b)(i): S = 0.120 m², d = 80 µm, W_E = 50.0 µJ. Find the energy density w_E in J/m³.", answer: { value: 5.20833, unit: "J/m^3" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 4.16667e-4, unit: "J/m^3", errorClass: "conceptual", tag: "ENERGY_DENSITY_UNIT", feedback: "That divides by the area only. Energy density is per unit volume: divide by Sd." }],
            hints: ["w_E = W/volume.", "Volume = S × d = 0.120 × 8 × 10⁻⁵ m³.", "50 × 10⁻⁶ / (9.6 × 10⁻⁶)."] },
          covers: ["mst-2324-q5b"],
        },
      ],
      recap: {
        points: [
          "W = ½CV² = ½QV = ½Q²/C.",
          "The energy is stored in the field: w_E = ½εE² = ½D·E, in J/m³.",
          "Battery connected: V is constant. Disconnected: Q is constant.",
        ],
        traps: ["Dropping the ½.", "J/m² for an energy density.", "Holding V fixed after disconnecting."],
      },
    },
  ],
});
```

- [ ] **Step 4: `plates/idea-coax-sphere.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

// R, choice and eqp as in Task 5.
const cc = instantiate(templates.find((t) => t.id === "cap-coax")!, 1);
const PE = { kind: "coax" as const, a: 1e-3, b: 3.5e-3, length: 1, er: 2.26, V: 100 };
const MST = { kind: "coax" as const, a: 0.007112, b: 0.01143, length: 1e5, er: 6.78, V: 1 };

export const ideaCoaxSphere = defineIdeaPlate({
  id: "idea-coax-sphere",
  title: "Coaxial and spherical capacitors",
  requires: { objectives: [2], items: ["mst-2324-q4c"], misconceptions: ["CAP_LN"] },
  instances: [
    { id: "cap", component: "capacitor", params: PE },
    { id: "eq", component: "equation", params: eqp(R`C=\dfrac{2\pi\varepsilon L}{\ln(b/a)}`, "C equals two pi epsilon L over the natural log of b over a") },
  ],
  ideas: [
    {
      id: "coax",
      title: "Coaxial and spherical capacitors",
      objectives: [2],
      explain: [
        {
          id: "coax", title: "A coaxial cable", show: ["cap", "eq"], focus: ["cap", "eq"],
          note: "Two coaxial conductors: an inner one of radius a and an outer one of radius b. Put +Q on the inner one, spread along a length L. Gauss's law with a cylinder gives E = Q/(2περL) between them. Integrate from a to b: V = (Q/(2πεL)) ln(b/a). So C = Q/V = 2πεL/ln(b/a). A 1 mm core in a 3.5 mm shield, with polyethylene (εr = 2.26) between, gives 100.4 pF per metre.",
          claims: [{ instance: "cap", readout: "C", value: 1.00362e-10, unit: "F" }],
        },
        {
          id: "ratio", title: "Only the ratio b/a matters", patch: { cap: { a: 2e-3, b: 7e-3 } }, focus: ["cap"],
          note: "The radii enter only as b/a. Double both, to 2 mm and 7 mm, and C doesn't change: still 100.4 pF per metre. That's why cables of different sizes can share a capacitance per metre, and why you needn't convert inches for the logarithm: the ratio has no units. Only the length L must be in metres.",
          claims: [{ instance: "cap", readout: "C", value: 1.00362e-10, unit: "F" }],
        },
        {
          id: "sphere", title: "Concentric spheres", patch: { cap: { kind: "sphere", a: 0.05, b: 0.1, er: 1 }, eq: eqp(R`C=\dfrac{4\pi\varepsilon}{1/a-1/b}`, "C equals four pi epsilon over one over a minus one over b") }, focus: ["cap", "eq"],
          note: "For concentric spheres, Gauss's law gives E = Q/(4πεr²). Integrate from a to b: V = (Q/(4πε))(1/a − 1/b), so C = 4πε/(1/a − 1/b). Spheres of 5 cm and 10 cm with air between: C = 11.13 pF. Let the outer sphere go to infinity and C = 4πεa, an isolated sphere: 5.563 pF for this one.",
          claims: [{ instance: "cap", readout: "C", value: 1.11265e-11, unit: "F" }],
        },
        {
          id: "field", title: "Where the field is strongest", patch: { cap: { ...PE }, eq: eqp(R`E=\dfrac{V}{\rho\ln(b/a)}`, "E equals V over rho times the natural log of b over a") }, focus: ["cap", "eq"],
          note: "In the coax, E = V/(ρ ln(b/a)) falls off as 1/ρ, so it's largest at the inner conductor's surface: 79.82 kV/m here at 100 V. That's where the insulation breaks down first. Designers choose b/a to balance a high breakdown voltage against the cable's capacitance.",
          claims: [{ instance: "cap", readout: "Eg", value: 79823.6, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "sphere", level: "basic", title: "Concentric spheres in air",
          setup: { cap: { kind: "sphere", a: 0.05, b: 0.1, er: 1, V: 100 } },
          problem: "Concentric spheres of radii 5 cm and 10 cm have air between them. Find C.",
          lines: [
            { text: "In metres: 1/a − 1/b = 1/0.05 − 1/0.1 = 20 − 10 = 10.", focus: ["cap"] },
            { text: "C = 4πε₀/10 = 4π × 8.854 × 10⁻¹²/10 = 11.13 pF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 1.11265e-11, unit: "F" }] },
          ],
          trap: "Working in centimetres: 1/5 − 1/10 = 0.1 makes C a hundred times too big.",
        },
        {
          id: "coax-pe", level: "tutorial", title: "A polyethylene coax, per metre",
          setup: { cap: { ...PE } },
          problem: "A coax has a 1 mm-radius core, a shield of inner radius 3.5 mm, and polyethylene (εr = 2.26) between. Find its capacitance per metre.",
          lines: [
            { text: "ln(b/a) = ln 3.5 = 1.253.", focus: ["cap"] },
            { text: "C/L = 2π × 2.26 × 8.854 × 10⁻¹²/1.253 = 100.4 pF/m.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 1.00362e-10, unit: "F" }] },
          ],
          trap: "log₁₀ 3.5 = 0.544 gives 231.1 pF/m. The formula's ln is the natural log.",
        },
        {
          id: "mst4c", level: "exam", title: "MST Q4(c): 100 km of coax, in inches",
          setup: { cap: { ...MST } },
          problem: "Calculate the capacitance of a 100 km coaxial cable with a solid core of radius 0.28 inch, insulated to a 0.90 inch diameter by a material with εr = 6.78.",
          lines: [
            { text: "Outer radius b = 0.90/2 = 0.45 inch. b/a = 0.45/0.28 = 1.607, and ln 1.607 = 0.4745; the inches cancel.", focus: ["cap"] },
            { text: "L = 100 km = 10⁵ m.", focus: ["cap"] },
            { text: "C = 2π × 6.78 × 8.854 × 10⁻¹² × 10⁵/0.4745 = 79.50 µF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 7.94988e-5, unit: "F" }] },
          ],
          covers: ["mst-2324-q4c"],
          trap: "Using 0.90 inch as b. It's the insulation's diameter; b is its radius, 0.45 inch.",
        },
      ],
      asks: [
        { id: "ln", q: "Why a natural log?", tags: ["CAP_LN"], a: "It comes from integrating 1/ρ: ∫dρ/ρ = ln ρ. Integrating 1/x always gives the natural log, never log₁₀." },
        { id: "inches", q: "Do I need to convert inches for coax?", a: "Not for ln(b/a): the ratio has no units. You do need L in metres, since C is proportional to it." },
        { id: "per-length", q: "Why quote coax in pF/m?", a: "C grows in proportion to L, so the per-metre value describes the cable itself. Multiply by the length for a particular run." },
        { id: "isolated", q: "What's the capacitance of a single sphere?", a: "Take b → ∞: C = 4πεa. The 'other plate' is infinitely far away. Even the Earth, radius 6370 km, has only about 709 µF." },
        { id: "breakdown", q: "Where does a coax's insulation fail first?", a: "At the inner conductor, where E = V/(a ln(b/a)) is largest. A very thin core concentrates the field." },
        { id: "diameter", q: "Radius or diameter?", tags: ["CAP_LN"], a: "The formulas use radii. Papers often give a diameter, as MST Q4(c) does for the insulation: halve it first." },
      ],
      checks: [
        {
          id: "ln-c", title: "Check: scaling the radii", show: ["cap", "eq"], patch: { cap: { ...PE } },
          note: "Four checks on coax and spheres. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "ln-c", type: "choose", prompt: "For a coax, C = 2πεL/ln(b/a). Doubling both radii…", dimension: "conceptual",
            options: [
              choice("same", "leaves C unchanged", true, "Right: only b/a enters."),
              choice("double", "doubles C", false, "The radii appear only as a ratio."),
              choice("half", "halves C", false, "b/a is unchanged, so C is too."),
            ] },
        },
        {
          id: "predict-er", title: "Check: without the dielectric",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-er", type: "predict-drag", prompt: "Replace the polyethylene (εr = 2.26) with air. Drag C to your prediction.", target: { instance: "cap", readout: "C" }, range: [0, 2e-10], unit: "F", relTol: 0.05, reveal: { cap: { er: 1 } }, dimension: "conceptual",
            feedback: { close: "Right: C falls by 2.26, to 44.41 pF.", far: "C ∝ εr: 100.4/2.26 = 44.41 pF." } },
        },
        {
          id: "coax-num", title: "Check: coax, your numbers",
          note: "Numbers of your own, in mm.",
          interaction: { id: "coax-num", type: "numeric", prompt: cc.prompt, answer: cc.spec.answer, distractors: cc.spec.distractors, relTol: cc.spec.relTol, hints: cc.hints, template: "cap-coax", dimension: "computational" },
        },
        {
          id: "mst4c-c", title: "Check: MST Q4(c)",
          note: "Last one.",
          patch: { cap: { ...MST } },
          interaction: { id: "mst4c-c", type: "numeric", prompt: "MST Q4(c): 100 km of coax, core radius 0.28 inch, insulation diameter 0.90 inch, εr = 6.78. Find C in µF.", answer: { value: 79.4988, unit: "µF" }, relTol: 0.01, dimension: "computational",
            distractors: [
              { value: 183.053, unit: "µF", errorClass: "conceptual", tag: "CAP_LN", feedback: "That uses log₁₀. Use the natural log." },
              { value: 32.3044, unit: "µF", errorClass: "conceptual", tag: "CAP_LN", feedback: "That takes 0.90 inch as b. It's a diameter: b = 0.45 inch." },
            ],
            hints: ["b = 0.90/2 = 0.45 inch; only b/a matters.", "L = 10⁵ m.", "C = 2π × 6.78 × ε₀ × 10⁵ / ln(0.45/0.28)."] },
          covers: ["mst-2324-q4c"],
        },
      ],
      recap: {
        points: [
          "Coax: C = 2πεL/ln(b/a); only the ratio of radii matters, and L must be in metres.",
          "Concentric spheres: C = 4πε/(1/a − 1/b); isolated sphere: 4πεa.",
          "A coax's field is strongest at its inner conductor.",
        ],
        traps: ["log₁₀ for ln.", "A diameter used as a radius.", "Centimetres left in 1/a − 1/b."],
      },
    },
  ],
});
```

Checks by hand:
- 2π × 2.26 × ε₀/ln 3.5 = 1.00362 × 10⁻¹⁰ F/m. Without the dielectric: 4.4408 × 10⁻¹¹ F/m.
- 100/(10⁻³ × ln 3.5) = 79823.6 V/m.
- MST Q4(c) distractors: log₁₀(1.6071) = 0.20606 gives 183.05 µF; ln(0.90/0.28) = 1.16761 gives 32.304 µF.

- [ ] **Step 5: Register.**
  - In `plates/index.ts`, add the three plates.
  - In `concepts/electrostatics.ts`, remove the `locked("em1.electrostatics.capacitance", …)` line.
  - In `index.ts`, import `{ capacitanceConcept }` and add it after `dielectricsConcept`.
  - Run `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS. Lint notes:
    - "0.01 m²", "0.02 m²" and "0.120 m²" are backed by the `S` quotable.
    - "0.001 m" is backed by the `d` param.
    - "0.28 inch" is backed by the `a` param (in metres, converted).
    - "0.45 inch" is backed by `b`.
    - "0.90 inch" is backed by the `outerD` quotable.
    - "8.854 nC" and "35.42 nC" are backed by `Q`.

- [ ] **Step 6: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): capacitance concept; parallel plates (MST Q5(b)), stored energy and energy density, coax (MST Q4(c)) and spheres

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 8: Coverage, e2e and axe

- [ ] **Step 1: Extend coverage.**
  - In `f3-coverage.test.ts`, add `"em1.electrostatics.dielectrics"` and `"em1.electrostatics.capacitance"` to the loop.
  - Add the assertions:

    ```ts
    expect(mainOf("em1.electrostatics.dielectrics")).toEqual(["idea-polarization", "idea-bc-tangential", "idea-bc-normal", "idea-refraction", "idea-conductor-bc"]);
    expect(mainOf("em1.electrostatics.capacitance")).toEqual(["idea-parallel-plate", "idea-cap-energy", "idea-coax-sphere"]);
    ```

  - Run `pnpm vitest run packages/course-em1`. Expected: PASS.

- [ ] **Step 2: e2e** at `app/apps/web/e2e/dielectrics-capacitance.spec.ts`. Mirror G1's kicker test over the eight blocks:
  - `idea-polarization`: "Why a material weakens E", "Explanation 1 of 4"
  - `idea-bc-tangential`: "First, split D", "1 of 4"
  - `idea-bc-normal`: "A pillbox across the boundary", "1 of 5"
  - `idea-refraction`: "Field lines bend at the boundary", "1 of 4"
  - `idea-conductor-bc`: "E = 0 inside a conductor", "1 of 4"
  - `idea-parallel-plate`: "C = Q/V", "1 of 4"
  - `idea-cap-energy`: "Charging costs work", "1 of 3"
  - `idea-coax-sphere`: "A coaxial cable", "1 of 4"

  Also:
  - On step 0 of `idea-refraction`, `.readouts` shows "56.71" (θ₂).
  - The old URLs redirect:

    ```ts
    test("the retired flux-density concept redirects to Gauss's law", async ({ page }) => {
      await page.goto("/c/em1/em1.electrostatics.flux-density");
      await expect(page).toHaveURL(/em1\.electrostatics\.gauss-law$/);
      await page.goto("/learn/em1.electrostatics.flux-density/main");
      await expect(page).toHaveURL(/em1\.electrostatics\.gauss-law\/flux-density$/);
    });
    ```

- Add to `a11y.spec.ts`:
  - `concept("em1.electrostatics.dielectrics", "mode=learn")`
  - `concept("em1.electrostatics.capacitance", "mode=learn&lesson=main&block=idea-coax-sphere")`

- [ ] **Step 3: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`
Expected: all PASS. Visual baselines that include the map or the concept list change: they lose flux-density and gain two unlocked concepts. Update those baselines (`pnpm e2e --update-snapshots` for the named specs only), inspect the new images, and log a ruling listing them.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web packages/course-em1 && git commit -m "test: dielectrics and capacitance coverage, e2e, axe, and the flux-density redirect

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 9: Verification and handback

- [ ] Run the full suite.
- [ ] Walk each idea's first explanation and exam example at 1360×900:
  - The boundary plane should draw as a hatched quad, with the n̂ dashed line and D₁ and D₂ meeting at the anchor.
  - In ICT 2's slanted plane, the quad should tilt.
  - The conductor region should draw solid graphite, with no D₂ arrow.
  - The capacitor schematics should show hatching only when εr > 1.
  - MST Q4(c)'s C should read 7.950×10⁻⁵.
- [ ] Load a saved learner whose position is on `em1.electrostatics.flux-density` (edit IndexedDB, or seed through the dev store) and confirm "Continue" opens Gauss's law, lesson `flux-density`.
- [ ] Write the ledger line `Task 9: verification — <counts>` and stop for Claude's review.

## Self-Review Notes

- **Solved (Python), with the package ε₀:**
  - **Finals 2024-25 Q2(b):**
    - D₂ = (1, 0.6, −1.4) C/m².
    - E₂ = (1.12941, 0.677645, −1.58117) × 10¹¹ V/m.
    - θ₁ = 82.5195° and θ₂ = 56.7138° from the normal (33.2862° from the tangent).
    - P₁ = (0.8, 2.4, −5.6).
  - **Finals 2023-24 Q2(a):**
    - E₂ = (0.968065, −4.51764, 6.77645) × 10¹¹ V/m.
    - θ₁ = 67.4115° and θ₂ = 83.2214°.
  - **HW03 3.2:**
    - n̂ = (−0.6, 0, 0.8), D₁·n̂ = 17.2.
    - D₂ = (−10.12, −12.5, 13.91); E₂ = (−2.024, −2.5, 2.782)/ε₀.
    - From the tangent: θ₁ = 40.6899° and θ₂ = 53.9870°.
    - cos θ₁/cos θ₂ = 1.28960 = |E₂|/|E₁|; tan ratio 0.625.
    - P₁ = (−8.75, −17.5, 12.25).
  - **ICT 2 Q2:**
    - n̂ = (−0.6, 0.8, 0); D₁ₙ = (6, −8, 0); D₁ₜ = (−16, −12, 14).
    - D₂ = (0.666667, −12, 4.666667).
    - E₂ = (1.07563, −19.3613, 7.52939) × 10¹⁰ V/m. The lecturer's handwritten (1.08, −19.4, 7.53) × 10¹⁰ matches.
    - θ₁ = 67.7252° and θ₂ = 39.1377° from the normal; tan ratio 3.
  - **Free-charge example:** D₂ = (6, 0, 3).
  - **Sheet:** D = ±6 × 10⁻⁵, E = 6.7765 × 10⁶ V/m.
  - **Conductors:**
    - 5 nC/m² gives 564.705 V/m.
    - 3 nC/m² with εr = 2.5 gives 135.529 V/m.
    - 1.2 kV/m gives 10.625 nC/m².
    - −300 V/m gives −2.65626 nC/m².
  - **Plates:**
    - 88.5419 pF, 8.85419 nC, 0.442709 µJ, 0.0442709 J/m³.
    - With εr = 4: 354.168 pF, 35.4168 nC, 1.77084 µJ.
    - Isolated with εr = 4: V = 25 V, W = 0.110677 µJ.
    - 0.5 mm gap: 177.084 pF.
  - **MST Q5(b):** C = 444.444 nF; εr = 33.464 (33.465 with ε₀ = 8.854 × 10⁻¹²); w_E = 5.20833 J/m³; E = 187.5 kV/m.
  - **MST Q4(c):** 79.4988 µF (79.4971 µF with 8.854 × 10⁻¹²).
  - **Polyethylene coax:** 100.362 pF/m; E at the core 79823.6 V/m at 100 V.
  - **Spheres:** 11.1265 pF, isolated 5.56325 pF; the Earth 708.8 µF.
- **Coverage:** each idea owns one objective. The four exam boundaries are covered by several ideas, because each question spans the split, both conditions and the angles.
- **Retirement:** flux-density's four blocks survive as a Gauss's law lesson, so `q7a` stays physics-verified in `course.test.ts`.
- **Magnetic twin:** `dielectricBoundary` is written in D, E and ε. Plan 6b adds `magneticBoundary` (B, H, μ, surface current K) beside it rather than generalising this one now.
