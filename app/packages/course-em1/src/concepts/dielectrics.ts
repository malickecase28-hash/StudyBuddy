import { meta, src } from "../sources";

const ID = "em1.electrostatics.dielectrics";
const L2C = "UTech ELE3001 Lec 2c slides (G. D. Boswell)";
export const dielectricsConcept = {
  id: ID,
  title: "Dielectrics and boundary conditions",
  unit: 2,
  objectives: [
    "Relate D, E and P in a dielectric: D = ε₀E + P = εr ε₀E.",
    "Apply the tangential condition E₁ₜ = E₂ₜ, so that D₂ₜ = (ε₂/ε₁)D₁ₜ.",
    "Split D into normal and tangential parts at any plane, and apply D₁ₙ − D₂ₙ = ρs.",
    "Find the angles fields make at a boundary, and use tan θ₁/tan θ₂ = ε₁/ε₂.",
    "Apply the conductor conditions: E = 0 inside, and Eₜ = 0 and Dₙ = ρs at the surface.",
  ],
  prerequisites: [{ conceptId: "em1.electrostatics.gauss-law", minMastery: 0.3 }, { conceptId: "em1.math.vectors", minMastery: 0.3 }],
  misconceptions: [
    { tag: "D_VS_E_PERMITTIVITY", description: "Thinks D changes with the medium when the free charge doesn't.", remediation: "em1.electrostatics.gauss-law/d-vs-e" },
    { tag: "EPS0_DROPPED", description: "Divides D by εr but forgets ε₀.", remediation: `${ID}/main` },
    { tag: "BND_D_TANGENT", description: "Treats tangential D as continuous; it is tangential E.", remediation: `${ID}/main` },
    { tag: "BND_E_NORMAL", description: "Treats normal E as continuous; it is normal D (when ρs = 0).", remediation: `${ID}/main` },
    { tag: "BND_NORMAL_UNIT", description: "Projects onto the plane's coefficients without normalising them.", remediation: `${ID}/main` },
    { tag: "BND_RATIO_FLIP", description: "Inverts the permittivity ratio in D₂ₜ or in the refraction law.", remediation: `${ID}/main` },
    { tag: "COND_E_INSIDE", description: "Allows a field inside a conductor, or a tangential field on its surface.", remediation: `${ID}/main` },
  ],
  examLinks: [
    { paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q2(b)", marks: 17, weight: 1 },
    { paper: "UTech ELE3001 Finals 2023-24 Sem 1", question: "Q2(a)", marks: 13, weight: 1 },
  ],
  sources: [src(L2C, "Dielectrics and boundary conditions")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Dielectrics and boundaries (in depth)",
      minutes: 100,
      blocks: [
        { ...meta("vivid", src(L2C, "Polarization")), id: "idea-polarization", type: "plate" as const, plateId: "idea-polarization" },
        { ...meta("vivid", src(L2C, "Boundary conditions: tangential")), id: "idea-bc-tangential", type: "plate" as const, plateId: "idea-bc-tangential" },
        { ...meta("vivid", src(L2C, "Boundary conditions: normal")), id: "idea-bc-normal", type: "plate" as const, plateId: "idea-bc-normal" },
      ],
    },
  ],
};
