import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
type V3 = [number, number, number];
const mbn = instantiate(templates.find((t) => t.id === "mag-bnd-normal")!, 1);
const iMU = 1 / (4e-7 * Math.PI);
const F2425 = { given: "H" as const, F1: [1, 3, 2] as V3, normal: [2, 1, 0] as V3, mur1: 2, mur2: 8, measure: "normal" as const };
const HW033 = { given: "H" as const, F1: [9.44 * iMU, 6.87 * iMU, -12.2 * iMU] as V3, normal: [5, 4, 10] as V3, mur1: 4.66, mur2: 6.99, measure: "normal" as const };

export const ideaMagBoundary = defineIdeaPlate({
  id: "idea-mag-boundary",
  title: "Magnetic boundary conditions",
  requires: {
    objectives: [1],
    items: ["f1718-q4a", "hw03-2425-3.3", "ict2-2425-q3", "f2324-q3c", "f2425r-q3b", "drill25-q8", "drill25-q9", "f1516-q4c", "lecture:lec3a-q13"],
    misconceptions: ["MBND_SWAP"],
  },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "mb", component: "mag-boundary", params: { ...F2425, show: ["n", "split", "H", "angles"] } },
    { id: "eq", component: "equation", params: eqp(R`B_{1n}=B_{2n},\qquad \mathbf H_{1t}=\mathbf H_{2t}\ (K=0)`, "normal B is continuous, and tangential H is continuous") },
  ],
  ideas: [
    {
      id: "mbnd",
      title: "Magnetic boundary conditions",
      objectives: [1],
      explain: [
        {
          id: "rules", title: "Two rules", show: ["axes", "mb", "eq"], focus: ["eq", "mb"],
          note: "The magnetic boundary conditions mirror the electric ones (Wentworth §3.8). Gauss's law for magnetism on a flat pillbox gives B₁ₙ = B₂ₙ: normal B is continuous. Ampère's law round a thin loop gives H₁ₜ − H₂ₜ = K. With no surface current, K = 0 and tangential H is continuous. So normal B and tangential H carry across, just as normal D and tangential E did.",
        },
        {
          id: "split", title: "Split H₁", focus: ["mb"],
          note: "Finals 2024-25 Q3(b): the plane y + 2x − 4 = 0 has normal (2, 1, 0), so n̂ = (2, 1, 0)/√5. With H₁ = ax + 3ay + 2az A/m, H₁·n̂ = 5/√5, so H₁ₙ = 2ax + ay and H₁ₜ = H₁ − H₁ₙ = −ax + 2ay + 2az A/m. Tangential H carries over unchanged. Normal B carries over, so μ₁H₁ₙ = μ₂H₂ₙ.",
          claims: [
            { instance: "mb", readout: "H1nx", value: 2, unit: "A/m" }, { instance: "mb", readout: "H1ny", value: 1, unit: "A/m" },
            { instance: "mb", readout: "H1tx", value: -1, unit: "A/m" }, { instance: "mb", readout: "H1tz", value: 2, unit: "A/m" },
          ],
        },
        {
          id: "assemble", title: "Assemble H₂ and B₂", patch: { mb: { show: ["n", "split", "H", "B"] } }, focus: ["mb"],
          note: "With μ₁ = 2μ₀ and μ₂ = 8μ₀: H₂ₙ = (2/8)H₁ₙ = 0.5ax + 0.25ay, and H₂ₜ = −ax + 2ay + 2az. So H₂ = −0.5ax + 2.25ay + 2az A/m, and B₂ = 8μ₀H₂ = −5.027ax + 22.62ay + 20.11az µT. Check the rule: B₂ₙ = 8μ₀(0.5, 0.25, 0) = 2μ₀(2, 1, 0) = B₁ₙ.",
          claims: [{ instance: "mb", readout: "H2x", value: -0.5, unit: "A/m" }, { instance: "mb", readout: "H2y", value: 2.25, unit: "A/m" }, { instance: "mb", readout: "B2y", value: 2.26195e-5, unit: "T" }],
        },
        {
          id: "refract", title: "The refraction law", patch: { mb: { show: ["angles", "mag"] }, eq: eqp(R`\dfrac{\tan\theta_1}{\tan\theta_2}=\dfrac{\mu_1}{\mu_2}`, "tan theta one over tan theta two equals mu one over mu two") }, focus: ["mb", "eq"],
          note: "Measured from the normal, tan θ = |Ht|/|Hn|. Ht is shared and μHn is shared, so tan θ₁/tan θ₂ = μ₁/μ₂. Here θ₁ = 53.30° and θ₂ = 79.44°: the field swings toward the boundary in the higher-permeability region. That is why iron guides flux: lines entering iron from air bend almost parallel to its surface.",
          claims: [{ instance: "mb", readout: "th1", value: 53.3008, unit: "°" }, { instance: "mb", readout: "th2", value: 79.4446, unit: "°" }],
        },
      ],
      examples: [
        {
          id: "drill25-q9", level: "basic", title: "Drill 2025 Q9: the ratio from B alone",
          setup: { mb: { given: "B", F1: [40 / iMU, 0, -25 / iMU], normal: [0, 0, 1], mur1: 8, mur2: 7, measure: "tangent", show: ["B", "angles"] } },
          problem: "A plane interface between two magnetic regions is normal to one Cartesian axis. B₁ = μ₀(40.0ax − 25.0az) T and B₂ = μ₀(35.0ax − 25.0az) T. Find tan θ₁/tan θ₂, with the angles measured from the interface.",
          lines: [
            { text: "Normal B is continuous, and only the z components match (−25 on both sides), so the interface is normal to az.", focus: ["mb"] },
            { text: "From the interface, tan θ = |Bₙ|/|Bₜ|: tan θ₁ = 25/40, so θ₁ = 32.01°; tan θ₂ = 25/35, so θ₂ = 35.54°.", focus: ["mb"], claims: [{ instance: "mb", readout: "th1", value: 32.0054, unit: "°" }, { instance: "mb", readout: "th2", value: 35.5377, unit: "°" }] },
            { text: "tan θ₁/tan θ₂ = 35/40 = 0.875, which is μ₂/μ₁ because Hₜ is shared.", focus: ["mb"] },
          ],
          covers: ["drill25-q9", "lecture:lec3a-q13"],
          trap: "Assuming the interface is normal to ax. The x components differ, so x is tangential.",
        },
        {
          id: "f1718", level: "tutorial", title: "Finals 2017-18 Q4(a): H₂ and B₂",
          setup: { mb: { given: "H", F1: [-2, 6, 4], normal: [-1, 1, 0], mur1: 1, mur2: 2, measure: "normal", show: ["n", "split", "H", "B"] } },
          problem: "H₁ = −2ax + 6ay + 4az A/m in the region y − x − 2 ≤ 0, where μ₁ = μ₀. Calculate (i) M₁ and B₁, (ii) H₂ and B₂ in the region y − x − 2 ≥ 0, where μ₂ = 2μ₀.",
          lines: [
            { text: "(i) μr1 = 1, so M₁ = 0 and B₁ = μ₀H₁ = −2.513ax + 7.540ay + 5.027az µT.", focus: ["mb"], claims: [{ instance: "mb", readout: "B1y", value: 7.53982e-6, unit: "T" }] },
            { text: "n̂ = (−ax + ay)/√2; H₁·n̂ = 8/√2, so H₁ₙ = −4ax + 4ay and H₁ₜ = 2ax + 2ay + 4az A/m.", focus: ["mb"], claims: [{ instance: "mb", readout: "H1nx", value: -4, unit: "A/m" }, { instance: "mb", readout: "H1tz", value: 4, unit: "A/m" }] },
            { text: "(ii) H₂ₙ = ½H₁ₙ = −2ax + 2ay, so H₂ = 4ay + 4az A/m and B₂ = 2μ₀H₂ = 10.05ay + 10.05az µT.", focus: ["mb"], claims: [{ instance: "mb", readout: "H2y", value: 4, unit: "A/m" }, { instance: "mb", readout: "B2z", value: 1.00531e-5, unit: "T" }] },
          ],
          covers: ["f1718-q4a"],
          trap: "Dividing the whole of H₁ by 2. Only the normal part changes; the tangential part crosses unchanged.",
        },
        {
          id: "hw03", level: "exam", title: "HW03 3.3: H₂, B₂, the angles and M",
          setup: { mb: { ...HW033, show: ["n", "H", "B", "angles"] } },
          problem: "Region 1 (μr1 = 4.66) and region 2 (μr2 = 1.5μr1) meet at the plane 5x + 4y + 10z − 12 = 0, with K = 0. In region 1, H₁ = (1/μ₀)(9.44ax + 6.87ay − 12.2az) A/m. Calculate (a) H₂ in terms of μ₀, (b) B₂, (c) θ₁ and θ₂ from the normal, (d) M₁ and M₂.",
          lines: [
            { text: "n̂ = (5, 4, 10)/√141. μ₀H₁·n̂ = −3.985, so μ₀H₁ₙ = −1.678ax − 1.342ay − 3.356az and μ₀H₁ₜ = 11.12ax + 8.212ay − 8.844az.", focus: ["mb"] },
            { text: "(a) μr2 = 6.99, so H₂ₙ = (4.66/6.99)H₁ₙ, and H₂ = (1/μ₀)(10.00ax + 7.317ay − 11.08az) A/m.", focus: ["mb"], claims: [{ instance: "mb", readout: "H2x", value: 7.95722e6, unit: "A/m" }, { instance: "mb", readout: "H2z", value: -8.81824e6, unit: "A/m" }] },
            { text: "(b) B₂ = μr2μ₀H₂ = 69.90ax + 51.15ay − 77.46az T.", focus: ["mb"], claims: [{ instance: "mb", readout: "B2x", value: 69.8954, unit: "T" }] },
            { text: "(c) θ₁ = 76.35° and θ₂ = 80.80° from the normal; check: tan θ₁/tan θ₂ = 4.66/6.99.", focus: ["mb"], claims: [{ instance: "mb", readout: "th1", value: 76.3499, unit: "°" }, { instance: "mb", readout: "th2", value: 80.8035, unit: "°" }] },
            { text: "(d) M₁ = 3.66H₁ = (1/μ₀)(34.55ax + 25.14ay − 44.65az) A/m; M₂ = 5.99H₂ = (1/μ₀)(59.90ax + 43.83ay − 66.38az) A/m.", focus: ["mb"] },
          ],
          covers: ["hw03-2425-3.3"],
          trap: "Using μr2 = 1.5 instead of 1.5 × 4.66 = 6.99. Read 'μr2 = 1.5μr1' carefully.",
        },
      ],
      asks: [
        { id: "swap", q: "Which components are continuous at a magnetic boundary?", tags: ["MBND_SWAP"], a: "Normal B and, with no surface current, tangential H. Not normal H, and not tangential B: those jump by the permeability ratio." },
        { id: "k", q: "What if there is a surface current K?", a: "Then H₁ₜ − H₂ₜ = K × aₙ₁₂: tangential H jumps by the surface current density. Every course question sets K = 0 and says so." },
        { id: "twin", q: "How do these compare with the electric conditions?", a: "Swap D for B, E for H, ε for μ and ρs for K. Normal D becomes normal B; tangential E becomes tangential H." },
        { id: "iron", q: "Why does iron guide magnetic flux?", a: "With μ₂ ≫ μ₁, tan θ₂ = (μ₂/μ₁) tan θ₁ is huge, so inside iron the field runs almost parallel to the surface. Flux stays in the iron, which is how magnetic circuits work." },
        { id: "mu0", q: "Do I keep μ₀ as a symbol?", a: "Often, yes. HW03 3.3 gives H₁ with 1/μ₀ outside, and the cleanest answers keep it: H₂ = (1/μ₀)(…) A/m. Note the units, as the lecturer stresses." },
        { id: "plane", q: "How do I get the normal of y − x − 2 = 0?", a: "Read the coefficients, (−1, 1, 0), and divide by the length √2. The constant 2 only places the plane." },
      ],
      checks: [
        {
          id: "rule-c", title: "Check: what carries across", show: ["axes", "mb", "eq"], patch: { mb: { ...F2425, show: ["n", "split", "H", "angles"] } },
          note: "Eight checks on magnetic boundaries. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "rule-c", type: "choose", prompt: "With K = 0, at a magnetic boundary…", dimension: "recognition",
            options: [
              choice("right", "Bₙ and Hₜ are continuous", true, "Right."),
              choice("swap", "Hₙ and Bₜ are continuous", false, "Swapped: Gauss gives Bₙ, Ampère gives Hₜ.", "MBND_SWAP"),
              choice("all", "B is continuous", false, "Only its normal part."),
            ] },
        },
        {
          id: "predict-mu2", title: "Check: a stronger region 2",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-mu2", type: "predict-drag", prompt: "μ₂ rises from 8μ₀ to 16μ₀, with the same H₁. Drag θ₂ to your prediction.", target: { instance: "mb", readout: "th2" }, range: [0, 90], unit: "°", relTol: 0.05, reveal: { mb: { mur2: 16 } }, dimension: "conceptual",
            feedback: { close: "Right: 84.68°, even closer to the boundary.", far: "H₂ₙ shrinks to (2/16)H₁ₙ while Hₜ stays: θ₂ = 84.68°." } },
        },
        {
          id: "mbn-num", title: "Check: normal H, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "mbn-num", type: "numeric", prompt: mbn.prompt, answer: mbn.spec.answer, distractors: mbn.spec.distractors, relTol: mbn.spec.relTol, hints: mbn.hints, template: "mag-bnd-normal", dimension: "computational" },
        },
        {
          id: "ict2-q3", title: "Check: ICT 2 Q3",
          note: "From the lecturer's ICT.",
          interaction: { id: "ict2-q3", type: "numeric", prompt: "ICT 2 Q3: B₁ = 14ax − 35ay + 28az µT meets the plane 12x + 5z = 3π, with μr1 = 8 and μr2 = 25 (K = 0). Find the angle B₂ makes with the normal, in degrees.", answer: { value: 79.4078, unit: "°" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 59.6986, unit: "°", errorClass: "conceptual", feedback: "That's θ₁, in region 1. B₂ₜ = (25/8)B₁ₜ makes region 2's angle larger." }],
            hints: ["n̂ = (12, 0, 5)/13; B₁ₙ = (308/169)(12, 0, 5) µT.", "B₂ₙ = B₁ₙ; B₂ₜ = (μ₂/μ₁)B₁ₜ.", "θ₂ = cos⁻¹(|B₂ₙ|/|B₂|)."] },
          covers: ["ict2-2425-q3"],
        },
        {
          id: "f2324-q3c", title: "Check: Finals 2023-24 Q3(c)(ii)",
          note: "Another plane.",
          interaction: { id: "f2324-q3c", type: "numeric", prompt: "Finals 2023-24 Q3(c): H₁ = 2ax + 3ay − az A/m (μ₁ = μ₀) at the plane y − x − 2 = 0; μ₂ = 3μ₀. Find H₂ᵧ, in A/m.", answer: { value: 2.66667, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 3, unit: "A/m", errorClass: "conceptual", tag: "MBND_SWAP", feedback: "y isn't purely tangential to this plane: H₁ₙ = −0.5ax + 0.5ay changes by μ₁/μ₂." }],
            hints: ["n̂ = (−1, 1, 0)/√2; H₁ₙ = −0.5ax + 0.5ay.", "H₂ₙ = H₁ₙ/3.", "H₂ᵧ = (3 − 0.5) + 0.5/3."] },
          covers: ["f2324-q3c"],
        },
        {
          id: "f2425r", title: "Check: the 2024-25 resit Q3(b)",
          note: "The resit.",
          interaction: { id: "f2425r", type: "numeric", prompt: "H₁ = 6ax + 3ay + 2az A/m with μ₁ = 2μ₀ in 3x + 4z ≤ 19; μ₂ = 4μ₀ beyond. Find H₂ₓ, in A/m.", answer: { value: 4.44, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 6, unit: "A/m", errorClass: "conceptual", tag: "MBND_SWAP", feedback: "x has a normal part here: n̂ = (0.6, 0, 0.8)." }],
            hints: ["n̂ = (0.6, 0, 0.8); H₁·n̂ = 5.2.", "H₁ₙ = 3.12ax + 4.16az; H₂ₙ = H₁ₙ/2.", "H₂ₓ = 2.88 + 1.56."] },
          covers: ["f2425r-q3b"],
        },
        {
          id: "drill25-q8", title: "Check: Drill 2025 Q8",
          note: "From the interface.",
          interaction: { id: "drill25-q8", type: "numeric", prompt: "B₁ = 12ax + 10ay − 14az T in region 1 (z < 0, μr1 = 15); region 2 (z > 0) has μr2 = 1. Find the angle B₂ makes with the interface, in degrees.", answer: { value: 85.746, unit: "°" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 41.8685, unit: "°", errorClass: "conceptual", feedback: "That's region 1's angle. B₂ₜ = B₁ₜ/15, so B₂ stands much steeper." }],
            hints: ["B₂z = −14; B₂ₜ = (μ₂/μ₁)B₁ₜ = (12, 10)/15.", "From the interface: tan θ = |Bₙ|/|Bₜ|.", "tan θ₂ = 14/√(0.8² + 0.667²)."] },
          covers: ["drill25-q8"],
        },
        {
          id: "f1516", title: "Check: Finals 2015-16 Q4(c)",
          note: "Last one.",
          interaction: { id: "f1516", type: "numeric", prompt: "At the xy-plane boundary, B₁ = 5ax + 6ay + 7az Wb/m² in medium 1 (μr1 = 1); medium 2 has μr2 = 16. Find H₂z, in A/m.", answer: { value: 348151, unit: "A/m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 5.57042e6, unit: "A/m", errorClass: "conceptual", tag: "MBND_SWAP", feedback: "That copies H₁z. It's B₂z = 7 that's continuous; H₂z = 7/(16μ₀)." }],
            hints: ["z is normal: B₂z = B₁z = 7.", "H₂z = B₂z/(μr2μ₀).", "7/(16 × 4π × 10⁻⁷)."] },
          covers: ["f1516-q4c"],
        },
      ],
      recap: {
        points: [
          "K = 0: B₁ₙ = B₂ₙ and H₁ₜ = H₂ₜ.",
          "Recipe: n̂; H₁ₙ = (H₁·n̂)n̂; H₁ₜ = H₁ − H₁ₙ; H₂ = H₁ₜ + (μ₁/μ₂)H₁ₙ; B₂ = μ₂H₂.",
          "From the normal: tan θ₁/tan θ₂ = μ₁/μ₂.",
          "High-μ regions pull the field toward the boundary.",
        ],
        traps: ["Continuous Hₙ or Bₜ.", "Scaling all of H₁.", "Mixing up angle references."],
      },
    },
  ],
});