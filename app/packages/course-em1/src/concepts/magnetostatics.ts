import { meta, src } from "../sources";

const L3A = "UTech ELE3001 Lec 3a slides (G. D. Boswell)";
const L3B = "UTech ELE3001 Lec 3b slides (G. D. Boswell)";
const WENT3 = "Wentworth, Fundamentals of Electromagnetics with Engineering Applications, Ch. 3";
const plate = (id: string, where: string, ref = L3A) => ({ ...meta("vivid", src(ref, where)), id, type: "plate" as const, plateId: id });

const A = "em1.magnetostatics.ampere";
export const ampereConcept = {
  id: A,
  title: "Biot–Savart and Ampère's law",
  unit: 3,
  objectives: [
    "Relate H, B and magnetic flux (B = μH, Φ = ∫B·dS, ∮B·dS = 0), and find the force on a current, F = IL × B.",
    "Find H from currents with the Biot–Savart law: segments, infinite filaments, loops and N-turn coils.",
    "Use Ampère's circuital law for symmetric currents: wires inside and out, hollow cylinders, current sheets and the coax.",
    "Use the point form ∇ × H = J and Stokes' theorem.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.current", minMastery: 0.3 }, { conceptId: "em1.math.vector-calculus", minMastery: 0.3 }],
  misconceptions: [
    { tag: "H_B_UNITS", description: "Mixes up H (A/m) and B (T), or puts μ into H.", remediation: `${A}/main` },
    { tag: "BS_DIRECTION", description: "Gets the direction of dL × aR wrong, or forgets the right-hand rule.", remediation: `${A}/main` },
    { tag: "AMP_ENC_INSIDE", description: "Uses the whole current inside a conductor instead of the enclosed fraction.", remediation: `${A}/main` },
    { tag: "CURL_ZERO", description: "Thinks ∇ × H is nonzero where there is no current.", remediation: `${A}/main` },
  ],
  examLinks: [
    { paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q3(a), Q4(a)", marks: 23, weight: 1 },
    { paper: "UTech ELE3001 Finals 2023-24 Sem 1", question: "Q3(b), Q4(a)", marks: 21, weight: 1 },
  ],
  sources: [src(L3A, "Biot–Savart and Ampère"), src(WENT3, "§3.1–3.6")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Biot–Savart and Ampère (in depth)",
      minutes: 90,
      blocks: [
        plate("idea-b-h-flux", "pp. 5–14; Wentworth §3.5–3.6"),
        plate("idea-biot-savart", "pp. 15–21; Wentworth §3.2"),
        plate("idea-ampere", "pp. 22–31; Wentworth §3.3"),
        plate("idea-curl-stokes", "pp. 32–33; Wentworth §3.4"),
      ],
    },
  ],
};

const M = "em1.magnetostatics.materials";
export const magMaterialsConcept = {
  id: M,
  title: "Magnetic materials and boundaries",
  unit: 3,
  objectives: [
    "Relate B, H and M: B = μ₀(H + M) = μrμ₀H, M = χmH.",
    "Apply the magnetic boundary conditions (normal B and tangential H continuous when K = 0) to find H₂, B₂ and the angles.",
  ],
  prerequisites: [{ conceptId: A, minMastery: 0.3 }, { conceptId: "em1.electrostatics.dielectrics", minMastery: 0.3 }],
  misconceptions: [
    { tag: "M_UNITS", description: "Gives M in tesla, or uses M = χmB.", remediation: `${M}/main` },
    { tag: "MBND_SWAP", description: "Treats tangential B or normal H as continuous.", remediation: `${M}/main` },
  ],
  examLinks: [
    { paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q3(b)", marks: 17, weight: 1 },
    { paper: "UTech ELE3001 Finals 2023-24 Sem 1", question: "Q3(c)", marks: 15, weight: 1 },
  ],
  sources: [src(L3A, "Magnetization and boundary conditions"), src(WENT3, "§3.7–3.8")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Magnetic materials and boundaries (in depth)",
      minutes: 50,
      blocks: [plate("idea-magnetization", "pp. 34–36; Wentworth §3.7"), plate("idea-mag-boundary", "pp. 37–44; Wentworth §3.8")],
    },
  ],
};

const I = "em1.magnetostatics.inductance";
export const inductanceConcept = {
  id: I,
  title: "Inductance and magnetic energy",
  unit: 3,
  objectives: [
    "Find self-inductance L = NΦ/I for the coax, two-wire line, solenoid and toroid.",
    "Find the stored energy W = ½LI², the energy density ½B·H, and mutual inductance.",
  ],
  prerequisites: [{ conceptId: A, minMastery: 0.3 }],
  misconceptions: [
    { tag: "IND_TURNS", description: "Uses N instead of N² in the inductance of a coil.", remediation: `${I}/main` },
    { tag: "IND_LN", description: "Uses log₁₀ in the coax or two-wire inductance.", remediation: `${I}/main` },
    { tag: "WM_HALF", description: "Drops the ½ in W = ½LI².", remediation: `${I}/main` },
  ],
  examLinks: [{ paper: "UTech ELE3001 Finals 2017-18 Sem 1", question: "Q4(b)", marks: 10, weight: 1 }],
  sources: [src(L3B, "Inductance"), src(WENT3, "§3.9–3.10")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Inductance and energy (in depth)",
      minutes: 40,
      blocks: [plate("idea-self-inductance", "pp. 5–21; Wentworth §3.9", L3B), plate("idea-mag-energy", "pp. 15, 25–27; Wentworth §3.9", L3B)],
    },
  ],
};
