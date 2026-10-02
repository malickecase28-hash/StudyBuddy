import { defineIdeaPlate } from "@forma/plate";
import { area, choice, graph, graphInstance, slope } from "../kit";

export const m0Choosing = defineIdeaPlate({
  id: "m0-choosing",
  title: "Choosing a technique",
  requires: { objectives: [0], items: [], misconceptions: ["SIN2_DIRECT", "ODD_SYMMETRY_MISSED", "JACOBIAN_DROPPED"] },
  instances: [graphInstance("x3", [-2, 2], [-6, 6])],
  ideas: [
    {
      id: "choosing",
      title: "Choosing a technique",
      objectives: [0],
      explain: [
        {
          id: "checklist", title: "A checklist", show: ["g"], focus: ["g"], patch: graph("x3", [-2, 2], [-6, 6], { area: [-1.5, 1.5] }),
          note: "Before integrating anything, run down a short list. (1) Symmetry: an odd function, one with f(−x) = −f(x), integrates to 0 over an interval centred on 0, as x³ does on the plate from −1.5 to 1.5. (2) Algebra: expand, split fractions, or use an identity. (3) Standard forms, term by term. (4) An inside function with its derivative outside: substitute. (5) A product of different kinds: parts. (6) Still stuck: change coordinates or the order of integration.",
          claims: [area(0)],
        },
        {
          id: "squares", title: "sin² and cos²", focus: ["g"], patch: graph("sin2", [-0.3, 3.5], [-0.2, 1.2], { area: [0, Math.PI] }),
          note: "sin² and cos² have no direct antiderivative in the list, and ∫sin²x dx is not (sin³x)/3. Use the double-angle identity first: sin²x = ½(1 − cos 2x). Then ∫₀^π sin²x dx = ½[x − (sin 2x)/2]₀^π = π/2 = 1.571. The same identity with a plus sign handles cos²x. These turn up whenever a field or a power density has a squared sine in it.",
          claims: [area(1.5708)],
        },
        {
          id: "coords", title: "Let the coordinates help", focus: ["g"], patch: graph("rho-exp", [-0.2, 2.5], [-0.1, 0.6], { area: [0, 1] }),
          note: "Sometimes the best move is a different coordinate system. Over a disc of radius 1, ∫∫e^(−(x² + y²)) dx dy has no elementary antiderivative in x. In polar coordinates, x² + y² = ρ² and dA = ρ dρ dφ, so it becomes ∫₀^(2π)∫₀¹ e^(−ρ²) ρ dρ dφ. The ρ integral is the substitution on the plate, 0.3161; times 2π for the φ integral, the answer is π(1 − e^(−1)) = 1.986. The extra ρ turned an impossible integral into a one-liner.",
          claims: [area(0.31606)],
        },
        {
          id: "check", title: "Always check", focus: ["g"], patch: graph("x-plus-ln-x", [0.1, 4], [-3, 6], { probe: 1, tangent: true }),
          note: "Whatever the method, finish by checking. Differentiate an indefinite answer and compare with the integrand: if ∫(x + 1)/x dx = x + ln x + C, its slope at x = 1 should be (1 + 1)/1 = 2, which the tangent on the plate confirms. For a definite integral, check the sign and the size against a sketch: a positive function over a positive interval can't give a negative area.",
          claims: [slope(2)],
        },
      ],
      examples: [
        {
          id: "expand", level: "basic", title: "Algebra first",
          problem: "Find ∫(x² + 1)² dx.",
          setup: graph("expand-ex", [-1.5, 1.5], [-6, 6], { probe: 1, tangent: true }),
          lines: [
            { text: "There's no inside derivative to pair with, but expanding is easy: (x² + 1)² = x⁴ + 2x² + 1.", focus: ["g"] },
            { text: "Term by term: x⁵/5 + 2x³/3 + x + C.", focus: ["g"] },
            { text: "Check: the slope of the answer at x = 1 is (1 + 1)² = 4, which the tangent shows.", focus: ["g"], claims: [slope(4)] },
          ],
          trap: "Writing (x² + 1)³/3: that would need a 2x outside for the substitution. Without it, expand first.",
        },
        {
          id: "cos2", level: "tutorial", title: "A squared cosine",
          problem: "Find ∫₀^(π/2) cos²θ dθ.",
          setup: graph("cos2", [-0.2, 2], [-0.2, 1.2], { area: [0, Math.PI / 2] }),
          lines: [
            { text: "cos²θ = ½(1 + cos 2θ).", focus: ["g"] },
            { text: "∫₀^(π/2) ½(1 + cos 2θ) dθ = ½[θ + (sin 2θ)/2]₀^(π/2).", focus: ["g"] },
            { text: "= ½ × π/2 = π/4 = 0.7854.", focus: ["g"], claims: [area(0.785398)] },
          ],
          trap: "Writing (cos³θ)/3: the power rule only works on a bare variable, not on cos θ.",
        },
        {
          id: "disc", level: "exam", title: "A disc integral in polar coordinates",
          problem: "Find ∫∫(x² + y²) dA over the disc x² + y² ≤ 4.",
          setup: graph("x3", [-0.3, 2.3], [-1, 9], { area: [0, 2] }),
          lines: [
            { text: "In polar coordinates x² + y² = ρ² and dA = ρ dρ dφ, with ρ from 0 to 2 and φ from 0 to 2π.", focus: ["g"] },
            { text: "The integrand becomes ρ² · ρ = ρ³. The plate shades it (drawn against x) from 0 to 2: [ρ⁴/4]₀² = 4.", focus: ["g"], claims: [area(4)] },
            { text: "The φ integral gives 2π, so the answer is 8π = 25.13.", focus: ["g"] },
          ],
          trap: "Leaving out the ρ in dA: ∫₀² ρ² dρ = 8/3 gives 16π/3, which is wrong.",
        },
      ],
      asks: [
        { id: "which", q: "How do I know which method to use?", a: "Run the checklist: symmetry, algebra, standard forms, substitution, parts, then coordinates. Most exam integrals fall at the first or second step once the setup is right." },
        { id: "sin2", q: "Is ∫sin²x dx = (sin³x)/3?", tags: ["SIN2_DIRECT"], a: "No. The power rule works on a bare variable. Differentiating (sin³x)/3 gives sin²x cos x, not sin²x. Use sin²x = ½(1 − cos 2x) first." },
        { id: "zero", q: "When can I say an integral is zero without working it out?", tags: ["ODD_SYMMETRY_MISSED"], a: "When the integrand is odd, f(−x) = −f(x), and the limits are −a to a. x³, x⁵ and sin x all qualify: each positive piece cancels a negative one. A sine or cosine over whole periods also gives zero." },
        { id: "rho", q: "Why do I keep forgetting the ρ?", tags: ["JACOBIAN_DROPPED"], a: "Because dρ dφ looks complete. It isn't: a step dφ at distance ρ is an arc of length ρ dφ, so the patch is ρ dρ dφ. On a sphere the patch is r² sin θ dθ dφ for the same reason." },
        { id: "stuck", q: "What if nothing on the list works?", a: "Check the setup first: a wrong integrand is likelier than an impossible integral. Then try a different order of integration or coordinate system. In this course, every integral you'll be set has a clean method." },
        { id: "verify", q: "Should I check by differentiating every time?", a: "For indefinite integrals, yes: it takes seconds. For definite ones, check the sign and rough size against a sketch, and for EM answers check the units." },
      ],
      checks: [
        {
          id: "sin2-step", title: "Check: sin²", note: "Four checks on choosing a method. Get each right to move on.",
          interaction: { id: "sin2-step", type: "choose", prompt: "The first step for ∫sin²x dx is…", dimension: "recognition",
            options: [
              choice("right", "Write sin²x = ½(1 − cos 2x)", true, "Right: then it's two standard integrals."),
              choice("power", "Write (sin³x)/3 + C", false, "Differentiate it: you get sin²x cos x.", "SIN2_DIRECT"),
              choice("parts", "Integrate by parts with u = sin x", false, "Possible, but much longer than the identity."),
            ] },
        },
        {
          id: "odd", title: "Check: symmetry", note: "Look before you integrate.",
          interaction: { id: "odd", type: "choose", prompt: "∫₋₂² x⁵ dx = …", dimension: "conceptual",
            options: [
              choice("right", "0", true, "Right: x⁵ is odd, so the two halves cancel."),
              choice("double", "64/3", false, "That's 2 × [x⁶/6]₀². Odd functions cancel on −2 to 2; they don't double.", "ODD_SYMMETRY_MISSED"),
              choice("half", "32/3", false, "That's [x⁶/6]₀² only."),
            ] },
        },
        {
          id: "da", title: "Check: the area element", note: "Polar coordinates.",
          interaction: { id: "da", type: "choose", prompt: "In polar coordinates, dA = …", dimension: "recognition",
            options: [
              choice("right", "ρ dρ dφ", true, "Right: the φ-step is an arc of length ρ dφ."),
              choice("bare", "dρ dφ", false, "That misses the ρ: a patch gets bigger the further it is from the centre.", "JACOBIAN_DROPPED"),
              choice("sq", "ρ² dρ dφ", false, "ρ² belongs to nothing here; spheres use r² sin θ."),
            ] },
        },
        {
          id: "disc-area", title: "Check: a disc's area", note: "Last one: integrate in polar coordinates.",
          interaction: { id: "disc-area", type: "numeric", prompt: "Using polar coordinates, find ∫∫dA over the disc ρ ≤ 1 (its area).", answer: { value: 3.14159, unit: "" }, relTol: 0.01, dimension: "computational",
            distractors: [{ value: 6.28319, unit: "", errorClass: "conceptual", tag: "JACOBIAN_DROPPED", feedback: "Without the ρ you get ∫₀¹ dρ × 2π = 2π. With it, ∫₀¹ ρ dρ = ½ gives π." }],
            hints: ["dA = ρ dρ dφ.", "∫₀¹ ρ dρ = ½ and ∫₀^(2π) dφ = 2π."] },
        },
      ],
      recap: {
        points: [
          "Checklist: symmetry, algebra, standard forms, substitution, parts, then coordinates.",
          "sin² and cos²: use the double-angle identity first.",
          "Changing to polar adds a ρ: dA = ρ dρ dφ. That ρ is often the substitution you need.",
          "Always check: differentiate, or test the sign and size.",
        ],
        traps: ["∫sin²x dx = (sin³x)/3.", "Computing an odd integral that's zero by symmetry.", "Dropping ρ when changing coordinates."],
      },
    },
  ],
});