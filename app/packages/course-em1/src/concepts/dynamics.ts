import { meta, src } from "../sources";

const WENT4 = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications, Ch. 4";
const WENT5 = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications, Ch. 5";
const MAXH = "Course notes: Maxwell's equations explained";
const plate = (id: string, ref: string, where: string) => ({ ...meta("vivid", src(ref, where)), id, type: "plate" as const, plateId: id });

const D = "em1.dynamic.faraday";
export const faradayConcept = {
  id: D,
  title: "Faraday's law and Maxwell's equations",
  unit: 4,
  objectives: [
    "State Faraday's law and find induced emf: transformer emf −N dΦ/dt and motional emf; prove the point form ∇ × E = −∂B/∂t with Stokes' theorem.",
    "Explain displacement current, Jd = ∂D/∂t, and compare it with conduction current through σ/(ωε).",
    "State Maxwell's equations in point and integral form, for static and time-varying fields, and explain their significance.",
  ],
  prerequisites: [{ conceptId: "em1.magnetostatics.ampere", minMastery: 0.3 }, { conceptId: "em1.electrostatics.current", minMastery: 0.3 }],
  misconceptions: [
    { tag: "LENZ_SIGN", description: "Drops Lenz's minus sign, or gets the induced current's direction wrong.", remediation: `${D}/main` },
    { tag: "EMF_RATE", description: "Takes the emf from the flux itself rather than its rate of change.", remediation: `${D}/main` },
    { tag: "JD_SOURCE", description: "Thinks displacement current is charge flowing across the gap.", remediation: `${D}/main` },
    { tag: "LOSS_TAN", description: "Uses f instead of ω in σ/(ωε), or inverts the ratio.", remediation: `${D}/main` },
    { tag: "MAXWELL_STATIC", description: "Writes ∇ × E = 0 or ∇ × H = J for time-varying fields.", remediation: `${D}/main` },
  ],
  examLinks: [
    { paper: "Exam-style question", question: "Q4(a)", marks: 8, weight: 1 },
    { paper: "Exam-style question", question: "Q4(a)", marks: 4, weight: 1 },
  ],
  sources: [src(WENT4, "§4.3–4.6"), src(MAXH, "the four equations")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Faraday and Maxwell (in depth)",
      minutes: 60,
      blocks: [plate("idea-faraday-law", WENT4, "§4.3–4.4"), plate("idea-displacement", WENT4, "§4.5"), plate("idea-maxwell", MAXH, "pp. 1–2; Wentworth §4.6")],
    },
  ],
};

const W = "em1.waves.plane-waves";
export const wavesConcept = {
  id: W,
  title: "Plane waves and power",
  unit: 5,
  objectives: [
    "Read a TEM wave E₀e^(−αz) cos(ωt − βz + φ) for ω, β, λ, u and α, and find H through η; in lossless media β = ω√(με) and η = √(μ/ε).",
    "Find α, β and η in a lossy medium from γ = √(jωμ(σ + jωε)), using the loss tangent.",
    "Compare propagation in good dielectrics and good conductors, and find the skin depth δ = 1/α.",
    "State Poynting's theorem and find a wave's average power density.",
  ],
  prerequisites: [{ conceptId: D, minMastery: 0.3 }],
  misconceptions: [
    { tag: "WAVE_BETA_LAMBDA", description: "Confuses β with λ or with ω.", remediation: `${W}/main` },
    { tag: "WAVE_MEDIUM", description: "Uses free-space c, λ or η = 377 Ω inside a material.", remediation: `${W}/main` },
    { tag: "SKIN_DEPTH", description: "Forgets the square root in δ = 1/√(πfμσ), or gives a skin depth in a lossless medium.", remediation: `${W}/main` },
    { tag: "POYNTING_HALF", description: "Drops the ½ in the average Poynting vector.", remediation: `${W}/main` },
  ],
  examLinks: [
    { paper: "Exam-style question", question: "Q4(c)", marks: 5, weight: 1 },
    { paper: "Exam-style question", question: "Q4(b), Q4(c)", marks: 10, weight: 1 },
  ],
  sources: [src(WENT4, "§4.2, 4.7–4.8"), src(WENT5, "§5.1–5.5")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Plane waves (in depth)",
      minutes: 80,
      blocks: [
        plate("idea-tem-wave", WENT4, "§4.2, 4.7"),
        plate("idea-lossy", WENT5, "§5.1–5.3"),
        plate("idea-conductors", WENT5, "§5.4"),
        plate("idea-poynting", WENT5, "§5.5"),
      ],
    },
  ],
};
