import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
type V3 = [number, number, number];
const ai = instantiate(templates.find((t) => t.id === "amp-inside")!, 1);
const WIRE = { items: [{ id: "w", kind: "cylinder" as const, I: 20, a: 0, b: 0.001 }], probe: [0.002, 0, 0] as V3, mur: 1, drawScale: 300 };
const SHEETS = {
  items: [
    { id: "f", kind: "line" as const, I: 0.02 * Math.PI },
    { id: "k1", kind: "sheet" as const, K: 0.4, radius: 0.01 },
    { id: "k2", kind: "sheet" as const, K: -0.25, radius: 0.02 },
    { id: "k3", kind: "sheet" as const, K: -0.3, radius: 0.03 },
  ],
  probe: [0.015, 0, 0] as V3, drawScale: 30,
};
const COAX = { items: [{ id: "in", kind: "cylinder" as const, I: 2.5, a: 0, b: 0.3 }, { id: "out", kind: "cylinder" as const, I: -2.5, a: 0.5, b: 0.6 }], probe: [0, 0.2, 0] as V3, drawScale: 2 };

export const ideaAmpere = defineIdeaPlate({
  id: "idea-ampere",
  title: "Ampère's circuital law",
  requires: {
    objectives: [2],
    items: ["text:hayt-d7.7", "f1415-q4", "f2425-q4a", "f2324-q4a", "f1718-q3a", "f2425r-q3a", "f1415-q3b", "ict2-2425-q1", "hw03-2425-3.1b", "f2425-q3a", "f1415-q2a", "f2324-q3b", "f1718-q3b"],
    misconceptions: ["AMP_ENC_INSIDE"],
  },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "c", component: "currents", params: WIRE },
    { id: "eq", component: "equation", params: eqp(R`\oint_L\mathbf H\cdot d\mathbf L=I_{\text{enc}}`, "the closed line integral of H equals the current enclosed") },
  ],
  ideas: [
    {
      id: "ampere",
      title: "Ampère's circuital law",
      objectives: [2],
      explain: [
        {
          id: "law", title: "Ampère's circuital law", show: ["axes", "c", "eq"], focus: ["c", "eq"],
          note: "When a current has enough symmetry, there's a shortcut. The line integral of H round any closed path equals the current the path encloses: ∮H·dL = I_enc. Choose a path on which H is constant and parallel to dL, and the integral becomes H × (path length). For a circle of radius ρ round a long wire, H · 2πρ = I. The plate's 20 A wire, 1 mm in radius, gives 1592 A/m at ρ = 2 mm (Hayt D7.7).",
          claims: [{ instance: "c", readout: "Hphi", value: 1591.55, unit: "A/m" }, { instance: "c", readout: "Ienc", value: 20, unit: "A" }],
        },
        {
          id: "inside", title: "Inside the conductor", patch: { c: { probe: [0.0005, 0, 0] }, eq: eqp(R`H\cdot2\pi\rho=I\dfrac{\rho^2}{a^2}\ \Rightarrow\ H=\dfrac{I\rho}{2\pi a^2}`, "H equals I rho over two pi a squared") }, focus: ["c", "eq"],
          note: "Inside a uniformly filled conductor, a circle of radius ρ < a encloses only the fraction ρ²/a² of the current. So H · 2πρ = Iρ²/a², and H = Iρ/(2πa²): it grows linearly from zero on the axis to its largest value at the surface. At ρ = 0.5 mm the circle encloses 5 A, and H is again 1592 A/m, by coincidence: a quarter of the current at half the radius.",
          claims: [{ instance: "c", readout: "Ienc", value: 5, unit: "A" }, { instance: "c", readout: "Hphi", value: 1591.55, unit: "A/m" }],
        },
        {
          id: "sheets", title: "Shells and sheets", patch: { c: SHEETS, eq: eqp(R`H_\phi=\dfrac{I_{\text{enc}}}{2\pi\rho}`, "H phi equals I enclosed over two pi rho") }, focus: ["c"],
          note: "A cylindrical current sheet is invisible from inside, like a charged shell in electrostatics: it only adds to circles larger than itself. Hayt Problem 7.11 puts a 20π mA filament inside sheets of 400, −250 and −300 mA/m at 1, 2 and 3 cm. At ρ = 1.5 cm the filament and the first sheet are enclosed, 87.96 mA, so Hφ = 0.9333 A/m.",
          claims: [{ instance: "c", readout: "Ienc", value: 0.0879646, unit: "A" }, { instance: "c", readout: "Hphi", value: 0.933333, unit: "A/m" }],
        },
        {
          id: "coax", title: "The coax", patch: { c: COAX }, focus: ["c"],
          note: "The coax puts it all together (Wentworth Example 3.8): an inner conductor of radius a carrying I, and an outer one from b to c carrying −I. H = Iρ/(2πa²) inside the inner conductor and I/(2πρ) between them. It falls to zero across the outer conductor and is zero outside, where the net enclosed current is zero. With a = 0.3, b = 0.5, c = 0.6 m and 2.5 A (Hayt D7.3), the result is H = −0.884ax A/m at (0, 0.2, 0).",
          claims: [{ instance: "c", readout: "Hx", value: -0.884194, unit: "A/m" }],
        },
      ],
      examples: [
        {
          id: "d7-7", level: "basic", title: "Hayt D7.7: inside a solid conductor",
          setup: { c: { ...WIRE, probe: [0.0005, 0, 0] } },
          problem: "20 A flows along az through a solid nonmagnetic wire of radius 1 mm centred on the z axis. Work out (a) Hφ at ρ = 0.5 mm, (b) Bφ at ρ = 0.8 mm and (c) how much magnetic flux, per metre of wire, lies inside it.",
          lines: [
            { text: "(a) I_enc = 20 × (0.5/1)² = 5 A, so Hφ = 5/(2π × 0.0005) = 1592 A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hphi", value: 1591.55, unit: "A/m" }] },
            { text: "(b) At 0.8 mm, H = 20 × 0.0008/(2π × 10⁻⁶) = 2546 A/m, so Bφ = μ₀H = 3.2 mT.", patch: { c: { probe: [0.0008, 0, 0] } }, focus: ["c"], claims: [{ instance: "c", readout: "Bmag", value: 0.0032, unit: "T" }] },
            { text: "(c) Φ' = ∫₀^a μ₀Iρ/(2πa²) dρ = μ₀I/(4π) = 2 µWb per metre, whatever the radius.", focus: ["eq"] },
          ],
          covers: ["text:hayt-d7.7"],
          trap: "Using all 20 A inside the wire: 6366 A/m at 0.5 mm, four times too much.",
        },
        {
          id: "f1415", level: "tutorial", title: "J, H and B in and out",
          setup: { c: { items: [{ id: "w", kind: "cylinder", I: 2, a: 0, b: 0.0002 }], probe: [0.0001, 0, 0], drawScale: 1000 } },
          problem: "A steady 2 A spreads evenly through a long, straight nonmagnetic wire 0.2 mm in radius. Work out J, then H and B both inside and outside the wire.",
          lines: [
            { text: "J = I/(πa²) = 2/(π(2 × 10⁻⁴)²) = 1.592 × 10⁷ az A/m².", focus: ["c"] },
            { text: "Inside: H = Iρ/(2πa²) = 7.958 × 10⁶ ρ aφ A/m, and B = μ₀H = 10.00ρ aφ T. At ρ = 0.1 mm, H = 795.8 A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hphi", value: 795.775, unit: "A/m" }] },
            { text: "Outside: H = I/(2πρ) = (0.3183/ρ) aφ A/m, and B = (4 × 10⁻⁷/ρ) aφ T.", focus: ["c"] },
          ],
          covers: ["f1415-q4"],
          trap: "Squaring 0.2 instead of 2 × 10⁻⁴: leaving mm unconverted is off by a factor of 10⁶.",
        },
        {
          id: "f2425", level: "exam", title: "Ampère inside a conductor",
          setup: { c: { items: [{ id: "w", kind: "cylinder", I: 50, a: 0, b: 0.008 }], probe: [0.004, 0, 0], drawScale: 40 } },
          problem: "A long, straight, nonmagnetic conductor of radius 8.00 mm carries a uniform d.c. current of 50.0 A along z. (i) State Ampère's circuital law. (ii) Find J. (iii) Develop H and B inside. (iv) State and justify ∇ × H outside.",
          lines: [
            { text: "(i) The line integral of H round any closed path equals the current it encloses: ∮H·dL = I_enc.", focus: ["eq"] },
            { text: "(ii) J = 50/(π × 0.008²) = 2.487 × 10⁵ az A/m².", focus: ["c"] },
            { text: "(iii) H = Iρ/(2πa²) = 1.243 × 10⁵ ρ aφ A/m and B = μ₀H = 0.1563ρ aφ T. At ρ = 4 mm, H = 497.4 A/m.", focus: ["c"], claims: [{ instance: "c", readout: "Hphi", value: 497.359, unit: "A/m" }] },
            { text: "(iv) Outside, J = 0, so ∇ × H = 0: with H = I/(2πρ) aφ, (1/ρ)d(ρHφ)/dρ = 0.", focus: ["eq"] },
          ],
          covers: ["f2425-q4a", "f2324-q4a", "f1718-q3a", "f2425r-q3a"],
          trap: "Stating the law as ∮B·dL = I. With B, it's μ₀I_enc; with H, it's I_enc.",
        },
      ],
      asks: [
        { id: "enc", q: "Why does H inside a wire grow with ρ?", tags: ["AMP_ENC_INSIDE"], a: "A bigger circle encloses more current, I(ρ/a)², while its circumference grows only as ρ. So H = Iρ/(2πa²) rises linearly until the surface." },
        { id: "when", q: "When does Ampère's law give H directly?", a: "When symmetry makes H constant in size and parallel to dL along a path you can draw: long wires, cylinders, coaxes, sheets, solenoids and toroids." },
        { id: "drawback", q: "One drawback and one advantage of Ampère's law?", a: "Drawback: it only yields H when there's enough symmetry. Advantage: when there is, it replaces a Biot–Savart integral with one line. Exam questions ask exactly this." },
        { id: "outside-coax", q: "Why is H zero outside a coax?", a: "A circle outside encloses I from the inner conductor and −I from the outer one: zero net current. So ∮H·dL = 0 and, by symmetry, H = 0. Coax cables don't leak magnetic field." },
        { id: "sheet", q: "What does an infinite flat current sheet give?", a: "H = ½K × aN: uniform on each side and reversed across it (Wentworth Example 3.6), like a charged sheet's E." },
        { id: "solenoid", q: "And a long solenoid?", a: "H = NI/ℓ inside, along the axis, and nearly zero outside (Wentworth Example 3.9). Its two sides act like a pair of opposite current sheets." },
      ],
      checks: [
        {
          id: "enc-c", title: "Check: the enclosed current", show: ["axes", "c", "eq"], patch: { c: WIRE },
          note: "Seven checks on Ampère's law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "enc-c", type: "choose", prompt: "Inside a solid wire with uniform current, at half the radius, the circle encloses…", dimension: "conceptual",
            options: [
              choice("quarter", "a quarter of I", true, "Right: (ρ/a)² = ¼."),
              choice("half", "half of I", false, "Current goes with area, which goes as ρ²."),
              choice("all", "all of I", false, "Only the current inside the circle counts.", "AMP_ENC_INSIDE"),
            ] },
        },
        {
          id: "predict-sheet", title: "Check: past another sheet",
          note: "Predict first; then the plate shows the result.",
          patch: { c: SHEETS },
          interaction: { id: "predict-sheet", type: "predict-drag", prompt: "Move the probe out to ρ = 2.5 cm, past the −250 mA/m sheet. Drag Hφ to your prediction.", target: { instance: "c", readout: "Hphi" }, range: [0, 2], unit: "A/m", relTol: 0.05, reveal: { c: { probe: [0.025, 0, 0] } }, dimension: "conceptual",
            feedback: { close: "Right: 56.55 mA enclosed, Hφ = 0.36 A/m.", far: "The −250 mA/m sheet removes 31.42 mA: 56.55 mA, so Hφ = 0.36 A/m." } },
          covers: ["f1415-q3b"],
        },
        {
          id: "inside-num", title: "Check: inside a wire, your numbers",
          note: "Numbers of your own, in mm.",
          interaction: { id: "inside-num", type: "numeric", prompt: ai.prompt, answer: ai.spec.answer, distractors: ai.spec.distractors, relTol: ai.spec.relTol, hints: ai.hints, template: "amp-inside", dimension: "computational" },
        },
        {
          id: "ict2-1b", title: "Check: |H| outside a solid conductor",
          note: "Outside this time.",
          interaction: { id: "ict2-1b", type: "numeric", prompt: "A conductor of radius 5 cm carries 100 A uniformly along az. Find |H| at a point 22 cm from its axis, in A/m.", answer: { value: 72.3432, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 1400.55, unit: "A/m", errorClass: "conceptual", tag: "AMP_ENC_INSIDE", feedback: "That's the inside formula. At 22 cm you're outside, where all 100 A is enclosed." }],
            hints: ["22 cm > 5 cm: outside the conductor.", "H = I/(2πρ).", "100/(2π × 0.22)."] },
          covers: ["ict2-2425-q1"],
        },
        {
          id: "hw03-b", title: "Check: |H| inside a conductor",
          note: "Inside this time.",
          interaction: { id: "hw03-b", type: "numeric", prompt: "J = 95.49 kA/m² flows uniformly in a conductor of radius 20.0 mm. Find |H| at ρ = 15 mm, in A/m.", answer: { value: 716.175, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 1273.2, unit: "A/m", errorClass: "conceptual", tag: "AMP_ENC_INSIDE", feedback: "That uses the whole 120 A. Inside, H = Jρ/2." }],
            hints: ["Inside: H · 2πρ = Jπρ².", "So H = Jρ/2.", "95 490 × 0.015/2."] },
          covers: ["hw03-2425-3.1b"],
        },
        {
          id: "coax-c", title: "Check: between the conductors",
          note: "The coax.",
          interaction: { id: "coax-c", type: "choose", prompt: "In a coax (inner radius a, outer conductor from b to c, current I), for a < ρ < b, H =", dimension: "recognition",
            options: [
              choice("right", "I/(2πρ) aφ", true, "Right: the whole inner current is enclosed, and none of the return."),
              choice("inside", "Iρ/(2πa²) aφ", false, "That's inside the inner conductor.", "AMP_ENC_INSIDE"),
              choice("zero", "0", false, "Only outside the whole cable."),
            ] },
          covers: ["f2425-q3a", "f1415-q2a"],
        },
        {
          id: "hollow-c", title: "Check: a hollow conductor",
          note: "Last one.",
          interaction: { id: "hollow-c", type: "choose", prompt: "A hollow conductor with inner radius a and outer radius b carries I along z. For ρ < a, H is…", dimension: "conceptual",
            options: [
              choice("zero", "0", true, "Right: a circle inside the hole encloses no current."),
              choice("full", "I/(2πρ)", false, "The current is all outside the circle.", "AMP_ENC_INSIDE"),
              choice("lin", "Iρ/(2πa²)", false, "That's a solid conductor."),
            ] },
          covers: ["f2324-q3b", "f1718-q3b"],
        },
      ],
      recap: {
        points: [
          "∮H·dL = I_enc; pick a path where H is constant and along dL.",
          "Long wire: I/(2πρ) outside, Iρ/(2πa²) inside.",
          "Sheets and shells only add to circles larger than themselves.",
          "Coax: Iρ/(2πa²), then I/(2πρ), falling to zero outside.",
        ],
        traps: ["The whole current inside a conductor.", "mm left unconverted.", "μ in Ampère's law with H."],
      },
    },
  ],
});
