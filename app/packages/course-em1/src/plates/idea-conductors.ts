import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const sd = instantiate(templates.find((t) => t.id === "skin-depth")!, 1);
const CU1G = { f: 1e9, er: 1, sigma: 5.8e7, E0: 1, z: 0, t: 0 };

export const ideaConductors = defineIdeaPlate({
  id: "idea-conductors",
  title: "Dielectrics versus conductors; skin depth",
  requires: { objectives: [2], items: ["text:went-ex5.4", "text:went-ex5.7", "f2425r-q4c", "f2324-q4b", "hw04-2425-4.3"], misconceptions: ["SKIN_DEPTH"] },
  instances: [
    { id: "pw", component: "plane-wave", params: CU1G },
    { id: "eq", component: "equation", params: eqp(R`\alpha=\beta=\sqrt{\pi f\mu\sigma},\qquad \delta=\dfrac1\alpha`, "alpha equals beta equals root pi f mu sigma, and delta is one over alpha") },
  ],
  ideas: [
    {
      id: "conductors",
      title: "Dielectrics versus conductors; skin depth",
      objectives: [2],
      explain: [
        {
          id: "good", title: "Good conductors", show: ["pw", "eq"], focus: ["pw", "eq"],
          note: "When σ/(ωε) ≫ 1 the full γ simplifies to α = β = √(πfμσ). Copper at 1 GHz has σ/(ωε₀) = 1.04 × 10⁹, so α = β = 4.785 × 10⁵ per metre (Wentworth Example 5.4). The wave decays as fast as its phase turns: it dies within a fraction of a wavelength.",
          claims: [{ instance: "pw", readout: "alpha", value: 478513, unit: "Np/m" }, { instance: "pw", readout: "lossTan", value: 1.04256e9, unit: "" }],
        },
        {
          id: "skin", title: "Skin depth", focus: ["pw", "eq"],
          note: "The skin depth δ = 1/α = 1/√(πfμσ) is the depth at which the amplitude falls to e⁻¹, or 36.8%. For copper at 1 GHz, δ = 2.090 µm. High-frequency currents crowd into this thin skin, which is why RF conductors are plated or stranded, and why a thin metal sheet shields so well.",
          claims: [{ instance: "pw", readout: "delta", value: 2.08981e-6, unit: "m" }],
        },
        {
          id: "slow", title: "Slow waves, tiny η", focus: ["pw"],
          note: "Inside the metal, u = ω/β = 13.13 km/s, far slower than light, and η = 0.01167 Ω at 45°: almost a short circuit. That mismatch with free space's 377 Ω is why most of an incident wave reflects from a metal surface.",
          claims: [{ instance: "pw", readout: "u", value: 13130.6, unit: "m/s" }, { instance: "pw", readout: "eta", value: 0.0116676, unit: "Ω" }, { instance: "pw", readout: "thetaEta", value: 45, unit: "°" }],
        },
        {
          id: "sea", title: "Seawater", patch: { pw: { f: 1e6, er: 81, sigma: 4 } }, focus: ["pw"],
          note: "Seawater at 1 MHz: σ/(ωε) = 888, a good conductor. δ = 25.18 cm and λ = 1.580 m. A thousand times lower in frequency, δ grows to about 8 metres, which is why submarines communicate at very low frequencies.",
          claims: [{ instance: "pw", readout: "delta", value: 0.251788, unit: "m" }, { instance: "pw", readout: "lambda", value: 1.58025, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "ex5-7", level: "basic", title: "Wentworth Example 5.7: copper at 10 MHz",
          setup: { pw: { ...CU1G, f: 1e7 } },
          problem: "Find α, the skin depth and η for copper (σ = 5.8 × 10⁷ S/m) at 10 MHz.",
          lines: [
            { text: "α = √(πfμσ) = √(π × 10⁷ × 4π × 10⁻⁷ × 5.8 × 10⁷) = 4.785 × 10⁴ Np/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "alpha", value: 47851.3, unit: "Np/m" }] },
            { text: "δ = 1/α = 20.90 µm.", focus: ["pw"], claims: [{ instance: "pw", readout: "delta", value: 2.08981e-5, unit: "m" }] },
            { text: "η = √(ωμ/σ)∠45° = 0.001167 Ω∠45°.", focus: ["pw"], claims: [{ instance: "pw", readout: "eta", value: 0.00116676, unit: "Ω" }] },
          ],
          covers: ["text:went-ex5.7"],
          trap: "Dropping the square root: 1/(πfμσ) is not a length.",
        },
        {
          id: "sea1k", level: "tutorial", title: "Seawater at 1 kHz",
          setup: { pw: { f: 1e3, er: 81, sigma: 4, E0: 1, z: 0, t: 0 } },
          givens: [{ value: 1e6, unit: "Hz" }],
          problem: "Find the skin depth in seawater (σ = 4 S/m, εr = 81) at 1 kHz, and compare it with that at 1 MHz.",
          lines: [
            { text: "σ/(ωε) = 8.877 × 10⁵: a very good conductor, so α ≈ √(πfμσ).", focus: ["pw"], claims: [{ instance: "pw", readout: "lossTan", value: 887659, unit: "" }] },
            { text: "δ = 1/√(π × 10³ × 4π × 10⁻⁷ × 4) = 7.958 m.", focus: ["pw"], claims: [{ instance: "pw", readout: "delta", value: 7.95775, unit: "m" }] },
            { text: "At 1 MHz, δ = 25.18 cm: √1000 ≈ 31.6 times smaller, since δ ∝ 1/√f.", focus: ["pw"], givens: [{ value: 1e6, unit: "Hz" }] },
          ],
          covers: ["text:went-ex5.4"],
          trap: "Scaling δ by 1000 for a 1000× change in f. It scales as 1/√f.",
        },
        {
          id: "compare", level: "exam", title: "Resit Q4(c), Finals 2023-24 Q4(b) and HW04 4.3(a): dielectric versus conductor",
          setup: { pw: CU1G },
          problem: "Using appropriate diagrams, compare the propagation of EM waves in a dielectric and in a conductor.",
          lines: [
            { text: "Lossless dielectric (σ ≈ 0): α = 0, so the amplitude stays constant. β = ω√(με) and u = 1/√(με) < c. η = √(μ/ε) is real, so E and H are in phase.", focus: ["eq"] },
            { text: "Good conductor (σ ≫ ωε): α = β = √(πfμσ), so the wave decays within a few skin depths δ = 1/α. η = √(ωμ/σ)∠45° is tiny, and H lags E by 45°.", focus: ["pw"] },
            { text: "Diagrams: a constant-amplitude sinusoid for the dielectric; a sinusoid inside a shrinking exponential envelope for the conductor.", focus: ["pw"] },
          ],
          covers: ["f2425r-q4c", "f2324-q4b", "hw04-2425-4.3"],
          trap: "Saying waves can't enter conductors at all. They do, but only about a skin depth.",
        },
      ],
      asks: [
        { id: "skin-diel", q: "Is there a skin depth in a lossless dielectric?", tags: ["SKIN_DEPTH"], a: "No. There α = 0, so the wave never decays and δ = 1/α is infinite. Skin depth matters only in lossy media, above all in conductors." },
        { id: "sqrt", q: "Why the square root in δ?", tags: ["SKIN_DEPTH"], a: "In a good conductor α = √(πfμσ): attenuation grows as the square root of frequency and conductivity, not in proportion." },
        { id: "45", q: "Why is η's angle 45° in a conductor?", a: "η ≈ √(jωμ/σ) = √(ωμ/σ)∠45°. The j under the square root gives exactly 45°." },
        { id: "shield", q: "How thick must a shield be?", a: "A few skin depths. Five δ cuts the field to e⁻⁵, under 1%: about 10 µm of copper in the gigahertz range." },
        { id: "diel", q: "How does a wave in a good dielectric behave?", a: "It barely decays (α is small), travels at almost 1/√(με), and E and H stay almost in phase." },
        { id: "rf", q: "Why does the skin effect matter in RF engineering?", a: "Current flows only in the outer δ of a conductor, so its AC resistance is far above its DC resistance. Hayt D11.7's steel pipe shows the effect." },
      ],
      checks: [
        {
          id: "cond-c", title: "Check: a good conductor", show: ["pw", "eq"], patch: { pw: CU1G },
          note: "Four checks on conductors and skin depth. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "cond-c", type: "choose", prompt: "In a good conductor, α and β…", dimension: "recognition",
            options: [
              choice("equal", "are equal, both √(πfμσ)", true, "Right."),
              choice("zero", "α = 0", false, "That's a lossless medium."),
              choice("c", "β = ω/c", false, "That's free space.", "WAVE_MEDIUM"),
            ] },
        },
        {
          id: "predict-4f", title: "Check: four times the frequency",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-4f", type: "predict-drag", prompt: "Quadruple the frequency in the copper. Drag δ to your prediction.", target: { instance: "pw", readout: "delta" }, range: [0, 3e-6], unit: "m", relTol: 0.05, reveal: { pw: { f: 4e9 } }, dimension: "conceptual",
            feedback: { close: "Right: halved, to 1.045 µm.", far: "δ ∝ 1/√f: half, 1.045 µm." } },
        },
        {
          id: "skin-num", title: "Check: a skin depth, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "skin-num", type: "numeric", prompt: sd.prompt, answer: sd.spec.answer, distractors: sd.spec.distractors, relTol: sd.spec.relTol, hints: sd.hints, template: "skin-depth", dimension: "computational" },
        },
        {
          id: "compare-c", title: "Check: dielectric or conductor",
          note: "Last one.",
          interaction: { id: "compare-c", type: "choose", prompt: "Compared with a wave in a lossless dielectric, a wave in a good conductor…", dimension: "conceptual",
            options: [
              choice("right", "decays within a few skin depths, with H lagging E by 45°", true, "Right."),
              choice("faster", "travels faster", false, "It's far slower: u = ω/β with a huge β."),
              choice("same", "behaves the same", false, "σ changes everything."),
            ] },
          covers: ["f2425r-q4c"],
        },
      ],
      recap: {
        points: ["Good conductor: α = β = √(πfμσ); η = √(ωμ/σ)∠45°.", "Skin depth δ = 1/α; δ ∝ 1/√f.", "Good dielectric: α small, u ≈ 1/√(με), E and H nearly in phase."],
        traps: ["No square root in δ.", "A skin depth in a lossless medium.", "δ scaled by f instead of √f."],
      },
    },
  ],
});
