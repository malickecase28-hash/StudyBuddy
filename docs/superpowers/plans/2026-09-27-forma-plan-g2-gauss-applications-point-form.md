# Forma Plan G2: Gauss Applications and the Point Form at Full Depth

> **For agentic workers (Codex):** read `AGENTS.md` first. **Plans F1–F4 and G1 must be complete.** Transcribe the content exactly. Every value was solved with SymPy from the source questions, not from student work.

**Goal:** five in-depth ideas.
- `em1.electrostatics.gauss-applications`:
  - ① Charge from a density (ρL, ρS, ρv in all three systems)
  - ② Flux through part of a surface
  - ③ Spheres of charge: D and Q inside and outside
- `em1.electrostatics.divergence`:
  - ④ ∇·D = ρv, point by point
  - ⑤ The divergence theorem with D

**New plate support:**
- A uniform **ball** charge (`charges` item kind `"ball"`).
- A **density library** (`@forma/physics/src/densities.ts`), plus `coord-region` params `density` (total charge Q, in C) and `centralCharge` (the flux through a face from a charge at the origin, in µC).
- D readouts (µC/m²) on `e-probe`.
- Two new vector fields: `hw-2.6` and `f2324-2b`.

**Sources (catalog ids):** `hw02-2324` (2.5, 2.6, reissued as HW01 2024-25 1.4), `mst2324` (Q3(a), Q4(b)), `f2324` (Q2(b)), and `tut-vec` Q.06/Q.08 (the existing tutorial items `tutorial:q06` and `tutorial:q08`).

**Ledger:** `.superpowers/sdd/2026-09-27-forma-plan-g2-gauss-applications-point-form/progress.md`

## Global Constraints

These are the same as Plans F3 and G1. The lint does not read charge-density units such as C/m³, µC/m³ or mC/m. Values in those units are backed by claims on `Q`, or by givens. Charge totals in µC and nC are linted, so they are backed by the `Q` readout (in C, converted by the lint) or by `patchFlux` (µC).

## Review Focus

1. **Jacobian in the density integrals.** `totalCharge` multiplies by the scale factors: ρ in cylindrical coordinates; r and r sin θ in spherical. Tested with HW02 2.5(c), where ρv = 3.05/(r sin θ) must give 829.69 C. That value appears only if the r² sin θ Jacobian is present.
2. **Patch flux.** The flux through a spherical patch from a central charge is independent of r. The flux through one face of a centred cube is Q/6, computed numerically. Tested in Task 1.
3. **The ball inside a Gaussian sphere.** A concentric sphere of radius r < a encloses ρv·(4/3)πr³. When the enclosure is partial and not concentric, the code throws rather than guessing. Tested in Task 1.
4. **The sign of ρv outside in Finals 23-24 Q2(b).** E = 6π/r³ gives a negative ρv = −2.670 × 10⁻¹³ C/m³ at r = 5 m. The course states it plainly rather than "fixing" it. Tested by a claim in Task 5.
5. **Divergence theorem on the plate.** For `hw-2.6`, the box flux of the cube centred at (1, 1, 1) with side 2 is exactly 24. Tested by a claim in Task 6.

---

### Task 1: Physics and plate support

**Files:**
- Modify: `app/packages/physics/src/charges.ts`, `app/packages/physics/src/flux.ts`, `app/packages/physics/src/fields.ts`, `app/packages/physics/src/index.ts`
- Create: `app/packages/physics/src/densities.ts`, `app/packages/physics/test/g2.test.ts`
- Modify: `app/packages/plate/src/components/em.ts` (ball item; e-probe D), `app/packages/plate/src/components/math.ts` (coord-region density and centralCharge)
- Modify: `app/apps/web/components/plate/views2d.tsx` (ball drawing), `Readouts.tsx` (labels)
- Test: `app/packages/plate/test/em-g2.test.ts`

- [ ] **Step 1: Write the failing tests.** `app/packages/physics/test/g2.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { densities, electricField, enclosedCharge, totalCharge, vectorFields } from "../src";

const EPS0 = 8.8541878128e-12;
const D2R = Math.PI / 180;

describe("densities", () => {
  it("HW02 2.5(a): ρL = 12x² mC/m on 1 < x < 5 m gives 496 mC", () => {
    expect(totalCharge(densities["hw-2.5a"]!, [[1, 5], [0, 0], [0, 0]])).toBeCloseTo(0.496, 12);
  });
  it("HW02 2.5(b): ρS = πρz² pC/m² on ρ = 4 m, 0 < z < 7 m gives 36.11 nC", () => {
    expect(totalCharge(densities["hw-2.5b"]!, [[4, 4], [0, 2 * Math.PI], [0, 7]])).toBeCloseTo(3.610959e-8, 13);
  });
  it("HW02 2.5(c): ρv = 3.05/(r sin θ) C/m³ within r = 5.25 m gives 829.69 C (needs the r² sin θ Jacobian)", () => {
    expect(totalCharge(densities["hw-2.5c"]!, [[0, 5.25], [0, Math.PI], [0, 2 * Math.PI]])).toBeCloseTo(829.6945, 3);
  });
  it("MST Q4(b): ρv = ρ² sin φ µC/m³ over the half-cylinder gives 1.6 nC", () => {
    expect(totalCharge(densities["mst-4b"]!, [[0, 0.2], [0, Math.PI], [-4, -2]])).toBeCloseTo(1.6e-9, 16);
  });
  it("HW02 2.6: ρv = 3y C/m³ in 0 < x, y, z < 2 gives 24 C", () => {
    expect(totalCharge(densities["hw-2.6"]!, [[0, 2], [0, 2], [0, 2]])).toBeCloseTo(24, 10);
  });
});

describe("ball charge", () => {
  const ball = { kind: "ball" as const, rhoV: 3e-6, radius: 1, center: [0, 0, 0] as [number, number, number] };
  it("E inside grows linearly; outside it falls as 1/r²", () => {
    expect(electricField([ball], [0.5, 0, 0])[0] * EPS0 * 1e6).toBeCloseTo(0.5, 10);
    expect(electricField([ball], [1.5, 0, 0])[0] * EPS0 * 1e6).toBeCloseTo(4 / 9, 10);
  });
  it("a concentric sphere encloses ρv(4/3)π min(r, a)³", () => {
    expect(enclosedCharge([ball], { kind: "sphere", center: [0, 0, 0], radius: 0.5 })).toBeCloseTo(3e-6 * (Math.PI / 6), 18);
    expect(enclosedCharge([ball], { kind: "sphere", center: [0, 0, 0], radius: 2 })).toBeCloseTo(3e-6 * (4 * Math.PI) / 3, 18);
  });
  it("refuses a partial, off-centre enclosure", () => {
    expect(() => enclosedCharge([ball], { kind: "sphere", center: [0.8, 0, 0], radius: 0.5 })).toThrow();
  });
});

describe("new vector fields", () => {
  it("HW02 2.6: ∇·D = 3y", () => {
    expect(vectorFields["hw-2.6"]!.div([1, 2, 0.5])).toBe(6);
  });
  it("Finals 23-24 Q2(b): ε₀∇·E = 8πε₀ at r = 2 and −6πε₀/625 at r = 5", () => {
    expect(EPS0 * vectorFields["f2324-2b"]!.div([2, 1, 1])).toBeCloseTo(2.2253e-10, 13);
    expect(EPS0 * vectorFields["f2324-2b"]!.div([5, 1, 1])).toBeCloseTo(-2.67036e-13, 17);
  });
});
```

`app/packages/plate/test/em-g2.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const one = (component: string, params: Record<string, unknown>, extra: unknown[] = []) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances: [...extra, { id: "a", component, params, visible: true, ...(component === "e-probe" ? { links: { charges: "q" } } : {}) }], steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0)).a!.model as Record<string, number>;
};

describe("coord-region density and central charge", () => {
  it("reports Q in coulombs for HW02 2.5(c)", () => {
    expect(one("coord-region", { system: "sph", ranges: [[0, 5.25], [0, 180], [0, 360]], density: "hw-2.5c" }).Q).toBeCloseTo(829.6945, 3);
  });
  it("MST Q3(a): the flux through the patch from a central 100 µC is 1.0417 µC, at any radius", () => {
    expect(one("coord-region", { system: "sph", ranges: [[0, 0.25], [0, 60], [30, 45]], face: 0, centralCharge: 100 }).patchFlux).toBeCloseTo(1.041667, 5);
    expect(one("coord-region", { system: "sph", ranges: [[0, 3], [0, 60], [30, 45]], face: 0, centralCharge: 100 }).patchFlux).toBeCloseTo(1.041667, 5);
  });
  it("one face of a cube centred on the charge carries Q/6", () => {
    expect(one("coord-region", { system: "cart", ranges: [[-1, 1], [-1, 1], [-1, 1]], face: 2, centralCharge: 12 }).patchFlux).toBeCloseTo(2, 6);
  });
});

describe("ball and D readouts", () => {
  it("e-probe reports D in µC/m² inside a uniform ball", () => {
    const m = one("e-probe", { point: [0.5, 0, 0] }, [{ id: "q", component: "charges", params: { items: [{ id: "b", kind: "ball", rhoV: 3, radius: 1, center: [0, 0, 0] }] }, visible: true }]);
    expect(m.Dmag).toBeCloseTo(0.5, 10);
  });
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `pnpm vitest run packages/physics/test/g2.test.ts packages/plate/test/em-g2.test.ts`
Expected: FAIL (`densities` is not exported; the ball is unknown).

- [ ] **Step 3: Implement physics.**

In `charges.ts`:
- Add `export type BallCharge = { kind: "ball"; rhoV: number; radius: number; center: Vec3 };` (rhoV in C/m³) and put it in the `Charge` union.
- In `fieldOf`, handle the ball first:

```ts
  if (c.kind === "ball") {
    const r = sub(p, c.center);
    const d = norm(r);
    if (d < c.radius) return scale(r, c.rhoV / (3 * EPS0));
    const Q = (c.rhoV * 4 * Math.PI * c.radius ** 3) / 3;
    return scale(r, (K_E * Q) / (d * d * d));
  }
```

In `flux.ts`, in `enclosedCharge`, before the line branch:

```ts
    if (c.kind === "ball") {
      if (shape.kind === "sphere" && norm(sub(shape.center, c.center)) < 1e-12) return s + (c.rhoV * 4 * Math.PI * Math.min(shape.radius, c.radius) ** 3) / 3;
      const probes: Vec3[] = [c.center, ...([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] as Vec3[]).map((u) => add(c.center, scale(u, c.radius)))];
      const inside = probes.map((q) => contains(shape, q));
      if (inside.every(Boolean)) return s + (c.rhoV * 4 * Math.PI * c.radius ** 3) / 3;
      if (!inside.some(Boolean)) return s;
      throw new Error("enclosedCharge: a ball partly inside a non-concentric surface is not supported");
    }
```

Import `add`, `scale`, `sub` and `norm` from `./vec` if they aren't imported already. The six-probe test is a deliberate simplification: it covers the plates this course uses (the ball either well inside or well outside). Add this comment above it: `// ponytail: six-point containment test; exact intersection volume if a plate ever needs a straddling ball.`

Create `densities.ts`:

