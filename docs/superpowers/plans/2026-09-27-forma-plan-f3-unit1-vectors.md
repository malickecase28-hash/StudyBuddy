# Forma Plan F3: Unit 1 and Vectors at Full Depth

> **For agentic workers (Codex):** read `AGENTS.md` first. **Plans F1 and F2 must be complete.** This plan uses `axes3`, `vector3` (with `unit` and `drawScale`), `coord-frame` (with `drawScale`), `coord-region` (with `drawScale`), `spectrum`, `unit-convert`, the question bank, and the degree and inch units. Transcribe the content exactly. Every number was computed with Python/SymPy from the source questions, not taken from any student's answers.

**Goal:** six in-depth ideas.
- Unit 1, "EM in the world, and SI units":
  - ① What EM is and where it runs the world
  - ② Units, prefixes and symbols
- "Vectors and coordinate systems":
  - ③ Components, length, unit and displacement vectors
  - ④ Dot and cross products, angles and projections
  - ⑤ Cylindrical and spherical coordinates
  - ⑥ dl, dS and dv

Each idea has explanations, three worked examples (from Sadiku tutorial 1.1–2.1, the 2023-24 mid-semester test and HW02), six or more asks, four or more checks, and a recap. Seven numeric templates give practice with fresh numbers.

**Architecture:**
- The idea plates are `defineIdeaPlate`, exactly as in Plan E (`packages/course-em1/src/plates/idea-*.ts`).
- `em1.intro.em-world` becomes a real concept with a `main` lesson of two idea blocks.
- `em1.math.vectors` gets a new `main` of four idea blocks. Its old classic lesson moves to `quick`.
- The F2 `toolkit-preview` lesson is deleted.

**Spec:** `docs/superpowers/specs/2026-09-26-forma-emag-electrostatics-assessments-design.md` §2.3 and §3. Resources: `docs/superpowers/resources/emag-catalog.md` (`unit1`, `lec2a`, `tut-vec`, `u2w02b`, `mst2324`, `hw02-2324`, `f2425`).

**Ledger:** `.superpowers/sdd/2026-09-27-forma-plan-f3-unit1-vectors/progress.md`

## Global Constraints

- Run commands from `F:\StudyBuddy\app`.
- **Depth floor per idea** (enforced by `packages/course-em1/test/ideas.test.ts`):
  - ≥ 3 explanations of ≤ 180 words each;
  - worked examples at the levels basic, tutorial and exam;
  - ≥ 6 asks of ≤ 80 words each;
  - ≥ 4 checks;
  - a recap.
- **Number lint.** Unit-bearing numbers are linted in the units m, m², m³, C, µC, nC, Hz (with k/M/G/T), V/m and inch. Numbers in mm, cm, km, nm, µm, µF and mC are not linted.
  - Where the text states a unit-bearing value the plate does not show, the step carries a `givens` entry computed in code.
  - **If a lint warning fires, do not invent a fix.** Report the step id and the message in the ledger as a `Ruling:` line, and adjust only by adding a `givens` entry whose value is computed in code from the stated inputs. The givens rule in `AGENTS.md` does not apply to values the plate cannot show (derived values like λ/2).
- **Unitless numbers** (components, angles) are not linted. Claims verify them wherever a readout exists; the rest were checked by hand.
- **Item ids** in `covers` and `requires.items` are question-bank ids (F1), or `tutorial:tut-<n>` for the Sadiku practice exercises in `tut-vec`.

## Review Focus

1. **Idea numbering across concepts.** Unit 1 is Ideas 1–2; vectors is its own concept, so its ideas are Ideas 1–4 (numbering restarts per concept, as with Gauss). Tested in Task 8.
2. **Moving the old vectors lesson.** Saved positions and the footer e2e that open `/learn/em1.math.vectors/main` must follow the move to `quick`. Tested in Task 4 and Task 8.
3. **Template variants.** Every template's seed-1 answer matches its check. No distractor equals the answer (coord-phi in the first quadrant; vec-angle at exactly 90°). Tested in Task 1.
4. **Draggable coordinate point.** Starting in quadrant III, dragging (pointer: y and z only) can reach quadrant II, and the check `phi-second-quadrant` fires. Tested in Task 6 (unit test on the check) and Task 8 (e2e).
5. **Concept coverage.** Each concept covers every objective, mapped item and misconception, and removing any idea yields a named gap. Tested in Task 8.

---

### Task 1: Templates and the goal check

**Files:**
- Modify: `app/packages/course-em1/src/templates.ts`, `app/packages/course-em1/src/checks.ts`
- Test: `app/packages/course-em1/test/templates-f3.test.ts` (new)

**Interfaces:**
- Produces:
  - templates `em-wavelength`, `unit-si-length`, `vec-sum-mag`, `vec-distance-mm`, `vec-angle`, `coord-phi` and `sph-patch-area`;
  - the check `phi-second-quadrant`.

- [ ] **Step 1: Write the failing test** at `app/packages/course-em1/test/templates-f3.test.ts`

```ts
import { instantiate } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { checks, templates } from "../src";

const IDS = ["em-wavelength", "unit-si-length", "vec-sum-mag", "vec-distance-mm", "vec-angle", "coord-phi", "sph-patch-area"];

describe("F3 templates", () => {
  for (const id of IDS) {
    it(`${id}: 50 seeds give finite answers, worked lines, and no distractor equal to the answer`, () => {
      const t = templates.find((x) => x.id === id);
      expect(t, id).toBeDefined();
      for (let seed = 1; seed <= 50; seed++) {
        const v = instantiate(t!, seed);
        expect(Number.isFinite(v.spec.answer.value), `${id}#${seed}`).toBe(true);
        expect(v.worked.length).toBeGreaterThan(0);
        for (const d of v.spec.distractors) expect(Math.abs(d.value - v.spec.answer.value) > 1e-9 * Math.max(1, Math.abs(v.spec.answer.value)), `${id}#${seed}`).toBe(true);
      }
    });
  }
  it("vec-angle reproduces Tutorial 1.4 when a = 3, b = 5", () => {
    const t = templates.find((x) => x.id === "vec-angle")!;
    expect(t.solve({ a: 3, b: 5 } as never).answer.value).toBeCloseTo(120.657, 3);
  });
  it("coord-phi puts (−2, 2) at 135°, not −45°", () => {
    const t = templates.find((x) => x.id === "coord-phi")!;
    expect(t.solve({ qx: 2, qy: 2, quad: 1 } as never).answer.value).toBeCloseTo(135, 6);
  });
  it("sph-patch-area reproduces MST Q3(a)'s patch at r = 25 cm, θ to 60°, a 15° wedge", () => {
    const t = templates.find((x) => x.id === "sph-patch-area")!;
    expect(t.solve({ rc: 25, t: 2, dp: 15 } as never).answer.value).toBeCloseTo(0.008181, 6);
  });
  it("phi-second-quadrant fires only for 90° < φ < 180°", () => {
    const at = (pPhi: number) => ({ cf: { params: {}, model: { pPhi }, visible: true } }) as never;
    expect(checks["phi-second-quadrant"]!(at(135), at(243))).toBe(true);
    expect(checks["phi-second-quadrant"]!(at(243), at(243))).toBe(false);
    expect(checks["phi-second-quadrant"]!(at(60), at(243))).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm vitest run packages/course-em1/test/templates-f3.test.ts`
Expected: FAIL (the templates are undefined).

- [ ] **Step 3: Implement.** Add the templates to `templates.ts`, above the `templates` array, and append their constants to that array.

```ts
const C0 = 299_792_458;
const sig = (x: number, n = 4) => Number(x.toPrecision(n));
const DEG = Math.PI / 180;

const emWavelength = defineTemplate<{ f: number }>({
  id: "em-wavelength",
  params: { f: { min: 60, max: 990, step: 10 } },
  prompt: (p) => `A transmitter broadcasts at ${p.f} MHz. Find the wavelength in metres.`,
  solve: (p) => ({
    answer: { value: sig(C0 / (p.f * 1e6)), unit: "m" },
    distractors: [{ value: sig(C0 / p.f), unit: "m", errorClass: "unit", feedback: "That divides by the frequency in MHz. Convert to hertz first: multiply by 10⁶." }],
  }),
  hints: (p) => ["λ = c/f, with c = 299 792 458 m/s.", "The frequency must be in hertz.", `299 792 458 ÷ (${p.f} × 10⁶).`],
  worked: (p) => [{ text: `f = ${p.f} MHz = ${p.f} × 10⁶ Hz.` }, { text: `λ = c/f = 299 792 458 ÷ (${p.f} × 10⁶) = ${sig(C0 / (p.f * 1e6))} m.` }],
  dimension: "computational",
  tags: { concepts: ["em1.intro.em-world"], misconceptions: [], difficulty: 1 },
});

const LEN: [string, number, number][] = [["mm", 1e-3, 1e-2], ["µm", 1e-6, 1e-3], ["cm", 1e-2, 1e-3], ["inch", 0.0254, 1e-2]];
const unitSiLength = defineTemplate<{ v: number; k: number }>({
  id: "unit-si-length",
  params: { v: { min: 1, max: 99, step: 1 }, k: { min: 0, max: 3, step: 1 } },
  prompt: (p) => `Convert ${p.v} ${LEN[p.k]![0]} to metres.`,
  solve: (p) => {
    const [, f, wrong] = LEN[p.k]!;
    return {
      answer: { value: sig(p.v * f, 6), unit: "m" },
      distractors: [{ value: sig(p.v * wrong, 6), unit: "m", errorClass: "unit", feedback: "Check the ladder: milli is 10⁻³, micro 10⁻⁶, centi 10⁻², and an inch is exactly 0.0254 m." }],
    };
  },
  hints: (p) => [`What power of ten is one ${LEN[p.k]![0]}?`, `1 ${LEN[p.k]![0]} = ${LEN[p.k]![1]} m.`, `${p.v} × ${LEN[p.k]![1]}.`],
  worked: (p) => [{ text: `1 ${LEN[p.k]![0]} = ${LEN[p.k]![1]} m, so ${p.v} ${LEN[p.k]![0]} = ${p.v} × ${LEN[p.k]![1]} = ${sig(p.v * LEN[p.k]![1], 6)} m.` }],
  dimension: "computational",
  tags: { concepts: ["em1.intro.em-world"], misconceptions: ["PREFIX_POWER"], difficulty: 1 },
});

const vecSumMag = defineTemplate<{ a: number; b: number; c: number }>({
  id: "vec-sum-mag",
  params: { a: { min: 1, max: 5, step: 1 }, b: { min: 1, max: 5, step: 1 }, c: { min: 1, max: 9, step: 1 } },
  prompt: (p) => `A = ${p.a}âₓ + 3âz and B = 5âₓ + ${p.b}âᵧ − ${p.c}âz. Find |A + B|.`,
  solve: (p) => ({
    answer: { value: sig(Math.hypot(p.a + 5, p.b, 3 - p.c), 5), unit: "" },
    distractors: [{ value: sig(Math.hypot(p.a, 3) + Math.hypot(5, p.b, p.c), 5), unit: "", errorClass: "conceptual", feedback: "Magnitudes don't add unless the vectors are parallel. Add the components first, then take the length." }],
  }),
  hints: () => ["Add matching components.", "Then |V| = √(Vₓ² + Vᵧ² + V_z²).", "Watch the sign of the z part."],
  worked: (p) => [
    { text: `A + B = ${p.a + 5}âₓ + ${p.b}âᵧ + (${3 - p.c})âz.` },
    { text: `|A + B| = √(${(p.a + 5) ** 2} + ${p.b ** 2} + ${(3 - p.c) ** 2}) = ${sig(Math.hypot(p.a + 5, p.b, 3 - p.c), 5)}.` },
  ],
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: [], difficulty: 1 },
});

const vecDistanceMm = defineTemplate<{ dx: number; dz: number }>({
  id: "vec-distance-mm",
  params: { dx: { min: 1, max: 9, step: 1 }, dz: { min: 1, max: 9, step: 1 } },
  prompt: (p) => `Charges sit at P1(2, 2, 13) mm and P2(${2 + p.dx}, 2, ${13 - p.dz}) mm. Find the length of R12 in metres.`,
  solve: (p) => ({
    answer: { value: sig(Math.hypot(p.dx, p.dz) / 1000), unit: "m" },
    distractors: [{ value: sig(Math.hypot(p.dx, p.dz)), unit: "m", errorClass: "unit", feedback: "That is the length in millimetres. Divide by 1000 for metres." }],
  }),
  hints: () => ["R12 = P2 − P1, end minus start.", "Length by 3D Pythagoras.", "Then convert mm to m."],
  worked: (p) => [
    { text: `R12 = (${p.dx}, 0, −${p.dz}) mm.` },
    { text: `|R12| = √(${p.dx ** 2} + ${p.dz ** 2}) = ${sig(Math.hypot(p.dx, p.dz))} mm = ${sig(Math.hypot(p.dx, p.dz) / 1000)} m.` },
  ],
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: [], difficulty: 1 },
});

const vecAngle = defineTemplate<{ a: number; b: number }>({
  id: "vec-angle",
  params: { a: { min: 1, max: 5, step: 1 }, b: { min: 1, max: 6, step: 1 } },
  prompt: (p) => `A = âₓ + ${p.a}âz and B = ${p.b}âₓ + 2âᵧ − 6âz. Find the angle between them, in degrees.`,
  solve: (p) => {
    const dotAB = p.b - 6 * p.a;
    const th = Math.acos(dotAB / (Math.hypot(1, p.a) * Math.hypot(p.b, 2, 6))) / DEG;
    return {
      answer: { value: sig(th, 5), unit: "°" },
      distractors: Math.abs(th - 90) > 0.5 ? [{ value: sig(180 - th, 5), unit: "°", errorClass: "sign", feedback: "Keep the sign of A·B: a negative dot product means the angle is more than 90°." }] : [],
    };
  },
  hints: () => ["cos θ = A·B / (|A||B|).", "A·B = AₓBₓ + AᵧBᵧ + A_zB_z.", "Keep the sign, then take cos⁻¹."],
  worked: (p) => {
    const dotAB = p.b - 6 * p.a;
    const ma = Math.hypot(1, p.a), mb = Math.hypot(p.b, 2, 6);
    return [
      { text: `A·B = (1)(${p.b}) + (0)(2) + (${p.a})(−6) = ${dotAB}.` },
      { text: `|A| = ${sig(ma, 5)}, |B| = ${sig(mb, 5)}.` },
      { text: `cos θ = ${dotAB} / (${sig(ma, 5)} × ${sig(mb, 5)}) = ${sig(dotAB / (ma * mb), 5)}, so θ = ${sig(Math.acos(dotAB / (ma * mb)) / DEG, 5)}°.` },
    ];
  },
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: [], difficulty: 2 },
});

