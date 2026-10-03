import { meta, src } from "../sources";

const ID = "em1.electrostatics.current";
const L2C = "Course notes, Unit 2c";
export const currentConcept = {
  id: ID,
  title: "Current density, continuity and Ohm's law",
  unit: 2,
  objectives: [
    "Relate current, current density and conductivity: I = ∫J·dS, J = σE, R = L/(σS), P = I²R.",
    "State, prove and apply the continuity equation ∇·J = −∂ρv/∂t.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.field", minMastery: 0.3 }, { conceptId: "em1.electrostatics.divergence", minMastery: 0.3 }],
  misconceptions: [
    { tag: "J_AREA", description: "Divides current by the circumference or diameter instead of the cross-sectional area.", remediation: `${ID}/main` },
    { tag: "CONTINUITY_SIGN", description: "Drops the minus sign: thinks outflow increases the enclosed charge.", remediation: `${ID}/main` },
  ],
  examLinks: [{ paper: "Exam-style question", question: "Q4(b)", marks: 5, weight: 1 }],
  sources: [src(L2C, "Current and Ohm's law")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Current and continuity (in depth)",
      minutes: 40,
      blocks: [
        { ...meta("vivid", src(L2C, "Current density")), id: "idea-ohm", type: "plate" as const, plateId: "idea-ohm" },
        { ...meta("vivid", src(L2C, "Continuity")), id: "idea-continuity", type: "plate" as const, plateId: "idea-continuity" },
      ],
    },
  ],
};
