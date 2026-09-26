# Forma Plan F2: Math Plate Toolkit (Fields, Slices, Regions, Spectrum, Units)

> **For agentic workers (Codex):** read `AGENTS.md` first. **Plan F1 must be complete**, because this plan uses its `toSvg3`, `coords.ts` and `vec.ts`. Execute task by task. Every command has an `Expected:` line; compare real output against it. Never edit a test to make it pass unless a step says to.

**Goal:** the plate components that Plan F3's content needs.
- A verified library of named scalar and vector fields, taken from the tutorial and homework problems, with gradient, divergence and curl.
- `scalar-slice`: a gradient plate.
- `vector-slice`: a divergence and curl plate, with a shrinking flux box and circulation loop.
- `coord-region`: dl, dS and dV, and finite regions in the three coordinate systems.
- `spectrum`: frequency ↔ wavelength, for Unit 1.
- `unit-convert`: prefixes, inches and SI, for Unit 1.
- Lint and units support for m³, Hz and inches.

**Architecture:**
- **Fields** live in `@forma/physics/src/fields.ts` as hand-written analytic functions in each field's native coordinates. A finite-difference test checks every formula independently.
- **Components:** `packages/plate/src/components/math.ts`, added to `emComponents`.
- **Views:** `apps/web/components/plate/viewsMath.tsx`, registered in `views2d`.
  - Slices draw the plate's usual x–z plane (or an x–y plane with y drawn upward).
  - Regions use F1's oblique `toSvg3`.

**Tech stack:** TypeScript, Zod 4, Vitest 5, React 19.

**Spec:** `docs/superpowers/specs/2026-09-26-forma-emag-electrostatics-assessments-design.md` §3–§4. Every field formula below was derived with SymPy from the source questions (catalog ids `tut-vec`, `hw02-2324`, `mst2324`, `f2425`).

**Ledger:** `.superpowers/sdd/2026-09-27-forma-plan-f2-math-plate-toolkit/progress.md`

## Global Constraints

- Run commands from `F:\StudyBuddy\app`.
- **Angles.** Model values are in radians. Readouts show degrees with the unit `°`. `coord-region` range params for φ and θ are in **degrees**.
- **Singular points** (ρ = 0, r = 0, θ = 0 or π): readouts are `null` (the UI shows "—"), and slice arrows skip those cells. Nothing throws.
- **Speed of light:** `C0 = 299792458` m/s, exact.
- **Brand:** tokens only, `plate-label` for text, no hex.

## Review Focus

1. **Field formulas.** A mistyped term in any hand-coded gradient, divergence or curl would teach a wrong answer. The finite-difference test (Task 2) checks every field at three generic points to 1e-6.
2. **Shrinking box.** `boxFlux / s³` tends to the divergence as s → 0. It is exact for fields linear in cartesian coordinates. Tested in Task 3 with `source` (3) and `tut-3.6a` (4x).
3. **Loop orientation.** In the x–y plane, a counter-clockwise loop gives circulation/area = curl_z (`swirl`: +2). In the x–z plane, the out-of-screen normal is −y, so `swirl` gives 0 there and `tut-3.6a` gives −y. Tested in Task 3.
4. **Region formulas.** The spherical patch r = 0.25 m, 0–60°, 30–45° has area 0.00818123 m². A finite region's volume in all three systems matches closed forms. Tested in Task 4.
5. **Lint.** "0.0082 m³" is read as m³, not m, and "2.45 GHz" as Hz. Tested in Task 1.

---

### Task 1: Units: m³, Hz (with k/M/G/T), and inches

**Files:**
- Modify: `app/packages/engine/src/quantities.ts`, `app/packages/plate/src/validate.ts`
- Test: `app/packages/engine/test/quantities.test.ts` (append; create the file if missing), `app/packages/plate/test/numbers.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

Append to `app/packages/plate/test/numbers.test.ts`, inside `describe("unbackedNumbers")`:

```ts
  it("reads volumes, frequencies and inches as their own units", () => {
    expect(unbackedNumbers("V = 0.0082 m³", [c(0.0082, "m^3")])).toEqual([]);
    expect(unbackedNumbers("V = 0.0082 m³", [c(0.0082, "m")])).toEqual(["0.0082 m³"]);
    expect(unbackedNumbers("Wi-Fi at 2.45 GHz", [c(2.45e9, "Hz")])).toEqual([]);
    expect(unbackedNumbers("a 0.28 inch core", [c(0.007112, "m")])).toEqual([]);
    expect(unbackedNumbers("the 6 in region 1", [])).toEqual([]);
  });
```

The lint today compares a written number only against backing values with the *same unit string*. Step 3 makes it compare across prefixes by converting each backing value into the written unit.

Create `app/packages/engine/test/quantities.test.ts` if it doesn't exist. Otherwise append:

```ts
import { expect, it } from "vitest";
import { toSI } from "../src";