```ts
import { gaussLegendre } from "./quadrature";
import type { CoordSystem } from "./coords";
import type { Native } from "./fields";

export type Density = {
  id: string; text: string; system: CoordSystem;
  kind: "line" | "surface" | "volume";
  /** line: the coordinate that varies; surface: the coordinate held fixed (at its range's upper end). */
  axis: 0 | 1 | 2;
  /** Multiply the formula's value by this to get SI (C/m, C/m², C/m³). */
  scale: number;
  f: (n: Native) => number;
};

const { sin } = Math;
export const densities: Record<string, Density> = {
  "demo-line": { id: "demo-line", text: "ρL = 3x µC/m", system: "cart", kind: "line", axis: 0, scale: 1e-6, f: ([x]) => 3 * x },
  "demo-sphere": { id: "demo-sphere", text: "ρS = 2 µC/m²", system: "sph", kind: "surface", axis: 0, scale: 1e-6, f: () => 2 },
  "demo-cyl": { id: "demo-cyl", text: "ρv = ρ µC/m³", system: "cyl", kind: "volume", axis: 0, scale: 1e-6, f: ([r]) => r },
  "hw-2.5a": { id: "hw-2.5a", text: "ρL = 12x² mC/m", system: "cart", kind: "line", axis: 0, scale: 1e-3, f: ([x]) => 12 * x * x },
  "hw-2.5b": { id: "hw-2.5b", text: "ρS = πρz² pC/m²", system: "cyl", kind: "surface", axis: 0, scale: 1e-12, f: ([r, , z]) => Math.PI * r * z * z },
  "hw-2.5c": { id: "hw-2.5c", text: "ρv = 3.05/(r sin θ) C/m³", system: "sph", kind: "volume", axis: 0, scale: 1, f: ([r, t]) => 3.05 / (r * sin(t)) },
  "mst-4b": { id: "mst-4b", text: "ρv = ρ² sin φ µC/m³", system: "cyl", kind: "volume", axis: 0, scale: 1e-6, f: ([r, p]) => r * r * sin(p) },
  "hw-2.6": { id: "hw-2.6", text: "ρv = 3y C/m³", system: "cart", kind: "volume", axis: 0, scale: 1, f: ([, y]) => 3 * y },
};

const H: Record<CoordSystem, (n: Native) => Native> = {
  cart: () => [1, 1, 1],
  cyl: ([r]) => [1, r, 1],
  sph: ([r, t]) => [1, r, r * sin(t)],
};

/** Total charge (C) of a density over native ranges (angles in radians), by Gauss–Legendre quadrature with the scale factors. */
export function totalCharge(d: Density, ranges: [number, number][], n = 16): number {
  const { nodes, weights } = gaussLegendre(n);
  const free = d.kind === "volume" ? [0, 1, 2] : d.kind === "line" ? [d.axis] : [0, 1, 2].filter((k) => k !== d.axis);
  const at = (k: number) => (d.kind === "surface" && k === d.axis ? ranges[k]![1] : ranges[k]![0]);
  let sum = 0;
  const walk = (i: number, u: Native, w: number) => {
    if (i === free.length) {
      const h = H[d.system](u);
      const jac = free.reduce((j, k) => j * h[k]!, 1);
      sum += w * jac * d.f(u);
      return;
    }
    const k = free[i]!;
    const [a, b] = ranges[k]!;
    const half = (b - a) / 2, mid = (a + b) / 2;
    for (let m = 0; m < n; m++) {
      const v = [...u] as Native;
      v[k] = mid + half * nodes[m]!;
      walk(i + 1, v, w * weights[m]! * half);
    }
  };
  walk(0, [at(0), at(1), at(2)], 1);
  return sum * d.scale;
}
```

Export it from `index.ts`: `export * from "./densities";`.

In `fields.ts`, add to `vectorFields`:

```ts
  "hw-2.6": V({ id: "hw-2.6", text: "D = 3xy ax + x² ay", latex: String.raw`\mathbf D=3xy\,\mathbf a_x+x^2\,\mathbf a_y`, system: "cart",
    F: ([x, y]) => [3 * x * y, x * x, 0], div: ([, y]) => 3 * y, curl: ([x]) => [0, 0, -x] }),
  "f2324-2b": V({ id: "f2324-2b", text: "E = πr² (r ≤ 3 m), 6π/r³ (r > 3 m), radial", latex: String.raw`\mathbf E=\begin{cases}\pi r^2\,\mathbf a_r & r\le3\\ \tfrac{6\pi}{r^3}\,\mathbf a_r & r>3\end{cases}`, system: "sph",
    F: ([r]) => [r <= 3 ? Math.PI * r * r : (6 * Math.PI) / r ** 3, 0, 0], div: ([r]) => (r <= 3 ? 4 * Math.PI * r : (-6 * Math.PI) / r ** 4), curl: () => [0, 0, 0] }),
```

The F2 finite-difference test now also checks these two fields at its three points. All three lie inside r ≤ 3, where the formulas are smooth.

- [ ] **Step 4: Implement the plate changes.**

In `em.ts`:
- Add a ball variant to `ChargeItem`: `z.object({ id: z.string(), kind: z.literal("ball"), rhoV: z.number(), radius: z.number().positive(), center: V3 })`. Here rhoV is in µC/m³.
- Map it to SI in `toSI`: `{ kind: "ball", rhoV: it.rhoV * 1e-6, radius: it.radius, center: it.center as Vec3 }`.
- In `nearCharge`, a ball is never singular: `c.kind === "ball" ? false : …`.
- In `e-probe`'s model, add D in µC/m²: `Dx: E[0] * EPS0 * 1e6, …, Dmag: norm(E) * EPS0 * 1e6`. Use null in the on-charge branch. Import `EPS0` from `@forma/physics`.
- Add `readouts` and `quotable`: `Dx: "µC/m^2", Dy: "µC/m^2", Dz: "µC/m^2", Dmag: "µC/m^2"`.

In `math.ts` `CoordRegion`:
- Add the params `density: z.string().nullable().default(null)` and `centralCharge: z.number().nullable().default(null)` (µC at the origin).
- At the end of the model, build the native ranges in radians. The angle indices are cyl index 1, and sph indices 1 and 2.
- If `density` is set, add `Q: totalCharge(densities[density], nativeRanges)`. For a surface density, `axis` names the fixed coordinate, taken at its upper range value.
- If `centralCharge` is set and `face !== null`, add `patchFlux` in µC. Compute it by integrating D·n̂ over the face with 16 × 16 Gauss–Legendre points: D = q r̂/(4π|r|²), where q = `centralCharge`. The sum is ∑ w · (D·n̂) · hᵢhⱼ over the two free coordinates. n̂ is `unitVectors(p, system)[face]`, times −1 when `faceAt` is `"min"`. p is the cartesian point from `point(system, native)`.
- Add `readouts`: `Q: "C"`, `patchFlux: "µC"`. Add both to `quotable`.

Two checks by hand:
- MST Q3(a): (1 − cos 60°)(π/12)/(4π) × 100 = 1.041667 µC.
- The cube face: 12/6 = 2.

Views:
- `ChargesView` draws a ball as a circle at `place(center)` of radius `radius × k × 100`, filled with `url(#hatch-charge)` and outlined with `var(--charge)`. Its label is `ρv ${rhoV} µC/m³` and its `aria-label` is "Uniform ball of charge".
- `Readouts.tsx`:
  - `LABEL`: `Q: "Total charge Q", patchFlux: "Ψ through the face", Dx: "Dₓ", Dy: "Dᵧ", Dz: "D_z", Dmag: "|D|"`.
  - `TONE`: `Q: "charge", patchFlux: "flux", Dmag: "flux"`.

- [ ] **Step 5: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages apps/web && git commit -m "feat: ball charges, density library with exact Jacobians, patch flux, D readouts, fields for HW02 2.6 and Finals 23-24 Q2(b)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: Templates

**Files:** Modify `templates.ts`. Test: `app/packages/course-em1/test/templates-g2.test.ts`.

- [ ] **Step 1: Write the failing test.** Use the G1 template-test shape for the ids `["charge-line-poly", "flux-patch", "ball-d", "rhov-from-d"]`, with 50 seeds each, finite answers, worked lines, and every distractor differing from the answer by more than 1e-6 relative. Plus:

```ts
it("charge-line-poly reproduces HW02 2.5(a): a = 12 on 1..5 gives 496 mC", () => {
  expect(templates.find((x) => x.id === "charge-line-poly")!.solve({ a: 12, x1: 1, x2: 5 } as never).answer.value).toBe(496);
});
it("ball-d inside and outside", () => {
  const t = templates.find((x) => x.id === "ball-d")!;
  expect(t.solve({ rv: 3, a: 10, r: 5 } as never).answer.value).toBeCloseTo(0.5, 10);
  expect(t.solve({ rv: 3, a: 10, r: 15 } as never).answer.value).toBeCloseTo(0.444444, 5);
});
```

- [ ] **Step 2: Run it** and see it FAIL.

- [ ] **Step 3: Implement.**

```ts
const chargeLinePoly = defineTemplate<{ a: number; x1: number; x2: number }>({
  id: "charge-line-poly",
  params: { a: { min: 3, max: 15, step: 3 }, x1: { min: 0, max: 2, step: 1 }, x2: { min: 3, max: 6, step: 1 } },
  prompt: (p) => `A line charge on ${p.x1} < x < ${p.x2} m has density ρL = ${p.a}x² mC/m. Find the total charge.`,
  solve: (p) => {
    const Q = (p.a * (p.x2 ** 3 - p.x1 ** 3)) / 3;
    return {
      answer: { value: sig(Q, 6), unit: "mC" },
      distractors: [{ value: sig(p.a * (p.x2 ** 3 - p.x1 ** 3), 6), unit: "mC", errorClass: "arithmetic", feedback: "∫x² dx = x³/3: don't forget the 3." }],
    };
  },
  hints: () => ["Q = ∫ρL dl, and on the x-axis dl = dx.", "∫ax² dx = a x³/3.", "Upper limit minus lower limit."],
  worked: (p) => [{ text: `Q = ∫ ${p.a}x² dx = ${p.a}[x³/3] from ${p.x1} to ${p.x2} = ${sig((p.a * (p.x2 ** 3 - p.x1 ** 3)) / 3, 6)} mC.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.gauss-applications"], misconceptions: [], difficulty: 1 },
});

