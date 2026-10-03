import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const S3 = Math.sqrt(3);

export const ideaGradV = defineIdeaPlate({
  id: "idea-grad-v",
  title: "E = −∇V, and D from V",
  requires: { objectives: [2], items: ["mst-2324-q5a", "f2425-q1c", "f2324-q1b"], misconceptions: ["GRAD_SIGN"] },
  instances: [
    { id: "sl", component: "scalar-slice", params: { field: "ex4-V", probe: [1, 0, 1], plane: "xz", offset: 0 } },
    { id: "eq", component: "equation", params: eqp(R`\mathbf E=-\nabla V,\qquad \mathbf D=\varepsilon\mathbf E=-\varepsilon\nabla V`, "E equals minus grad V, and D equals minus epsilon grad V") },
  ],
  ideas: [
    {
      id: "grad-v",
      title: "E = −∇V, and D from V",
      objectives: [2],
      explain: [
        {
          id: "downhill", title: "The field points downhill", show: ["sl", "eq"], focus: ["sl", "eq"],
          note: "Since V_AB = −∫E·dL, the field is minus the potential's gradient: E = −∇V. The gradient points uphill in V, so E points straight downhill, from high potential to low, perpendicular to the equipotentials. On the plate, V = −(xy + 2z), the potential behind Example 4's field. At (1, 0, 1), ∇V = (0, −1, −2), so E = (0, 1, 2): exactly y âₓ + x âᵧ + 2 âz there.",
          claims: [{ instance: "sl", readout: "g1", value: 0, unit: "" }, { instance: "sl", readout: "g2", value: -1, unit: "" }, { instance: "sl", readout: "g3", value: -2, unit: "" }],
        },
        {
          id: "cart", title: "Cartesian", patch: { sl: { field: "f2425-1c", probe: [2, -2, 1], offset: -2 } }, focus: ["sl"],
          note: "V = x³ sin y + 10z² kV. The gradient is (3x² sin y, x³ cos y, 20z) kV/m. At P(2, −2, 1) it is (−10.91, −3.329, 20.00) kV/m. So E = −∇V = 10.91âₓ + 3.329âᵧ − 20.00âz kV/m, and D = εE = ε(10.91âₓ + 3.329âᵧ − 20.00âz) × 10³ C/m², where ε is the region's permittivity, left as a symbol because the paper doesn't give it.",
          claims: [{ instance: "sl", readout: "g1", value: -10.9116, unit: "" }, { instance: "sl", readout: "g2", value: -3.32917, unit: "" }, { instance: "sl", readout: "g3", value: 20, unit: "" }],
        },
        {
          id: "cyl", title: "Cylindrical", patch: { sl: { field: "mst-5a", probe: [-2, 0, 3], offset: 0 } }, focus: ["sl"],
          note: "V = ρ²z³ + 5z cos φ volts. The cylindrical gradient is (2ρz³, −5z sin φ/ρ, 3ρ²z² + 5 cos φ). At P(2, π, 3), sin φ = 0 and cos φ = −1, giving ∇V = (108, 0, 103). So E = −108âρ − 103âz V/m. The 1/ρ on the φ-term didn't matter here only because sin π = 0; it always has to be there.",
          claims: [{ instance: "sl", readout: "g1", value: 108, unit: "" }, { instance: "sl", readout: "g3", value: 103, unit: "" }],
        },
        {
          id: "sph", title: "Spherical", patch: { sl: { field: "f2324-1b", probe: [0, -2.5 * S3, 2.5], offset: -2.5 * S3 } }, focus: ["sl"],
          note: "V = r³ sin θ cos φ. The spherical gradient is (3r² sin θ cos φ, r² cos θ cos φ, −r² sin φ). At P(5, π/3, −π/2), cos φ = 0 and sin φ = −1, leaving ∇V = 25âφ. So E = −25âφ V/m and, in free space, D = ε₀E = −2.214 × 10⁻¹⁰ âφ C/m². The point's cartesian position is (0, −4.330, 2.5) m, which is where the plate's probe sits.",
          claims: [{ instance: "sl", readout: "g3", value: 25, unit: "" }],
        },
      ],
      examples: [
        {
          id: "ex4v", level: "basic", title: "From V back to Example 4's field",
          setup: { sl: { field: "ex4-V", probe: [1, 0, 1], offset: 0 } },
          problem: "Given V = −(xy + 2z), find E at B(1, 0, 1).",
          lines: [
            { text: "∇V = (−y, −x, −2).", focus: ["sl"] },
            { text: "At B: ∇V = (0, −1, −2), so E = −∇V = âᵧ + 2âz V/m.", focus: ["sl"], claims: [{ instance: "sl", readout: "g2", value: -1, unit: "" }, { instance: "sl", readout: "g3", value: -2, unit: "" }] },
          ],
          trap: "Reporting ∇V as the field. E is its negative.",
        },
        {
          id: "mst5a", level: "tutorial", title: "E from V in cylindrical coordinates",
          setup: { sl: { field: "mst-5a", probe: [-2, 0, 3], offset: 0 } },
          problem: "(i) State the equation relating E and V. (ii) Given V = ρ²z³ + 5z cos φ volts, find E at P(2, π, 3).",
          lines: [
            { text: "(i) E = −∇V.", focus: ["eq"] },
            { text: "∂V/∂ρ = 2ρz³ = 108; (1/ρ)∂V/∂φ = −5z sin φ/ρ = 0; ∂V/∂z = 3ρ²z² + 5 cos φ = 108 − 5 = 103.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: 108, unit: "" }, { instance: "sl", readout: "g3", value: 103, unit: "" }] },
            { text: "(ii) E = −108âρ − 103âz V/m.", focus: ["sl"] },
          ],
          covers: ["mst-2324-q5a"],
          trap: "cos π = −1, not 1. Getting 113 instead of 103 means the sign of cos φ was lost.",
        },
        {
          id: "f2425", level: "exam", title: "D from V",
          setup: { sl: { field: "f2425-1c", probe: [2, -2, 1], offset: -2 } },
          problem: "In a region of permittivity ε, V = x³ sin y + 10z² kV. (i) Develop an expression for D in C·m⁻². (ii) Evaluate D at P(2, −2, 1) m.",
          lines: [
            { text: "(i) D = εE = −ε∇V = −ε(3x² sin y âₓ + x³ cos y âᵧ + 20z âz) × 10³ C/m² (the 10³ converts kV to V).", focus: ["sl", "eq"] },
            { text: "At P: ∇V = (−10.91, −3.329, 20.00) kV/m.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: -10.9116, unit: "" }, { instance: "sl", readout: "g2", value: -3.32917, unit: "" }, { instance: "sl", readout: "g3", value: 20, unit: "" }] },
            { text: "(ii) D = ε(10.91âₓ + 3.329âᵧ − 20.00âz) × 10³ C/m².", focus: ["sl"] },
          ],
          covers: ["f2425-q1c"],
          trap: "Forgetting the 10³ from kV. D comes out a thousand times too small.",
        },
      ],
      asks: [
        { id: "minus", q: "Why the minus sign in E = −∇V?", tags: ["GRAD_SIGN"], a: "∇V points toward increasing potential, but a positive charge is pushed toward lower potential, the way a ball rolls downhill. E points the way a positive charge is pushed, so it is the negative gradient." },
        { id: "equip", q: "What are equipotential surfaces?", a: "Surfaces of constant V. E is always perpendicular to them, and moving a charge along one costs no work." },
        { id: "units", q: "Why is ∇V in V/m?", a: "Differentiating volts with respect to metres gives volts per metre, which is exactly the unit of E. With V in kV, the gradient is in kV/m." },
        { id: "eps", q: "Why leave ε as a symbol?", a: "The question gives no numerical permittivity, so the honest answer keeps ε. In free space it would be ε₀ = 8.854 × 10⁻¹² F/m." },
        { id: "which-sys", q: "How do I choose the gradient formula?", a: "Match V's variables: x, y, z means cartesian; ρ, φ, z means cylindrical; r, θ, φ means spherical. Then read the point's coordinates in the same system." },
        { id: "check", q: "How can I check my E?", a: "Two quick checks: E should point from higher V to lower V, and its units should be V/m. Also, the curl of −∇V must be zero." },
      ],
      checks: [
        {
          id: "sign", title: "Check: the relation", show: ["sl", "eq"], patch: { sl: { field: "ex4-V", probe: [1, 0, 1], offset: 0 } },
          note: "Four checks on E from V. Get each right to move on.",
          interaction: { id: "sign", type: "choose", prompt: "E and V are related by…", dimension: "recognition",
            options: [
              choice("right", "E = −∇V", true, "Right: E points downhill in potential."),
              choice("plus", "E = ∇V", false, "The gradient points uphill; E points downhill.", "GRAD_SIGN"),
              choice("int", "E = ∫V dL", false, "The integral goes the other way: V = −∫E·dL."),
            ] },
          covers: ["mst-2324-q5a"],
        },
        {
          id: "mst-ez", title: "Check: E_z from V",
          note: "One component.",
          interaction: { id: "mst-ez", type: "numeric", prompt: "V = ρ²z³ + 5z cos φ volts. Find E_z at P(2, π, 3).", answer: { value: -103, unit: "V/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 103, unit: "V/m", errorClass: "sign", tag: "GRAD_SIGN", feedback: "E = −∇V: negate the gradient." }, { value: -113, unit: "V/m", errorClass: "sign", feedback: "cos π = −1, so 5 cos φ = −5." }],
            hints: ["E_z = −∂V/∂z.", "∂V/∂z = 3ρ²z² + 5 cos φ.", "3(4)(9) − 5 = 103."] },
          covers: ["mst-2324-q5a"],
        },
        {
          id: "f2324-d", title: "Check: D_φ from V",
          note: "D in free space, from V.",
          interaction: { id: "f2324-d", type: "numeric", prompt: "V = r³ sin θ cos φ volts, in free space. Find D_φ at P(5, π/3, −π/2), in C/m².", answer: { value: -2.2135e-10, unit: "C/m^2" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 2.2135e-10, unit: "C/m^2", errorClass: "sign", tag: "GRAD_SIGN", feedback: "D = −ε₀∇V; the gradient's φ-part is +25." }],
            hints: ["(1/(r sin θ))∂V/∂φ = −r² sin φ.", "At φ = −π/2, that is +25.", "D_φ = −ε₀ × 25."] },
          covers: ["f2324-q1b"],
        },
        {
          id: "f2425-dz", title: "Check: D_z from V",
          note: "Last one: the z-part, in units of ε.",
          interaction: { id: "f2425-dz", type: "numeric", prompt: "V = x³ sin y + 10z² kV in a region of permittivity ε. D_z at P(2, −2, 1) equals ε × (?) × 10³. Give the number in the bracket.", answer: { value: -20, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 20, unit: "", errorClass: "sign", tag: "GRAD_SIGN", feedback: "D = −ε∇V, so the z-part is −20z." }],
            hints: ["∂V/∂z = 20z.", "At z = 1, that is 20.", "Negate."] },
          covers: ["f2425-q1c"],
        },
      ],
      recap: {
        points: [
          "E = −∇V: the field points downhill in potential, perpendicular to equipotentials.",
          "D = εE = −ε∇V; keep ε symbolic if the paper gives none.",
          "Use the gradient formula of V's own coordinate system, scale factors included.",
          "Carry unit prefixes: V in kV gives E in kV/m.",
        ],
        traps: ["Dropping the minus sign.", "cos π = −1, not +1.", "Losing the 10³ from kV."],
      },
    },
  ],
});
