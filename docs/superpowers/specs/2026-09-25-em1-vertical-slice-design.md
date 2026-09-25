# StudyBuddy — Electromagnetics I Vertical Slice: Design Spec

- **Date:** 2026-09-25
- **Status:** Approved in brainstorming, pending written-spec review
- **Source vision:** `Interactive Study Workspace.md` (product conversation)
- **Source material:** `Resources/Electromagnetics/` (harvested from the ELE3001 portal and Dropbox links)

## 1. Product definition

An **authored, deterministic, interactive mastery environment** for difficult university STEM courses. It is a course that behaves like software.

Governing rules (non-negotiable):

1. **AI at compile time, deterministic learning at runtime.** Zero LLM or inference calls while a student uses the app. Nothing essential to learning, practising or assessment may depend on generative AI.
2. **Rich, not cluttered.** The system holds far more than the screen shows. Reveal complexity; never dump it.
3. **Decoration must earn its pixels.** Every animation, 3D view or colour must teach something.
4. **Feedback, not judgement.** Wrong answers get a precise explanation of what went wrong, never punitive red.
5. **Never tell a learner merely that they are wrong when the system knows why.**

### 1.1 Audience and licensing

- **v1 audience:** the owner and UTech ELE3001 classmates (private use).
- **Later:** public and commercial, with sign-in.
- Every content block carries `source` (document + page/slide/question) and `licence: "restricted" | "original"`. `restricted` marks quoted UTech slides, past papers and textbook material. A public build must be able to list and replace every restricted block without touching the engine.

### 1.2 Scope: the vertical slice

It is deep on **Electric Flux → Gauss's Law** (Wentworth Ch. 2 §2.6–2.8; UTech Week 3). Shallower pieces prove the rest of the product. The slice includes all 15 pieces listed in §4.

**Out of scope for v1:**
- accounts and sync
- in-app AI or chat
- mobile layout
- the authoring UI
- Units 3–5 content (shown on the map but locked)
- Pyodide notebook code cells
- sound

## 2. Architecture