const QUAD: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
const coordPhi = defineTemplate<{ qx: number; qy: number; quad: number }>({
  id: "coord-phi",
  params: { qx: { min: 1, max: 5, step: 1 }, qy: { min: 1, max: 5, step: 1 }, quad: { min: 0, max: 3, step: 1 } },
  prompt: (p) => {
    const [sx, sy] = QUAD[p.quad]!;
    return `Find φ, from 0° to 360°, for the point (${sx * p.qx}, ${sy * p.qy}, 2).`;
  },
  solve: (p) => {
    const [sx, sy] = QUAD[p.quad]!;
    const x = sx * p.qx, y = sy * p.qy;
    const phi = ((Math.atan2(y, x) / DEG) % 360 + 360) % 360;
    const raw = Math.atan(y / x) / DEG;
    return {
      answer: { value: sig(phi, 5), unit: "°" },
      distractors: Math.abs(raw - phi) > 0.5 ? [{ value: sig(raw, 5), unit: "°", errorClass: "conceptual", tag: "PHI_QUADRANT", feedback: "That is the calculator's tan⁻¹(y/x). Place the point in its quadrant from the signs of x and y, then correct the angle." }] : [],
    };
  },
  hints: () => ["Which quadrant? Look at the signs of x and y.", "tan⁻¹(y/x) only knows the ratio.", "Quadrants II and III: add 180°. Quadrant IV: add 360°."],
  worked: (p) => {
    const [sx, sy] = QUAD[p.quad]!;
    const x = sx * p.qx, y = sy * p.qy;
    const raw = Math.atan(y / x) / DEG;
    const phi = ((Math.atan2(y, x) / DEG) % 360 + 360) % 360;
    return [
      { text: `x = ${x}, y = ${y}: quadrant ${["I", "II", "III", "IV"][p.quad]}.` },
      { text: `tan⁻¹(y/x) = ${sig(raw, 5)}°; corrected for the quadrant, φ = ${sig(phi, 5)}°.` },
    ];
  },
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: ["PHI_QUADRANT"], difficulty: 2 },
});

const TH2 = [30, 45, 60, 90];
const sphPatchArea = defineTemplate<{ rc: number; t: number; dp: number }>({
  id: "sph-patch-area",
  params: { rc: { min: 10, max: 50, step: 5 }, t: { min: 0, max: 3, step: 1 }, dp: { min: 15, max: 90, step: 15 } },
  prompt: (p) => `Find the area of the part of the sphere r = ${p.rc} cm with 0 < θ < ${TH2[p.t]}° and 0 < φ < ${p.dp}°.`,
  solve: (p) => {
    const r = p.rc / 100, t2 = TH2[p.t]! * DEG, dphi = p.dp * DEG;
    return {
      answer: { value: sig(r * r * (1 - Math.cos(t2)) * dphi), unit: "m^2" },
      distractors: [
        { value: sig(r * r * t2 * dphi), unit: "m^2", errorClass: "conceptual", tag: "ELEMENT_SCALE_FACTOR", feedback: "That leaves out sin θ. On a sphere, dS = r² sin θ dθ dφ." },
        { value: sig(p.rc * p.rc * (1 - Math.cos(t2)) * dphi), unit: "m^2", errorClass: "unit", feedback: "That squares the radius in centimetres. Convert r to metres first." },
      ],
    };
  },
  hints: () => ["dS = r² sin θ dθ dφ on a sphere.", "∫ sin θ dθ from 0 to θ₂ = 1 − cos θ₂.", "Angles in radians; r in metres."],
  worked: (p) => {
    const r = p.rc / 100, t2 = TH2[p.t]! * DEG, dphi = p.dp * DEG;
    return [
      { text: `r = ${r} m; ∫₀^θ₂ sin θ dθ = 1 − cos ${TH2[p.t]}° = ${sig(1 - Math.cos(t2), 5)}; Δφ = ${p.dp}° = ${sig(dphi, 5)} rad.` },
      { text: `S = r²(1 − cos θ₂)Δφ = ${sig(r * r, 5)} × ${sig(1 - Math.cos(t2), 5)} × ${sig(dphi, 5)} = ${sig(r * r * (1 - Math.cos(t2)) * dphi)} m².` },
    ];
  },
  dimension: "computational",
  tags: { concepts: ["em1.math.vectors"], misconceptions: ["ELEMENT_SCALE_FACTOR"], difficulty: 2 },
});
```

Append to the exported array: `emWavelength, unitSiLength, vecSumMag, vecDistanceMm, vecAngle, coordPhi, sphPatchArea`.

Check two things by hand:
- **vec-distance-mm.** A distractor equal to the answer is impossible, because the answer is the distractor ÷ 1000.
- **unit-si-length.** The wrong factor always differs from the right one.

If `Distractor` does not accept `tag`, check `packages/engine/src/schema/common.ts`. Plan E used `tag` on choose options, and distractors carry it too. If it isn't there, drop `tag` from these two distractors and log a ruling.

In `checks.ts`, add:

```ts
  /** The coord-frame point (instance "cf") is in the second quadrant: 90° < φ < 180°. */
  "phi-second-quadrant": (now) => {
    const phi = Number(now.cf?.model.pPhi);
    return phi > 90 && phi < 180;
  },
```

- [ ] **Step 4: Run it and see it pass**

Run: `pnpm vitest run packages/course-em1`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): templates for units, vectors and coordinates; second-quadrant goal check

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 2: Unit 1 concept and Idea ①, EM in the world

**Files:**
- Create: `app/packages/course-em1/src/concepts/intro.ts`, `app/packages/course-em1/src/plates/idea-em-world.ts`
- Modify:
  - `app/packages/course-em1/src/concepts/electrostatics.ts`: remove the `locked("em1.intro.em-world", …)` line.
  - `app/packages/course-em1/src/index.ts`: add `emWorld` first in the concepts list.
  - `app/packages/course-em1/src/plates/index.ts`: register the plate.

- [ ] **Step 1: The concept** in `concepts/intro.ts`

```ts
import { meta, orig, src } from "../sources";

const ID = "em1.intro.em-world";
const UNIT1 = "UTech ELE3001 Unit 1 slides (G. D. Boswell)";

