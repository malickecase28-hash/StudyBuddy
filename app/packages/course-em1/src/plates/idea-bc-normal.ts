import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
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
          note: "The boundary is the plane −6x + 8y = 16. The gradient of −6x + 8y gives its normal, (−6, 8, 0); divide by its length, 10, for the unit normal n̂ = (−0.6, 0.8, 0). Normalising matters: projecting onto (−6, 8, 0) makes every normal component ten times too big. The 16 only locates the plane; it never enters the field calculation.",
          claims: [{ instance: "b", readout: "nx", value: -0.6, unit: "" }, { instance: "b", readout: "ny", value: 0.8, unit: "" }],
        },
        {
          id: "project", title: "Project, then subtract", focus: ["b"],
          note: "With D₁ = −10âₓ − 20âᵧ + 14âz C/m² and εr1 = 21: D₁·n̂ = 6 − 16 + 0 = −10, so D₁ₙ = −10n̂ = 6âₓ − 8âᵧ C/m². The rest is tangential: D₁ₜ = D₁ − D₁ₙ = −16âₓ − 12âᵧ + 14âz C/m². Good practice: keep n̂ as a symbol until the dot product is done, and only then substitute, so nothing gets rounded early.",
          claims: [
            { instance: "b", readout: "D1nx", value: 6, unit: "C/m^2" }, { instance: "b", readout: "D1ny", value: -8, unit: "C/m^2" },
            { instance: "b", readout: "D1tx", value: -16, unit: "C/m^2" }, { instance: "b", readout: "D1ty", value: -12, unit: "C/m^2" }, { instance: "b", readout: "D1tz", value: 14, unit: "C/m^2" },
          ],
        },
        {
          id: "assemble", title: "Assemble D₂ and E₂", patch: { b: { show: ["n", "split", "D", "E"] } }, focus: ["b"],
          note: "Apply both rules. Normal D carries over: D₂ₙ = 6âₓ − 8âᵧ. Tangential E carries over, so D₂ₜ = (ε₂/ε₁)D₁ₜ = (7/21)(−16, −12, 14) = (−5.333, −4, 4.667) C/m². Add them: D₂ = 0.667âₓ − 12âᵧ + 4.667âz C/m². Then E₂ = D₂/(7ε₀) = (0.1076, −1.936, 0.7529) × 10¹¹ V/m, which matches the model answer's (1.08, −19.4, 7.53) × 10¹⁰.",
          claims: [
            { instance: "b", readout: "D2x", value: 0.666667, unit: "C/m^2" }, { instance: "b", readout: "D2y", value: -12, unit: "C/m^2" }, { instance: "b", readout: "D2z", value: 4.66667, unit: "C/m^2" },
            { instance: "b", readout: "E2y", value: -1.9361e11, unit: "V/m" },
          ],
        },
        {
          id: "surface-charge", title: "When ρs isn't zero", patch: { b: { ...SHEET, show: ["D", "rhoS"] } }, focus: ["b"],
          note: "Free charge on the interface makes normal D jump by exactly ρs. An infinite sheet with ρs = 120 µC/m² is the extreme case: the same medium on both sides, so symmetry splits the jump evenly. D is 60 µC/m² pointing away from the sheet on each side, so D₁ₙ − D₂ₙ = 60 − (−60) = 120 µC/m². In free space, E = D/ε₀ = 6.776 × 10⁶ V/m on either side.",
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
          id: "ict2", level: "tutorial", title: "A slanted boundary, εr 21 into 7",
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
          id: "hw03", level: "exam", title: "A slanted boundary, 8ε₀ into 5ε₀",
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
        { id: "normalise", q: "Why divide the normal by its length?", tags: ["BND_NORMAL_UNIT"], a: "The projection D·n̂ gives the normal component only when n̂ has length 1. Here (−6, 8, 0) has length 10, so skipping the step makes D₁ₙ ten times too large." },
        { id: "the-16", q: "What does the 16 in −6x + 8y = 16 do?", a: "It sets where the plane sits, not which way it faces. Every parallel plane has the same normal and gives the same D₂ and E₂." },
        { id: "which-side", q: "Does it matter which way n̂ points?", a: "Not when ρs = 0: the split into D₁ₙ and D₁ₜ is the same either way. With surface charge it does: D₁ₙ − D₂ₙ = ρs assumes n̂ points from region 2 into region 1." },
        { id: "en-jumps", q: "So is normal E continuous?", tags: ["BND_E_NORMAL"], a: "No. D₁ₙ = D₂ₙ means ε₁E₁ₙ = ε₂E₂ₙ, so E₂ₙ = (ε₁/ε₂)E₁ₙ. On the plate, E's normal part triples on the way from εr1 = 21 into εr2 = 7." },
        { id: "assumptions", q: "What assumptions should I state?", a: "No free surface charge on the interface (ρs = 0), and linear, isotropic, homogeneous media, so D = εE with a single ε on each side. Questions give marks for stating them." },
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
          id: "mst-sheet", title: "Check: D beside a charged sheet",
          note: "The charged sheet.",
          patch: { b: { ...SHEET, show: ["D", "rhoS"] } },
          interaction: { id: "mst-sheet", type: "numeric", prompt: "An infinite plane in free space carries ρs = 120 µC/m². Find |D| at a point off the plane, in µC/m².", answer: { value: 60, unit: "µC/m^2" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 120, unit: "µC/m^2", errorClass: "conceptual", feedback: "That's the whole jump. Half goes each way: ρs/2." }],
            hints: ["D₁ₙ − D₂ₙ = ρs.", "By symmetry D₁ₙ = −D₂ₙ.", "|D| = ρs/2."] },
          covers: ["mst-2324-q3b"],
        },
        {
          id: "hw03-d2", title: "Check: D₂ across a slanted boundary",
          note: "Last one.",
          patch: { b: { ...HW03, show: ["n", "split", "D"] } },
          interaction: { id: "hw03-d2", type: "numeric", prompt: "ε₁ = 8ε₀, ε₂ = 5ε₀, plane −3x + 4z = 15, D₁ = −10âₓ − 20âᵧ + 14âz C/m². Find D₂ᵧ in C/m².", answer: { value: -12.5, unit: "C/m^2" }, relTol: 0.01, dimension: "computational",
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
