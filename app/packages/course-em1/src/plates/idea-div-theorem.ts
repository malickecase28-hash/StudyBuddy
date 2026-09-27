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
          note: "Surface route: six faces. On x = 2, Dₓ = 6y points out, giving ∫∫6y dy dz = 24. On x = 0, Dₓ = 0. On y = 2 and y = 0, Dᵧ = x² is the same on both, flowing out of one and into the other, so they cancel. On z = 2 and z = 0, D has no z-part, so no flux. The total is 24, the same as the volume route.",
          claims: [{ instance: "vs", readout: "boxFlux", value: 24, unit: "" }],
        },
        {
          id: "open-face", title: "A face with no flux", focus: ["vs", "eq"], patch: { eq: eqp(R`\int_{z=-3}\mathbf D\cdot d\mathbf S=\int(\ldots)\,\mathbf a_x\cdot\mathbf a_z+\ldots=0`, "D has no z component, so no flux through a z face"), vs: { probe: [0.5, 0.5, -3], offset: -3 } },
          note: "HW02 2.6(b) asks for the flux through the square 0 < x, y < 1 m at z = −3 m. Its normal is âz, and D = 3xy âₓ + x² âᵧ has no âz part, so D·dS = 0 everywhere on it: zero flux, with no integral needed. Check whether the field even has a component along the normal before integrating anything.",
          givens: [{ value: 1, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "hw26b", level: "basic", title: "HW02 2.6(b): flux through a z-face",
          setup: { vs: { field: "hw-2.6", plane: "xy", probe: [0.5, 0.5, -3], offset: -3, box: 0 } },
          problem: "Given D = 3xy âₓ + x² âᵧ C/m², find the total flux through the surface 0 < x, y < 1 m, z = −3 m.",
          givens: [{ value: 1, unit: "m" }],
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
          show: ["region"],
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
            { text: "z = 0 and z = 2: no z-component, contributing 0. Total: 24, as the divergence theorem promises.", focus: ["vs"], claims: [{ instance: "vs", readout: "boxFlux", value: 24, unit: "" }] },
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
