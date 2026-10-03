import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
const ce = instantiate(templates.find((t) => t.id === "cap-energy")!, 1);
const AIR = { kind: "parallel" as const, area: 0.01, d: 1e-3, er: 1, V: 100 };
const MST = { kind: "parallel" as const, area: 0.12, d: 8e-5, er: 33.46397, V: 15 };

export const ideaCapEnergy = defineIdeaPlate({
  id: "idea-cap-energy",
  title: "Stored energy and energy density",
  requires: { objectives: [1], items: ["mst-2324-q5b"], misconceptions: ["ENERGY_HALF", "ENERGY_DENSITY_UNIT"] },
  instances: [
    { id: "cap", component: "capacitor", params: AIR },
    { id: "eq", component: "equation", params: eqp(R`W=\tfrac12CV^2=\tfrac12QV=\tfrac12Q^2/C`, "W equals one half C V squared") },
  ],
  ideas: [
    {
      id: "energy",
      title: "Stored energy and energy density",
      objectives: [1],
      explain: [
        {
          id: "work", title: "Charging costs work", show: ["cap", "eq"], focus: ["cap", "eq"],
          note: "Moving each bit of charge dq from one plate to the other, against the voltage v = q/C already there, takes dW = v dq. Add it all up from 0 to Q: W = ∫(q/C)dq = ½Q²/C = ½CV² = ½QV. The ½ appears because the voltage rises from zero as you charge; only the last bit of charge crosses the full V. The plate's 88.54 pF at 100 V stores 0.4427 µJ.",
          claims: [{ instance: "cap", readout: "W", value: 4.42709e-7, unit: "J" }],
        },
        {
          id: "density", title: "The energy lives in the field", patch: { eq: eqp(R`w_E=\tfrac12\varepsilon E^2=\tfrac12\mathbf D\cdot\mathbf E`, "w E equals one half epsilon E squared") }, focus: ["eq", "cap"],
          note: "Where is the energy stored? In the field between the plates. Write ½CV² with C = εS/d and V = Ed: W = ½(εS/d)(Ed)² = ½εE² × Sd. Sd is the volume of the gap, so the energy per unit volume is w_E = ½εE² = ½D·E, in J/m³. Here E = 100 kV/m and w_E = 0.04427 J/m³.",
          claims: [{ instance: "cap", readout: "Eg", value: 1e5, unit: "V/m" }, { instance: "cap", readout: "wE", value: 0.0442709, unit: "J/m^3" }],
        },
        {
          id: "battery", title: "Fixed V or fixed Q?", patch: { cap: { er: 4 } }, focus: ["cap"],
          note: "Slide a dielectric (εr = 4) into the gap while a battery holds V at 100 V: C quadruples, and so does W = ½CV², to 1.771 µJ; the battery supplies the extra. If the capacitor had been disconnected first, Q would be fixed instead: W = ½Q²/C would fall to a quarter, 0.1107 µJ, and the dielectric would be pulled in. Which formula to use depends on what's held constant.",
          claims: [{ instance: "cap", readout: "W", value: 1.77084e-6, unit: "J" }],
        },
      ],
      examples: [
        {
          id: "air", level: "basic", title: "Energy in the air capacitor",
          setup: { cap: { ...AIR } },
          problem: "Find the energy stored in the 88.54 pF air capacitor at 100 V, and the energy density in its gap.",
          lines: [
            { text: "W = ½CV² = ½ × 88.54 × 10⁻¹² × 100² = 0.4427 µJ.", focus: ["cap"], claims: [{ instance: "cap", readout: "W", value: 4.42709e-7, unit: "J" }] },
            { text: "E = V/d = 100/0.001 = 10⁵ V/m, so w_E = ½ε₀E² = 0.04427 J/m³.", focus: ["cap"], claims: [{ instance: "cap", readout: "wE", value: 0.0442709, unit: "J/m^3" }] },
            { text: "Check: w_E × volume = 0.04427 × 10⁻⁵ = 0.4427 µJ.", focus: ["cap"] },
          ],
          trap: "Dropping the ½ doubles the answer.",
        },
        {
          id: "mst5b-i", level: "tutorial", title: "Energy density",
          setup: { cap: { ...MST } },
          problem: "The capacitor has S = 0.120 m², d = 80 µm, V₀ = 15.0 V and W_E = 50.0 µJ. Calculate the energy density w_E. (The paper asks for J·m⁻²; energy density is per volume, J/m³.)",
          lines: [
            { text: "The field fills the gap uniformly, so w_E = W_E/(Sd) = 50 × 10⁻⁶/(0.120 × 80 × 10⁻⁶) = 5.208 J/m³.", focus: ["cap"], claims: [{ instance: "cap", readout: "wE", value: 5.20833, unit: "J/m^3" }] },
            { text: "Check with fields: E = V₀/d = 15/(80 × 10⁻⁶) = 187.5 kV/m, and ½εr ε₀E² = 5.208 J/m³ with εr = 33.46.", focus: ["cap"], claims: [{ instance: "cap", readout: "Eg", value: 187500, unit: "V/m" }] },
          ],
          covers: ["mst-2324-q5b"],
          trap: "Answering in J/m² because the paper prints it. Give J/m³ and say why: energy per unit volume.",
        },
        {
          id: "switch", level: "exam", title: "Disconnected, or still connected?",
          setup: { cap: { ...AIR } },
          problem: "The 88.54 pF air capacitor is charged to 100 V and disconnected. A dielectric with εr = 4 is then slid in to fill the gap. Find the new V and W. What if it had stayed connected?",
          lines: [
            { text: "Disconnected: Q = 8.854 nC is fixed, and C becomes 354.2 pF.", focus: ["cap"], claims: [{ instance: "cap", readout: "Q", value: 8.85419e-9, unit: "C" }] },
            { text: "V = Q/C = 25 V, and W = ½QV = 0.1107 µJ, a quarter of before.", patch: { cap: { er: 4, V: 25 } }, focus: ["cap"], claims: [{ instance: "cap", readout: "W", value: 1.10677e-7, unit: "J" }, { instance: "cap", readout: "Q", value: 8.85419e-9, unit: "C" }] },
            { text: "Connected: V stays at 100 V, Q rises to 35.42 nC, and W = 1.771 µJ, four times as much.", patch: { cap: { V: 100 } }, focus: ["cap"], claims: [{ instance: "cap", readout: "Q", value: 3.54168e-8, unit: "C" }, { instance: "cap", readout: "W", value: 1.77084e-6, unit: "J" }] },
          ],
          trap: "Using ½CV² with the old V after disconnecting. Once the capacitor is isolated, Q is the constant and V changes.",
        },
      ],
      asks: [
        { id: "half", q: "Where does the ½ come from?", tags: ["ENERGY_HALF"], a: "While charging, the voltage climbs from 0 to V. On average each bit of charge crosses only half the final voltage, so the work is ½QV, not QV." },
        { id: "three-forms", q: "Which of ½CV², ½QV and ½Q²/C should I use?", a: "They're equal. Use the one whose quantities you know, or the one whose quantity is held constant when something changes." },
        { id: "density-units", q: "J/m² or J/m³?", tags: ["ENERGY_DENSITY_UNIT"], a: "J/m³: energy per unit volume, because the energy fills the gap's volume. If a paper prints J·m⁻², note the slip in your answer and give J/m³." },
        { id: "d-dot-e", q: "Why ½D·E?", a: "In a linear dielectric D = εE, so ½D·E = ½εE². The D·E form also works when D and E are given as vectors." },
        { id: "where", q: "Is the energy on the plates or in the gap?", a: "In the field. The energy-density picture assigns ½εE² to every point where E exists, which is what lets electromagnetic waves carry energy through empty space." },
        { id: "pulled-in", q: "Why is a dielectric pulled into an isolated charged capacitor?", a: "With Q fixed, W = ½Q²/C falls as C rises. Systems move toward lower energy, so the fringing field draws the slab in." },
      ],
      checks: [
        {
          id: "half-c", title: "Check: the energy formula", show: ["cap", "eq"], patch: { cap: { ...AIR } },
          note: "Four checks on stored energy. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "half-c", type: "choose", prompt: "A capacitor C at voltage V stores…", dimension: "recognition",
            options: [
              choice("half", "½CV²", true, "Right."),
              choice("full", "CV²", false, "Missing the ½: the voltage builds up from zero.", "ENERGY_HALF"),
              choice("cv", "CV", false, "CV is the charge, Q."),
            ] },
        },
        {
          id: "predict-v", title: "Check: double the voltage",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-v", type: "predict-drag", prompt: "Double the voltage from 100 V to 200 V. Drag W to your prediction.", target: { instance: "cap", readout: "W" }, range: [0, 3e-6], unit: "J", relTol: 0.05, reveal: { cap: { V: 200 } }, dimension: "conceptual",
            feedback: { close: "Right: four times as much, 1.771 µJ.", far: "W ∝ V²: four times, 1.771 µJ." } },
        },
        {
          id: "energy-num", title: "Check: stored energy, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "energy-num", type: "numeric", prompt: ce.prompt, answer: ce.spec.answer, distractors: ce.spec.distractors, relTol: ce.spec.relTol, hints: ce.hints, template: "cap-energy", dimension: "computational" },
        },
        {
          id: "density-c", title: "Check: energy density in the gap",
          note: "Last one.",
          patch: { cap: { ...MST } },
          interaction: { id: "density-c", type: "numeric", prompt: "S = 0.120 m², d = 80 µm, W_E = 50.0 µJ. Find the energy density w_E in J/m³.", answer: { value: 5.20833, unit: "J/m^3" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 4.16667e-4, unit: "J/m^3", errorClass: "conceptual", tag: "ENERGY_DENSITY_UNIT", feedback: "That divides by the area only. Energy density is per unit volume: divide by Sd." }],
            hints: ["w_E = W/volume.", "Volume = S × d = 0.120 × 8 × 10⁻⁵ m³.", "50 × 10⁻⁶ / (9.6 × 10⁻⁶)."] },
          covers: ["mst-2324-q5b"],
        },
      ],
      recap: {
        points: [
          "W = ½CV² = ½QV = ½Q²/C.",
          "The energy is stored in the field: w_E = ½εE² = ½D·E, in J/m³.",
          "Battery connected: V is constant. Disconnected: Q is constant.",
        ],
        traps: ["Dropping the ½.", "J/m² for an energy density.", "Holding V fixed after disconnecting."],
      },
    },
  ],
});
