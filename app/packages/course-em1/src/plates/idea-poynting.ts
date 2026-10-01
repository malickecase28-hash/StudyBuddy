import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const pa = instantiate(templates.find((t) => t.id === "poynting-avg")!, 1);
const AIR = { f: 1e8, er: 1, sigma: 0, E0: 1, z: 0, t: 0 };
const CU10 = { f: 1e7, er: 1, sigma: 5.8e7, E0: 1, z: 0, t: 0 };

export const ideaPoynting = defineIdeaPlate({
  id: "idea-poynting",
  title: "Poynting's theorem and power",
  requires: { objectives: [3], items: ["text:went-ex5.6", "text:went-ex5.7", "f2425-q4c", "f2324-q4c", "hw04-2425-4.3"], misconceptions: ["POYNTING_HALF"] },
  instances: [
    { id: "pw", component: "plane-wave", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`-\oint_S(\mathbf E\times\mathbf H)\cdot d\mathbf S=\dfrac{d}{dt}\int_v\left(\tfrac12\varepsilon E^2+\tfrac12\mu H^2\right)dv+\int_v\sigma E^2\,dv`, "Poynting's theorem") },
  ],
  ideas: [
    {
      id: "poynting",
      title: "Poynting's theorem and power",
      objectives: [3],
      explain: [
        {
          id: "theorem", title: "Energy conservation for fields", show: ["pw", "eq"], focus: ["eq"],
          note: "Poynting's theorem is the conservation of energy for fields (Wentworth §5.5). The power flowing into a volume through its surface, −∮(E × H)·dS, equals the rate of rise of the stored energy, (d/dt)∫(½εE² + ½μH²) dv, plus the power lost as heat, ∫σE² dv. The Poynting vector P = E × H, in W/m², is the power flow per unit area; it points along the wave's travel.",
        },
        {
          id: "avg", title: "The average power", patch: { eq: eqp(R`\mathbf P_{\text{ave}}=\dfrac{E_0^2}{2|\eta|}e^{-2\alpha z}\cos\theta_\eta\,\mathbf a_z`, "P average equals E nought squared over two eta, times e to the minus two alpha z, times cos theta eta") }, focus: ["pw", "eq"],
          note: "For a plane wave the time average is P_ave = (E₀²/2|η|)e^(−2αz) cos θη, along the travel. The ½ is the average of cos². Wentworth Example 5.6: 1 V/m at 100 MHz in air gives 1.327 mW/m², so a dish 20 cm across, of area π(0.1)², collects 41.7 µW.",
          claims: [{ instance: "pw", readout: "Pave", value: 0.00132721, unit: "W/m^2" }],
        },
        {
          id: "copper", title: "Into copper", patch: { pw: CU10 }, focus: ["pw"],
          note: "In a lossy medium, cos θη and the decay both matter. Wentworth Example 5.7: 1 V/m at the surface of copper at 10 MHz, where η = 0.001167 Ω at 45°, gives P_ave = cos 45°/(2 × 0.001167) = 303 W/m² at the surface. The tiny η makes a small field carry a lot of power density.",
          claims: [{ instance: "pw", readout: "Pave", value: 303.022, unit: "W/m^2" }],
        },
        {
          id: "depth", title: "One skin depth in", patch: { pw: { z: 2.08981e-5 } }, focus: ["pw"],
          note: "Power decays twice as fast as the field, as e^(−2αz). One skin depth, 20.9 µm, into the copper, it's down to e⁻², or 13.5%: 41.0 W/m². The power isn't lost; it heats the metal, which is the ∫σE² term of the theorem.",
          claims: [{ instance: "pw", readout: "Pave", value: 41.0096, unit: "W/m^2" }],
        },
      ],
      examples: [
        {
          id: "dish", level: "basic", title: "Wentworth Example 5.6: power into a dish",
          setup: { pw: AIR },
          problem: "E(z, t) = 1.0 cos(2π × 10⁸t − βz) ax V/m travels in air. Find the power normally incident on a receiving dish 20 cm in diameter.",
          lines: [
            { text: "P_ave = E₀²/(2η₀) = 1/(2 × 376.7) = 1.327 mW/m².", focus: ["pw"], claims: [{ instance: "pw", readout: "Pave", value: 0.00132721, unit: "W/m^2" }] },
            { text: "The area is π(0.1)² = 0.0314, in square metres, so P = 1.327 × 10⁻³ × 0.0314 = 41.7 µW.", focus: ["pw"] },
          ],
          covers: ["text:went-ex5.6"],
          trap: "Using the 20 cm diameter as the radius gives four times the power.",
        },
        {
          id: "er4", level: "tutorial", title: "A wave in a dielectric",
          setup: { pw: { ...AIR, er: 4, E0: 10 } },
          problem: "A 100 MHz plane wave of amplitude 10 V/m travels in a lossless nonmagnetic medium with εr = 4. Find η and the average power density.",
          lines: [
            { text: "η = 376.7/√4 = 188.4 Ω.", focus: ["pw"], claims: [{ instance: "pw", readout: "eta", value: 188.365, unit: "Ω" }] },
            { text: "P_ave = 10²/(2 × 188.4) = 0.2654 W/m².", focus: ["pw"], claims: [{ instance: "pw", readout: "Pave", value: 0.265442, unit: "W/m^2" }] },
          ],
          covers: ["text:went-ex5.7"],
          trap: "Using 377 Ω in the dielectric halves the answer.",
        },
        {
          id: "state", level: "exam", title: "Finals 2024-25 Q4(c), 2023-24 Q4(c) and HW04 4.3(b): describe it",
          setup: { pw: AIR },
          problem: "Briefly describe the transmission of electromagnetic wave power using Poynting's theorem. On what principle is it based, and how are the Poynting vector and the average power computed?",
          lines: [
            { text: "Poynting's theorem: the net power flowing into a volume equals the rate of increase of the stored electric and magnetic energy plus the ohmic power dissipated.", focus: ["eq"] },
            { text: "It rests on the conservation of energy.", focus: ["eq"] },
            { text: "P = E × H W/m², along the travel. For a plane wave, P_ave = ½Re(Es × Hs*) = (E₀²/2|η|)e^(−2αz) cos θη; multiply by an area for watts.", focus: ["eq"] },
          ],
          covers: ["f2425-q4c", "f2324-q4c", "hw04-2425-4.3"],
          trap: "Writing P = E·H. The Poynting vector is a cross product.",
        },
      ],
      asks: [
        { id: "half", q: "Why the ½ in P_ave?", tags: ["POYNTING_HALF"], a: "The instantaneous power goes as cos²(ωt − βz), whose time average is ½. Leaving it out doubles the answer." },
        { id: "dir", q: "Which way does P point?", a: "Along E × H, which for a plane wave is the direction of travel. The energy flows with the wave." },
        { id: "principle", q: "What principle is Poynting's theorem based on?", a: "Conservation of energy: power in through the surface equals the rise in stored field energy plus the power dissipated as heat." },
        { id: "phasor", q: "How do I write P_ave with phasors?", a: "P_ave = ½Re(Es × Hs*), with Hs* the complex conjugate. For a plane wave it reduces to (E₀²/2|η|)e^(−2αz) cos θη." },
        { id: "e2a", q: "Why does power decay as e^(−2αz)?", a: "Power goes as the field squared, and each field decays as e^(−αz)." },
        { id: "units", q: "What are the units?", a: "W/m²: power per unit area crossing a surface normal to the travel. Multiply by an area for watts, as with the dish." },
      ],
      checks: [
        {
          id: "half-c", title: "Check: average power", show: ["pw", "eq"], patch: { pw: AIR },
          note: "Four checks on Poynting's theorem. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "half-c", type: "choose", prompt: "In a lossless medium, a plane wave's average power density is…", dimension: "recognition",
            options: [
              choice("right", "E₀²/(2η)", true, "Right."),
              choice("full", "E₀²/η", false, "Missing the ½ from the time average.", "POYNTING_HALF"),
              choice("mult", "E₀η/2", false, "Power goes as E²/η."),
            ] },
        },
        {
          id: "predict-e", title: "Check: twice the field",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-e", type: "predict-drag", prompt: "Double the wave's amplitude. Drag P_ave to your prediction.", target: { instance: "pw", readout: "Pave" }, range: [0, 0.01], unit: "W/m^2", relTol: 0.05, reveal: { pw: { E0: 2 } }, dimension: "conceptual",
            feedback: { close: "Right: four times, 5.309 mW/m².", far: "P ∝ E₀²: four times, 5.309 mW/m²." } },
        },
        {
          id: "pave-num", title: "Check: power, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "pave-num", type: "numeric", prompt: pa.prompt, answer: pa.spec.answer, distractors: pa.spec.distractors, relTol: pa.spec.relTol, hints: pa.hints, template: "poynting-avg", dimension: "computational" },
        },
        {
          id: "decay-c", title: "Check: a skin depth in",
          note: "Last one.",
          interaction: { id: "decay-c", type: "choose", prompt: "One skin depth into a conductor, the average power density is…", dimension: "conceptual",
            options: [
              choice("e2", "e⁻² ≈ 13.5% of its surface value", true, "Right: power goes as the field squared."),
              choice("e1", "e⁻¹ ≈ 36.8% of its surface value", false, "That's the field; the power falls faster."),
              choice("zero", "zero", false, "It decays, but not to zero."),
            ] },
        },
      ],
      recap: {
        points: ["Poynting's theorem: energy conservation for fields.", "P = E × H (W/m²), along the travel.", "P_ave = (E₀²/2|η|)e^(−2αz) cos θη.", "Power decays as e^(−2αz): one skin depth gives e⁻²."],
        traps: ["Missing the ½.", "377 Ω in a medium.", "Power decaying as e^(−αz)."],
      },
    },
  ],
});