const TH = [30, 45, 60, 90];
const fluxPatch = defineTemplate<{ q: number; t: number; dp: number; rc: number }>({
  id: "flux-patch",
  params: { q: { min: 10, max: 90, step: 10 }, t: { min: 0, max: 3, step: 1 }, dp: { min: 15, max: 90, step: 15 }, rc: { min: 10, max: 50, step: 10 } },
  prompt: (p) => `A ${p.q} µC point charge is at the origin. Find the flux through the part of the sphere r = ${p.rc} cm with 0 < θ < ${TH[p.t]}° and 0 < φ < ${p.dp}°.`,
  solve: (p) => {
    const frac = ((1 - Math.cos(TH[p.t]! * DEG)) * p.dp * DEG) / (4 * Math.PI);
    const r = p.rc / 100;
    return {
      answer: { value: sig(p.q * frac), unit: "µC" },
      distractors: [{ value: sig(p.q * frac * 4 * Math.PI * r * r), unit: "µC", errorClass: "conceptual", tag: "FLUX_PATCH_AREA", feedback: "That multiplies Q by the patch's area. The flux is Q times the patch's share of the whole sphere: area ÷ 4πr²." }],
    };
  },
  hints: () => ["The charge is at the centre: flux spreads evenly over the sphere.", "Share = patch area ÷ 4πr² = (1 − cos θ₂)Δφ / 4π.", "The radius cancels."],
  worked: (p) => {
    const frac = ((1 - Math.cos(TH[p.t]! * DEG)) * p.dp * DEG) / (4 * Math.PI);
    return [
      { text: `Share = (1 − cos ${TH[p.t]}°)(${p.dp}° in radians)/(4π) = ${sig(frac, 5)}.` },
      { text: `Ψ = ${p.q} µC × ${sig(frac, 5)} = ${sig(p.q * frac)} µC; the radius doesn't matter.` },
    ];
  },
  dimension: "application",
  tags: { concepts: ["em1.electrostatics.gauss-applications"], misconceptions: ["FLUX_PATCH_AREA"], difficulty: 2 },
});

const ballD = defineTemplate<{ rv: number; a: number; r: number }>({
  id: "ball-d",
  params: { rv: { min: 1, max: 9, step: 1 }, a: { min: 10, max: 20, step: 5 }, r: { min: 5, max: 30, step: 5 } },
  prompt: (p) => `A ball of radius ${p.a / 10} m carries a uniform ρv = ${p.rv} µC/m³. Find |D| at r = ${p.r / 10} m from its centre.`,
  solve: (p) => {
    const a = p.a / 10, r = p.r / 10;
    const inside = (p.rv * r) / 3;
    const outside = (p.rv * a ** 3) / (3 * r * r);
    const ans = r < a ? inside : outside;
    const wrong = r < a ? outside : inside;
    return {
      answer: { value: sig(ans, 6), unit: "µC/m^2" },
      distractors: Math.abs(wrong - ans) > 1e-9 ? [{ value: sig(wrong, 6), unit: "µC/m^2", errorClass: "conceptual", tag: "BALL_INSIDE_OUTSIDE", feedback: r < a ? "Inside the ball only the charge within r counts: D = ρv r / 3." : "Outside, the whole ball counts: D = ρv a³ / (3r²)." }] : [],
    };
  },
  hints: () => ["Gaussian sphere of radius r: D × 4πr² = Q_enc.", "Inside: Q_enc = ρv (4/3)πr³. Outside: ρv (4/3)πa³.", "Is r inside or outside the ball?"],
  worked: (p) => {
    const a = p.a / 10, r = p.r / 10;
    return r < a
      ? [{ text: `r < a, so Q_enc = ρv(4/3)πr³ and D = ρv r/3 = ${p.rv} × ${r}/3 = ${sig((p.rv * r) / 3, 6)} µC/m².` }]
      : [{ text: `r ≥ a, so Q_enc = ρv(4/3)πa³ and D = ρv a³/(3r²) = ${p.rv} × ${a}³/(3 × ${r}²) = ${sig((p.rv * a ** 3) / (3 * r * r), 6)} µC/m².` }];
  },
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.gauss-applications"], misconceptions: ["BALL_INSIDE_OUTSIDE"], difficulty: 2 },
});

const rhovFromD = defineTemplate<{ a: number; b: number; x0: number; y0: number }>({
  id: "rhov-from-d",
  params: { a: { min: 1, max: 6, step: 1 }, b: { min: 1, max: 6, step: 1 }, x0: { min: 1, max: 4, step: 1 }, y0: { min: 1, max: 4, step: 1 } },
  prompt: (p) => `D = ${p.a}xy ax + ${p.b}x² ay C/m². Find ρv at (${p.x0}, ${p.y0}, 1).`,
  solve: (p) => ({
    answer: { value: p.a * p.y0, unit: "C/m^3" },
    distractors: [{ value: p.a * p.y0 + 2 * p.b * p.x0, unit: "C/m^3", errorClass: "conceptual", feedback: "∂D_y/∂y, not ∂D_y/∂x: bx² doesn't depend on y, so it contributes nothing." }],
  }),
  hints: () => ["ρv = ∇·D.", "∂(axy)/∂x = ay; ∂(bx²)/∂y = 0.", "Substitute y."],
  worked: (p) => [{ text: `∇·D = ∂(${p.a}xy)/∂x + ∂(${p.b}x²)/∂y = ${p.a}y + 0, so ρv = ${p.a} × ${p.y0} = ${p.a * p.y0} C/m³.` }],
  dimension: "computational",
  tags: { concepts: ["em1.electrostatics.divergence"], misconceptions: [], difficulty: 1 },
});
```

Append the four to `templates`. Run the tests; expected PASS. Commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): templates for line-charge totals, patch flux, ball D and ρv from D

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: The Gauss applications concept, and Idea ① (charge from a density)

**Files:** Modify `concepts/gauss-applications.ts` and `plates/index.ts`. Create `plates/idea-charge-density.ts`.

- [ ] **Step 1: The concept.**
  - `objectives`:

    ```ts
    [
      "Find total charge from ρL, ρS and ρv by integration in all three coordinate systems.",
      "Find the flux through part of a closed surface from its share of the whole.",
      "Use Gauss's law to find D and Q for spherical charge distributions, inside and outside.",
    ]
    ```

  - Add these misconceptions to the existing list:

    ```ts
    { tag: "DENSITY_NO_JACOBIAN", description: "Integrates a density without the scale factors (ρ, r², r² sin θ).", remediation: "em1.electrostatics.gauss-applications/main" },
    { tag: "FLUX_PATCH_AREA", description: "Multiplies Q by a patch's area instead of its share of the whole surface.", remediation: "em1.electrostatics.gauss-applications/main" },
    { tag: "BALL_INSIDE_OUTSIDE", description: "Uses the whole charge inside a ball, or only part of it outside.", remediation: "em1.electrostatics.gauss-applications/main" },
    ```

  - Prepend a new `main` lesson ("Gauss's law in use (in depth)", minutes 70) with the three idea blocks: `idea-charge-density` (this task), `idea-patch-flux` and `idea-spheres` (Task 4). Keep the existing lessons (`worked`, `past-paper`, and the rest).

- [ ] **Step 2: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const clp = instantiate(templates.find((t) => t.id === "charge-line-poly")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaChargeDensity = defineIdeaPlate({
  id: "idea-charge-density",
  title: "Charge from a density",
  requires: { objectives: [0], items: ["hw-2324-2.5", "mst-2324-q4b"], misconceptions: ["DENSITY_NO_JACOBIAN"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.6 } },
    { id: "region", component: "coord-region", params: { system: "cart", ranges: [[0, 2], [0, 0.05], [0, 0.05]], density: "demo-line" } },
    { id: "eq", component: "equation", params: eqp(R`Q=\int_L\rho_L\,dl`, "Q equals the integral of rho L along the line") },
  ],
  ideas: [
    {
      id: "charge-density",
      title: "Charge from a density",
      objectives: [0],
      explain: [
        {
          id: "line", title: "Along a line: Q = ∫ρL dl", show: ["axes", "region", "eq"], focus: ["region", "eq"],
          note: "When charge is spread out, a density tells you how much sits in each small piece: ρL per metre of line, ρS per square metre of surface, ρv per cubic metre of volume. The total is the sum of the pieces, which is an integral. On the plate, a line from x = 0 to 2 m carries ρL = 3x µC/m, heavier toward the far end. Q = ∫₀² 3x dx = 6 µC.",
          claims: [{ instance: "region", readout: "Q", value: 6e-6, unit: "C" }],
        },
        {
          id: "surface", title: "Over a surface: Q = ∫ρS dS", patch: { region: { system: "sph", ranges: [[0, 1], [0, 180], [0, 360]], face: 0, density: "demo-sphere" }, eq: eqp(R`Q=\int_S\rho_S\,dS,\qquad dS=r^2\sin\theta\,d\theta\,d\phi`, "Q equals the integral of rho S dS") }, focus: ["region", "eq"],
          note: "For a surface, use the dS you built in the vectors lesson. A sphere of radius 1 m carrying a uniform ρS = 2 µC/m² holds Q = ρS × 4πr² = 25.13 µC. With a uniform density, the integral is just density × area. When the density varies over the surface, it goes inside the integral, alongside the scale factors.",
          claims: [{ instance: "region", readout: "Q", value: 2.51327e-5, unit: "C" }],
        },
        {
          id: "volume", title: "Through a volume: Q = ∫ρv dv", patch: { region: { system: "cyl", ranges: [[0, 1], [0, 360], [0, 2]], face: null, density: "demo-cyl" }, eq: eqp(R`Q=\int_V\rho_v\,dv,\qquad dv=\rho\,d\rho\,d\phi\,dz`, "Q equals the integral of rho v dv") }, focus: ["region", "eq"],
          note: "Inside a volume, multiply the density by dv, scale factors and all. A cylinder of radius 1 m and height 2 m with ρv = ρ µC/m³ (denser toward the rim) holds Q = ∫∫∫ ρ · ρ dρ dφ dz = (1/3)(2π)(2) = 4.189 µC. The ρ from the density and the ρ from dv multiply to give ρ², which is why the answer has a 1/3 in it.",
          claims: [{ instance: "region", readout: "Q", value: 4.18879e-6, unit: "C" }],
        },
        {
          id: "cancel", title: "When the Jacobian cancels the density", patch: { region: { system: "sph", ranges: [[0, 5.25], [0, 180], [0, 360]], face: null, density: "hw-2.5c", drawScale: 0.3 }, eq: eqp(R`\int\frac{3.05}{r\sin\theta}\;r^2\sin\theta\,dr\,d\theta\,d\phi=3.05\int r\,dr\int d\theta\int d\phi`, "the sin theta cancels") }, focus: ["region", "eq"],
          note: "HW02 2.5(c) gives ρv = 3.05/(r sin θ) C/m³ in a sphere of radius 5.25 m. It looks awkward until you multiply by dv = r² sin θ dr dθ dφ: the sin θ cancels and one r cancels, leaving 3.05 r. Then Q = 3.05 × (5.25²/2) × π × 2π = 829.7 C. The density was designed to meet the Jacobian. Forget the Jacobian, and the integral of 1/sin θ blows up.",
          claims: [{ instance: "region", readout: "Q", value: 829.6945, unit: "C" }],
        },
      ],
      examples: [
        {
          id: "hw25a", level: "basic", title: "HW02 2.5(a): a line",
          setup: { region: { system: "cart", ranges: [[1, 5], [0, 0.05], [0, 0.05]], face: null, density: "hw-2.5a", drawScale: 0.4 } },
          problem: "Determine the total charge on the line 1 < x < 5 m if ρL = 12x² mC/m.",
          lines: [
            { text: "On the x-axis, dl = dx: Q = ∫₁⁵ 12x² dx mC.", focus: ["region"] },
            { text: "Q = 12[x³/3]₁⁵ = 4(125 − 1) = 496 mC.", focus: ["region"], claims: [{ instance: "region", readout: "Q", value: 0.496, unit: "C" }] },
          ],
          covers: ["hw-2324-2.5"],
          trap: "Leaving out the 1/3 from ∫x² dx gives 1488 mC, three times too much.",
        },
        {
          id: "hw25b", level: "tutorial", title: "HW02 2.5(b): a cylinder's side",
          setup: { region: { system: "cyl", ranges: [[0, 4], [0, 360], [0, 7]], face: 0, density: "hw-2.5b", drawScale: 0.25 } },
          problem: "Determine the total charge on the cylinder 0 < z < 7 m, ρ = 4 m, with ρS = πρz² pC/m².",
          lines: [
            { text: "On the side ρ = 4 m, dS = ρ dφ dz, and ρS = 4πz².", focus: ["region"] },
            { text: "Q = ∫₀^{2π}∫₀⁷ (4πz²)(4) dφ dz = 16π × 2π × (343/3) pC.", focus: ["region"] },
            { text: "Q = 36110 pC = 36.11 nC.", focus: ["region"], claims: [{ instance: "region", readout: "Q", value: 3.61096e-8, unit: "C" }] },
          ],
          covers: ["hw-2324-2.5"],
          trap: "Using dS = dφ dz drops the ρ = 4 and gives a quarter of the charge. The ρ appears twice: once in the density, once in dS.",
        },
        {
          id: "mst4b", level: "exam", title: "MST Q4(b): a nonlinear volume density",
          setup: { region: { system: "cyl", ranges: [[0, 0.2], [0, 180], [-4, -2]], face: null, density: "mst-4b", drawScale: 0.45 } },
          problem: "Calculate Q_T within 0 ≤ ρ ≤ 0.2 m, 0 ≤ φ ≤ π, −4 ≤ z ≤ −2 m if ρv = ρ² sin φ µC/m³.",
          lines: [
            { text: "dv = ρ dρ dφ dz, so the integrand is ρ² sin φ · ρ = ρ³ sin φ.", focus: ["region"] },
            { text: "The three integrals separate: [ρ⁴/4]₀^{0.2} × [−cos φ]₀^π × [z]₋₄^{−2} = (0.0004)(2)(2).", focus: ["region"] },
            { text: "Q_T = 0.0016 µC = 1.6 nC.", focus: ["region"], claims: [{ instance: "region", readout: "Q", value: 1.6e-9, unit: "C" }] },
          ],
          covers: ["mst-2324-q4b"],
          trap: "Forgetting the ρ in dv gives [ρ³/3], or 0.00267 instead of 0.0004: a charge 6.7 times too big.",
        },
      ],
      asks: [
        { id: "which-density", q: "How do I know whether it's ρL, ρS or ρv?", a: "From the units and the geometry. C/m spreads along a line, C/m² over a surface, and C/m³ through a volume. The question's region tells you the same thing: a line segment, a surface, or a solid." },
        { id: "jacobian", q: "Why do I need the scale factors?", tags: ["DENSITY_NO_JACOBIAN"], a: "A density is charge per real metre, square metre or cubic metre, but dρ dφ dz is not a volume until you multiply by ρ. The scale factors turn coordinate steps into real lengths, areas and volumes." },
        { id: "separate", q: "When can I split the integral into a product?", a: "When the integrand factors into a function of each coordinate alone, and the limits are constants. ρ³ sin φ over a box in (ρ, φ, z) splits into three one-dimensional integrals." },
        { id: "units", q: "What unit is the answer in?", a: "The density's charge unit times metres to the right power, which cancels the per-metre part. mC/m × m gives mC; pC/m² × m² gives pC. Convert to coulombs only if the question asks." },
        { id: "uniform", q: "What if the density is uniform?", a: "Then Q is the density times the length, area or volume. The integral only matters when the density varies." },
        { id: "negative", q: "Can a density be negative?", a: "Yes. Negative charge has a negative density, and a density can even change sign across a region. Integrate it as it is, and the signs take care of themselves." },
      ],
      checks: [
        {
          id: "dv", title: "Check: the integrand", show: ["axes", "region", "eq"], patch: { region: { system: "cyl", ranges: [[0, 0.2], [0, 180], [-4, -2]], face: null, density: "mst-4b", drawScale: 0.45 } },
          note: "Four checks on charge from a density. Get each right to move on.",
          interaction: { id: "dv", type: "choose", prompt: "For ρv = ρ² sin φ in cylindrical coordinates, the integrand of Q is…", dimension: "computational",
            options: [
              choice("right", "ρ³ sin φ dρ dφ dz", true, "Right: ρ² sin φ times ρ dρ dφ dz."),
              choice("bare", "ρ² sin φ dρ dφ dz", false, "dv = ρ dρ dφ dz: the extra ρ is missing.", "DENSITY_NO_JACOBIAN"),
              choice("sq", "ρ⁴ sin φ dρ dφ dz", false, "Only one extra ρ comes from dv."),
            ] },
        },
        {
          id: "line-num", title: "Check: a line charge, your numbers",
          note: "HW02 2.5(a) with your numbers.",
          interaction: { id: "line-num", type: "numeric", prompt: clp.prompt, answer: clp.spec.answer, distractors: clp.spec.distractors, relTol: clp.spec.relTol, hints: clp.hints, template: "charge-line-poly", dimension: "computational" },
          covers: ["hw-2324-2.5"],
        },
        {
          id: "sphere-c", title: "Check: HW02 2.5(c)",
          note: "The awkward-looking density.",
          interaction: { id: "sphere-c", type: "numeric", prompt: "Find the total charge within the sphere r = 5.25 m if ρv = 3.05/(r sin θ) C/m³.", answer: { value: 829.7, unit: "C" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 5717, unit: "C", errorClass: "conceptual", feedback: "That integrates 3.05 r sin θ, not 3.05/(r sin θ). Read the density carefully: it's divided by r sin θ." }],
            hints: ["dv = r² sin θ dr dθ dφ.", "(3.05/(r sin θ)) × r² sin θ = 3.05 r.", "3.05 × (5.25²/2) × π × 2π."] },
          covers: ["hw-2324-2.5"],
        },
        {
          id: "mst-num", title: "Check: MST Q4(b)",
          note: "Last one.",
          interaction: { id: "mst-num", type: "numeric", prompt: "ρv = ρ² sin φ µC/m³ over 0 ≤ ρ ≤ 0.2 m, 0 ≤ φ ≤ π, −4 ≤ z ≤ −2 m. Find Q_T in nC.", answer: { value: 1.6, unit: "nC" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 10.67, unit: "nC", errorClass: "conceptual", feedback: "That leaves out the ρ in dv." }],
            hints: ["Integrand: ρ³ sin φ.", "(0.0004)(2)(2) µC.", "µC to nC: × 1000."] },
          covers: ["mst-2324-q4b"],
        },
      ],
      recap: {
        points: [
          "Q = ∫ρL dl, ∫ρS dS or ∫ρv dv: the density times the matching element, summed.",
          "Use the full element with its scale factors: ρ dρ dφ dz, r² sin θ dr dθ dφ.",
          "Separable integrands over box limits split into a product of one-dimensional integrals.",
          "Watch for densities built to cancel the Jacobian, such as 1/(r sin θ).",
        ],
        traps: ["Dropping the Jacobian.", "Losing a 1/3 or 1/4 from the power rule.", "Misreading 3.05/(r sin θ) as 3.05 r sin θ."],
      },
    },
  ],
});
```