export const emWorld = {
  id: ID,
  title: "EM in the world, and SI units",
  unit: 1,
  objectives: [
    "Explain what electromagnetics studies and where it runs critical infrastructure.",
    "Relate frequency and wavelength across the electromagnetic spectrum (λ = c/f).",
    "Convert prefixed and non-SI units to SI, and write symbols correctly.",
  ],
  prerequisites: [],
  misconceptions: [
    { tag: "WAVELENGTH_INVERSE", description: "Thinks a higher frequency means a longer wavelength.", remediation: `${ID}/main` },
    { tag: "PREFIX_POWER", description: "Squares or cubes the unit but not its prefix (1 cm² = 0.01 m²).", remediation: `${ID}/main` },
    { tag: "SYMBOL_CASE", description: "Confuses m (milli) with M (mega), or similar case slips.", remediation: `${ID}/main` },
  ],
  examLinks: [{ paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q1(a)", marks: 4, weight: 1 }],
  sources: [src(UNIT1, "pp. 1-12")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "EM in the world, and SI units (in depth)",
      minutes: 35,
      blocks: [{ ...meta("vivid", src(UNIT1, "pp. 3-12")), id: "idea-em-world", type: "plate" as const, plateId: "idea-em-world" }],
    },
  ],
};
```

Mirror the exact `meta` and `src` import names used by `concepts/gauss-law.ts`. If `status` or `type` need no `as const` there, drop it here too.

- [ ] **Step 2: The idea plate** in `plates/idea-em-world.ts`

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const C0 = 299_792_458;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const wl = instantiate(templates.find((t) => t.id === "em-wavelength")!, 1);
const LAMBDA = { latex: R`\lambda=\dfrac{c}{f}`, speech: "lambda equals c over f", shortSpeech: "wavelength" };
const MAXWELL = R`\nabla\cdot\mathbf D=\rho_v\qquad\nabla\cdot\mathbf B=0\qquad\nabla\times\mathbf E=-\dfrac{\partial\mathbf B}{\partial t}\qquad\nabla\times\mathbf H=\mathbf J+\dfrac{\partial\mathbf D}{\partial t}`;

export const ideaEmWorld = defineIdeaPlate({
  id: "idea-em-world",
  title: "What electromagnetics is, and where it runs the world",
  requires: { objectives: [0, 1], items: ["f2425-q1a"], misconceptions: ["WAVELENGTH_INVERSE"] },
  instances: [
    { id: "spec", component: "spectrum", params: { f: 2.45e9 } },
    { id: "eq", component: "equation", params: LAMBDA },
  ],
  ideas: [
    {
      id: "em-world",
      title: "What electromagnetics is, and where it runs the world",
      objectives: [0, 1],
      explain: [
        {
          id: "what", title: "Fields from charges", show: ["spec"], focus: ["spec"],
          note: "Electromagnetics (EM) is the study of electric and magnetic fields. Charges at rest make electric fields. Charges in motion, currents, make magnetic fields. When either field changes in time it creates the other, and that loop lets energy leave a circuit and travel on its own as a wave. The bar on the plate is the whole electromagnetic spectrum. Radio, microwaves, light and X-rays are all the same thing: electric and magnetic fields chasing each other at the speed of light. Only the frequency differs.",
        },
        {
          id: "maxwell", title: "Maxwell's four equations", show: ["eq"], patch: { eq: { latex: MAXWELL, speech: "Maxwell's four equations", shortSpeech: "Maxwell's equations" } }, focus: ["eq"],
          note: "In the 1860s James Clerk Maxwell wrote everything then known about electricity and magnetism as four equations: Gauss's law for electric fields; Gauss's law for magnetic fields (there are no magnetic charges); Faraday's law (a changing magnetic field makes an electric field); and Ampère's law with his own addition, the displacement current (a changing electric field makes a magnetic field). Together they predict waves travelling at 1/√(μ₀ε₀), which is exactly the speed of light. This course climbs to these four equations one at a time, and vector calculus is the language they are written in.",
        },
        {
          id: "spectrum", title: "One wave, every frequency", patch: { spec: { f: 5.45e14 }, eq: LAMBDA }, focus: ["spec", "eq"],
          note: "Every EM wave obeys λ = c/f: the wavelength is the speed of light, c = 299 792 458 m/s, divided by the frequency. Green light oscillates at 5.45 × 10¹⁴ Hz, so its wavelength is about 5.5 × 10⁻⁷ m, roughly 550 nanometres. Double the frequency and the wavelength halves. The bands on the bar (radio, microwave, infrared, visible, ultraviolet, X-ray, gamma) are human names for ranges of one continuous scale; nothing physical changes at a boundary.",
          claims: [{ instance: "spec", readout: "lambda", value: 5.50078e-7, unit: "m" }],
        },
        {
          id: "antenna", title: "Wireless: antennas and wavelength", patch: { spec: { f: 94.1e6 } }, focus: ["spec"],
          note: "Wireless communication is EM at its purest. A current oscillating in one antenna launches a wave that drives a current in another, far away, with nothing in between. Antennas work best at about half a wavelength long. An FM station at 94.1 MHz has a wavelength of 3.186 m, so a good receiving antenna is about 1.593 m long. Wi-Fi at 2.45 GHz has a wavelength of about 12 cm, which is why a phone's antenna fits inside its case.",
          claims: [{ instance: "spec", readout: "lambda", value: 3.18589, unit: "m" }],
          givens: [{ value: C0 / 94.1e6 / 2, unit: "m" }, { value: 2.45e9, unit: "Hz" }],
        },
        {
          id: "grid", title: "Where EM runs the country", patch: { spec: { f: 50 } }, focus: ["spec"],
          note: "Critical infrastructure runs on EM. In the power grid, generators turn motion into current by Faraday's law, transformers step the voltage up for low-loss transmission, and the whole system alternates at 50 Hz. At 50 Hz the wavelength is about 6000 km, far longer than any Jamaican power line, which is why lines behave as circuits rather than antennas. In telecoms, cell towers and microwave links carry calls as radio waves, and fibre optics carry the internet as light. Airports need radar; ships and phones need GPS. All of it is Maxwell's equations at work.",
          claims: [{ instance: "spec", readout: "lambda", value: 5.99585e6, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "wifi", level: "basic", title: "Wi-Fi's wavelength",
          setup: { spec: { f: 2.45e9 } },
          problem: "A Wi-Fi router transmits at 2.45 GHz. Find the wavelength.",
          lines: [
            { text: "Put the frequency in hertz first: 2.45 GHz = 2.45 × 10⁹ Hz.", focus: ["spec"] },
            { text: "λ = c/f = 299 792 458 ÷ (2.45 × 10⁹) = 0.1224 m, about 12 cm.", latex: R`\lambda=\dfrac{299\,792\,458}{2.45\times10^{9}}=0.1224\ \text{m}`, focus: ["spec"], claims: [{ instance: "spec", readout: "lambda", value: 0.122364, unit: "m" }] },
          ],
          trap: "Leaving f in gigahertz gives λ = 299 792 458 ÷ 2.45, over a hundred million metres. Convert the prefix before dividing.",
        },
        {
          id: "fm", level: "tutorial", title: "Sizing an FM antenna",
          setup: { spec: { f: 94.1e6 } },
          problem: "An FM station broadcasts at 94.1 MHz. Find the wavelength and the length of a half-wave antenna for it.",
          lines: [
            { text: "λ = c/f = 299 792 458 ÷ (94.1 × 10⁶) = 3.186 m.", focus: ["spec"], claims: [{ instance: "spec", readout: "lambda", value: 3.18589, unit: "m" }] },
            { text: "A half-wave antenna is λ/2 = 1.593 m long.", focus: ["spec"], givens: [{ value: C0 / 94.1e6 / 2, unit: "m" }] },
          ],
          trap: "Using the full wavelength gives an antenna twice as long as it needs to be. The common designs are half-wave, and quarter-wave over a ground plane.",
        },
        {
          id: "infrastructure", level: "exam", title: "Finals 2024-25 Q1(a): EM and critical infrastructure",
          setup: { spec: { f: 50 } },
          problem: "Very briefly comment on how electromagnetics theory has been important to technological advances in a chosen critical infrastructure. (4 marks: aim for four distinct points.)",
          lines: [
            { text: "Name the infrastructure: the national electricity grid.", focus: ["spec"] },
            { text: "First EM principle: generators convert mechanical energy to electrical energy by Faraday's law of induction.", focus: ["spec"] },
            { text: "Second EM principle: transformers use mutual induction to step the voltage up for transmission, cutting I²R losses, then down again for safe use.", focus: ["spec"] },
            { text: "The advance and why it matters: reliable 50 Hz power across the island, which water pumping, hospitals and telecoms all depend on.", focus: ["spec"] },
          ],
          covers: ["f2425-q1a"],
          trap: "Listing devices without the EM principle behind them. Each mark wants the link: device, then the law, then the benefit.",
        },
      ],
      asks: [
        { id: "same-thing", q: "Is light really the same thing as radio?", a: "Yes. Both are oscillating electric and magnetic fields travelling at the speed of light. Only the frequency differs. Your eyes detect one narrow band, and a radio receiver detects another." },
        { id: "inverse", q: "Why does a higher frequency mean a shorter wavelength?", tags: ["WAVELENGTH_INVERSE"], a: "In free space every EM wave travels at the same speed c. In one second a wave moves c metres and completes f cycles, so each cycle spans c/f metres. Pack more cycles into the same distance and each one must be shorter." },
        { id: "sound", q: "Is sound an EM wave?", a: "No. Sound is a pressure wave in a material (air, water, steel) and cannot cross a vacuum. EM waves need no medium at all: sunlight crosses empty space to reach us." },
        { id: "half", q: "Why are antennas about half a wavelength long?", a: "A half-wave antenna resonates. The current on it forms a standing wave with its peak at the centre, so it radiates and receives most efficiently. Much shorter antennas still work, but weakly." },
        { id: "field", q: "What exactly is a field?", a: "A field gives a value at every point in a region. The electric field tells you the force a small test charge would feel there, per coulomb. Fields are vectors that depend on position, which is why the course starts with vectors." },
        { id: "danger", q: "Are phone signals dangerous like X-rays?", a: "Not in the same way. X-rays and gamma rays carry enough energy per photon to break chemical bonds; that is ionizing radiation. Radio and microwaves carry far less, and their main effect is gentle heating. The dividing line is in the ultraviolet." },
        { id: "why-vectors", q: "Why does an EM course start with vectors?", a: "Fields have a size and a direction at every point, and Maxwell's equations are written with dot and cross products, gradient, divergence and curl. Without that language the laws are unreadable. With it, each law fits on one line." },
      ],
      checks: [
        {
          id: "band", title: "Check: which band?", show: ["spec"], patch: { spec: { f: 94.1e6 } },
          note: "Five checks on EM and the spectrum. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "band", type: "choose", prompt: "A 5 GHz Wi-Fi signal is in which band?", dimension: "recognition",
            options: [
              choice("micro", "Microwave", true, "Right: 300 MHz to 300 GHz is microwave."),
              choice("radio", "Radio", false, "Radio is below about 300 MHz; 5 GHz is higher."),
              choice("ir", "Infrared", false, "Infrared starts near 300 GHz, sixty times higher."),
            ] },
        },
        {
          id: "predict-10x", title: "Check: ten times the frequency", patch: { spec: { f: 2.45e9 } },
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-10x", type: "predict-drag", prompt: "The frequency rises ten times, from 2.45 GHz to 24.5 GHz. Drag λ to your prediction.", target: { instance: "spec", readout: "lambda" }, range: [0, 0.3], unit: "m", relTol: 0.05, reveal: { spec: { f: 2.45e10 } }, dimension: "conceptual", tag: "WAVELENGTH_INVERSE",
            feedback: { close: "Right: ten times shorter, 0.01224 m.", far: "λ = c/f: ten times the frequency gives a tenth of the wavelength, 0.01224 m." } },
        },
        {
          id: "wavelength-num", title: "Check: a wavelength, your numbers",
          note: "A number of your own.",
          interaction: { id: "wavelength-num", type: "numeric", prompt: wl.prompt, answer: wl.spec.answer, distractors: wl.spec.distractors, relTol: wl.spec.relTol, hints: wl.hints, template: "em-wavelength", dimension: "computational" },
        },
        {
          id: "not-em", title: "Check: what isn't EM",
          note: "Which one doesn't belong?",
          interaction: { id: "not-em", type: "choose", prompt: "Which of these is NOT an electromagnetic wave?", dimension: "conceptual",
            options: [
              choice("sound", "Sound from a speaker", true, "Right: sound is a pressure wave in air and cannot cross a vacuum."),
              choice("oven", "Microwaves in an oven", false, "Microwaves are EM waves, the same kind as Wi-Fi."),
              choice("xray", "X-rays at a clinic", false, "X-rays are EM waves at a very high frequency."),
            ] },
        },
        {
          id: "generator", title: "Check: the law behind the grid",
          note: "Last one.",
          interaction: { id: "generator", type: "choose", prompt: "Which law explains how a power-station generator produces current?", dimension: "recognition",
            options: [
              choice("faraday", "Faraday's law of induction", true, "Right: a changing magnetic flux induces a voltage."),
              choice("coulomb", "Coulomb's law", false, "Coulomb's law is the force between charges at rest."),
              choice("gauss", "Gauss's law", false, "Gauss's law links electric flux to enclosed charge."),
            ] },
          covers: ["f2425-q1a"],
        },
      ],
      recap: {
        points: [
          "EM studies electric and magnetic fields: charges at rest make E, currents make B, and changing fields make each other.",
          "Maxwell's four equations unify it all and predict waves at the speed of light.",
          "λ = c/f for every EM wave; radio, light and X-rays differ only in frequency.",
          "Antennas are about half a wavelength long.",
          "The grid (generators, transformers) and telecoms (radio, fibre) are EM at work.",
        ],
        traps: ["Thinking a higher frequency gives a longer wavelength.", "Dividing by a frequency still in MHz or GHz.", "Naming devices without the EM law behind them."],
      },
    },
  ],
});
```

- [ ] **Step 3: Register it.**
  - In `plates/index.ts`, import `ideaEmWorld` and add `ideaEmWorld.plate` to `plates` and `[ideaEmWorld.plate.id]: ideaEmWorld` to `ideaPlates`.
  - In `concepts/electrostatics.ts`, delete the `locked("em1.intro.em-world", …)` line.
  - In `index.ts`, import `{ emWorld } from "./concepts/intro"` and put `emWorld` first in the `concepts` array.

- [ ] **Step 4: Run the tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS. If a claim fails, the message prints the model value; fix the claim and the text together, keeping the text's precision, and log a ruling. If the lint fires, follow the Global Constraints.

- [ ] **Step 5: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Unit 1 concept and Idea 1, EM in the world (spectrum, Maxwell, antennas, infrastructure)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 3: Idea ②, units, prefixes and symbols

**Files:** Create `app/packages/course-em1/src/plates/idea-units.ts`. Modify `plates/index.ts` and `concepts/intro.ts` (add the second block).

- [ ] **Step 1: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const INCH = 0.0254;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const si = instantiate(templates.find((t) => t.id === "unit-si-length")!, 1);
const eq = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaUnits = defineIdeaPlate({
  id: "idea-units",
  title: "Units, prefixes and symbols",
  requires: { objectives: [2], items: ["mst-2324-q2c", "mst-2324-q1b", "mst-2324-q4c"], misconceptions: ["PREFIX_POWER", "SYMBOL_CASE"] },
  instances: [
    { id: "conv", component: "unit-convert", params: { value: 12.8, unit: "cm" } },
    { id: "eq", component: "equation", params: eq(R`1\ \text{cm}=10^{-2}\ \text{m}`, "one centimetre is ten to the minus two metres") },
  ],
  ideas: [
    {
      id: "units",
      title: "Units, prefixes and symbols",
      objectives: [2],
      explain: [
        {
          id: "si", title: "Formulas expect SI", show: ["conv"], focus: ["conv"],
          note: "Every formula in this course assumes SI units: metres, kilograms, seconds, amperes, and coulombs for charge. The constant ε₀ = 8.854 × 10⁻¹² F/m has metres built into it, so a distance entered in centimetres makes Coulomb's law wrong by a factor of ten thousand. The rule is simple: convert every given quantity to SI before you substitute. The plate converts 12.8 cm: 0.128 m.",
          claims: [{ instance: "conv", readout: "siM", value: 0.128, unit: "m" }],
        },
        {
          id: "prefixes", title: "The prefix ladder", show: ["eq"], patch: { conv: { value: 250, unit: "µm" }, eq: eq(R`\text{p}=10^{-12}\ \ \text{n}=10^{-9}\ \ \mu=10^{-6}\ \ \text{m}=10^{-3}\ \ \text{c}=10^{-2}\ \ \text{k}=10^{3}\ \ \text{M}=10^{6}\ \ \text{G}=10^{9}`, "the prefix ladder") }, focus: ["conv", "eq"],
          note: "A prefix is a power of ten attached to a unit. Past papers use all of these: nanometres for point charges, micrometres for field points, millimetres for displacements, nanocoulombs and millicoulombs for charge, gigahertz for signals. Case matters. Lower-case m is milli (10⁻³) but capital M is mega (10⁶), so 200 mC is 0.2 C while 200 MC would be two hundred million coulombs. On the plate, 250 µm becomes 0.00025 m.",
          claims: [{ instance: "conv", readout: "siM", value: 0.00025, unit: "m" }],
          givens: [{ value: 0.2, unit: "C" }],
        },
        {
          id: "powers", title: "Squares and cubes", patch: { conv: { value: 5, unit: "cm^2" }, eq: eq(R`1\ \text{cm}^2=(10^{-2}\ \text{m})^2=10^{-4}\ \text{m}^2`, "one square centimetre is ten to the minus four square metres") }, focus: ["conv", "eq"],
          note: "When a unit is squared or cubed, so is its prefix. One square centimetre is (10⁻² m)², which is 10⁻⁴ m², not 10⁻². One cubic centimetre is 10⁻⁶ m³. This bites in surface charge (µC/m²) and volume charge (µC/m³) questions. On the plate, 5 cm² becomes 0.0005 m².",
          claims: [{ instance: "conv", readout: "siM2", value: 0.0005, unit: "m^2" }],
        },
        {
          id: "inches", title: "Inches, and when not to convert", patch: { conv: { value: 0.28, unit: "in" }, eq: eq(R`1\ \text{inch}=0.0254\ \text{m}\ \text{(exactly)}`, "one inch is exactly 0.0254 metres") }, focus: ["conv", "eq"],
          note: "The 2023 mid-semester test gave a coaxial cable in inches. One inch is exactly 0.0254 m, so the 0.28 inch core radius is 0.007112 m. Now look at what the formula needs. The coax capacitance uses ln(b/a), a ratio of two radii. A ratio has no units, so b/a is the same in inches or metres. Convert what the formula needs in SI (the length, the permittivity) and leave ratios alone.",
          claims: [{ instance: "conv", readout: "siM", value: 0.007112, unit: "m" }],
          givens: [{ value: INCH, unit: "m" }],
        },
        {
          id: "sigfigs", title: "Significant figures and symbols", patch: { conv: { value: 25, unit: "nC" } }, focus: ["conv"],
          note: "The lecturer marks presentation. State the formula, show the substitution with units, and give the answer to a sensible number of significant figures, usually three or four, to match the data. Write vectors in bold or with an arrow, and unit vectors with a hat: âₓ, not ax. On the plate, 25 nC is 2.5 × 10⁻⁸ C. Write it that way, not as 0.000000025.",
          claims: [{ instance: "conv", readout: "siC", value: 2.5e-8, unit: "C" }],
        },
      ],
      examples: [
        {
          id: "radius", level: "basic", title: "Diameter to radius (MST Q2(c))",
          setup: { conv: { value: 12.8, unit: "cm" } },
          problem: "A thin metal sphere has a diameter of 12.8 cm. Find its radius in metres, ready for V = Q/(4πε₀R).",
          lines: [
            { text: "Convert first: 12.8 cm = 0.128 m.", focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 0.128, unit: "m" }] },
            { text: "The radius is half the diameter: R = 0.064 m.", focus: ["conv"], givens: [{ value: 0.128 / 2, unit: "m" }] },
          ],
          covers: ["mst-2324-q2c"],
          trap: "Using the diameter as the radius doubles R and halves V. Read the question twice: diameter or radius?",
        },
        {
          id: "mm", level: "tutorial", title: "Millimetre coordinates (MST Q1(b))",
          setup: { conv: { value: 10, unit: "mm" } },
          problem: "Two charges sit at P1(2, 2, 13) mm and P2(10, 2, 7) mm. Find the length of R12 in metres.",
          lines: [
            { text: "Subtract in millimetres first: R12 = P2 − P1 = (8, 0, −6) mm.", focus: ["conv"] },
            { text: "Length: √(8² + 0² + 6²) = 10 mm.", focus: ["conv"] },
            { text: "Convert once at the end: 10 mm = 0.010 m.", focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 0.01, unit: "m" }] },
          ],
          covers: ["mst-2324-q1b"],
          trap: "Squaring millimetres and then converting with × 10⁻³ gives a wrong R²: squares need × 10⁻⁶. Convert the length first, then square.",
        },
        {
          id: "coax", level: "exam", title: "Coax radii in inches (MST Q4(c))",
          setup: { conv: { value: 0.28, unit: "in" } },
          problem: "A 100 km coaxial cable has a solid core of radius 0.28 inch and insulation of diameter 0.90 inch. Prepare every quantity for C = 2πεL / ln(b/a).",
          givens: [{ value: 0.9 * INCH, unit: "m" }],
          lines: [
            { text: "Core radius: a = 0.28 inch = 0.007112 m.", focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 0.007112, unit: "m" }] },
            { text: "The outer radius is half the 0.90 inch diameter: b = 0.45 inch = 0.01143 m.", patch: { conv: { value: 0.45, unit: "in" } }, focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 0.01143, unit: "m" }], givens: [{ value: 0.9 * INCH, unit: "m" }] },
            { text: "The ratio needs no conversion: b/a = 0.45/0.28 = 1.607, so ln(b/a) = 0.4745.", focus: ["conv"] },
            { text: "The length does: L = 100 km = 1.00 × 10⁵ m. Every quantity is now ready; the capacitance lesson finishes the calculation.", patch: { conv: { value: 100, unit: "km" } }, focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 1e5, unit: "m" }] },
          ],
          covers: ["mst-2324-q4c"],
          trap: "Forgetting that the insulation figure is a diameter. The formula wants the outer radius, which is half of it.",
        },
      ],
      asks: [
        { id: "why-si", q: "Why can't I keep millimetres in Coulomb's law?", a: "Because k = 8.99 × 10⁹ N·m²/C² was measured in metres. Put millimetres in and R² is numerically a million times too big, so the force comes out a million times too small. Convert first, then substitute." },
        { id: "mu-u", q: "Is µ the same as u?", a: "Yes. u is a typing stand-in for the Greek µ (micro, 10⁻⁶). In written answers, use µ." },
        { id: "cm2", q: "Why isn't 1 cm² equal to 0.01 m²?", tags: ["PREFIX_POWER"], show: ["conv"], patch: { conv: { value: 1, unit: "cm^2" } }, focus: ["conv"], a: "Because the whole length is squared. A square centimetre is a centimetre times a centimetre: (10⁻² m)² = 10⁻⁴ m², which is 0.0001 m², not a hundredth. The prefix is squared along with the metre." },
        { id: "sigfig", q: "How many significant figures should I give?", a: "Match the data. If the question gives values to three significant figures, answer to three or four. Keep extra digits in your working and round only the final answer." },
        { id: "ratio", q: "Why did b/a not need converting?", a: "Units cancel in a ratio. 0.45 ÷ 0.28 in inches and 0.01143 ÷ 0.007112 in metres both give 1.607. A logarithm needs a pure number, and a ratio of two lengths is one." },
        { id: "case", q: "What's the difference between m and M?", tags: ["SYMBOL_CASE"], a: "Lower-case m is milli (10⁻³); capital M is mega (10⁶). Between them is a factor of a billion. The same goes for mC and MC. Symbols are case-sensitive, so copy them exactly." },
        { id: "hat", q: "Why does the lecturer insist on âₓ, not ax?", a: "Because ax could mean a times x. The hat marks a unit vector: a direction with length one. Clear notation earns marks, and it stops you mixing up a vector and its magnitude." },
      ],
      checks: [
        {
          id: "cm2", title: "Check: square centimetres", show: ["conv"], patch: { conv: { value: 12.8, unit: "cm" } },
          note: "Four checks on units. Get each right to move on.",
          interaction: { id: "cm2", type: "choose", prompt: "One square centimetre in square metres is…", dimension: "conceptual",
            options: [
              choice("e4", "10⁻⁴ m²", true, "Right: (10⁻² m)² = 10⁻⁴ m²."),
              choice("e2", "10⁻² m²", false, "The prefix is squared too: (10⁻²)² = 10⁻⁴.", "PREFIX_POWER"),
              choice("100", "100 m²", false, "A square centimetre is far smaller than a square metre."),
            ] },
        },
        {
          id: "convert", title: "Check: to metres, your numbers",
          note: "A conversion of your own.",
          interaction: { id: "convert", type: "numeric", prompt: si.prompt, answer: si.spec.answer, distractors: si.spec.distractors, relTol: si.spec.relTol, hints: si.hints, template: "unit-si-length", dimension: "computational" },
        },
        {
          id: "case", title: "Check: symbols",
          note: "Read the symbol carefully.",
          interaction: { id: "case", type: "choose", prompt: "A charge of 5 MC is…", dimension: "recognition",
            options: [
              choice("mega", "five million coulombs", true, "Right: capital M is mega, 10⁶."),
              choice("milli", "five millicoulombs", false, "Millicoulombs are written mC, with a lower-case m.", "SYMBOL_CASE"),
              choice("micro", "five microcoulombs", false, "Microcoulombs are written µC."),
            ] },
        },
        {
          id: "inch", title: "Check: the coax core",
          note: "Last one: the inch.",
          interaction: { id: "inch", type: "numeric", prompt: "The mid-semester test's coax core has radius 0.28 inch. Give it in metres.", answer: { value: 0.007112, unit: "m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0.0028, unit: "m", errorClass: "unit", feedback: "That treats inches like centimetres. One inch is exactly 0.0254 m." }],
            hints: ["1 inch = 0.0254 m exactly.", "Multiply.", "0.28 × 0.0254."] },
          covers: ["mst-2324-q4c"],
        },
      ],
      recap: {
        points: [
          "Convert every given value to SI before substituting.",
          "Prefix ladder: p 10⁻¹², n 10⁻⁹, µ 10⁻⁶, m 10⁻³, c 10⁻², k 10³, M 10⁶, G 10⁹.",
          "Squared and cubed units square and cube the prefix: 1 cm² = 10⁻⁴ m².",
          "One inch is exactly 0.0254 m; ratios of lengths need no conversion.",
          "Three or four significant figures; hats on unit vectors.",
        ],
        traps: ["1 cm² = 0.01 m².", "Mixing up m (milli) and M (mega).", "Using a diameter as the radius."],
      },
    },
  ],
});
```

- [ ] **Step 2: Register it.**
  - Add it to `plates/index.ts`.
  - Append this block to the `main` lesson in `concepts/intro.ts`:

    ```ts
    { ...meta("vivid", src("UTech ELE3001 Unit 1 slides (G. D. Boswell)", "units")), id: "idea-units", type: "plate", plateId: "idea-units" }
    ```

    Use the concept's `UNIT1` constant.

- [ ] **Step 3: Run the tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS. Two lint details:
- The lint converts written units to SI through the F2 change, so "0.28 inch" is backed by `siM` 0.007112.
- On the exam example's problem step, "0.90 inch" is backed by the example-level `givens`.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 2, units, prefixes and symbols (SI, ladder, squares, inches, notation)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 4: Vectors concept, and Idea ③ (components, length, unit and displacement vectors)

**Files:**
- Modify: `app/packages/course-em1/src/concepts/math.ts` (objectives, misconceptions, lessons), `plates/index.ts`
- Create: `app/packages/course-em1/src/plates/idea-vec-basics.ts`
- Delete: the F2 `toolkit-preview` lesson and plate (`plates/toolkit-preview.ts`, its registration, and `apps/web/e2e/toolkit.spec.ts`)

- [ ] **Step 1: Rewrite the vectors concept header.** In `concepts/math.ts`, `vectors`:
  - `title: "Vectors and coordinate systems"`
  - `objectives`:

    ```ts
    [
      "Write vectors in components; find magnitudes and unit vectors.",
      "Form position and displacement vectors, with units.",
      "Use dot and cross products: angles, projections and perpendiculars.",
      "Convert points and vectors between cartesian, cylindrical and spherical coordinates.",
      "Build dl, dS and dv in all three coordinate systems.",
    ]
    ```

  - `misconceptions`:

    ```ts
    [
      { tag: "DISPLACEMENT_ORDER", description: "Writes R12 = r1 − r2 (start minus end).", remediation: "em1.math.vectors/main" },
      { tag: "UNIT_VECTOR_LENGTH", description: "Forgets to divide by the magnitude, or divides by the sum of components.", remediation: "em1.math.vectors/main" },
      { tag: "DOT_CROSS_CONFUSION", description: "Uses the dot product where a perpendicular vector (cross product) is needed.", remediation: "em1.math.vectors/main" },
      { tag: "PHI_QUADRANT", description: "Takes φ straight from tan⁻¹(y/x) without placing the quadrant.", remediation: "em1.math.vectors/main" },
      { tag: "ELEMENT_SCALE_FACTOR", description: "Drops ρ, r or sin θ from dl, dS or dv.", remediation: "em1.math.vectors/main" },
    ]
    ```

  - `lessons`: rename the existing `main` to `id: "quick", title: "Quick refresher: the dot product"`, and remove the `toolkit-preview` lesson. Put a new `main` first:

    ```ts
    { id: "main", title: "Vectors and coordinate systems (in depth)", minutes: 80, blocks: [
      { ...meta("vivid", src(SLIDES_2A, "Vector algebra")), id: "idea-vec-basics", type: "plate", plateId: "idea-vec-basics" },
    ] },
    ```

  - Search for the old path: `grep -rn "em1.math.vectors/main\|vectors/main" app --include=*.ts --include=*.tsx`.
    - Point every hit that meant the classic lesson at `quick`. Examples: `apps/web/e2e/desk.spec.ts`'s `/learn/em1.math.vectors/main` becomes `/learn/em1.math.vectors/quick`; `pastPapers` and `practice` refs; `diagnostic.ts` routes.
    - Leave the new remediation strings above as they are.

- [ ] **Step 2: The idea plate** in `plates/idea-vec-basics.ts`

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const K = 0.3; // drawing scale for A, B and their sums
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const tpl = (id: string) => instantiate(templates.find((t) => t.id === id)!, 1);
const sum = tpl("vec-sum-mag");
const dist = tpl("vec-distance-mm");
const v3 = (to: number[], label: string, tone: string, drawScale = K) => ({ component: "vector3", params: { from: [0, 0, 0], to, label, tone, drawScale } });

export const ideaVecBasics = defineIdeaPlate({
  id: "idea-vec-basics",
  title: "Components, length, unit and displacement vectors",
  requires: { objectives: [0, 1], items: ["tutorial:tut-1.1", "tutorial:tut-1.2", "mst-2324-q1b"], misconceptions: ["DISPLACEMENT_ORDER", "UNIT_VECTOR_LENGTH"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 2 } },
    { id: "a", ...v3([1, 0, 3], "A", "field") },
    { id: "b", ...v3([5, 2, -6], "B", "flux") },
    { id: "s", ...v3([6, 2, -3], "A + B", "surface") },
    { id: "u", ...v3([6 / 7, 2 / 7, -3 / 7], "â (drawn ×1)", "ink", 1) },
    { id: "r", component: "vector3", params: { from: [0.002, 0.002, 0.013], to: [0.01, 0.002, 0.007], label: "R12 (drawn ×150)", tone: "field", unit: "m", drawScale: 150, components: true } },
    { id: "eq", component: "equation", params: { latex: R`|\mathbf A|=\sqrt{A_x^2+A_y^2+A_z^2}`, speech: "the magnitude of A is the square root of the sum of the squared components", shortSpeech: "magnitude" } },
  ],
  ideas: [
    {
      id: "vec-basics",
      title: "Components, length, unit and displacement vectors",
      objectives: [0, 1],
      explain: [
        {
          id: "components", title: "A vector is three numbers", show: ["axes", "a", "eq"], focus: ["a"],
          note: "A vector has a size and a direction. In cartesian form it is three components along the unit vectors âₓ, âᵧ and âz. A = âₓ + 3âz means one step along x, none along y and three up z. Its length (magnitude) comes from Pythagoras in three dimensions: |A| = √(1² + 0² + 3²) = √10 = 3.162. The plate draws A from the origin at 0.3 scale; the readouts give its true components and magnitude.",
          claims: [{ instance: "a", readout: "vmag", value: 3.16228, unit: "" }],
        },
        {
          id: "add", title: "Adding: component by component", show: ["b", "s"], focus: ["s"],
          note: "To add vectors, add matching components. With B = 5âₓ + 2âᵧ − 6âz, A + B = (1 + 5)âₓ + (0 + 2)âᵧ + (3 − 6)âz = 6âₓ + 2âᵧ − 3âz. Its magnitude is √(36 + 4 + 9) = 7. Notice that |A| + |B| = 3.162 + 8.062 = 11.22, not 7: lengths add only when the vectors point the same way. Subtraction works the same way, component by component.",
          claims: [{ instance: "s", readout: "vmag", value: 7, unit: "" }, { instance: "b", readout: "vmag", value: 8.06226, unit: "" }],
        },
        {
          id: "unit", title: "Unit vectors: direction only", show: ["u"], focus: ["u", "s"],
          note: "A unit vector keeps a vector's direction and throws away its size: divide by the magnitude. The unit vector of A + B is (6âₓ + 2âᵧ − 3âz)/7 = 0.8571âₓ + 0.2857âᵧ − 0.4286âz, and its length is exactly 1. Every force and field in this course is written as magnitude × unit vector, so this step appears in every Coulomb question.",
          claims: [{ instance: "u", readout: "vmag", value: 1, unit: "" }],
        },
        {
          id: "position", title: "Position and displacement vectors", hide: ["a", "b", "s", "u", "eq"], show: ["r"], focus: ["r"],
          note: "A position vector runs from the origin to a point: P(2, 2, 13) mm has position vector 2âₓ + 2âᵧ + 13âz mm. A displacement vector runs from one point to another: R12 = r2 − r1, always end minus start. From P1(2, 2, 13) mm to P2(10, 2, 7) mm, R12 = 8âₓ − 6âz mm, with length 10 mm, which is 0.010 m. The plate draws it enlarged 150 times; the readouts are in metres.",
          claims: [{ instance: "r", readout: "vmagm", value: 0.01, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "sum", level: "basic", title: "Tutorial 1.1: |A + B|, 5A − B, and a unit vector",
          show: ["axes", "a", "b", "s"], hide: ["r", "u", "eq"], setup: { s: { to: [6, 2, -3], label: "A + B" } },
          problem: "Given A = âₓ + 3âz and B = 5âₓ + 2âᵧ − 6âz, find |A + B|, 5A − B, the component of A along âᵧ, and a unit vector parallel to 3A + B.",
          lines: [
            { text: "A + B = 6âₓ + 2âᵧ − 3âz, so |A + B| = √(36 + 4 + 9) = 7.", focus: ["s"], claims: [{ instance: "s", readout: "vmag", value: 7, unit: "" }] },
            { text: "5A − B = (5 − 5)âₓ + (0 − 2)âᵧ + (15 + 6)âz = −2âᵧ + 21âz.", focus: ["a", "b"] },
            { text: "The component of A along âᵧ is A·âᵧ = 0: A has no y part.", focus: ["a"] },
            { text: "3A + B = 8âₓ + 2âᵧ + 3âz, of length √77 = 8.775, so the unit vector is ±(0.9117, 0.2279, 0.3419).", patch: { s: { to: [8, 2, 3], label: "3A + B" } }, focus: ["s"], claims: [{ instance: "s", readout: "vmag", value: 8.77496, unit: "" }] },
          ],
          covers: ["tutorial:tut-1.1"],
          trap: "Adding magnitudes: |A| + |B| = 11.22 is not |A + B| = 7. Add components first, then take the length.",
        },
        {
          id: "distance", level: "tutorial", title: "Tutorial 1.2: position and distance vectors",
          show: ["axes", "s"], hide: ["a", "b", "r", "u", "eq"], setup: { s: { from: [2, 4, 6], to: [0, 3, 8], label: "r_QR", drawScale: 0.2 } },
          problem: "Given P(1, −3, 5), Q(2, 4, 6) and R(0, 3, 8), find the position vectors of P and R, the distance vector r_QR, and the distance between Q and R.",
          lines: [
            { text: "Position vectors come straight from the coordinates: r_P = âₓ − 3âᵧ + 5âz and r_R = 3âᵧ + 8âz.", focus: ["axes"] },
            { text: "Distance vector, end minus start: r_QR = r_R − r_Q = (0 − 2)âₓ + (3 − 4)âᵧ + (8 − 6)âz = −2âₓ − âᵧ + 2âz.", focus: ["s"], claims: [{ instance: "s", readout: "vx", value: -2, unit: "" }] },
            { text: "Distance: |r_QR| = √(4 + 1 + 4) = 3.", focus: ["s"], claims: [{ instance: "s", readout: "vmag", value: 3, unit: "" }] },
          ],
          covers: ["tutorial:tut-1.2"],
          trap: "Writing r_QR = r_Q − r_R points the vector the wrong way. The length is the same, but in Coulomb's law the direction is the whole answer.",
        },
        {
          id: "mst", level: "exam", title: "MST 2023-24 Q1(b)(i): R12 in metres",
          show: ["r"], hide: ["axes", "a", "b", "s", "u", "eq"], setup: {},
          problem: "q1 is at P1(2, 2, 13) mm and q2 is at P2(10, 2, 7) mm. Find the displacement vector R12 and its length in metres, and the unit vector a12.",
          lines: [
            { text: "R12 = P2 − P1 = (10 − 2)âₓ + (2 − 2)âᵧ + (7 − 13)âz = 8âₓ − 6âz mm.", focus: ["r"], claims: [{ instance: "r", readout: "vxm", value: 0.008, unit: "m" }] },
            { text: "In metres, R12 = 0.008âₓ − 0.006âz, with length √(0.008² + 0.006²) = 0.010 m.", focus: ["r"], claims: [{ instance: "r", readout: "vmagm", value: 0.01, unit: "m" }] },
            { text: "The unit vector a12 = R12/|R12| = 0.8âₓ − 0.6âz, with no units.", focus: ["r"] },
          ],
          covers: ["mst-2324-q1b"],
          trap: "Leaving R12 in millimetres while ε₀ is in F/m makes the force a million times too small. Convert before substituting.",
        },
      ],
      asks: [
        { id: "negative", q: "Can a magnitude be negative?", a: "No. A magnitude is a length, √(Aₓ² + Aᵧ² + A_z²), so it is never negative. A minus sign belongs to a component, as in −6âz, and means the other way along that axis." },
        { id: "order", q: "Does R12 point from 1 to 2, or from 2 to 1?", tags: ["DISPLACEMENT_ORDER"], a: "From 1 to 2: R12 = r2 − r1, end minus start. Swapping the order flips the direction but not the length. In Coulomb's law F12 is the force on charge 2 due to charge 1, so for repelling charges it points along R12." },
        { id: "why-unit", q: "Why divide by the magnitude to get a unit vector?", tags: ["UNIT_VECTOR_LENGTH"], a: "Dividing every component by the same number keeps the direction and scales the length; dividing by |A| scales it to exactly 1. Skip that step, or divide by the sum of the components, and your unit vector carries the wrong size into the answer." },
        { id: "3d", q: "Is 3D Pythagoras really just one more square?", a: "Yes. On the floor, x and y give √(x² + y²). That diagonal and z form another right angle, so the full length is √(x² + y² + z²)." },
        { id: "point-vs-vector", q: "What's the difference between a point and a position vector?", a: "A point is a location, written P(1, 3, 5). Its position vector is the arrow from the origin to it, âₓ + 3âᵧ + 5âz. The numbers are the same but the jobs differ: you can add and subtract vectors, not points." },
        { id: "scalar-times", q: "What does 5A mean?", a: "Multiply every component by 5. The direction stays the same and the length becomes five times longer. A negative multiplier flips the direction." },
        { id: "zero", q: "Why does A have no âᵧ in it?", a: "Its y-component is zero, so the arrow lies in the x–z plane. Writing A = âₓ + 0âᵧ + 3âz makes that explicit, which helps when subtracting." },
      ],
      checks: [
        {
          id: "unit-length", title: "Check: a unit vector", show: ["axes", "a", "b", "s"], hide: ["r", "u", "eq"], patch: { s: { from: [0, 0, 0], to: [6, 2, -3], label: "A + B", drawScale: K } },
          note: "Five checks on vectors. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "unit-length", type: "choose", prompt: "The unit vector of 3âₓ + 4âz is…", dimension: "computational",
            options: [
              choice("right", "0.6âₓ + 0.8âz", true, "Right: divide by √(9 + 16) = 5."),
              choice("sum", "(3âₓ + 4âz)/7", false, "7 is the sum of the components, not the length. Divide by √(9 + 16) = 5.", "UNIT_VECTOR_LENGTH"),
              choice("ones", "âₓ + âz", false, "That has length √2, not 1, and the wrong direction."),
            ] },
        },
        {
          id: "predict-mag", title: "Check: predict |A + B|",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-mag", type: "predict-drag", prompt: "B changes to 5âₓ + 2âᵧ + 6âz: its z part flips sign. Drag |A + B| to your prediction.", target: { instance: "s", readout: "vmag" }, range: [0, 15], unit: "", relTol: 0.05, reveal: { b: { to: [5, 2, 6] }, s: { to: [6, 2, 9] } }, dimension: "conceptual",
            feedback: { close: "Right: √(36 + 4 + 81) = 11.", far: "A + B = 6âₓ + 2âᵧ + 9âz, of length √121 = 11." } },
        },
        {
          id: "sum-num", title: "Check: |A + B|, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "sum-num", type: "numeric", prompt: sum.prompt, answer: sum.spec.answer, distractors: sum.spec.distractors, relTol: sum.spec.relTol, hints: sum.hints, template: "vec-sum-mag", dimension: "computational" },
        },
        {
          id: "dist-num", title: "Check: a displacement in metres",
          note: "Millimetres, like the mid-semester test.",
          interaction: { id: "dist-num", type: "numeric", prompt: dist.prompt, answer: dist.spec.answer, distractors: dist.spec.distractors, relTol: dist.spec.relTol, hints: dist.hints, template: "vec-distance-mm", dimension: "computational" },
          covers: ["mst-2324-q1b"],
        },
        {
          id: "order", title: "Check: end minus start",
          note: "Last one.",
          interaction: { id: "order", type: "choose", prompt: "The displacement vector from P1 to P2 is…", dimension: "recognition",
            options: [
              choice("right", "r2 − r1", true, "Right: end minus start."),
              choice("flip", "r1 − r2", false, "That points from P2 to P1.", "DISPLACEMENT_ORDER"),
              choice("add", "r1 + r2", false, "Adding position vectors doesn't give a displacement."),
            ] },
        },
      ],
      recap: {
        points: [
          "A = Aₓâₓ + Aᵧâᵧ + A_zâz; |A| = √(Aₓ² + Aᵧ² + A_z²).",
          "Add and subtract component by component; magnitudes don't add.",
          "Unit vector: â = A/|A|, with length 1.",
          "Displacement: R12 = r2 − r1 (end minus start); convert mm to m before substituting.",
        ],
        traps: ["Adding magnitudes.", "Writing r1 − r2.", "Forgetting to divide by |A|, or dividing by the sum of the components."],
      },
    },
  ],
});
```

