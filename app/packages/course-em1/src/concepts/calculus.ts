import { meta, SLIDES_2A, src } from "../sources";

const ID = "em1.math.vector-calculus";

export const vectorCalculus = {
  id: ID,
  title: "Gradient, divergence and curl",
  unit: 2,
  objectives: [
    "Find the gradient of a scalar field in cartesian, cylindrical and spherical coordinates, and use it for directional derivatives.",
    "Find the divergence of a vector field in all three systems, and read it as outward flux per unit volume (the divergence theorem).",
    "Find the curl in all three systems, and read it as circulation per unit area (Stokes' theorem).",
  ],
  prerequisites: [{ conceptId: "em1.math.vectors", minMastery: 0.3 }],
  misconceptions: [
    { tag: "MISSING_SCALE_FACTORS", description: "Drops 1/ρ, 1/r or 1/(r sin θ) in curved-coordinate operators.", remediation: `${ID}/main` },
    { tag: "OPERATOR_SYSTEM_MISMATCH", description: "Applies one coordinate system's formula to a field written in another.", remediation: `${ID}/main` },
    { tag: "GRAD_DIV_TYPE", description: "Mixes up which operators return scalars and which return vectors.", remediation: `${ID}/main` },
  ],
  examLinks: [],
  sources: [src(SLIDES_2A, "Vector calculus")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "Gradient, divergence and curl (in depth)",
      minutes: 75,
      blocks: [{ ...meta("vivid", src(SLIDES_2A, "Gradient")), id: "idea-gradient", type: "plate" as const, plateId: "idea-gradient" }, { ...meta("vivid", src(SLIDES_2A, "Divergence")), id: "idea-divergence", type: "plate" as const, plateId: "idea-divergence" }, { ...meta("vivid", src(SLIDES_2A, "Curl")), id: "idea-curl", type: "plate" as const, plateId: "idea-curl" }],
    },
  ],
};
