# Forma: Identity, App Shell and Plate Engine (Sub-projects 1 + 2): Design Spec

- **Date:** 2026-09-25
- **Status:** Approved section by section in brainstorming; pending written-spec review
- **Supersedes (for UI and interaction):** `2026-09-25-em1-vertical-slice-design.md`. That spec's engine, physics, course grammar, verification and pedagogy rules remain in force unless changed here.
- **Inputs:**
  - `Interactive Study Workspace.md` (vision)
  - `C:\Users\malic\Downloads\Interactive Study Workspace repos.md` (reference repos)
  - `C:\Users\malic\Downloads\Samples\Diagrams that are interactive and progressive` (quality bar: *Harmonia* and *Vast*)
  - `references/README.md` (local clones)

## 0. Why this exists

The v1 slice worked mechanically but felt like reading slides. The owner's verdict: "one could even say it would be better as is to read slides."

The bar is now the two supplied samples:
- a physically exact model you operate
- instrument-grade readouts
- a scrubbable timeline
- narrative placed inside the scene
- a striking first frame
- minimal, precise text

The product is also no longer an EMag app. It is a platform brand, **Forma**, hosted as a web app (TradingView-style), with desktop and mobile later. EMag is one course.

### Owner decisions captured

| Decision | Choice |
|---|---|
| Name / slogan | **Forma**: "Shape how you understand." |
| Visual direction | **B · Drafting table**: living technical plates on engineering paper; 2D by default, 3D (engraved axonometric) only when rotation teaches |
| Wordmark | Concept 1 (ranking 1 > 2 > 4 > 3), redrawn on a strict grid (§1.2) |
| UI framework | React (kept for R3F, Quickdraw React/React Native, xyflow, the MathLive web component, and the mobile path) |
| Workspace model | **Modes**: Learn / Solve / Explore / Revise preset layouts with pinnable panels |
| Lesson motion | **Living plate + scrub timeline**: one model moving through states |
| Plate engine | **Hybrid**: components (model + view) in code; plates and steps composed in content data; exact physics mandatory |
| Tone | Serious tool for willing students. Not Duolingo: no gamification, no bite-size drip. |

## 1. Identity system (`@forma/ui`)

### 1.1 Principles
- The world is the **engineering plate**: paper, ink, precise linework, hatching, dimension callouts, title blocks. A diagram is drawn exactly, then comes alive when touched.
- **Colour means something; it's never decoration.**
- One stroke weight family, generous negative space, 8-pt baseline grid.

### 1.2 Wordmark and mark (canonical geometry)

- Cap height is 120 units. Stroke is 24 units throughout. Letter gap is 20 units.
- Letters sit exactly between baseline (y=120) and cap line (y=0).
- Advance offsets: F 0, O 116, R 256, M 378, A 518. Total width 630.

```svg
<g id="F">
  <path d="M0 0 H84 A12 12 0 0 1 84 24 H0 Z"/>
  <path d="M0 120 V58 A24 24 0 0 1 24 34 H72 A12 12 0 0 1 72 58 H24 V120 Z"/>
</g>
<path id="O" fill-rule="evenodd" d="M60 0 A60 60 0 1 1 59.99 0 Z M60 24 A36 36 0 1 0 60.01 24 Z"/>
<g id="R">
  <path d="M0 0 H24 V120 H0 Z"/>
  <path d="M24 0 H62 A34 34 0 0 1 62 68 H24 V44 H62 A10 10 0 0 0 62 24 H24 Z"/>
  <path d="M42 68 H68 L102 120 H76 Z"/>
</g>
<path id="M" d="M0 120 V0 H22 L60 42 L98 0 H120 V120 H96 V38 L60 78 L24 38 V120 Z"/>
<path id="A" d="M0 120 L44 0 H68 L112 120 H86 L56 36 L26 120 Z"/>
```

- The **F alone** is the app mark (favicon, PWA icon, avatar fallback).
- Minimum sizes:
  - wordmark: 16 px cap height
  - mark: 16 px
  - clear space: 0.5 × cap height on every side

### 1.3 Typography (self-hosted, OFL)

| Role | Family | Use |
|---|---|---|
| Reading and headings | Source Serif 4 | Margin notes, derivations, headings |
| Interface | IBM Plex Sans | Controls, navigation, body UI |
| Data | IBM Plex Mono | Readouts, callouts, labels, title blocks (uppercase, 0.18–0.2 em tracking) |

