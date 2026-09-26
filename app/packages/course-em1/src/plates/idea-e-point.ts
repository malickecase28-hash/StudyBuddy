import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const ep = instantiate(templates.find((t) => t.id === "e-point")!, 1);
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const nm = 1e-9;

export const ideaEPoint = defineIdeaPlate({
  id: "idea-e-point",
  title: "E = F/q and the point-charge field",
  requires: { objectives: [0], items: ["mst-2324-q2a", "hw-2324-2.4", "f2425-q1b"], misconceptions: ["E_DIRECTION_NEGATIVE"] },
  instances: [
    { id: "q", component: "charges", params: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")] } },
    { id: "ep", component: "e-probe", params: { point: [1, 0, 0] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\mathbf E=\dfrac{\mathbf F}{q}=\dfrac{Q}{4\pi\varepsilon_0R^2}\,\mathbf a_R`, speech: "E equals F over q, which is Q over four pi epsilon nought R squared, along a R", shortSpeech: "electric field" } },
  ],
  ideas: [
    {
      id: "e-point",
      title: "E = F/q and the point-charge field",
      objectives: [0],
      explain: [
        {
          id: "define", title: "Force per unit charge", show: ["q", "ep", "eq"], focus: ["ep"],
          note: "The electric field intensity at a point is the force a small positive test charge would feel there, divided by that charge: E = F/q. It belongs to the point, not to the test charge; the test charge is just how you'd measure it. Its units are newtons per coulomb, the same as volts per metre. On the plate, 1 m from a +2 µC charge, E = 17975 V/m, pointing straight away from the charge.",
          claims: [{ instance: "ep", readout: "Emag", value: 17975.1, unit: "V/m" }, { instance: "ep", readout: "Ex", value: 17975.1, unit: "V/m" }],
        },
        {
          id: "inverse", title: "It falls as 1/R²", patch: { ep: { point: [2, 0, 0] } }, focus: ["ep"],
          note: "Divide Coulomb's law by the test charge and the field of a point charge is E = Q/(4πε₀R²) a_R, where a_R points from the charge to the field point. It inherits the inverse square: at 2 m the field is a quarter as strong, 4494 V/m.",
          claims: [{ instance: "ep", readout: "Emag", value: 4493.78, unit: "V/m" }],
        },
        {
          id: "negative", title: "A negative charge: E points inward", patch: { q: { items: [pt("a", -2, [0, 0, 0], "Q = −2 µC")] }, ep: { point: [1, 0, 0] } }, focus: ["q", "ep"],
          note: "Make the charge −2 µC. The formula doesn't change, but Q is negative, so E points against a_R: toward the charge. At 1 m, E = −17975âₓ V/m. The rule never needs memorising: a positive test charge is pushed away from a positive charge and pulled toward a negative one, and E follows the positive test charge.",
          claims: [{ instance: "ep", readout: "Ex", value: -17975.1, unit: "V/m" }],
        },
        {
          id: "force-from-field", title: "From field to force: F = qE", focus: ["ep", "eq"], patch: { eq: { latex: R`\mathbf F=q\,\mathbf E`, speech: "F equals q E", shortSpeech: "force from field" } },
          note: "Once you know E at a point, the force on any charge q placed there is F = qE. A test charge of one microcoulomb at the probe would feel 0.01798 N toward the −2 µC charge; a negative one of the same size would be pushed away just as hard. This is why the finals ask for F first and then say 'hence, compute E': E = F/q with the same vector, divided by the charge that felt it.",
        },
      ],
      examples: [
        {
          id: "basic", level: "basic", title: "The field of +2 µC at 1 m and 2 m",
          setup: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")] }, ep: { point: [1, 0, 0] } },
          problem: "A +2 µC charge sits at the origin. Find E at (1, 0, 0) m and at (2, 0, 0) m.",
          lines: [
            { text: "At (1, 0, 0): E = 8.988 × 10⁹ × 2 × 10⁻⁶ / 1² âₓ = 17975âₓ V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: 17975.1, unit: "V/m" }] },
            { text: "At (2, 0, 0): a quarter of that, 4494âₓ V/m.", patch: { ep: { point: [2, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: 4493.78, unit: "V/m" }] },
          ],
          trap: "Halving the field when the distance doubles. The field falls as 1/R², so doubling R quarters E.",
        },
        {
          id: "hw24b", level: "tutorial", title: "HW02 2.4(b): 2.45 nm from −6.76 µC",
          setup: { q: { items: [pt("a", -6.76, [0, 0, 0], "−6.76 µC")], drawScale: 4e8 }, ep: { point: [2.45 * nm, 0, 0], drawScale: 4e8 } },
          problem: "Calculate the field intensity at a distance of 2.45 nm from a −6.76 µC point charge.",
          lines: [
            { text: "R = 2.45 × 10⁻⁹ m, so R² = 6.003 × 10⁻¹⁸ m².", focus: ["q"], givens: [{ value: 2.45e-9, unit: "m" }] },
            { text: "|E| = 8.988 × 10⁹ × 6.76 × 10⁻⁶ / 6.003 × 10⁻¹⁸ = 1.012 × 10²² V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Emag", value: 1.01218e22, unit: "V/m" }] },
            { text: "The charge is negative, so E points toward it: E = −1.012 × 10²² a_R V/m.", focus: ["ep"] },
          ],
          covers: ["hw-2324-2.4"],
          trap: "Stopping at the size. A negative charge's field points inward; say so, with −a_R.",
        },
        {
          id: "finals", level: "exam", title: "Finals 2024-25 Q1(b)(ii): hence E_B",
          setup: { q: { items: [pt("a", 2.5, [1 * nm, 2 * nm, 3 * nm], "qA = +2.5 µC")], oblique: true, drawScale: 1e8 }, ep: { point: [0, 2 * nm, 8 * nm], oblique: true, drawScale: 1e8 } },
          givens: [{ value: -3.8, unit: "µC" }],
          problem: "From part (i), F_AB = 6.440 × 10¹⁴ âₓ − 3.220 × 10¹⁵ âz N acts on qB = −3.8 µC at B(0, 2, 8) nm. Hence compute E_B, the field at qB's location.",
          lines: [
            { text: "E_B = F_AB / qB, dividing the whole vector by −3.8 × 10⁻⁶ C.", focus: ["ep"], givens: [{ value: -3.8, unit: "µC" }] },
            { text: "E_B = −1.695 × 10²⁰ âₓ + 8.474 × 10²⁰ âz V/m.", focus: ["ep"], claims: [{ instance: "ep", readout: "Ex", value: -1.69482e20, unit: "V/m" }, { instance: "ep", readout: "Ez", value: 8.47405e20, unit: "V/m" }] },
            { text: "Check: this is the field of qA alone at B, pointing away from the positive qA. Dividing by a negative qB flipped the force's direction back.", focus: ["q", "ep"] },
          ],
          covers: ["f2425-q1b"],
          trap: "Dividing by a positive charge. qB is negative, so E_B points opposite to F_AB.",
        },
      ],
      asks: [
        { id: "test", q: "Why must the test charge be tiny?", a: "A big test charge would push the source charges around and change the very field you're measuring. Mathematically it cancels out of E = F/q, so you can picture a test charge, as the lecture notes do." },
        { id: "units", q: "Are N/C and V/m really the same?", a: "Yes. A volt is a joule per coulomb, and a joule is a newton-metre. So V/m = J/(C·m) = N·m/(C·m) = N/C." },
        { id: "neg", q: "Which way does E point near a negative charge?", tags: ["E_DIRECTION_NEGATIVE"], a: "Toward it. E is the force on a positive test charge, which is pulled toward a negative charge. In the formula the negative Q flips a_R." },
        { id: "at-charge", q: "What is E at the charge itself?", a: "Undefined: R = 0 makes the formula blow up. A point charge is an idealisation, and the field is asked for elsewhere. The plate's probe shows '—' if you put it on a charge." },
        { id: "define-marks", q: "How should I word the definition in an exam?", a: "'The electric field intensity at a point is the force per unit charge experienced by an infinitesimally small, positive test charge placed at that point.' Add E = F/q and the units, N/C or V/m." },
        { id: "field-real", q: "Is the field real, or just a calculation?", a: "Real: it carries energy and momentum. When charges move, changes in the field travel outward at the speed of light, and that is what light and radio are." },
      ],
      checks: [
        {
          id: "define", title: "Check: the definition (MST Q2(a))", show: ["q", "ep", "eq"], patch: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], drawScale: 1, oblique: false }, ep: { point: [1, 0, 0], drawScale: 1, oblique: false } },
          note: "Four checks on the field of a point charge. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "define", type: "choose", prompt: "Electric field intensity at a point is…", dimension: "recognition",
            options: [
              choice("right", "the force per unit positive test charge placed at that point", true, "Right, with the test charge taken as vanishingly small."),
              choice("force", "the force on any charge at that point", false, "It is per unit charge; divide by q."),
              choice("pot", "the work done moving a charge to that point", false, "That is potential, V."),
            ] },
          covers: ["mst-2324-q2a"],
        },
        {
          id: "predict-3x", title: "Check: three times as far",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-3x", type: "predict-drag", prompt: "The probe moves from 1 m to 3 m from the +2 µC charge. Drag |E| to your prediction.", target: { instance: "ep", readout: "Emag" }, range: [0, 20000], unit: "V/m", relTol: 0.05, reveal: { ep: { point: [3, 0, 0] } }, dimension: "conceptual",
            feedback: { close: "Right: a ninth, 1997 V/m.", far: "Inverse square: 3 × the distance gives a ninth of the field, 1997 V/m." } },
        },
        {
          id: "e-num", title: "Check: a field, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "e-num", type: "numeric", prompt: ep.prompt, answer: ep.spec.answer, distractors: ep.spec.distractors, relTol: ep.spec.relTol, hints: ep.hints, template: "e-point", dimension: "computational" },
        },
        {
          id: "dir", title: "Check: direction near a negative charge",
          note: "Last one.",
          interaction: { id: "dir", type: "choose", prompt: "At a point to the right of a −5 nC charge, E points…", dimension: "conceptual",
            options: [
              choice("left", "left, toward the charge", true, "Right: E points toward a negative charge."),
              choice("right", "right, away from the charge", false, "That is the field of a positive charge.", "E_DIRECTION_NEGATIVE"),
              choice("none", "nowhere; E is zero", false, "Every charge has a field around it."),
            ] },
        },
      ],
      recap: {
        points: [
          "E = F/q: the force per unit positive test charge, in N/C or V/m.",
          "Point charge: E = Q/(4πε₀R²) a_R, away from a positive charge and toward a negative one.",
          "It falls as 1/R².",
          "F = qE; 'hence E' means divide the force vector by the charge that felt it, sign included.",
        ],
        traps: ["Pointing E away from a negative charge.", "Halving instead of quartering when R doubles.", "Dividing by the charge without its sign."],
      },
    },
  ],
});
