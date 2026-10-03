import { F2324, meta, orig, SLIDES, src, WENT } from "../sources";

export const coulomb = {
  id: "em1.electrostatics.coulomb",
  title: "Coulomb's Law",
  unit: 2,
  objectives: ["Compute the force between two point charges in vector form, with units.", "Apply superposition to find the net force from several charges."],
  prerequisites: [{ conceptId: "em1.math.vectors", minMastery: 0.3 }],
  misconceptions: [
    { tag: "FORCE_MAGNITUDE_ONLY", description: "Gives |F| when the question asks for the force (a vector).", remediation: "em1.electrostatics.coulomb/main" },
    { tag: "COULOMB_DIRECTION", description: "Points the force the wrong way: wrong R order or ignoring the sign of Q1Q2.", remediation: "em1.electrostatics.coulomb/main" },
    { tag: "SUPERPOSITION_MAGNITUDES", description: "Adds force magnitudes instead of vectors.", remediation: "em1.electrostatics.coulomb/main" },
  ],
  examLinks: [],
  sources: [src(SLIDES, "pp. 9-15"), src(WENT, "§2.2, p. 18")],
  status: "verified",
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Coulomb's law (in depth)",
      minutes: 50,
      blocks: [{ ...meta("vivid", src(SLIDES, "pp. 9-15")), id: "idea-coulomb-law", type: "plate" as const, plateId: "idea-coulomb-law" }, { ...meta("vivid", src(SLIDES, "pp. 9-15")), id: "idea-superposition", type: "plate" as const, plateId: "idea-superposition" }],
    },
    {
      id: "quick",
      title: "Quick refresher: force between point charges",
      minutes: 10,
      blocks: [
        {
          ...meta("quiet", src(SLIDES, "pp. 9-11")),
          id: "law",
          type: "prose",
          text: "The force on $Q_2$ from $Q_1$ acts along the line joining them. It is proportional to the product of the charges and falls off as the square of the distance: $\\mathbf F_{12} = \\dfrac{Q_1Q_2}{4\\pi\\varepsilon_0 R^2}\\,\\mathbf a_{R}$, with $\\varepsilon_0 = 8.854\\times10^{-12}$ F/m. Like charges repel; opposite charges attract.",
        },
        {
          ...meta("assessment", src(SLIDES, "pp. 13-14 (Example 1)")),
          id: "ex1",
          type: "numeric",
          prompt: "Example 1: Q₁ = +3×10⁻⁴ C at M(1, 2, 3) and Q₂ = −1×10⁻⁴ C at N(2, 0, 5), in vacuum. What is the magnitude of the force Q₂ exerts on Q₁?",
          answer: { value: 29.96, unit: "N" },
          distractors: [{ value: 89.88, unit: "N", errorClass: "arithmetic", feedback: "|R| = 3 m, so divide by R² = 9, not 3." }],
          hints: ["R = M − N = (−1, 2, −2); |R| = 3 m.", "|F| = k|Q₁Q₂|/R² with k = 8.988×10⁹.", "8.988×10⁹ × 3×10⁻⁸ / 9."],
          dimension: "computational",
        },
        {
          ...meta("assessment", src(SLIDES, "p. 10")),
          id: "attract",
          type: "mcq",
          prompt: "In Example 1, the force on Q₁ points…",
          options: [
            { id: "toward", label: "Toward N (attractive)", correct: true, feedback: "Opposite signs attract." },
            { id: "away", label: "Away from N (repulsive)", correct: false, feedback: "Q₁ > 0 and Q₂ < 0: opposite signs attract." },
          ],
          dimension: "conceptual",
        },
      ],
    },
  ],
};

