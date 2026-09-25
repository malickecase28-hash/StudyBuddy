# Plans 2–5 — Web shell, 3D lab, EM1 content, journey screens

> Executed inline by the same agent immediately after Plan 1 (owner asked for an uninterrupted build to a working prototype). Tasks list files, behaviour and the verification that gates each commit; code is written during execution against the Plan 1 engine/physics APIs. Visual polish is explicitly out of scope (owner will run separate UI passes) — flow, pedagogy and correctness are in scope.

**Spec:** `docs/superpowers/specs/2026-09-25-em1-vertical-slice-design.md`
**Vision checklist:** `Interactive Study Workspace.md` (psychology/pedagogy rules — see §C below)

## Global Constraints

- Stack: Next.js 16 (App Router), React 19.3, TypeScript 7, Tailwind 4, Zag.js 1.44 (sliders, dialogs, tabs where useful), Motion 13, React Three Fiber 9 + drei 10 + three 0.186, KaTeX 0.18, @xyflow/react 12, Zustand 5 + Dexie 4, Playwright 1.63.
- Zero network calls after load; no LLM anywhere in `apps/web`.
- All colours/spacing/motion via CSS tokens in `apps/web/app/tokens.css`; semantic colour keys `charge | field | flux | surface | confirmed`; wrong answers use amber "Take another look" + ↺, never red.
- Every numeric answer in `course-em1` is re-derived by a test through `@studybuddy/physics` or an analytic formula.
- Notation follows Wentworth + UTech Unit 2b slides (Ψ, D, ρ_L, ρ_S, a_r, ε₀ = 8.854×10⁻¹² F/m).

## A. Sources pinned (for block `source` fields)

| Source | Locator |
|---|---|
| UTech Unit 2b slides (Boswell) | Coulomb p9–15, E p16–21, line/plane p27–28, Faraday/flux p29–32, D p32–34, Gauss p35–38, divergence p39, tutorial Q6–Q9 p58–61 |
| Wentworth (required text) | §2.2 Coulomb p18, §2.3 spherical p22, §2.4 line charge p29, §2.6 flux density p44, §2.7 Gauss p47, §2.8 divergence p54 |
| Finals 2024-25 Sem 1 | Q2(a) D = 5.0r² a_r nC/m², sphere r = 10 m → Q_T = Ψ = 200π µC (8 marks) |
| Finals 2023-24 Sem 1 | Q2(b) state Gauss's law; ρ_v from E(r) |

## B. Course content map (`packages/course-em1`)

Concepts (id → lessons):
1. `em1.math.vectors` — Vectors & dot product (refresher, short).
2. `em1.math.surface-integrals` — Surface elements, normals, flux integrals (**complete refresher**, piece 4).
3. `em1.electrostatics.coulomb` — Coulomb's law (short).
4. `em1.electrostatics.field` — Electric field E, superposition, line charge (short).
5. `em1.electrostatics.flux-density` — Faraday's spheres, Ψ = Q, D = ε₀E (short).
6. `em1.electrostatics.gauss-law` — **main lesson** (flux → Gauss) + 5 remediation lessons: `why-area`, `outside-charge`, `normal-direction`, `d-vs-e`, `symmetry`.
7. `em1.electrostatics.gauss-applications` — worked problems (Q6, Q8, Q9 slide tutorials), mastery challenge, past-paper link.
8. `em1.electrostatics.divergence` — preview (short).
9. Locked "coming soon": potential, dielectrics & boundaries, capacitance, Units 3–5.

