# Forma: EMag Wave 6a (Electrostatics at Depth), Assessment Awareness, and the Plan-for-Codex Model

Date: 2026-09-26. Status: draft for review.
Builds on:
- `2026-09-25-forma-identity-shell-plate-engine-design.md` (the base)
- `2026-09-25-forma-teaching-depth-desk-tools-design.md` (the teaching model and the idea template)

## 0. What the user asked for

- Build the rest of EMag (UTech ELE3001) with the Gauss's-law depth template, working through the course in order: 6a electrostatics, 6b magnetostatics, 6c dynamic fields and waves.
- Scale ideas by exam weight, keeping the depth floor for every idea.
- Pay attention to the mid-semester tests (ICT 01, ICT 02), not only finals.
- From now on **Claude plans and Codex implements**. Plans must be clean enough for Codex to execute without this conversation.
- Claude leads the product roadmap for voice mode, hands-free mode, and stylus notes that can compete with Apple's whiteboard (Freeform).

This spec covers wave 6a, assessment awareness, and the planning and handoff model. Voice mode, hands-free mode and stylus notes each get their own spec later; §6 sets their order and boundaries.

## 1. Operating model: Claude plans, Codex implements

- **One plan per shippable slice.** Each plan follows the existing `docs/superpowers/plans` format: exact file paths, exact code, and exact content (every explanation, worked example, ask, check and recap written out), failing test first, an `Expected:` line for every command, and a commit per task.
- **Codex must not author teaching content or physics.** It transcribes and implements. When a lint or claim fails, it follows the plan's rule: fix the text and the claim together, never add a given for a value the plate could show, and log a `Ruling:` line.
- **`AGENTS.md` at the repo root** (written in Plan F, Task 1) is Codex's standing brief:
  - commands (`pnpm test`, `pnpm typecheck`, web `tsc`, `pnpm build`, `pnpm e2e`);
  - the content lints and what each means;
  - the ledger and ruling format;
  - banned moves: no `--no-verify`, no editing tests to pass, no `force` pushes, no invented numbers;
  - the brand rules (palette tokens, type, voice);
  - the definition of done.
- **Ledger.** Each plan names `.superpowers/sdd/<plan>/progress.md`. Codex appends `Task N: complete (commits a..b, tests: … → …)` and `Ruling:` lines. The ledger is the handback to Claude.
- **Review gate.** When Codex finishes a plan, Claude runs the final whole-branch review against the plan's Review Focus, sorts findings, and writes a short fix plan if needed. Codex then fixes. Nothing merges without that review.

## 2. Assessment awareness

### 2.1 Data

Add `assessments` to the `Course` schema. `examDate` stays as the finals date for back-compatibility.

```ts
assessments: { id: string; title: string; date: string /* ISO */; scope: { concepts: string[] }; weight: number /* % of module */ }[]
```

The EMag values come from the 2026-27 module outline:

| id | Title | Date | Scope | Weight |
|---|---|---|---|---|
| `ict1` | In-Course Test 1 | 2026-10-12 | All Unit 2 concepts, plus Unit 3 Ampère's law, Biot-Savart and Stokes' theorem (locked until 6b ships) | 15 |
| `ict2` | In-Course Test 2 | 2026-11-16 | Unit 3 and Unit 4 concepts | 15 |
| `finals` | Final exam | `course.examDate` | Units 1–5 | 60 |

The outline says semester tests are worth 30% in total. Splitting that 15/15 is an assumption; the outline doesn't state it.

### 2.2 Behaviour

- **Next assessment.** A pure `nextAssessment(course, now)` returns the first assessment whose date is today or later.
- **Desk countdown.** It shows the next assessment ("ICT 1 in 16 days") and not always finals. Revise shows the same.
- **Scheduler.** `nextReview` receives the date of the next assessment whose scope contains the concept, so reviews compress toward ICT 1 for Unit 2 concepts and toward finals for the rest.
- **Revise mode.** A scope switcher offers "ICT 1 / ICT 2 / Finals" and filters revision sheets, due reviews and practice to that assessment's concepts.
- **Readiness.** One line per assessment on the Desk: the share of in-scope concepts whose checks are all passed, plus the count of due reviews. No fake predicted score.
- **Missing papers.** No ICT papers exist in `Resources/`. ICT practice draws on past-paper and tutorial items on in-scope topics. The Library lists "Add your ICT papers" as a known gap, but no upload feature is built now.