- [ ] **Step 3: Register it** in `plates/index.ts`. Then run `pnpm vitest run packages/course-em1 && pnpm typecheck`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A packages/course-em1 apps/web && git commit -m "feat(course-em1): vectors concept at depth; Idea 1, components, length, unit and displacement vectors; old lesson moves to quick

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 5: Idea ④, dot and cross products, angles and projections

**Files:** Create `app/packages/course-em1/src/plates/idea-vec-products.ts`. Modify `plates/index.ts` and `concepts/math.ts` (append the block `{ ...meta("vivid", src(SLIDES_2A, "Multiplication")), id: "idea-vec-products", type: "plate", plateId: "idea-vec-products" }`).

- [ ] **Step 1: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const ang = instantiate(templates.find((t) => t.id === "vec-angle")!, 1);
const v3 = (to: number[], label: string, tone: string, drawScale: number) => ({ component: "vector3", params: { from: [0, 0, 0], to, label, tone, drawScale } });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaVecProducts = defineIdeaPlate({
  id: "idea-vec-products",
  title: "Dot and cross products, angles and projections",
  requires: { objectives: [2], items: ["tutorial:tut-1.4", "tutorial:tut-1.5"], misconceptions: ["DOT_CROSS_CONFUSION"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 2 } },
    { id: "a", ...v3([1, 0, 3], "A", "field", 0.3) },
    { id: "b", ...v3([5, 2, -6], "B", "flux", 0.3) },
    { id: "e", ...v3([0, 3, 4], "E", "field", 0.2) },
    { id: "f", ...v3([4, -10, 5], "F", "flux", 0.2) },
    { id: "n", ...v3([55, 16, -12], "E × F (drawn ÷50)", "surface", 0.02) },
    { id: "eq", component: "equation", params: eqp(R`\mathbf A\cdot\mathbf B=A_xB_x+A_yB_y+A_zB_z=|\mathbf A||\mathbf B|\cos\theta`, "A dot B") },
  ],
  ideas: [
    {
      id: "vec-products",
      title: "Dot and cross products, angles and projections",
      objectives: [2],
      explain: [
        {
          id: "dot", title: "The dot product: how much lies along", show: ["axes", "a", "b", "eq"], focus: ["a", "b"],
          note: "The dot product multiplies two vectors and returns a scalar: A·B = AₓBₓ + AᵧBᵧ + A_zB_z = |A||B| cos θ. For A = âₓ + 3âz and B = 5âₓ + 2âᵧ − 6âz, A·B = 5 + 0 − 18 = −13. It measures how much of one vector lies along the other. It is positive when they point roughly together, zero when they are perpendicular, and negative when they point roughly apart, as here.",
        },
        {
          id: "angle", title: "Finding the angle", patch: { eq: eqp(R`\cos\theta=\dfrac{\mathbf A\cdot\mathbf B}{|\mathbf A||\mathbf B|}`, "cos theta equals A dot B over the magnitudes") }, focus: ["a", "b", "eq"],
          note: "Rearranged, the dot product gives the angle between two vectors: cos θ = A·B / (|A||B|) = −13 / (3.162 × 8.062) = −0.5099, so θ = 120.66°. The angle always lies between 0° and 180°: the dot product can't tell left from right, only how aligned two vectors are. This is Tutorial 1.4, and it is how flux picks out the angle between D and a surface normal.",
          claims: [{ instance: "a", readout: "vmag", value: 3.16228, unit: "" }, { instance: "b", readout: "vmag", value: 8.06226, unit: "" }],
        },
        {
          id: "projection", title: "Projection: the component along another vector", hide: ["a", "b"], show: ["e", "f"], patch: { eq: eqp(R`\text{comp}_{\mathbf F}\mathbf E=\dfrac{\mathbf E\cdot\mathbf F}{|\mathbf F|},\quad \text{proj}_{\mathbf F}\mathbf E=\dfrac{\mathbf E\cdot\mathbf F}{|\mathbf F|^2}\mathbf F`, "the component and projection of E along F") }, focus: ["e", "f"],
          note: "The scalar component of E along F is E·F/|F|: how far E reaches in F's direction. With E = 3âᵧ + 4âz and F = 4âₓ − 10âᵧ + 5âz, E·F = 0 − 30 + 20 = −10 and |F| = 11.87, so the scalar component is −0.8422. The vector component multiplies that by F's unit vector: (E·F/|F|²)F = −0.2837âₓ + 0.7092âᵧ − 0.3546âz. The minus sign means E leans against F.",
          claims: [{ instance: "f", readout: "vmag", value: 11.8743, unit: "" }, { instance: "e", readout: "vmag", value: 5, unit: "" }],
        },
        {
          id: "cross", title: "The cross product: a perpendicular vector", show: ["n"], patch: { eq: eqp(R`\mathbf E\times\mathbf F=\begin{vmatrix}\mathbf a_x&\mathbf a_y&\mathbf a_z\\E_x&E_y&E_z\\F_x&F_y&F_z\end{vmatrix}`, "E cross F as a determinant") }, focus: ["n", "e", "f"],
          note: "The cross product returns a vector perpendicular to both inputs, with length |E||F| sin θ, the area of the parallelogram they span. Expand the determinant: E × F = (3·5 − 4·(−10))âₓ − (0·5 − 4·4)âᵧ + (0·(−10) − 3·4)âz = 55âₓ + 16âᵧ − 12âz. Its direction follows the right-hand rule: curl your fingers from E to F and your thumb points along E × F. Order matters: F × E = −(E × F).",
          claims: [{ instance: "n", readout: "vmag", value: 58.5235, unit: "" }],
        },
      ],
      examples: [
        {
          id: "angle", level: "basic", title: "Tutorial 1.4: θ between A and B",
          show: ["a", "b"], hide: ["e", "f", "n"], setup: {},
          problem: "If A = âₓ + 3âz and B = 5âₓ + 2âᵧ − 6âz, find θ_AB.",
          lines: [
            { text: "A·B = (1)(5) + (0)(2) + (3)(−6) = −13.", focus: ["a", "b"] },
            { text: "|A| = √10 = 3.162 and |B| = √65 = 8.062.", focus: ["a", "b"], claims: [{ instance: "a", readout: "vmag", value: 3.16228, unit: "" }, { instance: "b", readout: "vmag", value: 8.06226, unit: "" }] },
            { text: "cos θ = −13 / (3.162 × 8.062) = −0.5099, so θ = 120.66°.", latex: R`\theta=\cos^{-1}(-0.5099)=120.66^\circ`, focus: ["a", "b"] },
          ],
          covers: ["tutorial:tut-1.4"],
          trap: "Taking cos⁻¹ of +0.5099 because angles feel positive gives 59.34°. Keep the sign: a negative dot product means an obtuse angle.",
        },
        {
          id: "component", level: "tutorial", title: "Tutorial 1.5(a): the component of E along F",
          show: ["e", "f"], hide: ["a", "b", "n"], setup: {},
          problem: "Let E = 3âᵧ + 4âz and F = 4âₓ − 10âᵧ + 5âz. Find the component of E along F.",
          lines: [
            { text: "E·F = (0)(4) + (3)(−10) + (4)(5) = −10.", focus: ["e", "f"] },
            { text: "|F|² = 16 + 100 + 25 = 141.", focus: ["f"], claims: [{ instance: "f", readout: "vmag", value: 11.8743, unit: "" }] },
            { text: "The vector component is (E·F/|F|²)F = (−10/141)(4âₓ − 10âᵧ + 5âz) = −0.2837âₓ + 0.7092âᵧ − 0.3546âz.", focus: ["e", "f"] },
          ],
          covers: ["tutorial:tut-1.5"],
          trap: "Dividing by |F| instead of |F|² gives a vector 11.87 times too long. Scalar component: ÷ |F|. Vector component: ÷ |F|², then × F.",
        },
        {
          id: "perp", level: "exam", title: "Tutorial 1.5(b): a unit vector perpendicular to both",
          show: ["e", "f", "n"], hide: ["a", "b"], setup: {},
          problem: "Determine a unit vector perpendicular to both E and F.",
          lines: [
            { text: "E × F is perpendicular to both: E × F = 55âₓ + 16âᵧ − 12âz.", focus: ["n"], claims: [{ instance: "n", readout: "vx", value: 55, unit: "" }] },
            { text: "|E × F| = √(3025 + 256 + 144) = √3425 = 58.52.", focus: ["n"], claims: [{ instance: "n", readout: "vmag", value: 58.5235, unit: "" }] },
            { text: "The unit vector is ±(55âₓ + 16âᵧ − 12âz)/58.52 = ±(0.9398âₓ + 0.2734âᵧ − 0.2050âz). Both signs are perpendicular.", focus: ["n"] },
          ],
          covers: ["tutorial:tut-1.5"],
          trap: "Reaching for the dot product: E·F = −10 is a number, not a direction. Perpendicular to two vectors always means the cross product.",
        },
      ],
      asks: [
        { id: "dot-vs-cross", q: "When do I use the dot product, and when the cross product?", tags: ["DOT_CROSS_CONFUSION"], a: "Use the dot product when you need a number: an angle, a projection, work, or flux (D·dS). Use the cross product when you need a direction perpendicular to two others: a surface normal, a torque, or the magnetic force qv × B." },
        { id: "zero-dot", q: "What does A·B = 0 mean?", a: "The vectors are perpendicular, or one of them is zero. It is the fastest test for perpendicularity: multiply matching components and add." },
        { id: "order-cross", q: "Does the order matter in a cross product?", a: "Yes. B × A = −(A × B): the same length, pointing the opposite way. The dot product ignores order: A·B = B·A." },
        { id: "unit-dots", q: "What are âₓ·âₓ and âₓ·âᵧ?", a: "âₓ·âₓ = 1 and âₓ·âᵧ = 0. The axis unit vectors have length one and are mutually perpendicular. That is exactly why A·B = AₓBₓ + AᵧBᵧ + A_zB_z: all the cross terms vanish." },
        { id: "unit-cross", q: "What are âₓ × âᵧ and âᵧ × âₓ?", a: "âₓ × âᵧ = âz, following the cycle x → y → z → x. Going against the cycle flips the sign: âᵧ × âₓ = −âz. Any unit vector crossed with itself gives zero." },
        { id: "range", q: "Why is the angle never more than 180°?", a: "The angle between two vectors is measured the short way round, from 0° to 180°. cos θ covers exactly that range once, so cos⁻¹ gives a single answer." },
        { id: "triple", q: "What is the scalar triple product?", a: "A·(B × C): the volume of the box the three vectors span. It is zero when the three lie in one plane. It appears in the lecture slides; in this course it is mostly a check." },
      ],
      checks: [
        {
          id: "which", title: "Check: which product?", show: ["a", "b"], hide: ["e", "f", "n"],
          note: "Five checks on products. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "which", type: "choose", prompt: "Which gives a vector perpendicular to both A and B?", dimension: "conceptual",
            options: [
              choice("cross", "A × B", true, "Right: the cross product is perpendicular to both."),
              choice("dot", "A·B", false, "A·B is a number, not a vector.", "DOT_CROSS_CONFUSION"),
              choice("sum", "A + B", false, "A + B lies in the same plane as A and B."),
            ] },
        },
        {
          id: "predict-cross", title: "Check: double F", show: ["e", "f", "n"], hide: ["a", "b"],
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-cross", type: "predict-drag", prompt: "F doubles to 8âₓ − 20âᵧ + 10âz. Drag |E × F| to your prediction.", target: { instance: "n", readout: "vmag" }, range: [0, 150], unit: "", relTol: 0.05, reveal: { f: { to: [8, -20, 10] }, n: { to: [110, 32, -24] } }, dimension: "conceptual",
            feedback: { close: "Right: doubling one factor doubles the cross product, 117.0.", far: "|E × F| = |E||F| sin θ: double |F| and the result doubles, to 117.0." } },
        },
        {
          id: "angle-num", title: "Check: an angle, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "angle-num", type: "numeric", prompt: ang.prompt, answer: ang.spec.answer, distractors: ang.spec.distractors, relTol: ang.spec.relTol, hints: ang.hints, template: "vec-angle", dimension: "computational" },
          covers: ["tutorial:tut-1.4"],
        },
        {
          id: "cycle", title: "Check: the cycle",
          note: "Unit vectors.",
          interaction: { id: "cycle", type: "choose", prompt: "âᵧ × âₓ equals…", dimension: "recognition",
            options: [
              choice("neg", "−âz", true, "Right: against the x → y → z cycle, so negative."),
              choice("pos", "âz", false, "That is âₓ × âᵧ. The order is reversed here.", "DOT_CROSS_CONFUSION"),
              choice("zero", "0", false, "Only a unit vector crossed with itself gives zero."),
            ] },
        },
        {
          id: "comp-num", title: "Check: a scalar component",
          note: "Last one: Tutorial 1.5's numbers.",
          interaction: { id: "comp-num", type: "numeric", prompt: "For E = 3âᵧ + 4âz and F = 4âₓ − 10âᵧ + 5âz, find the scalar component of E along F.", answer: { value: -0.8422, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: -0.07092, unit: "", errorClass: "conceptual", feedback: "That divides by |F|². The scalar component divides by |F| once." }],
            hints: ["E·F first.", "Then divide by |F| = √141.", "−10 ÷ 11.87."] },
          covers: ["tutorial:tut-1.5"],
        },
      ],
      recap: {
        points: [
          "A·B = AₓBₓ + AᵧBᵧ + A_zB_z = |A||B| cos θ, a scalar.",
          "cos θ = A·B / (|A||B|); keep the sign.",
          "Scalar component: E·F/|F|. Vector component: (E·F/|F|²)F.",
          "A × B is perpendicular to both, with length |A||B| sin θ; use the determinant and the right-hand rule; B × A = −A × B.",
        ],
        traps: ["Dropping the sign of cos θ.", "Dividing by |F| where |F|² is needed.", "Using the dot product when a perpendicular vector is asked for."],
      },
    },
  ],
});
```

- [ ] **Step 2: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 2 of vectors, dot and cross products, angles and projections

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 6: Idea ⑤, cylindrical and spherical coordinates

**Files:** Create `app/packages/course-em1/src/plates/idea-coords.ts`. Modify `plates/index.ts` and `concepts/math.ts` (append the `idea-coords` block with `src(SLIDES_2A, "Coordinate systems")`).

- [ ] **Step 1: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const K = 0.15;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const phi = instantiate(templates.find((t) => t.id === "coord-phi")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const S3 = Math.sqrt(3);

export const ideaCoords = defineIdeaPlate({
  id: "idea-coords",
  title: "Cylindrical and spherical coordinates",
  requires: { objectives: [3], items: ["tutorial:tut-2.1"], misconceptions: ["PHI_QUADRANT"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 2 } },
    { id: "cf", component: "coord-frame", params: { point: [1, 3, 5], system: "cart", drawScale: K } },
    { id: "eq", component: "equation", params: eqp(R`\rho=\sqrt{x^2+y^2},\quad \phi=\tan^{-1}\dfrac yx,\quad z=z`, "rho, phi, z from x, y, z") },
  ],
  ideas: [
    {
      id: "coords",
      title: "Cylindrical and spherical coordinates",
      objectives: [3],
      explain: [
        {
          id: "cyl", title: "Cylindrical: ρ, φ, z", show: ["axes", "cf", "eq"], patch: { cf: { system: "cyl" } }, focus: ["cf"],
          note: "Cylindrical coordinates describe a point by its distance from the z-axis, ρ; the angle φ, measured from the +x axis toward +y; and the same height z. For P(1, 3, 5): ρ = √(x² + y²) = √10 = 3.162, φ = tan⁻¹(y/x) = 71.57°, and z = 5. They suit anything built around an axis: wires, coaxial cables, cylinders. The dashed lines on the plate drop P onto the floor, where ρ and φ live.",
          claims: [{ instance: "cf", readout: "pRho", value: 3.16228, unit: "m" }, { instance: "cf", readout: "pPhi", value: 71.5651, unit: "°" }, { instance: "cf", readout: "pz", value: 5, unit: "m" }],
        },
        {
          id: "sph", title: "Spherical: r, θ, φ", patch: { cf: { system: "sph" }, eq: eqp(R`r=\sqrt{x^2+y^2+z^2},\quad \theta=\cos^{-1}\dfrac zr,\quad \phi=\tan^{-1}\dfrac yx`, "r, theta, phi from x, y, z") }, focus: ["cf", "eq"],
          note: "Spherical coordinates use the distance from the origin, r; the angle θ down from the +z axis; and the same φ. For P(1, 3, 5): r = √(x² + y² + z²) = √35 = 5.916, θ = cos⁻¹(z/r) = 32.31°, and φ = 71.57°. They suit anything centred on a point: point charges, spheres, antennas. θ runs from 0° (straight up) to 180° (straight down); φ runs all the way round, from 0° to 360°.",
          claims: [{ instance: "cf", readout: "pR", value: 5.91608, unit: "m" }, { instance: "cf", readout: "pTheta", value: 32.3115, unit: "°" }],
        },
        {
          id: "quadrant", title: "The quadrant trap", patch: { cf: { point: [-3, -4, -10], system: "cyl" } }, focus: ["cf"],
          note: "tan⁻¹(y/x) can't tell (3, 4) from (−3, −4). Both give y/x = 1.333, and a calculator returns 53.13° for each. S(−3, −4, −10) sits in the third quadrant, so φ = 180° + 53.13° = 233.13°. Always check the signs of x and y first. In the second and third quadrants, add 180° to the calculator's angle; in the fourth, add 360°. The plate's readout always shows the true angle.",
          claims: [{ instance: "cf", readout: "pPhi", value: 233.13, unit: "°" }, { instance: "cf", readout: "pRho", value: 5, unit: "m" }],
        },
        {
          id: "unit-vectors", title: "Unit vectors that move", patch: { cf: { point: [1, 3, 5], system: "cyl", unitVectors: true } }, focus: ["cf"],
          note: "Cartesian unit vectors point the same way everywhere. Cylindrical and spherical ones don't: âρ points away from the z-axis toward the point, âφ points around the axis, and both turn as the point moves. That is why a vector's components change when you change systems, even though the arrow itself doesn't. To convert, project onto the new unit vectors with dot products: Qρ = Q·âρ and Qφ = Q·âφ.",
        },
      ],
      examples: [
        {
          id: "points", level: "basic", title: "Tutorial 2.1(a): convert T and S",
          setup: { cf: { point: [0, -4, 3], system: "cyl" } },
          problem: "Convert P(1, 3, 5), T(0, −4, 3) and S(−3, −4, −10) from cartesian to cylindrical and spherical coordinates. (The explanations converted P; this example does T and S.)",
          lines: [
            { text: "T(0, −4, 3): ρ = √(0 + 16) = 4. The point lies on the −y axis, so φ = 270°; z = 3.", focus: ["cf"], claims: [{ instance: "cf", readout: "pRho", value: 4, unit: "m" }, { instance: "cf", readout: "pPhi", value: 270, unit: "°" }] },
            { text: "In spherical coordinates: r = √(16 + 9) = 5 and θ = cos⁻¹(3/5) = 53.13°, with the same φ = 270°.", patch: { cf: { system: "sph" } }, focus: ["cf"], claims: [{ instance: "cf", readout: "pR", value: 5, unit: "m" }, { instance: "cf", readout: "pTheta", value: 53.1301, unit: "°" }] },
            { text: "S(−3, −4, −10): ρ = 5, φ = 233.13°, z = −10; then r = √125 = 11.18 and θ = cos⁻¹(−10/11.18) = 153.43°.", patch: { cf: { point: [-3, -4, -10] } }, focus: ["cf"], claims: [{ instance: "cf", readout: "pR", value: 11.1803, unit: "m" }, { instance: "cf", readout: "pTheta", value: 153.435, unit: "°" }] },
          ],
          covers: ["tutorial:tut-2.1"],
          trap: "tan⁻¹(−4/0) is undefined on a calculator. Don't panic: a point on the −y axis is at φ = 270° by definition.",
        },
        {
          id: "back", level: "tutorial", title: "Back to cartesian",
          setup: { cf: { point: [-1, S3, -1], system: "cyl" } },
          problem: "Convert the cylindrical point (2, 120°, −1) and the spherical point (4, 60°, 30°) to cartesian coordinates.",
          lines: [
            { text: "x = ρ cos φ = 2 cos 120° = −1 and y = ρ sin φ = 2 sin 120° = 1.732; z stays −1.", latex: R`x=\rho\cos\phi,\quad y=\rho\sin\phi`, focus: ["cf"], claims: [{ instance: "cf", readout: "pRho", value: 2, unit: "m" }, { instance: "cf", readout: "pPhi", value: 120, unit: "°" }] },
            { text: "Spherical: x = r sin θ cos φ = 4 sin 60° cos 30° = 3, y = r sin θ sin φ = 1.732, and z = r cos θ = 2.", latex: R`x=r\sin\theta\cos\phi,\ y=r\sin\theta\sin\phi,\ z=r\cos\theta`, patch: { cf: { point: [3, S3, 2], system: "sph" } }, focus: ["cf"], claims: [{ instance: "cf", readout: "pR", value: 4, unit: "m" }, { instance: "cf", readout: "pTheta", value: 60, unit: "°" }, { instance: "cf", readout: "pPhi", value: 30, unit: "°" }] },
          ],
          trap: "Swapping θ and φ in the spherical formulas. θ is measured from the z-axis, so it pairs with cos θ in z; φ goes around, so it appears as cos φ and sin φ in x and y.",
        },
        {
          id: "vector", level: "exam", title: "Tutorial 2.1(b, c): one vector, three systems",
          setup: { cf: { point: [0, -4, 3], system: "cyl" } },
          problem: "Q = √(x² + y²)/√(x² + y² + z²) âₓ − yz/√(x² + y² + z²) âz. Evaluate Q at T(0, −4, 3) in cartesian, cylindrical and spherical components.",
          lines: [
            { text: "Cartesian first. At T, √(x² + y²) = 4 and √(x² + y² + z²) = 5, so Q = 0.8âₓ − (−4)(3)/5 âz = 0.8âₓ + 2.4âz.", focus: ["cf"] },
            { text: "At T, φ = 270°, so âρ = −âᵧ and âφ = âₓ. Then Qρ = Q·âρ = 0, Qφ = Q·âφ = 0.8 and Qz = 2.4: Q = 0.8âφ + 2.4âz.", focus: ["cf"], claims: [{ instance: "cf", readout: "pPhi", value: 270, unit: "°" }] },
            { text: "In spherical coordinates, θ = 53.13°, so sin θ = 0.8 and cos θ = 0.6. Then Qr = 2.4 × 0.6 = 1.44, Qθ = −2.4 × 0.8 = −1.92, and Qφ = 0.8: Q = 1.44âr − 1.92âθ + 0.8âφ.", patch: { cf: { system: "sph" } }, focus: ["cf"], claims: [{ instance: "cf", readout: "pTheta", value: 53.1301, unit: "°" }] },
            { text: "Check: all three forms have length √6.4 = 2.530. Changing coordinates changes the components, never the vector.", focus: ["cf"] },
          ],
          covers: ["tutorial:tut-2.1"],
          trap: "Converting T's coordinates but leaving the components in âₓ and âz. A cylindrical answer must use âρ, âφ and âz.",
        },
      ],
      asks: [
        { id: "which-system", q: "How do I choose a coordinate system?", a: "Match the symmetry. Straight lines and boxes: cartesian. Anything around an axis (wires, coax, cylinders): cylindrical. Anything around a point (charges, spheres): spherical. The right choice turns hard integrals into easy ones." },
        { id: "rho-vs-r", q: "What's the difference between ρ and r?", a: "ρ is the distance from the z-axis, measured flat. r is the distance from the origin, measured straight. At P(1, 3, 5), ρ = 3.162 and r = 5.916. They agree only on the x–y plane, where z = 0." },
        { id: "phi-same", q: "Is φ the same in cylindrical and spherical coordinates?", a: "Yes. Both measure the angle around the z-axis, from +x toward +y. Only the other two coordinates differ." },
        { id: "theta-range", q: "Why does θ stop at 180°?", a: "θ is measured from +z down to −z. Every direction is reached with 0° ≤ θ ≤ 180° plus a full turn of φ. Going past 180° would count the same directions twice." },
        { id: "calculator", q: "My calculator gave φ = −53.13°. What went wrong?", tags: ["PHI_QUADRANT"], a: "Nothing yet: the calculator only knows y/x. Place the point in its quadrant from the signs of x and y, then correct the angle. Add 180° in the second and third quadrants and 360° in the fourth." },
        { id: "components-change", q: "If the vector doesn't change, why do its components?", a: "Because the unit vectors changed. A component is how much of the vector lies along one unit vector. Rotate the unit vectors, and the same arrow needs different amounts of each." },
        { id: "units", q: "What are the units of ρ, r, φ and θ?", a: "ρ, r and z are lengths, in metres. φ and θ are angles, in degrees or radians. In formulas such as ρ dφ, the angle must be in radians." },
      ],
      checks: [
        {
          id: "phi-135", title: "Check: which quadrant?", show: ["axes", "cf"], hide: ["eq"], patch: { cf: { point: [1, 3, 5], system: "cyl" } },
          note: "Five checks on coordinates. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "phi-135", type: "choose", prompt: "For the point (−2, 2, 1), φ is…", dimension: "computational",
            options: [
              choice("right", "135°", true, "Right: second quadrant, so 180° − 45°."),
              choice("calc", "−45°", false, "That is the calculator's tan⁻¹(2/−2). The point is in the second quadrant.", "PHI_QUADRANT"),
              choice("45", "45°", false, "45° is in the first quadrant; here x is negative."),
            ] },
        },
        {
          id: "drag-q2", title: "Check: move into quadrant II", patch: { cf: { point: [-1, -2, 1], system: "cyl", draggable: true } },
          note: "Drag the point, and watch φ.",
          interaction: { id: "drag-q2", type: "manipulate-goal", goal: "Drag the point into the second quadrant, where 90° < φ < 180°. You can also focus it and use the arrow keys.", check: "phi-second-quadrant", dimension: "application" },
        },
        {
          id: "phi-num", title: "Check: φ, your numbers",
          note: "A point of your own.",
          interaction: { id: "phi-num", type: "numeric", prompt: phi.prompt, answer: phi.spec.answer, distractors: phi.spec.distractors, relTol: phi.spec.relTol, hints: phi.hints, template: "coord-phi", dimension: "computational" },
          covers: ["tutorial:tut-2.1"],
        },
        {
          id: "predict-r", title: "Check: double every coordinate", patch: { cf: { point: [1, 3, 5], system: "sph", draggable: false } },
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-r", type: "predict-drag", prompt: "The point moves from (1, 3, 5) to (2, 6, 10): every coordinate doubles. Drag r to your prediction.", target: { instance: "cf", readout: "pR" }, range: [0, 20], unit: "m", relTol: 0.05, reveal: { cf: { point: [2, 6, 10] } }, dimension: "conceptual",
            feedback: { close: "Right: r doubles too, to 11.83; θ and φ don't change.", far: "r = √(x² + y² + z²): doubling every coordinate doubles r, to 11.83. θ and φ stay the same." } },
        },
        {
          id: "symmetry", title: "Check: the right system",
          note: "Last one.",
          interaction: { id: "symmetry", type: "choose", prompt: "Which coordinate system suits the field around a long, straight wire?", dimension: "application",
            options: [
              choice("cyl", "Cylindrical", true, "Right: the wire is an axis, and ρ is the distance from it."),
              choice("sph", "Spherical", false, "Spherical suits a point, not a line."),
              choice("cart", "Cartesian", false, "Cartesian works, but every quantity would depend on both x and y."),
            ] },
        },
      ],
      recap: {
        points: [
          "Cylindrical: ρ = √(x² + y²), φ = tan⁻¹(y/x) placed in the right quadrant, z = z.",
          "Spherical: r = √(x² + y² + z²), θ = cos⁻¹(z/r) from +z, and the same φ.",
          "Back: x = ρ cos φ = r sin θ cos φ; y = ρ sin φ = r sin θ sin φ; z = r cos θ.",
          "Unit vectors âρ, âφ, âr and âθ turn with the point; convert components with dot products.",
          "Pick the system that matches the symmetry.",
        ],
        traps: ["Taking φ straight from the calculator.", "Swapping θ and φ.", "New coordinates with old unit vectors."],
      },
    },
  ],
});
```