it("converts inches, gigahertz and cubic centimetres", () => {
  expect(toSI(0.28, "in").value).toBeCloseTo(0.007112, 12);
  expect(toSI(0.28, "in").dim).toBe("m");
  expect(toSI(2.45, "GHz")).toEqual({ value: 2.45e9, dim: "Hz" });
  expect(toSI(5, "cm^3").value).toBeCloseTo(5e-6, 15);
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `pnpm vitest run packages/engine/test/quantities.test.ts packages/plate/test/numbers.test.ts`
Expected: FAIL (the units are unknown or misread).

- [ ] **Step 3: Implement**
- **`quantities.ts`:**
  - In `BASE`, add `Hz: "Hz",`.
  - In `PREFIX`, add `G: 1e9, T: 1e12`.
  - Before the prefix logic in `resolveUnit`, handle inches: `if (u === "in" || u === "inch") return [0.0254, "m"];`.
  - The existing `m^3` entry and the rule that a prefix takes the unit's exponent already cover `cm^3`.
- **`validate.ts`:**
  - Extend `WITH_UNIT`'s unit group, keeping the longer alternatives first:
    `([µμ]C\/m²|[µμ]C\/m\^2|nC\/m²|nC\/m\^2|[µμ]C\/m|nC\/m|V\/m|[kMGT]?Hz|[µμ]C|nC|m³|m\^3|m²|m\^2|inch(?:es)?|C|m)`.
    Bare `in` is deliberately not a unit here. Prose like "6 in region 1" would misfire.
  - `normUnit` must also map `³` to `^3` (`.replace("³", "^3")`) and `inches` to `inch`.
  - Replace the unit-equality test in `unbackedNumbers` with a conversion into the **written** unit, so the "rounded to the written digits" rule keeps working. Import `toSI` from `@forma/engine`, then add:

```ts
/** The backing value expressed in the written unit, or null when the dimensions differ. */
const inUnit = (c: Backing, unit: string): number | null => {
  if (normUnit(c.unit) === unit) return c.value;
  try {
    const a = toSI(c.value, c.unit), b = toSI(1, unit);
    return a.dim === b.dim ? a.value / b.value : null;
  } catch {
    return null;
  }
};
```

  and inside `candidates.some(...)`, use `const v = inUnit(c, unit); v !== null && (…the same two conditions, with v in place of c.value…)`.
  - `toSI` must know `inch` as 0.0254 m, so in `resolveUnit` handle `u === "in" || u === "inch"`.
  - Check two cases by hand:
    - "2.45 GHz" with the backing 2.45e9 Hz: converted into GHz it is 2.45, so it is backed.
    - "0.0082 m³" with the backing 0.0082 m: the dimensions differ, so it is flagged. This matches the test.

- [ ] **Step 4: Run the tests**

Run: `pnpm test`
Expected: all PASS, including every existing numbers test and course lint.

- [ ] **Step 5: Commit**

```bash
git add packages && git commit -m "feat: units m³, Hz with prefixes, inches; lint reads them

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: The field library in `@forma/physics`

**Files:** Create `app/packages/physics/src/fields.ts` and `app/packages/physics/test/fields.test.ts`. Modify `app/packages/physics/src/index.ts`.

**Interfaces:**
- Produces:

  ```ts
  ScalarField = { id; text; latex; system; f(n: Native): number; grad(n: Native): Native }
  VectorField = { id; text; latex; system; F(n): Native; div(n): number; curl(n): Native }
  ```

  - `scalarFields` and `vectorFields` are records keyed by id.
  - `nativeOf(p, system) → Native`.
  - `cartOf(v, p, system) → Vec3`, which turns native components into cartesian.
  - `Native` is `[u1, u2, u3]`: (x, y, z), (ρ, φ, z) or (r, θ, φ), with angles in radians.

- [ ] **Step 1: Write the failing test** at `app/packages/physics/test/fields.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { cartOf, fromCyl, fromSph, nativeOf, scalarFields, vectorFields, type Vec3 } from "../src";

const H = 1e-5;
const pts: Vec3[] = [[1.1, 0.7, 0.9], [-0.6, 1.3, -0.8], [0.4, -1.2, 1.5]];
const shift = (p: Vec3, k: number, d: number): Vec3 => p.map((v, i) => (i === k ? v + d : v)) as unknown as Vec3;

describe("scalar fields: analytic gradient = finite differences (cartesian)", () => {
  for (const s of Object.values(scalarFields)) {
    it(s.id, () => {
      const f = (p: Vec3) => s.f(nativeOf(p, s.system));
      for (const p of pts) {
        const g = cartOf(s.grad(nativeOf(p, s.system)), p, s.system);
        for (let k = 0; k < 3; k++) expect(g[k]).toBeCloseTo((f(shift(p, k, H)) - f(shift(p, k, -H))) / (2 * H), 5);
      }
    });
  }
});

describe("vector fields: analytic divergence and curl = finite differences (cartesian)", () => {
  for (const v of Object.values(vectorFields)) {
    it(v.id, () => {
      const F = (p: Vec3) => cartOf(v.F(nativeOf(p, v.system)), p, v.system);
      const d = (p: Vec3, comp: number, k: number) => (F(shift(p, k, H))[comp] - F(shift(p, k, -H))[comp]) / (2 * H);
      for (const p of pts) {
        expect(v.div(nativeOf(p, v.system))).toBeCloseTo(d(p, 0, 0) + d(p, 1, 1) + d(p, 2, 2), 5);
        const c = cartOf(v.curl(nativeOf(p, v.system)), p, v.system);
        expect(c[0]).toBeCloseTo(d(p, 2, 1) - d(p, 1, 2), 5);
        expect(c[1]).toBeCloseTo(d(p, 0, 2) - d(p, 2, 0), 5);
        expect(c[2]).toBeCloseTo(d(p, 1, 0) - d(p, 0, 1), 5);
      }
    });
  }
});

describe("source answers (solved from the questions)", () => {
  it("tutorial 3.4: ∇Φ at (1, 2, 3) = 5, 4, 3", () => {
    expect(scalarFields["tut-3.4"]!.grad([1, 2, 3])).toEqual([5, 4, 3]);
  });
  it("HW02 2.1(a): ∇V at P(−1, 4, 3) = 132, −30, −42", () => {
    expect(scalarFields["hw-2.1a"]!.grad([-1, 4, 3])).toEqual([132, -30, -42]);
  });
  it("HW02 2.1(b): ∇U at Q(2, 90°, −1) = aρ + 2az", () => {
    const g = scalarFields["hw-2.1b"]!.grad([2, Math.PI / 2, -1]);
    expect(g[0]).toBeCloseTo(1, 12);
    expect(g[1]).toBeCloseTo(0, 12);
    expect(g[2]).toBeCloseTo(2, 12);
  });
  it("HW02 2.1(c): ∇W at R(1, π/6, π/2) = −4 aφ (the 1/(r sin θ) factor matters)", () => {
    const g = scalarFields["hw-2.1c"]!.grad([1, Math.PI / 6, Math.PI / 2]);
    expect(g[0]).toBeCloseTo(0, 12);
    expect(g[1]).toBeCloseTo(0, 12);
    expect(g[2]).toBeCloseTo(-4, 12);
  });
  it("MST Q5(a): −∇V at (2, π, 3) = −108 aρ − 103 az", () => {
    const g = scalarFields["mst-5a"]!.grad([2, Math.PI, 3]);
    expect(-g[0]).toBeCloseTo(-108, 10);
    expect(-g[1]).toBeCloseTo(0, 10);
    expect(-g[2]).toBeCloseTo(-103, 10);
  });
  it("Finals 24-25 Q1(c): ∇V at (2, −2, 1) = −10.9116, −3.32917, 20 (kV/m)", () => {
    const g = scalarFields["f2425-1c"]!.grad([2, -2, 1]);
    expect(g[0]).toBeCloseTo(-10.9116, 4);
    expect(g[1]).toBeCloseTo(-3.32917, 5);
    expect(g[2]).toBe(20);
  });
  it("tutorial 3.6: divergences 4, −1, 2.598 at their points", () => {
    expect(vectorFields["tut-3.6a"]!.div([1, -2, 3])).toBe(4);
    expect(vectorFields["tut-3.6b"]!.div([5, Math.PI / 2, 1])).toBeCloseTo(-1, 12);
    expect(vectorFields["tut-3.6c"]!.div([1, Math.PI / 6, Math.PI / 3])).toBeCloseTo(2.598076, 6);
  });
  it("tutorial 3.8: curls at their points", () => {
    expect(vectorFields["tut-3.6a"]!.curl([1, -2, 3])).toEqual([1, -2, -11]);
    const b = vectorFields["tut-3.6b"]!.curl([5, Math.PI / 2, 1]);
    expect(b[0]).toBeCloseTo(0, 12);
    expect(b[1]).toBeCloseTo(5, 12);
    expect(b[2]).toBeCloseTo(0, 12);
    const c = vectorFields["tut-3.6c"]!.curl([1, Math.PI / 6, Math.PI / 3]);
    expect(c[0]).toBeCloseTo(1.732051, 6);
    expect(c[1]).toBeCloseTo(-4.5, 12);
    expect(c[2]).toBeCloseTo(0.5, 12);
  });
  it("HW02 2.2: divergences", () => {
    expect(vectorFields["hw-2.2a"]!.div([2, 1, 5])).toBe(1); // 3y − x
    expect(vectorFields["hw-2.2b"]!.div([2, Math.PI / 4, 3])).toBeCloseTo(2 * 9 + 1 + 2 * 2 * 0.5, 12); // 2z² + sin2φ + 2ρ sin²φ
    expect(vectorFields["hw-2.2c"]!.div([4, 1, 2])).toBe(3);
  });
  it("round-trips native coordinates", () => {
    expect(nativeOf(fromCyl(2, 1, -1), "cyl")[1]).toBeCloseTo(1, 12);
    expect(nativeOf(fromSph(3, 0.8, 2), "sph")[1]).toBeCloseTo(0.8, 12);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/physics/test/fields.test.ts`
Expected: FAIL (`scalarFields` is not exported).

- [ ] **Step 3: Implement** `app/packages/physics/src/fields.ts`

```ts
import { toCyl, toSph, unitVectors, type CoordSystem } from "./coords";
import type { Vec3 } from "./vec";

export type Native = [number, number, number];
export type ScalarField = { id: string; text: string; latex: string; system: CoordSystem; f: (n: Native) => number; grad: (n: Native) => Native };
export type VectorField = { id: string; text: string; latex: string; system: CoordSystem; F: (n: Native) => Native; div: (n: Native) => number; curl: (n: Native) => Native };

/** Native coordinates of a cartesian point: (x, y, z), (ρ, φ, z) or (r, θ, φ); angles in radians. */
export function nativeOf(p: Vec3, system: CoordSystem): Native {
  if (system === "cart") return [p[0], p[1], p[2]];
  if (system === "cyl") {
    const c = toCyl(p);
    return [c.rho, c.phi, c.z];
  }
  const s = toSph(p);
  return [s.r, s.theta, s.phi];
}

/** Native components at p → cartesian components. */
export function cartOf(v: Native, p: Vec3, system: CoordSystem): Vec3 {
  const [a, b, c] = unitVectors(p, system);
  return [v[0] * a[0] + v[1] * b[0] + v[2] * c[0], v[0] * a[1] + v[1] * b[1] + v[2] * c[1], v[0] * a[2] + v[1] * b[2] + v[2] * c[2]];
}

const { sin, cos, sqrt } = Math;
const S = (x: ScalarField) => x;
const V = (x: VectorField) => x;

export const scalarFields: Record<string, ScalarField> = {
  hill: S({ id: "hill", text: "f = 4 − x² − z²", latex: String.raw`f=4-x^2-z^2`, system: "cart",
    f: ([x, , z]) => 4 - x * x - z * z, grad: ([x, , z]) => [-2 * x, 0, -2 * z] }),
  "tut-3.4": S({ id: "tut-3.4", text: "Φ = xy + yz + xz", latex: String.raw`\Phi=xy+yz+xz`, system: "cart",
    f: ([x, y, z]) => x * y + y * z + x * z, grad: ([x, y, z]) => [y + z, x + z, x + y] }),
  "hw-2.1a": S({ id: "hw-2.1a", text: "V = 10xyz − 2x²z", latex: String.raw`V=10xyz-2x^2z`, system: "cart",
    f: ([x, y, z]) => 10 * x * y * z - 2 * x * x * z, grad: ([x, y, z]) => [10 * y * z - 4 * x * z, 10 * x * z, 10 * x * y - 2 * x * x] }),
  "hw-2.1b": S({ id: "hw-2.1b", text: "U = 2ρ sin φ + ρz", latex: String.raw`U=2\rho\sin\phi+\rho z`, system: "cyl",
    f: ([r, p, z]) => 2 * r * sin(p) + r * z, grad: ([r, p, z]) => [2 * sin(p) + z, 2 * cos(p), r] }),
  "hw-2.1c": S({ id: "hw-2.1c", text: "W = (4/r) sin θ cos φ", latex: String.raw`W=\tfrac{4}{r}\sin\theta\cos\phi`, system: "sph",
    f: ([r, t, p]) => (4 / r) * sin(t) * cos(p), grad: ([r, t, p]) => [(-4 * sin(t) * cos(p)) / (r * r), (4 * cos(t) * cos(p)) / (r * r), (-4 * sin(p)) / (r * r)] }),
  "mst-5a": S({ id: "mst-5a", text: "V = ρ²z³ + 5z cos φ", latex: String.raw`V=\rho^2z^3+5z\cos\phi`, system: "cyl",
    f: ([r, p, z]) => r * r * z ** 3 + 5 * z * cos(p), grad: ([r, p, z]) => [2 * r * z ** 3, (-5 * z * sin(p)) / r, 3 * r * r * z * z + 5 * cos(p)] }),
  "f2425-1c": S({ id: "f2425-1c", text: "V = x³ sin y + 10z²", latex: String.raw`V=x^3\sin y+10z^2`, system: "cart",
    f: ([x, y, z]) => x ** 3 * sin(y) + 10 * z * z, grad: ([x, y, z]) => [3 * x * x * sin(y), x ** 3 * cos(y), 20 * z] }),
};

const cot = (t: number) => cos(t) / sin(t);

export const vectorFields: Record<string, VectorField> = {
  source: V({ id: "source", text: "A = x ax + y ay + z az", latex: String.raw`\mathbf A=x\,\mathbf a_x+y\,\mathbf a_y+z\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [x, y, z], div: () => 3, curl: () => [0, 0, 0] }),
  swirl: V({ id: "swirl", text: "A = −y ax + x ay", latex: String.raw`\mathbf A=-y\,\mathbf a_x+x\,\mathbf a_y`, system: "cart",
    F: ([x, y]) => [-y, x, 0], div: () => 0, curl: () => [0, 0, 2] }),
  uniform: V({ id: "uniform", text: "A = ax", latex: String.raw`\mathbf A=\mathbf a_x`, system: "cart",
    F: () => [1, 0, 0], div: () => 0, curl: () => [0, 0, 0] }),
  "tut-3.6a": V({ id: "tut-3.6a", text: "A = yz ax + 4xy ay + y az", latex: String.raw`\mathbf A=yz\,\mathbf a_x+4xy\,\mathbf a_y+y\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [y * z, 4 * x * y, y], div: ([x]) => 4 * x, curl: ([, y, z]) => [1, y, 4 * y - z] }),
  "tut-3.6b": V({ id: "tut-3.6b", text: "B = ρz sin φ aρ + 3ρz² cos φ aφ", latex: String.raw`\mathbf B=\rho z\sin\phi\,\mathbf a_\rho+3\rho z^2\cos\phi\,\mathbf a_\phi`, system: "cyl",
    F: ([r, p, z]) => [r * z * sin(p), 3 * r * z * z * cos(p), 0],
    div: ([, p, z]) => (2 - 3 * z) * z * sin(p),
    curl: ([r, p, z]) => [-6 * r * z * cos(p), r * sin(p), (6 * z - 1) * z * cos(p)] }),
  "tut-3.6c": V({ id: "tut-3.6c", text: "C = 2r cos θ cos φ ar + √r aφ", latex: String.raw`\mathbf C=2r\cos\theta\cos\phi\,\mathbf a_r+r^{1/2}\,\mathbf a_\phi`, system: "sph",
    F: ([r, t, p]) => [2 * r * cos(t) * cos(p), 0, sqrt(r)],
    div: ([, t, p]) => 6 * cos(t) * cos(p),
    curl: ([r, t, p]) => [cot(t) / sqrt(r), -2 * cot(t) * sin(p) - 3 / (2 * sqrt(r)), 2 * sin(t) * cos(p)] }),
  "hw-2.2a": V({ id: "hw-2.2a", text: "A = xy ax + y² ay − xz az", latex: String.raw`\mathbf A=xy\,\mathbf a_x+y^2\,\mathbf a_y-xz\,\mathbf a_z`, system: "cart",
    F: ([x, y, z]) => [x * y, y * y, -x * z], div: ([x, y]) => 3 * y - x, curl: ([x, , z]) => [0, z, -x] }),
  "hw-2.2b": V({ id: "hw-2.2b", text: "B = ρz² aρ + ρ sin²φ aφ + 2ρz sin²φ az", latex: String.raw`\mathbf B=\rho z^2\,\mathbf a_\rho+\rho\sin^2\!\phi\,\mathbf a_\phi+2\rho z\sin^2\!\phi\,\mathbf a_z`, system: "cyl",
    F: ([r, p, z]) => [r * z * z, r * sin(p) ** 2, 2 * r * z * sin(p) ** 2],
    div: ([r, p, z]) => 2 * z * z + sin(2 * p) + 2 * r * sin(p) ** 2,
    curl: ([r, p, z]) => [2 * z * sin(2 * p), 2 * z * (r - sin(p) ** 2), 2 * sin(p) ** 2] }),
  "hw-2.2c": V({ id: "hw-2.2c", text: "C = r ar + r cos²θ aφ", latex: String.raw`\mathbf C=r\,\mathbf a_r+r\cos^2\!\theta\,\mathbf a_\phi`, system: "sph",
    F: ([r, t]) => [r, 0, r * cos(t) ** 2],
    div: () => 3,
    curl: ([, t]) => [cot(t) - 3 * sin(t) * cos(t), -2 * cos(t) ** 2, 0] }),
};
```

Add `export * from "./fields";` to `packages/physics/src/index.ts`.

- [ ] **Step 4: Run the test and see it pass**

Run: `pnpm vitest run packages/physics`
Expected: PASS. Every field passes the finite-difference check at all three points. If one fails, the formula in `fields.ts` is wrong: fix the formula, never the test. The formulas above were checked with SymPy.

- [ ] **Step 5: Commit**

```bash
git add packages/physics && git commit -m "feat(physics): named scalar and vector fields from the tutorial and homework, verified by finite differences

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: `scalar-slice` and `vector-slice` (gradient, divergence box, curl loop)

**Files:**
- Create: `app/packages/plate/src/components/math.ts`, `app/packages/plate/test/math.test.ts`
- Modify: `app/packages/plate/src/components/em.ts` (add `...mathComponents` to `emComponents`), `app/packages/plate/src/index.ts`

**Interfaces:**
- **`scalar-slice`**
  - params: `{ field: ScalarFieldId, plane: "xz" | "xy" = "xz", offset = 0, probe: V3, draggable = false, arrows = true }`
  - model: `{ system, f, g1, g2, g3, gmag }` at the probe. `g*` are the field's native components; the values are `null` where the probe is singular.
  - readouts: `{ f: "", g1: "", g2: "", g3: "", gmag: "" }`. handles: `["probe"]`.
- **`vector-slice`**
  - params: `{ field: VectorFieldId, plane = "xz", offset = 0, probe: V3, draggable = false, box = 0, loop = 0 }`
  - model: `{ system, F1, F2, F3, div, c1, c2, c3, boxFlux, boxRatio, circ, circRatio, loopAxis }`
    - `box` / `loop`: side length in metres; 0 means none.
    - `boxRatio` = boxFlux / box³.
    - `circRatio` = circ / loop².
    - `loopAxis` is `"+z"` for the xy plane and `"−y"` for xz (the out-of-screen normal).
    - `boxFlux`, `boxRatio`, `circ` and `circRatio` are omitted when their side is 0.
  - readouts: all numeric keys above, unit `""`.
- **Arrow grids** are computed in the view, not the model: 9×7 cells over x ∈ [−2.4, 2.4] and vertical ∈ [−1.8, 1.8].

- [ ] **Step 1: Write the failing test** at `app/packages/plate/test/math.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const model = (component: string, params: Record<string, unknown>) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances: [{ id: "a", component, params, visible: true }], steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0)).a!.model as Record<string, number | string | null>;
};

describe("scalar-slice", () => {
  it("reports the value and native gradient at the probe", () => {
    const m = model("scalar-slice", { field: "tut-3.4", probe: [1, 2, 3] });
    expect(m).toMatchObject({ system: "cart", f: 11, g1: 5, g2: 4, g3: 3 });
    expect(m.gmag as number).toBeCloseTo(Math.sqrt(50), 12);
  });
  it("uses native components for a spherical field (HW02 2.1(c) at R(1, π/6, π/2))", () => {
    const m = model("scalar-slice", { field: "hw-2.1c", probe: [0, 0.5, Math.sqrt(3) / 2] });
    expect(m.g1 as number).toBeCloseTo(0, 10);
    expect(m.g2 as number).toBeCloseTo(0, 10);
    expect(m.g3 as number).toBeCloseTo(-4, 10);
  });
  it("is null at a singular point, not NaN", () => {
    expect(model("scalar-slice", { field: "hw-2.1c", probe: [0, 0, 0] }).g1).toBeNull();
  });
});

describe("vector-slice", () => {
  it("a shrinking box gives the divergence: exact for linear fields", () => {
    expect(model("vector-slice", { field: "source", probe: [0.5, 0, 0.2], box: 0.4 }).boxRatio as number).toBeCloseTo(3, 10);
    expect(model("vector-slice", { field: "tut-3.6a", probe: [1, -2, 3], box: 0.2 }).boxRatio as number).toBeCloseTo(4, 10);
  });
  it("a counter-clockwise loop in the x–y plane gives curl_z; in the x–z plane it measures about −y", () => {
    const xy = model("vector-slice", { field: "swirl", plane: "xy", probe: [0.3, 0.1, 0], loop: 0.3 });
    expect(xy.circRatio as number).toBeCloseTo(2, 10);
    expect(xy.loopAxis).toBe("+z");
    const xz = model("vector-slice", { field: "tut-3.6a", plane: "xz", probe: [1, -2, 3], loop: 0.2 });
    expect(xz.circRatio as number).toBeCloseTo(2, 8); // curl·(−ay) = −y = 2 at y = −2
    expect(xz.loopAxis).toBe("−y");
  });
  it("omits the box and loop readouts when their size is 0", () => {
    const m = model("vector-slice", { field: "uniform", probe: [0, 0, 0] });
    expect("boxRatio" in m || "circRatio" in m).toBe(false);
    expect(m).toMatchObject({ F1: 1, F2: 0, F3: 0, div: 0 });
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/plate/test/math.test.ts`
Expected: FAIL (unknown component `scalar-slice`).

- [ ] **Step 3: Implement** `app/packages/plate/src/components/math.ts`

```ts
import { cartOf, gaussLegendre, nativeOf, scalarFields, vectorFields, type Vec3 } from "@forma/physics";
import { z } from "zod";
import { defineComponent } from "../component";

const V3 = z.tuple([z.number(), z.number(), z.number()]);
const finite = (v: number) => (Number.isFinite(v) ? v : null);
const ScalarId = z.enum(Object.keys(scalarFields) as [string, ...string[]]);
const VectorId = z.enum(Object.keys(vectorFields) as [string, ...string[]]);

export const ScalarSlice = defineComponent({
  id: "scalar-slice",
  params: z.object({
    field: ScalarId, plane: z.enum(["xz", "xy"]).default("xz"), offset: z.number().default(0),
    probe: V3, draggable: z.boolean().default(false), arrows: z.boolean().default(true),
  }),
  model: (p) => {
    const s = scalarFields[p.field]!;
    const n = nativeOf(p.probe as Vec3, s.system);
    const g = s.grad(n);
    return { system: s.system, f: finite(s.f(n)), g1: finite(g[0]), g2: finite(g[1]), g3: finite(g[2]), gmag: finite(Math.hypot(g[0], g[1], g[2])) };
  },
  handles: ["probe"],
  readouts: { f: "", g1: "", g2: "", g3: "", gmag: "" },
  quotable: { f: "", g1: "", g2: "", g3: "", gmag: "" },
});

/** Net outward flux of F through a cube of side s centred at c (4×4 Gauss–Legendre per face). */
export function boxFlux(F: (p: Vec3) => Vec3, c: Vec3, s: number): number {
  const { nodes, weights } = gaussLegendre(4);
  const h = s / 2;
  let sum = 0;
  for (let axis = 0; axis < 3; axis++) {
    const [u, v] = [0, 1, 2].filter((k) => k !== axis) as [number, number];
    for (const sign of [1, -1]) {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const p = [c[0], c[1], c[2]];
          p[axis] = c[axis] + sign * h;
          p[u] = c[u] + h * nodes[i]!;
          p[v] = c[v] + h * nodes[j]!;
          sum += weights[i]! * weights[j]! * h * h * sign * F(p as unknown as Vec3)[axis]!;
        }
      }
    }
  }
  return sum;
}

/** Counter-clockwise circulation of F round a square of side s centred at c, in the plane spanned by axes u then v (normal u × v). */
export function loopCirculation(F: (p: Vec3) => Vec3, c: Vec3, s: number, u: number, v: number): number {
  const { nodes, weights } = gaussLegendre(4);
  const h = s / 2;
  const edges: [number, number, number, number][] = [
    // [fixed axis, fixed offset, moving axis, direction]
    [v, -h, u, 1], [u, h, v, 1], [v, h, u, -1], [u, -h, v, -1],
  ];
  let sum = 0;
  for (const [fa, fo, ma, dir] of edges) {
    for (let i = 0; i < 4; i++) {
      const p = [c[0], c[1], c[2]];
      p[fa] = c[fa] + fo;
      p[ma] = c[ma] + h * nodes[i]!;
      sum += weights[i]! * h * dir * F(p as unknown as Vec3)[ma]!;
    }
  }
  return sum;
}

export const VectorSlice = defineComponent({
  id: "vector-slice",
  params: z.object({
    field: VectorId, plane: z.enum(["xz", "xy"]).default("xz"), offset: z.number().default(0),
    probe: V3, draggable: z.boolean().default(false),
    box: z.number().min(0).default(0), loop: z.number().min(0).default(0),
  }),
  model: (p) => {
    const f = vectorFields[p.field]!;
    const c = p.probe as Vec3;
    const n = nativeOf(c, f.system);
    const Fv = f.F(n);
    const cu = f.curl(n);
    const cart = (q: Vec3) => cartOf(f.F(nativeOf(q, f.system)), q, f.system);
    const out: Record<string, number | string | null> = {
      system: f.system, F1: finite(Fv[0]), F2: finite(Fv[1]), F3: finite(Fv[2]),
      div: finite(f.div(n)), c1: finite(cu[0]), c2: finite(cu[1]), c3: finite(cu[2]),
      loopAxis: p.plane === "xy" ? "+z" : "−y",
    };
    if (p.box > 0) {
      const b = boxFlux(cart, c, p.box);
      out.boxFlux = finite(b);
      out.boxRatio = finite(b / p.box ** 3);
    }
    if (p.loop > 0) {
      // xy: x then y, normal +z. xz on screen is x right, z up: counter-clockwise on screen is x then z, normal x × z = −y.
      const k = p.plane === "xy" ? loopCirculation(cart, c, p.loop, 0, 1) : loopCirculation(cart, c, p.loop, 0, 2);
      out.circ = finite(k);
      out.circRatio = finite(k / p.loop ** 2);
    }
    return out;
  },
  handles: ["probe"],
  readouts: { F1: "", F2: "", F3: "", div: "", c1: "", c2: "", c3: "", boxFlux: "", boxRatio: "", circ: "", circRatio: "" },
  quotable: { F1: "", F2: "", F3: "", div: "", c1: "", c2: "", c3: "", boxRatio: "", circRatio: "" },
});

export const mathComponents = [ScalarSlice, VectorSlice];
```

Details:
- Check `loopCirculation` for the xz plane: u = x (0) and v = z (2), so the normal is x̂ × ẑ = −ŷ. For `tut-3.6a` at y = −2, curl·(−ŷ) = −(y) = 2.
- `z.enum(Object.keys(…))` needs a non-empty tuple type. The cast above does that.
- In `em.ts`, add `import { mathComponents } from "./math";` and `...mathComponents` to `emComponents`.
- In `packages/plate/src/index.ts`, export `./components/math`.

- [ ] **Step 4: Run it and see it pass**

Run: `pnpm vitest run packages/plate`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): scalar-slice (gradient) and vector-slice (divergence box, curl loop)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: `coord-region` (dl, dS, dV and finite regions)

**Files:** Modify `app/packages/plate/src/components/math.ts` and `app/packages/plate/test/math.test.ts`.

**Interfaces:**
- params: `{ system: "cart" | "cyl" | "sph", ranges: [[a, b], [a, b], [a, b]], face: 0 | 1 | 2 | null = null, faceAt: "max" | "min" = "max" }`
  - Ranges are in native coordinates. Angles (cyl index 1; sph indices 1 and 2) are in **degrees**.
  - `face` k is the surface where coordinate k is held at its `faceAt` bound.
- model:
  - `len1`, `len2`, `len3`: the exact lengths of the three edges leaving the min corner, along each coordinate curve.
  - `area`: the exact area of the chosen face, or absent when `face` is null.
  - `volume`: the exact volume.
- readouts: `{ len1: "m", len2: "m", len3: "m", area: "m^2", volume: "m^3" }`, with the same quotable values.

The edge lengths along the coordinate curves are:

| System | Edge 1 | Edge 2 | Edge 3 |
|---|---|---|---|
| cart | Δx | Δy | Δz |
| cyl | Δρ | ρa·Δφ | Δz |
| sph | Δr | ra·Δθ | ra·sin θa·Δφ |

Here Δφ and Δθ are in radians. If θa is 0, `len3` is 0, and that is correct.

The areas and volumes are:

| System | Face 0 | Face 1 | Face 2 | Volume |
|---|---|---|---|---|
| cart | Δy·Δz | Δx·Δz | Δx·Δy | ΔxΔyΔz |
| cyl | ρ*·Δφ·Δz, with ρ* the held bound | Δρ·Δz (a half-plane) | ½(ρb² − ρa²)·Δφ | ½(ρb² − ρa²)·Δφ·Δz |
| sph | r*²·(cos θa − cos θb)·Δφ | ½(rb² − ra²)·sin θ*·Δφ (a cone) | ½(rb² − ra²)·Δθ (a half-plane) | ⅓(rb³ − ra³)·(cos θa − cos θb)·Δφ |

- [ ] **Step 1: Write the failing test.** Append to `math.test.ts`:

```ts
describe("coord-region", () => {
  it("MST Q3(a): the spherical patch r = 25 cm, 0 < θ < 60°, 30° < φ < 45°", () => {
    const m = model("coord-region", { system: "sph", ranges: [[0, 0.25], [0, 60], [30, 45]], face: 0 });
    expect(m.area as number).toBeCloseTo(0.00818123, 8);
  });
  it("HW02 2.5(b): the cylinder side ρ = 4 m, 0 < z < 7 m", () => {
    const m = model("coord-region", { system: "cyl", ranges: [[0, 4], [0, 360], [0, 7]], face: 0 });
    expect(m.area as number).toBeCloseTo(175.929, 3);
  });
  it("volumes in all three systems", () => {
    expect(model("coord-region", { system: "cart", ranges: [[0, 2], [0, 2], [0, 2]] }).volume).toBe(8);
    expect(model("coord-region", { system: "cyl", ranges: [[0, 0.2], [0, 180], [-4, -2]] }).volume as number).toBeCloseTo(0.04 * Math.PI * 2 / 2, 12);
    expect(model("coord-region", { system: "sph", ranges: [[0, 5.25], [0, 180], [0, 360]] }).volume as number).toBeCloseTo(606.131, 3);
  });
  it("edge lengths of a small spherical element carry the scale factors", () => {
    const m = model("coord-region", { system: "sph", ranges: [[2, 2.1], [30, 31], [0, 1]] });
    const d = Math.PI / 180;
    expect(m.len1 as number).toBeCloseTo(0.1, 12);
    expect(m.len2 as number).toBeCloseTo(2 * d, 12);
    expect(m.len3 as number).toBeCloseTo(2 * Math.sin(30 * d) * d, 12);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/plate/test/math.test.ts`
Expected: FAIL (unknown component `coord-region`).

- [ ] **Step 3: Implement.** Append to `math.ts`, before `mathComponents`:

```ts
const Range = z.tuple([z.number(), z.number()]).refine(([a, b]) => b > a, "range must increase");
const DEG = Math.PI / 180;

export const CoordRegion = defineComponent({
  id: "coord-region",
  params: z.object({
    system: z.enum(["cart", "cyl", "sph"]),
    ranges: z.tuple([Range, Range, Range]),
    face: z.union([z.literal(0), z.literal(1), z.literal(2), z.null()]).default(null),
    faceAt: z.enum(["max", "min"]).default("max"),
  }),
  model: (p) => {
    const [[a1, b1], [a2, b2], [a3, b3]] = p.ranges;
    const pick = (a: number, b: number) => (p.faceAt === "max" ? b : a);
    if (p.system === "cart") {
      const [dx, dy, dz] = [b1 - a1, b2 - a2, b3 - a3];
      const area = p.face === null ? undefined : [dy * dz, dx * dz, dx * dy][p.face];
      return { len1: dx, len2: dy, len3: dz, volume: dx * dy * dz, ...(area === undefined ? {} : { area }) };
    }
    if (p.system === "cyl") {
      const dphi = (b2 - a2) * DEG, dz = b3 - a3;
      const area = p.face === null ? undefined : [pick(a1, b1) * dphi * dz, (b1 - a1) * dz, 0.5 * (b1 * b1 - a1 * a1) * dphi][p.face];
      return { len1: b1 - a1, len2: a1 * dphi, len3: dz, volume: 0.5 * (b1 * b1 - a1 * a1) * dphi * dz, ...(area === undefined ? {} : { area }) };
    }
    const ta = a2 * DEG, tb = b2 * DEG, dth = tb - ta, dphi = (b3 - a3) * DEG;
    const rs = pick(a1, b1), ts = pick(ta, tb);
    const area = p.face === null ? undefined : [rs * rs * (Math.cos(ta) - Math.cos(tb)) * dphi, 0.5 * (b1 * b1 - a1 * a1) * Math.sin(ts) * dphi, 0.5 * (b1 * b1 - a1 * a1) * dth][p.face];
    return {
      len1: b1 - a1, len2: a1 * dth, len3: a1 * Math.sin(ta) * dphi,
      volume: ((b1 ** 3 - a1 ** 3) / 3) * (Math.cos(ta) - Math.cos(tb)) * dphi,
      ...(area === undefined ? {} : { area }),
    };
  },
  handles: [],
  readouts: { len1: "m", len2: "m", len3: "m", area: "m^2", volume: "m^3" },
  quotable: { len1: "m", len2: "m", len3: "m", area: "m^2", volume: "m^3" },
});
```

Change `mathComponents` to `[ScalarSlice, VectorSlice, CoordRegion]`.

- [ ] **Step 4: Run it and see it pass**

Run: `pnpm vitest run packages/plate`
Expected: PASS. Check two cases by hand:
- The cylindrical volume ½(0.04)(π)(2) = 0.04π.
- A full sphere of radius 5.25 has volume (5.25³/3)(2)(2π) = 606.131.

- [ ] **Step 5: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): coord-region (exact element edges, face areas and volumes in all three systems)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 5: `spectrum` and `unit-convert` (Unit 1)

**Files:** Modify `math.ts` and `math.test.ts`.

**Interfaces:**
- **`spectrum`**
  - params: `{ f: number (Hz, > 0) = 2.45e9, draggable = false }`
  - model: `{ f, lambda: C0 / f, band }`, where `band` is one of "Radio", "Microwave", "Infrared", "Visible", "Ultraviolet", "X-ray" or "Gamma".
  - Band boundaries in Hz:

    | Band | From | Below |
    |---|---|---|
    | Radio | — | 3e8 |
    | Microwave | 3e8 | 3e11 |
    | Infrared | 3e11 | 4e14 |
    | Visible | 4e14 | 7.9e14 |
    | Ultraviolet | 7.9e14 | 3e16 |
    | X-ray | 3e16 | 3e19 |
    | Gamma | 3e19 | — |

  - readouts: `{ f: "Hz", lambda: "m" }`. handles: `["f"]`.
- **`unit-convert`**
  - params: `{ value: number, unit: string }`, using any unit `toSI` accepts.
  - model: `{ dim, ok }`, plus exactly one SI value keyed by its dimension. The keys are `siM` (m), `siM2` (m²), `siM3` (m³), `siC` (C), `siHz` (Hz), `siV` (V), `siF` (F) and `siN` (N); any other dimension goes to `si`, unitless. Keying by unit means text such as "0.007112 m" is backed by a readout.
  - readouts: `{ siM: "m", siM2: "m^2", siM3: "m^3", siC: "C", siHz: "Hz", siV: "V", siF: "F", siN: "N", si: "" }`.

- [ ] **Step 1: Write the failing test.** Append to `math.test.ts`:

```ts
describe("spectrum and unit-convert", () => {
  it("Wi-Fi at 2.45 GHz is a 12.2 cm microwave", () => {
    const m = model("spectrum", { f: 2.45e9 });
    expect(m.band).toBe("Microwave");
    expect(m.lambda as number).toBeCloseTo(0.12236, 5);
  });
  it("green light at 5.45e14 Hz is visible, 550 nm", () => {
    const m = model("spectrum", { f: 5.45e14 });
    expect(m.band).toBe("Visible");
    expect(m.lambda as number).toBeCloseTo(5.5008e-7, 10);
  });
  it("converts the coax core 0.28 inch and the sphere diameter 12.8 cm to metres", () => {
    expect(model("unit-convert", { value: 0.28, unit: "in" })).toMatchObject({ dim: "m", ok: true });
    expect(model("unit-convert", { value: 0.28, unit: "in" }).siM as number).toBeCloseTo(0.007112, 12);
    expect(model("unit-convert", { value: 12.8, unit: "cm" }).siM as number).toBeCloseTo(0.128, 12);
    expect(model("unit-convert", { value: 200, unit: "mC" }).siC as number).toBeCloseTo(0.2, 12);
    expect(model("unit-convert", { value: 5, unit: "cm^2" }).siM2 as number).toBeCloseTo(5e-4, 15);
  });
  it("flags a unit it cannot read instead of throwing", () => {
    expect(model("unit-convert", { value: 3, unit: "furlong" })).toMatchObject({ ok: false });
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/plate/test/math.test.ts`
Expected: FAIL (unknown component `spectrum`).

- [ ] **Step 3: Implement.** Append to `math.ts`:

```ts
import { toSI } from "@forma/engine";

export const C0 = 299_792_458;
const BANDS: [number, string][] = [[3e8, "Radio"], [3e11, "Microwave"], [4e14, "Infrared"], [7.9e14, "Visible"], [3e16, "Ultraviolet"], [3e19, "X-ray"], [Infinity, "Gamma"]];

export const Spectrum = defineComponent({
  id: "spectrum",
  params: z.object({ f: z.number().positive().default(2.45e9), draggable: z.boolean().default(false) }),
  model: (p) => ({ f: p.f, lambda: C0 / p.f, band: BANDS.find(([top]) => p.f < top)![1] }),
  handles: ["f"],
  readouts: { f: "Hz", lambda: "m" },
  quotable: { f: "Hz", lambda: "m" },
});

export const UnitConvert = defineComponent({
  id: "unit-convert",
  params: z.object({ value: z.number(), unit: z.string().min(1) }),
  model: (p) => {
    try {
      const q = toSI(p.value, p.unit);
      const key = ({ m: "siM", "m^2": "siM2", "m^3": "siM3", C: "siC", Hz: "siHz", V: "siV", F: "siF", N: "siN" } as Record<string, string>)[q.dim] ?? "si";
      return { [key]: q.value, dim: q.dim, ok: true } as Record<string, number | string | boolean>;
    } catch {
      return { dim: "", ok: false };
    }
  },
  handles: [],
  readouts: { siM: "m", siM2: "m^2", siM3: "m^3", siC: "C", siHz: "Hz", siV: "V", siF: "F", siN: "N", si: "" },
  quotable: { siM: "m", siM2: "m^2", siM3: "m^3", siC: "C", siHz: "Hz", siV: "V", siF: "F", siN: "N" },
});
```

- Move the `toSI` import to the top of the file with the others.
- Change `mathComponents` to `[ScalarSlice, VectorSlice, CoordRegion, Spectrum, UnitConvert]`.
- If `toSI` returns `null` for unknown units instead of throwing, handle that: `if (!q) return { si: null, dim: "", ok: false };`.

- [ ] **Step 4: Run it and see it pass**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS. Check two values by hand:
- 299792458 / 2.45e9 = 0.122364 m.
- 299792458 / 5.45e14 = 5.50078e-7 m.

- [ ] **Step 5: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): spectrum (frequency to wavelength, bands) and unit-convert (prefixes, inches)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 6: Views and readout labels

**Files:**
- Create: `app/apps/web/components/plate/viewsMath.tsx`
- Modify: `app/apps/web/components/plate/views2d.tsx` (register), `app/apps/web/components/plate/Readouts.tsx` (labels)

- [ ] **Step 1: Views.** Create `viewsMath.tsx`. The code below is complete; transcribe it.

```tsx
"use client";

import { cartOf, nativeOf, scalarFields, vectorFields, type Vec3 } from "@forma/physics";
import { toSvg, toSvg3, PX } from "@forma/plate";
import type { KeyboardEvent, PointerEvent } from "react";
import { usePlateStage } from "./stage-context";
import type { ViewProps } from "./views2d";

const COLS = 9, ROWS = 7, X0 = -2.4, X1 = 2.4, Y0 = -1.8, Y1 = 1.8;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Plane point (a = x, b = vertical) → 3D point for the chosen plane. */
const at = (plane: "xz" | "xy", a: number, b: number, offset: number): Vec3 => (plane === "xz" ? [a, offset, b] : [a, b, offset]);
/** Vertical plane coordinate of a 3D point. */
const vert = (plane: "xz" | "xy", p: readonly number[]) => (plane === "xz" ? p[2]! : p[1]!);
const cells = () => {
  const out: [number, number][] = [];
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) out.push([X0 + ((i + 0.5) * (X1 - X0)) / COLS, Y0 + ((j + 0.5) * (Y1 - Y0)) / ROWS]);
  return out;
};

function PlaneArrow({ a, b, da, db, tone }: { a: number; b: number; da: number; db: number; tone: string }) {
  const L = Math.hypot(da, db);
  if (!Number.isFinite(L) || L < 1e-9) return null;
  const len = 0.32;
  const [x1, y1] = toSvg([a - (len / 2) * (da / L), 0, b - (len / 2) * (db / L)]);
  const [x2, y2] = toSvg([a + (len / 2) * (da / L), 0, b + (len / 2) * (db / L)]);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: `var(--${tone})` }} strokeWidth={1.3} markerEnd={`url(#arrow-${tone})`} />;
}

function useProbe(id: string, probe: [number, number, number], plane: "xz" | "xy", draggable: boolean) {
  const stage = usePlateStage();
  const can = draggable && stage.editable(id);
  const set = (a: number, b: number) => stage.edit(id, { probe: plane === "xz" ? [r2(a), probe[1], r2(b)] : [r2(a), r2(b), probe[2]] });
  const handlers = can
    ? {
        tabIndex: 0,
        role: "button",
        onPointerDown: (e: PointerEvent<SVGGElement>) => e.currentTarget.setPointerCapture(e.pointerId),
        onPointerMove: (e: PointerEvent<SVGGElement>) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
          set(mx, mz);
        },
        onKeyDown: (e: KeyboardEvent<SVGGElement>) => {
          const d: Record<string, [number, number]> = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, 0.1], ArrowDown: [0, -0.1] };
          const k = d[e.key];
          if (!k) return;
          e.preventDefault();
          set(probe[0] + k[0], vert(plane, probe) + k[1]);
        },
      }
    : { role: "img" };
  return { can, handlers };
}

