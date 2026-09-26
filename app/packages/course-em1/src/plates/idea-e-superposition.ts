import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const DIPOLE = [pt("p", 0.004, [-1, 0, 0], "+4 nC"), pt("n", -0.004, [1, 0, 0], "−4 nC")];
const SQUARE = { items: [pt("a", 0.003, [1, 1, 0], "3 nC"), pt("b", 0.003, [-1, 1, 0], "3 nC"), pt("c", 0.003, [-1, -1, 0], "3 nC"), pt("d", 0.003, [1, -1, 0], "3 nC")], oblique: true, drawScale: 0.9 };
const u = 1e-6;
const MST = { items: [pt("a", 0.5, [4 * u, -3 * u, 7 * u], "QA = +0.5 µC"), pt("b", -0.3, [2 * u, -3 * u, 1 * u], "QB = −0.3 µC")], oblique: true, drawScale: 2e5 };

export const ideaESuperposition = defineIdeaPlate({
  id: "idea-e-superposition",
  title: "Superposing fields",
  requires: { objectives: [1], items: ["mst-2324-q2b", "text:hayt-four-charges"], misconceptions: [] },
  instances: [
    { id: "q", component: "charges", params: { items: DIPOLE } },
    { id: "ep", component: "e-probe", params: { point: [0, 0, 1] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\mathbf E(\mathbf r)=\sum_i\dfrac{Q_i}{4\pi\varepsilon_0|\mathbf r-\mathbf r_i|^3}(\mathbf r-\mathbf r_i)`, speech: "E at r is the sum over charges of Q i over four pi epsilon nought times r minus r i over its length cubed", shortSpeech: "superposed field" } },
  ],
  ideas: [
    {
      id: "e-superposition",
      title: "Superposing fields",
      objectives: [1],
      explain: [
        {
          id: "sum", title: "Fields add as vectors", show: ["q", "ep", "eq"], focus: ["q", "ep"],
          note: "Fields obey superposition just as forces do: the field at a point is the vector sum of the fields of every charge. A convenient form avoids separate unit vectors: each term is Qᵢ(r − rᵢ)/(4πε₀|r − rᵢ|³), where the cube in the denominator absorbs the unit vector. On the plate, +4 nC at (−1, 0, 0) and −4 nC at (1, 0, 0) make a field at (0, 0, 1) m of 25.42âₓ V/m.",
          claims: [{ instance: "ep", readout: "Ex", value: 25.4206, unit: "V/m" }, { instance: "ep", readout: "Ez", value: 0, unit: "V/m" }],
        },
        {
          id: "dipole", title: "Why the z-parts cancel", focus: ["q", "ep"], patch: { ep: { point: [0, 0, 1.5] } },
          note: "Each charge alone gives a field of the same size at the probe, since both are the same distance away. The positive charge's field points away from it (up and to the right); the negative charge's field points toward it (down and to the right). Their vertical parts cancel and their horizontal parts add. Move the probe higher and the field weakens, but it still points along +x, parallel to the line from + to −.",
          claims: [{ instance: "ep", readout: "Ez", value: 0, unit: "V/m" }],
        },
        {
          id: "square", title: "Four charges: symmetry again", patch: { q: SQUARE, ep: { point: [1, 1, 1], oblique: true, drawScale: 0.9 } }, focus: ["q", "ep"],
          note: "Four identical 3 nC charges sit at (±1, ±1, 0) m. At P(1, 1, 1) the field is 6.820âₓ + 6.820âᵧ + 32.78âz V/m. The x and y parts match because P sits on the diagonal x = y, so the square looks the same from both directions. The big z-part comes mostly from the charge at (1, 1, 0), just 1 m below P.",
          claims: [{ instance: "ep", readout: "Ex", value: 6.82046, unit: "V/m" }, { instance: "ep", readout: "Ez", value: 32.7845, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "dipole", level: "basic", title: "Two opposite charges",
          setup: { q: { items: DIPOLE, oblique: false, drawScale: 1 }, ep: { point: [0, 0, 1], oblique: false, drawScale: 1 } },
          problem: "+4 nC sits at (−1, 0, 0) m and −4 nC at (1, 0, 0) m. Find E at (0, 0, 1) m.",
          lines: [
            { text: "From +4 nC: r − r₁ = (1, 0, 1), length √2; E₁ = 8.988 × 10⁹ × 4 × 10⁻⁹ × (1, 0, 1)/(√2)³ = 12.71âₓ + 12.71âz V/m.", focus: ["q"] },
            { text: "From −4 nC: r − r₂ = (−1, 0, 1); E₂ = −35.95 × (−1, 0, 1)/(√2)³ = 12.71âₓ − 12.71âz V/m.", focus: ["q"] },
            { text: "Sum: E = 25.42âₓ V/m. The z-parts cancel.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: 25.4206, unit: "V/m" }] },
          ],
          trap: "Using |r − rᵢ|² with the full vector (r − rᵢ) in the numerator gives an answer √2 times too big here. With the vector on top, the denominator is cubed.",
        },
        {
          id: "square", level: "tutorial", title: "Four charges at a square's corners",
          setup: { q: SQUARE, ep: { point: [1, 1, 1], oblique: true, drawScale: 0.9 } },
          problem: "Four identical 3 nC charges are at (1, 1, 0), (−1, 1, 0), (−1, −1, 0) and (1, −1, 0) m. Find E at P(1, 1, 1) m.",
          lines: [
            { text: "The four vectors from the charges to P are (0, 0, 1), (2, 0, 1), (2, 2, 1) and (0, 2, 1), with lengths 1, √5, 3 and √5.", focus: ["q"] },
            { text: "Each term is 26.96 × (vector)/(length)³, since 8.988 × 10⁹ × 3 × 10⁻⁹ = 26.96.", focus: ["q"] },
            { text: "Sum: E = 6.820âₓ + 6.820âᵧ + 32.78âz V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: 6.82046, unit: "V/m" }, { instance: "ep", readout: "Ey", value: 6.82046, unit: "V/m" }, { instance: "ep", readout: "Ez", value: 32.7845, unit: "V/m" }] },
          ],
          covers: ["text:hayt-four-charges"],
          trap: "Forgetting that the charge directly below P, only 1 m away, dominates. Its term alone is 26.96âz V/m.",
        },
        {
          id: "mst", level: "exam", title: "MST 2023-24 Q2(b): micrometres",
          setup: { q: MST, ep: { point: [u, 2 * u, 5 * u], oblique: true, drawScale: 2e5 } },
          problem: "In a vacuum, QA = 0.5 µC is at A(4, −3, 7) µm and QB = −0.3 µC is at B(2, −3, 1) µm. Calculate E at P(1, 2, 5) µm.",
          lines: [
            { text: "From A: P − A = (−3, 5, −2) µm, length √38 µm. E_A = 8.988 × 10⁹ × 0.5 × 10⁻⁶ × (−3, 5, −2) × 10⁻⁶ / (√38 × 10⁻⁶)³ = (−57.55, 95.92, −38.37) × 10¹² V/m.", focus: ["q"] },
            { text: "From B: P − B = (−1, 5, 4) µm, length √42 µm. With QB negative, E_B = (9.906, −49.53, −39.62) × 10¹² V/m.", focus: ["q"] },
            { text: "Sum: E = −47.65âₓ + 46.39âᵧ − 77.99âz TV/m (1 TV/m = 10¹² V/m).", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: -4.76464e13, unit: "V/m" }, { instance: "ep", readout: "Ey", value: 4.63906e13, unit: "V/m" }, { instance: "ep", readout: "Ez", value: -7.79913e13, unit: "V/m" }] },
          ],
          covers: ["mst-2324-q2b"],
          trap: "Dropping QB's minus sign turns E_B around and gives E_z = −1.8 × 10¹² V/m, the wrong answer entirely. Carry every charge's sign into its term.",
        },
      ],
      asks: [
        { id: "cube", q: "Why is the denominator cubed?", a: "Because the numerator is the full vector r − rᵢ, not a unit vector. Dividing that vector by its length once gives the unit vector, and by its length squared gives the inverse square. That makes the length cubed in total." },
        { id: "zero", q: "Can the total field be zero somewhere?", a: "Yes. Between two equal positive charges, halfway, their fields cancel exactly. Superposition gives zeros that no single charge could." },
        { id: "sign", q: "Do I include each charge's sign?", a: "Always. A negative Qᵢ flips its whole term. Most superposition errors are a dropped minus sign." },
        { id: "tv", q: "What is TV/m?", a: "Teravolts per metre, 10¹² V/m. Micrometre distances make fields enormous, so the lecturer's answers use T (tera). It's just a prefix." },
        { id: "grid", q: "How do I keep the arithmetic organised?", a: "Make a table: for each charge, the vector r − rᵢ, its length, the factor kQᵢ/length³, then the three components. Add the columns at the end." },
        { id: "field-lines", q: "What do field lines show here?", a: "The direction of the total field at every point: they start on positive charges and end on negative ones, and never cross, because the total field has only one direction at any point." },
      ],
      checks: [
        {
          id: "cancel", title: "Check: where does it cancel?", show: ["q", "ep", "eq"], patch: { q: { items: DIPOLE, oblique: false, drawScale: 1 }, ep: { point: [0, 0, 1], oblique: false, drawScale: 1 } },
          note: "Four checks on superposed fields. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "cancel", type: "choose", prompt: "Two equal +q charges sit on the x-axis at ±1 m. Where is E zero?", dimension: "conceptual",
            options: [
              choice("mid", "At the midpoint, the origin", true, "Right: equal and opposite there."),
              choice("far", "Far away along the y-axis", false, "There both push outward, along +y: they add."),
              choice("none", "Nowhere", false, "Symmetry makes the midpoint cancel exactly."),
            ] },
        },
        {
          id: "predict-flip", title: "Check: flip the negative charge",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-flip", type: "predict-drag", prompt: "The −4 nC charge becomes +4 nC. Drag Eₓ at (0, 0, 1) m to your prediction.", target: { instance: "ep", readout: "Ex" }, range: [-30, 30], unit: "V/m", relTol: 0.05, reveal: { q: { items: [DIPOLE[0], pt("n", 0.004, [1, 0, 0], "+4 nC")] } }, dimension: "conceptual",
            feedback: { close: "Right: zero. Now the x-parts cancel and the z-parts add.", far: "With two equal positive charges, the x-parts cancel: Eₓ = 0 and E points straight up." } },
        },
        {
          id: "mst-z", title: "Check: MST Q2(b)'s z-component",
          note: "The mid-semester question, one component.",
          interaction: { id: "mst-z", type: "numeric", prompt: "QA = 0.5 µC at A(4, −3, 7) µm and QB = −0.3 µC at B(2, −3, 1) µm. Find E_z at P(1, 2, 5) µm, in V/m.", answer: { value: -7.799e13, unit: "V/m" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 1.255e12, unit: "V/m", errorClass: "sign", feedback: "That treats QB as positive. Its term must carry the minus sign." }],
            hints: ["Work each charge's term with (P − rᵢ)/|P − rᵢ|³.", "E_A,z = −38.37 × 10¹²; E_B,z = −39.62 × 10¹².", "Add them."] },
          covers: ["mst-2324-q2b"],
        },
        {
          id: "which-dom", title: "Check: which term dominates?",
          note: "Last one.",
          interaction: { id: "which-dom", type: "choose", prompt: "In the four-charge square, which charge contributes most to E at P(1, 1, 1)?", dimension: "conceptual",
            options: [
              choice("near", "The one at (1, 1, 0), directly below P", true, "Right: it is only 1 m away."),
              choice("far", "The one at (−1, −1, 0)", false, "That one is the farthest, 3 m away."),
              choice("equal", "They contribute equally", false, "Their distances are 1, √5, 3 and √5 m."),
            ] },
          covers: ["text:hayt-four-charges"],
        },
      ],
      recap: {
        points: [
          "The total field is the vector sum of every charge's field.",
          "Use Qᵢ(r − rᵢ)/(4πε₀|r − rᵢ|³): the full vector on top, the length cubed below.",
          "Carry each charge's sign; symmetry cancels whole components.",
          "Micrometre and nanometre problems give huge fields, so prefixes such as T keep them readable.",
        ],
        traps: ["Squaring instead of cubing with a full vector on top.", "Dropping a charge's minus sign.", "Adding field magnitudes."],
      },
    },
  ],
});

