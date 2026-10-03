import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const bt = instantiate(templates.find((t) => t.id === "bnd-tangent")!, 1);
const F2425 = { D1: [1, 3, -7] as [number, number, number], normal: [1, 0, 0] as [number, number, number], er1: 5, er2: 1, rhoS: 0 };
const F2324 = { D1: [3, -4, 6] as [number, number, number], normal: [1, 0, 0] as [number, number, number], er1: 1, er2: 3.5, rhoS: 0 };

export const ideaBcTangential = defineIdeaPlate({
  id: "idea-bc-tangential",
  title: "Tangential E is continuous",
  requires: { objectives: [1], items: ["f2425-q2b", "f2324-q2a"], misconceptions: ["BND_D_TANGENT"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "b", component: "boundary", params: { ...F2425, show: ["split", "D", "E"] } },
    { id: "eq", component: "equation", params: eqp(R`\mathbf D_1=\mathbf D_{1n}+\mathbf D_{1t}`, "D one equals its normal part plus its tangential part") },
  ],
  ideas: [
    {
      id: "tangential",
      title: "Tangential E is continuous",
      objectives: [1],
      explain: [
        {
          id: "split", title: "First, split D", show: ["axes", "b", "eq"], focus: ["b", "eq"],
          note: "Every boundary problem starts the same way. Split the field into a part along the unit normal n̂ and a part lying in the boundary plane: D₁ₙ = (D₁·n̂)n̂ and D₁ₜ = D₁ − D₁ₙ. The plate uses the plane x = 0, so n̂ = âₓ and the split is just reading components: D₁ₙ = âₓ and D₁ₜ = 3âᵧ − 7âz C/m². A slanted plane needs the dot product; Idea 3 does that.",
          claims: [{ instance: "b", readout: "D1nx", value: 1, unit: "C/m^2" }, { instance: "b", readout: "D1ty", value: 3, unit: "C/m^2" }, { instance: "b", readout: "D1tz", value: -7, unit: "C/m^2" }],
        },
        {
          id: "loop", title: "A thin loop across the boundary", patch: { eq: eqp(R`\oint\mathbf E\cdot d\mathbf L=0\ \Rightarrow\ \mathbf E_{1t}=\mathbf E_{2t}`, "the loop integral of E is zero, so E one t equals E two t") }, focus: ["eq", "b"],
          note: "Draw a small rectangle straddling the interface: two long sides parallel to it, one in each region, and two short sides crossing it. An electrostatic field is conservative, so ∮E·dL = 0 round the rectangle. Shrink the short sides to nothing and only the long sides count: E₁ₜΔw − E₂ₜΔw = 0. The tangential component of E is the same on both sides. On the plate both regions have E's y-component 6.776 × 10¹⁰ V/m.",
          claims: [{ instance: "b", readout: "E1y", value: 6.77645e10, unit: "V/m" }, { instance: "b", readout: "E2y", value: 6.77645e10, unit: "V/m" }],
        },
        {
          id: "d-jumps", title: "So tangential D jumps", patch: { eq: eqp(R`\mathbf D_{2t}=\dfrac{\varepsilon_2}{\varepsilon_1}\mathbf D_{1t}`, "D two t equals epsilon two over epsilon one times D one t") }, focus: ["eq", "b"],
          note: "Now convert to D. D = εE on each side, so D₁ₜ/ε₁ = D₂ₜ/ε₂, or D₂ₜ = (ε₂/ε₁)D₁ₜ. On the plate, region 1 (x < 0, εr1 = 5) holds D₁, and region 2 (x > 0) is free space. The tangential part 3âᵧ − 7âz shrinks by a factor of 5, to 0.6âᵧ − 1.4âz C/m².",
          claims: [{ instance: "b", readout: "D2y", value: 0.6, unit: "C/m^2" }, { instance: "b", readout: "D2z", value: -1.4, unit: "C/m^2" }],
        },
        {
          id: "free-e", title: "E₂ in free space", focus: ["b"],
          note: "Region 2 is free space, so E₂ = D₂/ε₀. With D₂ₙ = âₓ (Idea 3 explains why the normal part carries over) and D₂ₜ = 0.6âᵧ − 1.4âz, D₂ = âₓ + 0.6âᵧ − 1.4âz C/m² and E₂ = (1.129, 0.678, −1.581) × 10¹¹ V/m. Check the tangential part: E₂ᵧ = 0.6/ε₀ = 3/(5ε₀) = E₁ᵧ. Continuous, as promised.",
          claims: [{ instance: "b", readout: "E2x", value: 1.12941e11, unit: "V/m" }, { instance: "b", readout: "E2y", value: 6.77645e10, unit: "V/m" }, { instance: "b", readout: "E1y", value: 6.77645e10, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "basic", level: "basic", title: "Scaling the tangential part",
          setup: { b: { D1: [3, 0, 5], normal: [0, 0, 1], er1: 2, er2: 4, rhoS: 0 } },
          problem: "At the plane z = 0, region 1 (z > 0, εr1 = 2) has D₁ = 3âₓ + 5âz C/m², and region 2 (z < 0) has εr2 = 4. Find D₂'s tangential part.",
          lines: [
            { text: "Tangential to z = 0 means the x and y parts: D₁ₜ = 3âₓ C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D1tx", value: 3, unit: "C/m^2" }] },
            { text: "D₂ₜ = (ε₂/ε₁)D₁ₜ = (4/2)(3âₓ) = 6âₓ C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D2x", value: 6, unit: "C/m^2" }] },
          ],
          trap: "Copying D₁ₜ across unchanged. E's tangential part is continuous; D's is multiplied by ε₂/ε₁.",
        },
        {
          id: "f2324", level: "tutorial", title: "E₂",
          setup: { b: { ...F2324 } },
          problem: "Region 1 (x < 0) is free space; region 2 (x > 0) is a dielectric with εr2 = 3.5. Given D₁ = 3âₓ − 4âᵧ + 6âz C/m², compute E₂.",
          lines: [
            { text: "n̂ = âₓ: D₁ₙ = 3âₓ and D₁ₜ = −4âᵧ + 6âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D1nx", value: 3, unit: "C/m^2" }] },
            { text: "Tangential E carries over: E₂ₜ = E₁ₜ = (−4âᵧ + 6âz)/ε₀.", focus: ["b"], claims: [{ instance: "b", readout: "E2y", value: -4.51764e11, unit: "V/m" }] },
            { text: "Normal D carries over (no surface charge): D₂ₙ = 3âₓ, so E₂ₙ = 3âₓ/(3.5ε₀).", focus: ["b"] },
            { text: "E₂ = (0.857âₓ − 4âᵧ + 6âz)/ε₀ = (0.968, −4.518, 6.776) × 10¹¹ V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E2x", value: 9.68065e10, unit: "V/m" }, { instance: "b", readout: "E2z", value: 6.77645e11, unit: "V/m" }] },
          ],
          covers: ["f2324-q2a"],
          trap: "Dividing the tangential part by 3.5 as well. Only E's normal part changes across this boundary.",
        },
        {
          id: "f2425", level: "exam", title: "E₂ and D₂ across x = 0",
          setup: { b: { ...F2425 } },
          problem: "Region 1 (x < 0) is a dielectric with εr1 = 5; region 2 (x > 0) is free space. Given D₁ = âₓ + 3âᵧ − 7âz C/m², calculate (i) E₂ and (ii) D₂.",
          lines: [
            { text: "n̂ = âₓ: D₁ₙ = âₓ and D₁ₜ = 3âᵧ − 7âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D1nx", value: 1, unit: "C/m^2" }] },
            { text: "E₂ₜ = E₁ₜ = D₁ₜ/(5ε₀), so D₂ₜ = ε₀E₂ₜ = (3âᵧ − 7âz)/5 = 0.6âᵧ − 1.4âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D2y", value: 0.6, unit: "C/m^2" }] },
            { text: "D₂ₙ = D₁ₙ = âₓ (ρs = 0), so D₂ = âₓ + 0.6âᵧ − 1.4âz C/m².", focus: ["b"], claims: [{ instance: "b", readout: "D2x", value: 1, unit: "C/m^2" }, { instance: "b", readout: "D2z", value: -1.4, unit: "C/m^2" }] },
            { text: "E₂ = D₂/ε₀ = (1.129, 0.678, −1.581) × 10¹¹ V/m.", focus: ["b"], claims: [{ instance: "b", readout: "E2x", value: 1.12941e11, unit: "V/m" }, { instance: "b", readout: "E2z", value: -1.58117e11, unit: "V/m" }] },
          ],
          covers: ["f2425-q2b"],
          trap: "Dividing D₂ by 5ε₀. Region 2 is free space, so E₂ = D₂/ε₀.",
        },
      ],
      asks: [
        { id: "why-t", q: "Why is it E, not D, whose tangential part is continuous?", tags: ["BND_D_TANGENT"], a: "The rule comes from ∮E·dL = 0, which is a statement about E. D = εE, and ε differs on the two sides, so if Eₜ matches, Dₜ can't: D₂ₜ = (ε₂/ε₁)D₁ₜ." },
        { id: "loop-short", q: "Why shrink the short sides of the loop?", a: "So the loop hugs the boundary. The short sides' contributions vanish as their length goes to zero, leaving only the tangential field just above and just below the surface." },
        { id: "which-t", q: "Which components are tangential?", a: "Those lying in the boundary plane. For x = 0 they're the y and z parts. For a slanted plane, subtract the normal part: Dₜ = D − (D·n̂)n̂." },
        { id: "vector", q: "Is the rule for the magnitude or the vector?", a: "The whole tangential vector. E₁ₜ = E₂ₜ component by component, direction within the plane included." },
        { id: "e0-symbol", q: "How do I give E₂ in terms of ε₀?", a: "Divide D₂ by ε₂ = εr2 ε₀ and leave ε₀ as a symbol, as many questions ask: E₂ = D₂/(5ε₀). Only put in 8.854 × 10⁻¹² when the question wants V/m." },
        { id: "conductor-link", q: "What if region 2 is a conductor?", a: "Then E₂ = 0 inside it, and continuity forces E₁ₜ = 0 too: the field meets a conductor at right angles. Idea 5 does this properly." },
      ],
      checks: [
        {
          id: "which-cont", title: "Check: what's continuous", show: ["axes", "b", "eq"], patch: { b: { ...F2425 } },
          note: "Four checks on the tangential condition. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "which-cont", type: "choose", prompt: "Across a charge-free boundary between two dielectrics, which two are continuous?", dimension: "recognition",
            options: [
              choice("right", "Tangential E and normal D", true, "Right: Eₜ from the loop, Dₙ from the pillbox."),
              choice("swap", "Tangential D and normal E", false, "Swapped: it's Eₜ and Dₙ.", "BND_D_TANGENT"),
              choice("all", "All of E", false, "E's normal part jumps by ε₁/ε₂."),
            ] },
        },
        {
          id: "predict-er2", title: "Check: a dielectric in region 2",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-er2", type: "predict-drag", prompt: "Region 2 changes from free space to εr2 = 2.5. Drag D₂ᵧ to your prediction.", target: { instance: "b", readout: "D2y" }, range: [0, 3], unit: "C/m^2", relTol: 0.05, reveal: { b: { er2: 2.5 } }, dimension: "conceptual",
            feedback: { close: "Right: (2.5/5) × 3 = 1.5 C/m².", far: "D₂ₜ = (ε₂/ε₁)D₁ₜ: (2.5/5) × 3 = 1.5 C/m²." } },
        },
        {
          id: "t-num", title: "Check: a boundary, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "t-num", type: "numeric", prompt: bt.prompt, answer: bt.spec.answer, distractors: bt.spec.distractors, relTol: bt.spec.relTol, hints: bt.hints, template: "bnd-tangent", dimension: "computational" },
        },
        {
          id: "f2425-e2", title: "Check: E₂ across x = 0",
          note: "Last one.",
          patch: { b: { ...F2425 } },
          interaction: { id: "f2425-e2", type: "numeric", prompt: "εr1 = 5 (x < 0), free space for x > 0, D₁ = âₓ + 3âᵧ − 7âz C/m². Find E₂ₓ in V/m.", answer: { value: 1.12941e11, unit: "V/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 2.25882e10, unit: "V/m", errorClass: "conceptual", tag: "BND_E_NORMAL", feedback: "That's E₁ₓ. Normal E jumps; it's normal D that's continuous, so E₂ₓ = D₁ₓ/ε₀." }],
            hints: ["x is normal to x = 0.", "D₂ₓ = D₁ₓ = 1.", "E₂ₓ = 1/ε₀."] },
          covers: ["f2425-q2b"],
        },
      ],
      recap: {
        points: [
          "Split first: D₁ₙ = (D₁·n̂)n̂ and D₁ₜ = D₁ − D₁ₙ.",
          "∮E·dL = 0 gives E₁ₜ = E₂ₜ: tangential E is continuous.",
          "So D₂ₜ = (ε₂/ε₁)D₁ₜ: tangential D jumps.",
          "In free space E = D/ε₀.",
        ],
        traps: ["Treating tangential D as continuous.", "Scaling the normal part too.", "Dividing by the wrong region's ε."],
      },
    },
  ],
});