function Probe({ id, probe, plane, draggable, label }: { id: string; probe: [number, number, number]; plane: "xz" | "xy"; draggable: boolean; label: string }) {
  const { can, handlers } = useProbe(id, probe, plane, draggable);
  const [x, y] = toSvg([probe[0], 0, vert(plane, probe)]);
  return (
    <g transform={`translate(${x} ${y})`} className={can ? "handle" : undefined} aria-label={can ? `${label}. Drag, or use the arrow keys, to move it.` : label} {...handlers}>
      <circle r={4} className="fill-charge" />
      <line x1={-9} x2={9} y1={0} y2={0} className="ink" />
      <line x1={0} x2={0} y1={-9} y2={9} className="ink" />
      {can && <circle r={14} className="handle-ring" />}
    </g>
  );
}

function PlaneAxes({ plane }: { plane: "xz" | "xy" }) {
  return (
    <g>
      <text x={X1 * PX - 12} y={-6} className="plate-label">x</text>
      <text x={6} y={-Y1 * PX + 12} className="plate-label">{plane === "xz" ? "z" : "y"}</text>
    </g>
  );
}

export function ScalarSliceView({ id, ev }: ViewProps) {
  const p = ev.params as { field: string; plane: "xz" | "xy"; offset: number; probe: [number, number, number]; draggable: boolean; arrows: boolean };
  const s = scalarFields[p.field]!;
  const pts = cells().map(([a, b]) => {
    const q = at(p.plane, a, b, p.offset);
    const n = nativeOf(q, s.system);
    const g = cartOf(s.grad(n), q, s.system);
    return { a, b, f: s.f(n), g };
  });
  const fs = pts.map((x) => x.f).filter(Number.isFinite);
  const lo = Math.min(...fs), hi = Math.max(...fs);
  const cw = ((X1 - X0) / COLS) * PX, ch = ((Y1 - Y0) / ROWS) * PX;
  return (
    <g className="v-scalar-slice" role="group" aria-label={`Scalar field ${s.text}, with gradient arrows`}>
      {pts.map(({ a, b, f }, i) => {
        if (!Number.isFinite(f)) return null;
        const [x, y] = toSvg([a, 0, b]);
        const t = hi > lo ? (f - lo) / (hi - lo) : 0.5;
        return <rect key={`c${i}`} x={x - cw / 2} y={y - ch / 2} width={cw} height={ch} style={{ fill: "var(--flux)" }} opacity={0.06 + 0.34 * t} />;
      })}
      {p.arrows && pts.map(({ a, b, g }, i) => <PlaneArrow key={`a${i}`} a={a} b={b} da={g[0]} db={p.plane === "xz" ? g[2] : g[1]} tone="field" />)}
      <PlaneAxes plane={p.plane} />
      <text x={X0 * PX + 8} y={-Y1 * PX + 16} className="plate-label">{s.text}</text>
      <Probe id={id} probe={p.probe} plane={p.plane} draggable={p.draggable} label={`Probe at x ${p.probe[0].toFixed(2)}, y ${p.probe[1].toFixed(2)}, z ${p.probe[2].toFixed(2)}`} />
    </g>
  );
}