- [ ] **Step 2: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 3 of vectors, cylindrical and spherical coordinates

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 7: Idea ⑥, dl, dS and dv

**Files:** Create `app/packages/course-em1/src/plates/idea-elements.ts`. Modify `plates/index.ts` and `concepts/math.ts` (append the `idea-elements` block with `src("UTech ELE3001 U2.W02(b) extract", "pp. 35-36")`).

- [ ] **Step 1: The idea plate**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const patch = instantiate(templates.find((t) => t.id === "sph-patch-area")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaElements = defineIdeaPlate({
  id: "idea-elements",
  title: "dl, dS and dv",
  requires: { objectives: [4], items: ["mst-2324-q3a", "hw-2324-2.5", "mst-2324-q4b"], misconceptions: ["ELEMENT_SCALE_FACTOR"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.6 } },
    { id: "region", component: "coord-region", params: { system: "cart", ranges: [[0, 1], [0, 1], [0, 1]], face: 2 } },
    { id: "eq", component: "equation", params: eqp(R`d\mathbf l=dx\,\mathbf a_x+dy\,\mathbf a_y+dz\,\mathbf a_z,\quad dv=dx\,dy\,dz`, "the cartesian elements") },
  ],
  ideas: [
    {
      id: "elements",
      title: "dl, dS and dv",
      objectives: [4],
      explain: [
        {
          id: "cart", title: "dl, dS and dv in cartesian", show: ["axes", "region", "eq"], focus: ["region"],
          note: "Integrals over lines, surfaces and volumes add up small pieces. In cartesian coordinates every piece is a tiny box: a length element dl = dx âₓ + dy âᵧ + dz âz, a surface element such as dS = dx dy âz on a face of constant z, and a volume element dv = dx dy dz. The plate's unit cube has a top face of 1 m² and a volume of 1 m³. Add up enough tiny boxes and you get exactly that.",
          claims: [{ instance: "region", readout: "area", value: 1, unit: "m^2" }, { instance: "region", readout: "volume", value: 1, unit: "m^3" }],
        },
        {
          id: "cyl", title: "Cylindrical: ρ dφ is a length", patch: { region: { system: "cyl", ranges: [[1, 2], [0, 90], [0, 1.5]], face: 0 }, eq: eqp(R`d\mathbf l=d\rho\,\mathbf a_\rho+\rho\,d\phi\,\mathbf a_\phi+dz\,\mathbf a_z,\quad dv=\rho\,d\rho\,d\phi\,dz`, "the cylindrical elements") }, focus: ["region", "eq"],
          note: "In cylindrical coordinates a step in φ is an angle, not a length. The length it sweeps is ρ dφ: a bigger radius makes a longer arc for the same angle. So dl = dρ âρ + ρ dφ âφ + dz âz; the side of a cylinder has dS = ρ dφ dz âρ; and dv = ρ dρ dφ dz. The plate's region (ρ from 1 to 2 m, a quarter turn, 1.5 m tall) has an outer side of 4.712 m² and a volume of 3.534 m³.",
          claims: [{ instance: "region", readout: "area", value: 4.71239, unit: "m^2" }, { instance: "region", readout: "volume", value: 3.53429, unit: "m^3" }],
        },
        {
          id: "sph", title: "Spherical: r² sin θ", patch: { region: { system: "sph", ranges: [[0, 1.5], [0, 60], [30, 75]], face: 0 }, eq: eqp(R`d\mathbf S=r^2\sin\theta\,d\theta\,d\phi\,\mathbf a_r,\quad dv=r^2\sin\theta\,dr\,d\theta\,d\phi`, "the spherical elements") }, focus: ["region", "eq"],
          note: "In spherical coordinates both angles need scale factors. A step dθ sweeps a length r dθ; a step dφ sweeps r sin θ dφ, because the circle of constant θ has radius r sin θ. Hence dS = r² sin θ dθ dφ âr on a sphere, and dv = r² sin θ dr dθ dφ. The plate's patch (r = 1.5 m, θ from 0° to 60°, φ from 30° to 75°) has area r²(cos 0° − cos 60°)(π/4) = 0.8836 m².",
          claims: [{ instance: "region", readout: "area", value: 0.883573, unit: "m^2" }],
        },
        {
          id: "why", title: "Why the scale factors matter", patch: { region: { system: "sph", ranges: [[2, 2.1], [30, 31], [0, 1]], face: null, drawScale: 0.6 } }, focus: ["region"],
          note: "The scale factors are exactly what gets forgotten in gradients, divergences and integrals. Take a tiny spherical element at r = 2 m and θ = 30°, with dr = 0.1 m and dθ = dφ = 1°. Its three edges are dr = 0.1 m, r dθ = 0.03491 m and r sin θ dφ = 0.01745 m. The same one-degree step gives edges that differ by a factor of two, because sin 30° = 0.5. Leave out r or sin θ and your answer is off by that factor.",
          claims: [{ instance: "region", readout: "len1", value: 0.1, unit: "m" }, { instance: "region", readout: "len2", value: 0.0349066, unit: "m" }, { instance: "region", readout: "len3", value: 0.0174533, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "mst-patch", level: "basic", title: "MST Q3(a): the area of a spherical patch",
          setup: { region: { system: "sph", ranges: [[0, 0.25], [0, 60], [30, 45]], face: 0, drawScale: 4 } },
          problem: "Find the area of the part of the sphere r = 25.0 cm bounded by 0 < θ < π/3 and π/6 < φ < π/4.",
          lines: [
            { text: "On a sphere of radius r, dS = r² sin θ dθ dφ, with r = 0.25 m.", focus: ["region"] },
            { text: "Integrate: S = r² ∫ sin θ dθ ∫ dφ = r²(1 − cos 60°)(π/12).", latex: R`S=r^2\int_0^{\pi/3}\sin\theta\,d\theta\int_{\pi/6}^{\pi/4}d\phi=r^2(1-\cos60^\circ)\tfrac{\pi}{12}`, focus: ["region"] },
            { text: "S = 0.0625 × 0.5 × 0.2618 = 0.008181 m².", focus: ["region"], claims: [{ instance: "region", readout: "area", value: 0.00818123, unit: "m^2" }] },
            { text: "The whole sphere is 4πr² = 0.7854 m², so this patch is 1/96 of it. That fraction is what the flux question needs: Ψ = 100 µC ÷ 96 = 1.042 µC.", focus: ["region"], givens: [{ value: 4 * Math.PI * 0.0625, unit: "m^2" }, { value: 100, unit: "µC" }, { value: 100 / 96, unit: "µC" }] },
          ],
          covers: ["mst-2324-q3a"],
          trap: "Using dS = dθ dφ, with no r² sin θ, gives an area in radians squared. The scale factors turn angles into lengths.",
        },
        {
          id: "cyl-side", level: "tutorial", title: "HW02 2.5(b): the side of a cylinder",
          setup: { region: { system: "cyl", ranges: [[0, 4], [0, 360], [0, 7]], face: 0, drawScale: 0.25 } },
          problem: "Find the area of the cylindrical surface ρ = 4 m, 0 < z < 7 m. (HW02 then puts a charge density on it.)",
          lines: [
            { text: "On the side ρ = 4 m, dS = ρ dφ dz.", focus: ["region"] },
            { text: "S = ∫∫ 4 dφ dz over a full turn and 0 to 7 = 4 × 2π × 7 = 175.9 m².", latex: R`S=\int_0^{2\pi}\!\!\int_0^{7}4\,d\phi\,dz=56\pi`, focus: ["region"], claims: [{ instance: "region", readout: "area", value: 175.929, unit: "m^2" }] },
            { text: "With a charge density ρS on it, the same element gives Q = ∫ρS dS. HW02 2.5(b) and the Gauss applications lesson finish that.", focus: ["region"] },
          ],
          covers: ["hw-2324-2.5"],
          trap: "Writing dS = dφ dz forgets the ρ. The answer would be 44 instead of 175.9: four times too small.",
        },
        {
          id: "mst-vol", level: "exam", title: "MST Q4(b): the region's volume, then its charge",
          setup: { region: { system: "cyl", ranges: [[0, 0.2], [0, 180], [-4, -2]], face: null, drawScale: 0.45 } },
          problem: "MST Q4(b) integrates ρv = ρ² sin φ µC/m³ over 0 ≤ ρ ≤ 0.2 m, 0 ≤ φ ≤ π and −4 ≤ z ≤ −2 m. Set up dv, find the region's volume, then the charge.",
          lines: [
            { text: "In cylindrical coordinates dv = ρ dρ dφ dz: the extra ρ is the scale factor on dφ.", focus: ["region"] },
            { text: "Volume: ∫ρ dρ ∫dφ ∫dz = (0.02)(π)(2) = 0.1257 m³.", latex: R`V=\int_0^{0.2}\rho\,d\rho\int_0^{\pi}d\phi\int_{-4}^{-2}dz=(0.02)(\pi)(2)`, focus: ["region"], claims: [{ instance: "region", readout: "volume", value: 0.125664, unit: "m^3" }] },
            { text: "Charge: Q = ∫ρ² sin φ · ρ dρ dφ dz = [ρ⁴/4] [−cos φ] [z] = (0.0004)(2)(2) = 0.0016 µC = 1.6 nC.", latex: R`Q=\left[\tfrac{\rho^4}{4}\right]_0^{0.2}\left[-\cos\phi\right]_0^{\pi}\left[z\right]_{-4}^{-2}=0.0016\ \mu\text{C}`, focus: ["region"], givens: [{ value: 0.0016, unit: "µC" }, { value: 1.6, unit: "nC" }] },
          ],
          covers: ["mst-2324-q4b"],
          trap: "Forgetting the ρ in dv gives ∫ρ² dρ instead of ∫ρ³ dρ: 0.0027 instead of 0.0004, and a charge 6.7 times too big.",
        },
      ],
      asks: [
        { id: "why-rdtheta", q: "Why is it r dθ and not just dθ?", a: "An angle is not a length. An arc of angle dθ on a circle of radius r has length r dθ, with dθ in radians. The scale factor converts the angle step into metres." },
        { id: "sin-theta", q: "Where does the sin θ come from?", tags: ["ELEMENT_SCALE_FACTOR"], a: "Circles of constant θ shrink toward the poles: their radius is r sin θ. A step dφ around such a circle sweeps r sin θ dφ. At the equator sin θ = 1; at the pole it is 0." },
        { id: "direction", q: "Why does dS have a direction?", a: "Flux needs to know which way a surface faces. dS points along the surface normal: âr on a sphere, âρ on a cylinder's side, and ±âz on a flat top. Its size is the area of the patch." },
        { id: "radians", q: "Degrees or radians in the integral?", a: "Radians, always. ρ dφ is a length only when dφ is in radians. Convert the limits before integrating: 30° is π/6." },
        { id: "which", q: "How do I know which dS to use?", a: "Hold one coordinate constant: that defines the surface, and dS is the product of the other two edges. Sphere, r constant: (r dθ)(r sin θ dφ). Cylinder side, ρ constant: (ρ dφ)(dz). Flat top, z constant: (dρ)(ρ dφ)." },
        { id: "check", q: "How can I check a volume element?", a: "Integrate it over a shape you know. dv = r² sin θ dr dθ dφ over a whole ball gives 4πR³/3. If a known volume doesn't come out, a scale factor is missing." },
      ],
      checks: [
        {
          id: "dS", title: "Check: the sphere's element", show: ["axes", "region"], hide: ["eq"], patch: { region: { system: "sph", ranges: [[0, 1.5], [0, 60], [30, 75]], face: 0, drawScale: 0.5 } },
          note: "Four checks on elements. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "dS", type: "choose", prompt: "On a sphere of radius r, the surface element is…", dimension: "recognition",
            options: [
              choice("right", "r² sin θ dθ dφ", true, "Right: (r dθ)(r sin θ dφ)."),
              choice("bare", "dθ dφ", false, "Angles aren't lengths. Multiply by the scale factors r and r sin θ.", "ELEMENT_SCALE_FACTOR"),
              choice("half", "r dθ dφ", false, "That misses a factor of r sin θ from the φ edge.", "ELEMENT_SCALE_FACTOR"),
            ] },
        },
        {
          id: "predict-area", title: "Check: double the radius",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-area", type: "predict-drag", prompt: "The patch's radius doubles from 1.5 m to 3 m, with the same angles. Drag the area to your prediction.", target: { instance: "region", readout: "area" }, range: [0, 5], unit: "m^2", relTol: 0.05, reveal: { region: { ranges: [[0, 3], [0, 60], [30, 75]] } }, dimension: "conceptual",
            feedback: { close: "Right: four times as much, 3.534 m².", far: "Area goes as r²: double r and the area quadruples, to 3.534 m²." } },
        },
        {
          id: "patch-num", title: "Check: a patch, your numbers",
          note: "A patch of your own, like MST Q3(a).",
          interaction: { id: "patch-num", type: "numeric", prompt: patch.prompt, answer: patch.spec.answer, distractors: patch.spec.distractors, relTol: patch.spec.relTol, hints: patch.hints, template: "sph-patch-area", dimension: "computational" },
          covers: ["mst-2324-q3a"],
        },
        {
          id: "dv", title: "Check: the cylindrical volume element",
          note: "Last one.",
          interaction: { id: "dv", type: "choose", prompt: "In cylindrical coordinates, dv =", dimension: "recognition",
            options: [
              choice("right", "ρ dρ dφ dz", true, "Right: the edges are dρ, ρ dφ and dz."),
              choice("bare", "dρ dφ dz", false, "The φ edge is ρ dφ, not dφ.", "ELEMENT_SCALE_FACTOR"),
              choice("sq", "ρ² dρ dφ dz", false, "Only one edge carries ρ."),
            ] },
          covers: ["mst-2324-q4b"],
        },
      ],
      recap: {
        points: [
          "Cartesian: dl = dx âₓ + dy âᵧ + dz âz; dv = dx dy dz.",
          "Cylindrical: edges dρ, ρ dφ, dz; side dS = ρ dφ dz; dv = ρ dρ dφ dz.",
          "Spherical: edges dr, r dθ, r sin θ dφ; sphere dS = r² sin θ dθ dφ; dv = r² sin θ dr dθ dφ.",
          "Pick dS by holding one coordinate constant; always integrate angles in radians.",
        ],
        traps: ["Dropping ρ, r or sin θ.", "Integrating with degrees.", "Using a cube's element on a curved surface."],
      },
    },
  ],
});
```

- [ ] **Step 2: Register it**, run `pnpm vitest run packages/course-em1 && pnpm typecheck` (Expected: PASS), then commit:

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 4 of vectors, dl, dS and dv (MST patch, HW02 cylinder, MST volume)

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 8: Coverage, e2e and axe

**Files:**
- Create: `app/packages/course-em1/test/f3-coverage.test.ts`, `app/apps/web/e2e/unit1-vectors.spec.ts`
- Modify: `app/apps/web/e2e/a11y.spec.ts`

- [ ] **Step 1: The coverage test**

```ts
import { coverageGaps, type IdeaMeta } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { course, ideaPlates } from "../src";

