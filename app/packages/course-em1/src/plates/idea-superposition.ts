import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const Q1 = pt("q1", 2, [0, 0, 0], "Q1 = +2 µC");
const Q2 = pt("q2", -1, [1, 0, 0], "Q2 = −1 µC");
const Q3 = pt("q3", 1, [0, 0, 1], "Q3 = +1 µC");
const mm = 1e-3;

export const ideaSuperposition = defineIdeaPlate({
  id: "idea-superposition",
  title: "Superposition of forces",
  requires: { objectives: [1], items: [], misconceptions: ["SUPERPOSITION_MAGNITUDES"] },
  instances: [
    { id: "q", component: "charges", params: { items: [Q1, Q3] } },
    { id: "fc", component: "coulomb-force", params: { on: "q3" }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\mathbf F_{3}=\mathbf F_{13}+\mathbf F_{23}+\cdots`, speech: "the force on Q3 is the vector sum of the forces from each other charge", shortSpeech: "superposition" } },
  ],
  ideas: [
    {
      id: "superposition",
      title: "Superposition of forces",
      objectives: [1],
      explain: [
        {
          id: "one", title: "One charge at a time", show: ["q", "fc", "eq"], focus: ["q", "fc"],
          note: "With several charges, the force on one of them is found one partner at a time. Start with just Q1 = +2 µC at the origin and Q3 = +1 µC at (0, 0, 1) m. The force on Q3 is straight up, 0.01798 N, pushed away from Q1.",
          claims: [{ instance: "fc", readout: "Fz", value: 0.0179751, unit: "N" }],
        },
        {
          id: "add", title: "Add a second charge: add vectors", patch: { q: { items: [Q1, Q2, Q3] } }, focus: ["q", "fc"],
          note: "Add Q2 = −1 µC at (1, 0, 0) m. On its own it would pull Q3 toward itself with 0.004494 N along (1, 0, −1)/√2, which is +0.003178âₓ − 0.003178âz N. Coulomb forces don't interfere with one another, so the total is simply the vector sum: F3 = 0.003178âₓ + 0.01480âz N, with |F3| = 0.01513 N. Notice that 0.01798 + 0.004494 = 0.02247 is not the answer: magnitudes don't add.",
          claims: [{ instance: "fc", readout: "Fx", value: 0.00317758, unit: "N" }, { instance: "fc", readout: "Fz", value: 0.0147975, unit: "N" }, { instance: "fc", readout: "Fmag", value: 0.0151349, unit: "N" }],
        },
        {
          id: "why", title: "Why superposition works", focus: ["q", "fc"], patch: { eq: { latex: R`\mathbf F_{Q}=\sum_{i}\dfrac{Q\,Q_i}{4\pi\varepsilon_0R_{iQ}^2}\,\mathbf a_{iQ}`, speech: "the force on Q is the sum over every other charge", shortSpeech: "superposition sum" } },
          note: "Electrostatics is linear. The force from Q1 on Q3 is the same whether or not Q2 is present, so each pair can be worked out separately and the results added. The recipe is the same for any number of charges: for each partner, find R (end minus start), the size with its sign, and the unit vector, then add components. For charge spread continuously, the sum becomes an integral, which is the next concept.",
        },
        {
          id: "cancel", title: "Symmetry cancels components", patch: { q: { items: [pt("a", 1, [0, 0, 0], "+1 µC"), pt("b", 1, [2, 0, 0], "+1 µC"), pt("t", -1, [1, 0, 1], "−1 µC")] }, fc: { on: "t" } }, focus: ["q", "fc"],
          note: "Place two equal +1 µC charges at (0, 0, 0) and (2, 0, 0) m, and a −1 µC charge at (1, 0, 1) m, midway above them. Each pulls it with 0.004494 N, one toward the lower left and one toward the lower right. The x-parts cancel exactly and the z-parts add: F = −0.006355âz N. Spot a symmetry like this and you can skip half the arithmetic.",
          claims: [{ instance: "fc", readout: "Fx", value: 0, unit: "N" }, { instance: "fc", readout: "Fz", value: -0.00635516, unit: "N" }],
        },
      ],
      examples: [
        {
          id: "three", level: "basic", title: "Three charges",
          setup: { q: { items: [Q1, Q2, Q3] }, fc: { on: "q3" } },
          problem: "Q1 = +2 µC at the origin, Q2 = −1 µC at (1, 0, 0) m and Q3 = +1 µC at (0, 0, 1) m. Find the force on Q3.",
          lines: [
            { text: "From Q1: R13 = (0, 0, 1) m, and the size is 8.988 × 10⁹ × 2 × 10⁻¹² / 1 = 0.01798 N, so F13 = 0.01798âz N (repulsion).", focus: ["q"] },
            { text: "From Q2: R23 = (−1, 0, 1) m, R = √2 m. Q2Q3 < 0, so the force points back toward Q2: F23 = 0.004494 × (1, 0, −1)/√2 = 0.003178âₓ − 0.003178âz N.", focus: ["q"] },
            { text: "Add: F3 = 0.003178âₓ + 0.01480âz N, with |F3| = 0.01513 N.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 0.00317758, unit: "N" }, { instance: "fc", readout: "Fmag", value: 0.0151349, unit: "N" }] },
          ],
          trap: "Pointing F23 away from Q2. Q2 is negative and Q3 positive, so they attract: the force on Q3 points toward Q2.",
        },
        {
          id: "symmetric", level: "tutorial", title: "Using symmetry",
          setup: { q: { items: [pt("a", 1, [0, 0, 0], "+1 µC"), pt("b", 1, [2, 0, 0], "+1 µC"), pt("t", -1, [1, 0, 1], "−1 µC")] }, fc: { on: "t" } },
          problem: "Two +1 µC charges sit at (0, 0, 0) and (2, 0, 0) m. Find the force on a −1 µC charge at (1, 0, 1) m.",
          lines: [
            { text: "Each partner is √2 m away, so each force has size 8.988 × 10⁹ × 10⁻¹² / 2 = 0.004494 N, pointing toward that partner (attraction).", focus: ["q"] },
            { text: "The x-parts, −0.003178 and +0.003178, cancel by symmetry.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 0, unit: "N" }] },
            { text: "The z-parts add: F = −2 × 0.003178âz = −0.006355âz N.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fz", value: -0.00635516, unit: "N" }] },
          ],
          trap: "Adding the two magnitudes, 0.008988 N, ignores their directions. Only the z-parts survive.",
        },
        {
          id: "mm", level: "exam", title: "Superposition in millimetres",
          setup: { q: { items: [pt("a", 0.01, [0, 0, 0], "Q1 = +10 nC"), pt("b", -0.02, [30 * mm, 0, 0], "Q2 = −20 nC"), pt("c", 0.005, [0, 0, 40 * mm], "Q3 = +5 nC")], drawScale: 30 }, fc: { on: "c", drawScale: 30 } },
          problem: "Q1 = +10 nC at the origin, Q2 = −20 nC at (30, 0, 0) mm and Q3 = +5 nC at (0, 0, 40) mm. Find the force on Q3, in vector form.",
          lines: [
            { text: "From Q1: R = 0.040 m, size 8.988 × 10⁹ × 50 × 10⁻¹⁸ / 0.0016 = 2.809 × 10⁻⁴ N, upward: F13 = 2.809 × 10⁻⁴ âz N.", focus: ["q"], givens: [{ value: 0.04, unit: "m" }] },
            { text: "From Q2: R23 = (−0.030, 0, 0.040) m, R = 0.050 m, size 3.595 × 10⁻⁴ N, pulled toward Q2: F23 = 3.595 × 10⁻⁴ × (0.6, 0, −0.8) = 2.157 × 10⁻⁴ âₓ − 2.876 × 10⁻⁴ âz N.", focus: ["q"], givens: [{ value: 0.05, unit: "m" }] },
            { text: "Add: F3 = 2.157 × 10⁻⁴ âₓ − 6.741 × 10⁻⁶ âz N. The vertical parts almost cancel, leaving a force pointing nearly along +x.", focus: ["fc"], claims: [{ instance: "fc", readout: "Fx", value: 0.000215701, unit: "N" }, { instance: "fc", readout: "Fz", value: -6.74066e-6, unit: "N" }] },
          ],
          trap: "Using the 30 mm or 40 mm gap directly as R for Q2. The distance from Q2 to Q3 is the hypotenuse, 50 mm.",
        },
      ],
      asks: [
        { id: "mags", q: "Why can't I just add the magnitudes?", tags: ["SUPERPOSITION_MAGNITUDES"], a: "Because forces in different directions partly cancel. Magnitudes add only when every force points the same way. Always add components: x with x, y with y, z with z." },
        { id: "order", q: "Does the order I add them in matter?", a: "No. Vector addition is commutative and associative. Add the forces in whatever order keeps your working tidy." },
        { id: "self", q: "Does a charge exert a force on itself?", a: "No. The sum runs over every other charge. On the plate, the force readout for Q3 never includes Q3." },
        { id: "linear", q: "What does 'linear system' mean here?", a: "Doubling any charge doubles its force, and adding a charge adds its force without changing the others. That is exactly what lets you work one pair at a time and then add." },
        { id: "many", q: "What about thousands of charges?", a: "The sum becomes an integral over a charge density ρL, ρS or ρv. The recipe doesn't change: a small piece of charge, its R and unit vector, then add everything up." },
        { id: "check", q: "How can I check a superposition answer?", a: "Look for symmetry: components that should cancel must come out zero. Also check the direction: each force points away from a like charge and toward an unlike one." },
      ],
      checks: [
        {
          id: "add-rule", title: "Check: how forces combine", show: ["q", "fc", "eq"], patch: { q: { items: [Q1, Q2, Q3], drawScale: 1 }, fc: { on: "q3", drawScale: 1 } },
          note: "Four checks on superposition. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "add-rule", type: "choose", prompt: "The net force on a charge from several others is…", dimension: "conceptual",
            options: [
              choice("vec", "the vector sum of the individual forces", true, "Right: add them component by component."),
              choice("mag", "the sum of their magnitudes", false, "Directions matter; forces can cancel.", "SUPERPOSITION_MAGNITUDES"),
              choice("biggest", "the largest single force", false, "Every partner contributes."),
            ] },
        },
        {
          id: "predict-remove", title: "Check: remove Q2",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-remove", type: "predict-drag", prompt: "Q2 is removed. Drag Fₓ on Q3 to your prediction.", target: { instance: "fc", readout: "Fx" }, range: [-0.01, 0.01], unit: "N", relTol: 0.05, reveal: { q: { items: [Q1, Q3] } }, dimension: "conceptual",
            feedback: { close: "Right: zero. Q1 is directly below Q3, so its force has no x-part.", far: "Only Q1 remains, straight below Q3, so Fₓ = 0." } },
        },
        {
          id: "cancel", title: "Check: symmetry",
          note: "Think before you compute.",
          interaction: { id: "cancel", type: "choose", prompt: "Four equal positive charges sit at the corners of a square. The net force on a positive charge at the square's centre is…", dimension: "conceptual",
            options: [
              choice("zero", "zero", true, "Right: opposite corners cancel in pairs."),
              choice("four", "four times one corner's force", false, "Opposite corners push in opposite directions.", "SUPERPOSITION_MAGNITUDES"),
              choice("up", "perpendicular to the square", false, "All four forces lie in the square's plane."),
            ] },
        },
        {
          id: "fz", title: "Check: the z-component",
          note: "Last one: the three-charge example.",
          interaction: { id: "fz", type: "numeric", prompt: "Q1 = +2 µC at the origin, Q2 = −1 µC at (1, 0, 0) m, Q3 = +1 µC at (0, 0, 1) m. Find F_z on Q3.", answer: { value: 0.0148, unit: "N" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0.02115, unit: "N", errorClass: "sign", feedback: "Q2 attracts Q3, so its z-part points down: subtract 0.003178, don't add it." }],
            hints: ["F13 is all z: 0.01798 N.", "F23's z-part is −0.004494/√2 = −0.003178 N.", "Add them."] },
        },
      ],
      recap: {
        points: [
          "The force on one charge is the vector sum of the forces from every other charge.",
          "Work one pair at a time: R (end minus start), the size with its sign, the unit vector.",
          "Add components, never magnitudes.",
          "Symmetry often cancels whole components.",
        ],
        traps: ["Adding magnitudes.", "Pointing an attractive force the wrong way.", "Using a side length where the hypotenuse is the distance."],
      },
    },
  ],
});