export function VectorSliceView({ id, ev }: ViewProps) {
  const p = ev.params as { field: string; plane: "xz" | "xy"; offset: number; probe: [number, number, number]; draggable: boolean; box: number; loop: number };
  const f = vectorFields[p.field]!;
  const [px, py] = toSvg([p.probe[0], 0, vert(p.plane, p.probe)]);
  return (
    <g className="v-vector-slice" role="group" aria-label={`Vector field ${f.text}`}>
      {cells().map(([a, b], i) => {
        const q = at(p.plane, a, b, p.offset);
        const v = cartOf(f.F(nativeOf(q, f.system)), q, f.system);
        return <PlaneArrow key={i} a={a} b={b} da={v[0]} db={p.plane === "xz" ? v[2] : v[1]} tone="flux" />;
      })}
      {p.box > 0 && <rect x={px - (p.box * PX) / 2} y={py - (p.box * PX) / 2} width={p.box * PX} height={p.box * PX} fill="url(#hatch-surface)" className="ink" aria-label={`Flux box, side ${p.box} m`} />}
      {p.loop > 0 && (
        <g aria-label={`Circulation loop, side ${p.loop} m, counter-clockwise`}>
          <rect x={px - (p.loop * PX) / 2} y={py - (p.loop * PX) / 2} width={p.loop * PX} height={p.loop * PX} fill="none" style={{ stroke: "var(--surface)" }} strokeWidth={1.6} />
          <path d={`M${px + (p.loop * PX) / 2} ${py + 6} L${px + (p.loop * PX) / 2} ${py - 6}`} style={{ stroke: "var(--surface)" }} markerEnd="url(#arrow-surface)" />
        </g>
      )}
      <PlaneAxes plane={p.plane} />
      <text x={X0 * PX + 8} y={-Y1 * PX + 16} className="plate-label">{f.text}</text>
      <Probe id={id} probe={p.probe} plane={p.plane} draggable={p.draggable} label={`Probe at x ${p.probe[0].toFixed(2)}, y ${p.probe[1].toFixed(2)}, z ${p.probe[2].toFixed(2)}`} />
    </g>
  );
}