const mainOf = (id: string) => course.concepts.find((c) => c.id === id)!.lessons.find((l) => l.id === "main")!.blocks.flatMap((b) => (b.type === "plate" ? [b.plateId] : []));
const merged = (conceptId: string, plates: string[]): IdeaMeta => {
  const c = course.concepts.find((k) => k.id === conceptId)!;
  const items = [...new Set(plates.flatMap((p) => ideaPlates[p]!.meta.requires?.items ?? []))];
  return { plateId: conceptId, requires: { objectives: c.objectives.map((_, i) => i), items, misconceptions: c.misconceptions.map((m) => m.tag) }, ideas: plates.flatMap((p) => ideaPlates[p]!.meta.ideas) };
};

describe("F3 concepts", () => {
  it("Unit 1's main lesson is two ideas; vectors' is four", () => {
    expect(mainOf("em1.intro.em-world")).toEqual(["idea-em-world", "idea-units"]);
    expect(mainOf("em1.math.vectors")).toEqual(["idea-vec-basics", "idea-vec-products", "idea-coords", "idea-elements"]);
  });
  for (const id of ["em1.intro.em-world", "em1.math.vectors"]) {
    it(`${id}: full coverage, and every idea is load-bearing`, () => {
      const plates = mainOf(id);
      expect(coverageGaps(merged(id, plates))).toEqual([]);
      for (const p of plates) {
        const without = plates.filter((x) => x !== p);
        const req = merged(id, plates).requires!;
        expect(coverageGaps({ ...merged(id, without), requires: req }), `${id} without ${p}`).not.toEqual([]);
      }
    });
  }
  it("the old vectors lesson survives as the quick refresher", () => {
    expect(course.concepts.find((c) => c.id === "em1.math.vectors")!.lessons.map((l) => l.id)).toContain("quick");
  });
});
```

Run: `pnpm vitest run packages/course-em1/test/f3-coverage.test.ts`
Expected: PASS. Each idea owns an objective of its own, so removing any one names a gap.

- [ ] **Step 2: The e2e test** at `app/apps/web/e2e/unit1-vectors.spec.ts`

```ts
import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();
const U1 = "em1.intro.em-world";
const V = "em1.math.vectors";