### 1.4 Colour tokens

| Token | Paper theme | Meaning |
|---|---|---|
| `--ink` | #1B1F24 | Structure, text, geometry |
| `--paper` / `--paper-2` / `--grid` | #F3EFE6 / #FBF8F1 / #E4DDCD | Ground, raised surface, engineering grid |
| `--graphite` | #5E6167 | Secondary text, dimensions |
| `--charge` (vermilion) | #C8412B | Charges, sources, Q |
| `--field` (viridian) | #1F7A64 | Field E |
| `--flux` (ultramarine) | #2B47C9 | D, Ψ |
| `--surface` (ochre) | #A8761A | Surfaces, normals, "take another look" |
| `--ok` (green) | #2E7D4F | Confirmed, always shown with ✓ |

- **Blueprint** (night) theme: navy ground, chalk-white ink, same meanings, re-tuned for contrast.
- **High-contrast** theme is also available.
- Colour is never the only carrier of meaning (WCAG 2.2).

### 1.5 Drawing language
- 2D plates are SVG: 1.2–1.6 px ink lines, 45° hatching for regions, dashed dimension lines, ink-style arrowheads, callout leaders.
- 3D uses React Three Fiber rendered as *engraving*: lines, contour rings, hatching, never glossy shading. It is enabled only by steps that declare `view: "3d"`.

### 1.6 UI primitives
- Built on Zag.js: button, segmented control, slider, dialog, tabs, popover, command palette.
- Forma-specific: `Readout` (mono value + unit + label), `Callout` (leader line + label), `TitleBlock`, `MarginNote`, `Timeline`.
- Every primitive is token-driven, keyboard-operable and has a visible focus state.

## 2. Architecture

The pnpm monorepo is renamed. The v1 packages are renamed, not rewritten.

| Package | Role |
|---|---|
| `@forma/physics` | v1 physics, extended: line/sheet/volume distributions, cylinder and pillbox surfaces, potential. Every model tested against analytic results. |
| `@forma/engine` | v1 engine (grammar, answers, mastery, rules, scheduler, lint), plus new plate/step/interaction block types, question templates, branching routes and symbolic checking (MathLive Compute Engine). |
| `@forma/plate` *(new)* | Component registry, scene graph, timeline and tween engine, focus links, React bindings. Renderers: SVG (2D), R3F (3D), JSXGraph (plots), MathLive (equations). |
| `@forma/ui` *(new)* | Tokens, fonts, wordmark/mark, primitives (§1). |
| `@forma/course-em1` | EMag content as composed plates + steps + templates. |
| `apps/web` | The Forma web app. Later: `apps/desktop` (Tauri) and `apps/mobile` (Expo) consume the same packages. |

**Dependency rules:**
- `physics` depends on nothing.
- `engine` depends only on `physics` types.
- `plate` depends on `physics` and `ui`.
- Courses depend on `engine`, `plate` and `physics`.
- Only apps depend on React DOM specifics.

## 3. App shell and modes (`apps/web`)

**Global frame**
- **Top bar:** F mark + wordmark, breadcrumb (Course › Unit › Concept › §step), mode switcher, ⌘K palette, account menu (placeholder until sub-project 5).
- **Tool dock:** vertical icon strip: Paper ✎, Notebook ▤, Formulas ∑, Sources ⓘ, Calculator.
  - Click opens the tool in the margin.
  - Shift-click pins it as a split pane.
- **Title-block footer:** the timeline on lesson screens; status (saved, finals countdown) elsewhere.

**Routes**

| Route | Purpose |
|---|---|
| `/` | Desk: continue, due reviews, countdown, recent notebook entries |
| `/courses` | Library |
| `/c/[course]` | Course overview: concept map, route, units |
| `/c/[course]/[concept]?mode=learn|solve|explore|revise` | The concept, opened in the chosen mode |

**Modes** (layout presets; per-learner saved splits and pins)

| Mode | Layout |
|---|---|
| Learn | Plate ≈70%, margin ≈30%, timeline footer |
| Solve | Problem sheet \| working paper (50/50); plate popover on demand |
| Explore | Full-bleed plate, instrument panel (controls + readouts), experiment cards |
| Revise | Map \| due reviews \| exam view |

**⌘K** jumps to concepts, modes, tools, formulas and reviews.

