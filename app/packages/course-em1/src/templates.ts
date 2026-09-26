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