The distractor 5717 comes from real homework work that misread the density (and made an arithmetic slip). The correct value for 3.05 r sin θ is 5717.1, and it stands as the misread answer.

- [ ] **Step 3: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Gauss applications at depth; Idea 1, charge from a density (HW02 2.5, MST Q4(b))

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: Ideas ② and ③ (flux through part of a surface; spheres of charge)

**Files:** Create `plates/idea-patch-flux.ts` and `plates/idea-spheres.ts`. Append both to gauss-applications `main`, and register them.

- [ ] **Step 1: `plates/idea-patch-flux.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const fp = instantiate(templates.find((t) => t.id === "flux-patch")!, 1);
const q06 = instantiate(templates.find((t) => t.id === "q06-octant")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaPatchFlux = defineIdeaPlate({
  id: "idea-patch-flux",
  title: "Flux through part of a surface",
  requires: { objectives: [1], items: ["mst-2324-q3a", "tutorial:q06"], misconceptions: ["FLUX_PATCH_AREA"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.6 } },
    { id: "region", component: "coord-region", params: { system: "sph", ranges: [[0, 1], [0, 90], [0, 360]], face: 0, centralCharge: 12 } },
    { id: "eq", component: "equation", params: eqp(R`\Psi_{\text{patch}}=Q\cdot\dfrac{\text{patch area}}{4\pi r^2}`, "the patch flux is Q times the patch's share of the sphere") },
  ],
  ideas: [
    {
      id: "patch-flux",
      title: "Flux through part of a surface",
      objectives: [1],
      explain: [
        {
          id: "share", title: "A share of the whole", show: ["axes", "region", "eq"], focus: ["region", "eq"],
          note: "A point charge at the centre of a sphere sends its flux out evenly in every direction. So any patch of the sphere carries the same fraction of the flux as its fraction of the area. Gauss's law gives the whole: Q. On the plate, a 12 µC charge sits at the centre and the patch is the upper hemisphere: half the area, so half the flux, 6 µC.",
          claims: [{ instance: "region", readout: "patchFlux", value: 6, unit: "µC" }],
        },
        {
          id: "radius", title: "The radius doesn't matter", patch: { region: { ranges: [[0, 1.8], [0, 90], [0, 360]] } }, focus: ["region"],
          note: "Grow the sphere to 1.8 m. The hemisphere's area grows, but so does the whole sphere's, by the same factor, so the share, and the flux, stay at 6 µC. That is why the radius in a question like MST Q3(a) is a distraction: only the angles matter. The share is (1 − cos θ₂)Δφ/(4π) for a patch 0 < θ < θ₂ with a φ-range of Δφ.",
          claims: [{ instance: "region", readout: "patchFlux", value: 6, unit: "µC" }],
        },
        {
          id: "octant", title: "The octant (Tutorial Q.06)", patch: { region: { ranges: [[0, 1.4], [0, 90], [0, 90]] } }, focus: ["region"],
          note: "0 < θ < π/2 is the top half, and 0 < φ < π/2 is a quarter of the way round. Together they make an eighth of the sphere, so an eighth of the flux: 12/8 = 1.5 µC. The tutorial's version is exactly this reasoning with its own Q.",
          claims: [{ instance: "region", readout: "patchFlux", value: 1.5, unit: "µC" }],
        },
        {
          id: "cube", title: "Flat faces: the cube", patch: { region: { system: "cart", ranges: [[-1, 1], [-1, 1], [-1, 1]], face: 2 }, eq: eqp(R`\Psi_{\text{face}}=\dfrac{Q}{6}`, "each face of a centred cube carries Q over six") }, focus: ["region", "eq"],
          note: "The share idea works for any closed surface with enough symmetry. A charge at the centre of a cube sends equal flux through all six identical faces, so each gets Q/6: 2 µC here. On a flat face D is not uniform and not normal, so a direct integral would be hard. Symmetry makes it one line.",
          claims: [{ instance: "region", readout: "patchFlux", value: 2, unit: "µC" }],
        },
      ],
      examples: [
        {
          id: "q06", level: "basic", title: "Tutorial Q.06: the octant",
          setup: { region: { system: "sph", ranges: [[0, 1.4], [0, 90], [0, 90]], face: 0, centralCharge: 40 } },
          problem: "A 40 µC point charge sits at the origin. Find the flux through the part of the sphere r = 26 cm with 0 < θ < π/2 and 0 < φ < π/2.",
          lines: [
            { text: "The range is half in θ and a quarter in φ: one eighth of the sphere.", focus: ["region"] },
            { text: "Ψ = 40/8 = 5 µC. The radius, 26 cm, doesn't enter.", focus: ["region"], claims: [{ instance: "region", readout: "patchFlux", value: 5, unit: "µC" }] },
          ],
          covers: ["tutorial:q06"],
          trap: "Computing the patch area and multiplying by Q. Flux is Q times the area's share of 4πr², not Q times the area.",
        },
        {
          id: "mst3a", level: "tutorial", title: "MST Q3(a): a narrower patch",
          setup: { region: { system: "sph", ranges: [[0, 0.25], [0, 60], [30, 45]], face: 0, centralCharge: 100, drawScale: 4 } },
          problem: "A 100 µC point charge is at the origin. Calculate the flux through the part of the sphere r = 25.0 cm bounded by 0 < θ < π/3 and π/6 < φ < π/4.",
          lines: [
            { text: "Share = (1 − cos 60°)(π/4 − π/6)/(4π) = (0.5)(π/12)/(4π) = 1/96.", focus: ["region"] },
            { text: "Ψ = 100 µC / 96 = 1.042 µC.", focus: ["region"], claims: [{ instance: "region", readout: "patchFlux", value: 1.04167, unit: "µC" }] },
          ],
          covers: ["mst-2324-q3a"],
          trap: "Using θ₂ = 60° as if the θ-share were 60/180. The θ-share is (1 − cos θ₂)/2, because patches near the poles are smaller.",
        },
        {
          id: "cube", level: "exam", title: "Faces of a cube",
          setup: { region: { system: "cart", ranges: [[-1, 1], [-1, 1], [-1, 1]], face: 2, centralCharge: 12 } },
          problem: "A 12 µC charge sits at the centre of a cube. Find the flux through its top face, and the flux through the remaining five faces together.",
          lines: [
            { text: "All six faces are identical by symmetry, so each carries 12/6 = 2 µC.", focus: ["region"], claims: [{ instance: "region", readout: "patchFlux", value: 2, unit: "µC" }] },
            { text: "The other five together: 12 − 2 = 10 µC. Their total must make the closed-surface flux Q.", focus: ["region"], givens: [{ value: 10, unit: "µC" }] },
          ],
          trap: "Moving the charge off-centre and still dividing by six. Symmetry is what allowed the split.",
        },
      ],
      asks: [
        { id: "why-share", q: "Why is flux shared by area?", tags: ["FLUX_PATCH_AREA"], a: "Only for a charge at the centre of a sphere, where D is the same size everywhere on the surface and normal to it. Then flux is D times area, and D is the same everywhere, so the flux divides exactly as the area does." },
        { id: "theta-share", q: "Why (1 − cos θ₂) and not θ₂/π?", a: "Bands of the sphere near the poles are smaller than those near the equator. Integrating r² sin θ dθ gives r²(1 − cos θ₂), which accounts for the shrinking bands." },
        { id: "off-centre", q: "What if the charge isn't at the centre?", a: "Then D varies over the surface, and the simple share no longer works for a patch. Only the total through the whole closed surface is still Q." },
        { id: "open", q: "Does Gauss's law apply to a patch?", a: "Not directly: Gauss's law is about closed surfaces. Symmetry lets you split the closed-surface total into equal or proportional pieces." },
        { id: "solid", q: "What is a solid angle?", a: "The 3D version of an angle: patch area divided by r², measured in steradians. A whole sphere is 4π steradians, and the flux share is the solid angle divided by 4π." },
        { id: "units", q: "What units does the flux come out in?", a: "The same as the charge. Ψ has units of coulombs, so a 100 µC charge gives flux in µC." },
      ],
      checks: [
        {
          id: "rule", title: "Check: the share rule", show: ["axes", "region", "eq"], patch: { region: { system: "sph", ranges: [[0, 1], [0, 90], [0, 360]], face: 0, centralCharge: 12, drawScale: 1 } },
          note: "Four checks on patch flux. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "rule", type: "choose", prompt: "A central charge Q. The flux through a patch of the sphere equals…", dimension: "conceptual",
            options: [
              choice("share", "Q × (patch area ÷ 4πr²)", true, "Right: the patch's share of the whole."),
              choice("area", "Q × (patch area)", false, "That has the wrong units. Divide by the whole area.", "FLUX_PATCH_AREA"),
              choice("zero", "zero, since the patch isn't closed", false, "Flux through an open patch is fine; Gauss's law just doesn't give it directly."),
            ] },
        },
        {
          id: "predict-r", title: "Check: a bigger sphere",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-r", type: "predict-drag", prompt: "The sphere's radius doubles, from 1 m to 2 m. Drag the hemisphere's flux to your prediction.", target: { instance: "region", readout: "patchFlux" }, range: [0, 12], unit: "µC", relTol: 0.05, reveal: { region: { ranges: [[0, 2], [0, 90], [0, 360]], drawScale: 0.8 } }, dimension: "conceptual", tag: "FLUX_PATCH_AREA",
            feedback: { close: "Right: unchanged, 6 µC.", far: "The share is the same at any radius: 6 µC." } },
        },
        {
          id: "patch-num", title: "Check: a patch, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "patch-num", type: "numeric", prompt: fp.prompt, answer: fp.spec.answer, distractors: fp.spec.distractors, relTol: fp.spec.relTol, hints: fp.hints, template: "flux-patch", dimension: "application" },
          covers: ["mst-2324-q3a"],
        },
        {
          id: "q06-num", title: "Check: Tutorial Q.06",
          note: "Last one.",
          interaction: { id: "q06-num", type: "numeric", prompt: q06.prompt, answer: q06.spec.answer, distractors: q06.spec.distractors, relTol: q06.spec.relTol, hints: q06.hints, template: "q06-octant", dimension: "application" },
          covers: ["tutorial:q06"],
        },
      ],
      recap: {
        points: [
          "With a central charge, the flux through a patch is Q × (the patch's share of the sphere).",
          "Share = (1 − cos θ₂)Δφ/(4π) for 0 < θ < θ₂ and a φ-range of Δφ; the radius cancels.",
          "Symmetry splits closed surfaces: each face of a centred cube carries Q/6.",
        ],
        traps: ["Multiplying Q by the area.", "Using θ₂/π for the θ-share.", "Dividing by six when the charge is off-centre."],
      },
    },
  ],
});
```

