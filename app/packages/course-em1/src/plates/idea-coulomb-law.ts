import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const cm = instantiate(templates.find((t) => t.id === "coulomb-mag")!, 1);
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const BASE = [pt("a", 2, [-0.8, 0, 0], "Q1 = +2 µC"), pt("b", 1, [0.8, 0, 0], "Q2 = +1 µC")];
const EX1 = { items: [pt("a", 300, [1, 2, 3], "Q1 = 3×10⁻⁴ C at M"), pt("b", -100, [2, 0, 5], "Q2 = −1×10⁻⁴ C at N")], oblique: true, drawScale: 0.3 };
const mm = 1e-3;
const MST = { items: [pt("a", 0.025, [2 * mm, 2 * mm, 13 * mm], "q1 = +25.0 nC"), pt("b", -0.042, [10 * mm, 2 * mm, 7 * mm], "q2 = −42.0 nC")], oblique: true, drawScale: 120 };
const nm = 1e-9;
const F2425 = { items: [pt("a", 2.5, [1 * nm, 2 * nm, 3 * nm], "qA = +2.5 µC"), pt("b", -3.8, [0, 2 * nm, 8 * nm], "qB = −3.8 µC")], oblique: true, drawScale: 2e8 };

export const ideaCoulombLaw = defineIdeaPlate({
  id: "idea-coulomb-law",
  title: "Coulomb's law in vector form",
  requires: { objectives: [0], items: ["mst-2324-q1a", "mst-2324-q1b", "f2425-q1b", "hw-2324-2.4", "lecture:lec2b-ex1"], misconceptions: ["FORCE_MAGNITUDE_ONLY", "COULOMB_DIRECTION"] },
  instances: [
    { id: "q", component: "charges", params: { items: BASE } },
    { id: "fc", component: "coulomb-force", params: { on: "b" }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`|\mathbf F|=\dfrac{|Q_1Q_2|}{4\pi\varepsilon_0R^2}`, speech: "the size of F is Q1 Q2 over four pi epsilon nought R squared", shortSpeech: "Coulomb's law" } },
  ],
  ideas: [
    {
      id: "coulomb-law",
      title: "Coulomb's law in vector form",
      objectives: [0],
      explain: [
        {
          id: "law", title: "The law", show: ["q", "fc", "eq"], focus: ["q", "fc"],
          note: "Coulomb's law (1785): two point charges push or pull on each other with a force that grows with each charge and weakens with the square of the gap between them. In free space |F| = |Q1Q2|/(4πε₀R²), with ε₀ = 8.854 × 10⁻¹² F/m, so 1/(4πε₀) is about 8.988 × 10⁹ N·m²/C². On the plate, +2 µC and +1 µC sit 1.6 m apart, and the force on each is 0.007022 N.",
          claims: [{ instance: "fc", readout: "Fmag", value: 0.00702152, unit: "N" }, { instance: "fc", readout: "R", value: 1.6, unit: "m" }],
        },
        {
          id: "vector", title: "The vector form", patch: { eq: { latex: R`\mathbf F_{12}=\dfrac{Q_1Q_2}{4\pi\varepsilon_0R_{12}^2}\,\mathbf a_{12},\qquad \mathbf a_{12}=\dfrac{\mathbf R_{12}}{|\mathbf R_{12}|}`, speech: "F one two equals Q1 Q2 over four pi epsilon nought R squared, times the unit vector a one two", shortSpeech: "Coulomb's law, vector form" } }, focus: ["fc", "eq"],
          note: "A force is a vector, so the full law carries a direction. F12, the force on Q2 due to Q1, points along a12, the unit vector from Q1 to Q2: R12 = r2 − r1, divided by its length. When Q1Q2 is positive (like charges), F12 points along a12, away from Q1. That is repulsion. On the plate, the force on Q2 is +0.007022âₓ N: straight away from Q1.",
          claims: [{ instance: "fc", readout: "Fx", value: 0.00702152, unit: "N" }],
        },
        {
          id: "attract", title: "Opposite signs attract", patch: { q: { items: [BASE[0], pt("b", -1, [0.8, 0, 0], "Q2 = −1 µC")] } }, focus: ["q", "fc"],
          note: "Flip Q2 to −1 µC. Now Q1Q2 is negative, so F12 = (negative number) × a12 points against a12, back toward Q1: attraction. You never decide the direction by eye. The sign of Q1Q2 does it for you, as long as a12 runs from the charge exerting the force to the charge feeling it. On the plate, the force on Q2 is now −0.007022âₓ N.",
          claims: [{ instance: "fc", readout: "Fx", value: -0.00702152, unit: "N" }],
        },
        {
          id: "third-law", title: "Action and reaction", patch: { fc: { on: "a" } }, focus: ["fc"],
          note: "Switch to the force on Q1. It is F21 = −F12: the same size, opposite direction, as Newton's third law demands, even when the charges differ in size. The +2 µC charge pulls on the −1 µC charge exactly as hard as the −1 µC charge pulls on it. On the plate, F21 = +0.007022âₓ N, toward Q2.",
          claims: [{ instance: "fc", readout: "Fx", value: 0.00702152, unit: "N" }],
        },
        {
          id: "inverse-square", title: "Inverse square", patch: { fc: { on: "b" }, q: { items: [BASE[0], pt("b", -1, [1.6, 0, 0], "Q2 = −1 µC")] } }, focus: ["q", "fc"],
          note: "Move Q2 so the separation grows from 1.6 m to 2.4 m, one and a half times as far. The force falls by 1.5², to 0.003121 N. Double the distance and the force drops to a quarter. That steep fall-off is why a charge a few centimetres away can matter more than a much bigger one metres away.",
          claims: [{ instance: "fc", readout: "Fmag", value: 0.00312068, unit: "N" }, { instance: "fc", readout: "R", value: 2.4, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "lec-ex1", level: "basic", title: "Lecture 2b, Example 1",
          setup: { q: EX1, fc: { on: "b", oblique: true, drawScale: 0.3 } },
          problem: "In a vacuum, Q1 = 3 × 10⁻⁴ C sits at M(1, 2, 3) and Q2 = −1 × 10⁻⁴ C at N(2, 0, 5). What force does Q1 put on Q2?",
          lines: [
            { text: "R12 = N − M = âₓ − 2âᵧ + 2âz, so R12 = 3 m and a12 = (âₓ − 2âᵧ + 2âz)/3.", focus: ["q"], claims: [{ instance: "fc", readout: "R", value: 3, unit: "m" }] },
            { text: "Size and sign: Q1Q2/(4πε₀R²) = (3 × 10⁻⁴)(−1 × 10⁻⁴)/(4π × 8.854 × 10⁻¹² × 9) = −29.96 N.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fmag", value: 29.9585, unit: "N" }] },
            { text: "F12 = −29.96 × (âₓ − 2âᵧ + 2âz)/3 = −9.986âₓ + 19.97âᵧ − 19.97âz N: Q2 is pulled back toward Q1.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: -9.98617, unit: "N" }, { instance: "fc", readout: "Fz", value: -19.9723, unit: "N" }] },
          ],
          covers: ["lecture:lec2b-ex1"],
          trap: "Writing |F| = 29.96 N and stopping. The question asks for the force, a vector: give all three components.",
        },
        {
          id: "mst", level: "tutorial", title: "Millimetres and nanocoulombs",
          setup: { q: MST, fc: { on: "b", oblique: true, drawScale: 120 } },
          problem: "In a vacuum, q1 = +25.0 nC is at P1(2, 2, 13) mm and q2 = −42.0 nC is at P2(10, 2, 7) mm. (i) Find R12 and its length in metres. (ii) Calculate F12, the force on q2 due to q1. (iii) State the effect of changing only the sign of q2.",
          lines: [
            { text: "R12 = P2 − P1 = 0.008âₓ − 0.006âz m, of length 0.010 m.", focus: ["q"], claims: [{ instance: "fc", readout: "R", value: 0.01, unit: "m" }] },
            { text: "Q1Q2/(4πε₀R²) = (25 × 10⁻⁹)(−42 × 10⁻⁹)/(4πε₀ × 10⁻⁴) = −0.09437 N; a12 = 0.8âₓ − 0.6âz.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fmag", value: 0.0943693, unit: "N" }] },
            { text: "F12 = −0.07550âₓ + 0.05662âz N: q2 is attracted toward q1.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: -0.0754954, unit: "N" }, { instance: "fc", readout: "Fz", value: 0.0566216, unit: "N" }] },
            { text: "(iii) With q2 positive, the size is unchanged but the direction reverses: +0.07550âₓ − 0.05662âz N, a repulsion.", patch: { q: { items: [MST.items[0], pt("b", 0.042, [10 * mm, 2 * mm, 7 * mm], "q2 = +42.0 nC")] } }, focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 0.0754954, unit: "N" }] },
          ],
          covers: ["mst-2324-q1b"],
          trap: "Squaring the millimetre value as if it were metres makes the force a million times too small. Convert R12 to metres first.",
        },
        {
          id: "finals", level: "exam", title: "Nanometres",
          setup: { q: F2425, fc: { on: "b", oblique: true, drawScale: 2e8 } },
          problem: "qA = +2.5 µC and qB = −3.8 µC are fixed at A(1, 2, 3) nm and B(0, 2, 8) nm. Calculate F_AB, the force qA exerts on qB.",
          lines: [
            { text: "R_AB = B − A = (−1, 0, 5) nm, of length √26 nm = 5.099 × 10⁻⁹ m.", focus: ["q"], givens: [{ value: Math.sqrt(26) * 1e-9, unit: "m" }] },
            { text: "qAqB/(4πε₀R²) = (2.5 × 10⁻⁶)(−3.8 × 10⁻⁶)/(4πε₀ × 26 × 10⁻¹⁸) = −3.284 × 10¹⁵ N.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fmag", value: 3.28391e15, unit: "N" }] },
            { text: "a_AB = (−1, 0, 5)/√26, so F_AB = 6.440 × 10¹⁴ âₓ − 3.220 × 10¹⁵ âz N: huge, because the charges are only nanometres apart.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 6.44028e14, unit: "N" }, { instance: "fc", readout: "Fz", value: -3.22014e15, unit: "N" }] },
          ],
          covers: ["f2425-q1b"],
          trap: "Using R² = 26 instead of 26 × 10⁻¹⁸ m² gives a force 10¹⁸ times too small. The nm must become 10⁻⁹ m before squaring.",
        },
      ],
      asks: [
        { id: "k", q: "Should I use k = 9 × 10⁹ or 1/(4πε₀)?", a: "Use whatever the paper gives. Many papers print ε₀ = 8.854 × 10⁻¹², which gives 1/(4πε₀) = 8.988 × 10⁹; others allow k ≈ 9.00 × 10⁹. The difference is about 0.1%, so match the paper's constant and keep four significant figures." },
        { id: "which", q: "Is F12 the force on 1 or on 2?", tags: ["COULOMB_DIRECTION"], a: "On 2, due to 1. Read the subscripts as 'from 1 to 2'. R12 = r2 − r1, and F12 acts on Q2. Swap both and you get F21, the force on Q1: the same size, opposite direction." },
        { id: "vector-marks", q: "Why do I lose marks for giving |F|?", tags: ["FORCE_MAGNITUDE_ONLY"], a: "Because 'find the force' asks for a vector. A magnitude alone says nothing about direction, which is half the physics. Give F = Fₓâₓ + Fᵧâᵧ + F_zâz, and add |F| if you like." },
        { id: "point", q: "What makes a charge a point charge?", a: "Its size is tiny compared with the distances involved, so all of it sits effectively at one point. The question's phrase 'infinitely small, isolated charges' is telling you exactly that." },
        { id: "gravity", q: "How strong is the electric force compared with gravity?", a: "Enormously stronger. Between a proton and an electron it is about 2 × 10³⁹ times their gravitational pull. Gravity wins in daily life only because matter is almost perfectly neutral." },
        { id: "square", q: "Why an inverse square?", a: "The influence of a charge spreads over spheres, whose area grows as 4πR². The same total spread over more area gets weaker as 1/R². Gauss's law, which you have met, is the same statement." },
        { id: "units", q: "What units come out?", a: "Coulombs times coulombs, divided by (F/m × m²), gives newtons. If your answer isn't in N, a unit went in wrong, usually a distance left in mm, cm or nm." },
      ],
      checks: [
        {
          id: "state", title: "Check: state the law", show: ["q", "fc", "eq"], patch: { q: { items: BASE, oblique: false, drawScale: 1 }, fc: { on: "b", oblique: false, drawScale: 1 } },
          note: "Five checks on Coulomb's law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "state", type: "choose", prompt: "The vector form of Coulomb's law for the force on Q2 due to Q1 is…", dimension: "recognition",
            options: [
              choice("right", "F12 = Q1Q2 / (4πε₀R12²) · a12, with a12 from Q1 to Q2", true, "Right: the size and the direction together."),
              choice("mag", "|F| = Q1Q2 / (4πε₀R²)", false, "That is only the size. The vector form needs a12.", "FORCE_MAGNITUDE_ONLY"),
              choice("flip", "F12 = Q1Q2 / (4πε₀R12²) · a21", false, "a21 points from Q2 to Q1, the wrong way for the force on Q2.", "COULOMB_DIRECTION"),
            ] },
          covers: ["mst-2324-q1a"],
        },
        {
          id: "predict-double", title: "Check: double the distance",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-double", type: "predict-drag", prompt: "Q2 moves so the separation doubles, from 1.6 m to 3.2 m. Drag |F| to your prediction.", target: { instance: "fc", readout: "Fmag" }, range: [0, 0.01], unit: "N", relTol: 0.05, reveal: { q: { items: [BASE[0], pt("b", 1, [2.4, 0, 0], "Q2 = +1 µC")] } }, dimension: "conceptual",
            feedback: { close: "Right: a quarter, 0.001755 N.", far: "Inverse square: double R and |F| falls to a quarter, 0.001755 N." } },
        },
        {
          id: "mag-num", title: "Check: a force, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "mag-num", type: "numeric", prompt: cm.prompt, answer: cm.spec.answer, distractors: cm.spec.distractors, relTol: cm.spec.relTol, hints: cm.hints, template: "coulomb-mag", dimension: "computational" },
        },
        {
          id: "hw24a", title: "Check: Fx between two charges",
          note: "A classic exercise. Give the x-component.",
          interaction: { id: "hw24a", type: "numeric", prompt: "Q1 = 5 µC and Q2 = −4 µC are at (2, 1, 3) cm and (−4, 0, 6) cm. Find the x-component of the force on Q1.", answer: { value: -34.57, unit: "N" }, relTol: 0.01, dimension: "application",
            distractors: [
              { value: 34.57, unit: "N", errorClass: "sign", feedback: "The charges attract, so Q1 is pulled toward Q2, which lies at negative x relative to it." },
              { value: -0.003457, unit: "N", errorClass: "unit", feedback: "That keeps R in centimetres. Convert to metres before squaring." },
            ],
            hints: ["The force on Q1 is along R21 = r1 − r2 = (6, 1, −3) cm.", "|R21| = √46 cm = 0.06782 m.", "F = Q1Q2/(4πε₀R²) a21; its size is 39.08 N."] },
          covers: ["hw-2324-2.4"],
        },
        {
          id: "flip", title: "Check: flip a sign",
          note: "Last one.",
          interaction: { id: "flip", type: "choose", prompt: "Changing only q2 from −42.0 nC to +42.0 nC makes F12…", dimension: "conceptual",
            options: [
              choice("rev", "the same size, pointing the opposite way", true, "Right: the sign of Q1Q2 flips, so the direction reverses."),
              choice("zero", "zero", false, "Both charges are still there; only the sign changed."),
              choice("same", "exactly the same", false, "The product Q1Q2 changed sign, and that flips F12.", "COULOMB_DIRECTION"),
            ] },
          covers: ["mst-2324-q1b"],
        },
      ],
      recap: {
        points: [
          "F12 = Q1Q2/(4πε₀R12²) a12, with R12 = r2 − r1 running from the source to the charge feeling the force.",
          "The sign of Q1Q2 sets the direction: positive repels, negative attracts.",
          "F21 = −F12 (Newton's third law).",
          "Inverse square: double R and the force falls to a quarter.",
          "Convert mm, cm and nm to metres, and nC and µC to coulombs, before substituting; give the vector.",
        ],
        traps: ["Giving |F| alone.", "Using R12 the wrong way round.", "Squaring a distance still in mm or nm."],
      },
    },
  ],
});
