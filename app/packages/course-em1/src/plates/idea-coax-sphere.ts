import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const cc = instantiate(templates.find((t) => t.id === "cap-coax")!, 1);
const PE = { kind: "coax" as const, a: 1e-3, b: 3.5e-3, length: 1, er: 2.26, V: 100 };
const MST = { kind: "coax" as const, a: 0.007112, b: 0.01143, length: 1e5, er: 6.78, V: 1 };

export const ideaCoaxSphere = defineIdeaPlate({
  id: "idea-coax-sphere",
  title: "Coaxial and spherical capacitors",
  requires: { objectives: [2], items: ["mst-2324-q4c"], misconceptions: ["CAP_LN"] },
  instances: [
    { id: "cap", component: "capacitor", params: PE },
    { id: "eq", component: "equation", params: eqp(R`C=\dfrac{2\pi\varepsilon L}{\ln(b/a)}`, "C equals two pi epsilon L over the natural log of b over a") },
  ],
  ideas: [
    {
      id: "coax",
      title: "Coaxial and spherical capacitors",
      objectives: [2],
      explain: [
        {
          id: "coax", title: "A coaxial cable", show: ["cap", "eq"], focus: ["cap", "eq"],
          note: "Two coaxial conductors: an inner one of radius a and an outer one of radius b. Put +Q on the inner one, spread along a length L. Gauss's law with a cylinder gives E = Q/(2περL) between them. Integrate from a to b: V = (Q/(2πεL)) ln(b/a). So C = Q/V = 2πεL/ln(b/a). A 1 mm core in a 3.5 mm shield, with polyethylene (εr = 2.26) between, gives 100.4 pF per metre.",
          claims: [{ instance: "cap", readout: "C", value: 1.00362e-10, unit: "F" }],
        },
        {
          id: "ratio", title: "Only the ratio b/a matters", patch: { cap: { a: 2e-3, b: 7e-3 } }, focus: ["cap"],
          note: "The radii enter only as b/a. Double both, to 2 mm and 7 mm, and C doesn't change: still 100.4 pF per metre. That's why cables of different sizes can share a capacitance per metre, and why you needn't convert inches for the logarithm: the ratio has no units. Only the length L must be in metres.",
          claims: [{ instance: "cap", readout: "C", value: 1.00362e-10, unit: "F" }],
        },
        {
          id: "sphere", title: "Concentric spheres", patch: { cap: { kind: "sphere", a: 0.05, b: 0.1, er: 1 }, eq: eqp(R`C=\dfrac{4\pi\varepsilon}{1/a-1/b}`, "C equals four pi epsilon over one over a minus one over b") }, focus: ["cap", "eq"],
          note: "For concentric spheres, Gauss's law gives E = Q/(4πεr²). Integrate from a to b: V = (Q/(4πε))(1/a − 1/b), so C = 4πε/(1/a − 1/b). Spheres of 5 cm and 10 cm with air between: C = 11.13 pF. Let the outer sphere go to infinity and C = 4πεa, an isolated sphere: 5.563 pF for this one.",
          claims: [{ instance: "cap", readout: "C", value: 1.11265e-11, unit: "F" }],
        },
        {
          id: "field", title: "Where the field is strongest", patch: { cap: { ...PE }, eq: eqp(R`E=\dfrac{V}{\rho\ln(b/a)}`, "E equals V over rho times the natural log of b over a") }, focus: ["cap", "eq"],
          note: "In the coax, E = V/(ρ ln(b/a)) falls off as 1/ρ, so it's largest at the inner conductor's surface: 79.82 kV/m here at 100 V. That's where the insulation breaks down first. Designers choose b/a to balance a high breakdown voltage against the cable's capacitance.",
          claims: [{ instance: "cap", readout: "Eg", value: 79823.6, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "sphere", level: "basic", title: "Concentric spheres in air",
          setup: { cap: { kind: "sphere", a: 0.05, b: 0.1, er: 1, V: 100 } },
          problem: "Concentric spheres of radii 5 cm and 10 cm have air between them. Find C.",
          lines: [
            { text: "In metres: 1/a − 1/b = 1/0.05 − 1/0.1 = 20 − 10 = 10.", focus: ["cap"] },
            { text: "C = 4πε₀/10 = 4π × 8.854 × 10⁻¹²/10 = 11.13 pF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 1.11265e-11, unit: "F" }] },
          ],
          trap: "Working in centimetres: 1/5 − 1/10 = 0.1 makes C a hundred times too big.",
        },
        {
          id: "coax-pe", level: "tutorial", title: "A polyethylene coax, per metre",
          setup: { cap: { ...PE } },
          problem: "A coax has a 1 mm-radius core, a shield of inner radius 3.5 mm, and polyethylene (εr = 2.26) between. Find its capacitance per metre.",
          lines: [
            { text: "ln(b/a) = ln 3.5 = 1.253.", focus: ["cap"] },
            { text: "C/L = 2π × 2.26 × 8.854 × 10⁻¹²/1.253 = 100.4 pF/m.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 1.00362e-10, unit: "F" }] },
          ],
          trap: "log₁₀ 3.5 = 0.544 gives 231.1 pF/m. The formula's ln is the natural log.",
        },
        {
          id: "mst4c", level: "exam", title: "MST Q4(c): 100 km of coax, in inches",
          setup: { cap: { ...MST } },
          problem: "Calculate the capacitance of a 100 km coaxial cable with a solid core of radius 0.28 inch, insulated to a 0.90 inch diameter by a material with εr = 6.78.",
          lines: [
            { text: "Outer radius b = 0.90/2 = 0.45 inch. b/a = 0.45/0.28 = 1.607, and ln 1.607 = 0.4745; the inches cancel.", focus: ["cap"] },
            { text: "L = 100 km = 10⁵ m.", focus: ["cap"] },
            { text: "C = 2π × 6.78 × 8.854 × 10⁻¹² × 10⁵/0.4745 = 79.50 µF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 7.94988e-5, unit: "F" }] },
          ],
          covers: ["mst-2324-q4c"],
          trap: "Using 0.90 inch as b. It's the insulation's diameter; b is its radius, 0.45 inch.",
        },
      ],
      asks: [
        { id: "ln", q: "Why a natural log?", tags: ["CAP_LN"], a: "It comes from integrating 1/ρ: ∫dρ/ρ = ln ρ. Integrating 1/x always gives the natural log, never log₁₀." },
        { id: "inches", q: "Do I need to convert inches for coax?", a: "Not for ln(b/a): the ratio has no units. You do need L in metres, since C is proportional to it." },
        { id: "per-length", q: "Why quote coax in pF/m?", a: "C grows in proportion to L, so the per-metre value describes the cable itself. Multiply by the length for a particular run." },
        { id: "isolated", q: "What's the capacitance of a single sphere?", a: "Take b → ∞: C = 4πεa. The 'other plate' is infinitely far away. Even the Earth, radius 6370 km, has only about 709 µF." },
        { id: "breakdown", q: "Where does a coax's insulation fail first?", a: "At the inner conductor, where E = V/(a ln(b/a)) is largest. A very thin core concentrates the field." },
        { id: "diameter", q: "Radius or diameter?", tags: ["CAP_LN"], a: "The formulas use radii. Papers often give a diameter, as MST Q4(c) does for the insulation: halve it first." },
      ],
      checks: [
        {
          id: "ln-c", title: "Check: scaling the radii", show: ["cap", "eq"], patch: { cap: { ...PE } },
          note: "Four checks on coax and spheres. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "ln-c", type: "choose", prompt: "For a coax, C = 2πεL/ln(b/a). Doubling both radii…", dimension: "conceptual",
            options: [
              choice("same", "leaves C unchanged", true, "Right: only b/a enters."),
              choice("double", "doubles C", false, "The radii appear only as a ratio."),
              choice("half", "halves C", false, "b/a is unchanged, so C is too."),
            ] },
        },
        {
          id: "predict-er", title: "Check: without the dielectric",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-er", type: "predict-drag", prompt: "Replace the polyethylene (εr = 2.26) with air. Drag C to your prediction.", target: { instance: "cap", readout: "C" }, range: [0, 2e-10], unit: "F", relTol: 0.05, reveal: { cap: { er: 1 } }, dimension: "conceptual",
            feedback: { close: "Right: C falls by 2.26, to 44.41 pF.", far: "C ∝ εr: 100.4/2.26 = 44.41 pF." } },
        },
        {
          id: "coax-num", title: "Check: coax, your numbers",
          note: "Numbers of your own, in mm.",
          interaction: { id: "coax-num", type: "numeric", prompt: cc.prompt, answer: cc.spec.answer, distractors: cc.spec.distractors, relTol: cc.spec.relTol, hints: cc.hints, template: "cap-coax", dimension: "computational" },
        },
        {
          id: "mst4c-c", title: "Check: MST Q4(c)",
          note: "Last one.",
          patch: { cap: { ...MST } },
          interaction: { id: "mst4c-c", type: "numeric", prompt: "MST Q4(c): 100 km of coax, core radius 0.28 inch, insulation diameter 0.90 inch, εr = 6.78. Find C in µF.", answer: { value: 79.4988, unit: "µF" }, relTol: 0.01, dimension: "computational",
            distractors: [
              { value: 183.053, unit: "µF", errorClass: "conceptual", tag: "CAP_LN", feedback: "That uses log₁₀. Use the natural log." },
              { value: 32.3044, unit: "µF", errorClass: "conceptual", tag: "CAP_LN", feedback: "That takes 0.90 inch as b. It's a diameter: b = 0.45 inch." },
            ],
            hints: ["b = 0.90/2 = 0.45 inch; only b/a matters.", "L = 10⁵ m.", "C = 2π × 6.78 × ε₀ × 10⁵ / ln(0.45/0.28)."] },
          covers: ["mst-2324-q4c"],
        },
      ],
      recap: {
        points: [
          "Coax: C = 2πεL/ln(b/a); only the ratio of radii matters, and L must be in metres.",
          "Concentric spheres: C = 4πε/(1/a − 1/b); isolated sphere: 4πεa.",
          "A coax's field is strongest at its inner conductor.",
        ],
        traps: ["log₁₀ for ln.", "A diameter used as a radius.", "Centimetres left in 1/a − 1/b."],
      },
    },
  ],
});