- [ ] **Step 2: `plates/idea-spheres.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const bd = instantiate(templates.find((t) => t.id === "ball-d")!, 1);
const q08 = instantiate(templates.find((t) => t.id === "q08-q")!, 1);
const BALL = { items: [{ id: "b", kind: "ball" as const, rhoV: 3, radius: 1, center: [0, 0, 0] as [number, number, number] }] };
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaSpheres = defineIdeaPlate({
  id: "idea-spheres",
  title: "Spheres of charge: D and Q inside and outside",
  requires: { objectives: [2], items: ["tutorial:q08"], misconceptions: ["BALL_INSIDE_OUTSIDE"] },
  instances: [
    { id: "q", component: "charges", params: BALL },
    { id: "surface", component: "gaussian-surface", params: { shape: "sphere", size: 0.5 }, links: { charges: "q" } },
    { id: "ep", component: "e-probe", params: { point: [0.5, 0, 0] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: eqp(R`D\cdot4\pi r^2=Q_{\text{enc}}`, "D times four pi r squared equals the charge enclosed") },
  ],
  ideas: [
    {
      id: "spheres",
      title: "Spheres of charge: D and Q inside and outside",
      objectives: [2],
      explain: [
        {
          id: "inside", title: "Inside a charged ball", show: ["q", "surface", "ep", "eq"], focus: ["surface", "ep"],
          note: "A ball of radius 1 m carries a uniform ρv = 3 µC/m³. By symmetry, D is radial and the same size everywhere on any concentric sphere, so Gauss's law gives D × 4πr² = Q_enc. Inside, at r = 0.5 m, only the charge within r counts: Q_enc = ρv(4/3)πr³ = 1.571 µC. That gives D = ρv r/3 = 0.5 µC/m², growing in proportion to r.",
          claims: [{ instance: "surface", readout: "enclosed", value: 1.5708, unit: "µC" }, { instance: "ep", readout: "Dmag", value: 0.5, unit: "µC/m^2" }],
        },
        {
          id: "outside", title: "Outside: the whole ball", patch: { surface: { size: 1.5 }, ep: { point: [1.5, 0, 0] } }, focus: ["surface", "ep"],
          note: "Outside the ball, at r = 1.5 m, the Gaussian sphere encloses all the charge, Q = ρv(4/3)πa³ = 12.57 µC. Then D = Q/(4πr²) = 0.4444 µC/m²: exactly what a point charge of 12.57 µC at the centre would give. From outside, a uniform ball can't be told apart from a point charge.",
          claims: [{ instance: "surface", readout: "enclosed", value: 12.5664, unit: "µC" }, { instance: "ep", readout: "Dmag", value: 0.444444, unit: "µC/m^2" }],
        },
        {
          id: "profile", title: "Up, then down", patch: { surface: { size: 1 }, ep: { point: [1, 0, 0] } }, focus: ["surface", "ep"],
          note: "Put the two results together. D rises linearly from zero at the centre to its peak at the surface, D = ρv a/3 = 1 µC/m², then falls as 1/r² outside. The two formulas agree exactly at r = a, so D is continuous. Past papers test both sides, so always ask first: is r inside or outside?",
          claims: [{ instance: "ep", readout: "Dmag", value: 1, unit: "µC/m^2" }],
        },
        {
          id: "from-d", title: "Backwards: Q from D", patch: { eq: eqp(R`Q_{\text{enc}}=D(r)\cdot4\pi r^2`, "Q equals D at r times four pi r squared") }, focus: ["eq", "surface"],
          note: "The same equation runs backwards. If a question gives D as a radial function of r, the charge inside radius r is D(r) × 4πr². Tutorial Q.08 and Finals 2024-25 Q2(a) both work this way. With D = 5.0r² nC/m² at r = 10 m, Q = 500 × 1256.6 nC = 628.3 µC, as the Gauss's law lesson showed.",
        },
      ],
      examples: [
        {
          id: "q08", level: "basic", title: "Tutorial Q.08: Q from a given D",
          setup: { surface: { size: 1 } },
          problem: "In free space D = 0.5r² a_r nC/m². Find the total charge within the sphere r = 2 m.",
          lines: [
            { text: "On r = 2 m, D = 0.5 × 4 = 2 nC/m², radial and the same everywhere.", focus: ["eq"] },
            { text: "Q = D × 4πr² = 2 × 16π = 100.5 nC.", focus: ["eq"], givens: [{ value: 32 * Math.PI, unit: "nC" }] },
          ],
          covers: ["tutorial:q08"],
          trap: "Stopping at D = 2 nC/m². That's D, not the charge. Multiply by the sphere's area.",
        },
        {
          id: "ball", level: "tutorial", title: "A charged ball, inside and out",
          setup: { q: BALL, surface: { size: 0.5 }, ep: { point: [0.5, 0, 0] } },
          problem: "A ball of radius 1 m has a uniform ρv = 3 µC/m³. Find |D| at r = 0.5 m and at r = 1.5 m.",
          lines: [
            { text: "Inside: D = ρv r/3 = 3 × 0.5/3 = 0.5 µC/m².", focus: ["ep"], claims: [{ instance: "ep", readout: "Dmag", value: 0.5, unit: "µC/m^2" }] },
            { text: "Outside: Q = 3 × (4/3)π × 1³ = 12.57 µC, so D = 12.57/(4π × 1.5²) = 0.4444 µC/m².", patch: { surface: { size: 1.5 }, ep: { point: [1.5, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Dmag", value: 0.444444, unit: "µC/m^2" }, { instance: "surface", readout: "enclosed", value: 12.5664, unit: "µC" }] },
          ],
          trap: "Using the whole ball's charge at r = 0.5 m gives 4 µC/m², eight times too much. Inside, only the charge within r counts.",
        },
        {
          id: "exam", level: "exam", title: "A denser ball, both sides",
          setup: { q: { items: [{ id: "b", kind: "ball", rhoV: 4, radius: 2, center: [0, 0, 0] }], drawScale: 0.5 }, surface: { size: 1 }, ep: { point: [1, 0, 0], drawScale: 0.5 } },
          problem: "A sphere of radius 2 m holds a uniform ρv = 4 µC/m³. Find D at r = 1 m and at r = 3 m, and the total charge.",
          lines: [
            { text: "Inside, at 1 m: D = ρv r/3 = 4/3 = 1.333 µC/m² (radial).", focus: ["ep"], claims: [{ instance: "ep", readout: "Dmag", value: 1.33333, unit: "µC/m^2" }] },
            { text: "Total charge: Q = 4 × (4/3)π × 2³ = 134.0 µC.", focus: ["q"], givens: [{ value: (4 * 4 * Math.PI * 8) / 3, unit: "µC" }] },
            { text: "Outside, at 3 m: D = Q/(4πr²) = 134.0/(36π) = 1.185 µC/m².", patch: { ep: { point: [3, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Dmag", value: 1.18519, unit: "µC/m^2" }] },
          ],
          trap: "At r = 3 m, using ρv r/3 = 4 µC/m² keeps the inside formula outside the ball.",
        },
      ],
      asks: [
        { id: "inside-rule", q: "Why does only the charge inside r count?", tags: ["BALL_INSIDE_OUTSIDE"], a: "By Gauss's law, the flux through the sphere of radius r depends only on the charge it encloses. The charge in the outer shell surrounds the Gaussian sphere, and its field there cancels by symmetry." },
        { id: "centre", q: "Why is D zero at the centre?", a: "Every piece of charge is balanced by an equal piece opposite, so their pulls cancel. In the formula, D = ρv r/3 gives zero at r = 0." },
        { id: "point", q: "Why does the ball look like a point charge from outside?", a: "Outside, the Gaussian sphere encloses the whole charge, and Gauss's law then gives D = Q/(4πr²), the point-charge result. How the charge is arranged inside doesn't matter, as long as it's spherically symmetric." },
        { id: "shell", q: "What about a hollow shell of charge?", a: "Inside the shell the Gaussian sphere encloses nothing, so D = 0 there. Outside, D = Q/(4πr²) again. It is the same method with a different Q_enc." },
        { id: "nonuniform", q: "What if ρv varies with r?", a: "Then Q_enc = ∫ρv dv over the sphere of radius r, with dv = 4πr² dr for a spherical shell. The rest of the method is unchanged." },
        { id: "e-too", q: "How do I get E from D?", a: "In free space, E = D/ε₀. Inside a material, E = D/(ε₀εr). D itself depends only on the free charge." },
      ],
      checks: [
        {
          id: "which", title: "Check: inside or outside?", show: ["q", "surface", "ep", "eq"], patch: { q: BALL, surface: { size: 0.5 }, ep: { point: [0.5, 0, 0], drawScale: 1 } },
          note: "Four checks on spheres of charge. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "which", type: "choose", prompt: "Inside a uniformly charged ball, at radius r < a, D equals…", dimension: "recognition",
            options: [
              choice("right", "ρv r / 3", true, "Right: only the charge within r counts."),
              choice("out", "ρv a³ / (3r²)", false, "That's the outside formula; it uses the whole ball.", "BALL_INSIDE_OUTSIDE"),
              choice("zero", "zero", false, "Only a hollow shell has zero field inside."),
            ] },
        },
        {
          id: "predict-2r", title: "Check: double r inside", patch: { ep: { point: [0.4, 0, 0] }, surface: { size: 0.4 } },
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-2r", type: "predict-drag", prompt: "The probe and the Gaussian sphere move from r = 0.4 m to r = 0.8 m, both inside the ball. Drag |D| to your prediction.", target: { instance: "ep", readout: "Dmag" }, range: [0, 2], unit: "µC/m^2", relTol: 0.05, reveal: { ep: { point: [0.8, 0, 0] }, surface: { size: 0.8 } }, dimension: "conceptual",
            feedback: { close: "Right: it doubles, to 0.8 µC/m².", far: "Inside, D = ρv r/3 grows in proportion to r: 0.8 µC/m²." } },
        },
        {
          id: "ball-num", title: "Check: a ball, your numbers",
          note: "Inside or outside? Decide first.",
          interaction: { id: "ball-num", type: "numeric", prompt: bd.prompt, answer: bd.spec.answer, distractors: bd.spec.distractors, relTol: bd.spec.relTol, hints: bd.hints, template: "ball-d", dimension: "application" },
        },
        {
          id: "q08-num", title: "Check: Tutorial Q.08",
          note: "Last one.",
          interaction: { id: "q08-num", type: "numeric", prompt: q08.prompt, answer: q08.spec.answer, distractors: q08.spec.distractors, relTol: q08.spec.relTol, hints: q08.hints, template: "q08-q", dimension: "computational" },
          covers: ["tutorial:q08"],
        },
      ],
      recap: {
        points: [
          "Spherical symmetry: D × 4πr² = Q_enc on a concentric sphere.",
          "Uniform ball: D = ρv r/3 inside, rising to ρv a/3 at the surface; D = Q/(4πr²) outside.",
          "From outside, any spherical charge looks like a point charge at the centre.",
          "Backwards: Q_enc = D(r) × 4πr².",
        ],
        traps: ["Using the whole charge inside the ball.", "Using ρv r/3 outside it.", "Stopping at D when Q is asked for."],
      },
    },
  ],
});
```

