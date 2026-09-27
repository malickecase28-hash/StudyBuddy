import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const ARC_TO = (Math.atan2(0.6, 0.8) * 180) / Math.PI; // 36.87°
const ARC = { kind: "arc" as const, center: [0, 0, 1] as [number, number, number], radius: 1, from: 0, to: ARC_TO };
const SEG = { kind: "segment" as const, from: [1, 0, 1] as [number, number, number], to: [0.8, 0.6, 1] as [number, number, number] };
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaWork = defineIdeaPlate({
  id: "idea-work",
  title: "Work and potential difference",
  requires: { objectives: [0], items: ["lecture:lec2b-ex4"], misconceptions: ["WORK_SIGN"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "lw", component: "line-work", params: { field: "ex4-E", q: 2, path: ARC, drawScale: 1.5 } },
    { id: "eq", component: "equation", params: eqp(R`W=-Q\int_{\text{start}}^{\text{end}}\mathbf E\cdot d\mathbf L`, "W equals minus Q times the line integral of E dot d L") },
  ],
  ideas: [
    {
      id: "work",
      title: "Work and potential difference",
      objectives: [0],
      explain: [
        {
          id: "definition", title: "The work we do", show: ["axes", "lw", "eq"], focus: ["lw", "eq"],
          note: "The field pushes on a charge with force QE. To move the charge along a path without letting it speed up, we push back with −QE. So the work we do is W = −Q∫E·dL along the path. Lecture 2b's Example 4 moves a +2 C charge along the unit circle at z = 1, from B(1, 0, 1) to A(0.8, 0.6, 1), through E = y âₓ + x âᵧ + 2 âz. The plate evaluates the integral: W = −0.96 J.",
          claims: [{ instance: "lw", readout: "W", value: -0.96, unit: "J" }],
        },
        {
          id: "path", title: "Any path, the same answer", patch: { lw: { path: SEG } }, focus: ["lw"],
          note: "Now take the straight chord from B to A instead of the arc. Different path, same work: still −0.96 J. An electrostatic field is conservative: the work depends only on where you start and where you finish. That is what makes a potential possible, because a single number V at each point is enough to say how much work any trip costs.",
          claims: [{ instance: "lw", readout: "W", value: -0.96, unit: "J" }],
        },
        {
          id: "difference", title: "Potential difference: work per coulomb", patch: { eq: eqp(R`V_{AB}=V_A-V_B=\dfrac{W_{B\to A}}{Q}=-\int_B^A\mathbf E\cdot d\mathbf L`, "V A B equals the work per coulomb") }, focus: ["lw", "eq"],
          note: "Divide the work by the charge and you get the potential difference, measured in volts (joules per coulomb): V_AB = V_A − V_B = −∫ from B to A of E·dL. Here V_AB = −0.96/2 = −0.48 V. A is 0.48 V below B, which is why moving the charge from B to A released energy: the field did the work, and ours was negative.",
          claims: [{ instance: "lw", readout: "Vab", value: -0.48, unit: "V" }],
        },
        {
          id: "loop", title: "Round a loop, zero", patch: { lw: { path: { ...ARC, to: 360 } } }, focus: ["lw"],
          note: "Go all the way round the circle and back to B. The work is exactly zero: ∮E·dL = 0 for any electrostatic field. By Stokes' theorem this is the same statement as ∇ × E = 0, the curl you met in vector calculus. Energy can't be pumped out of a static field by going in circles.",
          claims: [{ instance: "lw", readout: "W", value: 0, unit: "J" }],
        },
      ],
      examples: [
        {
          id: "ex4", level: "basic", title: "Lecture 2b Example 4: along the arc",
          setup: { lw: { path: ARC, q: 2 } },
          problem: "E = y âₓ + x âᵧ + 2 âz. Determine the work done carrying +2 C from B(1, 0, 1) to A(0.8, 0.6, 1) along the shorter arc of the unit circle at z = 1.",
          lines: [
            { text: "dL = dx âₓ + dy âᵧ + dz âz, and dz = 0 on the circle: W = −2∫(y dx + x dy).", focus: ["lw"] },
            { text: "On the circle y = √(1 − x²) and x = √(1 − y²): W = −2∫₁^0.8 √(1 − x²) dx − 2∫₀^0.6 √(1 − y²) dy.", latex: R`W=-2\int_1^{0.8}\!\sqrt{1-x^2}\,dx-2\int_0^{0.6}\!\sqrt{1-y^2}\,dy`, focus: ["lw"] },
            { text: "Evaluating: W = −(0.48 + 0.927 − 1.571) − (0.48 + 0.644) = −0.96 J.", focus: ["lw"], claims: [{ instance: "lw", readout: "W", value: -0.96, unit: "J" }] },
          ],
          covers: ["lecture:lec2b-ex4"],
          trap: "Dropping the minus sign in W = −Q∫E·dL gives +0.96 J: the field's work, not ours.",
        },
        {
          id: "chord", level: "tutorial", title: "The same trip in a straight line",
          setup: { lw: { path: SEG, q: 2 } },
          problem: "Repeat Example 4 along the straight line from B to A.",
          lines: [
            { text: "Parametrise: x = 1 − 0.2s, y = 0.6s, z = 1, for 0 ≤ s ≤ 1; dx = −0.2 ds, dy = 0.6 ds.", focus: ["lw"] },
            { text: "E·dL = y dx + x dy = (0.6s)(−0.2) + (1 − 0.2s)(0.6) = 0.6 − 0.24s per ds.", focus: ["lw"] },
            { text: "W = −2∫₀¹ (0.6 − 0.24s) ds = −2(0.6 − 0.12) = −0.96 J, the same as the arc.", focus: ["lw"], claims: [{ instance: "lw", readout: "W", value: -0.96, unit: "J" }] },
          ],
          trap: "Integrating y dx with y held at a constant value. On a slanted path, y changes with x; parametrise first.",
        },
        {
          id: "shortcut", level: "exam", title: "The shortcut: a potential function",
          setup: { lw: { path: { kind: "segment", from: [0.8, 0.6, 1], to: [0, 1, 1.4] }, q: -1 } },
          problem: "E = y âₓ + x âᵧ + 2 âz = −∇V with V = −(xy + 2z). Find the work to carry −1 C from A(0.8, 0.6, 1) to C(0, 1, 1.4).",
          lines: [
            { text: "Because E = −∇V, W = Q(V_end − V_start); no integral needed.", focus: ["lw"] },
            { text: "V_A = −(0.48 + 2) = −2.48 V and V_C = −(0 + 2.8) = −2.8 V.", focus: ["lw"] },
            { text: "W = (−1)(−2.8 − (−2.48)) = +0.32 J.", focus: ["lw"], claims: [{ instance: "lw", readout: "W", value: 0.32, unit: "J" }] },
          ],
          trap: "Using V_start − V_end flips the sign. W = Q(V_end − V_start), and Q's own sign counts too.",
        },
      ],
      asks: [
        { id: "minus", q: "Why the minus sign in W = −Q∫E·dL?", tags: ["WORK_SIGN"], a: "Because W is the work we do, against the field. The field's force is QE, and we push with −QE to move the charge steadily. Our work is the integral of our force along the path." },
        { id: "conservative", q: "What makes a field conservative?", a: "Its work depends only on the endpoints, never on the path. Equivalently, the work round every closed loop is zero, or its curl is zero everywhere. Static electric fields always qualify." },
        { id: "volt", q: "What is a volt, physically?", a: "A volt is a joule per coulomb: the potential difference tells you how much work is done per coulomb of charge between two points." },
        { id: "ref", q: "What does V at a single point mean?", a: "The work per coulomb to bring a charge from a reference point, usually infinity (where V = 0), to that point. Only differences are physical; the reference is a choice." },
        { id: "sign-meaning", q: "What does a negative W mean?", a: "The field did the work for us: the charge moved the way the field pushes it. We would have had to hold it back." },
        { id: "arc-dl", q: "Why is dz = 0 on the arc?", a: "The whole path lies in the plane z = 1, so z never changes along it. The 2âz part of E contributes nothing to E·dL there." },
      ],
      checks: [
        {
          id: "path-choice", title: "Check: which path?", show: ["axes", "lw", "eq"], patch: { lw: { path: ARC, q: 2 } },
          note: "Four checks on work and potential difference. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "path-choice", type: "choose", prompt: "Carrying a charge between two points in an electrostatic field, the work…", dimension: "conceptual",
            options: [
              choice("same", "is the same for every path", true, "Right: the field is conservative."),
              choice("short", "is least along the straight line", false, "Every path gives the same work."),
              choice("long", "grows with the path's length", false, "Only the endpoints matter."),
            ] },
        },
        {
          id: "predict-q", title: "Check: double the charge",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-q", type: "predict-drag", prompt: "Carry +4 C along the same arc instead of +2 C. Drag W to your prediction.", target: { instance: "lw", readout: "W" }, range: [-3, 3], unit: "J", relTol: 0.05, reveal: { lw: { q: 4 } }, dimension: "conceptual",
            feedback: { close: "Right: twice as much, −1.92 J.", far: "W is proportional to Q: −1.92 J." } },
        },
        {
          id: "vab", title: "Check: the potential difference",
          note: "Divide the work by the charge.",
          interaction: { id: "vab", type: "numeric", prompt: "Moving +2 C from B to A takes W = −0.96 J. Find V_AB = V_A − V_B.", answer: { value: -0.48, unit: "V" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0.48, unit: "V", errorClass: "sign", tag: "WORK_SIGN", feedback: "V_A − V_B = W(B→A)/Q, sign included." }],
            hints: ["V_AB = W/Q.", "−0.96 / 2."] },
          covers: ["lecture:lec2b-ex4"],
        },
        {
          id: "loop-w", title: "Check: a closed loop",
          note: "Last one.",
          interaction: { id: "loop-w", type: "choose", prompt: "The work to carry a charge once round any closed loop in an electrostatic field is…", dimension: "recognition",
            options: [
              choice("zero", "zero", true, "Right: ∮E·dL = 0."),
              choice("pos", "positive", false, "You'd be creating energy from nothing."),
              choice("dep", "it depends on the loop", false, "For a static field it is always zero."),
            ] },
        },
      ],
      recap: {
        points: [
          "The work we do is W = −Q∫E·dL.",
          "Electrostatic fields are conservative: W depends only on the endpoints, and ∮E·dL = 0.",
          "Potential difference: V_AB = V_A − V_B = W(B→A)/Q, in volts.",
          "If E = −∇V, then W = Q(V_end − V_start); no path integral is needed.",
        ],
        traps: ["Losing the minus sign.", "Treating y as constant on a slanted path.", "V_start − V_end instead of V_end − V_start."],
      },
    },
  ],
});
