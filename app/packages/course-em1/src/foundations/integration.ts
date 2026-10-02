import { meta, orig } from "../sources";

const ANTI = "m0.int.antiderivatives", DEF = "m0.int.definite", SUB = "m0.int.substitution", PARTS = "m0.int.parts", CHOOSE = "m0.int.choosing";
const block = (plateId: string, topic: string) => ({ ...meta("vivid", orig(`Maths Foundations · ${topic}`)), id: plateId, type: "plate" as const, plateId });
const lessons = (plateId: string, title: string, minutes: number) => [{ id: "main", title: `${title} (in depth)`, minutes, blocks: [block(plateId, title)] }];
const mis = (id: string, tag: string, description: string) => ({ tag, description, remediation: `${id}/main` });
const after = (id: string) => [{ conceptId: id, minMastery: 0.3 }];
const base = { unit: 4, examLinks: [], sources: [orig("Maths Foundations, Unit D: Integration")], status: "verified" as const, rules: [] };

export const antiderivatives = {
  ...base, id: ANTI, title: "Antiderivatives",
  objectives: ["Find antiderivatives with the power rule and the standard list, term by term, and check them by differentiating."],
  prerequisites: [],
  misconceptions: [
    mis(ANTI, "FORGOT_CONSTANT", "Leaves out + C on an indefinite integral."),
    mis(ANTI, "POWER_RULE_DIFFERENTIATES", "Differentiates instead of integrating: writes nxⁿ⁻¹ for ∫xⁿ dx."),
    mis(ANTI, "INSIDE_CONSTANT_MULTIPLY", "Multiplies by an inside constant instead of dividing: ∫e^(2x) dx = 2e^(2x)."),
  ],
  lessons: lessons("m0-antiderivatives", "Antiderivatives", 25),
};

export const definite = {
  ...base, id: DEF, title: "Definite integrals",
  objectives: ["Evaluate definite integrals as F(b) − F(a), read them as signed area and as a sum of thin strips, and use the values EM meets most."],
  prerequisites: after(ANTI),
  misconceptions: [
    mis(DEF, "LIMITS_REVERSED", "Subtracts F(b) from F(a)."),
    mis(DEF, "NEGATIVE_AREA_IGNORED", "Treats a definite integral as total area when the curve crosses the axis."),
    mis(DEF, "DROPS_LOWER_LIMIT", "Evaluates the antiderivative at the upper limit only."),
  ],
  lessons: lessons("m0-definite", "Definite integrals", 25),
};

export const substitution = {
  ...base, id: SUB, title: "Substitution",
  objectives: ["Spot an inside function with its derivative, substitute u, change the limits, and recognise the substitutions EM coordinates supply."],
  prerequisites: after(DEF),
  misconceptions: [
    mis(SUB, "SUB_MISSING_DU", "Substitutes u but loses or misscales the du factor."),
    mis(SUB, "SUB_OLD_LIMITS", "Keeps the x-limits after changing to u."),
    mis(SUB, "SUB_LEFTOVER_X", "Leaves x in the integral after substituting."),
  ],
  lessons: lessons("m0-substitution", "Substitution", 30),
};

export const parts = {
  ...base, id: PARTS, title: "Integration by parts",
  objectives: ["Integrate products by parts, choosing u well, with and without limits, and know when substitution or a change of coordinates is better."],
  prerequisites: after(SUB),
  misconceptions: [
    mis(PARTS, "PARTS_WRONG_U", "Chooses u so that the new integral is harder (u = eˣ for x eˣ)."),
    mis(PARTS, "PARTS_SIGN", "Drops the minus sign in uv − ∫v du."),
    mis(PARTS, "PARTS_WHEN_SUB", "Uses parts where a substitution works."),
  ],
  lessons: lessons("m0-parts", "Integration by parts", 30),
};

export const choosing = {
  ...base, id: CHOOSE, title: "Choosing a technique",
  objectives: ["Choose a method for any integral (symmetry, algebra, standard forms, substitution, parts, coordinates) and check the answer."],
  prerequisites: after(PARTS),
  misconceptions: [
    mis(CHOOSE, "SIN2_DIRECT", "Integrates sin²x as (sin³x)/3."),
    mis(CHOOSE, "ODD_SYMMETRY_MISSED", "Doubles or computes an odd integrand over a symmetric interval instead of using zero."),
    mis(CHOOSE, "JACOBIAN_DROPPED", "Changes to polar or cylindrical coordinates without the ρ in dA."),
  ],
  lessons: lessons("m0-choosing", "Choosing a technique", 30),
};

export const integrationConcepts = [antiderivatives, definite, substitution, parts, choosing];