# Forma Plan E: Gauss's Law at Full Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Gauss's Law as five in-depth ideas:
- ① Faraday: why flux exists;
- ② Flux through a surface (built in Plan D);
- ③ Closed surfaces and the outward normal;
- ④ Gauss's law: shape and size don't matter, outside charges cancel;
- ⑤ Using it: symmetry for point, line and sheet charges.

Each idea has explanations, three worked examples, questions students ask, checks and a recap. Every number is physics-verified. A concept-wide coverage test ties all four objectives, the mapped tutorial and past-paper questions, and all five misconceptions to explanations, examples and checks.

**Architecture:**
- Each idea is its own `defineIdeaPlate` plate, built only from existing components plus small extensions (Task 1).
- The concept's `main` lesson becomes five plate blocks, played in sequence. Idea numbering runs across the blocks: Idea 1…5.
- The old 6-step Faraday + Gauss plates move to a "Quick tour" lesson, and the detour lessons stay.
- A concept-level coverage test aggregates the ideas of the `main` lesson.

**Tech Stack:** TypeScript, Zod 4, Vitest 5, Next.js 16 / React 19, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-09-25-forma-teaching-depth-desk-tools-design.md` §1, §4.3 (Plan E), §5.

## Global Constraints

- **Depth floor per idea:**
  - ≥ 3 explanations (≤ 180 words each);
  - worked examples at exactly three levels, basic, tutorial and exam, stepped line by line;
  - ≥ 6 questions students ask (≤ 80 words each);
  - ≥ 4 checks;
  - a recap card.
- **Exactness:** every unit-bearing number in a note, ask answer or trap must be backed by:
  - a visible readout (same unit),
  - a declared quotable value,
  - a visible param (as metres),
  - a claim,
  - or a step `given`.

  Givens are used only for values the plate cannot show (goal targets, per-face shares, dimensions beyond the plate). They are computed in code, never typed as literals. Numbers in interaction prompts, feedback and LaTeX are not linted: keep them identical to a linted number or verify them by hand.
- **Plate extent:** the plate spans x ∈ [−2.6, 2.6] m and z ∈ [−1.9, 1.9] m. Anything bigger is described with givens, not drawn.
- **Coverage (concept-wide):** objectives 0–3; the items `tutorial:q06`, `tutorial:q08`, `tutorial:q09a`, `past:f2425-q2a` and `past:f2324-q2b-i`; and the misconceptions `FLUX_SCALES_WITH_AREA`, `OUTSIDE_CHARGE_CONTRIBUTES`, `SURFACE_NORMAL_DIRECTION`, `D_VS_E_PERMITTIVITY` and `GAUSS_WITHOUT_SYMMETRY`.
- **Commands** run from `F:\StudyBuddy\app` unless stated. Commit after each task.

## Review Focus

1. **Idea numbering across plate blocks.** In the `main` lesson, the kicker for the second block reads "Idea 2 · Flux through a surface". It must not restart at 1. Tested in Task 6.
2. **Moving the old plates to "Quick tour"** must not break Desk "Continue", detour returns, snapshots or notebook restore links that point at blocks `faraday`/`gauss` in lesson `main`. `deskContinue` and `lessonForPlate` must resolve them to `quick`. Tested in Task 6.
3. **Concept-wide coverage.** Removing any one idea must fail the aggregated coverage test with a named gap. Tested in Task 6 (a negative case).
4. **Sheet and line charges on the plate.** Probes must never sit on a sheet (z0 ≠ 0), and field arrows must skip grid points on a line. No NaN or null readouts on any authored step. Tested in Tasks 2–5 by `validatePlate` (claims on `probeD` are finite).
5. **Template checks** (q06, q08-q, q09a, f2425-qt) keep matching their seed-1 answers after content moves. Tested by the existing course test.

---

## File Structure

```
app/packages/plate/src/validate.ts                  lint units + µC/m, nC/m
app/packages/plate/src/components/em.ts             faraday-spheres: dMid readout, quotable innerQ/rMid; charges: quotable rhoLs
app/packages/plate/src/ideas.ts                     stepLocation/timelineMarks take a starting idea number
app/packages/course-em1/src/plates/idea-faraday.ts   ① NEW
app/packages/course-em1/src/plates/idea-closed.ts    ③ NEW
app/packages/course-em1/src/plates/idea-gauss-law.ts ④ NEW
app/packages/course-em1/src/plates/idea-symmetry.ts  ⑤ NEW
app/packages/course-em1/src/plates/index.ts, src/concepts/gauss-law.ts, src/index.ts
app/packages/course-em1/test/{ideas,gauss-coverage}.test.ts
app/apps/web/components/plate/PlatePlayer.tsx       idea offset across blocks
app/apps/web/lib/{desk,course}.ts                    old block ids resolve to "quick"
app/apps/web/test/*.test.ts, e2e/*.spec.ts           updated URLs; new main-lesson e2e
```

---

### Task 1: Small engine support: lint units, quotables, idea numbering

**Files:**
- Modify: `app/packages/plate/src/validate.ts`, `src/components/em.ts`, `src/ideas.ts`
- Test: `app/packages/plate/test/numbers.test.ts`, `test/ideas.test.ts`, `test/em.test.ts` (append)

**Interfaces:**
- Produces:
  - The lint recognises `µC/m` and `nC/m`.
  - `faraday-spheres`: readout `dMid: "µC/m^2"`; quotable `{ innerQ: "µC", rMid: "m" }`; model `{ innerQ, rMid: 0.5, dMid }`.
  - `charges`: model `rhoLs: number[]`; quotable `rhoLs: "nC/m"`.
  - `stepLocation(meta, index, first = 1)` and `timelineMarks(meta, first = 1)`.

- [ ] **Step 1: Write the failing tests**

Append to `test/numbers.test.ts`:

```ts
it("reads line-charge units", () => {
  expect(unbackedNumbers("ρL = 2000 nC/m", [{ value: 2000, unit: "nC/m" }])).toEqual([]);
  expect(unbackedNumbers("ρL = 3 µC/m", [])).toEqual(["3 µC/m"]);
});
```

Append to `test/em.test.ts` (inside the existing `describe`):

```ts
  it("faraday-spheres reports D halfway and exposes its given quantities", () => {
    const f = frame(plate({}, [{ id: "a", kind: "point", q: 1, pos: [0, 0, 0] }]));
    expect(f.far!.model.dMid as number).toBeCloseTo(2 / (4 * Math.PI * 0.25), 12);
    expect(f.far!.model.rMid).toBe(0.5);
    expect(f.far!.model.innerQ).toBe(2);
  });
```

(`plate()` in that file builds `far` with its default `innerQ: 2` and material Glass.)

Append to `test/ideas.test.ts` (inside `describe("defineIdeaPlate")`):

```ts
  it("numbers ideas from a starting index (ideas spread over several plates)", () => {
    expect(stepLocation(lesson.meta, 1, 3)).toBe("Idea 3 · First idea · Explanation 2 of 2");
    expect(timelineMarks(lesson.meta, 3)[0]).toEqual({ index: 0, label: "3 First idea" });
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run packages/plate`
Expected: FAIL (`nC/m` not matched; `dMid` undefined; the start index is ignored).

- [ ] **Step 3: Implement**
- **`validate.ts`:** in `WITH_UNIT`, add `[µμ]C\/m|nC\/m` after the `/m²` and `/m^2` alternatives and before `V\/m`. The unit group becomes:

```ts
([µμ]C\/m²|[µμ]C\/m\^2|nC\/m²|nC\/m\^2|[µμ]C\/m|nC\/m|V\/m|[µμ]C|nC|m²|m\^2|C|m)
```

- **`em.ts`, `Charges.model`:** add `rhoLs: p.items.flatMap((it) => (it.kind === "line" ? [it.rhoL] : [])),`. Change its `quotable` to `{ qs: "µC", rhoSs: "µC/m^2", rhoLs: "nC/m" }`.
- **`em.ts`, `FaradaySpheres`:**

```ts
  model: (p) => {
    const epsR = MATERIAL_EPS_R[p.material];
    const dMid = p.innerQ / (4 * Math.PI * 0.25); // µC/m² at r = 0.5 m
    return { outerQ: p.innerQ, epsR, eMid: (dMid * 1e-6) / (EPS0 * epsR), dMid, innerQ: p.innerQ, rMid: 0.5 };
  },
  handles: ["material"],
  readouts: { outerQ: "µC", eMid: "V/m", dMid: "µC/m^2" },
  quotable: { innerQ: "µC", rMid: "m" },
```

- **`ideas.ts`:**
  - Give `stepLocation` a third parameter `first = 1` and use `Idea ${first + n}` in place of `Idea ${n + 1}`.
  - Give `timelineMarks` a second parameter `first = 1` and use `${first + n} ${idea.title}`.
- **Readout labels:** the web `Readouts.tsx` `LABEL` needs a label for the new readout, because the Plan B readout-label test requires one. Add `dMid: "|D| at 0.5 m"` and `TONE` `dMid: "flux"`.

- [ ] **Step 4: Run tests**

Run: `pnpm test && pnpm typecheck`
Expected: PASS (existing Faraday claims still hold; the new readout is labelled).

- [ ] **Step 5: Commit**

```bash
git add packages/plate apps/web/components/plate/Readouts.tsx && git commit -m "feat(plate): line-charge units, Faraday D readout and quotables, idea numbering across plates"
```

---

### Task 2: Idea ①: Faraday, why flux exists

**Files:**
- Create: `app/packages/course-em1/src/plates/idea-faraday.ts`
- Modify: `app/packages/course-em1/src/plates/index.ts` (add to `plates` and `ideaPlates`)
- Test: the existing `test/ideas.test.ts` (it iterates every idea plate: validation, asks, coverage, depth floor, template agreement)

- [ ] **Step 1: Register an empty entry to see the test fail**: add `import { ideaFaraday } from "./idea-faraday";` to `plates/index.ts`, add `ideaFaraday.plate` to the `plates` list, and add `[ideaFaraday.plate.id]: ideaFaraday` to `ideaPlates`. Run `pnpm vitest run packages/course-em1`. Expected: FAIL (module not found).

- [ ] **Step 2: Write `idea-faraday.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });

export const ideaFaraday = defineIdeaPlate({
  id: "idea-faraday",
  title: "Faraday's spheres: why flux exists",
  requires: { objectives: [1], items: [], misconceptions: ["D_VS_E_PERMITTIVITY"] },
  instances: [
    { id: "spheres", component: "faraday-spheres", params: { innerQ: 2, material: "Air", revealed: false } },
    { id: "eq", component: "equation", params: { latex: R`\Psi`, speech: "psi, the electric flux", shortSpeech: "flux" } },
  ],
  ideas: [
    {
      id: "faraday",
      title: "Faraday's spheres: why flux exists",
      objectives: [1],
      explain: [
        {
          id: "setup", title: "One charge, four materials", show: ["spheres"], focus: ["spheres"],
          note: "In 1837 Michael Faraday hung a small metal ball, charged to +2 µC, inside a hollow metal sphere without letting them touch. Then he measured the charge that appeared on the outside of the outer sphere. He repeated the experiment with the gap filled with air, then glass, then sulphur, then shellac. The question he was asking: does the stuff in between change what reaches the outer sphere?",
        },
        {
          id: "always", title: "Always +Q", patch: { spheres: { revealed: true } }, focus: ["spheres"],
          note: "The outer sphere always showed the same charge as the inner ball: 2 µC, in every material. Something passes from the inner charge to the outer sphere and is not reduced by what lies between. That something is what we now call the electric displacement, D, and its total through a surface is the electric flux.",
          claims: [{ instance: "spheres", readout: "outerQ", value: 2, unit: "µC" }],
        },
        {
          id: "glass", title: "What glass does change", patch: { spheres: { material: "Glass" } }, focus: ["spheres"],
          note: "Fill the gap with glass. Halfway out, 0.5 m from the centre, D is 0.6366 µC/m², exactly what it was in air, because D depends only on the charge and the distance. The electric field E is different: it drops to about 14380 V/m, five times weaker than in air, because glass has ε_r = 5 and E = D/(ε₀ε_r). The material changes E, never D.",
          claims: [{ instance: "spheres", readout: "dMid", value: 0.63662, unit: "µC/m^2" }, { instance: "spheres", readout: "eMid", value: 14380.1, unit: "V/m" }],
        },
        {
          id: "flux", title: "Flux: counting D", patch: { spheres: { material: "Sulphur" }, eq: { latex: R`\Psi=Q`, speech: "psi equals Q", shortSpeech: "flux equals charge" } }, show: ["eq"], focus: ["eq", "spheres"],
          note: "In sulphur E changes again, to about 17975 V/m, while D stays at 0.6366 µC/m² and the outer sphere still shows 2 µC. So we give the thing that passes through a name of its own: the electric flux Ψ. Its defining property is Faraday's result: the flux leaving a charge equals the charge, Ψ = Q, measured in coulombs. The next ideas turn this into a tool.",
          claims: [{ instance: "spheres", readout: "eMid", value: 17975.1, unit: "V/m" }, { instance: "spheres", readout: "outerQ", value: 2, unit: "µC" }],
        },
      ],
      examples: [
        {
          id: "sulphur", level: "basic", title: "A +5 µC ball in sulphur",
          setup: { spheres: { innerQ: 5, material: "Sulphur", revealed: true } },
          problem: "A ball charged to +5 µC hangs inside a hollow metal sphere with sulphur packed between them. What charge appears on the outer sphere, and what is the flux from the ball?",
          lines: [
            { text: "Faraday's result: the outer sphere shows the inner charge, whatever fills the gap. Q_outer = 5 µC.", focus: ["spheres"], claims: [{ instance: "spheres", readout: "outerQ", value: 5, unit: "µC" }] },
            { text: "The flux from the ball equals its charge: Ψ = Q = 5 µC. The sulphur changes E, not the flux.", latex: R`\Psi=Q=5\ \mu\mathrm C`, focus: ["spheres"] },
          ],
          trap: "Scaling the outer charge by ε_r. The material never changes the charge that appears outside.",
        },
        {
          id: "shellac", level: "tutorial", title: "D and E halfway, in shellac",
          setup: { spheres: { innerQ: 2, material: "Shellac", revealed: true } },
          problem: "The inner ball carries +2 µC and shellac (ε_r = 3.5) fills the gap. Find D and E halfway, 0.5 m from the centre.",
          lines: [
            { text: "D does not care about the material: D = Q/(4πr²) = 2/(4π × 0.25) = 0.6366 µC/m².", latex: R`D=\frac{Q}{4\pi r^2}=\frac{2}{4\pi(0.5)^2}=0.6366\ \mu\mathrm C/\mathrm m^2`, focus: ["spheres"], claims: [{ instance: "spheres", readout: "dMid", value: 0.63662, unit: "µC/m^2" }] },
            { text: "E does: E = D/(ε₀ε_r) = 0.6366×10⁻⁶ / (8.854×10⁻¹² × 3.5) ≈ 20543 V/m.", latex: R`E=\frac{D}{\varepsilon_0\varepsilon_r}=\frac{0.6366\times10^{-6}}{8.854\times10^{-12}\times3.5}`, focus: ["spheres"], claims: [{ instance: "spheres", readout: "eMid", value: 20543, unit: "V/m" }] },
          ],
          trap: "Dividing D by ε_r as well. That number means nothing; only E carries the ε_r.",
        },
        {
          id: "absorb", level: "exam", title: "Does glass absorb flux?",
          setup: { spheres: { innerQ: 4, material: "Glass", revealed: true } },
          problem: "A student claims 'glass absorbs part of the electric flux'. Using Faraday's experiment with a +4 µC ball, show why that is wrong, quoting D and E halfway.",
          lines: [
            { text: "With glass in the gap the outer sphere still shows 4 µC, exactly as in air, so no flux is lost on the way.", focus: ["spheres"], claims: [{ instance: "spheres", readout: "outerQ", value: 4, unit: "µC" }] },
            { text: "D halfway is 4/(4π × 0.25) = 1.273 µC/m² in every material.", focus: ["spheres"], claims: [{ instance: "spheres", readout: "dMid", value: 1.27324, unit: "µC/m^2" }] },
            { text: "E halfway in glass is only 28760 V/m: the material weakens E, not D and not the flux. The student has confused E with D.", focus: ["spheres"], claims: [{ instance: "spheres", readout: "eMid", value: 28760.2, unit: "V/m" }] },
          ],
          trap: "Arguing from E alone. A weaker E in glass is real, but flux is counted with D.",
        },
      ],
      asks: [
        { id: "metal", q: "Why was the outer sphere made of metal?", a: "Charge moves freely in a metal, so whatever the inner ball 'sends out' shows up as charge on the outer sphere, where Faraday could measure it. The metal shell is the detector." },
        { id: "touch", q: "Did the ball touch the outer sphere?", a: "No. It hung inside, insulated. The outer charge appeared by induction: the ball's field pulled opposite charge to the inner wall of the shell and pushed the same amount of like charge to the outside." },
        { id: "epsr", q: "What is ε_r?", show: ["spheres"], patch: { spheres: { material: "Glass", revealed: true } }, focus: ["spheres"], a: "The relative permittivity: how much a material weakens E compared with vacuum. Glass here has ε_r = 5, so E in glass is five times smaller than in vacuum. It never changes D or the flux." },
        { id: "d-material", q: "Does D depend on the material?", tags: ["D_VS_E_PERMITTIVITY"], show: ["spheres"], patch: { spheres: { material: "Glass", revealed: true } }, focus: ["spheres"], a: "No. D is set by the free charge alone: D = Q/(4πr²) here, in any material. E = D/ε is what changes. That is exactly why Faraday saw the same outer charge every time." },
        { id: "off-centre", q: "What if the ball were off-centre?", a: "The outer charge would still equal the inner charge. Moving the ball changes where the field is strong, not the total that passes through the shell. That idea, that the total depends only on the charge inside, is Gauss's law." },
        { id: "name", q: "Why is it called 'flux'?", a: "From the Latin fluxus, 'flow'. Nothing actually flows; picturing a stream crossing a surface is a way to count the field. The count is in coulombs because it always equals the charge that produces it." },
      ],
      checks: [
        {
          id: "outer", title: "Check: the outer charge", show: ["spheres"], patch: { spheres: { innerQ: 2, material: "Glass", revealed: false } },
          note: "Four checks on Faraday's result. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "outer", type: "choose", prompt: "With glass packed between the spheres, the outer sphere shows…", dimension: "conceptual",
            options: [
              choice("same", "Exactly +Q", true, "Yes: the same in every material."),
              choice("less", "Less than +Q: glass soaks some up", false, "The material changes E, not the flux, so the outer sphere still shows +Q.", "D_VS_E_PERMITTIVITY"),
              choice("more", "More than +Q", false, "Nothing is created in between; the outer sphere shows exactly +Q."),
            ] },
        },
        {
          id: "what-changes", title: "Check: what the material changes", patch: { spheres: { revealed: true } },
          note: "Which quantity does the material actually change?",
          interaction: { id: "what-changes", type: "choose", prompt: "Replacing air with glass between the spheres changes…", dimension: "conceptual",
            options: [
              choice("e", "E between the spheres", true, "Right: E = D/(ε₀ε_r) drops by the factor ε_r."),
              choice("d", "D between the spheres", false, "D depends only on the free charge and the distance, not the material.", "D_VS_E_PERMITTIVITY"),
              choice("q", "The charge on the outer sphere", false, "That is Faraday's point: the outer charge never changes.", "D_VS_E_PERMITTIVITY"),
            ] },
        },
        {
          id: "predict-e", title: "Check: predict E in glass", patch: { spheres: { material: "Air", innerQ: 2, revealed: true } },
          note: "Predict first, then the plate shows the truth.",
          interaction: { id: "predict-e", type: "predict-drag", prompt: "The gap switches from air to glass (ε_r = 5). Drag E halfway to your prediction.", target: { instance: "spheres", readout: "eMid" }, range: [0, 80000], unit: "V/m", relTol: 0.05, reveal: { spheres: { material: "Glass" } }, dimension: "conceptual",
            feedback: { close: "Right: about a fifth, 14380 V/m.", far: "E = D/(ε₀ε_r): five times smaller than in air, about 14380 V/m." } },
        },
        {
          id: "d-glass", title: "Check: D in glass",
          note: "A number to finish.",
          interaction: { id: "d-glass", type: "numeric", prompt: "A +4 µC ball hangs inside the outer sphere with glass in the gap. Find |D| halfway, 0.5 m from the centre.", answer: { value: 1.2732, unit: "µC/m^2" }, relTol: 0.02, dimension: "computational",
            distractors: [{ value: 0.25465, unit: "µC/m^2", errorClass: "conceptual", tag: "D_VS_E_PERMITTIVITY", feedback: "That divides by ε_r = 5. D doesn't depend on the material; E does." }],
            hints: ["D depends only on the charge and the distance.", "D = Q/(4πr²).", "4/(4π × 0.25)."] },
        },
      ],
      recap: {
        points: [
          "Faraday (1837): the outer sphere always shows the inner charge, whatever fills the gap.",
          "Something passes from charge to shell and ignores the material: D, and its total, the flux Ψ = Q.",
          "Materials change E = D/(ε₀ε_r), never D or the flux.",
        ],
        traps: ["Thinking a material absorbs flux.", "Mixing up D and E."],
      },
    },
  ],
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS.
- If a claim fails, the message prints the model value. Fix the claim **and** the text together, keeping the text's precision.
- If the lint flags a number, the text states a value the plate doesn't show. Rewrite the text; never add a given for a value the plate could show.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 1 in depth: Faraday's spheres and why flux exists"
```

---

### Task 3: Idea ③: Closed surfaces and the outward normal

**Files:**
- Create: `app/packages/course-em1/src/plates/idea-closed.ts`
- Modify: `app/packages/course-em1/src/plates/index.ts`

- [ ] **Step 1: Register it** (as in Task 2 Step 1, with `ideaClosed` from `./idea-closed`), then run `pnpm vitest run packages/course-em1`. Expected: FAIL (module not found).

- [ ] **Step 2: Write `idea-closed.ts`**

```ts
import { defineIdeaPlate } from "@forma/plate";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const point = (id: string, q: number, pos: [number, number, number], draggable = false) => ({ id, kind: "point" as const, q, pos, draggable });

export const ideaClosed = defineIdeaPlate({
  id: "idea-closed",
  title: "Closed surfaces and the outward normal",
  requires: { objectives: [2], items: [], misconceptions: ["SURFACE_NORMAL_DIRECTION", "OUTSIDE_CHARGE_CONTRIBUTES"] },
  instances: [
    { id: "q", component: "charges", params: { items: [point("q1", 2, [0, 0, 0])] } },
    { id: "field", component: "field-arrows", params: { grid: 5, probe: 1 }, links: { charges: "q" } },
    { id: "surface", component: "gaussian-surface", params: { shape: "sphere", size: 1 }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\Psi`, speech: "psi", shortSpeech: "flux" } },
  ],
  ideas: [
    {
      id: "closed",
      title: "Closed surfaces and the outward normal",
      objectives: [2],
      explain: [
        {
          id: "closed", title: "A closed surface", show: ["q", "field", "surface"], focus: ["surface"],
          note: "A closed surface has no edge: it seals off a volume, like a balloon. The sphere here, radius 1 m, closes around a +2 µC charge. 'Inside' and 'outside' now mean something definite, and that is what makes closed surfaces special: they let us ask how much flux leaves a region, not just how much crosses a patch.",
          claims: [{ instance: "surface", readout: "area", value: 12.566, unit: "m^2" }],
        },
        {
          id: "outward", title: "Outward, always", patch: { surface: { showNormals: true } }, focus: ["surface"],
          note: "On a closed surface the normal is not a choice. dS always points outward, away from the enclosed volume: to the right on the right, up at the top, down at the bottom. Fixing the direction once, everywhere, is what lets us add flux over the whole surface without arguing about signs.",
        },
        {
          id: "signs", title: "Leaving counts +, entering counts −", patch: { surface: { shading: true } }, focus: ["surface"],
          note: "With dS outward, D · dS is positive wherever the field leaves the volume and negative wherever it enters. Here every patch is shaded blue: the +2 µC charge sends field out through all of them.",
        },
        {
          id: "net", title: "The net flux ∮", show: ["eq"], patch: { eq: { latex: R`\Psi=\oint_S\mathbf D\cdot d\mathbf S`, speech: "psi equals the closed surface integral of D dot d S", shortSpeech: "net outward flux" } }, focus: ["eq", "surface"],
          note: "Add every patch, leaving minus entering, and you have the net outward flux, written with a circle on the integral sign: Ψ = ∮ D · dS. For this sphere the readout gives 2 µC, the same as the charge inside. That is not a coincidence; it is the next idea.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "negative", title: "A negative charge", patch: { q: { items: [point("q1", -3, [0, 0, 0])] } }, focus: ["surface"],
          note: "Swap in a −3 µC charge. Now D points inward everywhere, against every outward normal, so every patch counts negative and the net flux is −3 µC. The normals did not flip; the field did.",
          claims: [{ instance: "surface", readout: "flux", value: -3, unit: "µC" }],
        },
        {
          id: "outside", title: "A charge outside", patch: { q: { items: [point("q1", 2, [1.6, 0, 0])] } }, focus: ["surface"],
          note: "Now put a +2 µC charge outside, 1.6 m from the centre. Field enters on the near side (ochre, negative) and leaves on the far side (blue, positive). Every line that enters also leaves, so the net flux is exactly zero, even though plenty of field crosses the surface.",
          claims: [{ instance: "surface", readout: "flux", value: 0, unit: "µC" }],
        },
      ],
      examples: [
        {
          id: "faces", level: "basic", title: "Six faces of a cube",
          setup: { surface: { shape: "cube", size: 2, showNormals: false, shading: true }, q: { items: [point("q1", 4, [0, 0, 0])] } },
          problem: "A +4 µC charge sits at the centre of a closed cube of side 2 m. Find the net outward flux, and the flux through one face.",
          lines: [
            { text: "The cube is closed and holds the whole charge, so the net outward flux is the total: Ψ = 4 µC.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 4, unit: "µC" }] },
            { text: "The charge is at the centre, so all six faces are identical by symmetry: each carries 4/6 ≈ 0.667 µC.", focus: ["surface"], givens: [{ value: 4 / 6, unit: "µC" }] },
          ],
          trap: "Splitting by six only works because the charge is at the centre. Off-centre, the faces carry different shares; only the total stays fixed.",
        },
        {
          id: "negative-off", level: "tutorial", title: "A negative charge, off-centre",
          setup: { surface: { shape: "cube", size: 2 }, q: { items: [point("q1", -3, [0.4, 0, 0.3])] } },
          problem: "A −3 µC charge sits 0.4 m right of centre, inside a closed cube of side 2 m. Find the net outward flux, and say which way the field crosses the faces.",
          lines: [
            { text: "The charge is inside the closed cube, so all of it counts, sign included: Ψ = −3 µC.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: -3, unit: "µC" }] },
            { text: "Negative net flux means the field crosses inward: D points toward the charge, against every outward normal. Moving the charge off-centre changes which faces carry more, not the total.", focus: ["surface", "field"] },
          ],
          trap: "Flipping the normals to 'follow' the inward field, which makes the flux positive. The normals stay outward; the sign belongs to the charge.",
        },
        {
          id: "mixed", level: "exam", title: "Inside and outside together",
          setup: { surface: { shape: "sphere", size: 1 }, q: { items: [point("q1", 2, [0, 0, 0]), point("q2", -5, [1.5, 0, 0])] } },
          problem: "A +2 µC charge sits at the centre of a sphere of radius 1 m, and a −5 µC charge sits 1.5 m from the centre. Find the net outward flux through the sphere.",
          lines: [
            { text: "Only the +2 µC charge is inside: the other sits 1.5 m out, beyond the radius of 1 m.", focus: ["q", "surface"] },
            { text: "The outside charge's field enters and leaves the sphere, contributing zero net flux.", focus: ["surface"] },
            { text: "So Ψ = 2 µC.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }] },
          ],
          trap: "Adding in the outside charge. It changes the flux through every patch, but never the total.",
        },
      ],
      asks: [
        { id: "what-closed", q: "What counts as a closed surface?", a: "Any surface that fully seals a volume: a sphere, a cube, a cylinder with its end caps, a lumpy blob. A hemisphere or a flat disc is open: it has an edge you could walk off." },
        { id: "why-outward", q: "Why must the normal point outward?", tags: ["SURFACE_NORMAL_DIRECTION"], a: "So that 'net flux' has one meaning: out minus in. If each patch picked its own side, you could make the total anything you liked. Outward is the convention Gauss's law is written in." },
        { id: "zero-field", q: "If the net flux is zero, is the field zero?", show: ["q", "field", "surface"], patch: { q: { items: [point("q1", 2, [1.6, 0, 0])] }, surface: { shape: "sphere", size: 1, shading: true } }, focus: ["surface"], a: "No. With a charge outside, field crosses the surface nearly everywhere; it just leaves as much as it enters. Zero net flux means zero net charge inside, not zero field." },
        { id: "outside-matters", q: "Does a charge outside change anything at all?", tags: ["OUTSIDE_CHARGE_CONTRIBUTES"], a: "It changes the flux through each patch, a lot, but not the total. Every bit of its field that enters the closed surface leaves again somewhere else." },
        { id: "negative-meaning", q: "What does a negative net flux mean?", a: "More field enters than leaves, so the enclosed charge is negative. The sign of the net flux is the sign of the charge inside." },
        { id: "edges", q: "Do the edges and corners of a cube matter?", a: "No. Edges and corners have zero area, so they add nothing. Each flat face is its own patch with its own outward normal." },
        { id: "bottom", q: "On the bottom face of a cube, which way does dS point?", tags: ["SURFACE_NORMAL_DIRECTION"], a: "Down: outward from the cube, which on the bottom face means −z. A common slip is to point it up, into the cube. Outward means away from the enclosed volume, face by face." },
      ],
      checks: [
        {
          id: "bottom-face", title: "Check: the bottom face", show: ["surface"], patch: { surface: { shape: "cube", size: 2, showNormals: true, shading: false }, q: { items: [point("q1", 2, [0, 0, 0])] } },
          note: "Four checks on closed surfaces. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "bottom-face", type: "choose", prompt: "On the bottom face of a closed cube, dS points…", dimension: "recognition",
            options: [
              choice("down", "Down, out of the cube", true, "Right: outward from the enclosed volume."),
              choice("up", "Up, into the cube", false, "Into the cube is inward. dS always points outward.", "SURFACE_NORMAL_DIRECTION"),
              choice("along", "Whichever way D points there", false, "dS never follows D. It is fixed outward.", "SURFACE_NORMAL_DIRECTION"),
            ] },
        },
        {
          id: "drag-out", title: "Check: move it outside", patch: { surface: { shape: "sphere", size: 1, showNormals: false, shading: true }, q: { items: [point("q1", 2, [0.3, 0, 0.2], true)] } },
          note: "Drag the +2 µC charge out of the sphere and watch the net flux.",
          interaction: { id: "drag-out", type: "manipulate-goal", goal: "Drag the +2 µC charge out of the sphere (or focus it and use the arrow keys). Watch the net flux drop to zero.", check: "outside-zero", dimension: "conceptual" },
        },
        {
          id: "predict-neg", title: "Check: predict the sign", patch: { q: { items: [point("q1", 2, [0, 0, 0])] } },
          note: "Predict first, then the plate shows the truth.",
          interaction: { id: "predict-neg", type: "predict-drag", prompt: "The +2 µC charge is replaced by −3 µC at the centre. Drag the net outward flux to your prediction.", target: { instance: "surface", readout: "flux" }, range: [-5, 5], unit: "µC", relTol: 0.05, reveal: { q: { items: [point("q1", -3, [0, 0, 0])] } }, dimension: "conceptual",
            feedback: { close: "Right: −3 µC, the charge inside, sign included.", far: "Ψ = Q_enc = −3 µC. The normals stay outward; the field now points in." } },
        },
        {
          id: "outside-total", title: "Check: an outside charge",
          note: "Last one.",
          interaction: { id: "outside-total", type: "choose", prompt: "A closed sphere has +2 µC inside and a +7 µC charge just outside. The net outward flux is…", dimension: "conceptual",
            options: [
              choice("two", "2 µC", true, "Yes: only the enclosed charge counts."),
              choice("nine", "9 µC", false, "The +7 µC charge is outside: its field enters and leaves, adding zero net.", "OUTSIDE_CHARGE_CONTRIBUTES"),
              choice("zero", "0", false, "Zero would need no net charge inside, but +2 µC is inside."),
            ] },
        },
      ],
      recap: {
        points: [
          "A closed surface seals a volume; its normal dS always points outward.",
          "Net outward flux Ψ = ∮ D · dS counts leaving as positive and entering as negative.",
          "A charge outside sends in exactly as much as it takes out: zero net.",
          "The sign of the net flux is the sign of the enclosed charge.",
        ],
        traps: ["Letting dS follow D instead of pointing outward.", "Counting charges that sit outside the surface."],
      },
    },
  ],
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS. Fix as in Task 2 Step 3 if a claim or lint fails.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 3 in depth: closed surfaces and the outward normal"
```

---

### Task 4: Idea ④: Gauss's law

**Files:**
- Create: `app/packages/course-em1/src/plates/idea-gauss-law.ts`
- Modify: `app/packages/course-em1/src/plates/index.ts`

- [ ] **Step 1: Register it** (`ideaGaussLaw` from `./idea-gauss-law`), then run `pnpm vitest run packages/course-em1`. Expected: FAIL.

- [ ] **Step 2: Write `idea-gauss-law.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const point = (id: string, q: number, pos: [number, number, number], draggable = false) => ({ id, kind: "point" as const, q, pos, draggable });
const q09a = instantiate(templates.find((t) => t.id === "q09a-cube")!, 1);
const LAW = R`\oint_S\mathbf D\cdot d\mathbf S=Q_{\mathrm{enc}}`;

export const ideaGaussLaw = defineIdeaPlate({
  id: "idea-gauss-law",
  title: "Gauss's law",
  requires: { objectives: [0, 1], items: ["tutorial:q09a", "past:f2324-q2b-i"], misconceptions: ["FLUX_SCALES_WITH_AREA", "OUTSIDE_CHARGE_CONTRIBUTES"] },
  instances: [
    { id: "q", component: "charges", params: { items: [point("q1", 2, [0, 0, 0])] } },
    { id: "field", component: "field-arrows", params: { grid: 5, probe: 1 }, links: { charges: "q" } },
    { id: "surface", component: "gaussian-surface", params: { shape: "sphere", size: 1, shading: true }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: LAW, speech: "the closed surface integral of D dot d S equals the charge enclosed", shortSpeech: "Gauss's law" } },
  ],
  ideas: [
    {
      id: "gauss",
      title: "Gauss's law",
      objectives: [0, 1],
      explain: [
        {
          id: "law", title: "The law", show: ["q", "field", "surface", "eq"], focus: ["eq", "surface"],
          note: "Gauss's law: the net outward flux of D through any closed surface equals the free charge enclosed, ∮ D · dS = Q_enc. Here a +2 µC charge sits inside a 1 m sphere, and the readout agrees: 2 µC. The rest of this idea is about how much that one line promises: any size, any shape, and charges outside count for nothing.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "bigger", title: "Bigger surface, same flux", patch: { surface: { size: 1.8 }, field: { probe: 1.8 } }, focus: ["surface"],
          note: "Grow the sphere to 1.8 m. Its area grows 3.24 times, to 40.72 m². But D on it falls as 1/r², also 3.24 times, to 0.0491 µC/m². Area up, D down, and the product is unchanged: the flux is still 2 µC. A bigger surface does not catch more flux, because every field line from the charge crosses any closed surface around it exactly once.",
          claims: [{ instance: "surface", readout: "area", value: 40.715, unit: "m^2" }, { instance: "field", readout: "probeD", value: 0.049122, unit: "µC/m^2" }, { instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "cube", title: "Any shape: a cube", patch: { surface: { shape: "cube", size: 2.4 }, field: { probe: 1 } }, focus: ["surface"],
          note: "Swap the sphere for a cube. The patches change completely: some near, some far, most tilted to the field. The flux through each one is different, and the total is not: still 2 µC.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "blob", title: "Any shape: a lumpy blob", patch: { surface: { shape: "blob", size: 1.1 } }, focus: ["surface"],
          note: "Even a lumpy blob gives 2 µC. Shape changes how the flux is shared out among the patches, never the total. That is why the law says 'any closed surface'.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "outside", title: "Outside charges cancel", patch: { surface: { shape: "sphere", size: 1 }, q: { items: [point("q1", 2, [0, 0, 0]), point("q2", 3, [1.4, 0, 0])] } }, focus: ["surface", "q"],
          note: "Add a +3 µC charge outside, 1.4 m from the centre. Its field pours in on the near side and out on the far side: ochre patches in, blue patches out. In the net flux they cancel exactly, and the readout stays at the 2 µC inside.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "several", title: "Several charges inside", patch: { q: { items: [point("q1", 2, [-0.3, 0, 0]), point("q3", -1, [0.4, 0, 0.2]), point("q2", 3, [1.4, 0, 0])] } }, focus: ["surface", "q"],
          note: "Put a −1 µC charge inside as well. Now Q_enc = 2 + (−1) and the flux is 1 µC, whatever the outside charge does. Gauss's law adds charges inside with their signs and ignores everything outside.",
          claims: [{ instance: "surface", readout: "flux", value: 1, unit: "µC" }],
        },
      ],
      examples: [
        {
          id: "two-in", level: "basic", title: "Two inside, one outside",
          setup: { surface: { shape: "cube", size: 2 }, q: { items: [point("a", 3, [0.5, 0, 0.3]), point("b", -1, [-0.4, 0, -0.5]), point("c", 5, [1.6, 0, 0])] } },
          problem: "A closed cube of side 2 m contains a +3 µC and a −1 µC charge; a +5 µC charge sits outside it. Find the net outward flux.",
          lines: [
            { text: "Inside: +3 µC and −1 µC. The +5 µC charge is outside the cube, so it contributes zero net flux.", focus: ["q", "surface"] },
            { text: "Q_enc = 3 − 1, so Ψ = 2 µC.", latex: R`\Psi=Q_{\mathrm{enc}}=3+(-1)`, focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }] },
          ],
          trap: "Adding all three charges. The one outside changes the flux through each face, never the total.",
        },
        {
          id: "shrink", level: "tutorial", title: "Shrink the sphere past the charge",
          setup: { surface: { shape: "sphere", size: 0.6 }, q: { items: [point("q1", 2, [0.3, 0, 0])] } },
          problem: "A +2 µC charge sits 0.3 m from the centre of a sphere of radius 0.6 m. Find the flux; then shrink the sphere to radius 0.25 m and find it again.",
          lines: [
            { text: "Radius 0.6 m: the charge is inside, so Ψ = 2 µC.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }] },
            { text: "Radius 0.25 m: the charge now sits outside the sphere, so Ψ = 0.", patch: { surface: { size: 0.25 } }, focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 0, unit: "µC" }] },
          ],
          trap: "Scaling the flux with the radius. It jumps from the full charge to zero the moment the charge leaves; in between it never changes.",
        },
        {
          id: "state-verify", level: "exam", title: "State it, then verify it",
          setup: { surface: { shape: "sphere", size: 1 }, q: { items: [point("q1", 2, [0, 0, 0])] }, field: { probe: 1 } },
          problem: "(Finals 2023-24 Q2(b)(i) style.) State Gauss's law in words and as an equation, then verify it for a +2 µC charge at the centre of a 1 m sphere.",
          lines: [
            { text: "In words: the net outward flux of D through any closed surface equals the free charge enclosed.", focus: ["eq"] },
            { text: "As an equation: ∮ D · dS = Q_enc.", latex: LAW, focus: ["eq"] },
            { text: "Check: on the sphere |D| = 2/(4π × 1²) = 0.1592 µC/m², and the area is 12.57 m².", focus: ["field", "surface"], claims: [{ instance: "field", readout: "probeD", value: 0.159155, unit: "µC/m^2" }, { instance: "surface", readout: "area", value: 12.566, unit: "m^2" }] },
            { text: "D is the same everywhere on the sphere and along every normal, so ∮ D · dS = 0.1592 × 12.57 = 2.00 µC = Q_enc.", focus: ["surface"], claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }] },
          ],
          covers: ["past:f2324-q2b-i"],
          trap: "Writing the law with E and forgetting ε₀. In D form it counts free charge directly.",
        },
      ],
      asks: [
        { id: "bigger", q: "Doesn't a bigger surface catch more flux?", tags: ["FLUX_SCALES_WITH_AREA"], show: ["q", "field", "surface"], patch: { surface: { shape: "sphere", size: 1.8 }, q: { items: [point("q1", 2, [0, 0, 0])] } }, focus: ["surface"], a: "No. Area grows as r², but D from the charge falls as 1/r², so their product stays fixed. Every field line from the charge crosses any closed surface around it exactly once." },
        { id: "outside", q: "Why don't charges outside count?", tags: ["OUTSIDE_CHARGE_CONTRIBUTES"], a: "Their field enters the closed surface somewhere and leaves somewhere else. In the net flux, entering is negative and leaving is positive, and for a charge outside they cancel exactly." },
        { id: "on-surface", q: "What if a charge sits exactly on the surface?", a: "Then it is neither inside nor outside, and the integral is not well defined there. Forma counts half of it (a smooth surface catches half its field), but in exams choose surfaces that avoid this." },
        { id: "shape", q: "Does the shape of the surface matter?", a: "Not for the total. Shape changes how the flux is shared between patches, and so decides whether you can work the integral out easily, but never ∮ D · dS itself." },
        { id: "dielectric", q: "Does a material inside change the answer?", tags: ["D_VS_E_PERMITTIVITY"], a: "No. Gauss's law in D counts free charge only, so a material inside changes E but not the flux of D. Written with E, you would need the material's bound charge too." },
        { id: "no-charge", q: "If no charge is inside, is the field zero on the surface?", a: "Not necessarily. A charge outside puts field on the surface; only the net flux is zero, not the field." },
        { id: "coulomb", q: "Is Gauss's law separate from Coulomb's law?", a: "For static charges they are equivalent: Coulomb's 1/r² field is exactly what makes the flux independent of the radius. Gauss's form is the one that carries over into Maxwell's equations." },
      ],
      checks: [
        {
          id: "predict-grow", title: "Check: grow the sphere", show: ["q", "field", "surface", "eq"], patch: { surface: { shape: "sphere", size: 1 }, q: { items: [point("q1", 2, [0, 0, 0])] }, field: { probe: 1 } },
          note: "Five checks on Gauss's law. Get each right to move on (a prediction counts as soon as you commit it).",
          interaction: { id: "predict-grow", type: "predict-drag", prompt: "The sphere grows from 1 m to 1.8 m around the +2 µC charge. Drag Ψ to your prediction.", target: { instance: "surface", readout: "flux" }, range: [0, 10], unit: "µC", relTol: 0.05, reveal: { surface: { size: 1.8 } }, dimension: "conceptual", tag: "FLUX_SCALES_WITH_AREA",
            feedback: { close: "Right: still 2 µC.", far: "Still 2 µC: area ×3.24, D ÷3.24." } },
        },
        {
          id: "drag-out", title: "Check: an outside charge", patch: { q: { items: [point("q1", 2, [0, 0, 0]), point("q2", 3, [0.5, 0, 0.3], true)] } },
          note: "Drag the +3 µC charge out of the sphere and watch what is left.",
          interaction: { id: "drag-out", type: "manipulate-goal", goal: "Drag the +3 µC charge out of the sphere (or focus it and use the arrow keys). The net flux should fall to the 2 µC still inside.", check: "outside-zero", dimension: "conceptual" },
        },
        {
          id: "near-face", title: "Check: close to a face",
          note: "A charge near, but outside.",
          interaction: { id: "near-face", type: "choose", prompt: "A cube encloses +4 µC. A +10 µC charge sits just outside one face. The net outward flux is…", dimension: "conceptual",
            options: [
              choice("four", "4 µC", true, "Yes: only the enclosed charge counts, however close the outside charge is."),
              choice("fourteen", "14 µC", false, "The +10 µC charge is outside: its field enters and leaves.", "OUTSIDE_CHARGE_CONTRIBUTES"),
              choice("more", "A bit more than 4 µC, because it is so close", false, "Closeness changes the flux through the near face, and the far faces make up for it exactly.", "OUTSIDE_CHARGE_CONTRIBUTES"),
            ] },
        },
        {
          id: "q09a", title: "Check: tutorial Q.09(a)",
          note: "A tutorial problem with your own numbers.",
          interaction: { id: "q09a", type: "numeric", prompt: q09a.prompt, answer: q09a.spec.answer, distractors: q09a.spec.distractors, relTol: q09a.spec.relTol, hints: q09a.hints, template: "q09a-cube", dimension: "computational" },
          covers: ["tutorial:q09a"],
        },
        {
          id: "statement", title: "Check: the statement",
          note: "And the words themselves.",
          interaction: { id: "statement", type: "choose", prompt: "Which statement is Gauss's law?", dimension: "recognition",
            options: [
              choice("law", "The net outward flux of D through any closed surface equals the free charge enclosed", true, "Exactly."),
              choice("near", "The flux through any surface equals the charge near it", false, "Only closed surfaces, and only charge inside, not 'near'."),
              choice("const", "D is the same everywhere on a closed surface", false, "That is true only with symmetry, and it is not the law.", "GAUSS_WITHOUT_SYMMETRY"),
            ] },
          covers: ["past:f2324-q2b-i"],
        },
      ],
      recap: {
        points: [
          "∮S D · dS = Q_enc: the net outward flux equals the enclosed free charge.",
          "The size and shape of the closed surface don't matter; only what is inside.",
          "Charges outside contribute zero net flux.",
          "It is always true; it is easy to use only with symmetry (next idea).",
        ],
        traps: ["Thinking a bigger surface catches more flux.", "Counting charges outside.", "Assuming D is constant on any surface."],
      },
    },
  ],
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 4 in depth: Gauss's law (any size, any shape, outside charges cancel)"
```

---

### Task 5: Idea ⑤: Using it: symmetry

**Files:**
- Create: `app/packages/course-em1/src/plates/idea-symmetry.ts`
- Modify: `app/packages/course-em1/src/plates/index.ts`

- [ ] **Step 1: Register it** (`ideaSymmetry` from `./idea-symmetry`), then run `pnpm vitest run packages/course-em1`. Expected: FAIL.

- [ ] **Step 2: Write `idea-symmetry.ts`**

```ts
import { instantiate } from "@forma/engine";
import { defineIdeaPlate } from "@forma/plate";
import { templates } from "../templates";

const R = String.raw;
const choice = (id: string, label: string, correct: boolean, feedback: string, tag?: string) => ({ id, label, correct, feedback, ...(tag ? { tag } : {}) });
const point = (id: string, q: number, pos: [number, number, number]) => ({ id, kind: "point" as const, q, pos });
const tpl = (id: string) => instantiate(templates.find((t) => t.id === id)!, 1);
const q06 = tpl("q06-octant");
const q08 = tpl("q08-q");
const f2425 = tpl("f2425-qt");
const numeric = (id: string, v: ReturnType<typeof tpl>, template: string, covers: string, note: string) => ({
  id, title: `Check: ${note}`, note: `${note[0]!.toUpperCase()}${note.slice(1)}, with your own numbers.`, covers: [covers],
  interaction: { id, type: "numeric", prompt: v.prompt, answer: v.spec.answer, distractors: v.spec.distractors, relTol: v.spec.relTol, hints: v.hints, template, dimension: "computational" },
});

// Finals 2024-25 Q2(a): D = 5.0 r² nC/m² on a sphere of radius 10 m (too big to draw: stated as givens).
const R_F = 10;
const D_F = 5 * R_F * R_F; // nC/m²
const A_F = 4 * Math.PI * R_F * R_F; // m²
const Q_F = D_F * A_F; // nC

export const ideaSymmetry = defineIdeaPlate({
  id: "idea-symmetry",
  title: "Using Gauss's law: symmetry",
  requires: { objectives: [3], items: ["tutorial:q06", "tutorial:q08", "past:f2425-q2a"], misconceptions: ["GAUSS_WITHOUT_SYMMETRY"] },
  instances: [
    { id: "q", component: "charges", params: { items: [point("q1", 2, [0.4, 0, 0.2])] } },
    { id: "field", component: "field-arrows", params: { grid: 5, probe: 1 }, links: { charges: "q" } },
    { id: "surface", component: "gaussian-surface", params: { shape: "blob", size: 1.1, shading: true }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: R`\oint_S\mathbf D\cdot d\mathbf S=Q_{\mathrm{enc}}`, speech: "the closed surface integral of D dot d S equals the charge enclosed", shortSpeech: "Gauss's law" } },
  ],
  ideas: [
    {
      id: "symmetry",
      title: "Using Gauss's law: symmetry",
      objectives: [3],
      explain: [
        {
          id: "hard", title: "True, but hard to use", show: ["q", "field", "surface", "eq"], focus: ["surface"],
          note: "Gauss's law is always true: this lumpy surface around an off-centre +2 µC charge still has 2 µC of net flux. But to find D from it you would need D on every patch, and here D changes in size and direction all over the surface. There is nothing you can pull out of the integral. To use the law to find D, you need symmetry.",
          claims: [{ instance: "surface", readout: "flux", value: 2, unit: "µC" }],
        },
        {
          id: "point", title: "A point charge: a sphere", patch: { q: { items: [point("q1", 2, [0, 0, 0])] }, surface: { shape: "sphere", size: 1 }, eq: { latex: R`D\cdot4\pi r^2=Q\ \Rightarrow\ D=\frac{Q}{4\pi r^2}`, speech: "D times four pi r squared equals Q, so D equals Q over four pi r squared", shortSpeech: "D from a point charge" } },
          focus: ["surface", "eq"],
          note: "Centre a sphere on the charge. Every patch is now the same distance away, so |D| is the same everywhere on it, and D points straight out along every normal. The integral collapses: ∮ D · dS = D × 4πr². Set it equal to Q: D = Q/(4πr²) = 2/(4π × 1²) = 0.1592 µC/m², exactly the probe's reading 1 m out.",
          claims: [{ instance: "field", readout: "probeD", value: 0.159155, unit: "µC/m^2" }],
        },
        {
          id: "line", title: "A line charge: a cylinder", patch: { q: { items: [{ id: "l", kind: "line", rhoL: 2000, x: 0, y: 0 }] }, surface: { shape: "cylinder", size: 1, height: 1.4 }, eq: { latex: R`D\cdot2\pi\rho h=\rho_L h\ \Rightarrow\ D=\frac{\rho_L}{2\pi\rho}`, speech: "D times two pi rho h equals rho L h, so D equals rho L over two pi rho", shortSpeech: "D from a line charge" } },
          focus: ["surface", "eq"],
          note: "For a long straight line charge the symmetry is cylindrical: D points straight out from the line and has one size at each distance ρ. Use a coaxial cylinder of radius ρ and length h. The flat end caps get no flux, because D runs along them; the curved side gets D × 2πρh. It encloses ρL h, so D = ρL/(2πρ). With ρL = 2000 nC/m, 1 m from the line: D = 0.3183 µC/m².",
          claims: [{ instance: "field", readout: "probeD", value: 0.31831, unit: "µC/m^2" }],
        },
        {
          id: "sheet", title: "A sheet: a pillbox", patch: { q: { items: [{ id: "s", kind: "sheet", rhoS: 3, z0: -0.3 }] }, surface: { shape: "cylinder", size: 0.5, height: 1, center: [0, 0, -0.3] }, eq: { latex: R`2DA=\rho_S A\ \Rightarrow\ D=\frac{\rho_S}{2}`, speech: "two D A equals rho S A, so D equals rho S over two", shortSpeech: "D from a sheet" } },
          focus: ["surface", "eq"],
          note: "For a large flat sheet, D points straight away from it on both sides and does not weaken with distance. Use a pillbox straddling the sheet: its curved side gets no flux, and each end cap of area A gets D · A. It encloses ρS A, so 2DA = ρS A and D = ρS/2. With ρS = 3 µC/m², D = 1.5 µC/m² at any height. The pillbox's net flux is 2.356 µC.",
          claims: [{ instance: "field", readout: "probeD", value: 1.5, unit: "µC/m^2" }, { instance: "surface", readout: "flux", value: 2.35619, unit: "µC" }],
        },
        {
          id: "recipe", title: "The recipe", patch: { eq: { latex: R`D\times(\text{area that counts})=Q_{\mathrm{enc}}`, speech: "D times the area that counts equals the charge enclosed", shortSpeech: "the Gauss recipe" } }, focus: ["eq"],
          note: "The recipe: (1) spot the symmetry: a point, a line or a plane; (2) choose a closed surface on which |D| is constant wherever D crosses it, with D · dS = 0 everywhere else; (3) write ∮ D · dS as D times the area that counts; (4) set it equal to Q_enc and solve for D. If no surface like that exists, the law is still true, but you cannot use it to find D.",
        },
      ],
      examples: [
        {
          id: "point", level: "basic", title: "D from Q: a point charge",
          setup: { q: { items: [point("q1", 5, [0, 0, 0])] }, surface: { shape: "sphere", size: 1.5, center: [0, 0, 0] }, field: { probe: 1.5 } },
          problem: "Use Gauss's law to find |D| 1.5 m from a +5 µC point charge.",
          lines: [
            { text: "Symmetry: spherical. Choose a sphere of radius 1.5 m centred on the charge.", focus: ["surface"] },
            { text: "On it |D| is constant and along every normal, so ∮ D · dS = D × 4π(1.5)² = D × 28.27 m².", focus: ["surface"], claims: [{ instance: "surface", readout: "area", value: 28.2743, unit: "m^2" }] },
            { text: "Set that equal to 5 µC: D = 5/28.27 = 0.1768 µC/m².", latex: R`D=\frac{5}{28.27}=0.1768\ \mu\mathrm C/\mathrm m^2`, focus: ["field"], claims: [{ instance: "field", readout: "probeD", value: 0.176839, unit: "µC/m^2" }] },
          ],
          trap: "Using the surface area of a sphere of radius 1 m. The Gaussian sphere goes through the point where you want D.",
        },
        {
          id: "line", level: "tutorial", title: "D from a line charge",
          setup: { q: { items: [{ id: "l", kind: "line", rhoL: 3000, x: 0, y: 0 }] }, surface: { shape: "cylinder", size: 0.5, height: 1.2, center: [0, 0, 0] }, field: { probe: 0.5 } },
          problem: "A long line charge carries ρL = 3000 nC/m. Find |D| at 0.5 m from it.",
          lines: [
            { text: "Symmetry: cylindrical. Choose a coaxial cylinder of radius 0.5 m and length h.", focus: ["surface"] },
            { text: "The end caps carry no flux; the curved side carries D × 2πρh. The cylinder encloses ρL h.", latex: R`D\cdot2\pi\rho h=\rho_L h`, focus: ["surface"] },
            { text: "So D = ρL/(2πρ) = 3000 nC/m ÷ (2π × 0.5) = 0.9549 µC/m².", latex: R`D=\frac{\rho_L}{2\pi\rho}=\frac{3\times10^{-6}}{2\pi(0.5)}`, focus: ["field"], claims: [{ instance: "field", readout: "probeD", value: 0.95493, unit: "µC/m^2" }] },
          ],
          trap: "Using 4πr² as for a point charge. A line has cylindrical symmetry: the area that counts is 2πρh.",
        },
        {
          id: "finals", level: "exam", title: "Finals 2024-25 Q2(a)",
          show: ["eq"], hide: ["q", "field", "surface"],
          setup: { eq: { latex: R`Q_T=\oint_S\mathbf D\cdot d\mathbf S=D(R)\,4\pi R^2`, speech: "Q T equals the closed surface integral of D dot d S, which equals D at R times four pi R squared", shortSpeech: "total charge from D" } },
          problem: "In free space D = 5.0r² a_r nC/m². A sphere of radius 10 m is centred at the origin. (i) Compute Q_T, the total charge inside. (ii) Deduce the total flux leaving the sphere. (The sphere is too big for the plate; its numbers are given.)",
          lines: [
            { text: "D is radial and depends only on r, so it is constant on the sphere and along every normal. On it, D = 5 × 10² = 500 nC/m².", focus: ["eq"], givens: [{ value: D_F, unit: "nC/m^2" }] },
            { text: "The sphere's area is 4π × 10² = 1256.6 m².", focus: ["eq"], givens: [{ value: A_F, unit: "m^2" }] },
            { text: "(i) Q_T = ∮ D · dS = 500 × 1256.6 = 628318 nC, about 628.3 µC.", focus: ["eq"], givens: [{ value: Q_F, unit: "nC" }, { value: Q_F / 1000, unit: "µC" }] },
            { text: "(ii) By Gauss's law, the total flux leaving the sphere equals the charge inside: Ψ = Q_T ≈ 628.3 µC.", focus: ["eq"], givens: [{ value: Q_F / 1000, unit: "µC" }] },
          ],
          covers: ["past:f2425-q2a"],
          trap: "Forgetting nC → µC at the end (÷1000), or using D at r = 1 m instead of at the sphere's radius.",
        },
      ],
      asks: [
        { id: "why-symmetry", q: "Why do I need symmetry at all?", tags: ["GAUSS_WITHOUT_SYMMETRY"], a: "To take D out of the integral. ∮ D · dS becomes 'D times an area' only if |D| is the same on the part of the surface that counts and D is parallel to dS there. Without that, the law is true but the integral hides D." },
        { id: "caps", q: "Why do the cylinder's end caps get no flux?", show: ["q", "surface", "field"], hide: ["eq"], patch: { q: { items: [{ id: "l", kind: "line", rhoL: 2000, x: 0, y: 0 }] }, surface: { shape: "cylinder", size: 1, height: 1.4, center: [0, 0, 0] } }, focus: ["surface"], a: "Around a line charge D points straight out from the line, so on the flat caps it runs along the surface: D · dS = 0 there. All of the flux goes through the curved side." },
        { id: "sheet-distance", q: "Why doesn't a sheet's D fall off with distance?", a: "Field lines from an infinite sheet stay parallel: they have nowhere to spread out. The pillbox shows it: its answer, D = ρS/2, has no distance in it." },
        { id: "centred", q: "Does the cylinder have to be centred on the line?", a: "Yes. Off-centre, the distance to the line changes around the side, so |D| is not constant and D is no longer along dS. The law still holds; you just cannot solve it for D." },
        { id: "cube", q: "Can I use a cube around a point charge?", tags: ["GAUSS_WITHOUT_SYMMETRY"], a: "You can, and ∮ D · dS still equals Q. But on a cube's faces |D| and its angle to dS change from point to point, so you cannot pull D out. Always match the surface to the symmetry." },
        { id: "ball", q: "What if the charge is spread out, like a charged ball?", a: "Same recipe: spherical symmetry, a sphere of radius r. Only Q_enc changes: for r inside the ball, count only the charge within r." },
        { id: "pillbox", q: "Why isn't a pillbox's net flux zero when the sheet runs through it?", a: "Because the part of the sheet inside it is enclosed charge: ρS times the cap area. Field leaves through both caps, so both count positive." },
      ],
      checks: [
        {
          id: "choose-line", title: "Check: which surface?", show: ["q", "field", "surface"], patch: { q: { items: [{ id: "l", kind: "line", rhoL: 2000, x: 0, y: 0 }] }, surface: { shape: "cylinder", size: 1, height: 1.4, center: [0, 0, 0] } },
          note: "Five checks on using Gauss's law. Get each right to move on.",
          interaction: { id: "choose-line", type: "choose", prompt: "To find D around a long straight line charge, choose a Gaussian surface that is…", dimension: "application",
            options: [
              choice("cyl", "A cylinder coaxial with the line", true, "Right: cylindrical symmetry, with D constant on the curved side and zero flux through the caps."),
              choice("sphere", "A sphere centred on a point of the line", false, "On a sphere, the distance to the line varies, so |D| is not constant.", "GAUSS_WITHOUT_SYMMETRY"),
              choice("cube", "A cube around a length of the line", false, "On a cube's faces D changes size and angle; you can't pull it out of the integral.", "GAUSS_WITHOUT_SYMMETRY"),
            ] },
        },
        {
          id: "lumpy", title: "Check: without symmetry", patch: { q: { items: [point("q1", 2, [0.4, 0, 0.2])] }, surface: { shape: "blob", size: 1.1, center: [0, 0, 0] } },
          note: "What the law can and cannot do.",
          interaction: { id: "lumpy", type: "choose", prompt: "A lumpy surface encloses a +2 µC charge off-centre. Which is true?", dimension: "conceptual",
            options: [
              choice("true", "Ψ = 2 µC, but D can't be found from it", true, "Exactly: the law holds, but without symmetry the integral hides D."),
              choice("fails", "Gauss's law doesn't apply to this surface", false, "It applies to every closed surface; it just isn't useful here.", "GAUSS_WITHOUT_SYMMETRY"),
              choice("divide", "D = 2 µC divided by the surface area", false, "That needs |D| constant and along every normal, which a lumpy surface doesn't give.", "GAUSS_WITHOUT_SYMMETRY"),
            ] },
        },
        numeric("q06", q06, "q06-octant", "tutorial:q06", "tutorial Q.06, a symmetric share"),
        numeric("q08", q08, "q08-q", "tutorial:q08", "tutorial Q.08, charge from D"),
        numeric("f2425", f2425, "f2425-qt", "past:f2425-q2a", "Finals 2024-25 Q2(a)"),
      ],
      recap: {
        points: [
          "Gauss's law finds D only with symmetry: |D| constant and D along dS on the part of the surface that counts.",
          "Point charge: a sphere, D = Q/(4πr²).",
          "Line charge: a coaxial cylinder, D = ρL/(2πρ).",
          "Sheet: a pillbox, D = ρS/2 at any distance.",
        ],
        traps: ["Pulling D out of the integral without symmetry.", "Forgetting that a pillbox has two caps.", "Using a cube for a point charge to find D."],
      },
    },
  ],
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS.
- **The Finals example's first step** has only an equation. Its setup patch changes `eq`, which is visible, so it is not a slide. If "possible slide" fires on a later line, add `focus: ["eq"]` (already present).
- **`numeric()` steps** have no plate patch. They carry an interaction, which exempts them from the slide lint.

- [ ] **Step 4: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Idea 5 in depth: using Gauss's law with symmetry (point, line, sheet)"
```

---

### Task 6: The main lesson: five ideas, a quick tour, concept-wide coverage, numbering across blocks

**Files:**
- Modify: `app/packages/course-em1/src/concepts/gauss-law.ts`, `app/apps/web/components/plate/PlatePlayer.tsx`, `app/apps/web/lib/desk.ts`
- Create: `app/packages/course-em1/test/gauss-coverage.test.ts`
- Modify tests: `app/apps/web/test/{desk,course,commands}.test.ts`

**Interfaces:**
- Produces:
  - `main` = blocks `idea-faraday`, `flux-surface`, `idea-closed`, `idea-gauss-law`, `idea-symmetry`
  - new lesson `quick` ("Quick tour") holding blocks `faraday` and `gauss` (the Plan A plates)
  - the standalone `flux-surface` lesson is removed
  - `ideaOffset` in the player
  - `deskContinue` resolves a position in `main` whose block moved to `quick`

- [ ] **Step 1: Write the failing tests**: `app/packages/course-em1/test/gauss-coverage.test.ts`

```ts
import { coverageGaps, type IdeaMeta } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { course, ideaPlates } from "../src";

const G = "em1.electrostatics.gauss-law";
const concept = course.concepts.find((c) => c.id === G)!;
const mainPlates = concept.lessons.find((l) => l.id === "main")!.blocks.flatMap((b) => (b.type === "plate" ? [b.plateId] : []));
const REQUIRES = {
  objectives: [0, 1, 2, 3],
  items: ["tutorial:q06", "tutorial:q08", "tutorial:q09a", "past:f2425-q2a", "past:f2324-q2b-i"],
  misconceptions: concept.misconceptions.map((m) => m.tag),
};
const merged = (ids: string[]): IdeaMeta => ({ plateId: "gauss-law", requires: REQUIRES, ideas: ids.flatMap((id) => ideaPlates[id]!.meta.ideas) });

describe("Gauss's law, concept-wide", () => {
  it("the main lesson is the five ideas, in order", () => {
    expect(mainPlates).toEqual(["idea-faraday", "flux-surface", "idea-closed", "idea-gauss-law", "idea-symmetry"]);
  });
  it("covers every objective, mapped question and misconception", () => {
    expect(coverageGaps(merged(mainPlates))).toEqual([]);
  });
  it("names the gap when an idea is missing", () => {
    expect(coverageGaps(merged(mainPlates.filter((p) => p !== "idea-symmetry")))).toContain("objective 3: no idea teaches it");
  });
  it("keeps the short tour for review", () => {
    expect(concept.lessons.find((l) => l.id === "quick")!.blocks.map((b) => b.id)).toEqual(["faraday", "gauss"]);
  });
});
```

In `apps/web/test/desk.test.ts`, change the "resumes the exact plate step" case to use `lessonId: "quick"` with the expected href `…lesson=quick&block=gauss&step=3`. Add:

```ts
  it("a saved position in main whose block moved to the quick tour still resolves", () => {
    const c = deskContinue(at({ conceptId: G, lessonId: "main", blockId: "gauss", branchStack: [], plateStep: 2 }));
    expect(c.href).toBe(`/c/em1/${G}?mode=learn&lesson=quick&block=gauss&step=2`);
  });
```

In `apps/web/test/course.test.ts`, change `expect(lessonForPlate(G, "gauss")).toBe("main");` to `.toBe("quick")`.
In `apps/web/test/commands.test.ts`, change the ask href's `lesson: "flux-surface"` to `lesson: "main"`.
In `apps/web/test/workspace.test.ts`, change `parse("lesson=flux-surface&ask=why-cos")` to `parse("lesson=main&ask=why-cos")`. The removed lesson would otherwise silently fall back to `main` and the test would still pass for the wrong reason.
Then grep for any other stale reference: `grep -rn '"flux-surface"' apps/web/test apps/web/lib apps/web/components`. Plate-id uses stay; lesson-id uses become `main`.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run packages/course-em1/test/gauss-coverage.test.ts apps/web`
Expected: FAIL (the main lesson still holds `faraday` and `gauss`; there is no quick lesson).

- [ ] **Step 3: Restructure the lessons**: in `concepts/gauss-law.ts`, replace the `main` lesson and the standalone `flux-surface` lesson with:

```ts
    {
      id: "main",
      title: "Electric flux → Gauss's law (in depth)",
      minutes: 90,
      blocks: [
        { ...meta("vivid", src(SLIDES, "pp. 29-30")), id: "idea-faraday", type: "plate", plateId: "idea-faraday" },
        { ...meta("vivid", src(SLIDES, "pp. 31-36")), id: "flux-surface", type: "plate", plateId: "flux-surface" },
        { ...meta("vivid", src(SLIDES, "pp. 36-37")), id: "idea-closed", type: "plate", plateId: "idea-closed" },
        { ...meta("vivid", src(SLIDES, "pp. 37-38")), id: "idea-gauss-law", type: "plate", plateId: "idea-gauss-law" },
        { ...meta("vivid", src(WENT, "§2.7, p. 47")), id: "idea-symmetry", type: "plate", plateId: "idea-symmetry" },
      ],
    },
    {
      id: "quick",
      title: "Quick tour (6 steps, for review)",
      minutes: 10,
      blocks: [
        { ...meta("vivid", src(SLIDES, "pp. 29-30")), id: "faraday", type: "plate", plateId: "faraday" },
        { ...meta("vivid", src(SLIDES, "pp. 31-38")), id: "gauss", type: "plate", plateId: "gauss" },
      ],
    },
```

- [ ] **Step 4: Old positions resolve**: in `apps/web/lib/desk.ts`, before `const block = lesson.blocks.find(…)`, resolve a moved block:

```ts
    // A position saved before a block moved lessons (e.g. main → quick) follows the block.
    const home = lesson.blocks.some((b) => b.id === pos.blockId) ? lesson : concept.lessons.find((l) => l.blocks.some((b) => b.id === pos.blockId)) ?? lesson;
```

Then use `home` wherever that branch uses `lesson`: the block lookup, `isPlateLesson`, and `lesson: home.id` in the href.

- [ ] **Step 5: Idea numbering across blocks**: in `PlatePlayer.tsx`, `PlatePlayer`:

```tsx
  const ideaOffset = blocks.slice(0, bi).reduce((n, b) => n + (ideaMetaFor(b.plateId)?.ideas.length ?? 0), 0);
```

Pass `ideaOffset={ideaOffset}` to `PlateRun` (add `ideaOffset: number` to its props). Inside `PlateRun`, use `stepLocation(meta, index, ideaOffset + 1)` and `timelineMarks(meta, ideaOffset + 1)`.

- [ ] **Step 6: Run everything**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all pass. The Plan A `publishChecklist` test still sees plate blocks in the concept. `lintCourse` block-id uniqueness holds: the new ids are `idea-*` and `flux-surface`, and `faraday`/`gauss` moved rather than duplicated.

- [ ] **Step 7: Commit**

```bash
git add -A packages/course-em1 apps/web && git commit -m "feat: Gauss's law main lesson is five in-depth ideas; quick tour kept; concept-wide coverage; idea numbering across plates"
```

---

### Task 7: Playwright: updated journeys and a main-lesson walk

**Files:**
- Modify: `app/apps/web/e2e/{learn,desk,tools,ideas,a11y,visual}.spec.ts`
- Create: `app/apps/web/e2e/gauss-main.spec.ts`

- [ ] **Step 1: Point the old journeys at the quick tour**

```bash
cd /f/StudyBuddy/app/apps/web
sed -i 's/concept(G, "mode=learn")/concept(G, "mode=learn\&lesson=quick")/; s/lesson=main&block=gauss/lesson=quick\&block=gauss/g; s#/lesson=main\.\*step=2/#/lesson=quick.*step=2/#' e2e/learn.spec.ts e2e/desk.spec.ts e2e/tools.spec.ts
sed -i 's/mode=learn&lesson=flux-surface/mode=learn\&lesson=main\&block=flux-surface/g; s/Idea 1 · Flux through a surface/Idea 2 · Flux through a surface/g' e2e/ideas.spec.ts e2e/a11y.spec.ts
sed -i 's/await open(page, concept(G, "mode=learn"));\n    await margin(page, "One charge, four materials");/&/' e2e/visual.spec.ts
grep -n 'lesson=main\b\|lesson=flux-surface\|Idea 1 · Flux' e2e/*.ts
```

Expected: the final grep prints nothing.
- `visual.spec.ts` opens `mode=learn`. That is now `main`, whose first step is Idea 1's "One charge, four materials", with the same plate and state as before, so the Faraday baseline still applies. If it differs by more than 1%, look at both images and update the baseline only if the new frame is correct (`pnpm e2e --update-snapshots -g "key plate states"`).
- In `ideas.spec.ts`, the recap title "Recap · Flux through a surface" and the revision sheet assertions are unchanged.
- The ⌘K question test now lands on `lesson=main&ask=negative`.

- [ ] **Step 2: A main-lesson walk**: `e2e/gauss-main.spec.ts`

```ts
import { expect, test } from "@playwright/test";
import { concept, G, margin, open } from "./helpers";

const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("the main lesson numbers ideas across its five plates and opens each", async ({ page }) => {
  await open(page, concept(G, "mode=learn"));
  await margin(page, "One charge, four materials");
  await expect(kicker(page)).toHaveText("Idea 1 · Faraday's spheres: why flux exists · Explanation 1 of 4");
  for (const [block, title, label] of [
    ["flux-surface", "A steady stream of D", "Idea 2 · Flux through a surface · Explanation 1 of 7"],
    ["idea-closed", "A closed surface", "Idea 3 · Closed surfaces and the outward normal · Explanation 1 of 6"],
    ["idea-gauss-law", "The law", "Idea 4 · Gauss's law · Explanation 1 of 6"],
    ["idea-symmetry", "True, but hard to use", "Idea 5 · Using Gauss's law: symmetry · Explanation 1 of 5"],
  ] as const) {
    await open(page, concept(G, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("symmetry: the line-charge step shows the exact D", async ({ page }) => {
  await open(page, concept(G, "mode=learn&lesson=main&block=idea-symmetry&step=2"));
  await margin(page, "A line charge: a cylinder");
  await expect(page.locator(".readouts")).toContainText("0.3183");
});
```

(The `step=2` deep link works because explanations have no interactions, so nothing locks before them.)

- [ ] **Step 3: Run the whole e2e suite**

Run: `pnpm e2e`
Expected: all pass. The a11y spec's `SCREENS` list now includes `concept(G, "mode=learn&lesson=main&block=flux-surface")`; add `concept(G, "mode=learn&lesson=main&block=idea-symmetry")` too.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web && git commit -m "test(e2e): quick-tour journeys, main-lesson walk across five ideas, axe on the new ideas"
```

---

### Task 8: Verification and handoff

- [ ] **Step 1:** `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`. All green.
- [ ] **Step 2:** In the built-in browser at 1360×900, open each idea's first explanation and one worked example. Read the text against the plate. Fix anything unclear or visibly wrong and record it in the commit.
- [ ] **Step 3:** Regenerate `packages/course-em1/PUBLISH_REPORT.md` via `pnpm test`, and commit it with `git commit -m "docs: publish report after Gauss full depth"`.

---

## Self-Review Notes

- **Spec coverage (amendment §4.3, Plan E):**
  - All five ideas at depth, with worked examples covering tutorial Q.06, Q.08, Q.09 and Finals 2024-25 Q2(a), plus Q2(b)(i).
  - Asks cover the small questions.
  - Checks and recap cards are in every idea.
  - Every number is verified: claims, the unit-aware lint, and givens computed in code for values too large to draw.
  - Coverage matrix: per plate (existing test) and concept-wide (Task 6).
- **Type consistency:**
  - `defineIdeaPlate`, `stepLocation(meta, index, first)` and `timelineMarks(meta, first)` come from Task 1 and are used in Task 6.
  - Readout names used in claims (`outerQ`, `dMid`, `eMid`, `flux`, `area`, `probeD`) all exist after Task 1.
  - Template ids `q06-octant`, `q08-q`, `q09a-cube` and `f2425-qt` exist.
- **Known ceilings:**
  - The Finals example is not drawn to scale; its numbers are givens computed from the question.
  - The per-face share in Idea ③ is a given (4/6), exact by symmetry, because the plate has no per-face readout.