Note: `gaussian-surface` `enclosed` is in µC. The claims are 1.5708 (π/2) and 12.5664 (4π).

- [ ] **Step 3: Register both**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Gauss applications Ideas 2 and 3, patch flux (MST Q3(a), Q.06) and spheres of charge (Q.08, balls)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 5: The divergence concept, and Idea ④ (∇·D = ρv)

**Files:** Modify `concepts/electrostatics.ts` (the `divergence` header and lessons) and `plates/index.ts`. Create `plates/idea-point-form.ts`.

- [ ] **Step 1: The concept.** In `divergence`:
  - `title: "Point form and the divergence theorem"`
  - `objectives`: `["Use ∇·D = ρv to find the charge density from a given field.", "Apply the divergence theorem: net flux out equals the charge inside, computed either way."]`
  - `misconceptions`:

    ```ts
    [
      { tag: "POINT_FORM_EPS", description: "Forgets ε₀ when the field is given as E rather than D.", remediation: "em1.electrostatics.divergence/main" },
      { tag: "DIV_THEOREM_FACES", description: "Counts faces the field is parallel to, or drops faces where it isn't.", remediation: "em1.electrostatics.divergence/main" },
    ]
    ```

  - Rename the existing `main` to `quick`. Prepend a new `main` ("Point form and the divergence theorem (in depth)", minutes 45) with blocks `idea-point-form` (this task) and `idea-div-theorem` (Task 6).

