import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const C0 = 299_792_458;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const wl = instantiate(templates.find((t) => t.id === "em-wavelength")!, 1);
const LAMBDA = { latex: R`\lambda=\dfrac{c}{f}`, speech: "lambda equals c over f", shortSpeech: "wavelength" };
const MAXWELL = R`\nabla\cdot\mathbf D=\rho_v\qquad\nabla\cdot\mathbf B=0\qquad\nabla\times\mathbf E=-\dfrac{\partial\mathbf B}{\partial t}\qquad\nabla\times\mathbf H=\mathbf J+\dfrac{\partial\mathbf D}{\partial t}`;

export const ideaEmWorld = defineIdeaPlate({
  id: "idea-em-world",
  title: "What electromagnetics is, and where it runs the world",
  requires: { objectives: [0, 1], items: ["f2425-q1a"], misconceptions: ["WAVELENGTH_INVERSE"] },
  instances: [
    { id: "spec", component: "spectrum", params: { f: 2.45e9 } },
    { id: "eq", component: "equation", params: LAMBDA },
  ],
  ideas: [
    {
      id: "em-world",
      title: "What electromagnetics is, and where it runs the world",
      objectives: [0, 1],
      explain: [
        {
          id: "what", title: "Fields from charges", show: ["spec"], focus: ["spec"],
          note: "Electromagnetics (EM) is the study of electric and magnetic fields. Charges at rest make electric fields. Charges in motion, currents, make magnetic fields. When either field changes in time it creates the other, and that loop lets energy leave a circuit and travel on its own as a wave. The bar on the plate is the whole electromagnetic spectrum. Radio, microwaves, light and X-rays are all the same thing: electric and magnetic fields chasing each other at the speed of light. Only the frequency differs.",
        },
        {
          id: "maxwell", title: "Maxwell's four equations", show: ["eq"], patch: { eq: { latex: MAXWELL, speech: "Maxwell's four equations", shortSpeech: "Maxwell's equations" } }, focus: ["eq"],
          note: "In the 1860s James Clerk Maxwell wrote everything then known about electricity and magnetism as four equations: Gauss's law for electric fields; Gauss's law for magnetic fields (there are no magnetic charges); Faraday's law (a changing magnetic field makes an electric field); and Ampère's law with his own addition, the displacement current (a changing electric field makes a magnetic field). Together they predict waves travelling at 1/√(μ₀ε₀), which is exactly the speed of light. This course climbs to these four equations one at a time, and vector calculus is the language they are written in.",
        },
        {
          id: "spectrum", title: "One wave, every frequency", patch: { spec: { f: 5.45e14 }, eq: LAMBDA }, focus: ["spec", "eq"],
          note: "Every EM wave obeys λ = c/f: the wavelength is the speed of light, c = 299 792 458 m/s, divided by the frequency. Green light oscillates at 5.45 × 10¹⁴ Hz, so its wavelength is about 5.5 × 10⁻⁷ m, roughly 550 nanometres. Double the frequency and the wavelength halves. The bands on the bar (radio, microwave, infrared, visible, ultraviolet, X-ray, gamma) are human names for ranges of one continuous scale; nothing physical changes at a boundary.",
          claims: [{ instance: "spec", readout: "lambda", value: 5.50078e-7, unit: "m" }],
        },
        {
          id: "antenna", title: "Wireless: antennas and wavelength", patch: { spec: { f: 94.1e6 } }, focus: ["spec"],
          note: "Wireless communication is EM at its purest. A current oscillating in one antenna launches a wave that drives a current in another, far away, with nothing in between. Antennas work best at about half a wavelength long. An FM station at 94.1 MHz has a wavelength of 3.186 m, so a good receiving antenna is about 1.593 m long. Wi-Fi at 2.45 GHz has a wavelength of about 12 cm, which is why a phone's antenna fits inside its case.",
          claims: [{ instance: "spec", readout: "lambda", value: 3.18589, unit: "m" }],
          givens: [{ value: C0 / 94.1e6 / 2, unit: "m" }, { value: 2.45e9, unit: "Hz" }],
        },
        {
          id: "grid", title: "Where EM runs the country", patch: { spec: { f: 50 } }, focus: ["spec"],
          note: "Critical infrastructure runs on EM. In the power grid, generators turn motion into current by Faraday's law, transformers step the voltage up for low-loss transmission, and the whole system alternates at 50 Hz. At 50 Hz the wavelength is about 6000 km, far longer than any Jamaican power line, which is why lines behave as circuits rather than antennas. In telecoms, cell towers and microwave links carry calls as radio waves, and fibre optics carry the internet as light. Airports need radar; ships and phones need GPS. All of it is Maxwell's equations at work.",
          claims: [{ instance: "spec", readout: "lambda", value: 5.99585e6, unit: "m" }],
        },
      ],
      examples: [
        {
          id: "wifi", level: "basic", title: "Wi-Fi's wavelength",
          setup: { spec: { f: 2.45e9 } },
          problem: "A Wi-Fi router transmits at 2.45 GHz. Find the wavelength.",
          lines: [
            { text: "Put the frequency in hertz first: 2.45 GHz = 2.45 × 10⁹ Hz.", focus: ["spec"] },
            { text: "λ = c/f = 299 792 458 ÷ (2.45 × 10⁹) = 0.1224 m, about 12 cm.", latex: R`\lambda=\dfrac{299\,792\,458}{2.45\times10^{9}}=0.1224\ \text{m}`, focus: ["spec"], claims: [{ instance: "spec", readout: "lambda", value: 0.122364, unit: "m" }] },
          ],
          trap: "Leaving f in gigahertz gives λ = 299 792 458 ÷ 2.45, over a hundred million metres. Convert the prefix before dividing.",
        },
        {
          id: "fm", level: "tutorial", title: "Sizing an FM antenna",
          setup: { spec: { f: 94.1e6 } },
          problem: "An FM station broadcasts at 94.1 MHz. Find the wavelength and the length of a half-wave antenna for it.",
          lines: [
            { text: "λ = c/f = 299 792 458 ÷ (94.1 × 10⁶) = 3.186 m.", focus: ["spec"], claims: [{ instance: "spec", readout: "lambda", value: 3.18589, unit: "m" }] },
            { text: "A half-wave antenna is λ/2 = 1.593 m long.", focus: ["spec"], givens: [{ value: C0 / 94.1e6 / 2, unit: "m" }] },
          ],
          trap: "Using the full wavelength gives an antenna twice as long as it needs to be. The common designs are half-wave, and quarter-wave over a ground plane.",
        },
        {
          id: "infrastructure", level: "exam", title: "EM and critical infrastructure",
          setup: { spec: { f: 50 } },
          problem: "Very briefly comment on how electromagnetics theory has been important to technological advances in a chosen critical infrastructure. (4 marks: aim for four distinct points.)",
          lines: [
            { text: "Name the infrastructure: the national electricity grid.", focus: ["spec"] },
            { text: "First EM principle: generators convert mechanical energy to electrical energy by Faraday's law of induction.", focus: ["spec"] },
            { text: "Second EM principle: transformers use mutual induction to step the voltage up for transmission, cutting I²R losses, then down again for safe use.", focus: ["spec"] },
            { text: "The advance and why it matters: reliable 50 Hz power across the island, which water pumping, hospitals and telecoms all depend on.", focus: ["spec"] },
          ],
          covers: ["f2425-q1a"],
          trap: "Listing devices without the EM principle behind them. Each mark wants the link: device, then the law, then the benefit.",
        },
      ],
      asks: [
        { id: "same-thing", q: "Is light really the same thing as radio?", a: "Yes. Both are oscillating electric and magnetic fields travelling at the speed of light. Only the frequency differs. Your eyes detect one narrow band, and a radio receiver detects another." },
        { id: "inverse", q: "Why does a higher frequency mean a shorter wavelength?", tags: ["WAVELENGTH_INVERSE"], a: "In free space every EM wave travels at the same speed c. In one second a wave moves c metres and completes f cycles, so each cycle spans c/f metres. Pack more cycles into the same distance and each one must be shorter." },
        { id: "sound", q: "Is sound an EM wave?", a: "No. Sound is a pressure wave in a material (air, water, steel) and cannot cross a vacuum. EM waves need no medium at all: sunlight crosses empty space to reach us." },
        { id: "half", q: "Why are antennas about half a wavelength long?", a: "A half-wave antenna resonates. The current on it forms a standing wave with its peak at the centre, so it radiates and receives most efficiently. Much shorter antennas still work, but weakly." },
        { id: "field", q: "What exactly is a field?", a: "A field gives a value at every point in a region. The electric field tells you the force a small test charge would feel there, per coulomb. Fields are vectors that depend on position, which is why the course starts with vectors." },
        { id: "danger", q: "Are phone signals dangerous like X-rays?", a: "Not in the same way. X-rays and gamma rays carry enough energy per photon to break chemical bonds; that is ionizing radiation. Radio and microwaves carry far less, and their main effect is gentle heating. The dividing line is in the ultraviolet." },
        { id: "why-vectors", q: "Why does an EM course start with vectors?", a: "Fields have a size and a direction at every point, and Maxwell's equations are written with dot and cross products, gradient, divergence and curl. Without that language the laws are unreadable. With it, each law fits on one line." },
      ],
      checks: [
        {
          id: "band", title: "Check: which band?", show: ["spec"], patch: { spec: { f: 94.1e6 } },
          note: "Five checks on EM and the spectrum. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "band", type: "choose", prompt: "A 5 GHz Wi-Fi signal is in which band?", dimension: "recognition",
            options: [
              choice("micro", "Microwave", true, "Right: 300 MHz to 300 GHz is microwave."),
              choice("radio", "Radio", false, "Radio is below about 300 MHz; 5 GHz is higher."),
              choice("ir", "Infrared", false, "Infrared starts near 300 GHz, sixty times higher."),
            ] },
        },
        {
          id: "predict-10x", title: "Check: ten times the frequency", patch: { spec: { f: 2.45e9 } },
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-10x", type: "predict-drag", prompt: "The frequency rises ten times, from 2.45 GHz to 24.5 GHz. Drag λ to your prediction.", target: { instance: "spec", readout: "lambda" }, range: [0, 0.3], unit: "m", relTol: 0.05, reveal: { spec: { f: 2.45e10 } }, dimension: "conceptual", tag: "WAVELENGTH_INVERSE",
            feedback: { close: "Right: ten times shorter, 0.01224 m.", far: "λ = c/f: ten times the frequency gives a tenth of the wavelength, 0.01224 m." } },
        },
        {
          id: "wavelength-num", title: "Check: a wavelength, your numbers",
          note: "A number of your own.",
          interaction: { id: "wavelength-num", type: "numeric", prompt: wl.prompt, answer: wl.spec.answer, distractors: wl.spec.distractors, relTol: wl.spec.relTol, hints: wl.hints, template: "em-wavelength", dimension: "computational" },
        },
        {
          id: "not-em", title: "Check: what isn't EM",
          note: "Which one doesn't belong?",
          interaction: { id: "not-em", type: "choose", prompt: "Which of these is NOT an electromagnetic wave?", dimension: "conceptual",
            options: [
              choice("sound", "Sound from a speaker", true, "Right: sound is a pressure wave in air and cannot cross a vacuum."),
              choice("oven", "Microwaves in an oven", false, "Microwaves are EM waves, the same kind as Wi-Fi."),
              choice("xray", "X-rays at a clinic", false, "X-rays are EM waves at a very high frequency."),
            ] },
        },
        {
          id: "generator", title: "Check: the law behind the grid",
          note: "Last one.",
          interaction: { id: "generator", type: "choose", prompt: "Which law explains how a power-station generator produces current?", dimension: "recognition",
            options: [
              choice("faraday", "Faraday's law of induction", true, "Right: a changing magnetic flux induces a voltage."),
              choice("coulomb", "Coulomb's law", false, "Coulomb's law is the force between charges at rest."),
              choice("gauss", "Gauss's law", false, "Gauss's law links electric flux to enclosed charge."),
            ] },
          covers: ["f2425-q1a"],
        },
      ],
      recap: {
        points: [
          "EM studies electric and magnetic fields: charges at rest make E, currents make B, and changing fields make each other.",
          "Maxwell's four equations unify it all and predict waves at the speed of light.",
          "λ = c/f for every EM wave; radio, light and X-rays differ only in frequency.",
          "Antennas are about half a wavelength long.",
          "The grid (generators, transformers) and telecoms (radio, fibre) are EM at work.",
        ],
        traps: ["Thinking a higher frequency gives a longer wavelength.", "Dividing by a frequency still in MHz or GHz.", "Naming devices without the EM law behind them."],
      },
    },
  ],
});
