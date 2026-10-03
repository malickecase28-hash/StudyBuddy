import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const cr = instantiate(templates.find((t) => t.id === "continuity-rate")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaContinuity = defineIdeaPlate({
  id: "idea-continuity",
  title: "The continuity equation",
  requires: { objectives: [1], items: ["f2425-q4b", "hw04-2425-4.1"], misconceptions: ["CONTINUITY_SIGN"] },
  instances: [
    { id: "vs", component: "vector-slice", params: { field: "cont-5x", plane: "xz", probe: [0.6, 0, 0.3], offset: 0, box: 0.6 } },
    { id: "eq", component: "equation", params: eqp(R`\oint_S\mathbf J\cdot d\mathbf S=-\dfrac{dQ_{\text{enc}}}{dt}`, "the current out of a closed surface equals minus the rate of change of the enclosed charge") },
  ],
  ideas: [
    {
      id: "continuity",
      title: "The continuity equation",
      objectives: [1],
      explain: [
        {
          id: "conservation", title: "Charge can't vanish", show: ["vs", "eq"], focus: ["vs", "eq"],
          note: "Charge is conserved: it can't be created or destroyed, only moved. So if current flows out of a closed surface, the charge inside must fall by exactly that much: ∮J·dS = −dQ_enc/dt. The minus sign is the whole point. Net outflow (a positive flux of J) means the enclosed charge is decreasing. On the plate, J = 5x âₓ spreads out, so charge is draining from every box.",
          claims: [{ instance: "vs", readout: "boxRatio", value: 5, unit: "" }],
        },
        {
          id: "point", title: "The point form", patch: { eq: eqp(R`\nabla\cdot\mathbf J=-\dfrac{\partial\rho_v}{\partial t}`, "divergence of J equals minus the rate of change of rho v") }, focus: ["vs", "eq"],
          note: "Apply the divergence theorem to the left side and write Q_enc = ∫ρv dv on the right: ∫∇·J dv = −∫∂ρv/∂t dv. This holds for every volume, however small, so the integrands must match: ∇·J = −∂ρv/∂t. For J = 5x âₓ, ∇·J = 5, so the charge density is falling everywhere.",
          claims: [{ instance: "vs", readout: "div", value: 5, unit: "" }],
        },
        {
          id: "steady", title: "Steady currents: Kirchhoff's current law", patch: { vs: { field: "uniform", box: 0.6 } }, focus: ["vs"],
          note: "When nothing is changing, ∂ρv/∂t = 0, so ∇·J = 0: every bit of current that flows into a region flows out again. The plate's uniform current has zero divergence, and each box shows zero net outflow. Shrink a region to a circuit node and this is Kirchhoff's current law: the currents into a node sum to zero.",
          claims: [{ instance: "vs", readout: "boxRatio", value: 0, unit: "" }],
        },
      ],
      examples: [
        {
          id: "basic", level: "basic", title: "Reading ∂ρv/∂t from J",
          setup: { vs: { field: "cont-5x", box: 0.6, probe: [0.6, 0, 0.3] } },
          problem: "J = 5x âₓ A/m². Find ∂ρv/∂t.",
          lines: [
            { text: "∇·J = ∂(5x)/∂x = 5.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 5, unit: "" }] },
            { text: "Continuity: ∂ρv/∂t = −∇·J, so the charge density is falling everywhere.", focus: ["vs"] },
          ],
          trap: "Reporting +5. Current spreading out means charge leaving, so the density falls.",
        },
        {
          id: "proof", level: "tutorial", title: "The proof",
          setup: { vs: { field: "cont-5x", box: 0.8 } },
          problem: "By considering conservation of charge, prove the continuity equation in point form, ∇·J = −∂ρv/∂t.",
          lines: [
            { text: "Conservation: the current leaving a closed surface S equals the rate at which the enclosed charge falls: ∮_S J·dS = −dQ/dt.", focus: ["eq"] },
            { text: "Write Q = ∫_V ρv dv, so −dQ/dt = −∫_V ∂ρv/∂t dv (the volume is fixed).", focus: ["eq"] },
            { text: "Divergence theorem on the left: ∮_S J·dS = ∫_V ∇·J dv.", focus: ["eq"] },
            { text: "So ∫_V (∇·J + ∂ρv/∂t) dv = 0 for every volume V; hence ∇·J = −∂ρv/∂t. ∎", focus: ["eq"] },
          ],
          covers: ["f2425-q4b"],
          trap: "Skipping 'for every volume'. That step is what lets you drop the integral and equate the integrands.",
        },
        {
          id: "state", level: "exam", title: "State it, and use it",
          setup: { vs: { field: "uniform", box: 0.6 } },
          problem: "State the current continuity equation and express it mathematically. What does it say about a steady (d.c.) current?",
          lines: [
            { text: "Statement: the net current flowing out of any closed surface equals the rate of decrease of the charge it encloses.", focus: ["eq"] },
            { text: "Integral form: ∮J·dS = −dQ/dt. Point form: ∇·J = −∂ρv/∂t.", focus: ["eq"] },
            { text: "For steady currents ∂ρv/∂t = 0, so ∇·J = 0: current neither accumulates nor vanishes anywhere (Kirchhoff's current law).", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 0, unit: "" }] },
          ],
          covers: ["hw04-2425-4.1"],
          trap: "Writing ∇·J = ∂ρv/∂t without the minus sign. That would let charge appear from nowhere.",
        },
      ],
      asks: [
        { id: "minus", q: "Why the minus sign?", tags: ["CONTINUITY_SIGN"], a: "Positive ∮J·dS means current flowing out. If charge leaves, what's inside decreases, so dQ/dt is negative. The minus sign makes both sides agree." },
        { id: "kcl", q: "How is this Kirchhoff's current law?", a: "For steady currents ∇·J = 0. Integrate over a tiny region around a circuit node: the currents in equal the currents out." },
        { id: "maxwell", q: "Where does continuity show up in Maxwell's equations?", a: "It is built in. Take the divergence of Ampère's law with the displacement current and continuity drops out. Maxwell added the displacement current precisely so that it would." },
        { id: "conductor", q: "What happens to charge placed inside a conductor?", a: "Continuity plus J = σE plus Gauss's law gives ∂ρv/∂t = −(σ/ε)ρv: the charge decays away, moving to the surface. In copper this takes about 10⁻¹⁹ s." },
        { id: "units", q: "What are the units of ∂ρv/∂t?", a: "C/m³ per second, which is A/m³: the same as ∇·J, amps per square metre per metre." },
        { id: "proof-marks", q: "What earns the marks in the proof?", a: "Four moves: conservation stated as ∮J·dS = −dQ/dt; Q written as ∫ρv dv; the divergence theorem; and 'true for every volume, so the integrands are equal'." },
      ],
      checks: [
        {
          id: "sign", title: "Check: the sign", show: ["vs", "eq"], patch: { vs: { field: "cont-5x", box: 0.6 } },
          note: "Four checks on continuity. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "sign", type: "choose", prompt: "The continuity equation in point form is…", dimension: "recognition",
            options: [
              choice("right", "∇·J = −∂ρv/∂t", true, "Right: outflow means falling density."),
              choice("plus", "∇·J = ∂ρv/∂t", false, "That would let charge grow as it flows out.", "CONTINUITY_SIGN"),
              choice("zero", "∇·J = 0 always", false, "Only for steady currents."),
            ] },
          covers: ["hw04-2425-4.1"],
        },
        {
          id: "predict-steady", title: "Check: a steady current",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-steady", type: "predict-drag", prompt: "Switch to a uniform current J = âₓ. Drag the net outflow per unit volume to your prediction.", target: { instance: "vs", readout: "boxRatio" }, range: [-5, 10], unit: "", relTol: 0.05, reveal: { vs: { field: "uniform" } }, dimension: "conceptual",
            feedback: { close: "Right: zero. Steady and uniform, so nothing accumulates.", far: "A uniform J has zero divergence: 0." } },
        },
        {
          id: "rate-num", title: "Check: a rate, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "rate-num", type: "numeric", prompt: cr.prompt, answer: cr.spec.answer, distractors: cr.spec.distractors, relTol: cr.spec.relTol, hints: cr.hints, template: "continuity-rate", dimension: "computational" },
        },
        {
          id: "proof-step", title: "Check: the key step",
          note: "Last one.",
          interaction: { id: "proof-step", type: "choose", prompt: "In the proof, which step turns ∮J·dS into a volume integral?", dimension: "application",
            options: [
              choice("div", "The divergence theorem", true, "Right: ∮J·dS = ∫∇·J dv."),
              choice("stokes", "Stokes' theorem", false, "Stokes relates a line integral to a surface integral."),
              choice("gauss", "Coulomb's law", false, "Coulomb's law says nothing about current."),
            ] },
          covers: ["f2425-q4b"],
        },
      ],
      recap: {
        points: [
          "Charge is conserved: ∮J·dS = −dQ_enc/dt.",
          "Point form: ∇·J = −∂ρv/∂t, via the divergence theorem, true for every volume.",
          "Steady currents: ∇·J = 0, which is Kirchhoff's current law.",
        ],
        traps: ["Dropping the minus sign.", "Skipping 'for every volume' in the proof.", "Assuming ∇·J = 0 when charge is changing."],
      },
    },
  ],
});