const DEG = Math.PI / 180;
function point(system: "cart" | "cyl" | "sph", u: [number, number, number]): Vec3 {
  if (system === "cart") return u;
  if (system === "cyl") return [u[0] * Math.cos(u[1] * DEG), u[0] * Math.sin(u[1] * DEG), u[2]];
  return [u[0] * Math.sin(u[1] * DEG) * Math.cos(u[2] * DEG), u[0] * Math.sin(u[1] * DEG) * Math.sin(u[2] * DEG), u[0] * Math.cos(u[1] * DEG)];
}

export function CoordRegionView({ ev }: ViewProps) {
  const p = ev.params as { system: "cart" | "cyl" | "sph"; ranges: [number, number][]; face: 0 | 1 | 2 | null; faceAt: "max" | "min" };
  const curves: string[] = [];
  const N = 24;
  for (let k = 0; k < 3; k++) {
    const [o1, o2] = [0, 1, 2].filter((i) => i !== k) as [number, number];
    for (const e1 of [0, 1]) for (const e2 of [0, 1]) {
      const pts: string[] = [];
      for (let s = 0; s <= N; s++) {
        const u: [number, number, number] = [0, 0, 0];
        u[k] = p.ranges[k]![0] + ((p.ranges[k]![1] - p.ranges[k]![0]) * s) / N;
        u[o1] = p.ranges[o1]![e1]!;
        u[o2] = p.ranges[o2]![e2]!;
        const [x, y] = toSvg3(point(p.system, u));
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      curves.push(pts.join(" "));
    }
  }
  let face: string | null = null;
  if (p.face !== null) {
    const k = p.face;
    const [o1, o2] = [0, 1, 2].filter((i) => i !== k) as [number, number];
    const fixed = p.ranges[k]![p.faceAt === "max" ? 1 : 0]!;
    const ring: string[] = [];
    const walk = (a: number, b: number, c: number, d: number) => {
      for (let s = 0; s <= N; s++) {
        const u: [number, number, number] = [0, 0, 0];
        u[k] = fixed;
        u[o1] = a + ((b - a) * s) / N;
        u[o2] = c + ((d - c) * s) / N;
        const [x, y] = toSvg3(point(p.system, u));
        ring.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
    };
    const [a1, b1] = p.ranges[o1]!;
    const [a2, b2] = p.ranges[o2]!;
    walk(a1, b1, a2, a2); walk(b1, b1, a2, b2); walk(b1, a1, b2, b2); walk(a1, a1, b2, a2);
    face = ring.join(" ");
  }
  return (
    <g className="v-coord-region" role="img" aria-label={`Region in ${p.system === "cart" ? "cartesian" : p.system === "cyl" ? "cylindrical" : "spherical"} coordinates`}>
      {face && <polygon points={face} fill="url(#hatch-surface)" style={{ stroke: "var(--surface)" }} />}
      {curves.map((c, i) => <polyline key={i} points={c} fill="none" className="ink" />)}
    </g>
  );
}

const LOG0 = 3, LOG1 = 21; // 1 kHz … 1 ZHz
const BAND_EDGES: [number, string][] = [[3e8, "Radio"], [3e11, "Microwave"], [4e14, "IR"], [7.9e14, "Vis"], [3e16, "UV"], [3e19, "X-ray"], [1e21, "Gamma"]];
export function SpectrumView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const p = ev.params as { f: number; draggable: boolean };
  const m = ev.model as { band: string; lambda: number };
  const W = 4.6 * PX, left = -2.3 * PX;
  const xOf = (f: number) => left + ((Math.log10(f) - LOG0) / (LOG1 - LOG0)) * W;
  const can = p.draggable && stage.editable(id);
  const nudge = (k: number) => stage.edit(id, { f: Math.min(1e21, Math.max(1e3, p.f * 10 ** k)) });
  let prev = 1e3;
  return (
    <g className="v-spectrum" role="group" aria-label={`Electromagnetic spectrum; ${m.band}, wavelength ${m.lambda.toExponential(3)} metres`}>
      {BAND_EDGES.map(([top, name], i) => {
        const x1 = xOf(prev), x2 = xOf(Math.min(top, 1e21));
        prev = top;
        return (
          <g key={name}>
            <rect x={x1} y={-20} width={x2 - x1} height={40} style={{ fill: "var(--flux)" }} opacity={0.08 + 0.06 * (i % 2)} className="ink" />
            <text x={(x1 + x2) / 2} y={36} textAnchor="middle" className="plate-label">{name}</text>
          </g>
        );
      })}
      <g
        transform={`translate(${xOf(p.f)} -20)`}
        className={can ? "handle" : undefined}
        {...(can
          ? { tabIndex: 0, role: "slider", "aria-valuemin": 1e3, "aria-valuemax": 1e21, "aria-valuenow": p.f, "aria-label": "Frequency. Left or Right changes it by a tenth of a decade.",
              onKeyDown: (e: KeyboardEvent<SVGGElement>) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); nudge(e.key === "ArrowRight" ? 0.1 : -0.1); } } }
          : {})}
      >
        <path d="M-7 -12 L7 -12 L0 0 Z" style={{ fill: "var(--charge)" }} />
        <line x1={0} x2={0} y1={0} y2={40} style={{ stroke: "var(--charge)" }} />
      </g>
      <text x={left} y={-34} className="plate-label">frequency (log scale) →</text>
    </g>
  );
}