## 3. Wave 6a content map

Ideas are scaled by exam weight (Finals 2024-25 marks shown). Every idea keeps the floor:
- ≥ 3 explanations (≤ 180 words each);
- 3 worked examples at the basic, tutorial and exam levels;
- ≥ 6 asks (≤ 80 words each);
- ≥ 4 checks;
- a recap.

The rules from the Plan E global constraints carry over: every number backed by the plate, and all flagged items linted.

| Concept id | Title | Ideas | Weight evidence | Mapped items |
|---|---|---|---|---|
| `em1.math.vectors` (rebuild) | Vectors and coordinate systems | 3: components and unit vectors; distance vectors and magnitudes; cylindrical and spherical coordinates with conversion | Every vector question depends on it | Tutorial Review of Vectors 01–03 |
| `em1.math.vector-calculus` (new) | Gradient, divergence, curl | 3: gradient; divergence; curl (preview for Ampère), in all three coordinate systems using the formula sheet | Q1(c), Q4(a)iv | Formula sheet |
| `em1.electrostatics.coulomb` (rebuild) | Coulomb's law | 3: vector form; superposition; units and scale (nm, µC) | Q1(b), 11 marks | f2425 Q1(b) |
| `em1.electrostatics.field` (rebuild) | Electric field E | 3: E = F/q; superposition of point charges; continuous ρL, ρS, ρv (line and sheet results) | Every paper | f2425 Q1(b)ii |
| `em1.electrostatics.gauss-law` | Gauss's law | 5 (done in Plan E) | Q2(a) | done |
| `em1.electrostatics.gauss-applications` (rebuild) | Gauss applications | 3: volume charge (uniform ball, inside and outside); nonuniform densities; Q from a given D | Q2(a), 8 marks | tutorial q06, q08 |
| `em1.electrostatics.divergence` (rebuild) | Point form and the divergence theorem | 2: ∇·D = ρv; divergence theorem as the bridge to Gauss's law | Revision guide | Q2 variants |
| `em1.electrostatics.current` (new) | Current density, continuity, Ohm's law | 2: J, I = ∫J·dS and J = σE; continuity ∇·J = −∂ρv/∂t | Q4(b), 5 marks | f2425 Q4(b) |
| `em1.electrostatics.potential` (unlock) | Potential and energy | 4: V as work per charge; V of point charges and superposition; E = −∇V then D = εE; potential energy of point charges | Q1(c), 10 marks | f2425 Q1(c) |
| `em1.electrostatics.dielectrics` (unlock) | Dielectrics and boundary conditions | 5: polarization and εr; tangential E continuous; normal D (free surface charge); refraction angle (tan θ1/tan θ2 = εr1/εr2); conductor boundaries | Q2(b), 17 marks, the heaviest | f2425 Q2(b) |
| `em1.electrostatics.capacitance` (unlock) | Capacitance | 2: C = Q/V for parallel plates; coaxial and spherical with dielectrics | Case study, week 5 | — |

`em1.electrostatics.flux-density` is retired. Its content lives in Gauss Idea 1 and dielectrics Idea 1. Its route redirects to Gauss's law and its prerequisites move to Gauss's law.

Total: 30 new ideas, about 400 steps. Each rebuilt concept keeps a "Quick tour" lesson holding its old blocks, as Gauss's law does.

## 4. Plate engine additions

The plate engine gets new components, each with `validate`, readouts in declared units, and quotable model values:
- **Plan F:**
  - `coord-frame`: a 3D triad showing cartesian, cylindrical or spherical unit vectors at a point, with a draggable point.
  - `vector3`: a labelled arrow between two points, with its component readout and magnitude.
- **Plan G:**
  - `charges` gains `ring` and `disk` items, for the on-axis field.
  - `field-arrows` gains ρv balls (`kind: "ball"`, uniform ρv, radius a) and exact E inside and outside.
  - `force-pair`: F12 and F21 between two point charges, with a vector readout.
