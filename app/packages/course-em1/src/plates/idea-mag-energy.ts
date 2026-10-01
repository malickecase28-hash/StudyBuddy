import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

// R, choice, eqp as in Task 5.
const D813 = { kind: "solenoid" as const, N: 1500, radius: 0.01, length: 0.5, mur: 75, I: 2 };

export const ideaMagEnergy = defineIdeaPlate({
  id: "idea-mag-energy",
  title: "Magnetic energy and mutual inductance",
  requires: { objectives: [1], items: ["text:hayt-d8.13", "lecture:lec3b-energy", "lecture:lec3b-mutual"], misconceptions: ["WM_HALF"] },
  instances: [
    { id: "ind", component: "inductor", params: D813 },
    { id: "eq", component: "equation", params: eqp(R`W=\tfrac12LI^2`, "W equals one half L I squared") },
  ],
  ideas: [
    {
      id: "energy",
      title: "Magnetic energy and mutual inductance",
      objectives: [1],
      explain: [
        {
          id: "w", title: "Energy in an inductor", show: ["ind", "eq"], patch: { eq: eqp(R`v=L\dfrac{di}{dt},\quad W=\int Li\,di`, "v equals L di over dt; W equals the integral of L i d i") }, focus: ["ind", "eq"],
          note: "Building up a current against the back-emf v = L di/dt takes work: W = ∫Li di = ½LI². The plate's 133.2 mH solenoid carrying 2 A stores 0.2665 J. The ½ arises as it does for a capacitor: the opposing emf works against a current that grows from zero.",
          claims: [{ instance: "ind", readout: "W", value: 0.266479, unit: "J" }],
        },
        {
          id: "density", title: "The energy lives in the field", patch: { eq: eqp(R`w_m=\tfrac12\mathbf B\cdot\mathbf H=\dfrac{B^2}{2\mu}`, "w m equals one half B dot H") }, focus: ["eq", "ind"],
          note: "As with E, the energy is spread through the field, with density w_m = ½B·H = B²/(2μ) J/m³. Inside a long solenoid B = μNI/ℓ is uniform, and w_m × πr²ℓ gives back ½LI². Iron cores store surprisingly little: for a given B, a high μ means a small H, so ½B·H is small.",
          claims: [{ instance: "ind", readout: "W", value: 0.266479, unit: "J" }],
        },
        {
          id: "double", title: "Twice the current", patch: { ind: { I: 4 } }, focus: ["ind"],
          note: "W grows as I²: at 4 A the solenoid stores 1.066 J, four times as much. The flux linkage LI only doubles, to 0.5330 Wb.",
          claims: [{ instance: "ind", readout: "W", value: 1.06592, unit: "J" }, { instance: "ind", readout: "link", value: 0.532959, unit: "Wb" }],
        },
        {
          id: "mutual", title: "Mutual inductance", patch: { ind: { I: 2 }, eq: eqp(R`M_{12}=\dfrac{N_2\Phi_{12}}{I_1}=M_{21}`, "M one two equals N two phi one two over I one") }, focus: ["eq"],
          note: "Two coils that share flux are coupled. The mutual inductance M₁₂ = N₂Φ₁₂/I₁ is the flux linkage in coil 2 per ampere in coil 1, and M₁₂ = M₂₁. Hayt D8.13(c): wind a 1200-turn, 50 cm coil round the 1500-turn one. The inner coil's flux, all inside its μr = 75 core, links every outer turn: M = μN₁N₂S₁/ℓ = 106.6 mH. In series, coupled coils give L = L₁ + L₂ ± 2M.",
        },
      ],
      examples: [
        {
          id: "w", level: "basic", title: "Energy and energy density",
          setup: { ind: D813, eq: eqp(R`W=\tfrac12LI^2,\quad w_m=W/(\pi r^2\ell)`, "W equals one half L I squared; energy density equals W over volume") },
          problem: "Hayt D8.13(a)'s 133.2 mH solenoid carries 2 A. Find the stored energy and the average energy density inside it (radius 1 cm, length 50 cm).",
          lines: [
            { text: "W = ½LI² = ½ × 0.1332 × 2² = 0.2665 J.", focus: ["ind"], claims: [{ instance: "ind", readout: "W", value: 0.266479, unit: "J" }] },
            { text: "Volume = π(0.01)² × 0.5 = 1.571 × 10⁻⁴ m³, so w_m = 0.2665/1.571 × 10⁻⁴ = 1696 J/m³.", focus: ["ind"] },
          ],
          covers: ["text:hayt-d8.13", "lecture:lec3b-energy"],
          trap: "LI² without the ½ doubles the answer to 0.533 J.",
        },
        {
          id: "series", level: "tutorial", title: "Inductors in series and parallel",
          setup: { ind: D813, eq: eqp(R`L_s=L_1+L_2,\quad L_p^{-1}=L_1^{-1}+L_2^{-1}`, "series inductances add; reciprocal parallel inductances add") },
          problem: "The 133.2 mH solenoid and Hayt D8.12(b)'s 1.014 mH toroid are connected, uncoupled. Find the total inductance in series and in parallel, and the energy stored in series at 2 A.",
          lines: [
            { text: "Series: L = L₁ + L₂ = 133.2 + 1.014 = 134.3 mH, storing ½ × 0.1343 × 4 = 0.2685 J.", focus: ["ind"] },
            { text: "Parallel: 1/L = 1/L₁ + 1/L₂, so L = (0.1332 × 0.001014)/(0.1342) = 1.006 mH, just below the smaller one.", focus: ["ind"] },
          ],
          covers: ["lecture:lec3b-mutual"],
          trap: "Combining inductors like capacitors. Inductors add in series, like resistors.",
        },
        {
          id: "mutual", level: "exam", title: "Hayt D8.13(c): M, and the emf it induces",
          setup: { ind: D813, eq: eqp(R`M_{12}=N_2\Phi_{12}/I_1`, "M one two equals N two phi one two over I one") },
          problem: "A 50 cm, 1200-turn solenoid is wound coaxially round the 1500-turn, 2 cm-diameter, μr = 75-cored solenoid. (a) Find M. (b) If the inner coil's current rises at 100 A/s, what emf appears in the outer coil?",
          lines: [
            { text: "(a) The inner coil's field μN₁I₁/ℓ fills only its own core, S₁ = π(0.01)².", focus: ["eq"] },
            { text: "M = N₂Φ₁₂/I₁ = μN₁N₂S₁/ℓ = 75 × 4π × 10⁻⁷ × 1500 × 1200 × 3.142 × 10⁻⁴/0.5 = 106.6 mH.", focus: ["eq"] },
            { text: "(b) v₂ = M di₁/dt = 0.1066 × 100 = 10.66 V. That's Faraday's law at work: the next unit.", focus: ["eq"] },
          ],
          covers: ["text:hayt-d8.13"],
          trap: "Using the outer coil's area. Only flux that exists links: the inner coil's field is confined to its own core.",
        },
      ],
      asks: [
        { id: "half", q: "Where does the ½ in ½LI² come from?", tags: ["WM_HALF"], a: "The back-emf L di/dt opposes a current that grows from zero, so on average you push against half the final linkage. The work is ∫Li di = ½LI²." },
        { id: "density", q: "What's the magnetic energy density?", a: "w_m = ½B·H = B²/(2μ) = ½μH², in J/m³. Integrate it over the field's volume to get ½LI²." },
        { id: "sym", q: "Is M₁₂ always equal to M₂₁?", a: "Yes, for linear media: the flux linkage in coil 2 per ampere in coil 1 equals the linkage in coil 1 per ampere in coil 2." },
        { id: "k", q: "What's the coupling coefficient?", a: "k = M/√(L₁L₂), between 0 and 1. Coils wound together on a shared core approach 1; Lec 3b's air-cored example has k ≈ 0.1." },
        { id: "uses", q: "Where is mutual inductance used?", a: "Transformers, wireless chargers and many sensors: a changing current in one coil induces v₂ = M di₁/dt in the other. Faraday's law, in Unit 4, explains why." },
        { id: "combine", q: "How do inductors combine?", a: "Like resistors, when uncoupled: L = L₁ + L₂ in series, and 1/L = 1/L₁ + 1/L₂ in parallel. Coupling adds ±2M in series." },
      ],
      checks: [
        {
          id: "half-c", title: "Check: the energy formula", show: ["ind", "eq"], patch: { ind: D813 },
          note: "Four checks on magnetic energy. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "half-c", type: "choose", prompt: "An inductor L carrying current I stores…", dimension: "recognition",
            options: [
              choice("half", "½LI²", true, "Right."),
              choice("full", "LI²", false, "Missing the ½.", "WM_HALF"),
              choice("li", "LI", false, "That's the flux linkage, in webers."),
            ] },
        },
        {
          id: "predict-i", title: "Check: triple the current",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-i", type: "predict-drag", prompt: "Triple the current from 2 A to 6 A. Drag W to your prediction.", target: { instance: "ind", readout: "W" }, range: [0, 3], unit: "J", relTol: 0.05, reveal: { ind: { I: 6 } }, dimension: "conceptual",
            feedback: { close: "Right: nine times, 2.398 J.", far: "W ∝ I²: 9 × 0.2665 = 2.398 J." } },
        },
        {
          id: "w-num", title: "Check: stored energy",
          note: "A number.",
          interaction: { id: "w-num", type: "numeric", prompt: "A 133.2 mH inductor carries 2.0 A. Find the stored energy, in J.", answer: { value: 0.2664, unit: "J" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0.5328, unit: "J", errorClass: "conceptual", tag: "WM_HALF", feedback: "That's LI². The energy is ½LI²." }],
            hints: ["W = ½LI².", "L = 0.1332 H.", "½ × 0.1332 × 4."] },
        },
        {
          id: "m-c", title: "Check: mutual inductance",
          note: "Last one.",
          interaction: { id: "m-c", type: "choose", prompt: "The mutual inductance M₁₂ is…", dimension: "recognition",
            options: [
              choice("right", "N₂Φ₁₂/I₁: the linkage in coil 2 per ampere in coil 1", true, "Right."),
              choice("l1", "N₁Φ₁/I₁", false, "That's coil 1's self-inductance."),
              choice("ratio", "Φ₁₂/N₂", false, "Inductance is linkage per ampere."),
            ] },
          covers: ["lecture:lec3b-mutual"],
        },
      ],
      recap: {
        points: ["W = ½LI²; the flux linkage is LI.", "w_m = ½B·H = B²/(2μ).", "M₁₂ = N₂Φ₁₂/I₁ = M₂₁; coupled coils in series: L₁ + L₂ ± 2M."],
        traps: ["Dropping the ½.", "Inductors combined like capacitors.", "M from flux that doesn't exist."],
      },
    },
  ],
});