export const field = {
  id: "em1.electrostatics.field",
  title: "Electric field E",
  unit: 2,
  objectives: ["Define E and find the field of a point charge, as a vector.", "Superpose the fields of several point charges.", "Find E from infinite line and sheet charges."],
  prerequisites: [{ conceptId: "em1.electrostatics.coulomb", minMastery: 0.3 }],
  misconceptions: [
    { tag: "E_DIRECTION_NEGATIVE", description: "Points E away from a negative charge.", remediation: "em1.electrostatics.field/main" },
    { tag: "LINE_FIELD_FORM", description: "Uses the point-charge form, or 4π instead of 2π, for a line charge.", remediation: "em1.electrostatics.field/main" },
    { tag: "SHEET_FIELD_DISTANCE", description: "Thinks an infinite sheet's field weakens with distance.", remediation: "em1.electrostatics.field/main" },
  ],
  examLinks: [],
  sources: [src(SLIDES, "pp. 16-28"), src(WENT, "§2.2, p. 20")],
  status: "verified",
  rules: [],
  lessons: [
    {
      id: "main",
      title: "The electric field (in depth)",
      minutes: 70,
      blocks: [{ ...meta("vivid", src(SLIDES, "pp. 16-28")), id: "idea-e-point", type: "plate" as const, plateId: "idea-e-point" }, { ...meta("vivid", src(SLIDES, "pp. 16-28")), id: "idea-e-superposition", type: "plate" as const, plateId: "idea-e-superposition" }, { ...meta("vivid", src(SLIDES, "p. 27")), id: "idea-e-continuous", type: "plate" as const, plateId: "idea-e-continuous" }],
    },
    {
      id: "quick",
      title: "Quick refresher: fields from charges",
      minutes: 10,
      blocks: [
        {
          ...meta("quiet", src(SLIDES, "pp. 16-19")),
          id: "def",
          type: "prose",
          text: "The electric field is the force per unit positive test charge: $\\mathbf E = \\mathbf F/q_0 = \\dfrac{Q}{4\\pi\\varepsilon_0 R^2}\\mathbf a_R$ (V/m = N/C). Fields from several charges add as vectors, because superposition holds (the system is linear).",
        },
        {
          ...meta("vivid", orig()),
          id: "lab",
          type: "sim-3d",
          scene: "gauss-lab",
          config: {
            charges: [
              { id: "a", q: 3, pos: [-0.6, 0, 0], draggable: true },
              { id: "b", q: -2, pos: [0.6, 0, 0], draggable: true },
            ],
            surface: null,
            addCharge: true,
          },
          caption: "Two charges. The arrows show their combined field. Drag the charges and watch it rearrange.",
        },
        {
          ...meta("assessment", src(SLIDES, "pp. 20-21 (Example 2)")),
          id: "ex2",
          type: "numeric",
          prompt: "Example 2: four identical 3 nC charges at (1,1,0), (−1,1,0), (−1,−1,0) and (1,−1,0). Find E_z, the z-component of E at P(1, 1, 1).",
          answer: { value: 32.78, unit: "V/m" },
          distractors: [{ value: 26.96, unit: "V/m", errorClass: "conceptual", feedback: "That's only the nearest charge. Superposition means adding all four." }],
          hints: [
            "Every charge sits at z = 0 and P is at z = 1, so each one pushes P upward.",
            "E_z from each charge = kQ·(1)/R³, with R = 1, √5, 3, √5.",
            "kQ = 26.96 V·m; add 26.96(1 + 2/5^1.5 + 1/27).",
          ],
          dimension: "computational",
        },
        {
          ...meta("assessment", src(SLIDES, "p. 27")),
          id: "line",
          type: "mcq",
          prompt: "The field of an infinite line charge ρ_L at distance ρ is…",
          options: [
            { id: "one-over", label: "ρ_L / (2π ε₀ ρ) a_ρ", correct: true, feedback: "Falls as 1/ρ, not 1/ρ²." },
            { id: "sq", label: "ρ_L / (4π ε₀ ρ²) a_ρ", correct: false, feedback: "That's the point-charge form. A line's field falls off more slowly, as 1/ρ." },
          ],
          dimension: "recognition",
        },
      ],
    },
  ],
};

export const divergence = {
  id: "em1.electrostatics.divergence",
  title: "Point form and the divergence theorem",
  unit: 2,
  objectives: ["Use ∇·D = ρv to find the charge density from a given field.", "Apply the divergence theorem: net flux out equals the charge inside, computed either way."],
  prerequisites: [{ conceptId: "em1.electrostatics.gauss-applications", minMastery: 0.3 }],
  misconceptions: [
    { tag: "POINT_FORM_EPS", description: "Forgets ε₀ when the field is given as E rather than D.", remediation: "em1.electrostatics.divergence/main" },
    { tag: "DIV_THEOREM_FACES", description: "Counts faces the field is parallel to, or drops faces where it isn't.", remediation: "em1.electrostatics.divergence/main" },
  ],
  examLinks: [{ paper: "Exam-style question", question: "Q2(b)", marks: 12, weight: 0.6 }],
  sources: [src(SLIDES, "p. 39"), src(WENT, "§2.8, p. 54")],
  status: "verified",
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Point form and the divergence theorem (in depth)",
      minutes: 45,
      blocks: [
        { ...meta("vivid", src(WENT, "§2.8, p. 54")), id: "idea-point-form", type: "plate" as const, plateId: "idea-point-form" },
        { ...meta("vivid", src(WENT, "§2.8, p. 54")), id: "idea-div-theorem", type: "plate" as const, plateId: "idea-div-theorem" },
      ],
    },
    {
      id: "quick",
      title: "Gauss's law, point by point",
      minutes: 8,
      blocks: [
        {
          ...meta("quiet", src(SLIDES, "p. 39")),
          id: "div",
          type: "prose",
          text: "Shrink the Gaussian surface around a point. Flux out per unit volume is the **divergence**, and Gauss's law becomes $\\nabla\\cdot\\mathbf D = \\rho_v$, Maxwell's first equation. The divergence theorem, $\\oint_S \\mathbf D\\cdot d\\mathbf S = \\int_{vol} \\nabla\\cdot\\mathbf D\\,dv$, links the two forms. In spherical coordinates, for radial D: $\\nabla\\cdot\\mathbf D = \\dfrac{1}{r^2}\\dfrac{d}{dr}(r^2D_r)$.",
        },
        {
          ...meta("assessment", src(F2324, "Q2(b) style")),
          id: "rho",
          type: "numeric",
          prompt: "For D = 0.3r² a_r nC/m² (the field from the radial-D example), find ρ_v at r = 2 m.",
          answer: { value: 2.4, unit: "nC/m^3" },
          distractors: [{ value: 1.2, unit: "nC/m^3", errorClass: "arithmetic", feedback: "ρ_v = 1.2r nC/m³. You still need to put in r = 2." }],
          hints: ["ρ_v = (1/r²) d/dr (r² · 0.3r²).", "= (1/r²) d/dr (0.3 r⁴) = 1.2 r.", "At r = 2."],
          dimension: "computational",
        },
      ],
    },
  ],
};

const locked = (id: string, title: string, unit: number) => ({
  id,
  title,
  unit,
  objectives: ["Coming in a later build."],
  prerequisites: [],
  misconceptions: [],
  examLinks: [],
  sources: [],
  status: "draft" as const,
  rules: [],
  lessons: [],
  locked: true,
});

export const lockedConcepts = [
];