- **Plan H:**
  - `potential-map`: equipotential contours of the current charges, plus a probe V readout.
  - `gradient-arrows`: −∇V from a symbolic V(x,y,z) evaluated with compute-engine.
  - `current-tube`: J through a surface, with I readout.
- **Plan I:**
  - `boundary`: two regions with εr1 and εr2, a boundary plane (general `ax + by + cz = d`), D1 and E1 given as vectors, and the plate computing D2, E2, the normal and tangential parts, and θ1 and θ2. It is exact, and the magnetic twin in 6b reuses it with μ.
  - `capacitor`: parallel plates, coax or spherical, with C, Q and V readouts.

Physics lives in `@forma/physics` with unit tests against textbook values before any plate uses it.

## 5. Plans and order

Course order (the user's choice) also gives the most ICT 1 coverage by 12 Oct:

| Plan | Covers | Approx. ideas |
|---|---|---|
| F | `AGENTS.md`, assessments (§2), math foundation (vectors, vector calculus) | 6 |
| G | Coulomb, E field, Gauss applications, point form | 11 |
| H | Current and continuity, potential and energy | 6 |
| I | Dielectrics and boundaries, capacitance; retire flux-density | 7 |

If ICT 1 comes close before Plan I is done, I moves ahead of H: boundary conditions carry more marks.

## 6. Roadmap after 6a (each gets its own spec)

1. **6b magnetostatics, before ICT 2 (16 Nov):**
   - H, B and flux; permeability; Ampère's law, including inside a conductor and the coax; Biot-Savart (examined in 24-25 even though the guide strikes it); magnetization and susceptibility; magnetic boundaries (the `boundary` twin); inductance.
2. **6c dynamic fields and waves, before finals:**
   - Faraday's law via Stokes; displacement current; Maxwell's equations in both forms; conduction versus displacement current; TEM waves in dielectrics and conductors; Poynting's theorem as a short idea (it was examined in 24-25).
3. **Voice mode (sub-project 7, narration).**
   - Voices every explain step, worked-example line and ask through the existing narration slots and cue track.
   - Offline-first TTS choice: Kokoro-82M, with Chatterbox as the alternative.
   - A review workflow; captions; speed 0.75–2×.
4. **Hands-free mode (new sub-project 8).**
   - Narration plus automatic advance, and spoken commands ("next", "repeat", "why?", "show me").
   - Spoken answers for `choose` and numeric checks, with a confirm-back before committing.
   - The Web Speech API first, then on-device Whisper. Built after voice mode, which it depends on.
5. **Forma Ink (new sub-project 9): stylus notes built to rival Apple Freeform and Notes.**
   - An ink engine we own, built on `perfect-freehand` with pressure and tilt, low-latency predicted strokes, and palm rejection (pointerType pen).
   - An infinite canvas with pages; lasso select, move and scale; a shape snap; a ruler.
   - Equations written by hand convert to LaTeX (MathLive for editing).
   - Drop a live plate snapshot onto the canvas.
   - Strokes are stored as vectors in IndexedDB and exported to PDF.
   - This replaces the current `WorkingPaper`.
6. **Accounts and sync (sub-project 5)** before any paid launch.
7. **Replacing restricted UTech material.** Before public launch, replace restricted UTech material with original content.

## 7. Success criteria for 6a

- Each concept in §3 passes the per-plate idea tests and a concept-wide coverage test (objectives, mapped items, misconceptions).
- Every Unit 2 concept is playable in Learn with idea numbering across its blocks.
- A student can switch Revise to "ICT 1" and see only in-scope sheets and reviews. The Desk counts down to ICT 1 until 12 Oct, then to ICT 2.
- The `boundary` component reproduces Finals 2024-25 Q2(b) exactly: E2, D2 and θ2 match a hand solution to four significant figures.
- Codex completes each plan with a clean ledger, and Claude's final review finds no Critical issues.

## 8. Out of scope here

- 6b, 6c, voice, hands-free, Ink and accounts. §6 only sets their order.
- Uploading papers.
- Other courses.
