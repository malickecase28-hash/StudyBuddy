import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
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
