import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const vp = instantiate(templates.find((t) => t.id === "v-point")!, 1);
const pt = (id: string, q: number, pos: number[], label?: string) => ({ id, kind: "point" as const, q, pos, ...(label ? { label } : {}) });
const EX5 = { items: [pt("a", -4, [2, -1, 3], "Q1 = −4 µC"), pt("b", 5, [0, 4, -2], "Q2 = +5 µC")], oblique: true, drawScale: 0.3 };

export const ideaVPoint = defineIdeaPlate({
  id: "idea-v-point",
  title: "The potential of point charges",
  requires: { objectives: [1], items: ["lecture:lec2b-ex5", "mst-2324-q2c"], misconceptions: ["V_VECTOR", "V_INVERSE_SQUARE"] },
  instances: [
    { id: "q", component: "charges", params: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")] } },
    { id: "ep", component: "e-probe", params: { point: [1, 0, 0] }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`V=\dfrac{Q}{4\pi\varepsilon_0R}`, speech: "V equals Q over four pi epsilon nought R", shortSpeech: "point potential" } },
  ],
  ideas: [
    {
      id: "v-point",
      title: "The potential of point charges",
      objectives: [1],
      explain: [
        {
          id: "formula", title: "V = Q/(4πε₀R)", show: ["q", "ep", "eq"], focus: ["ep", "eq"],
          note: "Bring a test charge in from infinity toward a point charge Q, integrate −E·dL, and the potential at distance R comes out as V = Q/(4πε₀R), with V = 0 at infinity. On the plate, 1 m from +2 µC, V = 17975 V. That is the same number as E's size there, but with units of volts, not volts per metre. The coincidence holds only at R = 1 m.",
          claims: [{ instance: "ep", readout: "V", value: 17975.1, unit: "V" }],
        },
        {
          id: "falloff", title: "It falls as 1/R, not 1/R²", patch: { ep: { point: [2, 0, 0] } }, focus: ["ep"],
          note: "At 2 m the potential is half as much, 8988 V; the field fell to a quarter. Potential is one integration of the field, so it loses one power of R: E goes as 1/R², V as 1/R. This is the most common slip in potential questions.",
          claims: [{ instance: "ep", readout: "V", value: 8987.55, unit: "V" }],
        },
        {
          id: "scalar", title: "Potentials add as numbers", patch: { q: EX5, ep: { point: [1, 0, 1], oblique: true, drawScale: 0.3 } }, focus: ["q", "ep"],
          note: "Potential is a scalar, so superposition is simple addition: no unit vectors, no components. Each charge contributes Qᵢ/(4πε₀|r − rᵢ|), with its sign. For two charges, −4 µC at (2, −1, 3) and +5 µC at (0, 4, −2) give V = −5.864 kV at (1, 0, 1). A −5.872 kV answer comes from 1/(4πε₀) ≈ 9 × 10⁹; with ε₀ = 8.854 × 10⁻¹², it is −5.864 kV.",
          claims: [{ instance: "ep", readout: "V", value: -5863.59, unit: "V" }],
        },
        {
          id: "sphere", title: "A charged sphere", patch: { q: { items: [pt("a", 200000, [0, 0, 0], "Q = +200 mC")], oblique: false, drawScale: 1 }, ep: { point: [0.064, 0, 0], oblique: false, drawScale: 10 } }, focus: ["ep"],
          note: "Outside a charged metal sphere, the charge acts as if it sits at the centre, so on the surface V = Q/(4πε₀R) with R the sphere's radius. A 12.8 cm sphere holding +200 mC has R = 0.064 m and V = 2.809 × 10¹⁰ V, about 28 GV: an absurd voltage, because 200 mC is an enormous charge for a small sphere.",
          claims: [{ instance: "ep", readout: "V", value: 2.80861e10, unit: "V" }],
        },
      ],
      examples: [
        {
          id: "basic", level: "basic", title: "V at 1 m and 2 m",
          setup: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [1, 0, 0], oblique: false, drawScale: 1 } },
          problem: "Find the potential 1 m and 2 m from a +2 µC point charge, with V = 0 at infinity.",
          lines: [
            { text: "At 1 m: V = 8.988 × 10⁹ × 2 × 10⁻⁶ / 1 = 17975 V.", focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 17975.1, unit: "V" }] },
            { text: "At 2 m: half as much, 8988 V.", patch: { ep: { point: [2, 0, 0] } }, focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 8987.55, unit: "V" }] },
          ],
          trap: "Quartering V at twice the distance. That is the field's rule; V halves.",
        },
        {
          id: "ex5", level: "tutorial", title: "Lecture 2b Example 5",
          setup: { q: EX5, ep: { point: [1, 0, 1], oblique: true, drawScale: 0.3 } },
          problem: "Point charges −4 µC and +5 µC are at (2, −1, 3) and (0, 4, −2). Calculate V at (1, 0, 1), taking V = 0 at infinity.",
          lines: [
            { text: "|r − r₁| = |(−1, 1, −2)| = √6 and |r − r₂| = |(1, −4, 3)| = √26.", focus: ["q"] },
            { text: "V = 8.988 × 10⁹ × 10⁻⁶ × (−4/√6 + 5/√26) = 8988 × (−1.633 + 0.9806).", focus: ["ep"] },
            { text: "V = −5864 V = −5.864 kV (−5.872 kV if you use k = 9 × 10⁹).", focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: -5863.59, unit: "V" }] },
          ],
          covers: ["lecture:lec2b-ex5"],
          trap: "Taking absolute values of the charges. The −4 µC term must stay negative, or V comes out positive.",
        },
        {
          id: "mst2c", level: "exam", title: "A charged sphere",
          setup: { q: { items: [pt("a", 200000, [0, 0, 0], "Q = +200 mC")], oblique: false, drawScale: 1 }, ep: { point: [0.064, 0, 0], oblique: false, drawScale: 10 } },
          problem: "A thin metallic sphere of diameter 12.8 cm is charged to +200 mC. Calculate V at its surface.",
          lines: [
            { text: "Radius R = 12.8/2 cm = 0.064 m.", focus: ["ep"], givens: [{ value: 0.064, unit: "m" }] },
            { text: "V = Q/(4πε₀R) = 8.988 × 10⁹ × 0.2 / 0.064 = 2.809 × 10¹⁰ V ≈ 28.1 GV.", focus: ["ep"], claims: [{ instance: "ep", readout: "V", value: 2.80861e10, unit: "V" }] },
          ],
          covers: ["mst-2324-q2c"],
          trap: "Using the diameter instead of the radius halves the answer. The formula wants the radius.",
        },
      ],
      asks: [
        { id: "vector", q: "Does potential have a direction?", tags: ["V_VECTOR"], a: "No. V is a scalar: one number at each point. That is exactly why superposing potentials is easier than superposing fields: just add the numbers, signs included." },
        { id: "inverse", q: "Why 1/R and not 1/R²?", tags: ["V_INVERSE_SQUARE"], a: "V is the integral of E along a path from infinity. Integrating 1/R² gives 1/R. One integration, one power of R lost." },
        { id: "negative", q: "Can the potential be negative?", a: "Yes, near negative charges. With V = 0 at infinity, a negative charge makes its surroundings negative, just as a positive one makes them positive." },
        { id: "zero-point", q: "Can V be zero where E isn't?", a: "Yes. Midway between +Q and −Q, their potentials cancel, but their fields add, pointing from + to −." },
        { id: "sphere-inside", q: "What is V inside the metal sphere?", a: "The same as on its surface. Inside a conductor E = 0, so no work is done moving around inside, and V stays constant at the surface value." },
        { id: "units", q: "V or kV or GV?", a: "Match the size: model answers use kV for thousands of volts, and GV (10⁹ V) appears for the small charged sphere. Keep four significant figures." },
      ],
      checks: [
        {
          id: "falloff-c", title: "Check: how V falls", show: ["q", "ep", "eq"], patch: { q: { items: [pt("a", 2, [0, 0, 0], "Q = +2 µC")], oblique: false, drawScale: 1 }, ep: { point: [1, 0, 0], oblique: false, drawScale: 1 } },
          note: "Four checks on potentials. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "falloff-c", type: "choose", prompt: "A point charge's potential falls with distance as…", dimension: "recognition",
            options: [
              choice("r", "1/R", true, "Right: V = Q/(4πε₀R)."),
              choice("r2", "1/R²", false, "That's E. V has one less power of R.", "V_INVERSE_SQUARE"),
              choice("const", "not at all", false, "V falls to zero at infinity."),
            ] },
        },
        {
          id: "predict-3", title: "Check: three times as far",
          note: "Predict first; then the plate shows the result.",
          interaction: { id: "predict-3", type: "predict-drag", prompt: "The probe moves from 1 m to 3 m from the +2 µC charge. Drag V to your prediction.", target: { instance: "ep", readout: "V" }, range: [0, 20000], unit: "V", relTol: 0.05, reveal: { ep: { point: [3, 0, 0] } }, dimension: "conceptual", tag: "V_INVERSE_SQUARE",
            feedback: { close: "Right: a third, 5992 V.", far: "V ∝ 1/R: a third, 5992 V." } },
        },
        {
          id: "v-num", title: "Check: a potential, your numbers",
          note: "Numbers of your own.",
          interaction: { id: "v-num", type: "numeric", prompt: vp.prompt, answer: vp.spec.answer, distractors: vp.spec.distractors, relTol: vp.spec.relTol, hints: vp.hints, template: "v-point", dimension: "computational" },
        },
        {
          id: "add", title: "Check: combining potentials",
          note: "Last one.",
          interaction: { id: "add", type: "choose", prompt: "To find V from several point charges…", dimension: "conceptual",
            options: [
              choice("sum", "add each Qᵢ/(4πε₀Rᵢ) as a signed number", true, "Right: potential is a scalar."),
              choice("vec", "add them as vectors, component by component", false, "V has no components.", "V_VECTOR"),
              choice("biggest", "use the nearest charge only", false, "Every charge contributes."),
            ] },
          covers: ["lecture:lec2b-ex5"],
        },
      ],
      recap: {
        points: [
          "Point charge: V = Q/(4πε₀R), with V = 0 at infinity; it falls as 1/R.",
          "Potentials add as signed scalars.",
          "Outside a charged sphere, V is that of a point charge at the centre; on the surface, use its radius.",
        ],
        traps: ["1/R² instead of 1/R.", "Dropping a charge's sign.", "The diameter in place of the radius."],
      },
    },
  ],
});
