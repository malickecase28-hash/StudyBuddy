import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
import { templates } from "../templates";

// R, choice, eqp as in Task 5.
const sol = instantiate(templates.find((t) => t.id === "ind-solenoid")!, 1);
const cox = instantiate(templates.find((t) => t.id === "ind-coax")!, 1);
const D813 = { kind: "solenoid" as const, N: 1500, radius: 0.01, length: 0.5, mur: 75, I: 2 };

export const ideaSelfInductance = defineIdeaPlate({
  id: "idea-self-inductance",
  title: "Self-inductance",
  requires: { objectives: [0], items: ["text:hayt-d8.13", "text:hayt-d8.12", "f1718-q4b", "f1415-q2b"], misconceptions: ["IND_TURNS", "IND_LN"] },
  instances: [
    { id: "ind", component: "inductor", params: D813 },
    { id: "eq", component: "equation", params: eqp(R`L=\dfrac{N\Phi}{I}`, "L equals N phi over I") },
  ],
  ideas: [
    {
      id: "self",
      title: "Self-inductance",
      objectives: [0],
      explain: [
        {
          id: "def", title: "L = NΦ/I", show: ["ind", "eq"], focus: ["ind", "eq"],
          note: "A current I in a coil makes a flux Φ through each of its N turns. The flux linkage NΦ is proportional to I, and the constant is the self-inductance: L = NΦ/I, in henries. Like capacitance, L depends only on geometry and material. Hayt D8.13(a): a solenoid 50 cm long and 2 cm in diameter, with 1500 turns on a core of μr = 75, has L = μN²S/ℓ = 133.2 mH.",
          claims: [{ instance: "ind", readout: "L", value: 0.13324, unit: "H" }],
        },
        {
          id: "n2", title: "Why N²", patch: { ind: { N: 750 } }, focus: ["ind"],
          note: "Halve the turns to 750 and L falls to a quarter, 33.31 mH. N appears twice: N turns make the field (H = NI/ℓ), and the resulting flux links all N turns. Doubling the radius would quadruple L too, through the area S = πr².",
          claims: [{ instance: "ind", readout: "L", value: 0.0333099, unit: "H" }],
        },
        {
          id: "toroid", title: "The toroid", patch: { ind: { kind: "toroid", N: 500, a: 0.02, b: 0.045, h: 0.025, mur: 1 }, eq: eqp(R`L=\dfrac{\mu N^2h}{2\pi}\ln\dfrac{b}{a}`, "L equals mu N squared h over two pi times the natural log of b over a") }, focus: ["ind", "eq"],
          note: "In a toroid the field is trapped inside the core: H = NI/(2πρ). For a rectangular cross-section of height h between radii a and b, integrating the flux gives L = (μN²h/2π) ln(b/a). Hayt D8.12(b): 500 turns on a 2.5 cm square fibreglass form with an inner radius of 2 cm gives 1.014 mH.",
          claims: [{ instance: "ind", readout: "L", value: 0.00101366, unit: "H" }],
        },
        {
          id: "lines", title: "Coax and two-wire lines", patch: { ind: { kind: "coax", a: 0.0008, b: 0.004, length: 3.5, mur: 50 }, eq: eqp(R`L=\dfrac{\mu\ell}{2\pi}\ln\dfrac{b}{a}`, "L equals mu ell over two pi times the natural log of b over a") }, focus: ["ind", "eq"],
          note: "For a coax, the flux between the conductors gives the external inductance L = (μℓ/2π) ln(b/a) (Wentworth §3.9). Hayt D8.12(a): 3.5 m of coax with a = 0.8 mm, b = 4 mm and μr = 50 has 56.33 µH. At low frequency the conductor's own internal flux adds μ/(8π) per metre. Two parallel wires of radius a and separation s give L' = (μ/π) ln((s − a)/a), plus μ/(4π) internal.",
          claims: [{ instance: "ind", readout: "L", value: 5.63303e-5, unit: "H" }],
        },
      ],
      examples: [
        {
          id: "solenoid", level: "basic", title: "Hayt D8.13(a): a cored solenoid",
          setup: { ind: D813 },
          problem: "1500 turns are wound on a core 50 cm long and 2 cm across, with μr = 75. What is the solenoid's L?",
          lines: [
            { text: "S = π(0.01)² = 3.142 × 10⁻⁴ m², with the radius, not the diameter.", focus: ["ind"] },
            { text: "L = μN²S/ℓ = 75 × 4π × 10⁻⁷ × 1500² × 3.142 × 10⁻⁴/0.5 = 133.2 mH.", focus: ["ind"], claims: [{ instance: "ind", readout: "L", value: 0.13324, unit: "H" }] },
          ],
          covers: ["text:hayt-d8.13"],
          trap: "Using 2 cm as the radius makes L four times too large.",
        },
        {
          id: "coax", level: "tutorial", title: "Hayt D8.12(a): a coax",
          setup: { ind: { kind: "coax", a: 0.0008, b: 0.004, length: 3.5, mur: 50, I: 2 } },
          problem: "A 3.5 m length of coax has a = 0.8 mm, b = 4 mm and a filling with μr = 50. What is its self-inductance?",
          lines: [
            { text: "ln(b/a) = ln 5 = 1.609; μ/2π = 50 × 2 × 10⁻⁷ = 10⁻⁵ H/m.", focus: ["ind"] },
            { text: "L = 10⁻⁵ × 1.609 × 3.5 = 56.33 µH (external only, as Hayt intends).", focus: ["ind"], claims: [{ instance: "ind", readout: "L", value: 5.63303e-5, unit: "H" }] },
          ],
          covers: ["text:hayt-d8.12"],
          trap: "log₁₀ 5 = 0.699 gives 24.5 µH. The flux integral gives the natural log.",
        },
        {
          id: "lines", level: "exam", title: "Derive them",
          setup: { ind: { kind: "twowire", a: 0.001, s: 0.1, length: 1, mur: 1, internal: true, I: 1 } },
          problem: "Derive L per metre, in air, for (a) coax with radii a and b and (b) two parallel wires of radius a spaced s apart. Then put a = 1 mm and s = 10 cm into (b).",
          lines: [
            { text: "(a) Between the conductors B = μI/(2πρ), so the flux per metre is ∫_a^b μI/(2πρ) dρ = (μI/2π) ln(b/a), and L' = (μ/2π) ln(b/a). The inner conductor's own flux adds μ/(8π).", focus: ["eq"] },
            { text: "(b) Between the wires, both fields add: Φ' = ∫_a^(s−a) [μ₀I/(2πx) + μ₀I/(2π(s − x))] dx = (μ₀I/π) ln((s − a)/a).", focus: ["ind"] },
            { text: "L' = (μ₀/π)[ln((s − a)/a) + ¼] = 4 × 10⁻⁷ × (ln 99 + 0.25) = 1.938 µH/m (1.838 µH/m external).", focus: ["ind"], claims: [{ instance: "ind", readout: "L", value: 1.93805e-6, unit: "H" }] },
          ],
          covers: ["f1718-q4b", "f1415-q2b"],
          trap: "Counting only one wire's field between them halves the external part. Both currents' fields point the same way between the wires.",
        },
      ],
      asks: [
        { id: "n2", q: "Why does L go as N²?", tags: ["IND_TURNS"], a: "N turns make the field, so Φ ∝ N; and that flux links all N turns, so NΦ ∝ N². Double the turns, quadruple the inductance." },
        { id: "henry", q: "What is a henry?", a: "1 H = 1 Wb/A: one weber of flux linkage per ampere. Equivalently 1 V·s/A, since v = L di/dt." },
        { id: "ln", q: "Why ln(b/a) in the coax?", tags: ["IND_LN"], a: "B = μI/(2πρ) between the conductors, and integrating 1/ρ from a to b gives the natural log." },
        { id: "internal", q: "When do I include internal inductance?", a: "At low frequency, when current fills the conductor: add μ/(8π) per metre per conductor. At high frequency the skin effect pushes current to the surface, and the internal term fades." },
        { id: "toroid", q: "Why is a toroid a good inductor?", a: "Its field stays inside the core, so it neither leaks flux nor picks up interference, and its L follows from a single Ampère circle." },
        { id: "core", q: "What does an iron core do?", a: "Multiplies L by μr: the same H makes μr times the flux. That's why practical inductors use ferrite or iron cores." },
      ],
      checks: [
        {
          id: "n-c", title: "Check: doubling the turns", show: ["ind", "eq"], patch: { ind: D813 },
          note: "Four checks on inductance. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "n-c", type: "choose", prompt: "Doubling the turns of a solenoid, keeping its length and radius, multiplies L by…", dimension: "conceptual",
            options: [
              choice("four", "4", true, "Right: L ∝ N²."),
              choice("two", "2", false, "The flux links every turn too: N².", "IND_TURNS"),
              choice("one", "1", false, "More turns, more field, more linkage."),
            ] },
        },
        {
          id: "predict-core", title: "Check: remove the core",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-core", type: "predict-drag", prompt: "Remove the core (μr from 75 to 1). Drag L to your prediction.", target: { instance: "ind", readout: "L" }, range: [0, 0.2], unit: "H", relTol: 0.05, reveal: { ind: { mur: 1 } }, dimension: "conceptual",
            feedback: { close: "Right: 1.777 mH, a 75th.", far: "L ∝ μ: 133.2/75 = 1.777 mH." } },
        },
        {
          id: "sol-num", title: "Check: a solenoid, your numbers",
          note: "Numbers of your own, in cm.",
          interaction: { id: "sol-num", type: "numeric", prompt: sol.prompt, answer: sol.spec.answer, distractors: sol.spec.distractors, relTol: sol.spec.relTol, hints: sol.hints, template: "ind-solenoid", dimension: "computational" },
        },
        {
          id: "coax-num", title: "Check: a coax, your numbers",
          note: "Last one.",
          interaction: { id: "coax-num", type: "numeric", prompt: cox.prompt, answer: cox.spec.answer, distractors: cox.spec.distractors, relTol: cox.spec.relTol, hints: cox.hints, template: "ind-coax", dimension: "computational" },
        },
      ],
      recap: {
        points: [
          "L = NΦ/I, in henries; it depends only on geometry and μ.",
          "Solenoid: μN²S/ℓ. Toroid: (μN²h/2π) ln(b/a).",
          "Coax: (μℓ/2π) ln(b/a), plus μ/(8π) per metre internal.",
          "Two-wire: (μ/π) ln((s − a)/a) per metre, plus μ/(4π) internal.",
        ],
        traps: ["N instead of N².", "Diameter for radius.", "log₁₀ for ln."],
      },
    },
  ],
});
