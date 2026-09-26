# Forma Plan F4: Vector Calculus at Full Depth

> **For agentic workers (Codex):** read `AGENTS.md` first. **Plans F1, F2 and F3 must be complete**, because this plan uses `scalar-slice`, `vector-slice`, the F2 field library, and F3's patterns. Transcribe the content exactly. Every value was solved with SymPy from the source questions (`scratchpad/solve/f2.py`, `lib.py`), not from any student's work.

**Goal:** `em1.math.vector-calculus` as three in-depth ideas:
- ① Gradient
- ② Divergence and the divergence theorem
- ③ Curl and Stokes' theorem

The worked examples come from Sadiku Tutorial 3.4, 3.6 and 3.8, and from HW02 2.1 and 2.2 (reissued as HW01 2024-25). The checks cover mid-semester Q5(a) and Finals 2024-25 Q4(a)(iv). The traps come from real slips in graded HW02 work:
- a dropped 1/(r sin θ), which gave −2 aφ instead of −4 aφ;
- a cylindrical operator applied to a cartesian field;
- a sign slip on z.

**Architecture:** the same as Plan F3. The concept is unlocked in `concepts/calculus.ts`, and its `main` lesson has three idea blocks. There are four new templates.

**Spec:** `docs/superpowers/specs/2026-09-26-forma-emag-electrostatics-assessments-design.md` §3. Resources: `lec2a`, `tut-vec`, `hw02-2324`, `mst2324`, `f2425`.

**Ledger:** `.superpowers/sdd/2026-09-27-forma-plan-f4-vector-calculus/progress.md`

## Global Constraints

The constraints are those of Plan F3: the depth floor, the number-lint rules, the givens policy for values the plate can't show, and item ids.

- Slice readouts `g1`–`g3`, `F1`–`F3` and `c1`–`c3` are **native** components (ρ, φ, z or r, θ, φ for curved fields). Claims use unit `""`.
- The probe positions for curved fields are the cartesian images of the question's points, computed in code. For example, R(1, π/6, π/2) becomes `[0, 0.5, √3/2]`.

## Review Focus

1. **The HW02 2.1(c) trap.** The plate and the worked example give −4 aφ. The trap names −2 aφ as the result of dropping 1/(r sin θ). Tested by a claim (Task 2) and the template `grad-cyl-phi`.
2. **Slice orientation.** For a probe off the y = 0 plane, the x–z slice uses `offset` equal to the probe's y, so the probe sits on the drawn plane. Tested in Task 5 (e2e readout on a curved field).
3. **Loop sign in the x–z plane.** The Idea ③ note says "+2 along −y" for `tut-3.6a` at y = −2. This matches F2's orientation test. It is a claim in Task 4.
4. **Template distractors.** No distractor equals the answer: `div-cart` when y₀ = 0, `curl-z` when b·y₀ = a·z₀, and `grad-cyl-phi` never at φ = 90°. Tested in Task 1.
5. **Coverage.** Each idea owns one objective, and removing any one names a gap. Tested in Task 5.

---

### Task 1: Templates

**Files:**
- Modify: `app/packages/course-em1/src/templates.ts`
- Test: `app/packages/course-em1/test/templates-f4.test.ts` (new)

- [ ] **Step 1: Write the failing test** at `app/packages/course-em1/test/templates-f4.test.ts`

