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
  requires: { objectives: [2], items: ["tutorial:tut-3.8", "f2425-q4a"], misconceptions: [] },
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
