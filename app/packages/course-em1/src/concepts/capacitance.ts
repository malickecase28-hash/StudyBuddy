import { meta, src } from "../sources";

const ID = "em1.electrostatics.capacitance";
const L2C = "Course notes, Unit 2c";
export const capacitanceConcept = {
  id: ID,
  title: "Capacitance and stored energy",
  unit: 2,
  objectives: [
    "Define capacitance, C = Q/V, and find it for parallel plates: C = εS/d.",
    "Find the stored energy, W = ½CV² = ½QV = ½Q²/C, and the energy density w_E = ½εE².",
    "Find the capacitance of coaxial and spherical capacitors.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.dielectrics", minMastery: 0.3 }, { conceptId: "em1.electrostatics.potential", minMastery: 0.3 }],
  misconceptions: [
    { tag: "CAP_UNITS", description: "Leaves cm², mm or µm unconverted in C = εS/d.", remediation: `${ID}/main` },
    { tag: "ENERGY_HALF", description: "Drops the ½ in W = ½CV².", remediation: `${ID}/main` },
    { tag: "ENERGY_DENSITY_UNIT", description: "Gives energy density per area (J/m²) instead of per volume (J/m³).", remediation: `${ID}/main` },
    { tag: "CAP_LN", description: "Uses log₁₀, or diameters, in C = 2πεL/ln(b/a).", remediation: `${ID}/main` },
  ],
  examLinks: [
    { paper: "Exam-style question", question: "Q4(c)", marks: 6, weight: 1 },
    { paper: "Exam-style question", question: "Q5(b)", marks: 10, weight: 1 },
  ],
  sources: [src(L2C, "Capacitance")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Capacitance and energy (in depth)",
      minutes: 60,
      blocks: [
        { ...meta("vivid", src(L2C, "Parallel-plate capacitor")), id: "idea-parallel-plate", type: "plate" as const, plateId: "idea-parallel-plate" },
        { ...meta("vivid", src(L2C, "Energy stored")), id: "idea-cap-energy", type: "plate" as const, plateId: "idea-cap-energy" },
        { ...meta("vivid", src(L2C, "Coaxial and spherical capacitors")), id: "idea-coax-sphere", type: "plate" as const, plateId: "idea-coax-sphere" },
      ],
    },
  ],
};
