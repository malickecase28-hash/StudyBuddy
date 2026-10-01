import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const W51 = { f: 1e9, er: 9, sigma: 0.1, E0: 10, z: 0, t: 0 };
const D114 = { f: 3e6, er: 3.2, sigma: 1.5e-4, E0: 1, z: 0, t: 0 };

export const ideaLossy = defineIdeaPlate({
  id: "idea-lossy",
  title: "Lossy media",
  requires: { objectives: [1], items: ["text:went-ex5.1", "text:went-ex5.3", "text:hayt-d11.4", "text:went-ch4-drill"], misconceptions: ["LOSS_TAN"] },
  instances: [
    { id: "pw", component: "plane-wave", params: W51 },
    { id: "eq", component: "equation", params: eqp(R`\gamma=\alpha+j\beta=\sqrt{j\omega\mu(\sigma+j\omega\varepsilon)}`, "gamma equals alpha plus j beta") },
  ],
  ideas: [
    {
      id: "lossy",
      title: "Lossy media",
      objectives: [1],
      explain: [
        {
          id: "gamma", title: "The propagation constant γ", show: ["pw", "eq"], focus: ["pw", "eq"],
          note: "In a medium with conductivity, the wave both travels and decays: γ = √(jωμ(σ + jωε)) = α + jβ. Wentworth Example 5.1: σ = 0.100 S/m, εr = 9.00 and f = 1.00 GHz give γ = 6.25 + j63.2 per metre. So α = 6.25 Np/m and β = 63.2 rad/m (the book rounds β to 63.1).",
          claims: [{ instance: "pw", readout: "alpha", value: 6.24807, unit: "Np/m" }, { instance: "pw", readout: "beta", value: 63.185, unit: "rad/m" }],
        },
        {
          id: "eta", title: "A complex η", patch: { eq: eqp(R`\eta=\sqrt{\dfrac{j\omega\mu}{\sigma+j\omega\varepsilon}}=|\eta|\angle\theta_\eta`, "eta equals the square root of j omega mu over sigma plus j omega epsilon") }, focus: ["pw", "eq"],
          note: "The intrinsic impedance becomes complex too: η = √(jωμ/(σ + jωε)) = 124∠5.6° Ω here. H now lags E by θη = 5.6°. In Wentworth Example 5.3, a 10.0 V/m field in this medium carries an H of peak 10.0/124.4 = 80.4 mA/m, lagging by 0.0986 rad.",
          claims: [{ instance: "pw", readout: "eta", value: 124.355, unit: "Ω" }, { instance: "pw", readout: "thetaEta", value: 5.64735, unit: "°" }],
        },
        {
          id: "lt", title: "The loss tangent decides", patch: { eq: eqp(R`\tan\delta_\ell=\dfrac{\sigma}{\omega\varepsilon}`, "the loss tangent equals sigma over omega epsilon") }, focus: ["pw", "eq"],
          note: "How lossy is lossy? The loss tangent σ/(ωε) decides; here it is 0.200. Well below 1 the medium is a good dielectric: α ≈ (σ/2)√(μ/ε) and β ≈ ω√(με). Well above 1 it is a good conductor: α ≈ β ≈ √(πfμσ). In between, use the full γ.",
          claims: [{ instance: "pw", readout: "lossTan", value: 0.199723, unit: "" }],
        },
        {
          id: "decay", title: "Decay with depth", patch: { pw: { z: 0.16005 } }, focus: ["pw"],
          note: "The amplitude falls as e^(−αz). After z = 1/α = 16.0 cm it is down to e⁻¹ of its starting value: 3.679 V/m. That's less than two wavelengths into this medium, which is what 'lossy' means in practice.",
          claims: [{ instance: "pw", readout: "Eamp", value: 3.67879, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "d11-4", level: "basic", title: "Hayt D11.4: a slightly lossy material",
          setup: { pw: D114 },
          problem: "A nonmagnetic material has εr = 3.2 and σ = 1.5 × 10⁻⁴ S/m. At 3 MHz find the loss tangent, α, β and η.",
          lines: [
            { text: "σ/(ωε) = 1.5 × 10⁻⁴/(2π × 3 × 10⁶ × 3.2ε₀) = 0.281.", focus: ["pw"], claims: [{ instance: "pw", readout: "lossTan", value: 0.280861, unit: "" }] },
            { text: "γ = √(jωμ(σ + jωε)) gives α = 0.0156 Np/m and β = 0.114 rad/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "alpha", value: 0.0156443, unit: "Np/m" }, { instance: "pw", readout: "beta", value: 0.113558, unit: "rad/m" }] },
            { text: "η = 207∠7.8° Ω.", focus: ["pw"], claims: [{ instance: "pw", readout: "eta", value: 206.639, unit: "Ω" }, { instance: "pw", readout: "thetaEta", value: 7.84399, unit: "°" }] },
          ],
          covers: ["text:hayt-d11.4"],
          trap: "Using f instead of ω in the loss tangent: 1.77, which would wrongly call this a conductor.",
        },
        {
          id: "ex5-3", level: "tutorial", title: "Wentworth Example 5.3: H from E in a lossy medium",
          setup: { pw: W51 },
          problem: "In the medium of Example 5.1 (σ = 0.100 S/m, εr = 9.00, f = 1.00 GHz), E(z, t) = 10.0e^(−6.25z) cos(2π × 10⁹t − 63.2z) ax V/m. Find H(z, t).",
          lines: [
            { text: "Phasor: Es = 10.0e^(−6.25z)e^(−j63.2z) ax. Dividing by η = 124.4∠5.6° Ω gives Hs along ay.", focus: ["pw", "eq"], claims: [{ instance: "pw", readout: "eta", value: 124.355, unit: "Ω" }] },
            { text: "H(z, t) = 80.4e^(−6.25z) cos(2π × 10⁹t − 63.2z − 0.0986) ay mA/m: smaller by |η| and behind by θη = 0.0986 rad.", focus: ["pw"] },
          ],
          covers: ["text:went-ex5.1", "text:went-ex5.3"],
          trap: "Forgetting the phase shift: in a lossy medium H isn't in phase with E.",
        },
        {
          id: "drill", level: "exam", title: "Wentworth Ch. 4 drill: an attenuated wave",
          setup: { pw: { ...W51, E0: 34 } },
          givens: [{ value: 34, unit: "V/m" }, { value: 1, unit: "V/m" }, { value: 1e9, unit: "Hz" }],
          problem: "E(z, t) = 34e^(−0.002z) cos(2π × 10⁹t − 10πz + 45°) V/m. Find (a) the initial amplitude, (b) α, (c) f, (d) λ, (e) the phase in radians, (f) how far the wave travels before its amplitude falls to 1.0 V/m.",
          lines: [
            { text: "(a) 34 V/m. (b) α = 0.002 Np/m. (c) ω = 2π × 10⁹ rad/s, so f = 1 GHz.", focus: ["eq"], givens: [{ value: 34, unit: "V/m" }, { value: 1e9, unit: "Hz" }] },
            { text: "(d) β = 10π rad/m, so λ = 2π/β = 20 cm. (e) φ = 45° = π/4 rad.", focus: ["eq"] },
            { text: "(f) 34e^(−0.002z) = 1 gives z = ln 34/0.002 = 1.763 km.", focus: ["eq"] },
          ],
          covers: ["text:went-ch4-drill"],
          trap: "Reading 10π as the wavelength. It's β; λ = 2π/β.",
        },
      ],
      asks: [
        { id: "lt", q: "What's the loss tangent?", tags: ["LOSS_TAN"], a: "σ/(ωε): the ratio of conduction to displacement current. Small means a good dielectric; large means a good conductor." },
        { id: "ab", q: "What are α and β physically?", a: "α (Np/m) sets how fast the amplitude decays, as e^(−αz); β (rad/m) sets how fast the phase advances, giving λ = 2π/β." },
        { id: "lag", q: "Why does H lag E in a lossy medium?", a: "η = |η|∠θη is complex, and H = E/η, so H is smaller by |η| and behind by θη: from 0° (lossless) up to 45° (a good conductor)." },
        { id: "neper", q: "What's a neper?", a: "The natural-log unit of attenuation: 1 Np/m means the amplitude falls by a factor of e every metre. 1 Np ≈ 8.686 dB." },
        { id: "both", q: "Can one material be both a dielectric and a conductor?", a: "Yes, at different frequencies. Seawater conducts strongly at low radio frequencies and leans toward a lossy dielectric in the microwave range, because Jd = ωεE grows with frequency." },
        { id: "full", q: "When must I use the full γ?", a: "When σ/(ωε) is between about 0.1 and 10. Outside that range the dielectric or conductor approximations are within a few per cent." },
      ],
      checks: [
        {
          id: "lt-c", title: "Check: classify the medium", show: ["pw", "eq"], patch: { pw: W51 },
          note: "Four checks on lossy media. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "lt-c", type: "choose", prompt: "A medium with σ/(ωε) = 1000 is…", dimension: "conceptual",
            options: [
              choice("cond", "a good conductor", true, "Right: conduction current dominates."),
              choice("diel", "a good dielectric", false, "The ratio is inverted.", "LOSS_TAN"),
              choice("lossless", "lossless", false, "Lossless needs σ = 0."),
            ] },
        },
        {
          id: "predict-sigma", title: "Check: double the conductivity",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-sigma", type: "predict-drag", prompt: "Double σ to 0.2 S/m in Example 5.1's medium. Drag α to your prediction.", target: { instance: "pw", readout: "alpha" }, range: [0, 30], unit: "Np/m", relTol: 0.05, reveal: { pw: { sigma: 0.2 } }, dimension: "conceptual",
            feedback: { close: "Right: about double, 12.32 Np/m.", far: "Here α is nearly ∝ σ: 12.32 Np/m." } },
        },
        {
          id: "alpha-num", title: "Check: Hayt D11.4's α",
          note: "A number.",
          patch: { pw: D114 },
          interaction: { id: "alpha-num", type: "numeric", prompt: "εr = 3.2, σ = 1.5 × 10⁻⁴ S/m, μr = 1, at 3 MHz. Find α, in Np/m.", answer: { value: 0.0156443, unit: "Np/m" }, relTol: 0.02, dimension: "computational",
            distractors: [{ value: 0.113558, unit: "Np/m", errorClass: "conceptual", tag: "WAVE_BETA_LAMBDA", feedback: "That's β. α is the real part of γ." }],
            hints: ["γ² = jωμ(σ + jωε).", "Or, as a good dielectric: α ≈ (σ/2)√(μ/ε).", "α is the real part."] },
        },
        {
          id: "lag-c", title: "Check: E and H",
          note: "Last one.",
          interaction: { id: "lag-c", type: "choose", prompt: "In a lossy medium, H relative to E…", dimension: "recognition",
            options: [
              choice("lag", "lags by θη", true, "Right."),
              choice("phase", "is in phase", false, "Only when σ = 0."),
              choice("lead", "leads by 90°", false, "The lag is at most 45°."),
            ] },
        },
      ],
      recap: {
        points: ["γ = √(jωμ(σ + jωε)) = α + jβ; η = |η|∠θη.", "The loss tangent σ/(ωε) classifies the medium.", "The amplitude decays as e^(−αz); H lags E by θη."],
        traps: ["f for ω.", "β taken as λ.", "H in phase with E in a lossy medium."],
      },
    },
  ],
});
