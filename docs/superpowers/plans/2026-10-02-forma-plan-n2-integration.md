# Maths Foundations N2: Unit D · Integration

> **For agentic workers:** execute task by task as AGENTS.md says: implement → run the task's checks → commit → ledger line. Steps use checkbox (`- [ ]`) syntax.

**Goal:** The first foundation unit, five idea lessons on integration, each built on the `graph-1d` plate:
- antiderivatives;
- definite integrals;
- substitution;
- integration by parts;
- choosing a technique, including when the coordinates do the work.

The EMag readiness check recommends them: its existing Integration topic and a new "Substitution or parts" topic point here.

**Architecture:**
- **Code layout.** The concepts live in `app/packages/course-em1/src/foundations/integration.ts`, and their plates in `app/packages/course-em1/src/foundations/plates/`.
- **Registration.** The plates are registered in the existing `plates`/`ideaPlates` maps, so the existing plate, idea, coverage and depth tests check every one of them.

**Spec:** `docs/superpowers/specs/2026-10-02-forma-maths-foundations-design.md` (Unit D).

**Depends on:** Plan N1 complete:
- the `graph-1d` component;
- `functions1d`, including every id used below (`expand-ex` among them);
- the `foundations` course;
- the web registry.

**Ledger:** `.superpowers/sdd/2026-10-02-forma-plan-n2-integration/progress.md`.

## Global Constraints

- **Transcribe the teaching text exactly:** every note, line, problem, trap, ask, check, option, feedback and recap point below. If a claim or lint fails:
  - fix the text and the claim together, keeping the text's precision;
  - log a `Ruling:`;
  - never add a `given` for a value the plate shows.
- **No new tests.** The existing loops check these plates:
  - `plates.test.ts`: validation, word budgets, possible slides;
  - `ideas.test.ts`: validation, asks, coverage, depth floor (≥3 explanations; basic, tutorial and exam examples; ≥6 asks; ≥4 checks; a recap).
- **Every graph step sets the full `graph-1d` param set** through `graph(...)` from `kit.ts`, so no step inherits a stale probe or area.
- **No dependencies, no hex colours, no emoji.**

## Review Focus

1. **Claims match the model.** Every claim value is the model's: the slopes, the areas, and the exact zeros (`x³` on −1.5 to 1.5; `sin` on 0 to 2π).
2. **No silent slides.** No example's problem step leaves the plate unchanged; each `setup` differs from the state before it.
3. **The readiness check routes to Unit D.**
   - A wrong Integration core puts "Antiderivatives" on the route, and a wrong "Substitution or parts" core puts "Choosing a technique" there.
   - The Desk card then lists them.
   - Finishing a lesson's last step offers the *next foundation* concept.
4. **Notation reads as maths:**
   - `e^(2x)` shows as a superscript and `x²` stays a superscript;
   - nothing reads as `x^2` or `a_x`. The prose-math renderer on `feat/polish` handles this.
5. **Phone layout.** At 390×844 the plate, readouts and margin note fit without sideways scrolling.

---

### Task 1: Plate kit and the five concepts

**Files:**
- Create: `app/packages/course-em1/src/foundations/kit.ts`
- Create: `app/packages/course-em1/src/foundations/integration.ts`
- Modify: `app/packages/course-em1/src/foundations/index.ts`

- [ ] **Step 1: `kit.ts`.**

```ts
import { functions1d } from "@forma/physics";

type More = { probe?: number; tangent?: boolean; area?: [number, number]; rects?: number };

/** A complete graph-1d param set: every step sets all of them, so no step inherits a stale probe or area. */
export const graphParams = (fn: string, x: [number, number], y: [number, number], m: More = {}) => ({
  fn, x, y, probe: m.probe ?? null, tangent: m.tangent ?? false, area: m.area ?? null, rects: m.rects ?? 0, label: functions1d[fn]!.label,
});
/** A step patch for the plate's one graph, instance "g". */
export const graph = (fn: string, x: [number, number], y: [number, number], m: More = {}) => ({ g: graphParams(fn, x, y, m) });
export const graphInstance = (fn: string, x: [number, number], y: [number, number], m: More = {}) => ({ id: "g", component: "graph-1d", params: graphParams(fn, x, y, m) });

export const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
export const slope = (value: number) => ({ instance: "g", readout: "gslope", value, unit: "" });
export const area = (value: number) => ({ instance: "g", readout: "garea", value, unit: "" });
export const valueAt = (value: number) => ({ instance: "g", readout: "gfx", value, unit: "" });
export const stripSum = (value: number) => ({ instance: "g", readout: "gsum", value, unit: "" });
```

- [ ] **Step 2: `integration.ts`.**

```ts
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
```

- [ ] **Step 3: Register the unit.** In `foundations/index.ts`:
  - import `integrationConcepts` from `./integration`;
  - set `const foundationUnits = [{ number: 4, title: "Integration" }];`;
  - set `const foundationConcepts: unknown[] = [...integrationConcepts];`.
- [ ] **Step 4: Don't commit yet.** The plates don't exist, so `pnpm test` fails on the missing `plateId`s. Tasks 2–6 add the plates, and the first commit is in Task 6.

---

### Task 2: Plate `m0-antiderivatives`

**File:** Create `app/packages/course-em1/src/foundations/plates/m0-antiderivatives.ts`.

```ts
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
```

- [ ] Don't commit yet. Task 6 registers and checks all five.

---

### Task 3: Plate `m0-definite`

**File:** Create `app/packages/course-em1/src/foundations/plates/m0-definite.ts`.

```ts
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
```

---

### Task 4: Plate `m0-substitution`

**File:** Create `app/packages/course-em1/src/foundations/plates/m0-substitution.ts`.

