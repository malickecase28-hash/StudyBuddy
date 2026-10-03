import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
type V3 = [number, number, number];
const ba = instantiate(templates.find((t) => t.id === "bnd-angle")!, 1);
const F2425 = { D1: [1, 3, -7] as V3, normal: [1, 0, 0] as V3, er1: 5, er2: 1, rhoS: 0, measure: "normal" as const };
const F2324 = { D1: [3, -4, 6] as V3, normal: [1, 0, 0] as V3, er1: 1, er2: 3.5, rhoS: 0, measure: "normal" as const };
const HW03 = { D1: [-10, -20, 14] as V3, normal: [-3, 0, 4] as V3, er1: 8, er2: 5, rhoS: 0, measure: "tangent" as const };

export const ideaRefraction = defineIdeaPlate({
  id: "idea-refraction",
  title: "The refraction law",
  requires: { objectives: [3], items: ["f2425-q2b", "f2324-q2a", "hw03-2425-3.2", "ict2-2425-q2"], misconceptions: ["BND_RATIO_FLIP"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.4 } },
    { id: "b", component: "boundary", params: { ...F2425, show: ["angles", "mag"] } },
    { id: "eq", component: "equation", params: eqp(R`\dfrac{\tan\theta_1}{\tan\theta_2}=\dfrac{\varepsilon_1}{\varepsilon_2}`, "tan theta one over tan theta two equals epsilon one over epsilon two") },
  ],
  ideas: [
    {
      id: "refraction",
      title: "The refraction law",
      objectives: [3],
      explain: [
        {
          id: "bend", title: "Field lines bend at the boundary", show: ["axes", "b", "eq"], focus: ["b", "eq"],
          note: "Measure each field's angle θ from the normal. Then tan θ is tangential over normal: tan θ = |Dₜ|/|Dₙ|. Dₙ is the same on both sides, and Dₜ scales by ε₂/ε₁, so tan θ₂ = (ε₂/ε₁) tan θ₁, or tan θ₁/tan θ₂ = ε₁/ε₂. On the plate, D₁ meets the boundary at θ₁ = 82.52° in the εr1 = 5 region and bends to θ₂ = 56.71° in free space: closer to the normal on the lower-permittivity side.",
          claims: [{ instance: "b", readout: "th1", value: 82.5195, unit: "°" }, { instance: "b", readout: "th2", value: 56.7138, unit: "°" }],
        },
        {
          id: "direct", title: "Or compute θ directly", patch: { eq: eqp(R`\theta=\tan^{-1}\dfrac{|\mathbf D_t|}{|\mathbf D_n|}`, "theta equals the inverse tangent of D t over D n") }, focus: ["eq", "b"],
          note: "You can find θ₂ without the law: θ₂ = tan⁻¹(|D₂ₜ|/|D₂ₙ|). Here, |D₂ₜ| = √(0.6² + 1.4²) = 1.523 and |D₂ₙ| = 1, so θ₂ = tan⁻¹ 1.523 = 56.71°. The law then checks it: tan 82.52°/tan 56.71° = 7.616/1.523 = 5 = εr1/εr2. Within one region D and E point the same way, so both make the same angle.",
          claims: [{ instance: "b", readout: "th2", value: 56.7138, unit: "°" }],
        },
        {
          id: "tangent", title: "Measured from the tangent instead", patch: { b: { ...HW03 } }, focus: ["b"],
          note: "Some questions measure θ from the interface itself. Then tan θ is normal over tangential, and the ratio flips: tan θ₁/tan θ₂ = ε₂/ε₁. One common question does this: θ₁ = 40.69° and θ₂ = 53.99° from the tangent, and tan 40.69°/tan 53.99° = 0.625 = 5/8. Model answers show both conventions. Read which one the question uses before you write the law.",
          claims: [{ instance: "b", readout: "th1", value: 40.6899, unit: "°" }, { instance: "b", readout: "th2", value: 53.987, unit: "°" }],
        },
        {
          id: "cos", title: "The cos ratio", focus: ["b"],
          note: "A follow-up asks for cos θ₁/cos θ₂, with θ from the tangent. Then cos θ = |Eₜ|/|E|, and Eₜ is the same on both sides, so the ratio is |E₂|/|E₁| = 4.803/3.724 = 1.290. The comment it wants: unlike the tangent ratio, this isn't fixed by the materials. It depends on D₁'s direction, and it exceeds 1 because the field is stronger in region 2, the lower-permittivity side.",
          claims: [{ instance: "b", readout: "E1mag", value: 3.72448e11, unit: "V/m" }, { instance: "b", readout: "E2mag", value: 4.80312e11, unit: "V/m" }],
        },
      ],
      examples: [
        {
          id: "f2425", level: "basic", title: "θ₂",
          setup: { b: { ...F2425 } },
          problem: "Continuing the x = 0 boundary, with D₂ = âₓ + 0.6âᵧ − 1.4âz C/m², find the angle θ₂ that D₂ makes with the normal.",
          lines: [
            { text: "|D₂ₜ| = √(0.6² + 1.4²) = 1.523 and |D₂ₙ| = 1.", focus: ["b"] },
            { text: "θ₂ = tan⁻¹(1.523/1) = 56.71° from the normal.", focus: ["b"], claims: [{ instance: "b", readout: "th2", value: 56.7138, unit: "°" }] },
            { text: "Check: tan θ₁ = √(3² + 7²)/1 = 7.616, and 7.616/1.523 = 5 = εr1/εr2.", focus: ["b"], claims: [{ instance: "b", readout: "th1", value: 82.5195, unit: "°" }] },
          ],
          covers: ["f2425-q2b"],
          trap: "Answering 33.29° without saying so. That's the angle from the interface; from the normal it's 56.71°. State your convention.",
        },
        {
          id: "f2324", level: "tutorial", title: "θ₁",
          setup: { b: { ...F2324 } },
          problem: "Region 1 (x < 0) is free space, region 2 (x > 0) has εr2 = 3.5, and D₁ = 3âₓ − 4âᵧ + 6âz C/m². Find θ₁ from the normal, then θ₂.",
          lines: [
            { text: "D₁ₙ = 3âₓ and D₁ₜ = −4âᵧ + 6âz, so tan θ₁ = √(16 + 36)/3 = 7.211/3 = 2.404.", focus: ["b"] },
            { text: "θ₁ = 67.41° from the normal.", focus: ["b"], claims: [{ instance: "b", readout: "th1", value: 67.4115, unit: "°" }] },
            { text: "tan θ₂ = 3.5 × 2.404 = 8.413, so θ₂ = 83.22°: the field swings away from the normal in the denser dielectric.", focus: ["b"], claims: [{ instance: "b", readout: "th2", value: 83.2214, unit: "°" }] },
          ],
          covers: ["f2324-q2a"],
          trap: "Inverting the ratio (tan θ₂ = 2.404/3.5) gives 34.48°, bending the wrong way.",
        },
        {
          id: "hw03", level: "exam", title: "Angles from the tangent",
          setup: { b: { ...HW03 } },
          problem: "For the boundary with ε₁ = 8ε₀, ε₂ = 5ε₀, plane −3x + 4z = 15), measure θ₁ and θ₂ from the interface (not the normal), then find cos θ₁/cos θ₂ and say what it shows.",
          lines: [
            { text: "From the tangent, tan θ = |Dₙ|/|Dₜ|. Region 1: tan θ₁ = 17.2/20.004 = 0.8598, so θ₁ = 40.69°.", focus: ["b"], claims: [{ instance: "b", readout: "th1", value: 40.6899, unit: "°" }] },
            { text: "Region 2: |D₂ₙ| = 17.2 and |D₂ₜ| = 12.502, so tan θ₂ = 1.376 and θ₂ = 53.99°.", focus: ["b"], claims: [{ instance: "b", readout: "th2", value: 53.987, unit: "°" }] },
            { text: "(d) cos θ₁/cos θ₂ = 0.7582/0.5880 = 1.290 = |E₂|/|E₁|. It isn't a material constant: the fixed ratio is tan θ₁/tan θ₂ = ε₂/ε₁ = 0.625.", focus: ["b"], claims: [{ instance: "b", readout: "E2mag", value: 4.80312e11, unit: "V/m" }] },
          ],
          covers: ["hw03-2425-3.2"],
          trap: "Using the from-the-normal law here. This question measures from the tangent, so tan θ₁/tan θ₂ = ε₂/ε₁.",
        },
      ],
      asks: [
        { id: "flip", q: "Which way up is the ratio?", tags: ["BND_RATIO_FLIP"], a: "From the normal, tan θ₁/tan θ₂ = ε₁/ε₂. From the tangent, flip it. A sanity check, measuring from the normal: the field lies closer to the normal on the lower-permittivity side." },
        { id: "same-dir", q: "Do D and E bend by the same angle?", a: "Yes. Within one region D = εE with a single ε, so D and E point the same way. Only their sizes differ." },
        { id: "head-on", q: "What if the field meets the boundary head-on?", a: "Then θ₁ = 0, there's no tangential part, and θ₂ = 0 too. The field crosses straight, with the same D and a different E." },
        { id: "grazing", q: "And if the field runs along the boundary?", a: "θ₁ = 90° from the normal: no normal part. Then D₂ₙ = 0 as well, and the field stays in the plane on both sides, with E unchanged and D scaled by ε₂/ε₁." },
        { id: "cos-comment", q: "What comment does the cos ratio want?", a: "That cos θ₁/cos θ₂ = |E₂|/|E₁|, because the tangential E is shared. It depends on the field's direction, unlike the tangent ratio, which the permittivities alone fix." },
        { id: "degrees", q: "Degrees or radians?", a: "Degrees, to two decimal places, and say which reference you measured from. The papers give marks for the convention as well as the number." },
      ],
      checks: [
        {
          id: "law-c", title: "Check: the law", show: ["axes", "b", "eq"], patch: { b: { ...F2425 } },
          note: "Four checks on the refraction law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "law-c", type: "choose", prompt: "With θ measured from the normal, tan θ₁/tan θ₂ =", dimension: "recognition",
            options: [
              choice("right", "ε₁/ε₂", true, "Right: Dₜ scales by ε₂/ε₁ while Dₙ stays."),
              choice("flip", "ε₂/ε₁", false, "That's the law from the tangent.", "BND_RATIO_FLIP"),
              choice("one", "1", false, "Only if ε₁ = ε₂."),
            ] },
        },
        {
          id: "predict-er1", title: "Check: a stronger region 1",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-er1", type: "predict-drag", prompt: "εr1 rises from 5 to 10, with the same D₁. Drag θ₂ to your prediction.", target: { instance: "b", readout: "th2" }, range: [0, 90], unit: "°", relTol: 0.05, reveal: { b: { er1: 10 } }, dimension: "conceptual",
            feedback: { close: "Right: tan θ₂ = 7.616/10, so θ₂ = 37.29°.", far: "tan θ₂ = (ε₂/ε₁) tan θ₁ = 7.616/10: θ₂ = 37.29°." } },
        },
        {
          id: "angle-num", title: "Check: an angle, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "angle-num", type: "numeric", prompt: ba.prompt, answer: ba.spec.answer, distractors: ba.spec.distractors, relTol: ba.spec.relTol, hints: ba.hints, template: "bnd-angle", dimension: "computational" },
        },
        {
          id: "ict-ratio", title: "Check: the tangent ratio",
          note: "Last one.",
          interaction: { id: "ict-ratio", type: "numeric", prompt: "εr1 = 21 and εr2 = 7, with θ measured from the tangent. Find tan θ₁/tan θ₂.", answer: { value: 0.333333, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 3, unit: "", errorClass: "conceptual", tag: "BND_RATIO_FLIP", feedback: "That's the ratio from the normal. From the tangent it's ε₂/ε₁ = 7/21." }],
            hints: ["From the tangent, tan θ = |Dₙ|/|Dₜ|.", "Dₙ is shared; Dₜ scales by ε₂/ε₁.", "tan θ₁/tan θ₂ = ε₂/ε₁."] },
          covers: ["ict2-2425-q2"],
        },
      ],
      recap: {
        points: [
          "From the normal: tan θ = |Dₜ|/|Dₙ| and tan θ₁/tan θ₂ = ε₁/ε₂.",
          "From the tangent: the ratio flips to ε₂/ε₁.",
          "D and E share each region's angle.",
          "cos θ₁/cos θ₂ (from the tangent) = |E₂|/|E₁|; not a material constant.",
        ],
        traps: ["Mixing up the conventions.", "Inverting the ratio.", "Giving an angle without saying what it's measured from."],
      },
    },
  ],
});
