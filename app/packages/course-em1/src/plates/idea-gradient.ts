import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const tpl = (id: string) => instantiate(templates.find((t) => t.id === id)!, 1);
const gc = tpl("grad-comp");
const gcyl = tpl("grad-cyl-phi");
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const R_PT = [0, 0.5, Math.sqrt(3) / 2]; // R(1, π/6, π/2)

export const ideaGradient = defineIdeaPlate({
  id: "idea-gradient",
  title: "The gradient",
  requires: { objectives: [0], items: ["tutorial:tut-3.4", "hw-2324-2.1", "mst-2324-q5a"], misconceptions: ["MISSING_SCALE_FACTORS"] },
  instances: [
    { id: "sl", component: "scalar-slice", params: { field: "hill", probe: [1, 0, 0.5], plane: "xz", offset: 0 } },
    { id: "eq", component: "equation", params: eqp(R`\nabla f=\dfrac{\partial f}{\partial x}\mathbf a_x+\dfrac{\partial f}{\partial y}\mathbf a_y+\dfrac{\partial f}{\partial z}\mathbf a_z`, "the gradient in cartesian coordinates") },
  ],
  ideas: [
    {
      id: "gradient",
      title: "The gradient",
      objectives: [0],
      explain: [
        {
          id: "uphill", title: "The gradient points uphill", show: ["sl"], focus: ["sl"],
          note: "A scalar field gives a number at every point: a temperature, a height, a potential V. Its gradient ∇f is a vector that points in the direction f increases fastest, with a length equal to that fastest rate. On the plate, f = 4 − x² − z² is a hill with its top at the origin, and the arrows point uphill, toward the top. At the probe (1, 0, 0.5), f = 2.75 and ∇f = −2âₓ − âz: the steepest ascent is back toward the peak, at 2.236 per metre.",
          claims: [{ instance: "sl", readout: "f", value: 2.75, unit: "" }, { instance: "sl", readout: "g1", value: -2, unit: "" }, { instance: "sl", readout: "g3", value: -1, unit: "" }, { instance: "sl", readout: "gmag", value: 2.23607, unit: "" }],
        },
        {
          id: "cart", title: "In cartesian: three partial derivatives", show: ["eq"], patch: { sl: { field: "tut-3.4", probe: [1, 2, 3], offset: 2 } }, focus: ["sl", "eq"],
          note: "In cartesian coordinates the gradient is the three partial derivatives: ∇f = (∂f/∂x)âₓ + (∂f/∂y)âᵧ + (∂f/∂z)âz. For Φ = xy + yz + xz, ∂Φ/∂x = y + z, ∂Φ/∂y = x + z and ∂Φ/∂z = x + y. At (1, 2, 3) that gives ∇Φ = 5âₓ + 4âᵧ + 3âz. The plate slices the field at y = 2 so you can see it; the readouts are the full three-dimensional gradient.",
          claims: [{ instance: "sl", readout: "g1", value: 5, unit: "" }, { instance: "sl", readout: "g2", value: 4, unit: "" }, { instance: "sl", readout: "g3", value: 3, unit: "" }],
        },
        {
          id: "scale", title: "Cylindrical and spherical: scale factors", patch: { sl: { field: "hw-2.1c", probe: R_PT, offset: 0.5 }, eq: eqp(R`\nabla V=\dfrac{\partial V}{\partial r}\mathbf a_r+\dfrac1r\dfrac{\partial V}{\partial\theta}\mathbf a_\theta+\dfrac{1}{r\sin\theta}\dfrac{\partial V}{\partial\phi}\mathbf a_\phi`, "the gradient in spherical coordinates") }, focus: ["sl", "eq"],
          note: "In curved coordinates a step in an angle is not a step in length, so each angle derivative is divided by its scale factor. Cylindrical: ∇V = ∂V/∂ρ âρ + (1/ρ)∂V/∂φ âφ + ∂V/∂z âz. Spherical: ∇V = ∂V/∂r âr + (1/r)∂V/∂θ âθ + (1/(r sin θ))∂V/∂φ âφ. Both are on the formula sheet, and 1/ρ, 1/r and 1/(r sin θ) are exactly the factors students drop. For W = (4/r) sin θ cos φ at R(1, π/6, π/2), the φ-component is (1/(r sin θ))(−4 sin θ sin φ / r) = −4.",
          claims: [{ instance: "sl", readout: "g3", value: -4, unit: "" }],
        },
        {
          id: "directional", title: "Directional derivatives", patch: { sl: { field: "tut-3.4", probe: [1, 2, 3], offset: 2 }, eq: eqp(R`\dfrac{df}{dl}=\nabla f\cdot\mathbf a_l`, "the directional derivative") }, focus: ["sl", "eq"],
          note: "The rate of change of f in any direction â is the dot product ∇f·â. For Φ at (1, 2, 3), heading toward (3, 4, 4), the direction is (2, 2, 1)/3, so the rate is (5 × 2 + 4 × 2 + 3 × 1)/3 = 7. No direction can beat |∇Φ| = √50 = 7.071, which is why the gradient is 'steepest ascent'. In electrostatics this becomes E = −∇V: the field points steepest downhill in potential.",
          claims: [{ instance: "sl", readout: "gmag", value: 7.07107, unit: "" }],
        },
      ],
      examples: [
        {
          id: "tut34", level: "basic", title: "Gradient and directional derivative",
          setup: { sl: { field: "tut-3.4", probe: [1, 2, 3], offset: 2 } }, hide: ["eq"],
          problem: "Given Φ = xy + yz + xz, find ∇Φ at (1, 2, 3), and the directional derivative of Φ there toward (3, 4, 4).",
          lines: [
            { text: "∂Φ/∂x = y + z, ∂Φ/∂y = x + z, ∂Φ/∂z = x + y.", focus: ["sl"] },
            { text: "At (1, 2, 3): ∇Φ = 5âₓ + 4âᵧ + 3âz.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: 5, unit: "" }, { instance: "sl", readout: "g2", value: 4, unit: "" }, { instance: "sl", readout: "g3", value: 3, unit: "" }] },
            { text: "Toward (3, 4, 4) the displacement is (2, 2, 1), of length 3, so â = (2, 2, 1)/3.", focus: ["sl"] },
            { text: "Directional derivative: ∇Φ·â = (10 + 8 + 3)/3 = 7.", focus: ["sl"] },
          ],
          covers: ["tutorial:tut-3.4"],
          trap: "Using the displacement (2, 2, 1) without dividing by its length 3 gives 21. A directional derivative needs a unit vector.",
        },
        {
          id: "hw21b", level: "tutorial", title: "A cylindrical gradient",
          setup: { sl: { field: "hw-2.1b", probe: [0, 2, -1], offset: 2 } },
          problem: "Find the gradient of U = 2ρ sin φ + ρz and evaluate it at Q(2, 90°, −1).",
          lines: [
            { text: "∂U/∂ρ = 2 sin φ + z; ∂U/∂φ = 2ρ cos φ; ∂U/∂z = ρ.", focus: ["sl"] },
            { text: "Divide the φ-derivative by ρ: (1/ρ)(2ρ cos φ) = 2 cos φ. So ∇U = (2 sin φ + z)âρ + 2 cos φ âφ + ρ âz.", focus: ["sl"] },
            { text: "At Q(2, 90°, −1): ∇U = (2 − 1)âρ + 0âφ + 2âz = âρ + 2âz.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: 1, unit: "" }, { instance: "sl", readout: "g2", value: 0, unit: "" }, { instance: "sl", readout: "g3", value: 2, unit: "" }] },
          ],
          covers: ["hw-2324-2.1"],
          trap: "Getting −âρ: 2 sin 90° + z with z = −1 is +1. Substitute signs one at a time.",
        },
        {
          id: "hw21c", level: "exam", title: "A spherical gradient",
          setup: { sl: { field: "hw-2.1c", probe: R_PT, offset: 0.5 } },
          problem: "Find the gradient of W = (4/r) sin θ cos φ and evaluate it at R(1, π/6, π/2).",
          lines: [
            { text: "∂W/∂r = −(4/r²) sin θ cos φ.", focus: ["sl"] },
            { text: "(1/r)∂W/∂θ = (4/r²) cos θ cos φ.", focus: ["sl"] },
            { text: "(1/(r sin θ))∂W/∂φ = (1/(r sin θ))(−(4/r) sin θ sin φ) = −(4/r²) sin φ: the sin θ cancels.", focus: ["sl"] },
            { text: "At R(1, π/6, π/2), cos φ = 0 and sin φ = 1, so ∇W = 0âr + 0âθ − 4âφ.", focus: ["sl"], claims: [{ instance: "sl", readout: "g1", value: 0, unit: "" }, { instance: "sl", readout: "g2", value: 0, unit: "" }, { instance: "sl", readout: "g3", value: -4, unit: "" }] },
          ],
          covers: ["hw-2324-2.1"],
          trap: "Stopping at ∂W/∂φ = −(4/r) sin θ sin φ and substituting gives −2âφ, not −4âφ. The φ-derivative must be divided by r sin θ.",
        },
      ],
      asks: [
        { id: "vector", q: "Is the gradient a scalar or a vector?", tags: ["GRAD_DIV_TYPE"], a: "A vector. The gradient takes a scalar field and returns a vector field. Divergence goes the other way: vector in, scalar out. Curl takes a vector and returns a vector." },
        { id: "why-scale", q: "Why does ∂/∂φ need the 1/ρ?", tags: ["MISSING_SCALE_FACTORS"], a: "∂V/∂φ is the change per radian, not per metre. At distance ρ from the axis, one radian of φ is ρ metres of arc, so the change per metre is (1/ρ)∂V/∂φ. The gradient must be per metre in every direction." },
        { id: "system", q: "Can I use the cartesian formula on a cylindrical V?", tags: ["OPERATOR_SYSTEM_MISMATCH"], a: "No. If V is written in ρ, φ and z, use the cylindrical formula, or rewrite V in x, y and z first. Mixing them, such as applying ∂/∂x to a function of ρ, gives nonsense." },
        { id: "perp", q: "Why is the gradient perpendicular to contour lines?", a: "Along a contour f doesn't change, so ∇f·â = 0 for any direction â along it. A zero dot product means perpendicular. Equipotential surfaces and field lines meet at right angles for exactly this reason." },
        { id: "zero", q: "What does ∇f = 0 mean?", a: "The field is flat there in every direction: a peak, a valley or a saddle. On the plate's hill, the gradient is zero at the top, which is the origin." },
        { id: "e-grad", q: "How does this connect to E = −∇V?", a: "The electric field is minus the gradient of the potential. The gradient points uphill in V, so E points downhill, from high potential to low, which is the way a positive charge is pushed." },
        { id: "units", q: "What are the units of a gradient?", a: "The units of f per metre. For a potential in volts, ∇V is in volts per metre, which is exactly the unit of electric field." },
      ],
      checks: [
        {
          id: "sph-phi", title: "Check: the spherical φ-component", show: ["sl", "eq"], patch: { sl: { field: "hill", probe: [1, 0, 0.5], offset: 0 } },
          note: "Five checks on the gradient. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "sph-phi", type: "choose", prompt: "In spherical coordinates, the φ-component of ∇V is…", dimension: "recognition",
            options: [
              choice("right", "(1/(r sin θ)) ∂V/∂φ", true, "Right: the φ edge is r sin θ dφ."),
              choice("bare", "∂V/∂φ", false, "That's per radian, not per metre. Divide by r sin θ.", "MISSING_SCALE_FACTORS"),
              choice("half", "(1/r) ∂V/∂φ", false, "1/r belongs to θ. φ needs 1/(r sin θ).", "MISSING_SCALE_FACTORS"),
            ] },
        },
        {
          id: "predict-hill", title: "Check: further from the top",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-hill", type: "predict-drag", prompt: "The probe moves from (1, 0, 0.5) to (2, 0, 1), twice as far from the top. Drag |∇f| to your prediction.", target: { instance: "sl", readout: "gmag" }, range: [0, 8], unit: "", relTol: 0.05, reveal: { sl: { probe: [2, 0, 1] } }, dimension: "conceptual",
            feedback: { close: "Right: twice as far, twice as steep, 4.472.", far: "∇f = −2x âₓ − 2z âz, so its size grows with the distance from the top: 4.472." } },
        },
        {
          id: "cart-num", title: "Check: a cartesian component",
          note: "The cartesian gradient again, with your numbers.",
          interaction: { id: "cart-num", type: "numeric", prompt: gc.prompt, answer: gc.spec.answer, distractors: gc.spec.distractors, relTol: gc.spec.relTol, hints: gc.hints, template: "grad-comp", dimension: "computational" },
          covers: ["hw-2324-2.1"],
        },
        {
          id: "cyl-num", title: "Check: a cylindrical component",
          note: "Mind the scale factor.",
          interaction: { id: "cyl-num", type: "numeric", prompt: gcyl.prompt, answer: gcyl.spec.answer, distractors: gcyl.spec.distractors, relTol: gcyl.spec.relTol, hints: gcyl.hints, template: "grad-cyl-phi", dimension: "computational" },
        },
        {
          id: "mst5a", title: "Check: E_z from V",
          note: "Last one: E = −∇V from the 2023 test.",
          interaction: { id: "mst5a", type: "numeric", prompt: "V = ρ²z³ + 5z cos φ volts. Find E_z = −(∇V)_z at P(2, π, 3).", answer: { value: -103, unit: "V/m" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 103, unit: "V/m", errorClass: "sign", feedback: "E = −∇V. The minus sign flips the gradient." }],
            hints: ["(∇V)_z = ∂V/∂z = 3ρ²z² + 5 cos φ.", "At ρ = 2, φ = π, z = 3: 108 − 5.", "Then negate."] },
          covers: ["mst-2324-q5a"],
        },
      ],
      recap: {
        points: [
          "∇f points in the direction of steepest increase; its size is that rate.",
          "Cartesian: the three partials. Cylindrical: 1/ρ on ∂/∂φ. Spherical: 1/r on ∂/∂θ and 1/(r sin θ) on ∂/∂φ.",
          "Directional derivative: ∇f·â, with â a unit vector.",
          "E = −∇V: the field points downhill in potential.",
        ],
        traps: ["Dropping 1/ρ or 1/(r sin θ).", "Using the displacement instead of the unit vector.", "Losing a sign when substituting."],
      },
    },
  ],
});
