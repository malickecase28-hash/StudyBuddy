import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const wl = instantiate(templates.find((t) => t.id === "wave-lambda")!, 1);
const AIR = { f: 1e8, E0: 1, er: 1, sigma: 0, z: 0, t: 0 };
const P431 = { f: 2e6, er: 9, E0: 100, sigma: 0, z: 0, t: 0 };

export const ideaTemWave = defineIdeaPlate({
  id: "idea-tem-wave",
  title: "Reading a TEM wave",
  requires: { objectives: [0], items: ["text:hayt-d11.1", "text:hayt-d11.3", "hw04-2425-4.2", "f2425r-q4b"], misconceptions: ["WAVE_BETA_LAMBDA", "WAVE_MEDIUM"] },
  instances: [
    { id: "pw", component: "plane-wave", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`\mathbf E(z,t)=E_0e^{-\alpha z}\cos(\omega t-\beta z+\phi)\,\mathbf a_x`, "E of z t equals E nought e to the minus alpha z cos omega t minus beta z plus phi") },
  ],
  ideas: [
    {
      id: "tem",
      title: "Reading a TEM wave",
      objectives: [0],
      explain: [
        {
          id: "read", title: "Five numbers in one line", show: ["pw", "eq"], focus: ["pw", "eq"],
          note: "A wave E(z, t) = E₀e^(−αz) cos(ωt − βz + φ) carries five numbers: the amplitude E₀, the attenuation α (Np/m), the angular frequency ω = 2πf, the phase constant β (rad/m) and the phase φ. Wentworth Example 4.1: a 1 V/m, 100 MHz wave in air has α = 0 and ω = 2π × 10⁸ rad/s, so λ = c/f = 3.00 m and β = 2π/λ = 2.096 rad/m.",
          claims: [{ instance: "pw", readout: "lambda", value: 2.99792, unit: "m" }, { instance: "pw", readout: "beta", value: 2.09585, unit: "rad/m" }, { instance: "pw", readout: "alpha", value: 0, unit: "Np/m" }],
        },
        {
          id: "medium", title: "Slower in a medium", patch: { pw: P431 }, focus: ["pw"],
          note: "In a lossless medium the wave slows: u = 1/√(με) = c/√εr, and λ = u/f. Wentworth Problem 4.31: E = 100 cos(4π × 10⁶ t − 0.1257y) V/m in a nonmagnetic medium has f = 2 MHz and u = ω/β = 1.0 × 10⁸ m/s, so λ = 50 m. Then √εr = c/u = 3, so εr = 9.",
          claims: [{ instance: "pw", readout: "u", value: 9.99308e7, unit: "m/s" }, { instance: "pw", readout: "lambda", value: 49.9654, unit: "m" }],
        },
        {
          id: "eta", title: "H from E: the intrinsic impedance", patch: { eq: eqp(R`\dfrac{|\mathbf E|}{|\mathbf H|}=\eta=\sqrt{\dfrac{\mu}{\varepsilon}}=\dfrac{376.7}{\sqrt{\varepsilon_r}}\ \Omega`, "E over H equals eta") }, focus: ["pw", "eq"],
          note: "E and H travel together, perpendicular to each other and to the direction of travel, with |E|/|H| = η, the intrinsic impedance. In a lossless nonmagnetic medium, η = √(μ/ε) = 376.7/√εr Ω. Here η = 125.6 Ω, so the 100 V/m wave carries H = 0.7963 A/m. For E along ax travelling toward +z, H lies along ay, so that E × H points along the travel.",
          claims: [{ instance: "pw", readout: "eta", value: 125.577, unit: "Ω" }, { instance: "pw", readout: "Hwave", value: 0.796326, unit: "A/m" }],
        },
        {
          id: "move", title: "The wave moves", patch: { pw: { t: 6.25e-8 } }, focus: ["pw"],
          note: "Advance time by an eighth of a period, T/8 = 62.5 ns. The crests move forward by λ/8, and at z = 0 the field falls to 70.71 V/m, which is 100 cos 45°. The pattern travels toward +z because the phase ωt − βz stays fixed only if z grows with t.",
          claims: [{ instance: "pw", readout: "Ewave", value: 70.7107, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "d11-1", level: "basic", title: "Hayt D11.1: frequency, wavelength, period, H",
          setup: { pw: { f: 1e6 / (2 * Math.PI), er: 1, sigma: 0, E0: 250, z: 0, t: 0 } },
          problem: "A uniform plane wave in free space travels along az with E = Ex ax of amplitude 250 V/m and ω = 1.00 Mrad/s. Find f, λ, the period and the amplitude of H.",
          lines: [
            { text: "f = ω/2π = 159.2 kHz.", focus: ["pw"] },
            { text: "λ = c/f = 1884 m, or 1.884 km.", focus: ["pw"], claims: [{ instance: "pw", readout: "lambda", value: 1883.65, unit: "m" }] },
            { text: "T = 1/f = 6.283 µs.", focus: ["pw"] },
            { text: "H = E/η₀ = 250/376.7 = 0.6636 A/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "Hwave", value: 0.663605, unit: "A/m" }] },
          ],
          covers: ["text:hayt-d11.1"],
          trap: "Taking ω for f: 1 Mrad/s is 159.2 kHz, not a megahertz.",
        },
        {
          id: "hw04", level: "tutorial", title: "HW04 4.2 and the resit Q4(b): what the terms mean",
          setup: { pw: AIR },
          problem: "E(z, t) = E₀e^(−αz) cos(ωt ± βz + φ) ay. (a) What is a TEM wave? (b) What are α, ω, β and φ? (c) State H(z, t). (d) Relate E, H and u.",
          lines: [
            { text: "(a) Transverse electromagnetic: E and H both lie across the direction of travel, at right angles to each other.", focus: ["pw"] },
            { text: "(b) α: attenuation constant (Np/m). ω: angular frequency (rad/s). β: phase constant (rad/m). φ: phase angle (rad).", focus: ["eq"] },
            { text: "(c) For the ωt − βz wave, travelling in +z: H(z, t) = −(E₀/|η|)e^(−αz) cos(ωt − βz + φ − θη) ax, so that ay × (−ax) = az.", focus: ["eq"] },
            { text: "(d) E ⊥ H ⊥ the travel direction, |E|/|H| = |η|, E × H points along the travel, and u = ω/β.", focus: ["pw"] },
          ],
          covers: ["hw04-2425-4.2", "f2425r-q4b"],
          trap: "H along +ax for E along ay travelling +z: then E × H would point along −z. Check the cross product.",
        },
        {
          id: "d11-3", level: "exam", title: "Hayt D11.3: a wave in polyethylene",
          setup: { pw: { f: 9.375e9, er: 2.26, sigma: 0, E0: 500, z: 0, t: 0 } },
          problem: "A 9.375 GHz uniform plane wave travels in lossless polyethylene (εr = 2.26). The electric field amplitude is 500 V/m. Find β, λ, u, η and the amplitude of H.",
          lines: [
            { text: "β = ω√εr/c = 2π × 9.375 × 10⁹ × 1.503/2.998 × 10⁸ = 295.4 rad/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "beta", value: 295.382, unit: "rad/m" }] },
            { text: "λ = 2π/β = 2.127 cm; u = c/√εr = 1.994 × 10⁸ m/s.", focus: ["pw"], claims: [{ instance: "pw", readout: "lambda", value: 0.0212714, unit: "m" }] },
            { text: "η = 376.7/1.503 = 250.6 Ω, so H = 500/250.6 = 1.995 A/m.", focus: ["pw"], claims: [{ instance: "pw", readout: "eta", value: 250.597, unit: "Ω" }, { instance: "pw", readout: "Hwave", value: 1.99523, unit: "A/m" }] },
          ],
          covers: ["text:hayt-d11.3"],
          trap: "Using η = 377 Ω inside the polyethylene: H would come out 1.33 A/m instead of 1.995 A/m.",
        },
      ],
      asks: [
        { id: "beta", q: "How do β and λ relate?", tags: ["WAVE_BETA_LAMBDA"], a: "β = 2π/λ: radians of phase per metre. β = 10π rad/m means a 20 cm wavelength." },
        { id: "eta377", q: "Is η always 377 Ω?", tags: ["WAVE_MEDIUM"], a: "Only in free space. In a lossless nonmagnetic medium η = 376.7/√εr Ω; in a lossy medium η is complex." },
        { id: "tem", q: "What does TEM mean?", a: "Transverse electromagnetic: E and H both lie across the direction of travel, at right angles to each other." },
        { id: "dir", q: "How do I find H's direction?", a: "E × H points along the travel. For E along ax travelling toward +z, H is along ay; travelling toward −z, H is along −ay." },
        { id: "sign", q: "ωt − βz or ωt + βz?", a: "ωt − βz travels toward +z: keeping the phase fixed needs z to grow as t grows. ωt + βz travels toward −z." },
        { id: "u", q: "What is the phase velocity?", a: "u = ω/β, the speed of a crest: 1/√(με) in a lossless medium, and c in free space." },
      ],
      checks: [
        {
          id: "u-c", title: "Check: speed in a medium", show: ["pw", "eq"], patch: { pw: AIR },
          note: "Four checks on reading waves. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "u-c", type: "choose", prompt: "In a lossless nonmagnetic medium with εr = 4, a wave travels at…", dimension: "conceptual",
            options: [
              choice("half", "c/2", true, "Right: c/√εr."),
              choice("c", "c", false, "Only in free space.", "WAVE_MEDIUM"),
              choice("quarter", "c/4", false, "The square root of εr, not εr."),
            ] },
        },
        {
          id: "predict-er", title: "Check: into a dielectric",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-er", type: "predict-drag", prompt: "Fill the space with a lossless dielectric of εr = 4, keeping the frequency. Drag λ to your prediction.", target: { instance: "pw", readout: "lambda" }, range: [0, 4], unit: "m", relTol: 0.05, reveal: { pw: { er: 4 } }, dimension: "conceptual",
            feedback: { close: "Right: halved, to 1.499 m.", far: "λ = c/(f√εr): half, 1.499 m." } },
        },
        {
          id: "lambda-num", title: "Check: a wavelength, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "lambda-num", type: "numeric", prompt: wl.prompt, answer: wl.spec.answer, distractors: wl.spec.distractors, relTol: wl.spec.relTol, hints: wl.hints, template: "wave-lambda", dimension: "computational" },
        },
        {
          id: "beta-c", title: "Check: reading β",
          note: "Last one.",
          interaction: { id: "beta-c", type: "choose", prompt: "E = 10 cos(2π × 10⁸ t − (2π/3)z) ax V/m. The wavelength is…", dimension: "recognition",
            options: [
              choice("three", "three metres", true, "Right: λ = 2π/β with β = 2π/3."),
              choice("beta", "2π/3 metres", false, "That's β, in rad/m.", "WAVE_BETA_LAMBDA"),
              choice("omega", "10⁸ metres", false, "That's from ω, not β."),
            ] },
        },
      ],
      recap: {
        points: ["E₀e^(−αz) cos(ωt − βz + φ): α, ω = 2πf, β = 2π/λ, φ.", "Lossless: β = ω√(με), u = c/√εr, η = 376.7/√εr Ω.", "|E|/|H| = η; E × H along the travel."],
        traps: ["β for λ.", "377 Ω in a dielectric.", "ω for f."],
      },
    },
  ],
});
