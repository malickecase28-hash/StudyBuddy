import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const dv = instantiate(templates.find((t) => t.id === "div-cart")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const S3 = Math.sqrt(3);
const B_PT = [S3 / 2, 0.5, 2]; // ρ = 1, φ = 30°, z = 2
const C_PT = [0.25, S3 / 4, S3 / 2]; // r = 1, θ = π/6, φ = π/3

export const ideaDivergence = defineIdeaPlate({
  id: "idea-divergence",
  title: "Divergence and the divergence theorem",
  requires: { objectives: [1], items: ["tutorial:tut-3.6", "hw-2324-2.2"], misconceptions: ["OPERATOR_SYSTEM_MISMATCH", "GRAD_DIV_TYPE"] },
  instances: [
    { id: "vs", component: "vector-slice", params: { field: "source", probe: [0.5, 0, 0.2], box: 0.4 } },
    { id: "eq", component: "equation", params: eqp(R`\nabla\cdot\mathbf A=\lim_{\Delta v\to0}\dfrac{\oint\mathbf A\cdot d\mathbf S}{\Delta v}`, "divergence as outward flux per unit volume") },
  ],
  ideas: [
    {
      id: "divergence",
      title: "Divergence and the divergence theorem",
      objectives: [1],
      explain: [
        {
          id: "outflow", title: "Divergence: outflow per unit volume", show: ["vs", "eq"], focus: ["vs"],
          note: "The divergence of a vector field at a point measures how much the field flows out of a tiny box around that point, per unit volume. Positive means a source, with the field spreading out; negative means a sink; zero means as much flows in as out. The plate's field A = xâₓ + yâᵧ + zâz spreads out everywhere. The hatched box has side 0.4 m, and the net flux out of it divided by its volume is exactly 3, the divergence.",
          claims: [{ instance: "vs", readout: "div", value: 3, unit: "" }, { instance: "vs", readout: "boxRatio", value: 3, unit: "" }],
        },
        {
          id: "cart", title: "In cartesian: add three derivatives", patch: { vs: { field: "tut-3.6a", probe: [1, -2, 3], box: 0.2, offset: -2 }, eq: eqp(R`\nabla\cdot\mathbf A=\dfrac{\partial A_x}{\partial x}+\dfrac{\partial A_y}{\partial y}+\dfrac{\partial A_z}{\partial z}`, "the divergence in cartesian coordinates") }, focus: ["vs", "eq"],
          note: "In cartesian coordinates ∇·A = ∂Aₓ/∂x + ∂Aᵧ/∂y + ∂A_z/∂z: differentiate each component along its own axis, then add. The result is a scalar. For A = yz âₓ + 4xy âᵧ + y âz: ∂(yz)/∂x = 0, ∂(4xy)/∂y = 4x and ∂(y)/∂z = 0, so ∇·A = 4x, which is 4 at (1, −2, 3). The plate's box, shrunk to 0.2 m, confirms it: flux ÷ volume = 4.",
          claims: [{ instance: "vs", readout: "div", value: 4, unit: "" }, { instance: "vs", readout: "boxRatio", value: 4, unit: "" }],
        },
        {
          id: "curved", title: "Curved coordinates: multiply, differentiate, divide", patch: { vs: { field: "hw-2.2b", probe: B_PT, box: 0, offset: 0.5 }, eq: eqp(R`\nabla\cdot\mathbf D=\dfrac1\rho\dfrac{\partial(\rho D_\rho)}{\partial\rho}+\dfrac1\rho\dfrac{\partial D_\phi}{\partial\phi}+\dfrac{\partial D_z}{\partial z}`, "the divergence in cylindrical coordinates") }, focus: ["vs", "eq"],
          note: "In curved coordinates the scale factors sit inside the derivatives. Cylindrical: ∇·D = (1/ρ)∂(ρDρ)/∂ρ + (1/ρ)∂Dφ/∂φ + ∂D_z/∂z. Spherical: ∇·D = (1/r²)∂(r²D_r)/∂r + (1/(r sin θ))∂(sin θ D_θ)/∂θ + (1/(r sin θ))∂D_φ/∂φ. Multiply first, then differentiate, then divide. For HW02's B = ρz² âρ + ρ sin²φ âφ + 2ρz sin²φ âz, this gives ∇·B = 2z² + sin 2φ + 2ρ sin²φ, which is 9.366 at ρ = 1, φ = 30°, z = 2.",
          claims: [{ instance: "vs", readout: "div", value: 9.36603, unit: "" }],
        },
        {
          id: "theorem", title: "The divergence theorem", patch: { vs: { field: "source", probe: [0.5, 0, 0.2], box: 1.2, offset: 0 }, eq: eqp(R`\oint_S\mathbf A\cdot d\mathbf S=\int_V\nabla\cdot\mathbf A\,dv`, "the divergence theorem") }, focus: ["vs", "eq"],
          note: "Add up the divergence over a whole volume and you get the total flux out through its surface: ∮ A·dS = ∫ ∇·A dv. For the plate's field ∇·A = 3 everywhere, so a box of side 1.2 m, with volume 1.728 m³, must have 5.184 of flux coming out, and it does. This is Gauss's law in disguise: with D, ∇·D = ρv, and the volume integral of ρv is the enclosed charge.",
          claims: [{ instance: "vs", readout: "boxFlux", value: 5.184, unit: "" }],
          givens: [{ value: 1.2 ** 3, unit: "m^3" }],
        },
      ],
      examples: [
        {
          id: "tut36a", level: "basic", title: "Tutorial 3.6(a): a cartesian divergence",
          setup: { vs: { field: "tut-3.6a", probe: [1, -2, 3], box: 0, offset: -2 } },
          problem: "Find the divergence of A = yz âₓ + 4xy âᵧ + y âz and evaluate it at (1, −2, 3).",
          lines: [
            { text: "∂(yz)/∂x = 0; ∂(4xy)/∂y = 4x; ∂(y)/∂z = 0.", focus: ["vs"] },
            { text: "∇·A = 4x, and at (1, −2, 3) that is 4.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 4, unit: "" }] },
          ],
          covers: ["tutorial:tut-3.6"],
          trap: "Differentiating a component along the wrong axis, such as ∂(yz)/∂y = z, adds terms that aren't there. Aₓ goes with ∂/∂x only.",
        },
        {
          id: "hw22b", level: "tutorial", title: "HW02 2.2(b): a cylindrical divergence",
          setup: { vs: { field: "hw-2.2b", probe: B_PT, box: 0, offset: 0.5 } },
          problem: "Evaluate the divergence of B = ρz² âρ + ρ sin²φ âφ + 2ρz sin²φ âz.",
          lines: [
            { text: "(1/ρ)∂(ρ·ρz²)/∂ρ = (1/ρ)∂(ρ²z²)/∂ρ = 2z².", focus: ["vs"] },
            { text: "(1/ρ)∂(ρ sin²φ)/∂φ = 2 sin φ cos φ = sin 2φ.", focus: ["vs"] },
            { text: "∂(2ρz sin²φ)/∂z = 2ρ sin²φ.", focus: ["vs"] },
            { text: "∇·B = 2z² + sin 2φ + 2ρ sin²φ. At ρ = 1, φ = 30°, z = 2: 8 + 0.866 + 0.5 = 9.366.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 9.36603, unit: "" }] },
          ],
          covers: ["hw-2324-2.2"],
          trap: "Using the cartesian pattern, ∂Bρ/∂ρ + ∂Bφ/∂φ + ∂B_z/∂z, gives z² + 2ρ sin φ cos φ + 2ρ sin²φ. The ρ inside the derivative and the 1/ρ outside are not optional.",
        },
        {
          id: "tut36c", level: "exam", title: "Tutorial 3.6(c): a spherical divergence",
          setup: { vs: { field: "tut-3.6c", probe: C_PT, box: 0, offset: S3 / 4 } },
          problem: "Find the divergence of C = 2r cos θ cos φ âr + √r âφ and evaluate it at (1, π/6, π/3).",
          lines: [
            { text: "Radial term: (1/r²)∂(r² · 2r cos θ cos φ)/∂r = (1/r²)(6r² cos θ cos φ) = 6 cos θ cos φ.", focus: ["vs"] },
            { text: "The θ-term is zero because C_θ = 0, and ∂(√r)/∂φ = 0.", focus: ["vs"] },
            { text: "∇·C = 6 cos θ cos φ. At (1, π/6, π/3): 6 × 0.8660 × 0.5 = 2.598.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 2.59808, unit: "" }] },
          ],
          covers: ["tutorial:tut-3.6"],
          trap: "Forgetting the r² inside the derivative gives ∂(2r cos θ cos φ)/∂r = 2 cos θ cos φ, a third of the right answer.",
        },
      ],
      asks: [
        { id: "scalar", q: "Is the divergence a vector?", tags: ["GRAD_DIV_TYPE"], a: "No, a scalar: one number at each point, the net outflow per unit volume. Seeing âₓ, âᵧ or âz in a divergence answer means something went wrong." },
        { id: "hw22a", q: "A = xy âₓ + y² âᵧ − xz âz: which formula?", tags: ["OPERATOR_SYSTEM_MISMATCH"], a: "Cartesian, because A is written with âₓ, âᵧ and âz in x, y and z. Here ∇·A = y + 2y − x = 3y − x. Applying the cylindrical formula to a cartesian field is a common and costly slip." },
        { id: "zero", q: "What does zero divergence mean?", a: "What flows in equals what flows out: no source and no sink. The swirl field −y âₓ + x âᵧ has zero divergence everywhere. It circulates but never piles up." },
        { id: "negative", q: "Can divergence be negative?", a: "Yes: that's a sink. Field lines converge there, as they do onto a negative charge. In electrostatics ∇·D = ρv, so negative divergence means negative charge density." },
        { id: "inside", q: "Why is it ∂(ρDρ)/∂ρ, not ∂Dρ/∂ρ?", tags: ["MISSING_SCALE_FACTORS"], a: "A tiny cylindrical box has a larger outer face than inner face, and each face's area is proportional to ρ. The flux through a face is Dρ times its area, so ρDρ is what changes across the box. Spherical boxes have faces proportional to r², hence r²D_r." },
        { id: "gauss", q: "How is divergence related to Gauss's law?", a: "Gauss's law in point form is ∇·D = ρv: outflow per unit volume equals charge per unit volume. Integrate both sides over a volume, apply the divergence theorem, and you recover ∮D·dS = Q_enc." },
      ],
      checks: [
        {
          id: "type", title: "Check: what kind of answer?", show: ["vs", "eq"], patch: { vs: { field: "tut-3.6a", probe: [1, -2, 3], box: 0, offset: -2 } },
          note: "Five checks on divergence. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "type", type: "choose", prompt: "The divergence of a vector field is…", dimension: "recognition",
            options: [
              choice("scalar", "a scalar", true, "Right: one number at each point."),
              choice("vector", "a vector", false, "Divergence adds the component derivatives into one number.", "GRAD_DIV_TYPE"),
              choice("positive", "always positive", false, "Sinks have negative divergence."),
            ] },
        },
        {
          id: "div-num", title: "Check: a divergence, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "div-num", type: "numeric", prompt: dv.prompt, answer: dv.spec.answer, distractors: dv.spec.distractors, relTol: dv.spec.relTol, hints: dv.hints, template: "div-cart", dimension: "computational" },
          covers: ["hw-2324-2.2"],
        },
        {
          id: "predict-x", title: "Check: move the probe",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-x", type: "predict-drag", prompt: "The probe moves from (1, −2, 3) to (3, −2, 3). Drag ∇·A to your prediction.", target: { instance: "vs", readout: "div" }, range: [0, 20], unit: "", relTol: 0.05, reveal: { vs: { probe: [3, -2, 3] } }, dimension: "conceptual",
            feedback: { close: "Right: ∇·A = 4x = 12.", far: "∇·A = 4x depends only on x: tripling x triples it, to 12." } },
        },
        {
          id: "which", title: "Check: which formula?",
          note: "From HW02 2.2(a).",
          interaction: { id: "which", type: "choose", prompt: "A = xy âₓ + y² âᵧ − xz âz. Its divergence is…", dimension: "application",
            options: [
              choice("right", "3y − x", true, "Right: y + 2y − x, using the cartesian formula."),
              choice("sign", "3y + x", false, "∂(−xz)/∂z = −x."),
              choice("cyl", "found with (1/ρ)∂(ρAρ)/∂ρ + …", false, "That's the cylindrical formula, but A is written in cartesian coordinates.", "OPERATOR_SYSTEM_MISMATCH"),
            ] },
          covers: ["hw-2324-2.2"],
        },
        {
          id: "theorem", title: "Check: the divergence theorem",
          note: "Last one.",
          interaction: { id: "theorem", type: "choose", prompt: "∇·A = 3 everywhere. The net flux out of a cube of side 2 is…", dimension: "application",
            options: [
              choice("24", "24", true, "Right: 3 × the volume, 8."),
              choice("3", "3", false, "3 is per unit volume. Multiply by the volume."),
              choice("12", "12", false, "The volume is 2³ = 8, not 2²."),
            ] },
        },
      ],
      recap: {
        points: [
          "∇·A is a scalar: the net outflow per unit volume.",
          "Cartesian: ∂Aₓ/∂x + ∂Aᵧ/∂y + ∂A_z/∂z.",
          "Curved coordinates: multiply by the scale factor, differentiate, then divide: (1/ρ)∂(ρDρ)/∂ρ and (1/r²)∂(r²D_r)/∂r.",
          "Divergence theorem: ∮A·dS = ∫∇·A dv. With D, it is Gauss's law.",
        ],
        traps: ["Using the wrong system's formula.", "Leaving ρ or r² outside the derivative.", "Writing a divergence as a vector."],
      },
    },
  ],
});