```ts
import { instantiate } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { templates } from "../src";

describe("F4 templates", () => {
  for (const id of ["grad-comp", "grad-cyl-phi", "div-cart", "curl-z"]) {
    it(`${id}: 60 seeds, finite, worked, no distractor equals the answer`, () => {
      const t = templates.find((x) => x.id === id)!;
      expect(t, id).toBeDefined();
      for (let seed = 1; seed <= 60; seed++) {
        const v = instantiate(t, seed);
        expect(Number.isFinite(v.spec.answer.value)).toBe(true);
        expect(v.worked.length).toBeGreaterThan(0);
        for (const d of v.spec.distractors) expect(d.value !== v.spec.answer.value, `${id}#${seed}`).toBe(true);
      }
    });
  }
  it("grad-comp reproduces HW02 2.1(a): a = 10, b = 2, y = 4 gives 132", () => {
    expect(templates.find((x) => x.id === "grad-comp")!.solve({ a: 10, b: 2, y: 4 } as never).answer.value).toBe(132);
  });
  it("grad-cyl-phi divides by ρ: c = 2, ρ = 2, φ = 0° gives 2, and the distractor is 4", () => {
    const s = templates.find((x) => x.id === "grad-cyl-phi")!.solve({ c: 2, rho: 2, k: 0 } as never);
    expect(s.answer.value).toBe(2);
    expect(s.distractors![0]!.value).toBe(4);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/course-em1/test/templates-f4.test.ts`
Expected: FAIL (undefined).

- [ ] **Step 3: Implement.** Add to `templates.ts`, reusing F3's `sig` and `DEG`, and append the four constants to the `templates` array.

```ts
const CALC = "em1.math.vector-calculus";

const gradComp = defineTemplate<{ a: number; b: number; y: number }>({
  id: "grad-comp",
  params: { a: { min: 2, max: 10, step: 2 }, b: { min: 1, max: 4, step: 1 }, y: { min: 1, max: 5, step: 1 } },
  prompt: (p) => `V = ${p.a}xyz − ${p.b}x²z. Find ∂V/∂x, the x-component of ∇V, at P(−1, ${p.y}, 3).`,
  solve: (p) => ({
    answer: { value: 3 * p.a * p.y + 6 * p.b, unit: "" },
    distractors: [{ value: 3 * p.a * p.y - 6 * p.b, unit: "", errorClass: "sign", feedback: "∂(−bx²z)/∂x = −2bxz, and x = −1 makes it +2bz. Substitute the sign of x carefully." }],
  }),
  hints: () => ["Treat y and z as constants.", "∂V/∂x = ayz − 2bxz.", "Now substitute x = −1, keeping the sign."],
  worked: (p) => [
    { text: `∂V/∂x = ${p.a}yz − ${2 * p.b}xz.` },
    { text: `At (−1, ${p.y}, 3): ${p.a}(${p.y})(3) − ${2 * p.b}(−1)(3) = ${3 * p.a * p.y} + ${6 * p.b} = ${3 * p.a * p.y + 6 * p.b}.` },
  ],
  dimension: "computational",
  tags: { concepts: [CALC], misconceptions: [], difficulty: 2 },
});

const PHIS = [0, 60, 120, 180];
const gradCylPhi = defineTemplate<{ c: number; rho: number; k: number }>({
  id: "grad-cyl-phi",
  params: { c: { min: 1, max: 6, step: 1 }, rho: { min: 2, max: 5, step: 1 }, k: { min: 0, max: 3, step: 1 } },
  prompt: (p) => `U = ${p.c}ρ sin φ + ρz. Find the φ-component of ∇U at (${p.rho}, ${PHIS[p.k]}°, 1).`,
  solve: (p) => {
    const cosp = Math.cos(PHIS[p.k]! * DEG);
    return {
      answer: { value: sig(p.c * cosp, 6), unit: "" },
      distractors: [{ value: sig(p.rho * p.c * cosp, 6), unit: "", errorClass: "conceptual", tag: "MISSING_SCALE_FACTORS", feedback: "That's ∂U/∂φ without the 1/ρ. The φ-component of the gradient is (1/ρ)∂U/∂φ." }],
    };
  },
  hints: () => ["The φ-component is (1/ρ)∂U/∂φ.", `∂U/∂φ = cρ cos φ.`, "The ρ cancels."],
  worked: (p) => [
    { text: `∂U/∂φ = ${p.c}ρ cos φ; divide by ρ: ${p.c} cos φ.` },
    { text: `At φ = ${PHIS[p.k]}°: ${p.c} × ${sig(Math.cos(PHIS[p.k]! * DEG), 4)} = ${sig(p.c * Math.cos(PHIS[p.k]! * DEG), 6)}.` },
  ],
  dimension: "computational",
  tags: { concepts: [CALC], misconceptions: ["MISSING_SCALE_FACTORS"], difficulty: 2 },
});

const divCart = defineTemplate<{ p: number; q: number; s: number; x0: number; y0: number }>({
  id: "div-cart",
  params: { p: { min: 1, max: 5, step: 1 }, q: { min: 1, max: 5, step: 1 }, s: { min: 1, max: 5, step: 1 }, x0: { min: -3, max: 3, step: 1 }, y0: { min: -3, max: 3, step: 1 } },
  prompt: (v) => `A = ${v.p}xy âₓ + ${v.q}y² âᵧ − ${v.s}xz âz. Find ∇·A at (${v.x0}, ${v.y0}, 2).`,
  solve: (v) => {
    const ans = v.p * v.y0 + 2 * v.q * v.y0 - v.s * v.x0;
    const wrong = v.p * v.y0 + v.q * v.y0 - v.s * v.x0;
    return {
      answer: { value: ans, unit: "" },
      distractors: wrong !== ans ? [{ value: wrong, unit: "", errorClass: "arithmetic", feedback: "∂(qy²)/∂y = 2qy. The power comes down." }] : [],
    };
  },
  hints: () => ["Differentiate each component along its own axis.", "∂(pxy)/∂x = py; ∂(qy²)/∂y = 2qy; ∂(−sxz)/∂z = −sx.", "Add, then substitute."],
  worked: (v) => [
    { text: `∇·A = ${v.p}y + ${2 * v.q}y − ${v.s}x.` },
    { text: `At (${v.x0}, ${v.y0}, 2): ${v.p * v.y0} + ${2 * v.q * v.y0} − ${v.s * v.x0} = ${v.p * v.y0 + 2 * v.q * v.y0 - v.s * v.x0}.` },
  ],
  dimension: "computational",
  tags: { concepts: [CALC], misconceptions: [], difficulty: 2 },
});

const curlZ = defineTemplate<{ a: number; b: number; x0: number; y0: number; z0: number }>({
  id: "curl-z",
  params: { a: { min: 1, max: 5, step: 1 }, b: { min: 1, max: 5, step: 1 }, x0: { min: -3, max: 3, step: 1 }, y0: { min: -3, max: 3, step: 1 }, z0: { min: -3, max: 3, step: 1 } },
  prompt: (v) => `A = ${v.a}yz âₓ + ${v.b}xy âᵧ. Find the z-component of ∇ × A at (${v.x0}, ${v.y0}, ${v.z0}).`,
  solve: (v) => {
    const ans = v.b * v.y0 - v.a * v.z0;
    return {
      answer: { value: ans, unit: "" },
      distractors: ans !== 0 ? [{ value: -ans, unit: "", errorClass: "sign", feedback: "(∇ × A)_z = ∂Aᵧ/∂x − ∂Aₓ/∂y, in that order." }] : [],
    };
  },
  hints: () => ["(∇ × A)_z = ∂Aᵧ/∂x − ∂Aₓ/∂y.", "∂(bxy)/∂x = by; ∂(ayz)/∂y = az.", "Subtract in that order."],
  worked: (v) => [
    { text: `(∇ × A)_z = ${v.b}y − ${v.a}z.` },
    { text: `At (${v.x0}, ${v.y0}, ${v.z0}): ${v.b * v.y0} − ${v.a * v.z0} = ${v.b * v.y0 - v.a * v.z0}.` },
  ],
  dimension: "computational",
  tags: { concepts: [CALC], misconceptions: [], difficulty: 2 },
});
```

Check the edge cases by hand:
- `curl-z` has no distractor when the answer is 0, so the distractor can never equal it.
- `grad-cyl-phi` uses φ ∈ {0°, 60°, 120°, 180°} and ρ ≥ 2, so ρ·c·cos φ never equals c·cos φ.

- [ ] **Step 4: Run it and see it pass**

Run: `pnpm vitest run packages/course-em1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): templates for gradient, cylindrical gradient, divergence and curl

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: The concept, and Idea ①, Gradient

**Files:**
- Create: `app/packages/course-em1/src/concepts/calculus.ts`, `app/packages/course-em1/src/plates/idea-gradient.ts`
- Modify: `concepts/electrostatics.ts` (remove `locked("em1.math.vector-calculus", …)`), `index.ts` (add `vectorCalculus` after `vectors`), `plates/index.ts`

- [ ] **Step 1: The concept** in `concepts/calculus.ts`

```ts
import { meta, SLIDES_2A, src } from "../sources";

const ID = "em1.math.vector-calculus";

export const vectorCalculus = {
  id: ID,
  title: "Gradient, divergence and curl",
  unit: 2,
  objectives: [
    "Find the gradient of a scalar field in cartesian, cylindrical and spherical coordinates, and use it for directional derivatives.",
    "Find the divergence of a vector field in all three systems, and read it as outward flux per unit volume (the divergence theorem).",
    "Find the curl in all three systems, and read it as circulation per unit area (Stokes' theorem).",
  ],
  prerequisites: [{ conceptId: "em1.math.vectors", minMastery: 0.3 }],
  misconceptions: [
    { tag: "MISSING_SCALE_FACTORS", description: "Drops 1/ρ, 1/r or 1/(r sin θ) in curved-coordinate operators.", remediation: `${ID}/main` },
    { tag: "OPERATOR_SYSTEM_MISMATCH", description: "Applies one coordinate system's formula to a field written in another.", remediation: `${ID}/main` },
    { tag: "GRAD_DIV_TYPE", description: "Mixes up which operators return scalars and which return vectors.", remediation: `${ID}/main` },
  ],
  examLinks: [],
  sources: [src(SLIDES_2A, "Vector calculus")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Gradient, divergence and curl (in depth)",
      minutes: 75,
      blocks: [{ ...meta("vivid", src(SLIDES_2A, "Gradient")), id: "idea-gradient", type: "plate" as const, plateId: "idea-gradient" }],
    },
  ],
};
```

- [ ] **Step 2: The idea plate** in `plates/idea-gradient.ts`

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const tpl = (id: string) => instantiate(templates.find((t) => t.id === id)!, 1);
const gc = tpl("grad-comp");
const gcyl = tpl("grad-cyl-phi");
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const R_PT = [0, 0.5, Math.sqrt(3) / 2]; // R(1, π/6, π/2)

export const ideaGradient = defineIdeaPlate({
  id: "idea-gradient",
  title: "The gradient",
  requires: { objectives: [0], items: ["tutorial:tut-3.4", "hw-2324-2.1", "mst-2324-q5a"], misconceptions: ["MISSING_SCALE_FACTORS"] },
  instances: [
    { id: "sl", component: "scalar-slice", params: { field: "hill", probe: [1, 0, 0.5], plane: "xz", offset: 0 } },
    { id: "eq", component: "equation", params: eqp(R`\nabla f=\dfrac{\partial f}{\partial x}\mathbf a_x+\dfrac{\partial f}{\partial y}\mathbf a_y+\dfrac{\partial f}{\partial z}\mathbf a_z`, "the gradient in cartesian coordinates") },
  ],
  ideas: [
    {
      id: "gradient",
      title: "The gradient",
      objectives: [0],
      explain: [
        {
          id: "uphill", title: "The gradient points uphill", show: ["sl"], focus: ["sl"],
          note: "A scalar field gives a number at every point: a temperature, a height, a potential V. Its gradient ∇f is a vector that points in the direction f increases fastest, with a length equal to that fastest rate. On the plate, f = 4 − x² − z² is a hill with its top at the origin, and the arrows point uphill, toward the top. At the probe (1, 0, 0.5), f = 2.75 and ∇f = −2âₓ − âz: the steepest ascent is back toward the peak, at 2.236 per metre.",
          claims: [{ instance: "sl", readout: "f", value: 2.75, unit: "" }, { instance: "sl", readout: "g1", value: -2, unit: "" }, { instance: "sl", readout: "g3", value: -1, unit: "" }, { instance: "sl", readout: "gmag", value: 2.23607, unit: "" }],
        },
        {
          id: "cart", title: "In cartesian: three partial derivatives", show: ["eq"], patch: { sl: { field: "tut-3.4", probe: [1, 2, 3], offset: 2 } }, focus: ["sl", "eq"],
          note: "In cartesian coordinates the gradient is the three partial derivatives: ∇f = (∂f/∂x)âₓ + (∂f/∂y)âᵧ + (∂f/∂z)âz. For Φ = xy + yz + xz, ∂Φ/∂x = y + z, ∂Φ/∂y = x + z and ∂Φ/∂z = x + y. At (1, 2, 3) that gives ∇Φ = 5âₓ + 4âᵧ + 3âz. The plate slices the field at y = 2 so you can see it; the readouts are the full three-dimensional gradient.",
          claims: [{ instance: "sl", readout: "g1", value: 5, unit: "" }, { instance: "sl", readout: "g2", value: 4, unit: "" }, { instance: "sl", readout: "g3", value: 3, unit: "" }],
        },
        {
          id: "scale", title: "Cylindrical and spherical: scale factors", patch: { sl: { field: "hw-2.1c", probe: R_PT, offset: 0.5 }, eq: eqp(R`\nabla V=\dfrac{\partial V}{\partial r}\mathbf a_r+\dfrac1r\dfrac{\partial V}{\partial\theta}\mathbf a_\theta+\dfrac{1}{r\sin\theta}\dfrac{\partial V}{\partial\phi}\mathbf a_\phi`, "the gradient in spherical coordinates") }, focus: ["sl", "eq"],
          note: "In curved coordinates a step in an angle is not a step in length, so each angle derivative is divided by its scale factor. Cylindrical: ∇V = ∂V/∂ρ âρ + (1/ρ)∂V/∂φ âφ + ∂V/∂z âz. Spherical: ∇V = ∂V/∂r âr + (1/r)∂V/∂θ âθ + (1/(r sin θ))∂V/∂φ âφ. Both are on the formula sheet, and 1/ρ, 1/r and 1/(r sin θ) are exactly the factors students drop. For W = (4/r) sin θ cos φ at R(1, π/6, π/2), the φ-component is (1/(r sin θ))(−4 sin θ sin φ / r) = −4.",
          claims: [{ instance: "sl", readout: "g3", value: -4, unit: "" }],
        },
        {
          id: "directional", title: "Directional derivatives", patch: { sl: { field: "tut-3.4", probe: [1, 2, 3], offset: 2 }, eq: eqp(R`\dfrac{df}{dl}=\nabla f\cdot\mathbf a_l`, "the directional derivative") }, focus: ["sl", "eq"],
          note: "The rate of change of f in any direction â is the dot product ∇f·â. For Φ at (1, 2, 3), heading toward (3, 4, 4), the direction is (2, 2, 1)/3, so the rate is (5 × 2 + 4 × 2 + 3 × 1)/3 = 7. No direction can beat |∇Φ| = √50 = 7.071, which is why the gradient is 'steepest ascent'. In electrostatics this becomes E = −∇V: the field points steepest downhill in potential.",
          claims: [{ instance: "sl", readout: "gmag", value: 7.07107, unit: "" }],
        },
      ],
      examples: [
        {
          id: "tut34", level: "basic", title: "Tutorial 3.4: gradient and directional derivative",
          setup: { sl: { field: "tut-3.4", probe: [1, 2, 3], offset: 2 } },
          problem: "Given Φ = xy + yz + xz, find ∇Φ at (1, 2, 3), and the directional derivative of Φ there toward (3, 4, 4).",
          lines: [
            { text: "∂Φ/∂x = y + z, ∂Φ/∂y = x + z, ∂Φ/∂z = x + y.", focus: ["sl"] },
            { text: "At (1, 2, 3): ∇Φ = 5âₓ + 4âᵧ + 3âz.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: 5, unit: "" }, { instance: "sl", readout: "g2", value: 4, unit: "" }, { instance: "sl", readout: "g3", value: 3, unit: "" }] },
            { text: "Toward (3, 4, 4) the displacement is (2, 2, 1), of length 3, so â = (2, 2, 1)/3.", focus: ["sl"] },
            { text: "Directional derivative: ∇Φ·â = (10 + 8 + 3)/3 = 7.", focus: ["sl"] },
          ],
          covers: ["tutorial:tut-3.4"],
          trap: "Using the displacement (2, 2, 1) without dividing by its length 3 gives 21. A directional derivative needs a unit vector.",
        },
        {
          id: "hw21b", level: "tutorial", title: "HW02 2.1(b): a cylindrical gradient",
          setup: { sl: { field: "hw-2.1b", probe: [0, 2, -1], offset: 2 } },
          problem: "Find the gradient of U = 2ρ sin φ + ρz and evaluate it at Q(2, 90°, −1).",
          lines: [
            { text: "∂U/∂ρ = 2 sin φ + z; ∂U/∂φ = 2ρ cos φ; ∂U/∂z = ρ.", focus: ["sl"] },
            { text: "Divide the φ-derivative by ρ: (1/ρ)(2ρ cos φ) = 2 cos φ. So ∇U = (2 sin φ + z)âρ + 2 cos φ âφ + ρ âz.", focus: ["sl"] },
            { text: "At Q(2, 90°, −1): ∇U = (2 − 1)âρ + 0âφ + 2âz = âρ + 2âz.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: 1, unit: "" }, { instance: "sl", readout: "g2", value: 0, unit: "" }, { instance: "sl", readout: "g3", value: 2, unit: "" }] },
          ],
          covers: ["hw-2324-2.1"],
          trap: "Getting −âρ: 2 sin 90° + z with z = −1 is +1. Substitute signs one at a time.",
        },
        {
          id: "hw21c", level: "exam", title: "HW02 2.1(c): a spherical gradient",
          setup: { sl: { field: "hw-2.1c", probe: R_PT, offset: 0.5 } },
          problem: "Find the gradient of W = (4/r) sin θ cos φ and evaluate it at R(1, π/6, π/2).",
          lines: [
            { text: "∂W/∂r = −(4/r²) sin θ cos φ.", focus: ["sl"] },
            { text: "(1/r)∂W/∂θ = (4/r²) cos θ cos φ.", focus: ["sl"] },
            { text: "(1/(r sin θ))∂W/∂φ = (1/(r sin θ))(−(4/r) sin θ sin φ) = −(4/r²) sin φ: the sin θ cancels.", focus: ["sl"] },
            { text: "At R(1, π/6, π/2), cos φ = 0 and sin φ = 1, so ∇W = 0âr + 0âθ − 4âφ.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: 0, unit: "" }, { instance: "sl", readout: "g2", value: 0, unit: "" }, { instance: "sl", readout: "g3", value: -4, unit: "" }] },
          ],
          covers: ["hw-2324-2.1"],
          trap: "Stopping at ∂W/∂φ = −(4/r) sin θ sin φ and substituting gives −2âφ, not −4âφ. The φ-derivative must be divided by r sin θ.",
        },
      ],
      asks: [
        { id: "vector", q: "Is the gradient a scalar or a vector?", tags: ["GRAD_DIV_TYPE"], a: "A vector. The gradient takes a scalar field and returns a vector field. Divergence goes the other way: vector in, scalar out. Curl takes a vector and returns a vector." },
        { id: "why-scale", q: "Why does ∂/∂φ need the 1/ρ?", tags: ["MISSING_SCALE_FACTORS"], a: "∂V/∂φ is the change per radian, not per metre. At distance ρ from the axis, one radian of φ is ρ metres of arc, so the change per metre is (1/ρ)∂V/∂φ. The gradient must be per metre in every direction." },
        { id: "system", q: "Can I use the cartesian formula on a cylindrical V?", tags: ["OPERATOR_SYSTEM_MISMATCH"], a: "No. If V is written in ρ, φ and z, use the cylindrical formula, or rewrite V in x, y and z first. Mixing them, such as applying ∂/∂x to a function of ρ, gives nonsense." },
        { id: "perp", q: "Why is the gradient perpendicular to contour lines?", a: "Along a contour f doesn't change, so ∇f·â = 0 for any direction â along it. A zero dot product means perpendicular. Equipotential surfaces and field lines meet at right angles for exactly this reason." },
        { id: "zero", q: "What does ∇f = 0 mean?", a: "The field is flat there in every direction: a peak, a valley or a saddle. On the plate's hill, the gradient is zero at the top, which is the origin." },
        { id: "e-grad", q: "How does this connect to E = −∇V?", a: "The electric field is minus the gradient of the potential. The gradient points uphill in V, so E points downhill, from high potential to low, which is the way a positive charge is pushed." },
        { id: "units", q: "What are the units of a gradient?", a: "The units of f per metre. For a potential in volts, ∇V is in volts per metre, which is exactly the unit of electric field." },
      ],
      checks: [
        {
          id: "sph-phi", title: "Check: the spherical φ-component", show: ["sl", "eq"], patch: { sl: { field: "hill", probe: [1, 0, 0.5], offset: 0 } },
          note: "Five checks on the gradient. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "sph-phi", type: "choose", prompt: "In spherical coordinates, the φ-component of ∇V is…", dimension: "recognition",
            options: [
              choice("right", "(1/(r sin θ)) ∂V/∂φ", true, "Right: the φ edge is r sin θ dφ."),
              choice("bare", "∂V/∂φ", false, "That's per radian, not per metre. Divide by r sin θ.", "MISSING_SCALE_FACTORS"),
              choice("half", "(1/r) ∂V/∂φ", false, "1/r belongs to θ. φ needs 1/(r sin θ).", "MISSING_SCALE_FACTORS"),
            ] },
        },
        {
          id: "predict-hill", title: "Check: further from the top",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-hill", type: "predict-drag", prompt: "The probe moves from (1, 0, 0.5) to (2, 0, 1), twice as far from the top. Drag |∇f| to your prediction.", target: { instance: "sl", readout: "gmag" }, range: [0, 8], unit: "", relTol: 0.05, reveal: { sl: { probe: [2, 0, 1] } }, dimension: "conceptual",
            feedback: { close: "Right: twice as far, twice as steep, 4.472.", far: "∇f = −2x âₓ − 2z âz, so its size grows with the distance from the top: 4.472." } },
        },
        {
          id: "cart-num", title: "Check: a cartesian component",
          note: "HW02 2.1(a) with your numbers.",
          interaction: { id: "cart-num", type: "numeric", prompt: gc.prompt, answer: gc.spec.answer, distractors: gc.spec.distractors, relTol: gc.spec.relTol, hints: gc.hints, template: "grad-comp", dimension: "computational" },
          covers: ["hw-2324-2.1"],
        },
        {
          id: "cyl-num", title: "Check: a cylindrical component",
          note: "Mind the scale factor.",
          interaction: { id: "cyl-num", type: "numeric", prompt: gcyl.prompt, answer: gcyl.spec.answer, distractors: gcyl.spec.distractors, relTol: gcyl.spec.relTol, hints: gcyl.hints, template: "grad-cyl-phi", dimension: "computational" },
        },
        {
          id: "mst5a", title: "Check: mid-semester Q5(a)",
          note: "Last one: E = −∇V from the 2023 test.",
          interaction: { id: "mst5a", type: "numeric", prompt: "V = ρ²z³ + 5z cos φ volts. Find E_z = −(∇V)_z at P(2, π, 3).", answer: { value: -103, unit: "V/m" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 103, unit: "V/m", errorClass: "sign", feedback: "E = −∇V. The minus sign flips the gradient." }],
            hints: ["(∇V)_z = ∂V/∂z = 3ρ²z² + 5 cos φ.", "At ρ = 2, φ = π, z = 3: 108 − 5.", "Then negate."] },
          covers: ["mst-2324-q5a"],
        },
      ],
      recap: {
        points: [
          "∇f points in the direction of steepest increase; its size is that rate.",
          "Cartesian: the three partials. Cylindrical: 1/ρ on ∂/∂φ. Spherical: 1/r on ∂/∂θ and 1/(r sin θ) on ∂/∂φ.",
          "Directional derivative: ∇f·â, with â a unit vector.",
          "E = −∇V: the field points downhill in potential.",
        ],
        traps: ["Dropping 1/ρ or 1/(r sin θ).", "Using the displacement instead of the unit vector.", "Losing a sign when substituting."],
      },
    },
  ],
});
```

- [ ] **Step 3: Register it.**
  - In `plates/index.ts`, add the plate.
  - In `concepts/electrostatics.ts`, remove the `locked(…vector-calculus…)` line.
  - In `index.ts`, import `{ vectorCalculus } from "./concepts/calculus"` and put it right after `vectors`.
  - Run `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): vector calculus concept; Idea 1, the gradient (HW02 2.1, tutorial 3.4, MST Q5(a))

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: Idea ②, Divergence and the divergence theorem

