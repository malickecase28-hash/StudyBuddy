import { meta, orig, src } from "../sources";

const ID = "em1.intro.em-world";
const UNIT1 = "UTech ELE3001 Unit 1 slides (G. D. Boswell)";

export const emWorld = {
  id: ID,
  title: "EM in the world, and SI units",
  unit: 1,
  objectives: [
    "Explain what electromagnetics studies and where it runs critical infrastructure.",
    "Relate frequency and wavelength across the electromagnetic spectrum (λ = c/f).",
    "Convert prefixed and non-SI units to SI, and write symbols correctly.",
  ],
  prerequisites: [],
  misconceptions: [
    { tag: "WAVELENGTH_INVERSE", description: "Thinks a higher frequency means a longer wavelength.", remediation: `${ID}/main` },
    { tag: "PREFIX_POWER", description: "Squares or cubes the unit but not its prefix (1 cm² = 0.01 m²).", remediation: `${ID}/main` },
    { tag: "SYMBOL_CASE", description: "Confuses m (milli) with M (mega), or similar case slips.", remediation: `${ID}/main` },
  ],
  examLinks: [{ paper: "UTech ELE3001 Finals 2024-25 Sem 1", question: "Q1(a)", marks: 4, weight: 1 }],
  sources: [src(UNIT1, "pp. 1-12")],
  status: "verified" as const,
  rules: [],
  lessons: [
    {
      id: "main",
      title: "EM in the world, and SI units (in depth)",
      minutes: 35,
      blocks: [{ ...meta("vivid", src(UNIT1, "pp. 3-12")), id: "idea-em-world", type: "plate" as const, plateId: "idea-em-world" }],
    },
  ],
};
