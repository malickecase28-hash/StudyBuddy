import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
type V3 = [number, number, number];
const F2425 = { given: "H" as const, F1: [1, 3, 2] as V3, normal: [2, 1, 0] as V3, mur1: 2, mur2: 8 };

export const ideaMagnetization = defineIdeaPlate({
  id: "idea-magnetization",
  title: "Magnetization, χm and μr",
  requires: { objectives: [0], items: ["text:hayt-d8.6", "f2324-q3c", "f2425-q3b"], misconceptions: ["M_UNITS"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "mb", component: "mag-boundary", params: { ...F2425, show: ["H", "B", "M"] } },
    { id: "eq", component: "equation", params: eqp(R`\mathbf B=\mu_0(\mathbf H+\mathbf M)`, "B equals mu nought times H plus M") },
  ],
  ideas: [
    {
      id: "magnetization",
      title: "Magnetization, χm and μr",
      objectives: [0],
      explain: [
        {
          id: "m", title: "Magnetization M", show: ["axes", "mb", "eq"], focus: ["mb", "eq"],
          note: "Atoms carry tiny current loops: orbiting and spinning electrons. In a field they line up, and their net magnetic dipole moment per unit volume is the magnetization M, in A/m like H. These bound currents add to the free ones, so B = μ₀(H + M). On the plate, region 1 has μ₁ = 2μ₀ and H₁ = ax + 3ay + 2az A/m; there, M₁ = H₁ = ax + 3ay + 2az A/m.",
          claims: [{ instance: "mb", readout: "M1x", value: 1, unit: "A/m" }, { instance: "mb", readout: "M1y", value: 3, unit: "A/m" }],
        },
        {
          id: "chi", title: "χm and μr", patch: { eq: eqp(R`\mathbf M=\chi_m\mathbf H\ \Rightarrow\ \mathbf B=\mu_0(1+\chi_m)\mathbf H=\mu_r\mu_0\mathbf H`, "M equals chi m H, so B equals mu r mu nought H") }, focus: ["mb", "eq"],
          note: "In linear materials M is proportional to H: M = χmH, where χm is the magnetic susceptibility. Then B = μ₀(1 + χm)H = μrμ₀H, so μr = 1 + χm. Region 1's μr = 2 means χm = 1: M₁ equals H₁, and B₁ = 2μ₀H₁ = 2.513ax + 7.540ay + 5.027az µT (Wentworth §3.7).",
          claims: [{ instance: "mb", readout: "B1x", value: 2.51327e-6, unit: "T" }, { instance: "mb", readout: "B1y", value: 7.53982e-6, unit: "T" }],
        },
        {
          id: "kinds", title: "Three kinds of material", patch: { mb: { mur1: 1 } }, focus: ["mb"],
          note: "Diamagnetic materials such as copper and water have a tiny negative χm, about −10⁻⁵. Paramagnetic ones such as aluminium have a tiny positive χm. Ferromagnets (iron, nickel, cobalt) have χm in the hundreds to thousands, and it depends on H and on history: hysteresis. Course questions treat μr as a constant. Set μr = 1 and M vanishes, because free space has nothing to magnetize.",
          claims: [{ instance: "mb", readout: "M1x", value: 0, unit: "A/m" }],
        },
        {
          id: "from-b", title: "M when B is given", patch: { mb: { given: "B", F1: [3e-4, 0, 0], normal: [1, 0, 0], mur1: 16, mur2: 1 } }, focus: ["mb"],
          note: "When B is given, find H first, H = B/(μrμ₀), then M = χmH. In one step: M = (B/μ₀)(1 − 1/μr). Hayt D8.6(c): B = 300 µT in a material with χm = 15 gives H = 300 × 10⁻⁶/(16μ₀) = 14.92 A/m and M = 15 × 14.92 = 223.8 A/m.",
          claims: [{ instance: "mb", readout: "H1x", value: 14.9208, unit: "A/m" }, { instance: "mb", readout: "M1x", value: 223.812, unit: "A/m" }],
        },
      ],
      examples: [
        {
          id: "d8-6a", level: "basic", title: "Hayt D8.6(a): M from μ and H",
          setup: { mb: { given: "H", F1: [120, 0, 0], normal: [1, 0, 0], mur1: 14.3239, mur2: 1, show: ["H", "B", "M"] } },
          problem: "Find the magnetization in a magnetic material where μ = 1.8 × 10⁻⁵ H/m and H = 120 A/m.",
          lines: [
            { text: "μr = μ/μ₀ = 1.8 × 10⁻⁵/(4π × 10⁻⁷) = 14.32, so χm = μr − 1 = 13.32.", focus: ["mb"] },
            { text: "M = χmH = 13.32 × 120 = 1599 A/m.", focus: ["mb"], claims: [{ instance: "mb", readout: "M1x", value: 1598.87, unit: "A/m" }] },
          ],
          covers: ["text:hayt-d8.6"],
          trap: "Using μrH = 1719 A/m. M is the material's extra contribution: (μr − 1)H.",
        },
        {
          id: "f2324", level: "tutorial", title: "M₁ and B₁",
          setup: { mb: { given: "H", F1: [2, 3, -1], normal: [-1, 1, 0], mur1: 1, mur2: 3, show: ["H", "B", "M"] } },
          problem: "H₁ = 2ax + 3ay − az A/m in the region y − x − 2 ≤ 0, where μ₁ = μ₀. Calculate M₁ and B₁.",
          lines: [
            { text: "μr1 = 1, so χm1 = 0 and M₁ = 0.", focus: ["mb"], claims: [{ instance: "mb", readout: "M1x", value: 0, unit: "A/m" }] },
            { text: "B₁ = μ₀H₁ = 2.513ax + 3.770ay − 1.257az µT.", focus: ["mb"], claims: [{ instance: "mb", readout: "B1y", value: 3.76991e-6, unit: "T" }] },
          ],
          covers: ["f2324-q3c"],
          trap: "Writing M₁ = H₁ out of habit. In free space χm = 0, so there is no magnetization.",
        },
        {
          id: "f2425", level: "exam", title: "M₁ and B₁",
          setup: { mb: { ...F2425, show: ["H", "B", "M"] } },
          problem: "H₁ = ax + 3ay + 2az A/m fills the region y + 2x − 4 ≤ 0, where μ₁ = 2μ₀. Calculate (i) the magnetization M₁ and (ii) B₁.",
          lines: [
            { text: "(i) χm1 = μr1 − 1 = 1, so M₁ = χm1H₁ = ax + 3ay + 2az A/m.", focus: ["mb"], claims: [{ instance: "mb", readout: "M1z", value: 2, unit: "A/m" }] },
            { text: "(ii) B₁ = μ₀(H₁ + M₁) = 2μ₀H₁ = 2.513ax + 7.540ay + 5.027az µT.", focus: ["mb", "eq"], claims: [{ instance: "mb", readout: "B1z", value: 5.02655e-6, unit: "T" }] },
          ],
          covers: ["f2425-q3b"],
          trap: "Giving B₁ as μ₀H₁. In a material, B = μrμ₀H.",
        },
      ],
      asks: [
        { id: "units", q: "What are M's units?", tags: ["M_UNITS"], a: "A/m, the same as H: M is magnetic dipole moment (A·m²) per unit volume (m³). B is in tesla, and B = μ₀(H + M)." },
        { id: "chi-mu", q: "How are χm and μr related?", a: "μr = 1 + χm. Free space has χm = 0 and μr = 1." },
        { id: "kinds", q: "Dia-, para- and ferromagnetic?", a: "Diamagnets have a slightly negative χm and are weakly repelled by magnets; paramagnets have a slightly positive χm and are weakly attracted; ferromagnets have χm in the hundreds or thousands." },
        { id: "bound", q: "What are bound currents?", a: "Aligned atomic current loops act like currents on and through the magnetized body: the bound current density is ∇ × M. They add to the free currents to make B." },
        { id: "twin", q: "How is this like polarization?", a: "M plays the role of P. One difference: P weakens E inside a dielectric, while M in a paramagnet or ferromagnet strengthens B." },
        { id: "hysteresis", q: "Is μr really constant for iron?", a: "No. Iron's B–H curve saturates and shows hysteresis, so μr depends on H and on history. Course questions take μr as constant: a linear material." },
      ],
      checks: [
        {
          id: "b-formula", title: "Check: B, H and M", show: ["axes", "mb", "eq"], patch: { mb: { ...F2425, show: ["H", "B", "M"] } },
          note: "Four checks on magnetization. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "b-formula", type: "choose", prompt: "In a magnetic material, B =", dimension: "recognition",
            options: [
              choice("right", "μ₀(H + M)", true, "Right: free plus bound contributions."),
              choice("wrong", "μ₀H + M", false, "M is in A/m; it needs the μ₀ too.", "M_UNITS"),
              choice("m", "μ₀M", false, "That leaves out the free currents' H."),
            ] },
        },
        {
          id: "predict-mur", title: "Check: a stronger material",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-mur", type: "predict-drag", prompt: "Region 1's μr rises from 2 to 5, with the same H₁. Drag M₁ᵧ to your prediction.", target: { instance: "mb", readout: "M1y" }, range: [0, 20], unit: "A/m", relTol: 0.05, reveal: { mb: { mur1: 5 } }, dimension: "conceptual",
            feedback: { close: "Right: χm = 4, so M₁ᵧ = 12 A/m.", far: "M = (μr − 1)H = 4 × 3 = 12 A/m." } },
        },
        {
          id: "m-num", title: "Check: Hayt D8.6(a)",
          note: "A number.",
          interaction: { id: "m-num", type: "numeric", prompt: "μ = 1.8 × 10⁻⁵ H/m and H = 120 A/m. Find M, in A/m.", answer: { value: 1598.87, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 1718.87, unit: "A/m", errorClass: "conceptual", tag: "M_UNITS", feedback: "That's μrH. M = (μr − 1)H." }],
            hints: ["μr = μ/μ₀.", "χm = μr − 1.", "M = χmH."] },
          covers: ["text:hayt-d8.6"],
        },
        {
          id: "f2425-m", title: "Check: magnetization M₁",
          note: "Last one.",
          interaction: { id: "f2425-m", type: "numeric", prompt: "H₁ = ax + 3ay + 2az A/m in a material with μ₁ = 2μ₀. Find M₁ᵧ, in A/m.", answer: { value: 3, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 6, unit: "A/m", errorClass: "conceptual", tag: "M_UNITS", feedback: "That's μrH. χm = μr − 1 = 1, so M₁ᵧ = 3." }],
            hints: ["χm = μr − 1.", "μr = 2.", "M = χmH."] },
          covers: ["f2425-q3b"],
        },
      ],
      recap: {
        points: ["M is magnetic dipole moment per volume, in A/m.", "B = μ₀(H + M); M = χmH; μr = 1 + χm.", "Given B: M = (B/μ₀)(1 − 1/μr)."],
        traps: ["M = μrH instead of (μr − 1)H.", "B = μ₀H inside a material.", "M in tesla."],
      },
    },
  ],
});