```ts
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
```

---

### Task 5: Plates `m0-parts` and `m0-choosing`

**Files:**
- Create `app/packages/course-em1/src/foundations/plates/m0-parts.ts`
- Create `app/packages/course-em1/src/foundations/plates/m0-choosing.ts`

```ts
// m0-parts.ts
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
```

```ts
// m0-choosing.ts
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
```

---

### Task 6: Register the plates, then run the full checks

**Files:** Modify `app/packages/course-em1/src/plates/index.ts`.

- [ ] **Step 1: Register.**
  - Import the five plates:

    ```ts
    import { m0Antiderivatives } from "../foundations/plates/m0-antiderivatives";
    import { m0Choosing } from "../foundations/plates/m0-choosing";
    import { m0Definite } from "../foundations/plates/m0-definite";
    import { m0Parts } from "../foundations/plates/m0-parts";
    import { m0Substitution } from "../foundations/plates/m0-substitution";
    ```

  - Append `, m0Antiderivatives.plate, m0Definite.plate, m0Substitution.plate, m0Parts.plate, m0Choosing.plate` to the `plates` array.
  - Append these entries to `ideaPlates`:

    ```ts
    [m0Antiderivatives.plate.id]: m0Antiderivatives, [m0Definite.plate.id]: m0Definite, [m0Substitution.plate.id]: m0Substitution, [m0Parts.plate.id]: m0Parts, [m0Choosing.plate.id]: m0Choosing
    ```

- [ ] **Step 2: Run** `pnpm test` from `app/`.
  - **Expected:** PASS. The new plates appear in `plates.test.ts` and `ideas.test.ts` (validation, coverage, depth floor).
  - **If a claim fails**, the message prints the model value:
    - compare it with the text;
    - fix the text **and** the claim together if the plan is wrong;
    - log a `Ruling:`.
  - **If a possible-slide or word-budget warning appears**, fix the smallest thing and log a `Ruling:`.
- [ ] **Step 3: Run** `pnpm typecheck` and the web `tsc`. Expected: PASS.
- [ ] **Step 4: Commit** with the message `feat(course): Maths Foundations Unit D (integration): antiderivatives, definite integrals, substitution, parts, choosing a technique`.

---

### Task 7: The readiness check recommends Unit D

**Files:** Modify `app/packages/course-em1/src/diagnostic.ts`.

- [ ] **Step 1: Retarget the Integration topic.** In `topics`, change:

  `{ id: "calculus", label: "Integration", refresher: "em1.math.surface-integrals" }`

  to:

  `{ id: "calculus", label: "Integration", refresher: "m0.int.antiderivatives" }`.

  Leave its two items as they are.
- [ ] **Step 2: Add a topic.**
  - Directly after the `calculus` topic, add:

    `{ id: "techniques", label: "Substitution or parts", refresher: "m0.int.choosing" },`

  - Directly after the `calculus-probe` item, add:

```ts
    {
      id: "techniques-core",
      topic: "techniques",
      role: "core",
      prompt: "∫2x cos(x²) dx = ?",
      options: [
        opt("a", "sin(x²) + C", true, "u = x², du = 2x dx: ∫cos u du."),
        opt("b", "2x sin(x²) + C", false, "Differentiate it: the product rule gives extra terms. Substitute u = x² instead."),
        opt("c", "cos(x²)·x² + C", false, "The x and x² can't be integrated separately. Substitute u = x²."),
      ],
    },
    {
      id: "techniques-probe",
      topic: "techniques",
      role: "probe",
      prompt: "To integrate x eˣ, which technique works?",
      options: [opt("a", "Integration by parts", true, "u = x, dv = eˣ dx."), opt("b", "Substitution with u = eˣ", false, "There's no derivative of eˣ left to absorb the x.")],
    },
```

- [ ] **Step 3: Checks.**
  - Run `pnpm test`, `pnpm typecheck`, the web `tsc`, `pnpm build` and `pnpm e2e`.
  - **Expected:** all PASS. `course.test.ts` "diagnostic refreshers … exist" passes because N1 widened it to foundation ids.
- [ ] **Step 4: Commit** with the message `feat(course): readiness check routes integration gaps to Maths Foundations`.

---

### Task 8: Browser walkthrough (no new tests)

Run the dev server and check by hand at 1360×900 and 390×844. Record each result in the ledger.

- [ ] `/courses`: "Maths Foundations for Engineering", labelled Prerequisite, is listed with 5 concepts open, above Electromagnetics I.
- [ ] `/c/math0`: Unit 4 · Integration lists the five concepts; no concept map is shown.
- [ ] **Each of the five lessons:**
  - the graph draws;
  - the probe, tangent and shaded area match the note;
  - every readout the note quotes is visible;
  - the checks accept the right answers;
  - `e^(2x)` renders as a superscript;
  - the margin kicker keeps Greek letters lower-case.
- [ ] **Readiness check, fresh profile:** answer the Integration core and probe wrong and "Substitution or parts" wrong. The results list both foundation lessons. "Save my route and start" opens Antiderivatives.
- [ ] **Desk:**
  - "Before Electromagnetics: 2 foundation lessons" is shown, with Start and Skip for now;
  - Skip hides it, including after a reload.
- [ ] **Next concept:** at the end of Antiderivatives, the next concept offered is Definite integrals, not an EMag concept.
- [ ] **Console:** clean on every page visited.

### Definition of done

- `pnpm test`, `pnpm typecheck`, the web `tsc`, `pnpm build` and `pnpm e2e` all pass.
- The ledger has every task line, the walkthrough results, and a `Ruling:` for every deviation.
- Stop and report.
