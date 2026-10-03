import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const clp = instantiate(templates.find((t) => t.id === "charge-line-poly")!, 1);
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });

export const ideaChargeDensity = defineIdeaPlate({
  id: "idea-charge-density",
  title: "Charge from a density",
  requires: { objectives: [0], items: ["hw-2324-2.5", "mst-2324-q4b"], misconceptions: ["DENSITY_NO_JACOBIAN"] },
  instances: [
    { id: "axes", component: "axes3", params: { length: 1.6 } },
    { id: "region", component: "coord-region", params: { system: "cart", ranges: [[0, 2], [0, 0.05], [0, 0.05]], density: "demo-line" } },
    { id: "eq", component: "equation", params: eqp(R`Q=\int_L\rho_L\,dl`, "Q equals the integral of rho L along the line") },
  ],
  ideas: [
    {
      id: "charge-density",
      title: "Charge from a density",
      objectives: [0],
      explain: [
        {
          id: "line", title: "Along a line: Q = ∫ρL dl", show: ["axes", "region", "eq"], focus: ["region", "eq"],
          note: "When charge is spread out, a density tells you how much sits in each small piece: ρL per metre of line, ρS per square metre of surface, ρv per cubic metre of volume. The total is the sum of the pieces, which is an integral. On the plate, a line from x = 0 to 2 m carries ρL = 3x µC/m, heavier toward the far end. Q = ∫₀² 3x dx = 6 µC.",
          claims: [{ instance: "region", readout: "Q", value: 6e-6, unit: "C" }],
        },
        {
          id: "surface", title: "Over a surface: Q = ∫ρS dS", patch: { region: { system: "sph", ranges: [[0, 1], [0, 180], [0, 360]], face: 0, density: "demo-sphere" }, eq: eqp(R`Q=\int_S\rho_S\,dS,\qquad dS=r^2\sin\theta\,d\theta\,d\phi`, "Q equals the integral of rho S dS") }, focus: ["region", "eq"],
          note: "For a surface, use the dS you built in the vectors lesson. A sphere of radius 1 m carrying a uniform surface density holds Q = 25.13 µC. With a uniform density, the integral is just density × area. When the density varies over the surface, it goes inside the integral, alongside the scale factors.",
          claims: [{ instance: "region", readout: "Q", value: 2.51327e-5, unit: "C" }],
        },
        {
          id: "volume", title: "Through a volume: Q = ∫ρv dv", patch: { region: { system: "cyl", ranges: [[0, 1], [0, 360], [0, 2]], face: null, density: "demo-cyl" }, eq: eqp(R`Q=\int_V\rho_v\,dv,\qquad dv=\rho\,d\rho\,d\phi\,dz`, "Q equals the integral of rho v dv") }, focus: ["region", "eq"],
          note: "Inside a volume, multiply the density by dv, scale factors and all. A cylinder of radius 1 m and height 2 m with ρv = ρ µC/m³ (denser toward the rim) holds Q = ∫∫∫ ρ · ρ dρ dφ dz = (1/3)(2π)(2) = 4.189 µC. The ρ from the density and the ρ from dv multiply to give ρ², which is why the answer has a 1/3 in it.",
          claims: [{ instance: "region", readout: "Q", value: 4.18879e-6, unit: "C" }],
        },
        {
          id: "cancel", title: "When the Jacobian cancels the density", patch: { region: { system: "sph", ranges: [[0, 5.25], [0, 180], [0, 360]], face: null, density: "hw-2.5c", drawScale: 0.3 }, eq: eqp(R`\int\frac{3.05}{r\sin\theta}\;r^2\sin\theta\,dr\,d\theta\,d\phi=3.05\int r\,dr\int d\theta\int d\phi`, "the sin theta cancels") }, focus: ["region", "eq"],
          note: "Suppose ρv = 3.05/(r sin θ) C/m³ in a sphere of radius 5.25 m. It looks awkward until you multiply by dv = r² sin θ dr dθ dφ: the sin θ cancels and one r cancels, leaving 3.05 r. Then Q = 3.05 × (5.25²/2) × π × 2π = 829.7 C. The density was designed to meet the Jacobian. Forget the Jacobian, and the integral of 1/sin θ blows up.",
          claims: [{ instance: "region", readout: "Q", value: 829.6945, unit: "C" }],
        },
      ],
      examples: [
        {
          id: "hw25a", level: "basic", title: "A line",
          setup: { region: { system: "cart", ranges: [[1, 5], [0, 0.05], [0, 0.05]], face: null, density: "hw-2.5a", drawScale: 0.4 } },
          problem: "Determine the total charge on the line 1 < x < 5 m if ρL = 12x² mC/m.",
          lines: [
            { text: "On the x-axis, dl = dx: Q = ∫₁⁵ 12x² dx mC.", focus: ["region"] },
            { text: "Q = 12[x³/3]₁⁵ = 4(125 − 1) = 496 mC.", focus: ["region"], claims: [{ instance: "region", readout: "Q", value: 0.496, unit: "C" }] },
          ],
          covers: ["hw-2324-2.5"],
          trap: "Leaving out the 1/3 from ∫x² dx gives 1488 mC, three times too much.",
        },
        {
          id: "hw25b", level: "tutorial", title: "A cylinder's side",
          setup: { region: { system: "cyl", ranges: [[0, 4], [0, 360], [0, 7]], face: 0, density: "hw-2.5b", drawScale: 0.25 } },
          problem: "Determine the total charge on the cylinder 0 < z < 7 m, ρ = 4 m, with ρS = πρz² pC/m².",
          lines: [
            { text: "On the side ρ = 4 m, dS = ρ dφ dz, and ρS = 4πz².", focus: ["region"] },
            { text: "Q = ∫₀^{2π}∫₀⁷ (4πz²)(4) dφ dz = 16π × 2π × (343/3) pC.", focus: ["region"] },
            { text: "Q = 36110 pC = 36.11 nC.", focus: ["region"], claims: [{ instance: "region", readout: "Q", value: 3.61096e-8, unit: "C" }] },
          ],
          covers: ["hw-2324-2.5"],
          trap: "Using dS = dφ dz drops the ρ = 4 and gives a quarter of the charge. The ρ appears twice: once in the density, once in dS.",
        },
        {
          id: "mst4b", level: "exam", title: "A nonlinear volume density",
          setup: { region: { system: "cyl", ranges: [[0, 0.2], [0, 180], [-4, -2]], face: null, density: "mst-4b", drawScale: 0.45 } },
          problem: "Calculate Q_T within 0 ≤ ρ ≤ 0.2 m, 0 ≤ φ ≤ π, −4 ≤ z ≤ −2 m if ρv = ρ² sin φ µC/m³.",
          lines: [
            { text: "dv = ρ dρ dφ dz, so the integrand is ρ² sin φ · ρ = ρ³ sin φ.", focus: ["region"] },
            { text: "The three integrals separate: [ρ⁴/4]₀^{0.2} × [−cos φ]₀^π × [z]₋₄^{−2} = (0.0004)(2)(2).", focus: ["region"] },
            { text: "Q_T = 0.0016 µC = 1.6 nC.", focus: ["region"], claims: [{ instance: "region", readout: "Q", value: 1.6e-9, unit: "C" }] },
          ],
          covers: ["mst-2324-q4b"],
          trap: "Forgetting the ρ in dv gives [ρ³/3], or 0.00267 instead of 0.0004: a charge 6.7 times too big.",
        },
      ],
      asks: [
        { id: "which-density", q: "How do I know whether it's ρL, ρS or ρv?", a: "From the units and the geometry. C/m spreads along a line, C/m² over a surface, and C/m³ through a volume. The question's region tells you the same thing: a line segment, a surface, or a solid." },
        { id: "jacobian", q: "Why do I need the scale factors?", tags: ["DENSITY_NO_JACOBIAN"], a: "A density is charge per real metre, square metre or cubic metre, but dρ dφ dz is not a volume until you multiply by ρ. The scale factors turn coordinate steps into real lengths, areas and volumes." },
        { id: "separate", q: "When can I split the integral into a product?", a: "When the integrand factors into a function of each coordinate alone, and the limits are constants. ρ³ sin φ over a box in (ρ, φ, z) splits into three one-dimensional integrals." },
        { id: "units", q: "What unit is the answer in?", a: "The density's charge unit times metres to the right power, which cancels the per-metre part. mC/m × m gives mC; pC/m² × m² gives pC. Convert to coulombs only if the question asks." },
        { id: "uniform", q: "What if the density is uniform?", a: "Then Q is the density times the length, area or volume. The integral only matters when the density varies." },
        { id: "negative", q: "Can a density be negative?", a: "Yes. Negative charge has a negative density, and a density can even change sign across a region. Integrate it as it is, and the signs take care of themselves." },
      ],
      checks: [
        {
          id: "dv", title: "Check: the integrand", show: ["axes", "region", "eq"], patch: { region: { system: "cyl", ranges: [[0, 0.2], [0, 180], [-4, -2]], face: null, density: "mst-4b", drawScale: 0.45 } },
          note: "Four checks on charge from a density. Get each right to move on.",
          interaction: { id: "dv", type: "choose", prompt: "For ρv = ρ² sin φ in cylindrical coordinates, the integrand of Q is…", dimension: "computational",
            options: [
              choice("right", "ρ³ sin φ dρ dφ dz", true, "Right: ρ² sin φ times ρ dρ dφ dz."),
              choice("bare", "ρ² sin φ dρ dφ dz", false, "dv = ρ dρ dφ dz: the extra ρ is missing.", "DENSITY_NO_JACOBIAN"),
              choice("sq", "ρ⁴ sin φ dρ dφ dz", false, "Only one extra ρ comes from dv."),
            ] },
        },
        {
          id: "line-num", title: "Check: a line charge, your numbers",
          note: "The line again, with your numbers.",
          interaction: { id: "line-num", type: "numeric", prompt: clp.prompt, answer: clp.spec.answer, distractors: clp.spec.distractors, relTol: clp.spec.relTol, hints: clp.hints, template: "charge-line-poly", dimension: "computational" },
          covers: ["hw-2324-2.5"],
        },
        {
          id: "sphere-c", title: "Check: charge in a sphere",
          note: "The awkward-looking density.",
          interaction: { id: "sphere-c", type: "numeric", prompt: "Find the total charge within the sphere r = 5.25 m if ρv = 3.05/(r sin θ) C/m³.", answer: { value: 829.7, unit: "C" }, relTol: 0.01, dimension: "application",
            distractors: [{ value: 5717, unit: "C", errorClass: "conceptual", feedback: "That integrates 3.05 r sin θ, not 3.05/(r sin θ). Read the density carefully: it's divided by r sin θ." }],
            hints: ["dv = r² sin θ dr dθ dφ.", "(3.05/(r sin θ)) × r² sin θ = 3.05 r.", "3.05 × (5.25²/2) × π × 2π."] },
          covers: ["hw-2324-2.5"],
        },
        {
          id: "mst-num", title: "Check: charge in a cylindrical wedge",
          note: "Last one.",
          interaction: { id: "mst-num", type: "numeric", prompt: "ρv = ρ² sin φ µC/m³ over 0 ≤ ρ ≤ 0.2 m, 0 ≤ φ ≤ π, −4 ≤ z ≤ −2 m. Find Q_T in nC.", answer: { value: 1.6, unit: "nC" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 10.67, unit: "nC", errorClass: "conceptual", feedback: "That leaves out the ρ in dv." }],
            hints: ["Integrand: ρ³ sin φ.", "(0.0004)(2)(2) µC.", "µC to nC: × 1000."] },
          covers: ["mst-2324-q4b"],
        },
      ],
      recap: {
        points: [
          "Q = ∫ρL dl, ∫ρS dS or ∫ρv dv: the density times the matching element, summed.",
          "Use the full element with its scale factors: ρ dρ dφ dz, r² sin θ dr dθ dφ.",
          "Separable integrands over box limits split into a product of one-dimensional integrals.",
          "Watch for densities built to cancel the Jacobian, such as 1/(r sin θ).",
        ],
        traps: ["Dropping the Jacobian.", "Losing a 1/3 or 1/4 from the power rule.", "Misreading 3.05/(r sin θ) as 3.05 r sin θ."],
      },
    },
  ],
});