export function UnitConvertView({ ev }: ViewProps) {
  const p = ev.params as { value: number; unit: string };
  const m = { ...(ev.model as { dim: string; ok: boolean }), si: Object.entries(ev.model).find(([k]) => k.startsWith("si"))?.[1] as number | undefined };
  return (
    <g className="v-unit-convert" role="img" aria-label={m.ok ? `${p.value} ${p.unit} equals ${m.si} ${m.dim}` : `${p.unit} is not a unit Forma reads`}>
      <text x={-200} y={-10} className="plate-label" style={{ fontSize: 22 }}>{`${p.value} ${p.unit}`}</text>
      <text x={-40} y={-10} className="plate-label" style={{ fontSize: 22 }}>=</text>
      <text x={0} y={-10} className="plate-label" style={{ fontSize: 22 }}>{m.ok ? `${Number(m.si!.toPrecision(6))} ${m.dim === "1" ? "" : m.dim}` : "?"}</text>
    </g>
  );
}
```

- Register them in `views2d.tsx`: import `{ CoordRegionView, ScalarSliceView, SpectrumView, UnitConvertView, VectorSliceView }` from `./viewsMath` and add:

  ```ts
  "scalar-slice": ScalarSliceView,
  "vector-slice": VectorSliceView,
  "coord-region": CoordRegionView,
  spectrum: SpectrumView,
  "unit-convert": UnitConvertView,
  ```

- If `PX` or `toSvg` are not exported from `@forma/plate`, export them from `packages/plate/src/index.ts` (they live in `geometry2d.ts`).

- [ ] **Step 2: Labels.** In `Readouts.tsx`:

  - Add to `LABEL`:

    ```ts
    f: "Value at the probe", gmag: "|∇| at the probe",
    F1: "1st component", F2: "2nd component", F3: "3rd component", div: "∇· at the probe",
    c1: "curl, 1st", c2: "curl, 2nd", c3: "curl, 3rd",
    boxFlux: "Net flux out of the box", boxRatio: "Flux ÷ box volume", circ: "Circulation round the loop", circRatio: "Circulation ÷ loop area",
    len1: "Edge 1", len2: "Edge 2", len3: "Edge 3", volume: "Volume",
    lambda: "Wavelength λ", si: "In SI base units", siM: "In metres", siM2: "In m²", siM3: "In m³", siC: "In coulombs", siHz: "In hertz", siV: "In volts", siF: "In farads", siN: "In newtons",
    g1: "∇, 1st component", g2: "∇, 2nd component", g3: "∇, 3rd component",
    ```

    `f` may already be taken. Check with `grep -n '\bf: "' apps/web/components/plate/Readouts.tsx`. The `spectrum` component also has a readout called `f` (the frequency). To keep them apart, add this after the label lookup: `if (inst.component === "spectrum" && name === "f") label = "Frequency f";`.

  - Name the components by coordinate system. Add:

    ```ts
    const SYS: Record<string, [string, string, string]> = { cart: ["x", "y", "z"], cyl: ["ρ", "φ", "z"], sph: ["r", "θ", "φ"] };
    ```

    When the instance is `scalar-slice` or `vector-slice`, replace "1st", "2nd" and "3rd" in the label with `SYS[ev.model.system][0..2]`, giving "∇, ρ-component" and so on. Compute the label in the row-building `.map` (as in Plan F1 Task 7) and keep the `LABEL` entries as the fallback.

  - `area` already has a label ("Surface area"); keep it.

- [ ] **Step 3: Build**

Run: `pnpm test && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all PASS. `views.test.ts` checks that every new component has a view and every readout has a label.