**Shortcuts:**
- ← / → change step
- Space plays or pauses
- 1–4 switch mode
- P opens paper, N the notebook
- ⌘K opens the palette

**Themes:** Paper (default), Blueprint, High-contrast. Motion follows the setting and `prefers-reduced-motion`.

## 4. Plate engine (`@forma/plate`)

### 4.1 Component contract

```ts
defineComponent({
  id: "gaussian-surface",
  params: z.object({ /* shape, radius, center, showNormals, shading */ }), // the only things content can set
  model: (params, scene) => ({ patches, flux, enclosed }),                  // pure; calls @forma/physics
  view2d?: SvgView, view3d?: R3fView, plot?: JsxGraphView,
  handles: ["radius", "shape"],        // learner-manipulable params
  readouts: ["flux", "enclosed"],      // derived values the plate may display
});
```

- Models are pure and memoised. They are the only source of derived values.
- Views render only model output and params.
- **Initial component set:** `Charges`, `FieldArrows`, `FieldLines`, `GaussianSurface` (sphere, cube, blob, cylinder, pillbox), `SurfacePatch`, `Axes`, `DimensionCallout`, `Readout`, `Equation` (MathLive), `FaradaySpheres`, `LineCharge`, `SheetCharge`, `Plot2D` (JSXGraph).

### 4.2 Plates and steps (content data)
- **Scene:** component instances plus links, e.g. `field.sources ← charges`.
- **Step:** a partial parameter patch, visibility, highlights (`focus: ["surface"]`), optional `view: "2d" | "3d"`, a margin note (≤ 60 words; lint warns above), optional deep views (`why`, `derivation`), and an optional interaction (§5).

### 4.3 Timeline
A step change produces a diff, played in this order:
1. exits fade
2. numeric params tween (≈ 600 ms, eased)
3. new strokes draw on like ink
4. highlights pulse in cause→effect order

- Every frame is computed from interpolated params, so intermediate frames are physically true.
- Scrubbing is continuous.
- Reduced motion snaps to end states.
- Assessment steps lock forward scrubbing until answered.

### 4.4 Focus links
- Equation terms (MathLive) and components share semantic keys.
- Clicking a term highlights the bound components, and hovering a component highlights its term.

### 4.5 Learner edits
- In Learn mode, learner manipulations layer over the current authored state.
- Leaving the step prompts "keep your setup / reset".
- Explore mode has no authored steps.
- "Save to notebook" snapshots params and restores them exactly.

### 4.7 Narration-ready (hooks only; the audio pipeline is sub-project 7)
Narration is authored and generated at build time, then played back deterministically. There is no TTS inference at runtime. This spec builds only the hooks:
- **Cue tracks:** besides the step-to-step diff, a step may carry a time-based cue track (`{ t, action: highlight | show | hide | tween | camera, target, params }`). The timeline plays cues against a clock that a narration segment can drive later. Without audio, the same cues play on a silent clock at reading pace.
- **Pause points** are ordinary interaction steps: playback stops, the learner answers, and branching picks the next segment.
- **Math speech:** every `Equation` term and expression carries `display` (LaTeX), `speech` ("the closed surface integral of D dot d S") and `shortSpeech` ("the flux integral"). Speech is never derived from LaTeX.
- **Schema:** each step reserves `narration?: { transcript, captions?, audio?: { src, durationMs }, cues[] }`.
- **Fallback reader:** browser `speechSynthesis` can read a margin note or transcript on request ("Read this" 🔊). Off by default. Consistency across devices isn't guaranteed.
- **Lint:** warns when a transcript repeats the on-screen margin note verbatim (above 60% token overlap). Narration teaches *alongside* the plate; it doesn't read it aloud.

### 4.6 Performance and fallback
- Models are memoised and heavy ones run off the render loop.
- Quality tiers control arrow density, patch count and DPR.
- SVG up to about 2k elements; canvas fallback beyond that.
- 3D is lazy-loaded. If WebGL fails, the 2D view is used.
- Each component renders inside an error boundary.

## 5. Interactions, questions, branching (`@forma/engine` + `@forma/plate`)