A pnpm monorepo in `F:\StudyBuddy\app\`. The `tools/` and `content-src/` paths in §6 are relative to this root.

| Package | Responsibility | Depends on |
|---|---|---|
| `apps/web` | Next.js (App Router) + React + TypeScript workspace UI | engine, physics, course-em1 |
| `packages/engine` | Course grammar (Zod schemas), mastery state machine, adaptivity rules, retrieval scheduler, diagnostic router, answer checking. Pure TS, no DOM. | — |
| `packages/physics` | Numerical models behind sims: point/line/sheet/sphere charge fields, flux through parametric surfaces, surface discretisation. Pure TS. | — |
| `packages/course-em1` | Electromagnetics I content as typed block data plus verification tests. | engine, physics |

**UI stack:**
- Tailwind (token-driven) and Radix primitives for accessibility
- Motion for choreography
- React Three Fiber + drei for 3D
- KaTeX with per-term addressable spans for maths
- React Flow (xyflow) for the concept map
- Zustand for state, persisted to IndexedDB via Dexie

**Runtime:**
- Browser only for v1.
- Next.js deploys as a normal app, so Supabase auth and sync can be added later. Lessons stay static data.

**Testing:**
- Vitest for engine, physics and course verification
- Playwright for journey end-to-end tests, including a CPU-throttled "cheap laptop" profile

### 2.1 Unit boundaries

- `engine` knows nothing about Electromagnetics or React. It interprets blocks and rules against a `LearnerState`.
- `physics` knows nothing about lessons. It is functions only, tested against analytic results.
- `course-em1` is data plus tests. A broken block, answer or branch fails `pnpm test` / build.
- `apps/web` renders blocks through a **block registry**: one renderer component per block type. Each renderer runs inside an error boundary.

## 3. Course grammar (engine)

### 3.1 Objects

`Course → Unit → Concept → Lesson → Block`, plus a **prerequisite graph** of `Concept → Concept` edges, each with a required mastery level.

**Concept fields:**
- `id` (e.g. `em1.electrostatics.gauss-law`), `title`, `unit`
- `objectives[]`
- `prerequisites[{ conceptId, minMastery }]`
- `masteryDimensions`: `conceptual | computational | recognition | independent | application`, each 0–1
- `misconceptions[{ tag, description, remediation: lessonRef }]`
- `examLinks[{ paper, question, marks, weight }]`
- `sources[]`
- `status: draft | verified | ready`

### 3.2 Block types (v1)

| Group | Types |
|---|---|
| Teaching | `prose`, `equation-build`, `figure`, `sim-3d`, `sim-2d` |
| Interaction | `predict`, `manipulate`, `identify`, `order` |
| Assessment | `mcq` (+ optional `self-explain`), `numeric` (tolerance + units), `step-solve` (staged hints, error classes), `challenge` |
| Flow | `branch` (option menu → sub-paths), `checkpoint`, `remediate` (detour + return), `retrieval` |

**Every block carries:**
- `id`
- `mood` (see §5)
- `source`
- `licence`
- `semantic` term bindings (e.g. `D → violet`), where relevant

**Every wrong answer carries** a feedback string and an optional misconception `tag`.

### 3.3 Adaptivity (rules, not AI)

Rules are declared per concept, for example:

- `tag seen ≥ 2 in this concept` → offer the linked refresher, then return to the originating block.
- `challenge passed on first attempt` → mark `independent` and `application`, and offer to skip the remaining scaffolding.
- `3rd failed attempt on step-solve` → reveal a worked step with the misconception explanation.

The rule engine is a pure function: `(LearnerState, Event) → (LearnerState', Effects[])`.

### 3.4 Answer checking

- **Numeric:** relative tolerance, plus unit parsing (µC, nC, C/m², m).
- **Error classes:** `conceptual | arithmetic | unit | sign | notation` (notation = unreadable input), detected where the question defines distinguishing wrong answers (e.g. a factor-of-4π error, a wrong power of r).

### 3.5 Mastery and retention

- Mastery is stored per concept, per dimension.
- The concept state (`NOT_STARTED → INTRODUCED → EXPLORED → PRACTICED → DEMONSTRATED → MASTERED`) is derived from the dimensions.
- **Retrieval scheduler:**
  - Each mastered dimension gets a due date.
  - A successful recall roughly doubles the interval (starting at 1 day).
  - A miss resets the interval to 1 day and lowers the dimension.
  - Items due soon get extra weight when an exam date is close.

### 3.6 LearnerState (persisted)

```
LearnerState {
  version
  diagnostic: { completedAt, results, route }
  concepts: { [id]: { dimensions, state, attempts, tags: {tag: count}, lastSeen, reviewDue } }
  position: { conceptId, lessonId, blockId, branchStack }
  notebook: NotebookEntry[]
  settings: { theme, motion, density, simQuality, equationDetail }
  history: Event[]   // capped; used for return summaries and later analytics
}
```

The whole state is versioned. On load, it runs migrations. If a migration fails, the old state is backed up and reset, and the user sees a notice.

## 4. Screens and journey

**Layout** (desktop-first, one layout throughout):
- **Top bar:** course, overall mastery, finals countdown, settings.
- **Left:** collapsible course rail.
- **Centre:** the **learning canvas**.
- **Right:** context drawer with sources, formula sheet and notebook. Closed by default.
- There is no chat panel.

**Slice concept graph** (notation follows Wentworth and the Unit 2b slides):
- Vectors & dot product → Coordinate systems (spherical, cylindrical) → Surface integrals & normals *(refresher)*
- Coulomb's Law → Electric field **E** → Electric flux density **D** (D = ε₀E)
- Electric flux Ψ → **Gauss's Law** → Applying Gauss's Law (point, line, spherical shell, sheet) → Divergence form (preview)
- Units 3–5 appear on the map as locked "coming soon" nodes.

**The 15 pieces:**

1. **Landing:** course world, current route, "Continue", finals countdown, review items due.
2. **Readiness diagnostic:** about 12 adaptive items covering vectors, dot product, spherical coordinates, integration and Coulomb's Law. A wrong answer triggers a probing sub-question to find the missing prerequisite. Output: a personal route that inserts refreshers.
3. **Concept map:** React Flow graph with mastery rings. Clicking a node opens it. Locked nodes explain what unlocks them.
4. **Refresher: Surface integrals & normals.** A complete short module with its own 3D surface-element visual.
5. **Flux → Gauss lesson:** about 25–35 minutes, segmented with a Hook → Intuition → Visualisation → Formalism → Exploration → Worked example → Prediction → Calculation → Feedback → Application → Challenge → Reflection rhythm. The rhythm varies per segment, not identically each time.
6. **Progressive equation construction:** Ψ, then ∮, then D·dS, then = Q_enc. Each term lights up its corresponding 3D element.
7. **3D field/surface simulation:**
   - place and move charges (inside and outside), change their magnitude
   - Gaussian surface: sphere, cube, or a deformable blob
   - toggle normals, D vectors and patch-wise D·dS contributions
   - live flux integral
   - 2D slice fallback
8. **Prediction interactions:** commit before reveal, e.g. "sphere radius doubles, so flux…".
9. **Misconception branches (5):**
   - `FLUX_SCALES_WITH_AREA`
   - `OUTSIDE_CHARGE_CONTRIBUTES`
   - `SURFACE_NORMAL_DIRECTION`
   - `D_VS_E_PERMITTIVITY`
   - `GAUSS_WITHOUT_SYMMETRY`

   Each has a remediation path and a return point.
10. **Worked problem:** staged spherical-shell or line-charge problem with 3 hint levels and error classes.
11. **Mastery challenge:** minimal scaffolding. Passing it enables "skip ahead".
12. **Past-paper view:** a real finals question from `Resources/…/04_Exam_Practice`, split into the concepts it tests, with the learner's mastery on each.
13. **Notebook:** save equations, notes and **frozen sim states**. Clicking a frozen state restores the simulation exactly.
14. **Return experience:** "Welcome back" summary (last concept, difficulties, next step) plus 2 retrieval questions. A dev toggle simulates N days away.
15. **Mastery dashboard:** concepts × dimensions, weak misconception tags, review queue, exam-link coverage.

**Modes:**
- **Learn** (guided): the default.
- **Explore** (free sim): unlocked after the concept reaches `EXPLORED`.

**Settings:**
- theme: Paper & Ink (default), Night, High-contrast
- motion: standard or reduced
- density: comfortable or compact
- sim quality: high, balanced or low-power
- equation detail: progressive or full

## 5. Cognitive-affective design system

- **Tokens:** every colour, type size, spacing, radius, elevation and motion value is a named CSS variable. Components never hard-code values. Themes only swap token values.
- **Colour meanings** (constant across equations, 3D, 2D and diagrams in every theme):

  | Meaning | Colour family |
  |---|---|
  | charge q, Q_enc | rose |
  | field E | teal |
  | flux density D, flux Ψ | violet |
  | surface S, normal dS | amber |
  | understood / confirmed | green |

- **Never colour alone:** every state also has an icon, shape or text label (WCAG 2.2, colour-vision safe).
- **Feedback states:**
  - *Understood:* green with ✓.
  - *Take another look:* amber with ↺ and a causal explanation.
  - *System error:* red, reserved for real app faults only.
- **Moods per block type:**

  | Block | Mood |
  |---|---|
  | explanation | quiet |
  | simulation | more vivid |
  | challenge | slightly more intense |
  | assessment | distraction-free |
  | mastery | brief, restrained acknowledgement (no XP, streaks or confetti) |

- **Choreographed causality:** when a parameter changes, its effects appear in causal order over 600–900 ms. Reduced motion shows the same information instantly.
- **Typography:** a serif for reading, a sans for the UI, KaTeX for maths. Final choices are made in the UI pass.
- **Known debt:** the v1 visual direction (Paper & Ink) is provisional. The owner judged the first mockups "too AI-generated". A dedicated UI/brand pass follows the slice, and the token architecture is what makes that pass cheap.

## 6. Content pipeline

1. **Extract:** `tools/extract` (Python + pypdf/pymupdf) pulls text and page renders from `Resources/Electromagnetics` into `content-src/extracted/` with a file and page reference per chunk.
2. **Map:** the concept list, prerequisite edges and past-paper → concept tagging go in `content-src/map.yaml`.
3. **Author:** lessons are written as typed TS in `packages/course-em1/src/`. Each block carries `source` and `licence`.
4. **Verify:**
   - **Maths:** every numeric answer, hint value and sim expectation is recomputed through `packages/physics` in tests. A mismatch fails the build.
   - **Simulations:** analytic tests, e.g. E(2r)/E(r) = 0.25; flux of an enclosed q through sphere, cube and deformed surface = q (±1e-6 relative at "high" discretisation); outside charge gives net flux ≈ 0.
   - **Structure:** Zod validation plus graph lint. Checks: no dead-end branch; every misconception tag has remediation; every wrong option has feedback; every prerequisite exists; every block has source and licence.
   - **Publish report:** a per-concept checklist (objective, prerequisites, intuition, formal, verified maths, verified examples, visual, interaction, misconceptions, practice, assessment mapping, remediation, advanced path, sources). A concept is marked `ready` only when all items pass.
5. **Human review:** the owner walks the lesson as the subject-matter check.

## 7. Error handling and performance

- Each block renders inside an error boundary. A failing block shows a calm fallback and the lesson continues.
- If WebGL is unavailable or fails, fall back to the 2D slice plus numeric readouts.
- **Sim quality tiers** control vector count, surface discretisation and DPR. Low-power is chosen automatically if the frame time stays above budget.
- Persisted state is versioned with migrations. If it is corrupted, back it up, reset, and notify.

## 8. Testing strategy

- **Vitest:**
  - engine: rules, state machine, scheduler, diagnostic routing, answer checking
  - physics: analytic checks
  - course: data verification and graph lint
- **Playwright end-to-end:** diagnostic → route → refresher → lesson → wrong answer → remediation → return → challenge → dashboard → notebook restore of a sim state. It also runs the lesson under 4× CPU throttle with the low-power tier.
- **Accessibility:** axe checks on every screen, plus keyboard-only traversal of the lesson.

## 9. Success criteria for the slice

- A classmate can go from diagnostic to passing the Gauss's Law challenge with zero network calls after load.
- Every numeric answer in the slice is backed by a passing physics test.
- All 5 misconception branches are reachable and return correctly.
- A frozen sim state saved in the notebook restores exactly.
- The return experience correctly summarises a simulated 5-day gap.
- It stays usable on a throttled CPU profile.
- The design-review question from the vision doc is answered by real use: "I finally understand why this equation exists, I can manipulate the phenomenon, the system caught what I misunderstood, I know where it appears on the exam, and I know what to learn next."
