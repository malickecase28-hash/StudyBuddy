import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const ang = instantiate(templates.find((t) => t.id === "vec-angle")!, 1);
const v3 = (to: number[], label: string, tone: string, drawScale: number) => ({ component: "vector3", params: { from: [0, 0, 0], to, label, tone, drawScale } });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaVecProducts = defineIdeaPlate({
  id: "idea-vec-products",
  title: "Dot and cross products, angles and projections",
  requires: { objectives: [2], items: ["tutorial:tut-1.4", "tutorial:tut-1.5"], misconceptions: ["DOT_CROSS_CONFUSION"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 2 } },
    { id: "a", ...v3([1, 0, 3], "A", "field", 0.3) },
    { id: "b", ...v3([5, 2, -6], "B", "flux", 0.3) },
    { id: "e", ...v3([0, 3, 4], "E", "field", 0.2) },
    { id: "f", ...v3([4, -10, 5], "F", "flux", 0.2) },
    { id: "n", ...v3([55, 16, -12], "E × F (drawn ÷50)", "surface", 0.02) },
    { id: "eq", component: "equation", params: eqp(R`\mathbf A\cdot\mathbf B=A_xB_x+A_yB_y+A_zB_z=|\mathbf A||\mathbf B|\cos\theta`, "A dot B") },
  ],
  ideas: [
    {
      id: "vec-products",
      title: "Dot and cross products, angles and projections",
      objectives: [2],
      explain: [
        {
          id: "dot", title: "The dot product: how much lies along", show: ["axes", "a", "b", "eq"], focus: ["a", "b"],
          note: "The dot product multiplies two vectors and returns a scalar: A·B = AₓBₓ + AᵧBᵧ + A_zB_z = |A||B| cos θ. For A = âₓ + 3âz and B = 5âₓ + 2âᵧ − 6âz, A·B = 5 + 0 − 18 = −13. It measures how much of one vector lies along the other. It is positive when they point roughly together, zero when they are perpendicular, and negative when they point roughly apart, as here.",
        },
        {
          id: "angle", title: "Finding the angle", patch: { eq: eqp(R`\cos\theta=\dfrac{\mathbf A\cdot\mathbf B}{|\mathbf A||\mathbf B|}`, "cos theta equals A dot B over the magnitudes") }, focus: ["a", "b", "eq"],
          note: "Rearranged, the dot product gives the angle between two vectors: cos θ = A·B / (|A||B|) = −13 / (3.162 × 8.062) = −0.5099, so θ = 120.66°. The angle always lies between 0° and 180°: the dot product can't tell left from right, only how aligned two vectors are. This is Tutorial 1.4, and it is how flux picks out the angle between D and a surface normal.",
          claims: [{ instance: "a", readout: "vmag", value: 3.16228, unit: "" }, { instance: "b", readout: "vmag", value: 8.06226, unit: "" }],
        },
        {
          id: "projection", title: "Projection: the component along another vector", hide: ["a", "b"], show: ["e", "f"], patch: { eq: eqp(R`\text{comp}_{\mathbf F}\mathbf E=\dfrac{\mathbf E\cdot\mathbf F}{|\mathbf F|},\quad \text{proj}_{\mathbf F}\mathbf E=\dfrac{\mathbf E\cdot\mathbf F}{|\mathbf F|^2}\mathbf F`, "the component and projection of E along F") }, focus: ["e", "f"],
          note: "The scalar component of E along F is E·F/|F|: how far E reaches in F's direction. With E = 3âᵧ + 4âz and F = 4âₓ − 10âᵧ + 5âz, E·F = 0 − 30 + 20 = −10 and |F| = 11.87, so the scalar component is −0.8422. The vector component multiplies that by F's unit vector: (E·F/|F|²)F = −0.2837âₓ + 0.7092âᵧ − 0.3546âz. The minus sign means E leans against F.",
          claims: [{ instance: "f", readout: "vmag", value: 11.8743, unit: "" }, { instance: "e", readout: "vmag", value: 5, unit: "" }],
        },
        {
          id: "cross", title: "The cross product: a perpendicular vector", show: ["n"], patch: { eq: eqp(R`\mathbf E\times\mathbf F=\begin{vmatrix}\mathbf a_x&\mathbf a_y&\mathbf a_z\\E_x&E_y&E_z\\F_x&F_y&F_z\end{vmatrix}`, "E cross F as a determinant") }, focus: ["n", "e", "f"],
          note: "The cross product returns a vector perpendicular to both inputs, with length |E||F| sin θ, the area of the parallelogram they span. Expand the determinant: E × F = (3·5 − 4·(−10))âₓ − (0·5 − 4·4)âᵧ + (0·(−10) − 3·4)âz = 55âₓ + 16âᵧ − 12âz. Its direction follows the right-hand rule: curl your fingers from E to F and your thumb points along E × F. Order matters: F × E = −(E × F).",
          claims: [{ instance: "n", readout: "vmag", value: 58.5235, unit: "" }],
        },
      ],
      examples: [
        {
          id: "angle", level: "basic", title: "Tutorial 1.4: θ between A and B",
          show: ["a", "b"], hide: ["e", "f", "n"], setup: {},
          problem: "If A = âₓ + 3âz and B = 5âₓ + 2âᵧ − 6âz, find θ_AB.",
          lines: [
            { text: "A·B = (1)(5) + (0)(2) + (3)(−6) = −13.", focus: ["a", "b"] },
            { text: "|A| = √10 = 3.162 and |B| = √65 = 8.062.", focus: ["a", "b"], claims: [{ instance: "a", readout: "vmag", value: 3.16228, unit: "" }, { instance: "b", readout: "vmag", value: 8.06226, unit: "" }] },
            { text: "cos θ = −13 / (3.162 × 8.062) = −0.5099, so θ = 120.66°.", latex: R`\theta=\cos^{-1}(-0.5099)=120.66^\circ`, focus: ["a", "b"] },
          ],
          covers: ["tutorial:tut-1.4"],
          trap: "Taking cos⁻¹ of +0.5099 because angles feel positive gives 59.34°. Keep the sign: a negative dot product means an obtuse angle.",
        },
        {
          id: "component", level: "tutorial", title: "Tutorial 1.5(a): the component of E along F",
          show: ["e", "f"], hide: ["a", "b", "n"], setup: {},
          problem: "Let E = 3âᵧ + 4âz and F = 4âₓ − 10âᵧ + 5âz. Find the component of E along F.",
          lines: [
            { text: "E·F = (0)(4) + (3)(−10) + (4)(5) = −10.", focus: ["e", "f"] },
            { text: "|F|² = 16 + 100 + 25 = 141.", focus: ["f"], claims: [{ instance: "f", readout: "vmag", value: 11.8743, unit: "" }] },
            { text: "The vector component is (E·F/|F|²)F = (−10/141)(4âₓ − 10âᵧ + 5âz) = −0.2837âₓ + 0.7092âᵧ − 0.3546âz.", focus: ["e", "f"] },
          ],
          covers: ["tutorial:tut-1.5"],
          trap: "Dividing by |F| instead of |F|² gives a vector 11.87 times too long. Scalar component: ÷ |F|. Vector component: ÷ |F|², then × F.",
        },
        {
          id: "perp", level: "exam", title: "Tutorial 1.5(b): a unit vector perpendicular to both",
          show: ["e", "f", "n"], hide: ["a", "b"], setup: {},
          problem: "Determine a unit vector perpendicular to both E and F.",
          lines: [
            { text: "E × F is perpendicular to both: E × F = 55âₓ + 16âᵧ − 12âz.", focus: ["n"], claims: [{ instance: "n", readout: "vx", value: 55, unit: "" }] },
            { text: "|E × F| = √(3025 + 256 + 144) = √3425 = 58.52.", focus: ["n"], claims: [{ instance: "n", readout: "vmag", value: 58.5235, unit: "" }] },
            { text: "The unit vector is ±(55âₓ + 16âᵧ − 12âz)/58.52 = ±(0.9398âₓ + 0.2734âᵧ − 0.2050âz). Both signs are perpendicular.", focus: ["n"] },
          ],
          covers: ["tutorial:tut-1.5"],
          trap: "Reaching for the dot product: E·F = −10 is a number, not a direction. Perpendicular to two vectors always means the cross product.",
        },
      ],
      asks: [
        { id: "dot-vs-cross", q: "When do I use the dot product, and when the cross product?", tags: ["DOT_CROSS_CONFUSION"], a: "Use the dot product when you need a number: an angle, a projection, work, or flux (D·dS). Use the cross product when you need a direction perpendicular to two others: a surface normal, a torque, or the magnetic force qv × B." },
        { id: "zero-dot", q: "What does A·B = 0 mean?", a: "The vectors are perpendicular, or one of them is zero. It is the fastest test for perpendicularity: multiply matching components and add." },
        { id: "order-cross", q: "Does the order matter in a cross product?", a: "Yes. B × A = −(A × B): the same length, pointing the opposite way. The dot product ignores order: A·B = B·A." },
        { id: "unit-dots", q: "What are âₓ·âₓ and âₓ·âᵧ?", a: "âₓ·âₓ = 1 and âₓ·âᵧ = 0. The axis unit vectors have length one and are mutually perpendicular. That is exactly why A·B = AₓBₓ + AᵧBᵧ + A_zB_z: all the cross terms vanish." },
        { id: "unit-cross", q: "What are âₓ × âᵧ and âᵧ × âₓ?", a: "âₓ × âᵧ = âz, following the cycle x → y → z → x. Going against the cycle flips the sign: âᵧ × âₓ = −âz. Any unit vector crossed with itself gives zero." },
        { id: "range", q: "Why is the angle never more than 180°?", a: "The angle between two vectors is measured the short way round, from 0° to 180°. cos θ covers exactly that range once, so cos⁻¹ gives a single answer." },
        { id: "triple", q: "What is the scalar triple product?", a: "A·(B × C): the volume of the box the three vectors span. It is zero when the three lie in one plane. It appears in the lecture slides; in this course it is mostly a check." },
      ],
      checks: [
        {
          id: "which", title: "Check: which product?", show: ["a", "b"], hide: ["e", "f", "n"],
          note: "Five checks on products. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "which", type: "choose", prompt: "Which gives a vector perpendicular to both A and B?", dimension: "conceptual",
            options: [
              choice("cross", "A × B", true, "Right: the cross product is perpendicular to both."),
              choice("dot", "A·B", false, "A·B is a number, not a vector.", "DOT_CROSS_CONFUSION"),
              choice("sum", "A + B", false, "A + B lies in the same plane as A and B."),
            ] },
        },
        {
          id: "predict-cross", title: "Check: double F", show: ["e", "f", "n"], hide: ["a", "b"],
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-cross", type: "predict-drag", prompt: "F doubles to 8âₓ − 20âᵧ + 10âz. Drag |E × F| to your prediction.", target: { instance: "n", readout: "vmag" }, range: [0, 150], unit: "", relTol: 0.05, reveal: { f: { to: [8, -20, 10] }, n: { to: [110, 32, -24] } }, dimension: "conceptual",
            feedback: { close: "Right: doubling one factor doubles the cross product, 117.0.", far: "|E × F| = |E||F| sin θ: double |F| and the result doubles, to 117.0." } },
        },
        {
          id: "angle-num", title: "Check: an angle, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "angle-num", type: "numeric", prompt: ang.prompt, answer: ang.spec.answer, distractors: ang.spec.distractors, relTol: ang.spec.relTol, hints: ang.hints, template: "vec-angle", dimension: "computational" },
          covers: ["tutorial:tut-1.4"],
        },
        {
          id: "cycle", title: "Check: the cycle",
          note: "Unit vectors.",
          interaction: { id: "cycle", type: "choose", prompt: "âᵧ × âₓ equals…", dimension: "recognition",
            options: [
              choice("neg", "−âz", true, "Right: against the x → y → z cycle, so negative."),
              choice("pos", "âz", false, "That is âₓ × âᵧ. The order is reversed here.", "DOT_CROSS_CONFUSION"),
              choice("zero", "0", false, "Only a unit vector crossed with itself gives zero."),
            ] },
        },
        {
          id: "comp-num", title: "Check: a scalar component",
          note: "Last one: Tutorial 1.5's numbers.",
          interaction: { id: "comp-num", type: "numeric", prompt: "For E = 3âᵧ + 4âz and F = 4âₓ − 10âᵧ + 5âz, find the scalar component of E along F.", answer: { value: -0.8422, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: -0.07092, unit: "", errorClass: "conceptual", feedback: "That divides by |F|². The scalar component divides by |F| once." }],
            hints: ["E·F first.", "Then divide by |F| = √141.", "−10 ÷ 11.87."] },
          covers: ["tutorial:tut-1.5"],
        },
      ],
      recap: {
        points: [
          "A·B = AₓBₓ + AᵧBᵧ + A_zB_z = |A||B| cos θ, a scalar.",
          "cos θ = A·B / (|A||B|); keep the sign.",
          "Scalar component: E·F/|F|. Vector component: (E·F/|F|²)F.",
          "A × B is perpendicular to both, with length |A||B| sin θ; use the determinant and the right-hand rule; B × A = −A × B.",
        ],
        traps: ["Dropping the sign of cos θ.", "Dividing by |F| where |F|² is needed.", "Using the dot product when a perpendicular vector is asked for."],
      },
    },
  ],
});