test("Unit 1 and vectors open at depth, numbered per concept", async ({ page }) => {
  await open(page, concept(U1, "mode=learn"));
  await margin(page, "Fields from charges");
  await expect(kicker(page)).toHaveText("Idea 1 · What electromagnetics is, and where it runs the world · Explanation 1 of 5");
  await open(page, concept(U1, "mode=learn&lesson=main&block=idea-units"));
  await expect(kicker(page)).toHaveText("Idea 2 · Units, prefixes and symbols · Explanation 1 of 5");
  for (const [block, title, label] of [
    ["idea-vec-basics", "A vector is three numbers", "Idea 1 · Components, length, unit and displacement vectors · Explanation 1 of 4"],
    ["idea-vec-products", "The dot product: how much lies along", "Idea 2 · Dot and cross products, angles and projections · Explanation 1 of 4"],
    ["idea-coords", "Cylindrical: ρ, φ, z", "Idea 3 · Cylindrical and spherical coordinates · Explanation 1 of 4"],
    ["idea-elements", "dl, dS and dv in cartesian", "Idea 4 · dl, dS and dv · Explanation 1 of 4"],
  ] as const) {
    await open(page, concept(V, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("coordinates: the quadrant step reads 233.1°", async ({ page }) => {
  await open(page, concept(V, "mode=learn&lesson=main&block=idea-coords&step=2"));
  await margin(page, "The quadrant trap");
  await expect(page.locator(".readouts")).toContainText("233.1");
});
```

In `a11y.spec.ts`, add to `SCREENS`:
- `concept("em1.intro.em-world", "mode=learn")`
- `concept("em1.math.vectors", "mode=learn&lesson=main&block=idea-coords")`

- [ ] **Step 3: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`
Expected: all PASS. Two details:
- The desk footer test now opens `/learn/em1.math.vectors/quick` (Task 4 Step 1).
- If the visual baseline "faraday-first-frame" changes, look at both images. Update it only if the only difference is expected; Gauss is untouched, so it should not change.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web packages/course-em1 && git commit -m "test: F3 coverage per concept, Unit 1 and vectors e2e, axe on the new ideas

Co-Authored-By: Codex <noreply@openai.com>"
```

---

### Task 9: Verification and handback

- [ ] **Step 1:** Run the full suite (the Task 8 command). Everything should be green.
- [ ] **Step 2:** In the dev server at 1360×900, open each new idea's first explanation and one worked example.
  - Check that every drawn vector sits inside the plate.
  - Check that the spherical patch reads as a curved patch.
  - Check that the spectrum marker moves between steps.
  - If anything draws off the plate, change only its `drawScale` and log a ruling.
- [ ] **Step 3:** Write the ledger line `Task 9: verification — <counts>` and stop for Claude's review.

## Self-Review Notes

- **Every stated value was computed in Python/SymPy from the questions** (`scratchpad/solve/f3nums.py`, `f2.py`):
  - Tutorials 1.1, 1.2, 1.4, 1.5 and 2.1.
  - MST Q1(b), Q2(c), Q3(a), Q4(b) and Q4(c).
  - HW02 2.5(b).
  - Unit 1: 2.45 GHz, 94.1 MHz and 50 Hz.
- **Student answers were not used.** The one student slip in this material (HW02 2.1(c)) belongs to Plan F4, vector calculus.
- **Ask and trap text** avoids unit-bearing numbers the plate can't back, or patches the plate so it can (the `cm2` ask).
- **Deferred to F4:** gradient, divergence and curl, which use the F2 slices and the HW02 2.1/2.2 fields.
