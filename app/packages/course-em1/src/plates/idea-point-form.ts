import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const rv = instantiate(templates.find((t) => t.id === "rhov-from-d")!, 1);
const EPS0 = 8.8541878128e-12;
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaPointForm = defineIdeaPlate({
  id: "idea-point-form",
  title: "∇·D = ρv, point by point",
  requires: { objectives: [0], items: ["hw-2324-2.6", "f2324-q2b"], misconceptions: ["POINT_FORM_EPS"] },
  instances: [
    { id: "vs", component: "vector-slice", params: { field: "hw-2.6", plane: "xy", probe: [1, 2, 0.5], offset: 0.5, box: 0.3 } },
    { id: "eq", component: "equation", params: eqp(R`\nabla\cdot\mathbf D=\rho_v`, "divergence of D equals rho v") },
  ],
  ideas: [
    {
      id: "point-form",
      title: "∇·D = ρv, point by point",
      objectives: [0],
      explain: [
        {
          id: "statement", title: "Gauss's law, one point at a time", show: ["vs", "eq"], focus: ["vs", "eq"],
          note: "Gauss's law in integral form says the flux out of a closed surface equals the charge inside. Shrink the surface to a tiny box around a point: the flux out per unit volume is the divergence, and the charge per unit volume is the density. So, point by point, ∇·D = ρv. Where D spreads out, there is positive charge; where it converges, negative charge; where the divergence is zero, there is no charge at all.",
        },
        {
          id: "hw26", title: "Reading ρv from a field (HW02 2.6)", focus: ["vs"],
          note: "HW02 2.6 gives D = 3xy âₓ + x² âᵧ C/m². Its divergence is ∂(3xy)/∂x + ∂(x²)/∂y = 3y + 0, so ρv = 3y C/m³. The charge density grows with y and has nothing to do with x. At the probe, (1, 2, 0.5), ρv = 6, and the plate's box, flux ÷ volume, agrees.",
          claims: [{ instance: "vs", readout: "div", value: 6, unit: "" }, { instance: "vs", readout: "boxRatio", value: 6, unit: "" }],
        },
        {
          id: "from-e", title: "Given E, not D: multiply by ε₀", patch: { vs: { field: "f2324-2b", plane: "xz", probe: [2, 0, 0], offset: 0, box: 0 }, eq: eqp(R`\rho_v=\nabla\cdot\mathbf D=\varepsilon_0\,\nabla\cdot\mathbf E`, "rho v equals epsilon nought times divergence of E") }, focus: ["vs", "eq"],
          note: "Finals 2023-24 Q2(b) gives E, not D. In a vacuum D = ε₀E, so ρv = ε₀∇·E. For E = πr² âr inside r = 3 m, the spherical divergence is (1/r²)∂(r² · πr²)/∂r = 4πr. At r = 2 m that is 8π, and ρv = 8πε₀ = 2.225 × 10⁻¹⁰ C/m³. Forget the ε₀ and the density comes out about ten billion times too large.",
          givens: [{ value: 3, unit: "m" }],
          claims: [{ instance: "vs", readout: "div", value: 25.1327, unit: "" }],
        },
        {
          id: "outside", title: "A negative density outside", patch: { vs: { probe: [5, 0, 0], offset: 0 } }, focus: ["vs"],
          note: "Outside, E = 6π/r³ âr. Then r²E = 6π/r, its derivative is −6π/r², and dividing by r² gives ∇·E = −6π/r⁴. At r = 5 m that is −0.03016, so ρv = −2.670 × 10⁻¹³ C/m³: a small negative density. That is what the given field implies, so state it with its sign. The paper tests whether you can carry the calculation, not whether the field is physical.",
          claims: [{ instance: "vs", readout: "div", value: -0.0301593, unit: "" }],
        },
      ],
      examples: [
        {
          id: "hw26a", level: "basic", title: "HW02 2.6(a): ρv from D",
          setup: { vs: { field: "hw-2.6", plane: "xy", probe: [1, 2, 0.5], offset: 0.5, box: 0.3 } },
          problem: "Given D = 3xy âₓ + x² âᵧ C/m², calculate the volume charge density ρv.",
          lines: [
            { text: "∂(3xy)/∂x = 3y; ∂(x²)/∂y = 0; there is no z-part.", focus: ["vs"] },
            { text: "ρv = ∇·D = 3y C/m³, which is 6 at y = 2. The plate's box flux ÷ volume agrees.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 6, unit: "" }, { instance: "vs", readout: "boxRatio", value: 6, unit: "" }] },
          ],
          covers: ["hw-2324-2.6"],
          trap: "Differentiating x² with respect to x (giving 2x) when it's the y-component: ∂D_y/∂y is what's needed.",
        },
        {
          id: "f2324-in", level: "tutorial", title: "Finals 2023-24 Q2(b)(ii): inside, at r = 2 m",
          setup: { vs: { field: "f2324-2b", plane: "xz", probe: [2, 0, 0], offset: 0, box: 0 } },
          problem: "In a vacuum, E = πr² âr N/C for 0 < r ≤ 3 m. Compute ρv at r = 2 m.",
          givens: [{ value: 3, unit: "m" }],
          lines: [
            { text: "Spherical divergence of a radial field: (1/r²)∂(r²E_r)/∂r = (1/r²)∂(πr⁴)/∂r = 4πr.", focus: ["vs"] },
            { text: "At r = 2 m: ∇·E = 8π = 25.13.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 25.1327, unit: "" }] },
            { text: "ρv = ε₀∇·E = 8.854 × 10⁻¹² × 25.13 = 2.225 × 10⁻¹⁰ C/m³.", focus: ["vs"] },
          ],
          covers: ["f2324-q2b"],
          trap: "Using the cartesian ∂E/∂r without the (1/r²)∂(r² …) structure gives 2πr = 12.57, half the right value.",
        },
        {
          id: "f2324-out", level: "exam", title: "Finals 2023-24 Q2(b)(iii): outside, at r = 5 m",
          setup: { vs: { field: "f2324-2b", plane: "xz", probe: [5, 0, 0], offset: 0, box: 0 } },
          problem: "For r > 3 m, E = (6π/r³) âr N/C. State Gauss's law, then compute ρv at r = 5 m.",
          givens: [{ value: 3, unit: "m" }],
          lines: [
            { text: "Gauss's law: the net outward flux of D through any closed surface equals the charge enclosed; in point form, ∇·D = ρv.", focus: ["eq"] },
            { text: "r²E_r = 6π/r, so ∂(r²E_r)/∂r = −6π/r², and ∇·E = −6π/r⁴ = −0.03016 at r = 5 m.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: -0.0301593, unit: "" }] },
            { text: "ρv = ε₀∇·E = −2.670 × 10⁻¹³ C/m³.", focus: ["vs"] },
          ],
          covers: ["f2324-q2b"],
          trap: "Reporting zero because a 1/r³ field 'looks' like it has no charge outside. Only 1/r² radial fields are charge-free; compute rather than guess.",
        },
      ],
      asks: [
        { id: "eps", q: "Why multiply by ε₀ when I'm given E?", tags: ["POINT_FORM_EPS"], a: "Gauss's law is about D, which depends only on free charge. In a vacuum D = ε₀E, so ∇·D = ε₀∇·E. If the question gives D, don't multiply." },
        { id: "zero", q: "Where is ρv zero for a point charge?", a: "Everywhere except at the charge itself. A 1/r² radial field has r²E constant, so its divergence is zero away from the origin. All the charge sits at the point." },
        { id: "units", q: "What units does ρv come out in?", a: "D in C/m² differentiated with respect to metres gives C/m³. With E in N/C, multiply by ε₀ (F/m) and you get C/m³ too." },
        { id: "system", q: "Which divergence formula do I use?", a: "The one matching how the field is written. A field given in r and âr needs the spherical formula; mixing systems is the most common error here." },
        { id: "integral", q: "How is this different from the integral form?", a: "The integral form relates totals: flux through a surface and charge in a volume. The point form relates local values: divergence and density at a point. The divergence theorem connects them." },
        { id: "both", q: "Can I check ρv another way?", a: "Yes: pick a small Gaussian surface, compute the flux, and divide by its volume. The plate's box does exactly that." },
      ],
      checks: [
        {
          id: "eps-check", title: "Check: given E", show: ["vs", "eq"], patch: { vs: { field: "hw-2.6", plane: "xy", probe: [1, 2, 0.5], offset: 0.5, box: 0.3 } },
          note: "Four checks on the point form. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "eps-check", type: "choose", prompt: "A question gives E in a vacuum. The charge density is…", dimension: "recognition",
            options: [
              choice("right", "ε₀ ∇·E", true, "Right: D = ε₀E in a vacuum."),
              choice("bare", "∇·E", false, "That gives ρv/ε₀. Multiply by ε₀.", "POINT_FORM_EPS"),
              choice("over", "∇·E / ε₀", false, "D = ε₀E: multiply, don't divide."),
            ] },
        },
        {
          id: "predict-y", title: "Check: move up in y",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-y", type: "predict-drag", prompt: "The probe moves from (1, 2, 0.5) to (3, 2, 0.5). Drag ∇·D to your prediction.", target: { instance: "vs", readout: "div" }, range: [0, 15], unit: "", relTol: 0.05, reveal: { vs: { probe: [3, 2, 0.5] } }, dimension: "conceptual",
            feedback: { close: "Right: unchanged, 6. ρv = 3y doesn't depend on x.", far: "ρv = 3y depends only on y, so moving in x changes nothing: still 6." } },
        },
        {
          id: "rv-num", title: "Check: ρv, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "rv-num", type: "numeric", prompt: rv.prompt, answer: rv.spec.answer, distractors: rv.spec.distractors, relTol: rv.spec.relTol, hints: rv.hints, template: "rhov-from-d", dimension: "computational" },
          covers: ["hw-2324-2.6"],
        },
        {
          id: "f2324-num", title: "Check: Finals 2023-24 Q2(b)(ii)",
          note: "Last one.",
          interaction: { id: "f2324-num", type: "numeric", prompt: "In a vacuum, E = πr² âr N/C for r ≤ 3 m. Find ρv at r = 2 m, in C/m³.", answer: { value: 8 * Math.PI * EPS0, unit: "C/m^3" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 8 * Math.PI, unit: "C/m^3", errorClass: "conceptual", tag: "POINT_FORM_EPS", feedback: "That's ∇·E. Multiply by ε₀ for the charge density." }],
            hints: ["∇·E = (1/r²)∂(r² · πr²)/∂r.", "That's 4πr: 8π at r = 2.", "Multiply by ε₀ = 8.854 × 10⁻¹²."] },
          covers: ["f2324-q2b"],
        },
      ],
      recap: {
        points: [
          "Point form: ∇·D = ρv, Gauss's law per unit volume.",
          "Given E in a vacuum: ρv = ε₀∇·E.",
          "Radial fields: ∇·E = (1/r²)∂(r²E_r)/∂r.",
          "A negative result means negative charge density; report it with its sign.",
        ],
        traps: ["Forgetting ε₀.", "The cartesian derivative on a radial field.", "Differentiating a component along the wrong axis."],
      },
    },
  ],
});
