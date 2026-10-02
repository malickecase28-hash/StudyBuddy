import { defineIdeaPlate } from "@forma/plate";
import { choice, graph, graphInstance, slope } from "../kit";

export const m0Antiderivatives = defineIdeaPlate({
  id: "m0-antiderivatives",
  title: "Antiderivatives",
  requires: { objectives: [0], items: [], misconceptions: ["FORGOT_CONSTANT", "POWER_RULE_DIFFERENTIATES", "INSIDE_CONSTANT_MULTIPLY"] },
  instances: [graphInstance("x3", [-2, 2], [-6, 6])],
  ideas: [
    {
      id: "antiderivatives",
      title: "Antiderivatives",
      objectives: [0],
      explain: [
        {
          id: "undo", title: "Integration undoes differentiation", show: ["g"], focus: ["g"], patch: graph("x3", [-2, 2], [-6, 6], { probe: 1, tangent: true }),
          note: "Differentiation takes a function and gives its slope. On the plate, y = x³ climbs with slope 3 at x = 1, which the dashed tangent shows; in general its slope is 3x². Integration runs that backwards: given the slope function 3x², find a function whose slope it is. Any such function is an antiderivative, and here the answer is x³ + C. The + C is there because adding a constant lifts the whole curve without changing a single slope, so x³, x³ + 5 and x³ − 2 all fit. We write ∫3x² dx = x³ + C.",
          claims: [slope(3)],
        },
        {
          id: "power", title: "The power rule", focus: ["g"], patch: graph("x3-over-3", [-1, 3], [-2, 9], { probe: 2, tangent: true }),
          note: "Raise the power by one, then divide by the new power: ∫xⁿ dx = xⁿ⁺¹/(n + 1) + C. So ∫x² dx = x³/3 + C. Check by differentiating: d/dx(x³/3) = 3x²/3 = x². The plate draws x³/3; at x = 2 its slope is 4, which is 2², the integrand. The rule works for any power except n = −1, where it would divide by zero. That one has its own answer, ∫dx/x = ln|x| + C, because the slope of ln x is 1/x.",
          claims: [slope(4)],
        },
        {
          id: "list", title: "The standard list", focus: ["g"], patch: graph("neg-cos", [-0.5, 6.5], [-1.5, 1.5], { probe: Math.PI / 2, tangent: true }),
          note: "Every derivative you know gives an integral. Because d/dx(−cos x) = sin x, ∫sin x dx = −cos x + C. In the same way ∫cos x dx = sin x + C and ∫eˣ dx = eˣ + C. When a constant multiplies x inside, divide by it: ∫e^(2x) dx = e^(2x)/2 + C and ∫cos 3x dx = (sin 3x)/3 + C, because differentiating would multiply by that constant. The plate draws −cos x: at x = π/2 its slope is 1, which is sin(π/2).",
          claims: [slope(1)],
        },
        {
          id: "linear", title: "Term by term", focus: ["g"], patch: graph("poly-d1", [-1, 2], [-10, 20], { probe: 1, tangent: true }),
          note: "Constants come out and sums split: ∫(a·f + b·g) dx = a∫f dx + b∫g dx. So a polynomial integrates one term at a time: ∫(6x² − 4x + 5) dx = 2x³ − 2x² + 5x + C. One + C covers the whole answer, since the constants from each term add into one. The plate draws 2x³ − 2x² + 5x; at x = 1 its slope is 6 − 4 + 5 = 7, the integrand's value there.",
          claims: [slope(7)],
        },
      ],
      examples: [
        {
          id: "poly", level: "basic", title: "A polynomial, term by term",
          problem: "Find ∫(4x³ − 2x + 7) dx.",
          setup: graph("ex-d1-basic", [-2, 2], [-10, 30], { probe: 1, tangent: true }),
          lines: [
            { text: "∫4x³ dx = 4 · x⁴/4 = x⁴; ∫2x dx = x²; ∫7 dx = 7x.", focus: ["g"] },
            { text: "So ∫(4x³ − 2x + 7) dx = x⁴ − x² + 7x + C.", focus: ["g"] },
            { text: "Check: d/dx(x⁴ − x² + 7x) = 4x³ − 2x + 7. At x = 1 that is 9, and the tangent to the answer on the plate has slope 9.", focus: ["g"], claims: [slope(9)] },
          ],
          trap: "Writing 4x⁴ for the first term: raise the power and divide by the new power, so 4x³ becomes 4x⁴/4 = x⁴.",
        },
        {
          id: "exp-cos", level: "tutorial", title: "Constants inside",
          problem: "Find ∫(3e^(2x) + 6 cos 3x) dx.",
          setup: graph("ex-d1-tut", [-1, 1], [-4, 14], { probe: 0, tangent: true }),
          lines: [
            { text: "∫e^(2x) dx = e^(2x)/2, so 3∫e^(2x) dx = (3/2)e^(2x).", focus: ["g"] },
            { text: "∫cos 3x dx = (sin 3x)/3, so 6∫cos 3x dx = 2 sin 3x.", focus: ["g"] },
            { text: "Answer: (3/2)e^(2x) + 2 sin 3x + C. Check at x = 0: the slope of the answer is 3 + 6 = 9, the integrand's value there.", focus: ["g"], claims: [slope(9)] },
          ],
          trap: "Multiplying by the inside constant: d/dx e^(2x) = 2e^(2x), so the integral must divide by 2, not multiply.",
        },
        {
          id: "potential", level: "exam", title: "Where V = Q/(4πε₀r) comes from",
          problem: "The potential of a point charge needs ∫Q dr/(4πε₀r²). Find the antiderivative.",
          setup: graph("neg-inv", [0.3, 3], [-3.5, 0.5], { probe: 1, tangent: true }),
          lines: [
            { text: "Q/(4πε₀) is a constant, so it comes out. What's left is ∫r⁻² dr.", focus: ["g"] },
            { text: "Power rule with n = −2: r⁻¹/(−1) = −1/r.", focus: ["g"] },
            { text: "So ∫Q dr/(4πε₀r²) = −Q/(4πε₀r) + C. The plate draws −1/r: at r = 1 its slope is 1, which is 1/r² there.", focus: ["g"], claims: [slope(1)] },
          ],
          trap: "Writing −r⁻³/3: integrating raises the power, from −2 to −1. Lowering it is what differentiation does.",
        },
      ],
      asks: [
        { id: "why-c", q: "Why add + C?", tags: ["FORGOT_CONSTANT"], a: "Because any constant has slope zero. x³, x³ + 5 and x³ − 2 all have derivative 3x², so the integral can't tell them apart; + C stands for all of them. In a definite integral the C cancels, which is why it disappears there." },
        { id: "check", q: "How do I know I integrated correctly?", a: "Differentiate your answer. If you get the integrand back, you're right. It takes seconds and catches most slips." },
        { id: "one-over-x", q: "Why can't the power rule do ∫dx/x?", a: "With n = −1 the rule asks you to divide by n + 1 = 0. That case has its own answer, ∫dx/x = ln|x| + C, because the slope of ln x is 1/x." },
        { id: "reverse", q: "Is integrating xⁿ the same as differentiating it?", tags: ["POWER_RULE_DIFFERENTIATES"], a: "No, it's the reverse. Differentiating brings the power down and lowers it: x³ becomes 3x². Integrating raises the power and divides by the new power: x² becomes x³/3." },
        { id: "inside", q: "What do I do with ∫e^(5x) dx?", tags: ["INSIDE_CONSTANT_MULTIPLY"], a: "Divide by the 5: e^(5x)/5 + C. Differentiating e^(5x) multiplies by 5, so integrating must divide by 5." },
        { id: "why-em", q: "Why does Electromagnetics need this?", a: "Almost every EM result is an integral: charge from a density, flux through a surface, potential from a field. Once the setup is right, the integrals are usually standard ones like these." },
      ],
      checks: [
        {
          id: "x5", title: "Check: a power", note: "Four checks on antiderivatives. Get each right to move on.",
          interaction: { id: "x5", type: "choose", prompt: "∫x⁵ dx = …", dimension: "computational",
            options: [
              choice("right", "x⁶/6 + C", true, "Right: raise the power to 6 and divide by 6."),
              choice("diff", "5x⁴ + C", false, "That's the derivative of x⁵. Integrating raises the power.", "POWER_RULE_DIFFERENTIATES"),
              choice("nodiv", "x⁶ + C", false, "Divide by the new power, 6: its slope would be 6x⁵."),
            ] },
        },
        {
          id: "e3x", title: "Check: a constant inside", note: "Mind what the 3 does.",
          interaction: { id: "e3x", type: "choose", prompt: "∫e^(3x) dx = …", dimension: "computational",
            options: [
              choice("right", "e^(3x)/3 + C", true, "Right: differentiating would bring out a 3, so integrating divides by 3."),
              choice("times", "3e^(3x) + C", false, "That multiplies by 3. Its slope is 9e^(3x).", "INSIDE_CONSTANT_MULTIPLY"),
              choice("same", "e^(3x) + C", false, "Its slope is 3e^(3x), three times too big."),
            ] },
        },
        {
          id: "plus-c", title: "Check: a complete answer", note: "Which answer is complete?",
          interaction: { id: "plus-c", type: "choose", prompt: "Which is a complete answer to ∫2x dx?", dimension: "recognition",
            options: [
              choice("right", "x² + C", true, "Right: the whole family of antiderivatives."),
              choice("noc", "x²", false, "That's one antiderivative. The answer is the family, x² + C.", "FORGOT_CONSTANT"),
              choice("two", "2", false, "That's the derivative of 2x, not its integral."),
            ] },
        },
        {
          id: "f2", title: "Check: a value", note: "Last one: integrate, then evaluate.",
          interaction: { id: "f2", type: "numeric", prompt: "F(x) = ∫(3x² + 2) dx with F(0) = 0. Find F(2).", answer: { value: 12, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 14, unit: "", errorClass: "conceptual", feedback: "14 is the integrand at x = 2. Integrate first: F = x³ + 2x." }],
            hints: ["Integrate term by term.", "F = x³ + 2x + C, and F(0) = 0 gives C = 0."] },
        },
      ],
      recap: {
        points: [
          "∫f dx is a function whose derivative is f, plus a constant C.",
          "Power rule: ∫xⁿ dx = xⁿ⁺¹/(n + 1) + C, except n = −1, which gives ln|x|.",
          "Standard list: ∫e^(ax) dx = e^(ax)/a, ∫sin ax dx = −(cos ax)/a, ∫cos ax dx = (sin ax)/a.",
          "Integrate term by term, and check by differentiating.",
        ],
        traps: ["Differentiating instead of integrating.", "Multiplying by an inside constant instead of dividing.", "Dropping + C."],
      },
    },
  ],
});