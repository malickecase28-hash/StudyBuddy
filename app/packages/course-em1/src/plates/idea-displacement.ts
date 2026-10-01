import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";
const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });


const lt = instantiate(templates.find((t) => t.id === "loss-tangent")!, 1);
const SEA = { f: 1e6, er: 81, sigma: 4, E0: 1 };

export const ideaDisplacement = defineIdeaPlate({
  id: "idea-displacement",
  title: "Displacement current",
  requires: { objectives: [1], items: ["text:went-p4.27", "text:went-p4.29", "text:went-p4.28", "text:hayt-d9.3"], misconceptions: ["JD_SOURCE", "LOSS_TAN"] },
  instances: [
    { id: "pw", component: "plane-wave", params: SEA },
    { id: "eq", component: "equation", params: eqp(R`\nabla\times\mathbf H=\mathbf J+\dfrac{\partial\mathbf D}{\partial t}`, "curl H equals J plus the rate of change of D") },
  ],
  ideas: [
    {
      id: "displacement",
      title: "Displacement current",
      objectives: [1],
      explain: [
        {
          id: "fix", title: "Ampère's law needs a fix", show: ["pw", "eq"], focus: ["eq"],
          note: "Charge a capacitor. Ampère's law round the wire encloses the current I, but a surface through the gap between the plates encloses no conduction current at all: the same loop gives two answers. Maxwell's fix adds the displacement current density Jd = ∂D/∂t: ∇ × H = J + ∂D/∂t. In the gap, D grows as the plates charge, and ∫(∂D/∂t)·dS equals the wire's current exactly. Charge conservation demands it.",
        },
        {
          id: "sea", title: "Which current wins?", focus: ["pw"],
          note: "The ratio of the two is |Jc|/|Jd| = σ/(ωε), the loss tangent. Seawater (σ = 4 S/m, εr = 81) at 1 MHz has σ/(ωε) = 887.7: conduction current is almost 900 times larger, so at this frequency seawater behaves as a conductor.",
          claims: [{ instance: "pw", readout: "lossTan", value: 887.659, unit: "" }],
        },
        {
          id: "cross", title: "The crossover", patch: { pw: { f: 887.659e6 } }, focus: ["pw"],
          note: "The two are equal when ω = σ/ε, at f = σ/(2πε) = 887.7 MHz for seawater (Wentworth Problem 4.28). Above it, displacement current dominates, and seawater acts more like a lossy dielectric.",
          claims: [{ instance: "pw", readout: "lossTan", value: 1, unit: "" }],
        },
        {
          id: "copper", title: "Copper at 60 Hz", patch: { pw: { f: 60, er: 1, sigma: 5.8e7 } }, focus: ["pw"],
          note: "In copper at 60 Hz, σ/(ωε₀) = 1.738 × 10¹⁶: displacement current is utterly negligible. Hayt D9.3(d): a conduction current density of 1 MA/m² comes with a displacement current density of only 57.6 pA/m². That's why circuit theory can ignore it inside wires.",
          claims: [{ instance: "pw", readout: "lossTan", value: 1.73759e16, unit: "" }],
        },
      ],
      examples: [
        {
          id: "p4-27", level: "basic", title: "Wentworth Problem 4.27: the gap's displacement current",
          setup: { pw: SEA },
          problem: "Plates of area 60 cm² are separated by 2.0 mm of ideal dielectric with εr = 9.0. With v(t) = 1.0 sin(2π × 10³ t) V across them, find the displacement current.",
          lines: [
            { text: "C = εS/d = 9 × 8.854 × 10⁻¹² × 0.006/0.002 = 239.1 pF.", focus: ["eq"] },
            { text: "In the gap, ∫(∂D/∂t)·dS = C dv/dt = 239.1 pF × 2π × 10³ cos(2π × 10³ t).", focus: ["eq"] },
            { text: "i_d = 1.502 cos(2π × 10³ t) µA: exactly the conduction current in the leads.", focus: ["eq"] },
          ],
          covers: ["text:went-p4.27"],
          trap: "Saying no current crosses the gap, so there is no field. There's no conduction current, but the displacement current makes H all the same.",
        },
        {
          id: "p4-29", level: "tutorial", title: "Wentworth Problem 4.29: inside a coax",
          setup: { pw: SEA, eq: eqp(R`C=\dfrac{2\pi\varepsilon L}{\ln(b/a)},\quad i_d=C\dfrac{dv}{dt}`, "coax capacitance times the rate of voltage change") },
          problem: "A 1.0 m coax with inner conductor diameter 2.0 mm and outer conductor diameter 6.0 mm is filled with an ideal dielectric of εr = 10.2. With v(t) = 10 cos(6π × 10⁶ t) mV on the inner conductor, find the displacement current.",
          lines: [
            { text: "C = 2πεL/ln(b/a) = 2π × 10.2 × 8.854 × 10⁻¹² × 1.0/ln 3 = 516.5 pF.", focus: ["eq"] },
            { text: "i_d = C dv/dt = −516.5 pF × 6π × 10⁶ × 0.010 sin(6π × 10⁶ t) = −97.36 sin(6π × 10⁶ t) µA.", focus: ["eq"] },
          ],
          covers: ["text:went-p4.29"],
          trap: "Using the diameters in ln(b/a). Here the ratio is the same, 3, but halve them out of habit.",
        },
        {
          id: "crossover", level: "exam", title: "Seawater and copper: which current wins",
          setup: { pw: SEA, eq: eqp(R`\dfrac{|J_c|}{|J_d|}=\dfrac{\sigma}{\omega\varepsilon}`, "the ratio of conduction to displacement current") },
          givens: [{ value: 60, unit: "Hz" }, { value: 887.659e6, unit: "Hz" }],
          problem: "(a) At what frequency are the conduction and displacement current densities equal in seawater (σ = 4 S/m, εr = 81)? (b) Find their ratio at 1 MHz. (c) Find Jd in copper at 60 Hz when J = 1 MA/m² (Hayt D9.3(d)).",
          lines: [
            { text: "(a) Equal when σ = ωε: f = σ/(2πε) = 4/(2π × 81 × 8.854 × 10⁻¹²) = 887.7 MHz.", focus: ["pw"], givens: [{ value: 887.659e6, unit: "Hz" }] },
            { text: "(b) σ/(ωε) at 1 MHz = 887.7: conduction dominates.", focus: ["pw"], claims: [{ instance: "pw", readout: "lossTan", value: 887.659, unit: "" }] },
            { text: "(c) E = J/σ = 10⁶/5.8 × 10⁷ V/m, so Jd = ωε₀E = 377 × 8.854 × 10⁻¹² × 0.01724 = 57.6 pA/m².", focus: ["eq"] },
          ],
          covers: ["text:went-p4.28", "text:hayt-d9.3"],
          trap: "Using f instead of ω = 2πf in σ/(ωε): a factor of 2π out.",
        },
      ],
      asks: [
        { id: "flow", q: "Is displacement current a flow of charge?", tags: ["JD_SOURCE"], a: "No. No charge crosses a capacitor's gap. ∂D/∂t is a changing field that makes H exactly as a current would, which is why Maxwell called it a current." },
        { id: "why", q: "Why did Maxwell need it?", a: "Without it, Ampère's law contradicts charge conservation: ∇·(∇ × H) = 0 would force ∇·J = 0 even while charge piles up on a capacitor plate." },
        { id: "waves", q: "What does displacement current make possible?", a: "Fields that sustain each other in empty space: a changing E makes H through ∂D/∂t, and a changing H makes E through Faraday's law. That's an electromagnetic wave." },
        { id: "ratio", q: "How do I compare conduction and displacement current?", tags: ["LOSS_TAN"], a: "|Jc|/|Jd| = σ/(ωε), with ω = 2πf. Much greater than 1: a conductor. Much less than 1: a good dielectric." },
        { id: "freq", q: "Why does the ratio depend on frequency?", a: "Jd = ωεE grows with frequency while Jc = σE doesn't. Any material looks more like a dielectric at high enough frequency." },
        { id: "wires", q: "Is there displacement current in a wire?", a: "Yes, but tiny: in copper at mains frequency it's about 10⁻¹⁶ of the conduction current." },
      ],
      checks: [
        {
          id: "jd-c", title: "Check: what displacement current is", show: ["pw", "eq"], patch: { pw: SEA },
          note: "Four checks on displacement current. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "jd-c", type: "choose", prompt: "In a charging capacitor's gap, the displacement current is…", dimension: "conceptual",
            options: [
              choice("dd", "a changing D, ∂D/∂t, with no charge crossing", true, "Right."),
              choice("leak", "charge leaking across the gap", false, "No charge crosses an ideal dielectric.", "JD_SOURCE"),
              choice("zero", "zero", false, "It equals the current in the leads."),
            ] },
        },
        {
          id: "predict-10", title: "Check: ten times the frequency",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-10", type: "predict-drag", prompt: "Raise the frequency tenfold in the seawater. Drag σ/(ωε) to your prediction.", target: { instance: "pw", readout: "lossTan" }, range: [0, 1000], unit: "", relTol: 0.05, reveal: { pw: { f: 1e7 } }, dimension: "conceptual",
            feedback: { close: "Right: a tenth, 88.77.", far: "σ/(ωε) ∝ 1/f: 88.77." } },
        },
        {
          id: "lt-num", title: "Check: a ratio, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "lt-num", type: "numeric", prompt: lt.prompt, answer: lt.spec.answer, distractors: lt.spec.distractors, relTol: lt.spec.relTol, hints: lt.hints, template: "loss-tangent", dimension: "computational" },
        },
        {
          id: "term-c", title: "Check: the corrected law",
          note: "Last one.",
          interaction: { id: "term-c", type: "choose", prompt: "Ampère's law with Maxwell's correction reads…", dimension: "recognition",
            options: [
              choice("right", "∇ × H = J + ∂D/∂t", true, "Right."),
              choice("static", "∇ × H = J", false, "That's the static form.", "MAXWELL_STATIC"),
              choice("faraday", "∇ × E = −∂B/∂t", false, "That's Faraday's law."),
            ] },
        },
      ],
      recap: {
        points: ["Jd = ∂D/∂t completes Ampère's law: ∇ × H = J + ∂D/∂t.", "|Jc|/|Jd| = σ/(ωε); equal at f = σ/(2πε).", "Conductors at low frequency: Jd is negligible."],
        traps: ["Displacement current as moving charge.", "f instead of ω.", "Inverting the ratio."],
      },
    },
  ],
});
