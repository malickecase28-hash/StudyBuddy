import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const INCH = 0.0254;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const si = instantiate(templates.find((t) => t.id === "unit-si-length")!, 1);
const eq = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaUnits = defineIdeaPlate({
  id: "idea-units",
  title: "Units, prefixes and symbols",
  requires: { objectives: [2], items: ["mst-2324-q2c", "mst-2324-q1b", "mst-2324-q4c"], misconceptions: ["PREFIX_POWER", "SYMBOL_CASE"] },
  instances: [
    { id: "conv", component: "unit-convert", params: { value: 12.8, unit: "cm" } },
    { id: "eq", component: "equation", params: eq(R`1\ \text{cm}=10^{-2}\ \text{m}`, "one centimetre is ten to the minus two metres") },
  ],
  ideas: [
    {
      id: "units",
      title: "Units, prefixes and symbols",
      objectives: [2],
      explain: [
        {
          id: "si", title: "Formulas expect SI", show: ["conv"], focus: ["conv"],
          note: "Every formula in this course assumes SI units: metres, kilograms, seconds, amperes, and coulombs for charge. The constant ε₀ = 8.854 × 10⁻¹² F/m has metres built into it, so a distance entered in centimetres makes Coulomb's law wrong by a factor of ten thousand. The rule is simple: convert every given quantity to SI before you substitute. The plate converts 12.8 cm: 0.128 m.",
          claims: [{ instance: "conv", readout: "siM", value: 0.128, unit: "m" }],
        },
        {
          id: "prefixes", title: "The prefix ladder", show: ["eq"], patch: { conv: { value: 250, unit: "µm" }, eq: eq(R`\text{p}=10^{-12}\ \ \text{n}=10^{-9}\ \ \mu=10^{-6}\ \ \text{m}=10^{-3}\ \ \text{c}=10^{-2}\ \ \text{k}=10^{3}\ \ \text{M}=10^{6}\ \ \text{G}=10^{9}`, "the prefix ladder") }, focus: ["conv", "eq"],
          note: "A prefix is a power of ten attached to a unit. Exam questions use all of these: nanometres for point charges, micrometres for field points, millimetres for displacements, nanocoulombs and millicoulombs for charge, gigahertz for signals. Case matters. Lower-case m is milli (10⁻³) but capital M is mega (10⁶), so 200 mC is 0.2 C while 200 MC would be two hundred million coulombs. On the plate, 250 µm becomes 0.00025 m.",
          claims: [{ instance: "conv", readout: "siM", value: 0.00025, unit: "m" }],
          givens: [{ value: 0.2, unit: "C" }],
        },
        {
          id: "powers", title: "Squares and cubes", patch: { conv: { value: 5, unit: "cm^2" }, eq: eq(R`1\ \text{cm}^2=(10^{-2}\ \text{m})^2=10^{-4}\ \text{m}^2`, "one square centimetre is ten to the minus four square metres") }, focus: ["conv", "eq"],
          note: "When a unit is squared or cubed, so is its prefix. One square centimetre is (10⁻² m)², which is 10⁻⁴ m², not 10⁻². One cubic centimetre is 10⁻⁶ m³. This bites in surface charge (µC/m²) and volume charge (µC/m³) questions. On the plate, 5 cm² becomes 0.0005 m².",
          claims: [{ instance: "conv", readout: "siM2", value: 0.0005, unit: "m^2" }],
        },
        {
          id: "inches", title: "Inches, and when not to convert", patch: { conv: { value: 0.28, unit: "in" }, eq: eq(R`1\ \text{inch}=0.0254\ \text{m}\ \text{(exactly)}`, "one inch is exactly 0.0254 metres") }, focus: ["conv", "eq"],
          note: "Some questions give a coaxial cable in inches. One inch is exactly 0.0254 m, so the 0.28 inch core radius is 0.007112 m. Now look at what the formula needs. The coax capacitance uses ln(b/a), a ratio of two radii. A ratio has no units, so b/a is the same in inches or metres. Convert what the formula needs in SI (the length, the permittivity) and leave ratios alone.",
          claims: [{ instance: "conv", readout: "siM", value: 0.007112, unit: "m" }],
          givens: [{ value: INCH, unit: "m" }],
        },
        {
          id: "sigfigs", title: "Significant figures and symbols", patch: { conv: { value: 25, unit: "nC" } }, focus: ["conv"],
          note: "Examiners mark presentation. State the formula, show the substitution with units, and give the answer to a sensible number of significant figures, usually three or four, to match the data. Write vectors in bold or with an arrow, and unit vectors with a hat: âₓ, not ax. On the plate, 25 nC is 2.5 × 10⁻⁸ C. Write it that way, not as 0.000000025.",
          claims: [{ instance: "conv", readout: "siC", value: 2.5e-8, unit: "C" }],
        },
      ],
      examples: [
        {
          id: "radius", level: "basic", title: "Diameter to radius",
          setup: { conv: { value: 12.8, unit: "cm" } },
          problem: "A thin metal sphere has a diameter of 12.8 cm. Find its radius in metres, ready for V = Q/(4πε₀R).",
          lines: [
            { text: "Convert first: 12.8 cm = 0.128 m.", focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 0.128, unit: "m" }] },
            { text: "The radius is half the diameter: R = 0.064 m.", focus: ["conv"], givens: [{ value: 0.128 / 2, unit: "m" }] },
          ],
          covers: ["mst-2324-q2c"],
          trap: "Using the diameter as the radius doubles R and halves V. Read the question twice: diameter or radius?",
        },
        {
          id: "mm", level: "tutorial", title: "Millimetre coordinates",
          setup: { conv: { value: 10, unit: "mm" } },
          problem: "Two charges sit at P1(2, 2, 13) mm and P2(10, 2, 7) mm. Find the length of R12 in metres.",
          lines: [
            { text: "Subtract in millimetres first: R12 = P2 − P1 = (8, 0, −6) mm.", focus: ["conv"] },
            { text: "Length: √(8² + 0² + 6²) = 10 mm.", focus: ["conv"] },
            { text: "Convert once at the end: 10 mm = 0.010 m.", focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 0.01, unit: "m" }] },
          ],
          covers: ["mst-2324-q1b"],
          trap: "Squaring millimetres and then converting with × 10⁻³ gives a wrong R²: squares need × 10⁻⁶. Convert the length first, then square.",
        },
        {
          id: "coax", level: "exam", title: "Coax radii in inches",
          setup: { conv: { value: 0.28, unit: "in" } },
          problem: "A 100 km coaxial cable has a solid core of radius 0.28 inch and insulation of diameter 0.90 inch. Prepare every quantity for C = 2πεL / ln(b/a).",
          givens: [{ value: 0.9 * INCH, unit: "m" }],
          lines: [
            { text: "Core radius: a = 0.28 inch = 0.007112 m.", focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 0.007112, unit: "m" }] },
            { text: "The outer radius is half the 0.90 inch diameter: b = 0.45 inch = 0.01143 m.", patch: { conv: { value: 0.45, unit: "in" } }, focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 0.01143, unit: "m" }], givens: [{ value: 0.9 * INCH, unit: "m" }] },
            { text: "The ratio needs no conversion: b/a = 0.45/0.28 = 1.607, so ln(b/a) = 0.4745.", focus: ["conv"] },
            { text: "The length does: L = 100 km = 1.00 × 10⁵ m. Every quantity is now ready; the capacitance lesson finishes the calculation.", patch: { conv: { value: 100, unit: "km" } }, focus: ["conv"], claims: [{ instance: "conv", readout: "siM", value: 1e5, unit: "m" }] },
          ],
          covers: ["mst-2324-q4c"],
          trap: "Forgetting that the insulation figure is a diameter. The formula wants the outer radius, which is half of it.",
        },
      ],
      asks: [
        { id: "why-si", q: "Why can't I keep millimetres in Coulomb's law?", a: "Because k = 8.99 × 10⁹ N·m²/C² was measured in metres. Put millimetres in and R² is numerically a million times too big, so the force comes out a million times too small. Convert first, then substitute." },
        { id: "mu-u", q: "Is µ the same as u?", a: "Yes. u is a typing stand-in for the Greek µ (micro, 10⁻⁶). In written answers, use µ." },
        { id: "cm2", q: "Why isn't 1 cm² equal to 0.01 m²?", tags: ["PREFIX_POWER"], show: ["conv"], patch: { conv: { value: 1, unit: "cm^2" } }, focus: ["conv"], a: "Because the whole length is squared. A square centimetre is a centimetre times a centimetre: (10⁻² m)² = 10⁻⁴ m², which is 0.0001 m², not a hundredth. The prefix is squared along with the metre." },
        { id: "sigfig", q: "How many significant figures should I give?", a: "Match the data. If the question gives values to three significant figures, answer to three or four. Keep extra digits in your working and round only the final answer." },
        { id: "ratio", q: "Why did b/a not need converting?", a: "Units cancel in a ratio. 0.45 ÷ 0.28 in inches and 0.01143 ÷ 0.007112 in metres both give 1.607. A logarithm needs a pure number, and a ratio of two lengths is one." },
        { id: "case", q: "What's the difference between m and M?", tags: ["SYMBOL_CASE"], a: "Lower-case m is milli (10⁻³); capital M is mega (10⁶). Between them is a factor of a billion. The same goes for mC and MC. Symbols are case-sensitive, so copy them exactly." },
        { id: "hat", q: "Why insist on âₓ, not ax?", a: "Because ax could mean a times x. The hat marks a unit vector: a direction with length one. Clear notation earns marks, and it stops you mixing up a vector and its magnitude." },
      ],
      checks: [
        {
          id: "cm2", title: "Check: square centimetres", show: ["conv"], patch: { conv: { value: 12.8, unit: "cm" } },
          note: "Four checks on units. Get each right to move on.",
          interaction: { id: "cm2", type: "choose", prompt: "One square centimetre in square metres is…", dimension: "conceptual",
            options: [
              choice("e4", "10⁻⁴ m²", true, "Right: (10⁻² m)² = 10⁻⁴ m²."),
              choice("e2", "10⁻² m²", false, "The prefix is squared too: (10⁻²)² = 10⁻⁴.", "PREFIX_POWER"),
              choice("100", "100 m²", false, "A square centimetre is far smaller than a square metre."),
            ] },
        },
        {
          id: "convert", title: "Check: to metres, your numbers",
          note: "A conversion of your own.",
          interaction: { id: "convert", type: "numeric", prompt: si.prompt, answer: si.spec.answer, distractors: si.spec.distractors, relTol: si.spec.relTol, hints: si.hints, template: "unit-si-length", dimension: "computational" },
        },
        {
          id: "case", title: "Check: symbols",
          note: "Read the symbol carefully.",
          interaction: { id: "case", type: "choose", prompt: "A charge of 5 MC is…", dimension: "recognition",
            options: [
              choice("mega", "five million coulombs", true, "Right: capital M is mega, 10⁶."),
              choice("milli", "five millicoulombs", false, "Millicoulombs are written mC, with a lower-case m.", "SYMBOL_CASE"),
              choice("micro", "five microcoulombs", false, "Microcoulombs are written µC."),
            ] },
        },
        {
          id: "inch", title: "Check: the coax core",
          note: "Last one: the inch.",
          interaction: { id: "inch", type: "numeric", prompt: "A coax core has radius 0.28 inch. Give it in metres.", answer: { value: 0.007112, unit: "m" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0.0028, unit: "m", errorClass: "unit", feedback: "That treats inches like centimetres. One inch is exactly 0.0254 m." }],
            hints: ["1 inch = 0.0254 m exactly.", "Multiply.", "0.28 × 0.0254."] },
          covers: ["mst-2324-q4c"],
        },
      ],
      recap: {
        points: [
          "Convert every given value to SI before substituting.",
          "Prefix ladder: p 10⁻¹², n 10⁻⁹, µ 10⁻⁶, m 10⁻³, c 10⁻², k 10³, M 10⁶, G 10⁹.",
          "Squared and cubed units square and cube the prefix: 1 cm² = 10⁻⁴ m².",
          "One inch is exactly 0.0254 m; ratios of lengths need no conversion.",
          "Three or four significant figures; hats on unit vectors.",
        ],
        traps: ["1 cm² = 0.01 m².", "Mixing up m (milli) and M (mega).", "Using a diameter as the radius."],
        givens: [{ value: INCH, unit: "m" }],
      },
    },
  ],
});
