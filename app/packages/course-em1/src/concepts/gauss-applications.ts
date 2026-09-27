import { F2425, meta, orig, SLIDES, src, WENT } from "../sources";

const ID = "em1.electrostatics.gauss-applications";
const GL = "em1.electrostatics.gauss-law";

export const gaussApplications = {
  id: ID,
  title: "Applying Gauss's Law",
  unit: 2,
  objectives: [
    "Find total charge from ρL, ρS and ρv by integration in all three coordinate systems.",
    "Find the flux through part of a closed surface from its share of the whole.",
    "Use Gauss's law to find D and Q for spherical charge distributions, inside and outside.",
  ],
  prerequisites: [{ conceptId: GL, minMastery: 0.4 }],
  misconceptions: [
    { tag: "DENSITY_NO_JACOBIAN", description: "Integrates a density without the scale factors (ρ, r², r² sin θ).", remediation: "em1.electrostatics.gauss-applications/main" },
    { tag: "FLUX_PATCH_AREA", description: "Multiplies Q by a patch's area instead of its share of the whole surface.", remediation: "em1.electrostatics.gauss-applications/main" },
    { tag: "BALL_INSIDE_OUTSIDE", description: "Uses the whole charge inside a ball, or only part of it outside.", remediation: "em1.electrostatics.gauss-applications/main" },
    { tag: "OUTSIDE_CHARGE_CONTRIBUTES", description: "Counts charges outside the surface.", remediation: `${GL}/outside-charge` },
    { tag: "FLUX_SCALES_WITH_AREA", description: "Thinks a bigger surface catches more flux.", remediation: `${GL}/why-area` },
    { tag: "D_VS_E_PERMITTIVITY", description: "Confuses D and E.", remediation: `${GL}/d-vs-e` },
    { tag: "GAUSS_WITHOUT_SYMMETRY", description: "Pulls D out of the integral without symmetry.", remediation: `${GL}/symmetry` },
  ],
  examLinks: [{ paper: "Finals 2024-25 Sem 1", question: "Q2(a)", marks: 8, weight: 0.3 }],
  sources: [src(SLIDES, "pp. 58-61"), src(WENT, "§2.7, pp. 47-53")],
  status: "verified",
  rules: [
    {
      id: "fast-pass",
      when: { type: "challengePassed", firstAttempt: true },
      then: [{ type: "offerSkip" }, { type: "credit", dimension: "application", amount: 0.8 }],
      once: true,
    },
    { id: "stuck-steps", when: { type: "attemptsFailed", blockType: "step-solve", gte: 3 }, then: [{ type: "revealWorkedStep" }], once: false },
    {
      id: "outside-twice",
      when: { type: "tagCount", tag: "OUTSIDE_CHARGE_CONTRIBUTES", gte: 2 },
      then: [{ type: "offerRemediation", tag: "OUTSIDE_CHARGE_CONTRIBUTES", lessonRef: `${GL}/outside-charge` }],
      once: true,
    },
    {
      id: "de-twice",
      when: { type: "tagCount", tag: "D_VS_E_PERMITTIVITY", gte: 2 },
      then: [{ type: "offerRemediation", tag: "D_VS_E_PERMITTIVITY", lessonRef: `${GL}/d-vs-e` }],
      once: true,
    },
  ],
  lessons: [
    {
      id: "main",
      title: "Gauss's law in use (in depth)",
      minutes: 70,
      blocks: [
        { ...meta("vivid", src(SLIDES, "pp. 58-61")), id: "idea-charge-density", type: "plate" as const, plateId: "idea-charge-density" },
        { ...meta("vivid", src(SLIDES, "p. 58")), id: "idea-patch-flux", type: "plate" as const, plateId: "idea-patch-flux" },
        { ...meta("vivid", src(SLIDES, "p. 60")), id: "idea-spheres", type: "plate" as const, plateId: "idea-spheres" },
      ],
    },
    {
      id: "worked",
      title: "Worked problems: spheres, lines and slices",
      minutes: 25,
      blocks: [
        {
          ...meta("quiet", src(WENT, "§2.7, pp. 47-50")),
          id: "recipe",
          type: "prose",
          text: "**The recipe.** (1) Find the symmetry. (2) Choose a Gaussian surface on which $|\\mathbf D|$ is constant and D is normal to it (or tangent, contributing nothing). (3) Write $\\oint \\mathbf D\\cdot d\\mathbf S = D\\times(\\text{area})$. (4) Set it equal to $Q_{enc}$ and solve. For a point charge the sphere gives $D\\,4\\pi r^2 = Q$. For an infinite line, a coaxial cylinder of length $L$ gives $D\\,2\\pi\\rho L = \\rho_L L$, so $D = \\dfrac{\\rho_L}{2\\pi\\rho}$.",
        },
        {
          ...meta("assessment", orig()),
          id: "order-recipe",
          type: "order",
          prompt: "Put the Gauss's-law method in order.",
          items: [
            { id: "symmetry", label: "Identify the symmetry of the charge distribution" },
            { id: "surface", label: "Choose a Gaussian surface where |D| is constant and D is normal to it" },
            { id: "integral", label: "Write ∮ D·dS as D × (area of that surface)" },
            { id: "qenc", label: "Find Q_enc, the charge inside the surface" },
            { id: "solve", label: "Set D × area = Q_enc and solve for D (then E = D/ε)" },
          ],
          correctOrder: ["symmetry", "surface", "integral", "qenc", "solve"],
          feedback: "Symmetry comes first: it's what tells you which surface makes the integral collapse to D × area.",
          dimension: "application",
        },
        {
          ...meta("assessment", orig()),
          id: "debug-area",
          type: "mcq",
          prompt: "Find the mistake. For D = 0.3r² a_r nC/m², a student finds the flux out of the sphere r = 2 m: (1) D(2) = 0.3 × 2² = 1.2 nC/m². (2) Area = 4π(2) = 25.13 m². (3) Ψ = 1.2 × 25.13 = 30.2 nC. Which step is wrong?",
          options: [
            { id: "s1", label: "Step 1", correct: false, feedback: "Step 1 is fine: 0.3 × 4 = 1.2 nC/m²." },
            { id: "s2", label: "Step 2", correct: true, feedback: "Right: a sphere's area is 4πr² = 50.27 m², so Ψ = 60.3 nC." },
            { id: "s3", label: "Step 3", correct: false, feedback: "The multiplication is right; the area it uses isn't." },
            { id: "none", label: "No mistake", correct: false, feedback: "Check the area formula for a sphere." },
          ],
          dimension: "recognition",
        },
        {
          ...meta("assessment", src(SLIDES, "p. 60 (Q.08)")),
          id: "q8",
          type: "step-solve",
          prompt: "Q.08: Given $\\mathbf D = 0.3r^2\\,\\mathbf a_r$ nC/m² in free space. Work through it one part at a time.",
          steps: [
            {
              id: "q8a",
              prompt: "(a) Find |E| at $P(r = 2, \\theta = 25°, \\phi = 90°)$.",
              answer: { value: 135.5, unit: "V/m" },
              distractors: [
                { value: 1.2, unit: "V/m", errorClass: "conceptual", tag: "D_VS_E_PERMITTIVITY", feedback: "1.2 is D in nC/m². E = D/ε₀." },
              ],
              hints: [
                "In free space E = D/ε₀.",
                "At r = 2: D = 0.3 × 2² = 1.2 nC/m².",
                "E = 1.2×10⁻⁹ / 8.854×10⁻¹² V/m.",
              ],
              workedStep: "D(2) = 0.3·4 = 1.2 nC/m², so E = 1.2×10⁻⁹ / 8.854×10⁻¹² = 135.5 V/m, along a_r. θ and φ don't matter: D is radial and depends only on r.",
            },
            {
              id: "q8b",
              prompt: "(b) Find the total charge within the sphere r = 3.",
              answer: { value: 305.4, unit: "nC" },
              distractors: [
                { value: 2.7, unit: "nC", errorClass: "conceptual", feedback: "2.7 nC/m² is D at r = 3. Multiply by the sphere's area, 4πr²." },
              ],
              hints: [
                "Gauss: Q_enc = ∮ D·dS over the sphere r = 3.",
                "D is radial and constant on the sphere, so ∮ D·dS = D(3) × 4π(3)².",
                "0.3 × 9 × 4π × 9 nC.",
              ],
              workedStep: "Q = D(3)·4π(3)² = 0.3·3²·4π·3² = 0.3·81·4π = 305.4 nC.",
            },
            {
              id: "q8c",
              prompt: "(c) Find the total electric flux leaving the sphere r = 4.",
              answer: { value: 965.1, unit: "nC" },
              distractors: [
                { value: 305.4, unit: "nC", errorClass: "conceptual", feedback: "That's the charge inside r = 3. More charge is enclosed by r = 4, since this D implies charge spread through space." },
              ],
              hints: ["Ψ = ∮ D·dS.", "Same method as (b), at r = 4.", "0.3 × 4² × 4π × 4²."],
              workedStep: "Ψ = D(4)·4π(4)² = 0.3·256·4π = 965.1 nC. It's larger than (b) because this D implies charge distributed through space (ρ_v = ∇·D = 1.2r nC/m³).",
            },
          ],
          dimension: "computational",
        },
        {
          ...meta("assessment", src(SLIDES, "p. 58 (Q.06)")),
          id: "q6",
          type: "step-solve",
          prompt: "Q.06: A 60 µC point charge sits at the origin. Find the flux passing through each surface.",
          steps: [
            {
              id: "q6a",
              prompt: "(a) The portion of the sphere r = 26 cm with $0 < \\theta < \\pi/2$ and $0 < \\phi < \\pi/2$.",
              answer: { value: 7.5, unit: "µC" },
              distractors: [
                { value: 15, unit: "µC", errorClass: "conceptual", feedback: "That range is 1/8 of the sphere: a quarter turn in φ and the top half in θ." },
                { value: 60, unit: "µC", errorClass: "conceptual", feedback: "The whole closed sphere gets 60 µC; this is only part of it." },
              ],
              hints: [
                "The charge is at the centre, so the flux spreads evenly over the sphere.",
                "What fraction of the sphere is 0<θ<π/2, 0<φ<π/2?",
                "Half in θ × a quarter in φ = 1/8.",
              ],
              workedStep: "Symmetric, so Ψ = Q × (fraction of sphere) = 60 × 1/8 = 7.5 µC. The radius 26 cm doesn't matter.",
            },
            {
              id: "q6b",
              prompt: "(b) The closed surface defined by ρ = 26 cm and z = ±26 cm.",
              answer: { value: 60, unit: "µC" },
              distractors: [],
              hints: ["Is this surface closed?", "A cylinder with both end caps is closed.", "Ψ = Q_enc."],
              workedStep: "A closed cylinder (side plus two caps) that encloses the charge, so Ψ = Q_enc = 60 µC. No integration needed.",
            },
            {
              id: "q6c",
              prompt: "(c) The (infinite) plane z = 26 cm.",
              answer: { value: 30, unit: "µC" },
              distractors: [{ value: 60, unit: "µC", errorClass: "conceptual", feedback: "The plane isn't closed: only the flux heading upward crosses it." }],
              hints: [
                "An infinite plane above the charge catches everything heading upward.",
                "By symmetry, how much of the flux goes up?",
                "Half of 60 µC.",
              ],
              workedStep: "The infinite plane intercepts every line with a positive z-component, which is exactly half the flux: Ψ = 30 µC.",
            },
          ],
          dimension: "application",
        },
        {
          ...meta("quiet", src(SLIDES, "p. 27")),
          id: "line-text",
          type: "prose",
          text: "**Line charge by Gauss.** Wrap an infinite line of $\\rho_L$ C/m in a coaxial cylinder of radius $\\rho$ and length $L$. On the curved side D is radial and constant; on the flat end caps D is tangent, so no flux crosses them. $D\\,(2\\pi\\rho L) = \\rho_L L$, so $\\mathbf D = \\dfrac{\\rho_L}{2\\pi\\rho}\\mathbf a_\\rho$ and $\\mathbf E = \\dfrac{\\rho_L}{2\\pi\\varepsilon_0\\rho}\\mathbf a_\\rho$, exactly the slide result.",
        },
        {
          ...meta("assessment", orig()),
          id: "num-line",
          type: "numeric",
          prompt: "An infinite line carries ρ_L = 2 nC/m in free space. Find |E| at 0.5 m from the line.",
          answer: { value: 71.9, unit: "V/m" },
          distractors: [
            { value: 35.95, unit: "V/m", errorClass: "conceptual", feedback: "Check the cylinder's side area: it's 2πρL, and you've used double the radius somewhere." },
            { value: 143.8, unit: "V/m", errorClass: "arithmetic", feedback: "Close. Check the factor of 2 in 2πε₀ρ." },
          ],
          hints: ["E = ρ_L / (2π ε₀ ρ).", "ρ = 0.5 m.", "2×10⁻⁹ / (2π × 8.854×10⁻¹² × 0.5)."],
          dimension: "computational",
        },
      ],
    },
    {
      id: "practice",
      title: "Practice: flux out of a cube",
      minutes: 12,
      blocks: [
        {
          ...meta("quiet", src(SLIDES, "p. 61 (Q.09)")),
          id: "q9-setup",
          type: "prose",
          text: "Q.09: Find the total flux leaving the cube formed by the six planes $x, y, z = \\pm 5$ for each charge distribution. Remember: closed surface, so count only what's inside.",
        },
        {
          ...meta("vivid", orig()),
          id: "q9-lab",
          type: "sim-3d",
          scene: "gauss-lab",
          config: {
            charges: [
              { id: "a", q: 0.1, pos: [0.2, -0.4, 0.6], draggable: true },
              { id: "b", q: 0.1429, pos: [-0.2, 0.4, -0.4], draggable: true },
            ],
            surface: { kind: "cube", side: 2 },
            show: { field: true, normals: false, contributions: true, readout: true },
          },
          caption: "Q.09(a) scaled 1:5 so it fits the lab (positions ÷ 5, cube side 10 → 2). Scaling doesn't change which charges are inside, so the flux doesn't change.",
        },
        {
          ...meta("assessment", src(SLIDES, "p. 61 (Q.09a)")),
          id: "q9a",
          type: "numeric",
          prompt: "(a) Two point charges: 0.1 µC at (1, −2, 3) and 1/7 µC at (−1, 2, −2).",
          answer: { value: 0.2429, unit: "µC" },
          distractors: [],
          hints: ["Are both charges inside |x|,|y|,|z| < 5?", "Both are inside.", "0.1 + 1/7 µC."],
          dimension: "computational",
        },
        {
          ...meta("assessment", src(SLIDES, "p. 61 (Q.09b)")),
          id: "q9b",
          type: "numeric",
          prompt: "(b) A uniform line charge of π µC/m on the line x = −2, y = 3 (parallel to z).",
          answer: { value: 31.42, unit: "µC" },
          distractors: [
            { value: 3.142, unit: "µC", errorClass: "conceptual", feedback: "That's the charge per metre. How many metres of the line are inside the cube?" },
          ],
          hints: [
            "Q_enc = ρ_L × (length of line inside the cube).",
            "The line runs parallel to z, from z = −5 to 5 inside the cube.",
            "π µC/m × 10 m.",
          ],
          dimension: "computational",
        },
        {
          ...meta("assessment", src(SLIDES, "p. 61 (Q.09c)")),
          id: "q9c",
          type: "numeric",
          prompt: "(c) A uniform surface charge of 0.1 µC/m² on the plane y = 3x.",
          answer: { value: 10.54, unit: "µC" },
          distractors: [
            { value: 10, unit: "µC", errorClass: "conceptual", feedback: "The cut isn't 10 m wide: the line y = 3x crosses the square |x|,|y| ≤ 5 on a slant." },
          ],
          hints: [
            "Q_enc = ρ_S × (area of the plane inside the cube).",
            "In the xy-plane, y = 3x runs from x = −5/3 to 5/3 inside the square; its length is √(1+9)·(10/3).",
            "Area = 10 m (in z) × (10/3)√10 m.",
          ],
          dimension: "application",
        },
      ],
    },
    {
      id: "challenge",
      title: "Mastery challenge",
      minutes: 5,
      blocks: [
        {
          ...meta("intense", orig()),
          id: "challenge",
          type: "challenge",
          prompt: "Charges: +3 µC at (0, 0, 0.5) m, −5 µC at (0.2, 0, 0) m, +7 µC at (3, 0, 0) m. A sphere of radius 1 m is centred at the origin. What is the total electric flux leaving the sphere?",
          answer: { value: -2, unit: "µC" },
          distractors: [
            { value: 5, unit: "µC", errorClass: "conceptual", tag: "OUTSIDE_CHARGE_CONTRIBUTES", feedback: "You included the +7 µC at x = 3 m, but it's outside the 1 m sphere." },
            { value: 8, unit: "µC", errorClass: "sign", feedback: "Charges add with their signs: 3 + (−5) = −2." },
          ],
          dimensions: ["independent", "application"],
        },
      ],
    },
    {
      id: "past-paper",
      title: "Past paper: Finals 2024-25 Q2(a)",
      minutes: 10,
      blocks: [
        {
          ...meta("assessment", src(F2425, "Question 2(a), 8 marks")),
          id: "pp-question",
          type: "prose",
          text: "**Finals 2024-25, Q2(a) [8 marks].** In a region of free space the electric flux density is $\\mathbf D = 5.0r^2\\,\\mathbf a_r$ (nC/m²). A sphere of radius $r = 10.0$ m is centred at the origin. (i) Compute $Q_T$, the total charge inside the sphere [6]. (ii) Stating your reason, deduce the total electric flux leaving the sphere [2].",
        },
        {
          ...meta("assessment", src(F2425, "Question 2(a)(i)")),
          id: "pp-i",
          type: "step-solve",
          prompt: "Part (i): compute Q_T.",
          steps: [
            {
              id: "pp-d",
              prompt: "First, |D| on the sphere r = 10 m.",
              answer: { value: 500, unit: "nC/m^2" },
              distractors: [{ value: 50, unit: "nC/m^2", errorClass: "arithmetic", feedback: "r² = 100, not 10." }],
              hints: ["Substitute r = 10 into 5.0 r².", "5 × 100.", "500 nC/m²."],
              workedStep: "D(10) = 5.0 × 10² = 500 nC/m², radial.",
            },
            {
              id: "pp-q",
              prompt: "Now Q_T = ∮ D·dS over the sphere.",
              answer: { value: 628.3, unit: "µC" },
              distractors: [
                { value: 0.6283, unit: "µC", errorClass: "unit", feedback: "Check your prefixes: 500 nC/m² × 1257 m² is about 6.28×10⁵ nC." },
                { value: 5, unit: "µC", errorClass: "conceptual", feedback: "Multiply D by the sphere's area, 4πr²." },
              ],
              hints: [
                "D is radial and constant on the sphere, so ∮ D·dS = D × 4πr².",
                "4π(10)² = 1256.6 m².",
                "500 nC/m² × 1256.6 m² = 200π µC.",
              ],
              workedStep: "Q_T = D·4πr² = 500×10⁻⁹ × 4π×100 = 2π×10⁻⁴ C = 200π µC ≈ 628.3 µC.",
            },
          ],
          dimension: "application",
        },
        {
          ...meta("assessment", src(F2425, "Question 2(a)(ii)")),
          id: "pp-ii",
          type: "mcq",
          prompt: "Part (ii): the total flux leaving the sphere, and why?",
          options: [
            {
              id: "gauss",
              label: "628.3 µC, by Gauss's law: flux out of a closed surface = charge enclosed",
              correct: true,
              feedback: "Full marks come from stating the reason: Gauss's law.",
            },
            { id: "zero", label: "0: the flux in equals the flux out", correct: false, feedback: "That's for a surface with no net charge inside. Here Q_T > 0." },
            { id: "eps", label: "628.3 µC / ε₀", correct: false, feedback: "That's the flux of E. The flux Ψ (of D) equals Q directly.", tag: "D_VS_E_PERMITTIVITY" },
          ],
          dimension: "recognition",
        },
      ],
    },
  ],
};
