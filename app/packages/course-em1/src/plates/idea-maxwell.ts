import { defineIdeaPlate } from "@forma/plate";
const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });


const FS = { f: 1e8, E0: 1 };

export const ideaMaxwell = defineIdeaPlate({
  id: "idea-maxwell",
  title: "Maxwell's equations",
  requires: { objectives: [2], items: ["f1516-q4a", "f2324-q3a", "f1819s3-q1", "drill24-q8"], misconceptions: ["MAXWELL_STATIC"] },
  instances: [
    { id: "pw", component: "plane-wave", params: FS },
    { id: "eq", component: "equation", params: eqp(R`\nabla\cdot\mathbf D=\rho_v,\quad \nabla\cdot\mathbf B=0,\quad \nabla\times\mathbf E=-\dfrac{\partial\mathbf B}{\partial t},\quad \nabla\times\mathbf H=\mathbf J+\dfrac{\partial\mathbf D}{\partial t}`, "Maxwell's four equations in point form") },
  ],
  ideas: [
    {
      id: "maxwell",
      title: "Maxwell's equations",
      objectives: [2],
      explain: [
        {
          id: "point", title: "Four equations", show: ["pw", "eq"], focus: ["eq"],
          note: "Maxwell's equations gather everything in four lines. ∇·D = ρv: charges are sources of D. ∇·B = 0: there are no magnetic charges. ∇ × E = −∂B/∂t: Faraday's law. ∇ × H = J + ∂D/∂t: Ampère–Maxwell. Add the constitutive relations D = εE, B = μH and J = σE, and they describe every classical electromagnetic effect in this course.",
        },
        {
          id: "integral", title: "Integral form", patch: { eq: eqp(R`\oint\mathbf D\cdot d\mathbf S=Q,\ \oint\mathbf B\cdot d\mathbf S=0,\ \oint\mathbf E\cdot d\mathbf L=-\dfrac{d}{dt}\int\mathbf B\cdot d\mathbf S,\ \oint\mathbf H\cdot d\mathbf L=I+\int\dfrac{\partial\mathbf D}{\partial t}\cdot d\mathbf S`, "Maxwell's four equations in integral form") }, focus: ["eq"],
          note: "Each point form has an integral twin through the divergence theorem or Stokes' theorem: ∮D·dS = Q_enc, ∮B·dS = 0, ∮E·dL = −(d/dt)∫B·dS and ∮H·dL = I_enc + ∫(∂D/∂t)·dS. Exams ask for both, so learn them in pairs.",
        },
        {
          id: "static", title: "Static fields", patch: { eq: eqp(R`\nabla\cdot\mathbf D=\rho_v,\ \nabla\times\mathbf E=0;\qquad \nabla\cdot\mathbf B=0,\ \nabla\times\mathbf H=\mathbf J`, "the static equations") }, focus: ["eq"],
          note: "Set every ∂/∂t to zero and the equations split into two pairs: ∇·D = ρv with ∇ × E = 0 (electrostatics, where E = −∇V), and ∇·B = 0 with ∇ × H = J (magnetostatics). Only time variation couples E and H. Exam questions ask for exactly this.",
        },
        {
          id: "light", title: "The prediction: light", patch: { eq: eqp(R`\nabla^2\mathbf E=\mu_0\varepsilon_0\dfrac{\partial^2\mathbf E}{\partial t^2},\quad u=\dfrac{1}{\sqrt{\mu_0\varepsilon_0}}`, "the wave equation, with speed one over root mu nought epsilon nought") }, focus: ["eq", "pw"],
          note: "Combine Faraday's law and the Ampère–Maxwell law in free space, and each field obeys a wave equation, ∇²E = μ₀ε₀ ∂²E/∂t², with speed 1/√(μ₀ε₀). The plate's free-space wave travels at u = 2.998 × 10⁸ m/s: the measured speed of light. Light is an electromagnetic wave. That was Maxwell's greatest result.",
          claims: [{ instance: "pw", readout: "u", value: 2.99792e8, unit: "m/s" }],
        },
      ],
      examples: [
        {
          id: "both", level: "basic", title: "Both forms",
          setup: { pw: FS, eq: eqp(R`\nabla\cdot\mathbf D=\rho_v,\quad \nabla\cdot\mathbf B=0,\quad \oint\mathbf E\cdot d\mathbf L=-\dfrac{d}{dt}\int\mathbf B\cdot d\mathbf S,\quad \oint\mathbf H\cdot d\mathbf L=I+\int\dfrac{\partial\mathbf D}{\partial t}\cdot d\mathbf S`, "Maxwell equations in point and integral form") },
          problem: "State Maxwell's equations in both integral and point form.",
          lines: [
            { text: "Gauss (electric): ∇·D = ρv ⇔ ∮S D·dS = ∫v ρv dv.", focus: ["eq"] },
            { text: "Gauss (magnetic): ∇·B = 0 ⇔ ∮S B·dS = 0.", focus: ["eq"] },
            { text: "Faraday: ∇ × E = −∂B/∂t ⇔ ∮L E·dL = −(d/dt)∫S B·dS.", focus: ["eq"] },
            { text: "Ampère–Maxwell, point form: ∇ × H = J + ∂D/∂t. Integral form: the circulation of H round a loop equals the conduction plus displacement current through it.", focus: ["eq"] },
          ],
          covers: ["f1516-q4a"],
          trap: "Mixing up the pairs: the divergence equations become closed-surface integrals; the curl equations become closed-line integrals.",
        },
        {
          id: "static", level: "tutorial", title: "The static equations",
          setup: { pw: FS, eq: eqp(R`\nabla\cdot\mathbf D=\rho_v,\quad \nabla\times\mathbf E=0,\quad \nabla\cdot\mathbf B=0,\quad \nabla\times\mathbf H=\mathbf J`, "the static Maxwell equations") },
          problem: "State Maxwell's equations for static electromagnetic fields in point form, and explain each.",
          lines: [
            { text: "∇·D = ρv: electric flux begins and ends on charge.", focus: ["eq"] },
            { text: "∇ × E = 0: static E is conservative, so E = −∇V.", focus: ["eq"] },
            { text: "∇·B = 0: no magnetic charges; B lines close.", focus: ["eq"] },
            { text: "∇ × H = J: steady currents are the sources of H.", focus: ["eq"] },
          ],
          covers: ["f2324-q3a", "f1819s3-q1"],
          trap: "Keeping −∂B/∂t in a 'static' answer. Static means every time derivative is zero.",
        },
        {
          id: "significance", level: "exam", title: "What the equations mean",
          setup: { pw: FS, eq: eqp(R`\nabla\cdot\mathbf D=\rho_v,\quad \nabla\cdot\mathbf B=0,\quad \nabla\times\mathbf E=-\dfrac{\partial\mathbf B}{\partial t},\quad \nabla\times\mathbf H=\mathbf J+\dfrac{\partial\mathbf D}{\partial t}`, "the time-varying Maxwell equations") },
          problem: "Explain the significance of (i) ∇ × E = 0 and (ii) ∇ × H = Jc + ∂D/∂t. Then explain divergence, and why E can have divergence but B cannot.",
          lines: [
            { text: "(i) A static E is conservative: zero work round any closed path, and E = −∇V.", focus: ["eq"] },
            { text: "(ii) Both conduction current and a changing D make a circulating H. The ∂D/∂t term keeps charge conserved and lets H exist in empty space, which makes waves possible.", focus: ["eq"] },
            { text: "Divergence measures how much flux leaves a tiny volume, per unit of that volume. E lines start and end on charges, so ∇·D = ρv; there are no magnetic charges, so ∇·B = 0 everywhere.", focus: ["eq"] },
          ],
          covers: ["drill24-q8"],
          trap: "Saying B has no divergence because B is weak. It's because magnetic charges don't exist.",
        },
      ],
      asks: [
        { id: "curl-e", q: "Is ∇ × E always zero?", tags: ["MAXWELL_STATIC"], a: "Only in statics. When B changes, ∇ × E = −∂B/∂t, and E is no longer conservative: −∇V alone can't describe it." },
        { id: "monopole", q: "Which equation says there are no magnetic monopoles?", a: "∇·B = 0, Gauss's law for magnetism: B lines always close." },
        { id: "const", q: "What links D to E and B to H?", a: "The material's constitutive relations: D = εE, B = μH and J = σE. Maxwell's equations hold everywhere; the material enters only through ε, μ and σ." },
        { id: "continuity", q: "Is charge conservation built in?", a: "Yes. Take the divergence of the Ampère–Maxwell law and use Gauss's law: you get ∇·J = −∂ρv/∂t, the continuity equation." },
        { id: "c", q: "Why is c = 1/√(μ₀ε₀)?", a: "The wave equation's coefficient μ₀ε₀ equals 1/u². The measured constants give 2.998 × 10⁸ m/s, which matched the measured speed of light." },
        { id: "why", q: "What's their overall significance?", a: "They unified electricity, magnetism and optics, predicted radio waves before anyone had made one, and underpin all of modern communications engineering." },
      ],
      checks: [
        {
          id: "static-c", title: "Check: statics", show: ["pw", "eq"], patch: { pw: FS },
          note: "Four checks on Maxwell's equations. Get each right to move on.",
          interaction: { id: "static-c", type: "choose", prompt: "For static fields, ∇ × E =", dimension: "recognition",
            options: [
              choice("zero", "0", true, "Right: a static E is conservative."),
              choice("dbdt", "−∂B/∂t", false, "That's the general form; in statics ∂B/∂t = 0."),
              choice("j", "J", false, "That's the curl of H."),
            ] },
        },
        {
          id: "mono-c", title: "Check: monopoles",
          note: "Which one?",
          interaction: { id: "mono-c", type: "choose", prompt: "Which equation rules out magnetic monopoles?", dimension: "recognition",
            options: [
              choice("divb", "∇·B = 0", true, "Right."),
              choice("divd", "∇·D = ρv", false, "That's about electric charge."),
              choice("curlh", "∇ × H = J + ∂D/∂t", false, "That's about the sources of H."),
            ] },
        },
        {
          id: "c-num", title: "Check: the speed of light",
          note: "A number.",
          interaction: { id: "c-num", type: "numeric", prompt: "Compute 1/√(μ₀ε₀), in m/s.", answer: { value: 2.99792e8, unit: "m/s" }, relTol: 0.005, dimension: "computational",
            distractors: [{ value: 8.98755e16, unit: "m/s", errorClass: "arithmetic", feedback: "Missing the square root." }],
            hints: ["μ₀ = 4π × 10⁻⁷, ε₀ = 8.854 × 10⁻¹².", "μ₀ε₀ = 1.113 × 10⁻¹⁷.", "Take 1/√ of it."] },
        },
        {
          id: "faraday-c", title: "Check: Faraday in integral form",
          note: "Last one.",
          interaction: { id: "faraday-c", type: "choose", prompt: "In integral form, Faraday's law is…", dimension: "recognition",
            options: [
              choice("right", "∮E·dL = −(d/dt)∫B·dS", true, "Right."),
              choice("gauss", "∮B·dS = 0", false, "That's Gauss's law for magnetism."),
              choice("amp", "∮H·dL = I", false, "That's static Ampère.", "MAXWELL_STATIC"),
            ] },
        },
      ],
      recap: {
        points: ["∇·D = ρv; ∇·B = 0; ∇ × E = −∂B/∂t; ∇ × H = J + ∂D/∂t.", "Integral twins via the divergence and Stokes' theorems.", "Statics: set ∂/∂t = 0; E and H decouple.", "Together they predict waves at 1/√(με)."],
        traps: ["Static forms for time-varying fields.", "Mixing surface and line integrals.", "Forgetting ∂D/∂t."],
      },
    },
  ],
});
