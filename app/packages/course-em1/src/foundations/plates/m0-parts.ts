import { defineIdeaPlate } from "@forma/plate";
import { area, choice, graph, graphInstance, slope } from "../kit";

export const m0Parts = defineIdeaPlate({
  id: "m0-parts",
  title: "Integration by parts",
  requires: { objectives: [0], items: [], misconceptions: ["PARTS_WRONG_U", "PARTS_SIGN", "PARTS_WHEN_SUB"] },
  instances: [graphInstance("x-exp", [-0.2, 1.4], [-0.5, 6])],
  ideas: [
    {
      id: "parts",
      title: "Integration by parts",
      objectives: [0],
      explain: [
        {
          id: "rule", title: "The product rule backwards", show: ["g"], focus: ["g"], patch: graph("x-exp", [-0.2, 1.4], [-0.5, 6], { area: [0, 1] }),
          note: "Some products aren't an inside function and its derivative: x eˣ, x sin x, x² e^(−x). For these there's integration by parts, the product rule run backwards: ∫u dv = uv − ∫v du. You split the integrand into a part u to differentiate and a part dv to integrate, and trade the integral for an easier one. On the plate, the area under x eˣ from 0 to 1 is exactly 1, which by parts takes three lines.",
          claims: [area(1)],
        },
        {
          id: "liate", title: "Choosing u", focus: ["g"], patch: graph("x-minus-1-exp", [-1, 1.5], [-1.5, 3], { probe: 1, tangent: true }),
          note: "Choose u to be the part that gets simpler when you differentiate it. A useful order: Logs, Inverse trig, Algebraic (powers of x), Trig, Exponentials; whichever comes first is u. For ∫x eˣ dx: u = x, dv = eˣ dx, so du = dx and v = eˣ. Then ∫x eˣ dx = x eˣ − ∫eˣ dx = (x − 1)eˣ + C. The plate draws (x − 1)eˣ: at x = 1 its slope is e = 2.718, which is the integrand there.",
          claims: [slope(2.71828)],
        },
        {
          id: "definite", title: "Parts with limits", focus: ["g"], patch: graph("x-sin", [-0.2, 3.5], [-0.5, 2.2], { area: [0, Math.PI] }),
          note: "With limits, apply them to both parts: ∫ₐᵇ u dv = [uv]ₐᵇ − ∫ₐᵇ v du. For ∫₀^π x sin x dx, take u = x and dv = sin x dx, so v = −cos x. Then [−x cos x]₀^π + ∫₀^π cos x dx = π + 0 = π. The plate shades x sin x from 0 to π: area 3.142.",
          claims: [area(3.14159)],
        },
        {
          id: "avoid", title: "When not to use it", focus: ["g"], patch: graph("rho-exp", [-0.2, 2.5], [-0.1, 0.6], { area: [0, 1] }),
          note: "Parts is slow and easy to get wrong, so try the others first. Before parts, look for a substitution, and in EM look at the coordinates. ∫ρe^(−ρ²) dρ needs no parts: the ρ is du/2. Choosing coordinates whose area or volume element supplies that factor is often what turns a hard integral into a one-liner. The plate shades ρe^(−ρ²) again: 0.3161 from 0 to 1, by substitution.",
          claims: [area(0.31606)],
        },
      ],
      examples: [
        {
          id: "xcos", level: "basic", title: "x cos x",
          problem: "Find ∫x cos x dx.",
          setup: graph("x-sin-plus-cos", [-0.5, 4.5], [-5, 3], { probe: Math.PI, tangent: true }),
          lines: [
            { text: "u = x (algebraic), dv = cos x dx; so du = dx and v = sin x.", focus: ["g"] },
            { text: "∫x cos x dx = x sin x − ∫sin x dx = x sin x + cos x + C.", focus: ["g"] },
            { text: "Check: the slope of x sin x + cos x is x cos x. At x = π that is −π, which the tangent shows.", focus: ["g"], claims: [slope(-3.14159)] },
          ],
          trap: "x sin x − cos x: ∫sin x dx = −cos x, so subtracting it gives + cos x.",
        },
        {
          id: "xexpneg", level: "tutorial", title: "Parts with limits",
          problem: "Find ∫₀¹ x e^(−x) dx.",
          setup: graph("x-exp-neg", [-0.2, 4], [-0.05, 0.45], { area: [0, 1] }),
          lines: [
            { text: "u = x, dv = e^(−x) dx; so du = dx and v = −e^(−x).", focus: ["g"] },
            { text: "[−x e^(−x)]₀¹ + ∫₀¹ e^(−x) dx = −e^(−1) + (1 − e^(−1)).", focus: ["g"] },
            { text: "= 1 − 2/e = 0.2642.", focus: ["g"], claims: [area(0.264241)] },
          ],
          trap: "v = e^(−x): the integral of e^(−x) is −e^(−x). That sign carries through both terms.",
        },
        {
          id: "lnx", level: "exam", title: "Logarithms: dv = dx",
          problem: "Find ∫ln x dx.",
          setup: graph("x-ln-x-minus-x", [0.05, 4], [-1.5, 2], { probe: Math.E, tangent: true }),
          lines: [
            { text: "There's only one factor, so take u = ln x and dv = dx: du = dx/x, v = x.", focus: ["g"] },
            { text: "∫ln x dx = x ln x − ∫x · (1/x) dx = x ln x − x + C.", focus: ["g"] },
            { text: "Check: the slope of x ln x − x is ln x + 1 − 1 = ln x. At x = e that is 1, as the tangent shows.", focus: ["g"], claims: [slope(1)] },
          ],
          trap: "Trying u = 1 and dv = ln x dx: you'd need ∫ln x dx to find v, which is the question.",
        },
      ],
      asks: [
        { id: "choose-u", q: "How do I choose u?", tags: ["PARTS_WRONG_U"], a: "Pick the factor that gets simpler when differentiated: Logs, Inverse trig, Algebraic, Trig, Exponentials, in that order of preference. For x eˣ, u = x: it differentiates to 1. Choosing u = eˣ makes the new integral harder." },
        { id: "minus", q: "Where does the minus sign come from?", tags: ["PARTS_SIGN"], a: "From the product rule: (uv)′ = u′v + uv′, so uv′ = (uv)′ − u′v. Integrating gives ∫u dv = uv − ∫v du. Drop the minus and every answer by parts is wrong." },
        { id: "not-parts", q: "When should I not use parts?", tags: ["PARTS_WHEN_SUB"], a: "When a substitution works. ∫x sin(x²) dx looks like a product, but u = x² makes it ½∫sin u du at once. Parts is for products of different kinds where neither is the other's derivative." },
        { id: "twice", q: "What about x² eˣ?", a: "Use parts twice: each time u = xⁿ loses a power. ∫x² eˣ dx = x² eˣ − 2∫x eˣ dx, and the second integral is one more round of parts." },
        { id: "em", q: "Do I need parts in EM?", a: "Sometimes, for example with charge densities like r e^(−r). But first check whether the coordinate system's ρ or r² factor turns it into a substitution. That check saves the most time." },
        { id: "ln", q: "Why does ∫ln x dx use parts with only one factor?", a: "Because ln x is easy to differentiate but not to integrate. Writing it as ln x · 1, with u = ln x and dv = dx, swaps it for ∫x · (1/x) dx = ∫dx." },
      ],
      checks: [
        {
          id: "u-x2", title: "Check: choose u", note: "Four checks on integration by parts. Get each right to move on.",
          interaction: { id: "u-x2", type: "choose", prompt: "For ∫x² eˣ dx, take u = …", dimension: "recognition",
            options: [
              choice("right", "x²", true, "Right: it loses a power each time you differentiate."),
              choice("exp", "eˣ", false, "Then v = x³/3 and the integral gets harder.", "PARTS_WRONG_U"),
              choice("all", "x² eˣ", false, "That's the whole integrand; parts splits it into two."),
            ] },
        },
        {
          id: "xex", title: "Check: the sign", note: "Mind the minus.",
          interaction: { id: "xex", type: "choose", prompt: "∫x eˣ dx = …", dimension: "computational",
            options: [
              choice("right", "(x − 1)eˣ + C", true, "Right: x eˣ − ∫eˣ dx."),
              choice("plus", "(x + 1)eˣ + C", false, "Subtract ∫v du: x eˣ − eˣ.", "PARTS_SIGN"),
              choice("uv", "x eˣ + C", false, "That's uv only; the ∫v du term is missing."),
            ] },
        },
        {
          id: "which", title: "Check: which method", note: "Parts or substitution?",
          interaction: { id: "which", type: "choose", prompt: "Which one needs integration by parts?", dimension: "conceptual",
            options: [
              choice("right", "∫x sin x dx", true, "Right: algebraic times trig, and neither is the other's derivative."),
              choice("sub", "∫x sin(x²) dx", false, "u = x² makes this a substitution.", "PARTS_WHEN_SUB"),
              choice("sincos", "∫sin x cos x dx", false, "u = sin x: du = cos x dx."),
            ] },
        },
        {
          id: "x-e-x", title: "Check: evaluate", note: "Last one: both limits count.",
          interaction: { id: "x-e-x", type: "numeric", prompt: "Find ∫₀¹ x eˣ dx.", answer: { value: 1, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 2.71828, unit: "", errorClass: "conceptual", feedback: "e is [x eˣ]₀¹ alone. Subtract ∫₀¹ eˣ dx = e − 1." }],
            hints: ["u = x, dv = eˣ dx.", "Antiderivative: (x − 1)eˣ."] },
        },
      ],
      recap: {
        points: [
          "∫u dv = uv − ∫v du: the product rule backwards.",
          "Choose u by LIATE: the factor that simplifies when differentiated.",
          "With limits: [uv]ₐᵇ − ∫ₐᵇ v du.",
          "Try substitution first; in EM the coordinates often make parts unnecessary.",
        ],
        traps: ["Losing the minus sign.", "Choosing u = eˣ.", "Using parts where u = (the inside) works."],
      },
    },
  ],
});