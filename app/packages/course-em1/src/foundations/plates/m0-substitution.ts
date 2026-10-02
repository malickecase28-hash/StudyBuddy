import { defineIdeaPlate } from "@forma/plate";
import { area, choice, graph, graphInstance, slope } from "../kit";

export const m0Substitution = defineIdeaPlate({
  id: "m0-substitution",
  title: "Substitution",
  requires: { objectives: [0], items: [], misconceptions: ["SUB_MISSING_DU", "SUB_OLD_LIMITS", "SUB_LEFTOVER_X"] },
  instances: [graphInstance("sub-a", [-1.2, 1.2], [-1, 10])],
  ideas: [
    {
      id: "substitution",
      title: "Substitution",
      objectives: [0],
      explain: [
        {
          id: "inside", title: "Spot the inside function", show: ["g"], focus: ["g"], patch: graph("sub-a", [-1.2, 1.2], [-1, 10], { probe: 1, tangent: true }),
          note: "Look at ∫2x(x² + 1)³ dx. The inside function is x² + 1, and its derivative, 2x, is sitting right outside. Rename the inside: u = x² + 1, so du = 2x dx. The whole integral becomes ∫u³ du = u⁴/4 + C = (x² + 1)⁴/4 + C. That is the chain rule run backwards. The plate draws (x² + 1)⁴/4: at x = 1 its slope is 16, which is 2 × 1 × 2³, the integrand at x = 1.",
          claims: [slope(16)],
        },
        {
          id: "recipe", title: "The recipe", focus: ["g"], patch: graph("sin3x-over-3", [-2, 2], [-0.6, 0.6], { probe: 0, tangent: true }),
          note: "The recipe: (1) choose u, usually the inside of a bracket, power or function; (2) find du = u′ dx; (3) rewrite everything in u, with no x left; (4) integrate; (5) put x back. For ∫cos 3x dx: u = 3x, du = 3 dx, so dx = du/3 and the integral is (1/3)∫cos u du = (sin 3x)/3 + C. This is the 'divide by the inside constant' rule, explained. The plate draws (sin 3x)/3; at x = 0 its slope is 1, which is cos 0.",
          claims: [slope(1)],
        },
        {
          id: "limits", title: "Change the limits too", focus: ["g"], patch: graph("two-x-exp-x2", [-0.2, 1.3], [-1, 15], { area: [0, 1] }),
          note: "With limits, change them too. ∫₀¹ 2x e^(x²) dx: u = x², du = 2x dx. When x = 0, u = 0; when x = 1, u = 1. So the integral is ∫₀¹ eᵘ du = e¹ − e⁰ = e − 1 = 1.718, with no need to go back to x. Mixing x-limits into a u-integral is the commonest slip.",
          claims: [area(1.71828)],
        },
        {
          id: "rho", title: "EM hands you the du", focus: ["g"], patch: graph("rho-exp", [-0.2, 2.5], [-0.1, 0.6], { area: [0, 1] }),
          note: "Electromagnetics hands you substitutions ready-made. In polar coordinates the area element is dS = ρ dρ dφ, and that ρ is the du you need. For ∫₀¹ ρe^(−ρ²) dρ, let u = ρ², du = 2ρ dρ, so ρ dρ = du/2 and the integral is ½∫₀¹ e^(−u) du = ½(1 − e^(−1)) = 0.3161. Without the ρ, ∫e^(−ρ²) dρ has no elementary antiderivative at all. The plate shades ρe^(−ρ²) from 0 to 1.",
          claims: [area(0.31606)],
        },
      ],
      examples: [
        {
          id: "power", level: "basic", title: "A power of a bracket",
          problem: "Find ∫3x²(x³ + 2)⁴ dx.",
          setup: graph("ex-sub-basic", [-1.5, 1.1], [-5, 60], { probe: 1, tangent: true }),
          lines: [
            { text: "The inside is u = x³ + 2, and du = 3x² dx is exactly the rest.", focus: ["g"] },
            { text: "So the integral is ∫u⁴ du = u⁵/5 + C.", focus: ["g"] },
            { text: "Put x back: (x³ + 2)⁵/5 + C. Check: its slope at x = 1 is 3 × 3⁴ = 243, matching the integrand.", focus: ["g"], claims: [slope(243)] },
          ],
          trap: "Writing (x³ + 2)⁵/5 without checking that 3x² dx is there. ∫(x³ + 2)⁴ dx alone is not u⁵/5: there's no du.",
        },
        {
          id: "sincos", level: "tutorial", title: "Change the limits",
          problem: "Find ∫₀^(π/2) sin θ cos θ dθ.",
          setup: graph("sin-cos", [-0.2, 1.8], [-0.2, 0.7], { area: [0, Math.PI / 2] }),
          lines: [
            { text: "Let u = sin θ, so du = cos θ dθ.", focus: ["g"] },
            { text: "Limits: θ = 0 gives u = 0; θ = π/2 gives u = 1.", focus: ["g"] },
            { text: "∫₀¹ u du = [u²/2]₀¹ = 1/2.", focus: ["g"], claims: [area(0.5)] },
          ],
          trap: "Keeping the θ-limits: [u²/2] from 0 to π/2 gives π²/8, which is wrong. New variable, new limits.",
        },
        {
          id: "disc", level: "exam", title: "The field of a charged disc",
          problem: "The field on the axis of a charged disc needs ∫₀¹ z dz/(z² + 1)^(3/2). Evaluate it.",
          setup: graph("ring", [-0.2, 3], [-0.1, 0.5], { area: [0, 1] }),
          lines: [
            { text: "Let u = z² + 1, so du = 2z dz and z dz = du/2.", focus: ["g"] },
            { text: "Limits: z = 0 gives u = 1; z = 1 gives u = 2.", focus: ["g"] },
            { text: "½∫₁² u^(−3/2) du = ½[−2u^(−1/2)]₁² = 1 − 1/√2 = 0.2929.", focus: ["g"], claims: [area(0.292893)] },
          ],
          trap: "Forgetting the ½ from z dz = du/2 doubles the answer, to 0.5858.",
        },
      ],
      asks: [
        { id: "spot", q: "How do I spot a substitution?", a: "Look for a function inside something (a bracket, a power, an exponent, a sine) whose derivative also appears, up to a constant. In ∫x cos(x²) dx the inside is x², and its derivative 2x is there as x. Constants can be fixed; missing variables can't." },
        { id: "constant", q: "What if the constant is wrong, like x instead of 2x?", tags: ["SUB_MISSING_DU"], a: "Adjust it: with u = x², du = 2x dx, so x dx = du/2. A missing constant factor is fine. A missing variable is not: ∫cos(x²) dx has no x to pair with, so substitution can't work." },
        { id: "mixed", q: "Can I have x and u in the same integral?", tags: ["SUB_LEFTOVER_X"], a: "No. After substituting, every x must be gone, including the one in dx. If an x is left over, either u was the wrong choice or the integral needs another method." },
        { id: "limits", q: "Do I have to change the limits?", tags: ["SUB_OLD_LIMITS"], a: "Yes, or put x back before using the old ones. Either works; mixing them doesn't. Changing the limits is usually quicker." },
        { id: "chain", q: "Why is substitution the chain rule backwards?", a: "The chain rule says d/dx f(g(x)) = f′(g(x)) g′(x). So any integrand shaped like f′(g(x)) g′(x) integrates to f(g(x)). Substitution is a tidy way to see that shape." },
        { id: "rho", q: "Why does the ρ in ρ dρ dφ matter so much?", a: "Because ρ is half the derivative of ρ². Integrands like e^(−ρ²) or (ρ² + a²)^(−3/2) become simple once that ρ is there. In cartesian coordinates the same integrals are much harder." },
      ],
      checks: [
        {
          id: "choose-u", title: "Check: choose u", note: "Four checks on substitution. Get each right to move on.",
          interaction: { id: "choose-u", type: "choose", prompt: "For ∫x cos(x²) dx, the best choice is…", dimension: "recognition",
            options: [
              choice("right", "u = x²", true, "Right: du = 2x dx, and x dx = du/2."),
              choice("cos", "u = cos(x²)", false, "Its derivative needs sin(x²), which isn't there."),
              choice("x", "u = x", false, "That leaves cos(x²) in x: nothing simplifies.", "SUB_LEFTOVER_X"),
            ] },
        },
        {
          id: "u-limits", title: "Check: new limits", note: "Convert the limits.",
          interaction: { id: "u-limits", type: "choose", prompt: "In ∫₀¹ 2x(x² + 1)³ dx with u = x² + 1, the limits for u are…", dimension: "computational",
            options: [
              choice("right", "1 to 2", true, "Right: x = 0 gives u = 1; x = 1 gives u = 2."),
              choice("old", "0 to 1", false, "Those are the x-limits. Convert them: u = x² + 1.", "SUB_OLD_LIMITS"),
              choice("four", "1 to 4", false, "u = x² + 1 at x = 1 is 2."),
            ] },
        },
        {
          id: "e-x3", title: "Check: evaluate", note: "Substitute and use the new limits.",
          interaction: { id: "e-x3", type: "numeric", prompt: "Find ∫₀¹ 3x² e^(x³) dx.", answer: { value: 1.71828, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 2.71828, unit: "", errorClass: "arithmetic", feedback: "That's e¹ alone. Subtract e⁰ = 1 at the bottom limit." }],
            hints: ["u = x³, du = 3x² dx.", "Limits: u = 0 to 1."] },
        },
        {
          id: "root", title: "Check: a ρ integral", note: "Last one: watch the factor in du.",
          interaction: { id: "root", type: "choose", prompt: "∫ρ√(ρ² + 9) dρ = …", dimension: "computational",
            options: [
              choice("right", "(1/3)(ρ² + 9)^(3/2) + C", true, "Right: u = ρ² + 9, ρ dρ = du/2, so ½ · (2/3)u^(3/2)."),
              choice("twothirds", "(2/3)(ρ² + 9)^(3/2) + C", false, "du = 2ρ dρ, so ρ dρ = du/2: the 2/3 halves to 1/3.", "SUB_MISSING_DU"),
              choice("keep-rho", "ρ²(ρ² + 9)^(3/2)/3 + C", false, "The ρ is absorbed into du; it doesn't stay."),
            ] },
        },
      ],
      recap: {
        points: [
          "Substitute when an inside function's derivative is sitting outside, up to a constant.",
          "Recipe: choose u, find du, rewrite everything in u, integrate, put x back.",
          "With limits, convert them to u-limits and don't go back.",
          "In EM, the ρ in ρ dρ dφ and the r² in r² sin θ often are the du.",
        ],
        traps: ["Leaving an x in the u-integral.", "Keeping the old limits.", "Dropping the constant from du."],
      },
    },
  ],
});