- [ ] **Step 2: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const rv = instantiate(templates.find((t) => t.id === "rhov-from-d")!, 1);
const EPS0 = 8.8541878128e-12;
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaPointForm = defineIdeaPlate({
  id: "idea-point-form",
  title: "∇·D = ρv, point by point",
  requires: { objectives: [0], items: ["hw-2324-2.6", "f2324-q2b"], misconceptions: ["POINT_FORM_EPS"] },
  instances: [
    { id: "vs", component: "vector-slice", params: { field: "hw-2.6", plane: "xy", probe: [1, 2, 0.5], offset: 0.5, box: 0.3 } },
    { id: "eq", component: "equation", params: eqp(R`\nabla\cdot\mathbf D=\rho_v`, "divergence of D equals rho v") },
  ],
  ideas: [
    {
      id: "point-form",
      title: "∇·D = ρv, point by point",
      objectives: [0],
      explain: [
        {
          id: "statement", title: "Gauss's law, one point at a time", show: ["vs", "eq"], focus: ["vs", "eq"],
          note: "Gauss's law in integral form says the flux out of a closed surface equals the charge inside. Shrink the surface to a tiny box around a point: the flux out per unit volume is the divergence, and the charge per unit volume is the density. So, point by point, ∇·D = ρv. Where D spreads out, there is positive charge; where it converges, negative charge; where the divergence is zero, there is no charge at all.",
        },
        {
          id: "hw26", title: "Reading ρv from a field (HW02 2.6)", focus: ["vs"],
          note: "HW02 2.6 gives D = 3xy âₓ + x² âᵧ C/m². Its divergence is ∂(3xy)/∂x + ∂(x²)/∂y = 3y + 0, so ρv = 3y C/m³. The charge density grows with y and has nothing to do with x. At the probe, (1, 2, 0.5), ρv = 6, and the plate's box, flux ÷ volume, agrees.",
          claims: [{ instance: "vs", readout: "div", value: 6, unit: "" }, { instance: "vs", readout: "boxRatio", value: 6, unit: "" }],
        },
        {
          id: "from-e", title: "Given E, not D: multiply by ε₀", patch: { vs: { field: "f2324-2b", plane: "xz", probe: [2, 0, 0], offset: 0, box: 0 }, eq: eqp(R`\rho_v=\nabla\cdot\mathbf D=\varepsilon_0\,\nabla\cdot\mathbf E`, "rho v equals epsilon nought times divergence of E") }, focus: ["vs", "eq"],
          note: "Finals 2023-24 Q2(b) gives E, not D. In a vacuum D = ε₀E, so ρv = ε₀∇·E. For E = πr² âr inside r = 3 m, the spherical divergence is (1/r²)∂(r² · πr²)/∂r = 4πr. At r = 2 m that is 8π, and ρv = 8πε₀ = 2.225 × 10⁻¹⁰ C/m³. Forget the ε₀ and the density comes out about ten billion times too large.",
          claims: [{ instance: "vs", readout: "div", value: 25.1327, unit: "" }],
        },
        {
          id: "outside", title: "A negative density outside", patch: { vs: { probe: [5, 0, 0], offset: 0 } }, focus: ["vs"],
          note: "Outside, E = 6π/r³ âr. Then r²E = 6π/r, its derivative is −6π/r², and dividing by r² gives ∇·E = −6π/r⁴. At r = 5 m that is −0.03016, so ρv = −2.670 × 10⁻¹³ C/m³: a small negative density. That is what the given field implies, so state it with its sign. The paper tests whether you can carry the calculation, not whether the field is physical.",
          claims: [{ instance: "vs", readout: "div", value: -0.0301593, unit: "" }],
        },
      ],
      examples: [
        {
          id: "hw26a", level: "basic", title: "HW02 2.6(a): ρv from D",
          setup: { vs: { field: "hw-2.6", plane: "xy", probe: [1, 2, 0.5], offset: 0.5, box: 0.3 } },
          problem: "Given D = 3xy âₓ + x² âᵧ C/m², calculate the volume charge density ρv.",
          lines: [
            { text: "∂(3xy)/∂x = 3y; ∂(x²)/∂y = 0; there is no z-part.", focus: ["vs"] },
            { text: "ρv = ∇·D = 3y C/m³, which is 6 C/m³ at y = 2.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 6, unit: "" }] },
          ],
          covers: ["hw-2324-2.6"],
          trap: "Differentiating x² with respect to x (giving 2x) when it's the y-component: ∂D_y/∂y is what's needed.",
        },
        {
          id: "f2324-in", level: "tutorial", title: "Finals 2023-24 Q2(b)(ii): inside, at r = 2 m",
          setup: { vs: { field: "f2324-2b", plane: "xz", probe: [2, 0, 0], offset: 0, box: 0 } },
          problem: "In a vacuum, E = πr² âr N/C for 0 < r ≤ 3 m. Compute ρv at r = 2 m.",
          lines: [
            { text: "Spherical divergence of a radial field: (1/r²)∂(r²E_r)/∂r = (1/r²)∂(πr⁴)/∂r = 4πr.", focus: ["vs"] },
            { text: "At r = 2 m: ∇·E = 8π = 25.13.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 25.1327, unit: "" }] },
            { text: "ρv = ε₀∇·E = 8.854 × 10⁻¹² × 25.13 = 2.225 × 10⁻¹⁰ C/m³.", focus: ["vs"] },
          ],
          covers: ["f2324-q2b"],
          trap: "Using the cartesian ∂E/∂r without the (1/r²)∂(r² …) structure gives 2πr = 12.57, half the right value.",
        },
        {
          id: "f2324-out", level: "exam", title: "Finals 2023-24 Q2(b)(iii): outside, at r = 5 m",
          setup: { vs: { field: "f2324-2b", plane: "xz", probe: [5, 0, 0], offset: 0, box: 0 } },
          problem: "For r > 3 m, E = (6π/r³) âr N/C. State Gauss's law, then compute ρv at r = 5 m.",
          lines: [
            { text: "Gauss's law: the net outward flux of D through any closed surface equals the charge enclosed; in point form, ∇·D = ρv.", focus: ["eq"] },
            { text: "r²E_r = 6π/r, so ∂(r²E_r)/∂r = −6π/r², and ∇·E = −6π/r⁴ = −0.03016 at r = 5 m.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: -0.0301593, unit: "" }] },
            { text: "ρv = ε₀∇·E = −2.670 × 10⁻¹³ C/m³.", focus: ["vs"] },
          ],
          covers: ["f2324-q2b"],
          trap: "Reporting zero because a 1/r³ field 'looks' like it has no charge outside. Only 1/r² radial fields are charge-free; compute rather than guess.",
        },
      ],
      asks: [
        { id: "eps", q: "Why multiply by ε₀ when I'm given E?", tags: ["POINT_FORM_EPS"], a: "Gauss's law is about D, which depends only on free charge. In a vacuum D = ε₀E, so ∇·D = ε₀∇·E. If the question gives D, don't multiply." },
        { id: "zero", q: "Where is ρv zero for a point charge?", a: "Everywhere except at the charge itself. A 1/r² radial field has r²E constant, so its divergence is zero away from the origin. All the charge sits at the point." },
        { id: "units", q: "What units does ρv come out in?", a: "D in C/m² differentiated with respect to metres gives C/m³. With E in N/C, multiply by ε₀ (F/m) and you get C/m³ too." },
        { id: "system", q: "Which divergence formula do I use?", a: "The one matching how the field is written. A field given in r and âr needs the spherical formula; mixing systems is the most common error here." },
        { id: "integral", q: "How is this different from the integral form?", a: "The integral form relates totals: flux through a surface and charge in a volume. The point form relates local values: divergence and density at a point. The divergence theorem connects them." },
        { id: "both", q: "Can I check ρv another way?", a: "Yes: pick a small Gaussian surface, compute the flux, and divide by its volume. The plate's box does exactly that." },
      ],
      checks: [
        {
          id: "eps-check", title: "Check: given E", show: ["vs", "eq"], patch: { vs: { field: "hw-2.6", plane: "xy", probe: [1, 2, 0.5], offset: 0.5, box: 0.3 } },
          note: "Four checks on the point form. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "eps-check", type: "choose", prompt: "A question gives E in a vacuum. The charge density is…", dimension: "recognition",
            options: [
              choice("right", "ε₀ ∇·E", true, "Right: D = ε₀E in a vacuum."),
              choice("bare", "∇·E", false, "That gives ρv/ε₀. Multiply by ε₀.", "POINT_FORM_EPS"),
              choice("over", "∇·E / ε₀", false, "D = ε₀E: multiply, don't divide."),
            ] },
        },
        {
          id: "predict-y", title: "Check: move up in y",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-y", type: "predict-drag", prompt: "The probe moves from (1, 2, 0.5) to (3, 2, 0.5). Drag ∇·D to your prediction.", target: { instance: "vs", readout: "div" }, range: [0, 15], unit: "", relTol: 0.05, reveal: { vs: { probe: [3, 2, 0.5] } }, dimension: "conceptual",
            feedback: { close: "Right: unchanged, 6. ρv = 3y doesn't depend on x.", far: "ρv = 3y depends only on y, so moving in x changes nothing: still 6." } },
        },
        {
          id: "rv-num", title: "Check: ρv, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "rv-num", type: "numeric", prompt: rv.prompt, answer: rv.spec.answer, distractors: rv.spec.distractors, relTol: rv.spec.relTol, hints: rv.hints, template: "rhov-from-d", dimension: "computational" },
          covers: ["hw-2324-2.6"],
        },
        {
          id: "f2324-num", title: "Check: Finals 2023-24 Q2(b)(ii)",
          note: "Last one.",
          interaction: { id: "f2324-num", type: "numeric", prompt: "In a vacuum, E = πr² âr N/C for r ≤ 3 m. Find ρv at r = 2 m, in C/m³.", answer: { value: 8 * Math.PI * EPS0, unit: "C/m^3" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 8 * Math.PI, unit: "C/m^3", errorClass: "conceptual", tag: "POINT_FORM_EPS", feedback: "That's ∇·E. Multiply by ε₀ for the charge density." }],
            hints: ["∇·E = (1/r²)∂(r² · πr²)/∂r.", "That's 4πr: 8π at r = 2.", "Multiply by ε₀ = 8.854 × 10⁻¹²."] },
          covers: ["f2324-q2b"],
        },
      ],
      recap: {
        points: [
          "Point form: ∇·D = ρv, Gauss's law per unit volume.",
          "Given E in a vacuum: ρv = ε₀∇·E.",
          "Radial fields: ∇·E = (1/r²)∂(r²E_r)/∂r.",
          "A negative result means negative charge density; report it with its sign.",
        ],
        traps: ["Forgetting ε₀.", "The cartesian derivative on a radial field.", "Differentiating a component along the wrong axis."],
      },
    },
  ],
});
```

- [ ] **Step 3: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): point form at depth; Idea 1, ∇·D = ρv (HW02 2.6, Finals 23-24 Q2(b))

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 6: Idea ⑤, The divergence theorem with D

**Files:** Create `plates/idea-div-theorem.ts`. Append it to divergence `main`, and register it.

- [ ] **Step 1: The idea plate**

```ts
import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaDivTheorem = defineIdeaPlate({
  id: "idea-div-theorem",
  title: "The divergence theorem with D",
  requires: { objectives: [1], items: ["hw-2324-2.6"], misconceptions: ["DIV_THEOREM_FACES"] },
  instances: [
    { id: "vs", component: "vector-slice", params: { field: "hw-2.6", plane: "xy", probe: [1, 1, 1], offset: 1, box: 2 } },
    { id: "region", component: "coord-region", params: { system: "cart", ranges: [[0, 2], [0, 2], [0, 2]], density: "hw-2.6", drawScale: 0.7 } },
    { id: "eq", component: "equation", params: eqp(R`\oint_S\mathbf D\cdot d\mathbf S=\int_V\nabla\cdot\mathbf D\,dv=\int_V\rho_v\,dv=Q_{\text{enc}}`, "the flux of D out equals the volume integral of rho v, the charge enclosed") },
  ],
  ideas: [
    {
      id: "div-theorem",
      title: "The divergence theorem with D",
      objectives: [1],
      explain: [
        {
          id: "two-ways", title: "Two routes to the same charge", show: ["vs", "eq"], focus: ["vs", "eq"],
          note: "The divergence theorem says the flux out of a closed surface equals the integral of the divergence over the volume inside. With D, the divergence is ρv, so both sides are the enclosed charge: one computed on the surface, one through the volume. For HW02's D = 3xy âₓ + x² âᵧ and the cube 0 < x, y, z < 2 m, the plate's box (side 2, centred at (1, 1, 1)) reports 24 of flux out.",
          claims: [{ instance: "vs", readout: "boxFlux", value: 24, unit: "" }],
        },
        {
          id: "volume", title: "The volume route", show: ["region"], hide: ["vs"], focus: ["region"],
          note: "Volume route: ρv = 3y, so Q = ∫∫∫ 3y dx dy dz over the cube = 3 × 2 × (2²/2) × 2 = 24 C. The x- and z-integrals just give their lengths, 2 m each, and the y-integral gives 2. The region readout agrees.",
          claims: [{ instance: "region", readout: "Q", value: 24, unit: "C" }],
        },
        {
          id: "surface", title: "The surface route, face by face", show: ["vs"], hide: ["region"], focus: ["vs"],
          note: "Surface route: six faces. On x = 2, Dₓ = 6y points out, giving ∫∫6y dy dz = 24. On x = 0, Dₓ = 0. On y = 2 and y = 0, Dᵧ = x² is the same on both, flowing out of one and into the other, so they cancel. On z = 2 and z = 0, D has no z-part, so no flux. The total is 24 C, the same as the volume route.",
          claims: [{ instance: "vs", readout: "boxFlux", value: 24, unit: "" }],
        },
        {
          id: "open-face", title: "A face with no flux", focus: ["vs", "eq"], patch: { eq: eqp(R`\int_{z=-3}\mathbf D\cdot d\mathbf S=\int(\ldots)\,\mathbf a_x\cdot\mathbf a_z+\ldots=0`, "D has no z component, so no flux through a z face") },
          note: "HW02 2.6(b) asks for the flux through the square 0 < x, y < 1 m at z = −3 m. Its normal is âz, and D = 3xy âₓ + x² âᵧ has no âz part, so D·dS = 0 everywhere on it: zero flux, with no integral needed. Check whether the field even has a component along the normal before integrating anything.",
        },
      ],
      examples: [
        {
          id: "hw26b", level: "basic", title: "HW02 2.6(b): flux through a z-face",
          setup: { vs: { field: "hw-2.6", plane: "xy", probe: [0.5, 0.5, -3], offset: -3, box: 0 } },
          problem: "Given D = 3xy âₓ + x² âᵧ C/m², find the total flux through the surface 0 < x, y < 1 m, z = −3 m.",
          lines: [
            { text: "The surface's normal is ±âz, so dS = dx dy âz.", focus: ["vs"] },
            { text: "D·âz = 0 everywhere, because D has no z-component. Ψ = 0.", focus: ["vs"], claims: [{ instance: "vs", readout: "F3", value: 0, unit: "" }] },
          ],
          covers: ["hw-2324-2.6"],
          trap: "Integrating 3xy over the square gives 0.75, which is flux of the wrong component. Only the normal component, D_z, counts.",
        },
        {
          id: "hw26c-vol", level: "tutorial", title: "HW02 2.6(c): charge in the cube, volume route",
          setup: { region: { system: "cart", ranges: [[0, 2], [0, 2], [0, 2]], density: "hw-2.6", drawScale: 0.7 } },
          problem: "Calculate the total charge in the region 0 < x, y, z < 2 m.",
          lines: [
            { text: "ρv = ∇·D = 3y C/m³.", focus: ["region"] },
            { text: "Q = ∫₀²∫₀²∫₀² 3y dx dy dz = 3 × (2) × (2) × (2) = 24 C, using ∫₀² y dy = 2.", focus: ["region"], claims: [{ instance: "region", readout: "Q", value: 24, unit: "C" }] },
          ],
          covers: ["hw-2324-2.6"],
          trap: "Integrating ρv over only the y-range gives 6. The volume integral needs all three ranges.",
        },
        {
          id: "hw26c-surf", level: "exam", title: "The same charge, surface route",
          setup: { vs: { field: "hw-2.6", plane: "xy", probe: [1, 1, 1], offset: 1, box: 2 } },
          problem: "Verify the charge in 0 < x, y, z < 2 m by computing the flux of D out of all six faces.",
          lines: [
            { text: "x = 2: +∫₀²∫₀² 6y dy dz = 24. x = 0: Dₓ = 0, contributing 0.", focus: ["vs"] },
            { text: "y = 2 (out) and y = 0 (in): Dᵧ = x² on both, so the two cancel.", focus: ["vs"] },
            { text: "z = 0 and z = 2: no z-component, contributing 0. Total: 24 C, as the divergence theorem promises.", focus: ["vs"], claims: [{ instance: "vs", readout: "boxFlux", value: 24, unit: "" }] },
          ],
          covers: ["hw-2324-2.6"],
          trap: "Counting the y-faces twice as outward. On y = 0 the outward normal is −âᵧ, so its flux is −∫x² dx dz.",
        },
      ],
      asks: [
        { id: "which-route", q: "Which route should I take?", a: "Whichever is shorter. A simple ρv over a box favours the volume route; a field that vanishes on most faces favours the surface route. Exam questions often ask for one route and let you check with the other." },
        { id: "normal-sign", q: "How do I get the sign on each face?", tags: ["DIV_THEOREM_FACES"], a: "Always use the outward normal. On the face x = 0 of a cube, the outward normal is −âₓ, so the flux there is −∫Dₓ dy dz." },
        { id: "gauss", q: "Is this just Gauss's law?", a: "Yes, with the divergence theorem supplying the maths: ∮D·dS = ∫∇·D dv = ∫ρv dv = Q_enc. The integral and point forms are the same law at two scales." },
        { id: "parallel", q: "When is a face's flux zero?", tags: ["DIV_THEOREM_FACES"], a: "When D has no component along that face's normal anywhere on it, as on z-faces when D has no z-part. Check this first; it can remove whole integrals." },
        { id: "units", q: "Why is the answer in coulombs, not C/m²?", a: "Flux of D is D (C/m²) times area (m²), which gives coulombs. That is exactly why it can equal a charge." },
        { id: "curved", q: "Does it work for curved surfaces too?", a: "Yes. The theorem holds for any closed surface. Cubes and spheres are just the easiest to integrate over." },
      ],
      checks: [
        {
          id: "equal", title: "Check: the two routes", show: ["vs", "eq"], hide: ["region"], patch: { vs: { field: "hw-2.6", plane: "xy", probe: [1, 1, 1], offset: 1, box: 2 } },
          note: "Four checks on the divergence theorem. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "equal", type: "choose", prompt: "For any closed surface, the net outward flux of D equals…", dimension: "recognition",
            options: [
              choice("right", "∫ρv dv, the charge enclosed", true, "Right: the divergence theorem, then ∇·D = ρv."),
              choice("rho", "ρv at the centre", false, "Flux is a total; it needs the whole volume integral."),
              choice("zero", "always zero", false, "Only if there is no net charge inside."),
            ] },
        },
        {
          id: "predict-shrink", title: "Check: a smaller box",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-shrink", type: "predict-drag", prompt: "The box shrinks to side 1, still centred at (1, 1, 1). Drag the net flux out to your prediction.", target: { instance: "vs", readout: "boxFlux" }, range: [0, 30], unit: "", relTol: 0.05, reveal: { vs: { box: 1 } }, dimension: "application",
            feedback: { close: "Right: 3. ρv = 3y averages 3 over y from 0.5 to 1.5, times a volume of 1.", far: "Q = ∫3y dv over the unit box = 3 × 1 (the mean of y) × 1 = 3." } },
        },
        {
          id: "zero-face", title: "Check: which faces count?",
          note: "Think before integrating.",
          interaction: { id: "zero-face", type: "choose", prompt: "D = 3xy âₓ + x² âᵧ. Through which pair of cube faces is the flux certainly zero?", dimension: "conceptual",
            options: [
              choice("z", "z = 0 and z = 2", true, "Right: D has no z-component."),
              choice("y", "y = 0 and y = 2", false, "Dᵧ = x² is not zero; it flows in on one and out on the other, cancelling as a pair.", "DIV_THEOREM_FACES"),
              choice("x", "x = 0 and x = 2", false, "Dₓ = 0 on x = 0, but on x = 2, Dₓ = 6y."),
            ] },
        },
        {
          id: "q-num", title: "Check: HW02 2.6(c)",
          note: "Last one.",
          interaction: { id: "q-num", type: "numeric", prompt: "D = 3xy âₓ + x² âᵧ C/m². Find the total charge in 0 < x, y, z < 2 m.", answer: { value: 24, unit: "C" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 6, unit: "C", errorClass: "conceptual", feedback: "That integrates over y only. Include the x- and z-ranges." }],
            hints: ["ρv = 3y.", "∫₀² y dy = 2.", "3 × 2 × 2 × 2."] },
          covers: ["hw-2324-2.6"],
        },
      ],
      recap: {
        points: [
          "Divergence theorem with D: ∮D·dS = ∫ρv dv = Q_enc.",
          "Take whichever route is shorter, then check with the other.",
          "Outward normals on every face; the field's absent components kill whole faces.",
          "Flux of D is in coulombs, like the charge it equals.",
        ],
        traps: ["Wrong sign on inward-facing faces.", "Integrating the wrong component over a face.", "A partial volume integral."],
      },
    },
  ],
});
```

Check the `predict-shrink` value by hand: ∫3y over x ∈ [0.5, 1.5], y ∈ [0.5, 1.5], z ∈ [0.5, 1.5] = 3 × 1 × 1 × 1 = 3.

- [ ] **Step 2: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): point form Idea 2, the divergence theorem with D (HW02 2.6)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 7: Coverage, e2e and axe

- [ ] **Step 1: Extend coverage.**
  - In `f3-coverage.test.ts`, add `"em1.electrostatics.gauss-applications"` and `"em1.electrostatics.divergence"` to the per-concept loop.
  - Add the assertions:

    ```ts
    expect(mainOf("em1.electrostatics.gauss-applications")).toEqual(["idea-charge-density", "idea-patch-flux", "idea-spheres"]);
    expect(mainOf("em1.electrostatics.divergence")).toEqual(["idea-point-form", "idea-div-theorem"]);
    ```

  - gauss-applications keeps its older misconceptions (`outside-twice` and the rest). The concept-wide requirement includes every tag the concept declares, so any older tag not covered by the new ideas will show up as a gap. If one does, add it to the most relevant idea's `requires.misconceptions` **and** tag one of that idea's asks or check options with it, then log a ruling. Check the old tags first with `grep -n "tag:" packages/course-em1/src/concepts/gauss-applications.ts`.

- [ ] **Step 2: The e2e test** at `app/apps/web/e2e/gauss-apps.spec.ts`. Mirror G1's kicker test for the five blocks:
  - `idea-charge-density`: "Along a line: Q = ∫ρL dl", "Explanation 1 of 4"
  - `idea-patch-flux`: "A share of the whole", "1 of 4"
  - `idea-spheres`: "Inside a charged ball", "1 of 4"
  - `idea-point-form`: "Gauss's law, one point at a time", "1 of 4"
  - `idea-div-theorem`: "Two routes to the same charge", "1 of 4"

  The kickers read "Idea n · <title> · Explanation 1 of N", with n counting per concept.

  Add one readout test: step 3 of `idea-charge-density` (the Jacobian step) shows "829.7" in `.readouts`.

- Add to `a11y.spec.ts`:
  - `concept("em1.electrostatics.gauss-applications", "mode=learn")`
  - `concept("em1.electrostatics.divergence", "mode=learn&lesson=main&block=idea-div-theorem")`

- [ ] **Step 3: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web packages/course-em1 && git commit -m "test: Gauss applications and point form coverage, e2e and axe

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 8: Verification and handback

- [ ] Run the full suite.
- [ ] Walk each idea in the dev server at 1360×900:
  - The ball's hatch should be visible.
  - The patch region should show the face.
  - The cube's box should be drawn.
- [ ] Write the ledger line `Task 8: verification — <counts>` and stop for Claude's review.

## Self-Review Notes

- **Solved with SymPy:**
  - HW02 2.5: 496 mC, 36.11 nC and 829.69 C.
  - MST Q4(b): 1.6 nC. MST Q3(a): 1.0417 µC.
  - HW02 2.6: 3y; 0 through the z-face; 24 C by both routes.
  - Finals 23-24 Q2(b): 2.2253 × 10⁻¹⁰ and −2.6704 × 10⁻¹³ C/m³.
  - Balls: 0.5, 0.4444, 1, 1.333 and 1.185 µC/m².
  - Q.08 with a = 0.5 at r = 2: 100.5 nC.
- **From student work:** the misread density in HW02 2.5(c) (3.05 r sin θ gives 5717 C) became the distractor for `sphere-c`.
