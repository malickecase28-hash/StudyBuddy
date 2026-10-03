import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const cp = instantiate(templates.find((t) => t.id === "cap-parallel")!, 1);
const AIR = { kind: "parallel" as const, area: 0.01, d: 1e-3, er: 1, V: 100 };
const MST = { kind: "parallel" as const, area: 0.12, d: 8e-5, er: 33.46397, V: 15 };

export const ideaParallelPlate = defineIdeaPlate({
  id: "idea-parallel-plate",
  title: "Capacitance and the parallel-plate capacitor",
  requires: { objectives: [0], items: ["mst-2324-q5b"], misconceptions: ["CAP_UNITS"] },
  instances: [
    { id: "cap", component: "capacitor", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`C=\dfrac{Q}{V}`, "C equals Q over V") },
  ],
  ideas: [
    {
      id: "parallel",
      title: "Capacitance and the parallel-plate capacitor",
      objectives: [0],
      explain: [
        {
          id: "cq", title: "C = Q/V", show: ["cap", "eq"], focus: ["cap", "eq"],
          note: "A capacitor is two conductors holding equal and opposite charges, +Q and −Q. The voltage between them is proportional to Q, and the constant of proportionality is the capacitance: C = Q/V, in farads (coulombs per volt). It depends only on the geometry and the dielectric, never on Q or V. On the plate, plates of area 0.01 m² with a 1 mm air gap hold 8.854 nC at 100 V, so C = 88.54 pF.",
          claims: [{ instance: "cap", readout: "C", value: 8.85419e-11, unit: "F" }, { instance: "cap", readout: "Q", value: 8.85419e-9, unit: "C" }],
        },
        {
          id: "derive", title: "Deriving C = εS/d", patch: { eq: eqp(R`E=\dfrac{Q}{\varepsilon S},\quad V=Ed\ \Rightarrow\ C=\dfrac{\varepsilon S}{d}`, "C equals epsilon S over d") }, focus: ["eq"],
          note: "Put +Q on the top plate. Between wide plates the field is uniform, and the conductor rule gives E = ρs/ε = Q/(εS). The voltage is V = Ed = Qd/(εS). Divide: C = Q/V = εS/d, and Q cancels, as it always does. The same recipe works for every shape: assume ±Q, find E (usually with Gauss's law), integrate for V, and divide.",
          claims: [{ instance: "cap", readout: "C", value: 8.85419e-11, unit: "F" }],
        },
        {
          id: "dielectric", title: "A dielectric multiplies C by εr", patch: { cap: { er: 4 } }, focus: ["cap"],
          note: "Fill the gap with a dielectric of εr = 4 and C = εr ε₀S/d grows fourfold, to 354.2 pF. At the same 100 V the plates now hold 35.42 nC. The dielectric's polarization partly cancels the free charge's field, so more charge fits for the same voltage.",
          claims: [{ instance: "cap", readout: "C", value: 3.54168e-10, unit: "F" }, { instance: "cap", readout: "Q", value: 3.54168e-8, unit: "C" }],
        },
        {
          id: "scale", title: "More area, less gap", patch: { cap: { er: 1, area: 0.02, d: 5e-4 } }, focus: ["cap"],
          note: "C grows with the area and shrinks as the gap widens. Back in air, double the area to 0.02 m² and halve the gap to 0.5 mm: C = 4 × 88.54 = 354.2 pF, the same gain the dielectric gave. Real capacitors use all three tricks at once: large rolled-up foils, very thin films and high-εr materials.",
          claims: [{ instance: "cap", readout: "C", value: 3.54168e-10, unit: "F" }],
        },
      ],
      examples: [
        {
          id: "air", level: "basic", title: "Plates in air",
          setup: { cap: { ...AIR } },
          problem: "Plates of area 100 cm² are 1 mm apart in air. Find C, and Q at 100 V.",
          lines: [
            { text: "Convert: S = 100 cm² = 0.01 m², and d = 1 mm = 0.001 m.", focus: ["cap"] },
            { text: "C = ε₀S/d = 8.854 × 10⁻¹² × 0.01/0.001 = 88.54 pF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 8.85419e-11, unit: "F" }] },
            { text: "Q = CV = 8.854 nC.", focus: ["cap"], claims: [{ instance: "cap", readout: "Q", value: 8.85419e-9, unit: "C" }] },
          ],
          trap: "Leaving d in mm makes C a thousand times too small. And 1 cm² is 10⁻⁴ m², not 10⁻².",
        },
        {
          id: "dielectric", level: "tutorial", title: "The same plates, with a dielectric",
          setup: { cap: { ...AIR, er: 4 } },
          problem: "The same plates with a dielectric of εr = 4 filling the gap. Find C, and Q at 100 V.",
          lines: [
            { text: "C = εr ε₀S/d = 4 × 88.54 pF = 354.2 pF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 3.54168e-10, unit: "F" }] },
            { text: "Q = CV = 35.42 nC, four times the air value at the same voltage.", focus: ["cap"], claims: [{ instance: "cap", readout: "Q", value: 3.54168e-8, unit: "C" }] },
          ],
          trap: "Dividing by εr. A dielectric raises C; it lowers E for a given Q.",
        },
        {
          id: "mst5b", level: "exam", title: "C and εr",
          setup: { cap: { ...MST } },
          problem: "A parallel-plate capacitor has plate area S = 0.120 m² and separation d = 80 µm. At V₀ = 15.0 V it stores W_E = 50.0 µJ. Calculate (ii) the capacitance C and (iii) the relative permittivity εr of its dielectric.",
          lines: [
            { text: "(ii) W = ½CV², so C = 2W/V² = 2 × 50 × 10⁻⁶/15² = 444.4 nF.", focus: ["cap"], claims: [{ instance: "cap", readout: "C", value: 4.44444e-7, unit: "F" }] },
            { text: "(iii) C = εr ε₀S/d, so εr = Cd/(ε₀S) = 4.444 × 10⁻⁷ × 80 × 10⁻⁶/(8.854 × 10⁻¹² × 0.120) = 33.46.", focus: ["cap"] },
          ],
          covers: ["mst-2324-q5b"],
          trap: "C = W/V² (no factor of 2) halves both C and εr. And 80 µm is 8 × 10⁻⁵ m.",
        },
      ],
      asks: [
        { id: "depends", q: "Does C change if I raise the voltage?", a: "No. Q rises in proportion, so Q/V stays the same. Geometry and material alone fix C." },
        { id: "farad", q: "Why are capacitances so small in farads?", a: "ε₀ is only 8.854 × 10⁻¹² F/m. A 1 F air capacitor with a 1 mm gap would need about 113 square kilometres of plate." },
        { id: "fringe", q: "Is C = εS/d exact?", a: "Only when the plates are much wider than the gap, so the field is uniform and fringing at the edges is negligible. Exam questions assume this." },
        { id: "units", q: "Which units trip people up?", tags: ["CAP_UNITS"], a: "S in m² (1 cm² = 10⁻⁴ m², 1 mm² = 10⁻⁶ m²) and d in m (80 µm = 8 × 10⁻⁵ m). Convert both before dividing." },
        { id: "recipe", q: "How do I find C for any shape?", a: "Assume charges ±Q on the conductors. Find E between them, usually with Gauss's law, integrate to get V, then C = Q/V. Q always cancels." },
        { id: "why-er", q: "Why does a dielectric raise C?", a: "Its polarization puts bound charge on its faces that partly cancels the free charge's field. Less field means less voltage for the same Q, so Q/V is larger, by exactly εr." },
      ],
      checks: [
        {
          id: "q-v", title: "Check: C and V", show: ["cap", "eq"], patch: { cap: { ...AIR } },
          note: "Four checks on capacitance. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "q-v", type: "choose", prompt: "Doubling the voltage across a capacitor…", dimension: "conceptual",
            options: [
              choice("q", "doubles Q and leaves C unchanged", true, "Right: C is set by geometry and material."),
              choice("c2", "doubles C", false, "C doesn't depend on V."),
              choice("ch", "halves C", false, "Q doubles too, so Q/V is unchanged."),
            ] },
        },
        {
          id: "predict-gap", title: "Check: a narrower gap",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-gap", type: "predict-drag", prompt: "Halve the gap from 1 mm to 0.5 mm. Drag C to your prediction.", target: { instance: "cap", readout: "C" }, range: [0, 3e-10], unit: "F", relTol: 0.05, reveal: { cap: { d: 5e-4 } }, dimension: "conceptual",
            feedback: { close: "Right: C doubles, to 177.1 pF.", far: "C = εS/d: halve d and C doubles, to 177.1 pF." } },
        },
        {
          id: "cap-num", title: "Check: plates, your numbers",
          note: "Numbers of your own, in cm² and mm.",
          interaction: { id: "cap-num", type: "numeric", prompt: cp.prompt, answer: cp.spec.answer, distractors: cp.spec.distractors, relTol: cp.spec.relTol, hints: cp.hints, template: "cap-parallel", dimension: "computational" },
        },
        {
          id: "mst-er", title: "Check: εr from C",
          note: "Last one.",
          patch: { cap: { ...MST } },
          interaction: { id: "mst-er", type: "numeric", prompt: "C = 444.4 nF, S = 0.120 m², d = 80 µm. Find εr.", answer: { value: 33.46, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 33464, unit: "", errorClass: "unit", tag: "CAP_UNITS", feedback: "That reads 80 µm as 80 mm. 80 µm = 8 × 10⁻⁵ m." }],
            hints: ["εr = Cd/(ε₀S).", "d = 8 × 10⁻⁵ m.", "4.444 × 10⁻⁷ × 8 × 10⁻⁵ / (8.854 × 10⁻¹² × 0.120)."] },
          covers: ["mst-2324-q5b"],
        },
      ],
      recap: {
        points: [
          "C = Q/V, in farads; it depends only on geometry and material.",
          "Parallel plates: C = εr ε₀S/d.",
          "Recipe for any shape: assume ±Q, find E, integrate for V, divide.",
        ],
        traps: ["cm² → m² is 10⁻⁴; mm → m is 10⁻³; µm → m is 10⁻⁶.", "Thinking C depends on V.", "Dividing by εr."],
      },
    },
  ],
});
