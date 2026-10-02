import { defineIdeaPlate } from "@forma/plate";
import { area, choice, graph, graphInstance, stripSum, valueAt } from "../kit";

const X2 = (m: Parameters<typeof graph>[3] = {}) => graph("x2", [-0.5, 3.5], [-1, 10], m);

export const m0Definite = defineIdeaPlate({
  id: "m0-definite",
  title: "Definite integrals",
  requires: { objectives: [0], items: [], misconceptions: ["LIMITS_REVERSED", "NEGATIVE_AREA_IGNORED", "DROPS_LOWER_LIMIT"] },
  instances: [graphInstance("x2", [-0.5, 3.5], [-1, 10])],
  ideas: [
    {
      id: "definite",
      title: "Definite integrals",
      objectives: [0],
      explain: [
        {
          id: "area", title: "Area under a curve", show: ["g"], focus: ["g"], patch: X2({ area: [0, 3] }),
          note: "A definite integral ∫ₐᵇ f(x) dx adds up f along an interval. When f is positive it is the area between the curve and the x-axis from x = a to x = b. On the plate, the shaded region under y = x² from 0 to 3 has area 9. The numbers a and b are the limits; the answer is a number, not a function, so there's no + C.",
          claims: [area(9)],
        },
        {
          id: "strips", title: "A sum of thin strips", focus: ["g"], patch: X2({ area: [0, 3], rects: 6 }),
          note: "Where does that area come from? Cut the interval into thin strips of width Δx and add f × Δx for each: a Riemann sum. With 6 strips, using the height at each strip's middle, the sum is 8.9375. Thinner strips get closer to 9. The ∫ sign is a stretched S for 'sum', and dx is the strip width shrinking to nothing. Keep this picture: every EM integral is a sum of tiny pieces, such as charge = density × a tiny length, area or volume.",
          claims: [stripSum(8.9375)],
        },
        {
          id: "ftc", title: "F(b) − F(a)", focus: ["g"], patch: X2({ area: [1, 3] }),
          note: "Nobody adds strips by hand. If F is any antiderivative of f, then ∫ₐᵇ f dx = F(b) − F(a): the antiderivative's rise from a to b. For x² from 1 to 3, F = x³/3, so the integral is 27/3 − 1/3 = 26/3 = 8.667. Write it as [x³/3]₁³, then substitute the top limit and subtract the bottom one. The + C cancels in the subtraction, so leave it out.",
          claims: [area(8.66667)],
        },
        {
          id: "signed", title: "Signed area", focus: ["g"], patch: graph("sin", [-0.3, 6.6], [-1.5, 1.5], { area: [0, 2 * Math.PI] }),
          note: "Area below the axis counts as negative. ∫₀^(2π) sin x dx = [−cos x]₀^(2π) = −1 − (−1) = 0: the hump above the axis cancels the dip below it. This is why integrals like ∫₀^(2π) cos φ dφ = 0 appear so often in flux problems: whole components vanish. If you need the total area instead, split the interval where the curve crosses the axis and add the sizes.",
          claims: [area(0)],
        },
      ],
      examples: [
        {
          id: "linear", level: "basic", title: "A straight line",
          problem: "Find ∫₁³(2x + 1) dx.",
          setup: graph("lin", [-0.5, 3.5], [-1, 8], { area: [1, 3] }),
          lines: [
            { text: "An antiderivative is F = x² + x.", focus: ["g"] },
            { text: "F(3) = 9 + 3 = 12 and F(1) = 1 + 1 = 2.", focus: ["g"] },
            { text: "∫₁³(2x + 1) dx = 12 − 2 = 10, the shaded area.", focus: ["g"], claims: [area(10)] },
          ],
          trap: "Stopping at F(3) = 12. A definite integral is always top limit minus bottom limit.",
        },
        {
          id: "sin-pi", level: "tutorial", title: "Half a sine wave",
          problem: "Find ∫₀^π sin θ dθ.",
          setup: graph("sin", [-0.3, 3.5], [-0.5, 1.5], { area: [0, Math.PI] }),
          lines: [
            { text: "An antiderivative of sin θ is −cos θ.", focus: ["g"] },
            { text: "[−cos θ]₀^π = (−cos π) − (−cos 0) = 1 + 1.", focus: ["g"] },
            { text: "So ∫₀^π sin θ dθ = 2. You'll meet this every time you integrate over a sphere, where θ runs from 0 to π.", focus: ["g"], claims: [area(2)] },
          ],
          trap: "Sign slips: −cos π = +1 and −(−cos 0) = +1. Write the brackets out before simplifying.",
        },
        {
          id: "average", level: "exam", title: "An average value",
          problem: "Find the average value of f(x) = x² on 0 ≤ x ≤ 3.",
          setup: X2({ area: [0, 3], probe: Math.sqrt(3) }),
          lines: [
            { text: "The average is the area divided by the width: (1/(b − a))∫ₐᵇ f dx.", focus: ["g"] },
            { text: "Area: [x³/3]₀³ = 9.", focus: ["g"], claims: [area(9)] },
            { text: "Width 3, so the average is 9/3 = 3. The probe marks where x² equals 3, at x = √3.", focus: ["g"], claims: [valueAt(3)] },
          ],
          trap: "Reporting 9: that's the area. The average divides by the width b − a.",
        },
      ],
      asks: [
        { id: "order", q: "Why F(b) − F(a) and not the other way?", tags: ["LIMITS_REVERSED"], a: "The integral runs from a to b, so it's the antiderivative's change over that interval: where you end, minus where you started. Swapping the limits gives the negative: ∫ᵇₐ f dx = −∫ₐᵇ f dx." },
        { id: "where-c", q: "Where did the + C go?", a: "It cancels: (F(b) + C) − (F(a) + C) = F(b) − F(a). So in definite integrals, leave it out." },
        { id: "zero", q: "Can an integral be zero when the curve isn't?", tags: ["NEGATIVE_AREA_IGNORED"], a: "Yes. Area below the axis counts negative, so equal areas above and below cancel. ∫₀^(2π) sin x dx = 0 even though sin x is mostly not zero." },
        { id: "lower", q: "Do I still evaluate the lower limit when it's 0?", tags: ["DROPS_LOWER_LIMIT"], a: "Always. F(0) is often 0 for powers of x, but not for cos or e: [−cos θ]₀^π needs −cos 0 = −1, and that gives half the answer." },
        { id: "dx", q: "What does dx actually mean?", a: "It's the width of each thin strip. ∫f dx is the limit of the sum of f × Δx as the strips shrink. Keeping that picture tells you what to multiply by in EM: a density times a small length, area or volume." },
        { id: "two-pi", q: "Why do EM integrals over angles often give 2π or 2?", a: "Because ∫₀^(2π) dφ = 2π and ∫₀^π sin θ dθ = 2. A full turn round an axis gives 2π; the sin θ from a sphere's area element gives 2. Together they make the 4π in 4πr²." },
      ],
      checks: [
        {
          id: "x3", title: "Check: limits", note: "Four checks on definite integrals. Get each right to move on.",
          interaction: { id: "x3", type: "choose", prompt: "∫₀² x³ dx = …", dimension: "computational",
            options: [
              choice("right", "4", true, "Right: [x⁴/4]₀² = 16/4."),
              choice("integrand", "8", false, "8 is x³ at x = 2, not the integral."),
              choice("reversed", "−4", false, "That's F(0) − F(2). Subtract the bottom limit from the top.", "LIMITS_REVERSED"),
            ] },
        },
        {
          id: "double", title: "Check: double the limit", note: "Predict first; then the plate shows the result.",
          patch: graph("x2", [-0.5, 6.5], [-2, 40], { area: [0, 3] }),
          interaction: { id: "double", type: "predict-drag", prompt: "The upper limit doubles, from 3 to 6, under y = x². Drag the area to your prediction.",
            target: { instance: "g", readout: "garea" }, range: [0, 80], unit: "", relTol: 0.05, reveal: { g: { area: [0, 6] } }, dimension: "conceptual",
            feedback: { close: "Right: [x³/3]₀⁶ = 72, eight times 9. Doubling the limit cubes into a factor of 8.", far: "F = x³/3, so the area to 6 is 216/3 = 72, not twice 9." } },
        },
        {
          id: "cos", title: "Check: a cancelling integral", note: "Above and below the axis.",
          interaction: { id: "cos", type: "choose", prompt: "∫₀^π cos x dx = …", dimension: "conceptual",
            options: [
              choice("right", "0", true, "Right: [sin x]₀^π = 0 − 0."),
              choice("total", "2", false, "2 is the total area. The part above the axis and the part below cancel.", "NEGATIVE_AREA_IGNORED"),
              choice("neg", "−2", false, "sin π and sin 0 are both 0."),
            ] },
        },
        {
          id: "quarter", title: "Check: a quarter wave", note: "Last one: both limits count.",
          interaction: { id: "quarter", type: "numeric", prompt: "Find ∫₀^(π/2) sin θ dθ.", answer: { value: 1, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 0, unit: "", errorClass: "conceptual", tag: "DROPS_LOWER_LIMIT", feedback: "0 is −cos at the top limit only. Subtract −cos 0 = −1 at the bottom." }],
            hints: ["An antiderivative is −cos θ.", "−cos(π/2) = 0 and −cos 0 = −1."] },
        },
      ],
      recap: {
        points: [
          "∫ₐᵇ f dx = F(b) − F(a), with F any antiderivative; no + C.",
          "For positive f it's the area under the curve; area below the axis counts negative.",
          "It's the limit of a sum of f × dx over thin strips.",
          "Useful values: ∫₀^π sin θ dθ = 2, ∫₀^(2π) dφ = 2π, and sin or cos over a whole period gives 0.",
        ],
        traps: ["Subtracting the wrong way.", "Skipping the bottom limit because it looks like zero.", "Calling a cancelling integral the area."],
      },
    },
  ],
});