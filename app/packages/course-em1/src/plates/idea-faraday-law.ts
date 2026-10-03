import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";
const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });


const ep = instantiate(templates.find((t) => t.id === "emf-peak")!, 1);
const RAMP = { mode: "ramp" as const, N: 1, S: 0.01, rate: 10, R: 10 };
const TRANS = { mode: "transformer" as const, N: 200, S: 0.01, B0: 0.05, f: 60, t: 0 };
const ROD = { mode: "rod" as const, B: 0.1, length: 0.06, rps: 60 };

export const ideaFaradayLaw = defineIdeaPlate({
  id: "idea-faraday-law",
  title: "Faraday's law",
  requires: { objectives: [0], items: ["text:went-p4.9", "text:went-ex4.2", "f2425r-q4a", "hw04-2425-4.1"], misconceptions: ["LENZ_SIGN", "EMF_RATE"] },
  instances: [
    { id: "loop", component: "emf-loop", params: RAMP },
    { id: "eq", component: "equation", params: eqp(R`\text{emf}=-N\dfrac{d\Phi}{dt}`, "emf equals minus N d phi d t") },
  ],
  ideas: [
    {
      id: "faraday",
      title: "Faraday's law",
      objectives: [0],
      explain: [
        {
          id: "law", title: "A changing flux drives an emf", show: ["loop", "eq"], focus: ["loop", "eq"],
          note: "Faraday found that a changing magnetic flux through a loop drives an emf round it: emf = −dΦ/dt, or −N dΦ/dt with N turns. The minus sign is Lenz's law: the induced current flows so as to oppose the change. Wentworth Problem 4.9: B rises at 10 Wb/m² per second through a 10 × 10 cm loop of 10 Ω. The emf is 0.1 V in size and I = 10 mA, circulating clockwise seen from above, to oppose the rising +z flux.",
          claims: [{ instance: "loop", readout: "emf", value: -0.1, unit: "V" }, { instance: "loop", readout: "I", value: 0.01, unit: "A" }],
        },
        {
          id: "transformer", title: "Transformer emf", patch: { loop: TRANS }, focus: ["loop"],
          note: "Let B = B₀ sin ωt instead (Wentworth Example 4.2). Then Φ = B₀S sin ωt and emf = −NωB₀S cos ωt: the emf peaks when B passes through zero, where it changes fastest. On the plate, 200 turns of 0.01 m² in a 50 mT field at 60 Hz give a peak of 37.70 V, and at t = 0 the emf is −37.70 V.",
          claims: [{ instance: "loop", readout: "emfPeak", value: 37.6991, unit: "V" }, { instance: "loop", readout: "emf", value: -37.6991, unit: "V" }],
        },
        {
          id: "motional", title: "Motional emf", patch: { loop: ROD }, focus: ["loop"],
          note: "A conductor moving through a steady B also gets an emf, from the force qu × B on its charges: emf = ∮(u × B)·dL. Wentworth Problem 4.21: a 6.0 cm rod spinning about one end at 60 rev/s in B = 100 mT. A point at radius r moves at ωr, so emf = ∫ωrB dr = ½Bωℓ² = 67.86 mV.",
          claims: [{ instance: "loop", readout: "emf", value: 0.0678584, unit: "V" }],
        },
        {
          id: "point", title: "The point form, via Stokes", patch: { eq: eqp(R`\oint_L\mathbf E\cdot d\mathbf L=-\int_S\dfrac{\partial\mathbf B}{\partial t}\cdot d\mathbf S\ \Rightarrow\ \nabla\times\mathbf E=-\dfrac{\partial\mathbf B}{\partial t}`, "curl E equals minus the rate of change of B") }, focus: ["eq"],
          note: "Write the emf as ∮E·dL and the flux as ∫B·dS. For a fixed loop, ∮E·dL = −∫(∂B/∂t)·dS. Stokes' theorem turns the left side into ∫(∇ × E)·dS, and since this holds for every surface, ∇ × E = −∂B/∂t. A changing B makes a curling E, with no charges needed. In statics this reduces to ∇ × E = 0.",
        },
      ],
      examples: [
        {
          id: "p4-9", level: "basic", title: "Wentworth Problem 4.9: a rising field",
          setup: { loop: RAMP },
          problem: "B increases at 10 Wb/m² per second in the z direction. A 10 × 10 cm square loop centred at the origin in the xy plane has 10 Ω of distributed resistance. Find the size and direction of the induced current.",
          lines: [
            { text: "Φ = BS, so dΦ/dt = 10 × 0.01 = 0.1 Wb/s, and |emf| = 0.1 V.", focus: ["loop"], claims: [{ instance: "loop", readout: "emf", value: -0.1, unit: "V" }] },
            { text: "I = 0.1/10 = 10 mA.", focus: ["loop"], claims: [{ instance: "loop", readout: "I", value: 0.01, unit: "A" }] },
            { text: "Lenz: the current makes its own field along −z to oppose the rising +z flux, so it flows clockwise seen from above.", focus: ["loop"] },
          ],
          covers: ["text:went-p4.9"],
          trap: "Counter-clockwise: that current's field would add to the rising flux, which Lenz's law forbids.",
        },
        {
          id: "transformer", level: "tutorial", title: "Transformer emf in a coil",
          setup: { loop: TRANS },
          problem: "A 200-turn coil of area 0.01 m² lies normal to B = 50 sin(2π × 60t) mT. Find the emf as a function of time, and its peak.",
          lines: [
            { text: "Φ = B₀S sin ωt = 0.05 × 0.01 sin(120πt) = 5 × 10⁻⁴ sin(120πt) Wb.", focus: ["loop"] },
            { text: "emf = −N dΦ/dt = −200 × 120π × 5 × 10⁻⁴ cos(120πt) = −37.70 cos(120πt) V; the peak is 37.70 V.", focus: ["loop", "eq"], claims: [{ instance: "loop", readout: "emfPeak", value: 37.6991, unit: "V" }] },
          ],
          covers: ["text:went-ex4.2"],
          trap: "Answering NΦ = 0.1 Wb as the emf. That's the flux linkage; the emf is its rate of change.",
        },
        {
          id: "resit", level: "exam", title: "Faraday's law in practice",
          setup: { loop: TRANS, eq: eqp(R`\nabla\times\mathbf H=\mathbf J+\dfrac{\partial\mathbf D}{\partial t}`, "curl H equals J plus the rate of change of D") },
          problem: "(i) State, in integral form, Maxwell's equation that embodies Faraday's work. (ii) Deduce two important implications of Faraday's discovery. (iii) Express in point form Maxwell's equation that completes Ampère's circuital law, and name the additional term.",
          lines: [
            { text: "(i) ∮L E·dL = −(d/dt)∫S B·dS: the emf round any closed path equals minus the rate of change of the flux through it.", focus: ["eq"] },
            { text: "(ii) A changing magnetic field creates an electric field with no charges needed, the basis of generators and transformers. And E is no longer conservative when B changes: ∮E·dL ≠ 0.", focus: ["loop"] },
            { text: "(iii) ∇ × H = J + ∂D/∂t. The added term ∂D/∂t is the displacement current density.", focus: ["eq"] },
          ],
          covers: ["f2425r-q4a", "hw04-2425-4.1"],
          trap: "Stating Faraday's law without the minus sign. Lenz's law is part of the law.",
        },
      ],
      asks: [
        { id: "lenz", q: "What does the minus sign in Faraday's law mean?", tags: ["LENZ_SIGN"], a: "Lenz's law: the induced current's own flux opposes the change that caused it. Without the minus sign, a rising flux would drive a current that raised it further: energy from nothing." },
        { id: "rate", q: "Does a strong steady field induce an emf?", tags: ["EMF_RATE"], a: "No. Only a changing flux linkage does: emf = −N dΦ/dt. A huge constant B through a still loop induces nothing." },
        { id: "two", q: "What are the two ways to change the flux?", a: "Change B in time (transformer emf), or move the circuit through B (motional emf). Transformers use the first; generators the second." },
        { id: "transformer", q: "How does a transformer use this?", a: "The primary's alternating current makes an alternating flux in the core, and each secondary turn sees −dΦ/dt. More secondary turns, more volts: V₂/V₁ = N₂/N₁." },
        { id: "source", q: "Where does the electric field come from?", a: "From the changing B itself: ∇ × E = −∂B/∂t. This E curls round; it starts and ends on no charges, so it isn't conservative." },
        { id: "units", q: "What's a volt in magnetic terms?", a: "One weber per second: a flux changing at 1 Wb/s induces 1 V in one turn." },
      ],
      checks: [
        {
          id: "lenz-c", title: "Check: Lenz's law", show: ["loop", "eq"], patch: { loop: RAMP },
          note: "Four checks on Faraday's law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "lenz-c", type: "choose", prompt: "The flux through a loop along +z is increasing. Seen from +z, the induced current flows…", dimension: "application",
            options: [
              choice("cw", "clockwise", true, "Right: its field points along −z, opposing the increase."),
              choice("ccw", "counter-clockwise", false, "That would add to the rising flux.", "LENZ_SIGN"),
              choice("none", "not at all", false, "A changing flux always drives an emf."),
            ] },
        },
        {
          id: "predict-f", title: "Check: a faster field",
          note: "Predict first; then the plate shows the result.",
          patch: { loop: TRANS },
          interaction: { id: "predict-f", type: "predict-drag", prompt: "Double the field's frequency, keeping B₀. Drag the peak emf to your prediction.", target: { instance: "loop", readout: "emfPeak" }, range: [0, 100], unit: "V", relTol: 0.05, reveal: { loop: { f: 120 } }, dimension: "conceptual",
            feedback: { close: "Right: twice as much, 75.40 V. The emf follows dΦ/dt ∝ ω.", far: "Peak emf = NωB₀S ∝ f: 75.40 V." } },
        },
        {
          id: "emf-num", title: "Check: a coil, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "emf-num", type: "numeric", prompt: ep.prompt, answer: ep.spec.answer, distractors: ep.spec.distractors, relTol: ep.spec.relTol, hints: ep.hints, template: "emf-peak", dimension: "computational" },
        },
        {
          id: "steady-c", title: "Check: a steady field",
          note: "Last one.",
          interaction: { id: "steady-c", type: "choose", prompt: "A loop sits still in a constant field of 2 T. The induced emf is…", dimension: "conceptual",
            options: [
              choice("zero", "zero", true, "Right: nothing is changing."),
              choice("two", "2 V", false, "Flux alone induces nothing; only its change does.", "EMF_RATE"),
              choice("area", "proportional to the loop's area", false, "Only if B were changing."),
            ] },
        },
      ],
      recap: {
        points: ["emf = −N dΦ/dt; the minus sign is Lenz's law.", "Transformer emf: −NωB₀S cos ωt. Motional: ∮(u × B)·dL.", "Point form, via Stokes: ∇ × E = −∂B/∂t."],
        traps: ["Losing the minus sign.", "Taking the emf from Φ instead of dΦ/dt.", "∇ × E = 0 when B changes."],
      },
    },
  ],
});