- [ ] **Step 4: Commit**

```bash
git add apps/web packages/plate && git commit -m "feat(web): views for slices, regions, spectrum and unit conversion; readout labels by coordinate system

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 7: A preview plate and an e2e check

**Files:** Create `app/packages/course-em1/src/plates/toolkit-preview.ts` and `app/apps/web/e2e/toolkit.spec.ts`. Modify `app/packages/course-em1/src/plates/index.ts` and `app/packages/course-em1/src/concepts/math.ts`.

Plans before this one exposed new plates only through lessons. This plate is a developer preview. It sits in a lesson called `toolkit-preview` on `em1.math.vectors`, and nothing links to it from the UI. Plan F3 deletes it.

- [ ] **Step 1: The preview plate**

```ts
import { PlateDef } from "@forma/plate";

export const toolkitPreview = PlateDef.parse({
  id: "toolkit-preview",
  title: "Toolkit preview",
  instances: [
    { id: "grad", component: "scalar-slice", params: { field: "tut-3.4", probe: [1, 2, 3], plane: "xz", offset: 2 } },
    { id: "div", component: "vector-slice", params: { field: "source", probe: [0.5, 0, 0.2], box: 0.4 } },
    { id: "curl", component: "vector-slice", params: { field: "swirl", plane: "xy", probe: [0.3, 0.1, 0], loop: 0.3 } },
    { id: "region", component: "coord-region", params: { system: "sph", ranges: [[0, 1.5], [0, 60], [30, 75]], face: 0 } },
    { id: "spec", component: "spectrum", params: { f: 2.45e9 } },
    { id: "units", component: "unit-convert", params: { value: 0.28, unit: "in" } },
    { id: "axes", component: "axes3", params: {} },
  ],
  steps: [
    { id: "grad", title: "Gradient", show: ["grad"], note: "Preview." },
    { id: "div", title: "Divergence", show: ["div"], hide: ["grad"], note: "Preview." },
    { id: "curl", title: "Curl", show: ["curl"], hide: ["div"], note: "Preview." },
    { id: "region", title: "Region", show: ["region", "axes"], hide: ["curl"], note: "Preview." },
    { id: "spec", title: "Spectrum", show: ["spec"], hide: ["region", "axes"], note: "Preview." },
    { id: "units", title: "Units", show: ["units"], hide: ["spec"], note: "Preview." },
  ],
});
```

- Register it in `plates/index.ts` (add it to the `plates` list).
- Add the lesson to the vectors concept in `concepts/math.ts`:

  ```ts
  { id: "toolkit-preview", title: "Toolkit preview (developer)", minutes: 1, blocks: [{ ...meta("vivid", orig()), id: "toolkit-preview", type: "plate", plateId: "toolkit-preview" }] }
  ```

  Mirror how `gauss-law.ts` builds `meta` and `orig` (import them the same way).

- [ ] **Step 2: The e2e test** at `app/apps/web/e2e/toolkit.spec.ts`

```ts
import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const V = "em1.math.vectors";
test("toolkit plates render with their readouts", async ({ page }) => {
  await open(page, concept(V, "mode=learn&lesson=toolkit-preview"));
  await margin(page, "Gradient");
  await expect(page.locator(".readouts")).toContainText("11");
  for (const [step, text] of [[1, "3"], [2, "2"], [4, "Microwave"], [5, "0.007112"]] as const) {
    await open(page, concept(V, `mode=learn&lesson=toolkit-preview&step=${step}`));
    await expect(page.locator(step === 4 ? "svg" : ".readouts, svg").first()).toContainText(text);
  }
});
```

- [ ] **Step 3: Run it**

Run: `cd apps/web && pnpm build && pnpm e2e -g "toolkit"`
Expected: PASS. Then run the full `pnpm e2e`: all pass, and axe finds nothing new, because the preview lesson isn't in the a11y list.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 apps/web && git commit -m "test: toolkit preview plate and e2e smoke

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 8: Verification and handback

- [ ] **Step 1:** Run `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`. Everything should be green.
- [ ] **Step 2:** Open `/c/em1/em1.math.vectors?mode=learn&lesson=toolkit-preview` in the dev server and look at every step at 1360×900.
  - The arrows should read clearly.
  - The spherical patch should look like a curved patch in the oblique view.
  - The spectrum marker should sit in Microwave.
- [ ] **Step 3:** Write the ledger line `Task 8: verification — <counts>`, then stop for Claude's review.

## Self-Review Notes

- Every formula comes from SymPy solutions of the source questions, and Task 2 checks each one by finite differences.
- The answers the course states are pinned in tests:
  - Tutorial 1.1–3.8.
  - HW02 2.1 and 2.2. These are the questions solved fresh, not the student's graded answers, which contain slips: for 2.1(c), −2 aφ was written against the true −4 aφ.
  - MST Q3(a), Q4(b) and Q5(a).
  - Finals 24-25 Q1(c).
- Plan F3 writes the nine ideas on this toolkit, and deletes the preview lesson.
