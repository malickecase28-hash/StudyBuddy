import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const eqp = (latex: string, speech: string) => ({ latex, speech, shortSpeech: speech });
type V3 = [number, number, number];
const D76 = { field: "d7.6", plane: "xy" as const, offset: 0, probe: [3.5, 0, 0] as V3, loop: 3, loopH: 2, box: 0 };

export const ideaCurlStokes = defineIdeaPlate({
  id: "idea-curl-stokes",
  title: "Curl and Stokes' theorem",
  requires: { objectives: [3], items: ["text:hayt-d7.6", "lecture:lec3a-q09", "text:hayt-d7.5", "lecture:lec3a-q08", "lecture:lec3a-q05", "f1718-q3c"], misconceptions: ["CURL_ZERO"] },
  instances: [
    { id: "vs", component: "vector-slice", params: D76 },
    { id: "eq", component: "equation", params: eqp(R`\oint_L\mathbf H\cdot d\mathbf L=\int_S(\nabla\times\mathbf H)\cdot d\mathbf S`, "the closed line integral of H equals the surface integral of the curl of H") },
  ],
  ideas: [
    {
      id: "curl",
      title: "Curl and Stokes' theorem",
      objectives: [3],
      explain: [
        {
          id: "stokes", title: "Stokes' theorem", show: ["vs", "eq"], focus: ["vs", "eq"],
          note: "Stokes' theorem turns a line integral round a closed path into a surface integral over any surface the path bounds: ∮H·dL = ∫(∇ × H)·dS. Hayt D7.6 takes H = 6xy ax − 3y² ay round the rectangle 2 ≤ x ≤ 5, −1 ≤ y ≤ 1. Walking the four edges gives −126 A. Integrating ∇ × H = −6x az over the rectangle gives −126 A too. The plate's loop readout shows the circulation.",
          claims: [{ instance: "vs", readout: "circ", value: -126, unit: "" }],
        },
        {
          id: "point", title: "The point form: ∇ × H = J", patch: { vs: { field: "d7.5a", probe: [2, 3, 4], offset: 4, loop: 0 }, eq: eqp(R`\nabla\times\mathbf H=\mathbf J`, "the curl of H equals J") }, focus: ["vs", "eq"],
          note: "Shrink Ampère's path to a point: the circulation per unit area becomes the curl, and Ampère's law becomes ∇ × H = J, the point form. Hayt D7.5(a): for H = x²z ay − y²x az, ∇ × H = (−2xy − x²) ax + y² ay + 2xz az, which at (2, 3, 4) is J = −16ax + 9ay + 16az A/m². Wherever J is, H curls.",
          claims: [{ instance: "vs", readout: "c1", value: -16, unit: "" }, { instance: "vs", readout: "c2", value: 9, unit: "" }, { instance: "vs", readout: "c3", value: 16, unit: "" }],
        },
        {
          id: "zero", title: "No current, no curl", patch: { vs: { field: "filament", probe: [1, 0.5, 0], offset: 0 } }, focus: ["vs"],
          note: "Away from a wire, its H = I/(2πρ) aφ circles but has zero curl: (1/ρ)d(ρHφ)/dρ = (1/ρ)d(I/2π)/dρ = 0. A classic exercise makes the point. The field lines curve, yet ∇ × H = 0 everywhere except on the wire itself, where J is. Curl measures circulation at a point, not the bending of lines.",
          claims: [{ instance: "vs", readout: "c3", value: 0, unit: "" }],
        },
        {
          id: "f1718", title: "A field with a known curl", patch: { vs: { field: "f1718-3c", probe: [5, 2, -3], offset: -3 } }, focus: ["vs"],
          note: "Take H = yz(x² + y²) ax − y²xz ay + 4x²y² az. Its curl is J = xy(8x + y) ax + y(x² − 8xy + y²) ay − z(x² + 4y²) az, which at (5, 2, −3) is 420ax − 102ay + 123az A/m². Its divergence is zero, as it must be for any B or μ₀H: ∇·B = 0.",
          claims: [{ instance: "vs", readout: "c1", value: 420, unit: "" }, { instance: "vs", readout: "c2", value: -102, unit: "" }, { instance: "vs", readout: "c3", value: 123, unit: "" }, { instance: "vs", readout: "div", value: 0, unit: "" }],
        },
      ],
      examples: [
        {
          id: "d7-6", level: "basic", title: "Hayt D7.6: both sides of Stokes' theorem",
          setup: { vs: D76 },
          problem: "Evaluate both sides of Stokes' theorem for H = 6xy ax − 3y² ay A/m round the rectangular path 2 ≤ x ≤ 5, −1 ≤ y ≤ 1, z = 0, with dS along az.",
          lines: [
            { text: "Along y = −1, x from 2 to 5: H·dL = −6x dx, giving −3(25 − 4) = −63.", focus: ["vs"] },
            { text: "Up x = 5: −3y² dy from −1 to 1 gives −2. Back along y = 1: ∫ from 5 to 2 of 6x dx = −63. Down x = 2: ∫ from 1 to −1 of −3y² dy = +2.", focus: ["vs"] },
            { text: "Line integral: −63 − 2 − 63 + 2 = −126 A.", focus: ["vs"], claims: [{ instance: "vs", readout: "circ", value: -126, unit: "" }] },
            { text: "Surface integral: ∇ × H = −6x az, and ∫∫ −6x dx dy = −6 × 10.5 × 2 = −126 A. ✓", focus: ["vs", "eq"] },
          ],
          covers: ["text:hayt-d7.6", "lecture:lec3a-q09"],
          trap: "Walking the loop clockwise flips the sign. With dS along +az, go counter-clockwise seen from above.",
        },
        {
          id: "d7-5", level: "tutorial", title: "Hayt D7.5: J in three coordinate systems",
          setup: { vs: { field: "d7.5a", probe: [2, 3, 4], offset: 4, loop: 0, plane: "xy" } },
          problem: "Find J: (a) at P_A(2, 3, 4) if H = x²z ay − y²x az; (b) at P_B(1.5, 90°, 0.5) if H = (2/ρ) cos 0.2φ aρ; (c) at P_C(2, 30°, 20°) if H = (1/sin θ) aθ.",
          lines: [
            { text: "(a) ∇ × H = (−2xy − x²)ax + y² ay + 2xz az = −16ax + 9ay + 16az A/m².", focus: ["vs"], claims: [{ instance: "vs", readout: "c1", value: -16, unit: "" }] },
            { text: "(b) Only Hρ exists, so J = −(1/ρ)∂Hρ/∂φ az = (0.4/ρ²) sin 0.2φ az = 0.055az A/m².", focus: ["eq"] },
            { text: "(c) J = (1/r)[∂(rHθ)/∂r] aφ = (1/(r sin θ)) aφ = 1aφ A/m² at r = 2, θ = 30°.", focus: ["eq"] },
          ],
          covers: ["text:hayt-d7.5", "lecture:lec3a-q08"],
          trap: "Using the Cartesian curl on cylindrical or spherical components. Use the formula sheet's version for each system.",
        },
        {
          id: "f1718", level: "exam", title: "J, current and ∇·B",
          setup: { vs: { field: "f1718-3c", probe: [5, 2, -3], offset: -3, loop: 0, plane: "xy" } },
          problem: "H = yz(x² + y²) ax − y²xz ay + 4x²y² az A/m. (i) Find J at (5, 2, −3). (ii) Find the current through x = −1, 0 < y, z < 2. (iii) Show ∇·B = 0.",
          lines: [
            { text: "(i) J = ∇ × H = xy(8x + y) ax + y(x² − 8xy + y²) ay − z(x² + 4y²) az = 420ax − 102ay + 123az A/m².", focus: ["vs"], claims: [{ instance: "vs", readout: "c1", value: 420, unit: "" }] },
            { text: "(ii) On x = −1, Jx = 8y − y², so I = ∫₀² ∫₀² (8y − y²) dy dz = 2(16 − 8/3) = 26.67 A.", focus: ["vs"] },
            { text: "(iii) ∇·H = 2xyz − 2xyz + 0 = 0, so ∇·B = μ₀∇·H = 0.", focus: ["vs"], claims: [{ instance: "vs", readout: "div", value: 0, unit: "" }] },
          ],
          covers: ["f1718-q3c"],
          trap: "Integrating J at the single point (5, 2, −3). Current is the flux of J over the surface, with x = −1 put in first.",
        },
      ],
      asks: [
        { id: "bend", q: "Can H have curved lines but zero curl?", tags: ["CURL_ZERO"], a: "Yes. A wire's H circles it, but ∇ × H = 0 everywhere except where current flows. Curl measures circulation per unit area at a point, not whether lines bend." },
        { id: "surface", q: "Which surface do I use in Stokes' theorem?", a: "Any surface bounded by the path; the answer is the same. Orient dS with the right-hand rule: fingers along the path, thumb along dS." },
        { id: "point", q: "How does ∇ × H = J follow from Ampère's law?", a: "Apply Ampère's law to a tiny loop: ∮H·dL ≈ (∇ × H)·ΔS, and I_enc = J·ΔS. Divide by ΔS and shrink it: ∇ × H = J." },
        { id: "divb", q: "Why must ∇·B be zero?", a: "There are no magnetic charges. Every B line closes, so no small volume is a source or a sink." },
        { id: "units", q: "What are the units of ∇ × H?", a: "A/m per metre, A/m²: the units of current density, as Ampère's point form requires." },
        { id: "cyl", q: "Which curl do I use for H = Hφ(ρ) aφ?", a: "The cylindrical curl. Only (1/ρ) d(ρHφ)/dρ survives, along az: that's how exam answers show ∇ × H." },
      ],
      checks: [
        {
          id: "zero-c", title: "Check: outside a wire", show: ["vs", "eq"], patch: { vs: { field: "filament", probe: [1, 0.5, 0], offset: 0, loop: 0 } },
          note: "Four checks on curl and Stokes' theorem. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "zero-c", type: "choose", prompt: "Outside a straight current-carrying wire, ∇ × H is…", dimension: "conceptual",
            options: [
              choice("zero", "0", true, "Right: no current there, so no curl."),
              choice("h", "I/(2πρ)", false, "That's |H|, not its curl.", "CURL_ZERO"),
              choice("j", "the wire's J", false, "J is zero outside the wire."),
            ] },
          covers: ["lecture:lec3a-q05"],
        },
        {
          id: "predict-shift", title: "Check: slide the rectangle",
          note: "Predict first; then the plate shows the result.",
          patch: { vs: D76 },
          interaction: { id: "predict-shift", type: "predict-drag", prompt: "Slide Hayt D7.6's rectangle to 3 ≤ x ≤ 6 (same size). Drag the circulation to your prediction.", target: { instance: "vs", readout: "circ" }, range: [-300, 0], unit: "", relTol: 0.05, reveal: { vs: { probe: [4.5, 0, 0] } }, dimension: "conceptual",
            feedback: { close: "Right: −6 × 13.5 × 2 = −162.", far: "∫∫ −6x dx dy over 3 to 6: −6 × 13.5 × 2 = −162." } },
        },
        {
          id: "curl-num", title: "Check: a curl component",
          note: "A number.",
          interaction: { id: "curl-num", type: "numeric", prompt: "For H = x²z ay − y²x az, find (∇ × H)ᵧ at (1, 2, 3), in A/m².", answer: { value: 4, unit: "A/m^2" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 6, unit: "A/m^2", errorClass: "conceptual", feedback: "That's the z component, 2xz. The y component is ∂Hx/∂z − ∂Hz/∂x = y²." }],
            hints: ["(∇ × H)ᵧ = ∂Hx/∂z − ∂Hz/∂x.", "Hx = 0, Hz = −y²x.", "−∂(−y²x)/∂x = y²."] },
        },
        {
          id: "curl-inside", title: "Check: inside the wire",
          note: "Last one.",
          interaction: { id: "curl-inside", type: "choose", prompt: "Inside a long wire carrying uniform current density J, ∇ × H equals…", dimension: "recognition",
            options: [
              choice("j", "J", true, "Right: Ampère's point form."),
              choice("zero", "0", false, "Only where there's no current.", "CURL_ZERO"),
              choice("h", "I/(2πρ)", false, "That's the field outside."),
            ] },
          covers: ["f2425-q4a", "f2324-q4a"],
        },
      ],
      recap: {
        points: [
          "Stokes: ∮H·dL = ∫(∇ × H)·dS, over any surface the path bounds.",
          "Point form of Ampère: ∇ × H = J.",
          "No current, no curl, even where H circles.",
          "∇·B = 0 always.",
        ],
        traps: ["Walking the loop the wrong way.", "The Cartesian curl on cylindrical components.", "Curl confused with bending."],
      },
    },
  ],
});