Main Gauss lesson rhythm (≈30 min, 8 segments): hook (Faraday's concentric spheres) → build a charge + field in the lab → place a surface, reveal normals → **predict** radius doubling → reveal → equation-build Ψ → ∮ → D·dS → = Q_enc with term↔3D highlighting → branch menu ("Why closed?", "Why only enclosed?", "Where does ε₀ go?", "Show me geometrically", "Let me experiment") → manipulate: drag a charge outside, flux → 0 → mcq + self-explain → numeric (flux of 4 µC through a cube) → checkpoint → reflection.

Misconception tags (spec §4.9): `FLUX_SCALES_WITH_AREA`, `OUTSIDE_CHARGE_CONTRIBUTES`, `SURFACE_NORMAL_DIRECTION`, `D_VS_E_PERMITTIVITY`, `GAUSS_WITHOUT_SYMMETRY`; each has a remediation lesson and a `tagCount ≥ 2` rule.

## C. Psychology/pedagogy checklist (from the vision doc — every lesson is checked against it)

1. Progressive reveal: one new relationship at a time; equation-build before full equation.
2. Prediction before reveal (commit, then show).
3. Self-explanation after key answers ("I chose it because…").
4. Retrieval practice: return experience + spaced reviews + retrieval blocks.
5. Multiple representations: words + equation + 3D + numbers for the same idea, colour-linked.
6. Feedback not judgement: amber ↺ with causal explanation; errors named (conceptual/arithmetic/unit/sign/notation).
7. Rhythm varies modality (observe → manipulate → predict → explain → apply → pause).
8. Respect: "Prove mastery" skip path; no XP/confetti; mastery acknowledgement is brief.
9. Cognitive-environment settings: motion, density, equation detail, sim quality.
10. Recovery: re-entry summary and "continue where you left off".
11. Accessibility: colour never alone (icon + text), keyboard reachable, reduced motion, 2D fallback.
12. Provenance: every block shows its source on demand.

## Plan 2 — Web shell

- **T2.1 Scaffold** `apps/web` (Next 16, Tailwind 4, tokens.css with Paper & Ink / Night / High-contrast themes). Verify: `pnpm --filter web build` succeeds.
- **T2.2 Store** `lib/store.ts`: Zustand store over engine `LearnerState`, Dexie persistence (debounced), `migrate()` on load with reset notice, dev clock offset (`now()`), `dispatch(event)` → engine `reduce` → effects queue. Verify: Vitest test of store dispatch + persistence round-trip (fake-indexeddb).
- **T2.3 Course loader** `lib/course.ts`: imports `@studybuddy/course-em1`, indexes concepts/lessons, resolves `lessonRef`.
- **T2.4 Shell** `components/shell/*`: TopBar (course, overall mastery, finals countdown, settings), CourseRail (units → concepts with state glyphs), ContextDrawer (Sources · Formula sheet · Notebook tabs), SettingsDialog (zag dialog).
- **T2.5 Block renderers** `components/blocks/*` + registry + error boundary: prose (inline `$…$` KaTeX + `{{term:key|text}}` semantic spans), equation-build, figure, predict, mcq (+self-explain), numeric, step-solve, challenge, order, identify, branch, checkpoint, remediate, retrieval, sim-3d/sim-2d/manipulate (delegate to lab).
- **T2.6 Lesson player** `components/player/LessonPlayer.tsx`: block cursor, gated Continue, branch stack, effect cards (remediation detour with return, skip offer, worked-step reveal), position persistence, lesson completion screen with reflection prompt.

## Plan 3 — 3D Gauss lab

- **T3.1** `components/lab/GaussLab.tsx`: R3F scene — charges (draggable on a plane), field arrows (D direction, magnitude-scaled, quality tiers), Gaussian surface (sphere/cube/blob, resizable), normals toggle, patch contribution colouring (outward = violet, inward = amber), live Ψ and Q_enc readouts from `@studybuddy/physics`.
- **T3.2** Lab config schema (`scene: "gauss-lab"`), `manipulate` check functions (`outside-zero`, `resize-constant`, `enclose-both`), freeze-state → notebook.
- **T3.3** 2D fallback (cross-section canvas + numbers) when WebGL unavailable or `simQuality: "low"` + reduced motion.
- **T3.4** `surface-element` mini scene for the refresher (one patch, n̂, dS, D, angle θ, D·dS = |D||dS|cosθ).

## Plan 4 — EM1 course content

- **T4.1** `packages/course-em1/src/*.ts` — all concepts in §B, sources/licence on every block.
- **T4.2** Diagnostic (6 topics × core + probe = 12 items): vectors/dot product, coordinate systems (spherical), differentiation/integration, surface integral setup, Coulomb, field superposition.
- **T4.3** Tests: `Course.parse`, `lintCourse` → `[]`, and a physics verification test for every numeric/step/challenge answer (Q6 a/b/c, Q8 a/b/c, Q9 a/b/c, cube flux, past-paper Q2a, challenge).
- **T4.4** Formula sheet data + past-paper records (Finals 2024-25 Q2a, 2023-24 Q2b) with concept weights.

## Plan 5 — Journey screens

- **T5.1** Landing `/`: continue card, route, due reviews, finals countdown, first-run → diagnostic.
- **T5.2** Diagnostic `/diagnostic`: adaptive runner, result screen with route.
- **T5.3** Concept map `/map`: xyflow graph, mastery rings, locked nodes explain unlock.
- **T5.4** Past papers `/past-papers`: question, concept breakdown with learner mastery, "practise weakest concept".
- **T5.5** Notebook `/notebook`: entries list, restore sim state into lab.
- **T5.6** Return experience: >2 days since `lastSeen` (dev offset) → welcome-back summary + 2 retrieval questions.
- **T5.7** Dashboard `/dashboard`: concepts × dimensions, weak tags, review queue, exam coverage.
- **T5.8** Playwright journey test (spec §8) + axe smoke.

Each task: build/typecheck/tests green before commit.