**Interaction content types** (all emit answer events into the v1 reducer):
- `predict-drag`: drag a readout or handle to a guess; the plate then plays the truth.
- `place`: position something to satisfy a condition checked by the model.
- `manipulate-goal`: free manipulation until a goal check passes.
- `identify`: click a plate region.
- `build-equation`: MathLive fill-in or drag terms; symbolic equivalence via the Compute Engine.
- Kept from v1: `choose` + `explain`, `numeric` / `step-solve` (units, error classes, graded hints, worked steps).
- `sketch`: draw on working paper, then compare against the official solution shown side by side (self-check).

**Question templates:**
- A template declares parameter ranges and a `solve(params)` that calls `@forma/physics`.
- Answers and distractors are computed, never typed in.
- Each learner gets a seeded variant. Retries and reviews draw new seeds.
- Tags (concepts, misconceptions, difficulty) feed mastery.

**Branching:**
- A step can route on answer, reason, attempt number, misconception history and prerequisite mastery.
- Each route leads to an authored state (remediation, alternative explanation, skip).
- Deterministic; no LLM.

**Mastery:** v1's five dimensions, the review scheduler and detours are kept. Interactions credit the matching dimension (e.g. `place` → application).

**Text discipline:**
- The margin note budget is 60 words.
- The publish report flags steps with text but no plate change ("possible slide").

## 6. Content scope: the EMag proving ground

- **Gauss's law** is rebuilt as a 6-step plate: §1 Charge, §2 Field, §3 Surface, §4 Flux, §5 The law, §6 Prove it.
  - The Faraday hook and all 5 misconception detours are in plate form.
  - Every authored number is physics-verified.
- **Solve:** templated variants of tutorial Q.06, Q.08 and Q.09 and Finals 2024-25 Q2(a), with working paper alongside.
- **Explore:** the Gauss lab with experiment cards.
- **Revise:** map, due reviews and exam view from existing data.
- The remaining v1 concepts render in a "classic" renderer until they're rebuilt (sub-project 6).

## 7. Data flow and persistence

1. Content is validated at build time (Zod, course lint, plate-state replay).
2. The course bundle loads.
3. The plate engine renders.
4. Learner actions go to the engine reducer.
5. The reducer updates state and returns effects.
6. State is saved in Dexie with a versioned migration.

- **State additions:** per-mode layout, question seeds, plate snapshots.
- **Kept from v1:** corrupt state backed up then reset; storage timeout falls back to an in-memory session.
- **Assets:** fonts are self-hosted, and the wordmark and mark are SVG components. Favicon and PWA icons are generated from the mark.

## 8. Testing

- **Unit:** physics models, component models, templates (`solve` against physics), engine.
- **Plate-state replay:** every step of every plate is validated against the component param schemas. Every readout and authored number must match physics, or the build fails.
- **Playwright:** one journey per mode, the ⌘K palette, keyboard-only lesson traversal.
- **axe:** checked on every screen, in both themes.
- **Throttled CPU:** 4× throttle keeps plate interactions responsive.
- **Visual snapshots:** key plate states in Paper and Blueprint.

## 9. Out of scope (later sub-projects)

- **Sub-project 3:** full course-engine v2 beyond what §5 needs, and the authoring editor.
- **Sub-project 4:** Quickdraw working paper (paper and canvas modes, stroke storage we own), rich notebook, calculator (JupyterLite / Pyodide).
- **Sub-project 5:** accounts (Portfolio auth pattern), sync, hosting, email reminders, analytics.
- **Sub-project 6:** rebuild of the remaining EMag concepts.
- **Sub-project 7:** narration production (audition Chatterbox and Kokoro-82M; Kitten TTS and Parler-TTS as candidates; review workflow; Opus/AAC segments), the narration player (speed 0.75–2×, captions, "repeat concept", guided vs "read this"), and 2–4 curated narrators.
- Desktop and mobile apps.
- Replacing restricted UTech material with original content before public launch.

## 10. Success criteria

1. A first-time student opens the Gauss concept, and the first frame is a striking, legible plate before any interaction.
2. The full 6-step lesson can be completed with ≤ 60 words of margin text per step. Every step changes the plate; the publish report shows no "possible slide".
3. Scrubbing the timeline forward and back morphs the plate continuously, and every intermediate readout is physically correct (verified by the replay test).
4. The misconception detours, question variants and mastery updates work deterministically.
5. All four modes work, with saved layouts; ⌘K and the keyboard shortcuts work.
6. The Paper and Blueprint themes both pass axe with no serious violations.
7. The owner judges it "not like reading slides", measured against the Harmonia/Vast bar.
