import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const wm = instantiate(templates.find((t) => t.id === "work-move")!, 1);
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const EX5 = { items: [pt("a", -4, [2, -1, 3], "Q1 = −4 µC"), pt("b", 5, [0, 4, -2], "Q2 = +5 µC")], oblique: true, drawScale: 0.3 };

export const ideaEnergy = defineIdeaPlate({
  id: "idea-energy",
  title: "Energy: moving charges and systems of charges",
  requires: { objectives: [3], items: ["f2324-q1b"], misconceptions: ["WORK_SIGN"] },
  instances: [
    { id: "q", component: "charges", params: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")] } },
    { id: "ep", component: "e-probe", params: { point: [2, 0, 0] }, links: { charges: "q" } },
    { id: "fc", component: "coulomb-force", params: { on: "b" }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`W=Q\,(V_{\text{end}}-V_{\text{start}})`, speech: "W equals Q times V end minus V start", shortSpeech: "work from potential" } },
  ],
  ideas: [
    {
      id: "energy",
      title: "Energy: moving charges and systems of charges",
      objectives: [3],
      explain: [
        {
          id: "move", title: "Moving a charge: W = QΔV", show: ["q", "ep", "eq"], patch: { ep: { point: [1, 0, 0] } }, focus: ["ep", "eq"],
          givens: [{ value: 1, unit: "m" }, { value: 1, unit: "µC" }],
          note: "Once V is known, work is arithmetic: W = Q(V_end − V_start), with no path integral. Near a +2 µC charge, V = 8988 V at 2 m and 17975 V at 1 m. Bringing a +1 µC charge from 2 m in to 1 m costs W = 10⁻⁶ × (17975 − 8988) = 8.988 × 10⁻³ J. It's positive because we push like charges together.",
          claims: [{ instance: "ep", readout: "V", value: 17975.1, unit: "V" }],
        },
        {
          id: "pair", title: "The energy of a pair", show: ["fc"], patch: { q: EX5, ep: { point: [1, 0, 1], oblique: true, drawScale: 0.3 }, fc: { on: "b", oblique: true, drawScale: 0.3 }, eq: { latex: R`W_E=\dfrac{Q_1Q_2}{4\pi\varepsilon_0R_{12}}`, speech: "the energy of a pair is Q1 Q2 over four pi epsilon nought R", shortSpeech: "pair energy" } }, focus: ["q", "fc", "eq"],
          note: "Assembling charges costs energy. Bring the first in for free, then the second against the first one's potential: W_E = Q1Q2/(4πε₀R12). For Example 5's pair, −4 µC and +5 µC are √54 = 7.348 m apart, giving W_E = −0.02446 J. It's negative because opposite charges attract, so assembling them releases energy.",
          claims: [{ instance: "fc", readout: "U", value: -0.024461, unit: "J" }],
        },
        {
          id: "system", title: "Many charges: add every pair", patch: { eq: { latex: R`W_E=\sum_{\text{pairs}}\dfrac{Q_iQ_j}{4\pi\varepsilon_0R_{ij}}=\tfrac12\sum_i Q_iV_i`, speech: "the system energy is the sum over pairs, or one half the sum of Q V", shortSpeech: "system energy" } }, focus: ["eq"],
          note: "For three or more charges, add the energy of every pair once. For three charges that is three terms: 12, 13 and 23. An equivalent form is W_E = ½ΣQᵢVᵢ, where Vᵢ is the potential at charge i due to all the others. The ½ stops each pair being counted twice. This is the electric potential energy the revision guide lists for stationary point charges.",
        },
        {
          id: "zero", title: "When the answer is zero", givens: [{ value: 10, unit: "µC" }], patch: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [2, 0, 0], oblique: false, drawScale: 1 }, eq: { latex: R`V=r^3\sin\theta\cos\phi:\quad V(\theta=0^\circ)=0,\ \ V(\phi=90^\circ)=0`, speech: "V is zero at theta zero and at phi ninety degrees", shortSpeech: "zero potential points" } }, focus: ["eq"],
          note: "Finals 2023-24 Q1(b)(ii) moves 10 µC from X(2, 0°, 100°) to Y(5, 45°, 90°) in V = r³ sin θ cos φ. At X, sin 0° = 0, so V_X = 0. At Y, cos 90° = 0, so V_Y = 0. The work is 10 µC × (0 − 0) = 0 J. The field is not zero along the way; the path simply begins and ends on the same equipotential. Look for that before grinding through numbers.",
        },
      ],
      examples: [
        {
          id: "move", level: "basic", title: "Bringing a charge closer",
          setup: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [2, 0, 0], oblique: false, drawScale: 1 }, eq: { latex: R`W=Q\,(V_{\text{end}}-V_{\text{start}})`, speech: "W equals Q times V end minus V start", shortSpeech: "work from potential" } },
          problem: "A +2 µC charge is fixed at the origin. Find the work to bring +1 µC from 2 m to 1 m from it.",
          givens: [{ value: 1, unit: "m" }, { value: 1, unit: "µC" }],
          lines: [
            { text: "V_start = V(2 m) = 8988 V.", focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 8987.55, unit: "V" }] },
            { text: "V_end = V(1 m) = 17975 V.", patch: { ep: { point: [1, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 17975.1, unit: "V" }] },
            { text: "W = 10⁻⁶ × (17975 − 8988) = 8.988 × 10⁻³ J.", focus: ["ep"] },
          ],
          trap: "Subtracting in the wrong order gives −8.988 mJ. W = Q(V_end − V_start).",
        },
        {
          id: "pair", level: "tutorial", title: "Example 5's pair: the energy stored",
          setup: { q: EX5, ep: { point: [1, 0, 1], oblique: true, drawScale: 0.3 }, fc: { on: "b", oblique: true, drawScale: 0.3 } },
          problem: "−4 µC at (2, −1, 3) and +5 µC at (0, 4, −2). Find the electric potential energy of the pair.",
          lines: [
            { text: "R12 = |(0, 4, −2) − (2, −1, 3)| = |(−2, 5, −5)| = √54 = 7.348 m.", focus: ["q"], givens: [{ value: Math.sqrt(54), unit: "m" }] },
            { text: "W_E = 8.988 × 10⁹ × (−4 × 10⁻⁶)(5 × 10⁻⁶)/7.348 = −0.02446 J.", focus: ["fc"], claims: [{ instance: "fc", readout: "U", value: -0.024461, unit: "J" }] },
          ],
          trap: "Squaring R as in Coulomb's force law. Energy uses R, not R².",
        },
        {
          id: "f2324", level: "exam", title: "Finals 2023-24 Q1(b)(ii)",
          setup: { eq: { latex: R`V=r^3\sin\theta\cos\phi`, speech: "V equals r cubed sine theta cosine phi", shortSpeech: "the given potential" } },
          problem: "In a region where V = r³ sin θ cos φ volts, calculate the energy required to move a 10 µC charge from X(2, 0°, 100°) to Y(5, 45°, 90°).",
          givens: [{ value: 10, unit: "µC" }],
          lines: [
            { text: "V_X = 2³ × sin 0° × cos 100° = 0, because sin 0° = 0.", focus: ["eq"] },
            { text: "V_Y = 5³ × sin 45° × cos 90° = 0, because cos 90° = 0.", focus: ["eq"] },
            { text: "W = Q(V_Y − V_X) = 10 × 10⁻⁶ × (0 − 0) = 0 J. No work: X and Y lie on the same equipotential.", focus: ["eq"] },
          ],
          covers: ["f2324-q1b"],
          trap: "Computing a path integral or using degrees for r. Check V at the endpoints first; here both vanish.",
        },
      ],
      asks: [
        { id: "sign-w", q: "What does positive W mean when moving a charge?", tags: ["WORK_SIGN"], a: "You supplied energy, which is now stored in the configuration. Negative W means the field supplied it: the charge moved where it wanted to go." },
        { id: "path", q: "Do I need the path to find the work?", a: "Not when V is known: W = Q(V_end − V_start). The path matters only if you insist on doing the line integral, and even then every path gives the same answer." },
        { id: "half", q: "Where does the ½ in ½ΣQV come from?", a: "ΣQᵢVᵢ counts each pair twice, once from each end. Halving it counts each pair once." },
        { id: "negative-energy", q: "What does negative potential energy mean?", a: "The system is bound: it would take positive work to pull the charges apart to infinity. Opposite charges together always give negative pair energy." },
        { id: "evolt", q: "What is an electronvolt?", a: "The energy one electron gains crossing 1 V: 1.602 × 10⁻¹⁹ J. It's handy for single particles; this course uses joules." },
        { id: "equip", q: "Why is no work done along an equipotential?", a: "V doesn't change along it, so Q(V_end − V_start) = 0. The field there is perpendicular to your motion and never pushes along it." },
      ],
      checks: [
        {
          id: "formula", title: "Check: work from potentials", show: ["q", "ep", "eq"], hide: ["fc"], patch: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [2, 0, 0], oblique: false, drawScale: 1 }, eq: { latex: R`W=Q\,(V_{\text{end}}-V_{\text{start}})`, speech: "W equals Q times V end minus V start", shortSpeech: "work from potential" } },
          note: "Four checks on energy. Get each right to move on.",
          interaction: { id: "formula", type: "choose", prompt: "The work to move Q from A to B is…", dimension: "recognition",
            options: [
              choice("right", "Q(V_B − V_A)", true, "Right: end minus start."),
              choice("flip", "Q(V_A − V_B)", false, "That's the field's work, not ours.", "WORK_SIGN"),
              choice("sum", "Q(V_A + V_B)", false, "Only the difference matters."),
            ] },
        },
        {
          id: "move-num", title: "Check: moving a charge, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "move-num", type: "numeric", prompt: wm.prompt, answer: wm.spec.answer, distractors: wm.spec.distractors, relTol: wm.spec.relTol, hints: wm.hints, template: "work-move", dimension: "computational" },
        },
        {
          id: "f2324-w", title: "Check: Finals 2023-24 Q1(b)(ii)",
          note: "Look before you calculate.",
          interaction: { id: "f2324-w", type: "numeric", prompt: "V = r³ sin θ cos φ. Energy to move 10 µC from X(2, 0°, 100°) to Y(5, 45°, 90°), in J?", answer: { value: 0, unit: "J" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 8.84e-4, unit: "J", errorClass: "conceptual", feedback: "Check V at each end: sin 0° = 0 at X and cos 90° = 0 at Y." }],
            hints: ["Find V_X and V_Y.", "Both contain a factor that vanishes.", "W = Q × 0."] },
          covers: ["f2324-q1b"],
        },
        {
          id: "pair-sign", title: "Check: a pair's sign",
          note: "Last one.",
          interaction: { id: "pair-sign", type: "choose", prompt: "The potential energy of +3 µC and −3 µC held 1 m apart is…", dimension: "conceptual",
            options: [
              choice("neg", "negative", true, "Right: opposite charges attract, so assembling them releases energy."),
              choice("pos", "positive", false, "Q1Q2 < 0 makes the energy negative.", "WORK_SIGN"),
              choice("zero", "zero", false, "Only if they were infinitely far apart."),
            ] },
        },
      ],
      recap: {
        points: [
          "Moving a charge: W = Q(V_end − V_start); no path is needed.",
          "A pair's energy: W_E = Q1Q2/(4πε₀R12), negative for opposite charges.",
          "Many charges: add every pair once, or ½ΣQᵢVᵢ.",
          "Endpoints on one equipotential mean W = 0.",
        ],
        traps: ["V_start − V_end.", "R² in the energy formula.", "Grinding numbers when both potentials vanish."],
      },
    },
  ],
});