**Files:** Create `app/packages/course-em1/src/plates/idea-divergence.ts`. Modify `plates/index.ts` and `concepts/calculus.ts` (append the block `{ ...meta("vivid", src(SLIDES_2A, "Divergence")), id: "idea-divergence", type: "plate", plateId: "idea-divergence" }`).

- [ ] **Step 1: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const dv = instantiate(templates.find((t) => t.id === "div-cart")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const S3 = Math.sqrt(3);
const B_PT = [S3 / 2, 0.5, 2]; // ρ = 1, φ = 30°, z = 2
const C_PT = [0.25, S3 / 4, S3 / 2]; // r = 1, θ = π/6, φ = π/3

export const ideaDivergence = defineIdeaPlate({
  id: "idea-divergence",
  title: "Divergence and the divergence theorem",
  requires: { objectives: [1], items: ["tutorial:tut-3.6", "hw-2324-2.2"], misconceptions: ["OPERATOR_SYSTEM_MISMATCH", "GRAD_DIV_TYPE"] },
  instances: [
    { id: "vs", component: "vector-slice", params: { field: "source", probe: [0.5, 0, 0.2], box: 0.4 } },
    { id: "eq", component: "equation", params: eqp(R`\nabla\cdot\mathbf A=\lim_{\Delta v\to0}\dfrac{\oint\mathbf A\cdot d\mathbf S}{\Delta v}`, "divergence as outward flux per unit volume") },
  ],
  ideas: [
    {
      id: "divergence",
      title: "Divergence and the divergence theorem",
      objectives: [1],
      explain: [
        {
          id: "outflow", title: "Divergence: outflow per unit volume", show: ["vs", "eq"], focus: ["vs"],
          note: "The divergence of a vector field at a point measures how much the field flows out of a tiny box around that point, per unit volume. Positive means a source, with the field spreading out; negative means a sink; zero means as much flows in as out. The plate's field A = xâₓ + yâᵧ + zâz spreads out everywhere. The hatched box has side 0.4 m, and the net flux out of it divided by its volume is exactly 3, the divergence.",
          claims: [{ instance: "vs", readout: "div", value: 3, unit: "" }, { instance: "vs", readout: "boxRatio", value: 3, unit: "" }],
        },
        {
          id: "cart", title: "In cartesian: add three derivatives", patch: { vs: { field: "tut-3.6a", probe: [1, -2, 3], box: 0.2, offset: -2 }, eq: eqp(R`\nabla\cdot\mathbf A=\dfrac{\partial A_x}{\partial x}+\dfrac{\partial A_y}{\partial y}+\dfrac{\partial A_z}{\partial z}`, "the divergence in cartesian coordinates") }, focus: ["vs", "eq"],
          note: "In cartesian coordinates ∇·A = ∂Aₓ/∂x + ∂Aᵧ/∂y + ∂A_z/∂z: differentiate each component along its own axis, then add. The result is a scalar. For A = yz âₓ + 4xy âᵧ + y âz: ∂(yz)/∂x = 0, ∂(4xy)/∂y = 4x and ∂(y)/∂z = 0, so ∇·A = 4x, which is 4 at (1, −2, 3). The plate's box, shrunk to 0.2 m, confirms it: flux ÷ volume = 4.",
          claims: [{ instance: "vs", readout: "div", value: 4, unit: "" }, { instance: "vs", readout: "boxRatio", value: 4, unit: "" }],
        },
        {
          id: "curved", title: "Curved coordinates: multiply, differentiate, divide", patch: { vs: { field: "hw-2.2b", probe: B_PT, box: 0, offset: 0.5 }, eq: eqp(R`\nabla\cdot\mathbf D=\dfrac1\rho\dfrac{\partial(\rho D_\rho)}{\partial\rho}+\dfrac1\rho\dfrac{\partial D_\phi}{\partial\phi}+\dfrac{\partial D_z}{\partial z}`, "the divergence in cylindrical coordinates") }, focus: ["vs", "eq"],
          note: "In curved coordinates the scale factors sit inside the derivatives. Cylindrical: ∇·D = (1/ρ)∂(ρDρ)/∂ρ + (1/ρ)∂Dφ/∂φ + ∂D_z/∂z. Spherical: ∇·D = (1/r²)∂(r²D_r)/∂r + (1/(r sin θ))∂(sin θ D_θ)/∂θ + (1/(r sin θ))∂D_φ/∂φ. Multiply first, then differentiate, then divide. For HW02's B = ρz² âρ + ρ sin²φ âφ + 2ρz sin²φ âz, this gives ∇·B = 2z² + sin 2φ + 2ρ sin²φ, which is 9.366 at ρ = 1, φ = 30°, z = 2.",
          claims: [{ instance: "vs", readout: "div", value: 9.36603, unit: "" }],
        },
        {
          id: "theorem", title: "The divergence theorem", patch: { vs: { field: "source", probe: [0.5, 0, 0.2], box: 1.2, offset: 0 }, eq: eqp(R`\oint_S\mathbf A\cdot d\mathbf S=\int_V\nabla\cdot\mathbf A\,dv`, "the divergence theorem") }, focus: ["vs", "eq"],
          note: "Add up the divergence over a whole volume and you get the total flux out through its surface: ∮ A·dS = ∫ ∇·A dv. For the plate's field ∇·A = 3 everywhere, so a box of side 1.2 m, with volume 1.728 m³, must have 5.184 of flux coming out, and it does. This is Gauss's law in disguise: with D, ∇·D = ρv, and the volume integral of ρv is the enclosed charge.",
          claims: [{ instance: "vs", readout: "boxFlux", value: 5.184, unit: "" }],
          givens: [{ value: 1.2 ** 3, unit: "m^3" }],
        },
      ],
      examples: [
        {
          id: "tut36a", level: "basic", title: "Tutorial 3.6(a): a cartesian divergence",
          setup: { vs: { field: "tut-3.6a", probe: [1, -2, 3], box: 0, offset: -2 } },
          problem: "Find the divergence of A = yz âₓ + 4xy âᵧ + y âz and evaluate it at (1, −2, 3).",
          lines: [
            { text: "∂(yz)/∂x = 0; ∂(4xy)/∂y = 4x; ∂(y)/∂z = 0.", focus: ["vs"] },
            { text: "∇·A = 4x, and at (1, −2, 3) that is 4.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 4, unit: "" }] },
          ],
          covers: ["tutorial:tut-3.6"],
          trap: "Differentiating a component along the wrong axis, such as ∂(yz)/∂y = z, adds terms that aren't there. Aₓ goes with ∂/∂x only.",
        },
        {
          id: "hw22b", level: "tutorial", title: "HW02 2.2(b): a cylindrical divergence",
          setup: { vs: { field: "hw-2.2b", probe: B_PT, box: 0, offset: 0.5 } },
          problem: "Evaluate the divergence of B = ρz² âρ + ρ sin²φ âφ + 2ρz sin²φ âz.",
          lines: [
            { text: "(1/ρ)∂(ρ·ρz²)/∂ρ = (1/ρ)∂(ρ²z²)/∂ρ = 2z².", focus: ["vs"] },
            { text: "(1/ρ)∂(ρ sin²φ)/∂φ = 2 sin φ cos φ = sin 2φ.", focus: ["vs"] },
            { text: "∂(2ρz sin²φ)/∂z = 2ρ sin²φ.", focus: ["vs"] },
            { text: "∇·B = 2z² + sin 2φ + 2ρ sin²φ. At ρ = 1, φ = 30°, z = 2: 8 + 0.866 + 0.5 = 9.366.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 9.36603, unit: "" }] },
          ],
          covers: ["hw-2324-2.2"],
          trap: "Using the cartesian pattern, ∂Bρ/∂ρ + ∂Bφ/∂φ + ∂B_z/∂z, gives z² + 2ρ sin φ cos φ + 2ρ sin²φ. The ρ inside the derivative and the 1/ρ outside are not optional.",
        },
        {
          id: "tut36c", level: "exam", title: "Tutorial 3.6(c): a spherical divergence",
          setup: { vs: { field: "tut-3.6c", probe: C_PT, box: 0, offset: S3 / 4 } },
          problem: "Find the divergence of C = 2r cos θ cos φ âr + √r âφ and evaluate it at (1, π/6, π/3).",
          lines: [
            { text: "Radial term: (1/r²)∂(r² · 2r cos θ cos φ)/∂r = (1/r²)(6r² cos θ cos φ) = 6 cos θ cos φ.", focus: ["vs"] },
            { text: "The θ-term is zero because C_θ = 0, and ∂(√r)/∂φ = 0.", focus: ["vs"] },
            { text: "∇·C = 6 cos θ cos φ. At (1, π/6, π/3): 6 × 0.8660 × 0.5 = 2.598.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 2.59808, unit: "" }] },
          ],
          covers: ["tutorial:tut-3.6"],
          trap: "Forgetting the r² inside the derivative gives ∂(2r cos θ cos φ)/∂r = 2 cos θ cos φ, a third of the right answer.",
        },
      ],
      asks: [
        { id: "scalar", q: "Is the divergence a vector?", tags: ["GRAD_DIV_TYPE"], a: "No, a scalar: one number at each point, the net outflow per unit volume. Seeing âₓ, âᵧ or âz in a divergence answer means something went wrong." },
        { id: "hw22a", q: "A = xy âₓ + y² âᵧ − xz âz: which formula?", tags: ["OPERATOR_SYSTEM_MISMATCH"], a: "Cartesian, because A is written with âₓ, âᵧ and âz in x, y and z. Here ∇·A = y + 2y − x = 3y − x. Applying the cylindrical formula to a cartesian field is a common and costly slip." },
        { id: "zero", q: "What does zero divergence mean?", a: "What flows in equals what flows out: no source and no sink. The swirl field −y âₓ + x âᵧ has zero divergence everywhere. It circulates but never piles up." },
        { id: "negative", q: "Can divergence be negative?", a: "Yes: that's a sink. Field lines converge there, as they do onto a negative charge. In electrostatics ∇·D = ρv, so negative divergence means negative charge density." },
        { id: "inside", q: "Why is it ∂(ρDρ)/∂ρ, not ∂Dρ/∂ρ?", tags: ["MISSING_SCALE_FACTORS"], a: "A tiny cylindrical box has a larger outer face than inner face, and each face's area is proportional to ρ. The flux through a face is Dρ times its area, so ρDρ is what changes across the box. Spherical boxes have faces proportional to r², hence r²D_r." },
        { id: "gauss", q: "How is divergence related to Gauss's law?", a: "Gauss's law in point form is ∇·D = ρv: outflow per unit volume equals charge per unit volume. Integrate both sides over a volume, apply the divergence theorem, and you recover ∮D·dS = Q_enc." },
      ],
      checks: [
        {
          id: "type", title: "Check: what kind of answer?", show: ["vs", "eq"], patch: { vs: { field: "tut-3.6a", probe: [1, -2, 3], box: 0, offset: -2 } },
          note: "Five checks on divergence. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "type", type: "choose", prompt: "The divergence of a vector field is…", dimension: "recognition",
            options: [
              choice("scalar", "a scalar", true, "Right: one number at each point."),
              choice("vector", "a vector", false, "Divergence adds the component derivatives into one number.", "GRAD_DIV_TYPE"),
              choice("positive", "always positive", false, "Sinks have negative divergence."),
            ] },
        },
        {
          id: "div-num", title: "Check: a divergence, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "div-num", type: "numeric", prompt: dv.prompt, answer: dv.spec.answer, distractors: dv.spec.distractors, relTol: dv.spec.relTol, hints: dv.hints, template: "div-cart", dimension: "computational" },
          covers: ["hw-2324-2.2"],
        },
        {
          id: "predict-x", title: "Check: move the probe",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-x", type: "predict-drag", prompt: "The probe moves from (1, −2, 3) to (3, −2, 3). Drag ∇·A to your prediction.", target: { instance: "vs", readout: "div" }, range: [0, 20], unit: "", relTol: 0.05, reveal: { vs: { probe: [3, -2, 3] } }, dimension: "conceptual",
            feedback: { close: "Right: ∇·A = 4x = 12.", far: "∇·A = 4x depends only on x: tripling x triples it, to 12." } },
        },
        {
          id: "which", title: "Check: which formula?",
          note: "From HW02 2.2(a).",
          interaction: { id: "which", type: "choose", prompt: "A = xy âₓ + y² âᵧ − xz âz. Its divergence is…", dimension: "application",
            options: [
              choice("right", "3y − x", true, "Right: y + 2y − x, using the cartesian formula."),
              choice("sign", "3y + x", false, "∂(−xz)/∂z = −x."),
              choice("cyl", "found with (1/ρ)∂(ρAρ)/∂ρ + …", false, "That's the cylindrical formula, but A is written in cartesian coordinates.", "OPERATOR_SYSTEM_MISMATCH"),
            ] },
          covers: ["hw-2324-2.2"],
        },
        {
          id: "theorem", title: "Check: the divergence theorem",
          note: "Last one.",
          interaction: { id: "theorem", type: "choose", prompt: "∇·A = 3 everywhere. The net flux out of a cube of side 2 is…", dimension: "application",
            options: [
              choice("24", "24", true, "Right: 3 × the volume, 8."),
              choice("3", "3", false, "3 is per unit volume. Multiply by the volume."),
              choice("12", "12", false, "The volume is 2³ = 8, not 2²."),
            ] },
        },
      ],
      recap: {
        points: [
          "∇·A is a scalar: the net outflow per unit volume.",
          "Cartesian: ∂Aₓ/∂x + ∂Aᵧ/∂y + ∂A_z/∂z.",
          "Curved coordinates: multiply by the scale factor, differentiate, then divide: (1/ρ)∂(ρDρ)/∂ρ and (1/r²)∂(r²D_r)/∂r.",
          "Divergence theorem: ∮A·dS = ∫∇·A dv. With D, it is Gauss's law.",
        ],
        traps: ["Using the wrong system's formula.", "Leaving ρ or r² outside the derivative.", "Writing a divergence as a vector."],
      },
    },
  ],
});
```

- [ ] **Step 2: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 2 of vector calculus, divergence and the divergence theorem

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: Idea ③, Curl and Stokes' theorem

**Files:** Create `app/packages/course-em1/src/plates/idea-curl.ts`. Modify `plates/index.ts` and `concepts/calculus.ts` (append the `idea-curl` block with `src(SLIDES_2A, "Curl")`).

- [ ] **Step 1: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const cz = instantiate(templates.find((t) => t.id === "curl-z")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const S3 = Math.sqrt(3);
const C_PT = [0.25, S3 / 4, S3 / 2];

export const ideaCurl = defineIdeaPlate({
  id: "idea-curl",
  title: "Curl and Stokes' theorem",
  requires: { objectives: [2], items: ["tutorial:tut-3.8", "f2425-q4a"], misconceptions: ["MISSING_SCALE_FACTORS"] },
  instances: [
    { id: "vs", component: "vector-slice", params: { field: "swirl", plane: "xy", probe: [0.3, 0.1, 0], loop: 0.3 } },
    { id: "eq", component: "equation", params: eqp(R`(\nabla\times\mathbf A)\cdot\mathbf a_n=\lim_{\Delta S\to0}\dfrac{\oint\mathbf A\cdot d\mathbf l}{\Delta S}`, "curl as circulation per unit area") },
  ],
  ideas: [
    {
      id: "curl",
      title: "Curl and Stokes' theorem",
      objectives: [2],
      explain: [
        {
          id: "circulation", title: "Curl: circulation per unit area", show: ["vs", "eq"], focus: ["vs"],
          note: "The curl of a field measures how much it swirls around a point. Put a tiny loop there and add up the field along it: that sum is the circulation. Divide by the loop's area and shrink the loop, and you get the curl's component along the loop's axis. The plate's field A = −y âₓ + x âᵧ spins around the z-axis. The loop has side 0.3 m, and circulation ÷ area = 2, which is exactly (∇ × A)_z.",
          claims: [{ instance: "vs", readout: "c3", value: 2, unit: "" }, { instance: "vs", readout: "circRatio", value: 2, unit: "" }],
        },
        {
          id: "cart", title: "In cartesian: a determinant", patch: { vs: { field: "tut-3.6a", plane: "xz", probe: [1, -2, 3], offset: -2, loop: 0.2 }, eq: eqp(R`\nabla\times\mathbf A=\begin{vmatrix}\mathbf a_x&\mathbf a_y&\mathbf a_z\\\partial_x&\partial_y&\partial_z\\A_x&A_y&A_z\end{vmatrix}`, "curl as a determinant") }, focus: ["vs", "eq"],
          note: "In cartesian coordinates ∇ × A is a determinant: âₓ, âᵧ, âz in the top row; ∂/∂x, ∂/∂y, ∂/∂z in the middle; Aₓ, Aᵧ, A_z at the bottom. For A = yz âₓ + 4xy âᵧ + y âz: the x-part is ∂A_z/∂y − ∂Aᵧ/∂z = 1; the y-part is ∂Aₓ/∂z − ∂A_z/∂x = y; the z-part is ∂Aᵧ/∂x − ∂Aₓ/∂y = 4y − z. At (1, −2, 3), ∇ × A = âₓ − 2âᵧ − 11âz. The loop on the plate lies in the x–z plane, so it measures the component along −y: +2.",
          claims: [{ instance: "vs", readout: "c1", value: 1, unit: "" }, { instance: "vs", readout: "c2", value: -2, unit: "" }, { instance: "vs", readout: "c3", value: -11, unit: "" }, { instance: "vs", readout: "circRatio", value: 2, unit: "" }],
        },
        {
          id: "curved", title: "Cylindrical and spherical curls", patch: { vs: { field: "tut-3.6b", plane: "xz", probe: [0, 5, 1], offset: 5, loop: 0 }, eq: eqp(R`(\nabla\times\mathbf H)_z=\dfrac1\rho\left[\dfrac{\partial(\rho H_\phi)}{\partial\rho}-\dfrac{\partial H_\rho}{\partial\phi}\right]`, "the z-part of the cylindrical curl") }, focus: ["vs", "eq"],
          note: "The curved-coordinate curls are on the formula sheet, and every term carries scale factors. In cylindrical coordinates the z-part is (1/ρ)[∂(ρHφ)/∂ρ − ∂Hρ/∂φ]. For Tutorial 3.8(b), B = ρz sin φ âρ + 3ρz² cos φ âφ, and ∇ × B = −6ρz cos φ âρ + ρ sin φ âφ + (6z − 1)z cos φ âz. At (5, π/2, 1), where cos φ = 0, only the middle term survives: ∇ × B = 5âφ.",
          claims: [{ instance: "vs", readout: "c1", value: 0, unit: "" }, { instance: "vs", readout: "c2", value: 5, unit: "" }, { instance: "vs", readout: "c3", value: 0, unit: "" }],
        },
        {
          id: "stokes", title: "Stokes' theorem, and a field with no curl", patch: { vs: { field: "source", plane: "xy", probe: [0.5, 0.3, 0], offset: 0, loop: 0.4 }, eq: eqp(R`\oint_L\mathbf A\cdot d\mathbf l=\int_S(\nabla\times\mathbf A)\cdot d\mathbf S`, "Stokes' theorem") }, focus: ["vs", "eq"],
          note: "Add up the curl over a surface and you get the circulation around its edge: ∮ A·dl = ∫ (∇ × A)·dS. That is Stokes' theorem, and it is how Faraday's law turns into its point form. A field with zero curl everywhere, like the plate's outward field xâₓ + yâᵧ + zâz, has zero circulation around every loop. Static electric fields are like this: ∇ × E = 0, which is why E can be written as −∇V.",
          claims: [{ instance: "vs", readout: "c3", value: 0, unit: "" }],
        },
      ],
      examples: [
        {
          id: "tut38a", level: "basic", title: "Tutorial 3.8(a): a cartesian curl",
          setup: { vs: { field: "tut-3.6a", plane: "xz", probe: [1, -2, 3], offset: -2, loop: 0 } },
          problem: "Find the curl of A = yz âₓ + 4xy âᵧ + y âz and evaluate it at (1, −2, 3).",
          lines: [
            { text: "(∇ × A)ₓ = ∂(y)/∂y − ∂(4xy)/∂z = 1.", focus: ["vs"] },
            { text: "(∇ × A)ᵧ = ∂(yz)/∂z − ∂(y)/∂x = y.", focus: ["vs"] },
            { text: "(∇ × A)_z = ∂(4xy)/∂x − ∂(yz)/∂y = 4y − z.", focus: ["vs"] },
            { text: "At (1, −2, 3): ∇ × A = âₓ − 2âᵧ − 11âz.", focus: ["vs"], claims: [{ instance: "vs", readout: "c1", value: 1, unit: "" }, { instance: "vs", readout: "c2", value: -2, unit: "" }, { instance: "vs", readout: "c3", value: -11, unit: "" }] },
          ],
          covers: ["tutorial:tut-3.8"],
          trap: "Swapping the order in a term, such as ∂Aᵧ/∂z − ∂A_z/∂y, flips that component's sign. Follow the cycle x → y → z.",
        },
        {
          id: "tut38b", level: "tutorial", title: "Tutorial 3.8(b): a cylindrical curl",
          setup: { vs: { field: "tut-3.6b", plane: "xz", probe: [0, 5, 1], offset: 5, loop: 0 } },
          problem: "Find the curl of B = ρz sin φ âρ + 3ρz² cos φ âφ and evaluate it at (5, π/2, 1).",
          lines: [
            { text: "ρ-part: (1/ρ)∂B_z/∂φ − ∂Bφ/∂z = 0 − 6ρz cos φ.", focus: ["vs"] },
            { text: "φ-part: ∂Bρ/∂z − ∂B_z/∂ρ = ρ sin φ − 0.", focus: ["vs"] },
            { text: "z-part: (1/ρ)[∂(ρBφ)/∂ρ − ∂Bρ/∂φ] = (1/ρ)[6ρz² cos φ − ρz cos φ] = (6z − 1)z cos φ.", focus: ["vs"] },
            { text: "At (5, π/2, 1), cos φ = 0 and sin φ = 1: ∇ × B = 5âφ.", focus: ["vs"], claims: [{ instance: "vs", readout: "c2", value: 5, unit: "" }] },
          ],
          covers: ["tutorial:tut-3.8"],
          trap: "Forgetting the ρ inside ∂(ρBφ)/∂ρ gives (3z²/ρ) cos φ where 6z² cos φ belongs.",
        },
        {
          id: "tut38c", level: "exam", title: "Tutorial 3.8(c): a spherical curl",
          setup: { vs: { field: "tut-3.6c", plane: "xz", probe: C_PT, offset: S3 / 4, loop: 0 } },
          problem: "Find the curl of C = 2r cos θ cos φ âr + √r âφ and evaluate it at (1, π/6, π/3).",
          lines: [
            { text: "r-part: (1/(r sin θ))∂(√r sin θ)/∂θ = √r cos θ/(r sin θ) = cot θ/√r.", focus: ["vs"] },
            { text: "θ-part: (1/r)[(1/sin θ)∂(2r cos θ cos φ)/∂φ − ∂(r√r)/∂r] = −2 cot θ sin φ − 3/(2√r).", focus: ["vs"] },
            { text: "φ-part: (1/r)[0 − ∂(2r cos θ cos φ)/∂θ] = 2 sin θ cos φ.", focus: ["vs"] },
            { text: "At (1, π/6, π/3): ∇ × C = 1.732âr − 4.5âθ + 0.5âφ.", focus: ["vs"], claims: [{ instance: "vs", readout: "c1", value: 1.73205, unit: "" }, { instance: "vs", readout: "c2", value: -4.5, unit: "" }, { instance: "vs", readout: "c3", value: 0.5, unit: "" }] },
          ],
          covers: ["tutorial:tut-3.8"],
          trap: "Treating ∂(r√r)/∂r as ∂(√r)/∂r misses the r from the scale factor: 1/(2√r) instead of 3√r/2.",
        },
      ],
      asks: [
        { id: "vector", q: "Is the curl a vector?", tags: ["GRAD_DIV_TYPE"], a: "Yes. Its direction is the axis of the swirl: curl your fingers along the circulation and your thumb points along the curl. Its size is the circulation per unit area." },
        { id: "paddle", q: "What's a good picture of curl?", a: "A tiny paddle wheel dropped into the field. If the field pushes harder on one side than the other, the wheel spins, and the curl points along its axle. In the swirl field it spins at the same rate everywhere." },
        { id: "static", q: "What does ∇ × E = 0 mean for electrostatics?", a: "A static electric field has no swirl: the work done moving a charge around any closed loop is zero. That is what lets us define a potential V with E = −∇V." },
        { id: "grad-curl", q: "Why is the curl of a gradient always zero?", a: "A gradient field points steepest uphill. Walk any loop back to your start and you gain and lose exactly the same height, so the circulation is zero everywhere, and so is the curl." },
        { id: "ampere", q: "Where will I use curl next?", a: "In Ampère's law, ∇ × H = J: the magnetic field swirls around currents. Finals 2024-25 Q4(a)(iv) asks for ∇ × H outside a conductor. There J = 0, so the curl is zero." },
        { id: "factors", q: "Which scale factors appear in the cylindrical curl?", tags: ["MISSING_SCALE_FACTORS"], a: "The z-part has 1/ρ outside and ρHφ inside the derivative: (1/ρ)[∂(ρHφ)/∂ρ − ∂Hρ/∂φ]. The ρ-part has 1/ρ on the φ-derivative. Copy them from the formula sheet rather than rebuilding them from memory." },
      ],
      checks: [
        {
          id: "grad-curl", title: "Check: the curl of a gradient", show: ["vs", "eq"], patch: { vs: { field: "swirl", plane: "xy", probe: [0.3, 0.1, 0], offset: 0, loop: 0.3 } },
          note: "Four checks on curl. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "grad-curl", type: "choose", prompt: "∇ × (∇V) is…", dimension: "conceptual",
            options: [
              choice("zero", "always zero", true, "Right: a gradient field has no circulation."),
              choice("lap", "∇²V", false, "∇²V is the divergence of the gradient, not its curl."),
              choice("scalar", "a scalar", false, "A curl is a vector (here, the zero vector).", "GRAD_DIV_TYPE"),
            ] },
        },
        {
          id: "curl-num", title: "Check: a curl component, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "curl-num", type: "numeric", prompt: cz.prompt, answer: cz.spec.answer, distractors: cz.spec.distractors, relTol: cz.spec.relTol, hints: cz.hints, template: "curl-z", dimension: "computational" },
          covers: ["tutorial:tut-3.8"],
        },
        {
          id: "predict-loop", title: "Check: move the loop",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-loop", type: "predict-drag", prompt: "In the swirl field, the loop moves from (0.3, 0.1) to (−1, 1.2). Drag circulation ÷ area to your prediction.", target: { instance: "vs", readout: "circRatio" }, range: [0, 5], unit: "", relTol: 0.05, reveal: { vs: { probe: [-1, 1.2, 0] } }, dimension: "conceptual",
            feedback: { close: "Right: still 2. This field swirls equally everywhere.", far: "∇ × A = 2âz at every point, so every small loop gives 2." } },
        },
        {
          id: "outside", title: "Check: outside a wire (Finals Q4(a)(iv))",
          note: "Last one.",
          interaction: { id: "outside", type: "choose", prompt: "Outside a long, straight wire carrying current, ∇ × H is…", dimension: "application",
            options: [
              choice("zero", "zero, because J = 0 there", true, "Right: ∇ × H = J, and there is no current outside the wire."),
              choice("h", "I/(2πρ)", false, "That's |H| itself, not its curl."),
              choice("circles", "nonzero, because H circles the wire", false, "H circles the wire, but outside it, its curl is zero: the circulation around any loop that misses the wire is zero."),
            ] },
          covers: ["f2425-q4a"],
        },
      ],
      recap: {
        points: [
          "∇ × A is a vector: the circulation per unit area about its axis (right-hand rule).",
          "Cartesian: the determinant; follow the cycle x → y → z.",
          "Curved coordinates: copy the scale factors from the formula sheet, such as (1/ρ)[∂(ρHφ)/∂ρ − ∂Hρ/∂φ].",
          "Stokes: ∮A·dl = ∫(∇ × A)·dS. The curl of a gradient is always zero; statics has ∇ × E = 0.",
        ],
        traps: ["Reversing a term's order and flipping its sign.", "Dropping ρ or r inside the derivative.", "Calling the curl a scalar."],
      },
    },
  ],
});
```

- [ ] **Step 2: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 3 of vector calculus, curl and Stokes' theorem

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 5: Coverage, e2e and axe

**Files:**
- Modify: `app/packages/course-em1/test/f3-coverage.test.ts` (extend it)
- Create: `app/apps/web/e2e/vector-calculus.spec.ts`
- Modify: `a11y.spec.ts`

- [ ] **Step 1: Extend the coverage test.**
  - In `f3-coverage.test.ts`, add `"em1.math.vector-calculus"` to the per-concept loop's list.
  - Add the assertion `expect(mainOf("em1.math.vector-calculus")).toEqual(["idea-gradient", "idea-divergence", "idea-curl"]);`.
  - Run `pnpm vitest run packages/course-em1`. Expected: PASS.

- [ ] **Step 2: The e2e test** at `app/apps/web/e2e/vector-calculus.spec.ts`

```ts
import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const C = "em1.math.vector-calculus";
const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("vector calculus opens at depth", async ({ page }) => {
  for (const [block, title, label] of [
    ["idea-gradient", "The gradient points uphill", "Idea 1 · The gradient · Explanation 1 of 4"],
    ["idea-divergence", "Divergence: outflow per unit volume", "Idea 2 · Divergence and the divergence theorem · Explanation 1 of 4"],
    ["idea-curl", "Curl: circulation per unit area", "Idea 3 · Curl and Stokes' theorem · Explanation 1 of 4"],
  ] as const) {
    await open(page, concept(C, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("HW02 2.1(c): the spherical gradient step reads −4", async ({ page }) => {
  await open(page, concept(C, "mode=learn&lesson=main&block=idea-gradient&step=2"));
  await margin(page, "Cylindrical and spherical: scale factors");
  await expect(page.locator(".readouts")).toContainText("−4");
});
```

The `Readout` primitive may format negatives with "-" rather than "−". Check with `grep -n "formatValue" -A8 packages/ui/src/primitives.tsx`. If it prints "-4", change the expectation to "-4" and log a ruling.

- In `a11y.spec.ts`, add `concept("em1.math.vector-calculus", "mode=learn&lesson=main&block=idea-divergence")` to `SCREENS`.

- [ ] **Step 3: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web packages/course-em1 && git commit -m "test: vector calculus coverage, e2e and axe

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 6: Verification and handback

- [ ] **Step 1:** Run the full suite (the Task 5 command). Everything should be green.
- [ ] **Step 2:** In the dev server at 1360×900, walk each idea's first explanation and exam example.
  - Arrows should read clearly.
  - The box and loop should draw around the probe.
  - The HW02 2.1(c) step should show −4 on the φ-component, and its readout label should say "∇, φ-component".
- [ ] **Step 3:** Write the ledger line `Task 6: verification — <counts>` and stop for Claude's review.

## Self-Review Notes

- **Solved from the questions, with SymPy:**
  - Tutorial 3.4: ∇Φ = (5, 4, 3); directional derivative 7.
  - Tutorial 3.6: 4x → 4; (2 − 3z)z sin φ → −1; 6 cos θ cos φ → 2.598.
  - Tutorial 3.8: (1, y, 4y − z) → (1, −2, −11); 5aφ; (1.732, −4.5, 0.5).
  - HW02 2.1: (132, −30, −42); aρ + 2az; −4aφ.
  - HW02 2.2: 3y − x; 2z² + sin 2φ + 2ρ sin²φ; 3.
  - MST Q5(a): E_z = −103.
- **Traps from graded HW02 work:** −2aφ from a dropped 1/(r sin θ); a cylindrical operator on a cartesian field in 2.2(a); a sign slip, −aρ, in 2.1(b).
- **Coverage:** each idea owns one objective, and all mapped items are covered.
