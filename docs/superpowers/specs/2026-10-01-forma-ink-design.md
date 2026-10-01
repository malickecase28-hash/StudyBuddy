# Forma Ink 1: Stylus Notebooks and Whiteboard

**Date:** 2026-10-01. **Owner:** Claude, end to end: spec, plan, build and review.
**Status:** design approved in conversation; written spec awaiting review.
**Roadmap parent:** `2026-09-26-forma-emag-electrostatics-assessments-design.md` §6.5 (sub-project 9).

## 0. Intent

Forma Ink is the place students think with a pen: working problems beside the course, keeping notes per concept, and sketching on an open whiteboard. It must feel at least as good as Apple Freeform and Notes for handwriting, and do things they can't:
- know the course (plate snapshots, bank questions, concept links);
- turn handwritten maths into LaTeX on the device.

Ink 1 is single-user and local. Ink 2, out of scope here, adds sharing, live whiteboard collaboration and cloud sync on top of Commons and accounts. Ink 1's operation log is designed so that Ink 2 can broadcast it unchanged.

**What the user decided:**
- Devices: iPad + Pencil, Windows pen tablets and Android styluses, equally.
- Must-haves: notebooks and pages, a course-aware canvas, handwriting → LaTeX, and export and share.
- Recognition: an on-device model.
- Engine: our own (not js-draw, tldraw or Excalidraw).
- Verification: no new test files (the 2026-10-01 workflow rule).

## 1. Architecture

### 1.1 `@forma/ink` (new package, framework-free TypeScript)

| Module | Responsibility |
|---|---|
| `model` | Notebook, Page and Item types, with a schema for each (zod). Item kinds: `stroke`, `shape`, `text`, `equation`, `image`, `plate`, `bank`, `link`. Each item has `id`, `z`, `transform` (2D affine) and `style`. A stroke holds `points: [x, y, pressure, tiltX, tiltY, t][]` plus `tool` (pen or highlighter), `color` and `size`. |
| `ops` | The only way to change a page. Ops are `add`, `update` (a partial patch), `remove` and `reorder`. Each op is serializable and invertible. Undo and redo replay inverses; consecutive ops from one gesture group into one undo step. Ink 2 broadcasts these ops as they are. |
| `geometry` | Stroke outlines through `perfect-freehand`, tuned per tool. Also: hit-testing (point to stroke distance), lasso polygon containment, stroke splitting for the precise eraser, shape recognition (line, arrow, rectangle, ellipse, triangle, polygon), ruler snapping, bounds and transforms. |
| `spatial` | A uniform-grid spatial index over item bounds, for culling and hit-testing. |
| `render` | The Canvas 2D renderer, in three layers:<br>• background: the template;<br>• committed items: cached and redrawn only when changed;<br>• live: the stroke in progress plus predicted points, every frame.<br>A camera (pan, zoom 0.1–8, device pixel ratio) and viewport culling. |
| `input` | Pointer Events with `getCoalescedEvents()` and `getPredictedEvents()`; pressure, tilt and `button` (the barrel button switches to the eraser).<br>Palm rejection: once `pointerType === "pen"` is seen, touch never draws and only pans and zooms. A mouse or a finger draws only when no pen has been seen.<br>Gestures: two-finger pan and pinch; two-finger tap undoes and three-finger tap redoes. |
| `tools` | Pen, highlighter, stroke eraser, precise eraser, lasso, shape snap (hold still for 500 ms), ruler, text, equation, and the hand. Each tool is a small state machine fed by `input` that emits ops. |
| `store` | A `InkStore` interface for notebooks, pages and items, with per-item upsert so a big page saves one change at a time. |
| `export` | Page and selection to PNG; page to SVG; page or notebook to PDF with vector paths (`pdf-lib`); notebook to and from JSON. |

### 1.2 `apps/web`

- **Routes:**
  - `/ink`: the notebooks home, with a grid of thumbnails, new notebook, and search by title.
  - `/ink/[notebook]/[page]`: the editor, with page strip, toolbar and canvas.
- **`<InkCanvas>`:** a thin React wrapper that mounts the engine on a host element and exposes the active tool, style and commands.
- **`<InkToolbar>`:** in Forma's drafting-table style, using palette tokens only (charge, field, flux, ink, graphite, surface) and no hex colours.
- **`DexieInkStore`:** implements `InkStore`, with tables `notebooks`, `pages`, `items` and `thumbs`. Autosaves about 400 ms after the last op.
- **Inserts:**
  - Plate snapshot: the `PlateStage` SVG of the current step, frozen, with an "Open step" link.
  - Bank question card: the `questionBank` text and paper, with a link.
  - Concept link chip.
  - Image, from a file, the clipboard, or the camera via `<input capture>`.
- **Equations:** typed in a MathLive editor, then rendered with KaTeX as an item.
- **`WorkingPaper` is replaced:**
  - The tool panel and `/paper` open that concept's Ink notebook.
  - On first launch, existing notebook drawings (SVG) import as `image` items on a page titled with their old title.

### 1.3 Dependencies (new)

`perfect-freehand`, `mathlive`, `pdf-lib`, `onnxruntime-web`. The recognition model weights are fetched at runtime on first use; they are not bundled.

## 2. Tools and feel

| Tool | Behaviour |
|---|---|
| Pen | Width from pressure (and tilt for a chisel feel). Three preset sizes and the token palette. Predicted points are drawn as a fading tail and replaced when real points arrive. |
| Highlighter | Translucent, flat-capped, drawn beneath the ink. |
| Erasers | Stroke eraser: remove whole strokes. Precise eraser: split strokes where touched. The pen's eraser end or barrel button switches temporarily. |
| Lasso | Free-form polygon selection. Then move, scale (corner handles), rotate (top handle), duplicate, delete, recolour, copy and paste, convert to equation, and export the selection. |
| Shape snap | Draw, then hold still for 500 ms: snaps to a line, arrow, rectangle, ellipse, triangle or polygon. Snapped shapes stay editable as shapes. |
| Ruler | A draggable, rotatable straightedge (two fingers, or drag its body). Pen strokes within 12 px of its edge snap straight along it. Shows its angle in degrees. |
| Text | Markdown-lite boxes: `$…$`, `**…**`, `*…*`, as in lesson prose. |
| Equation | MathLive editing; displayed with KaTeX. |
| Navigate | Pan and zoom (10–800%); Ctrl+wheel zooms; fit to content; a minimap. |
| Pages | An infinite canvas, plus an optional A4 page frame for export. Templates: blank, grid, lined, dot, derivation (two columns). |
| Keys | P pen, H highlighter, E eraser, L lasso, T text, M equation, R ruler, Space+drag pan, Ctrl+Z / Ctrl+Y, Ctrl+C / Ctrl+V, Delete. |

**Performance:**
- New ink appears within 16 ms of input.
- 60 fps pan and zoom with 5,000 strokes on a page.
- Opening a 5,000-item page takes under 1 s.

## 3. Handwriting → LaTeX

1. Lasso the strokes, then choose "Convert to equation".
2. The selection is rasterized to grayscale at the model's input size, keeping the aspect ratio.
3. `onnxruntime-web` (WebGPU where available, WASM otherwise) runs the encoder-decoder model and decodes LaTeX.
4. The result opens in a MathLive editor for correction. "Insert" replaces the strokes with an `equation` item at their bounds, as one op group, so undo restores the strokes.
5. The model downloads on first use, after a consent prompt that shows its size. It is cached (Cache Storage) and works offline afterwards. The download progress shows.

**Model choice (the plan's first task).** Benchmark these candidates on 10 handwritten equations from course papers:
- the pix2text maths-formula recogniser (MFR), an ONNX encoder-decoder trained on handwritten and printed formulas;
- TexTeller.

Measure for each: download size, load time, inference time and exact-match / edit-distance accuracy. Pick the best one that runs at under 3 s per equation on a mid-range laptop.

If none reaches about 80% usable results (correct after at most two small edits), the feature ships labelled "Beta", and Ink 1 does not wait for it.

## 4. Error handling

- Storage failures (private mode, quota): a banner says notes can't be saved on this device; the editor still works in memory, and export still works.
- A corrupt page row: skip that item, log it, and show "1 item couldn't be opened".
- Recognition failures (download error, unsupported device): the convert action explains why and leaves the strokes untouched.
- Every op is validated with its zod schema before it is applied. An invalid op is dropped and logged, never applied.

## 5. Accessibility

- Toolbar buttons have labels and the keyboard shortcuts above.
- The canvas has `role="img"`, and its `aria-label` lists the page's title and item counts.
- Text and equation items are also exposed in a visually hidden list, so screen readers can read typed content.
- Ink honours `prefers-reduced-motion`: no tail animation, and instant pans.
- The dark theme is driven by tokens. Ink colours stay legible: graphite becomes paper-ink on dark.

## 6. Rollout and verification

- Built by Claude in a git worktree on branch `feat/forma-ink`, then merged into `feat/em1-slice` when green. Pushing is the user's call.
- Build order, each step usable:
  1. Recognition spike.
  2. Engine core: a pen on a page.
  3. Tools.
  4. Notebooks and pages, with storage.
  5. Course-aware inserts, and replacing `WorkingPaper`.
  6. Export and share.
  7. Handwriting → LaTeX.
  8. Polish: performance, keys, accessibility, theme.
- Verification. There are no new test files; instead:
  - typecheck, build, and the existing e2e and axe tests (updating only the baselines and assertions that Ink's replacement of `WorkingPaper` breaks);
  - a Claude-driven browser walkthrough of every tool with mouse and synthetic pen events, including reload persistence, each export, and recognition on the 10 sample equations;
  - frame timing measured on a generated 5,000-stroke page;
  - a manual stylus checklist for the user on a real tablet.

## 7. Out of scope (Ink 2 and later)

- Sharing links, live collaboration (Commons rooms switch to Ink ops) and comments.
- Cloud sync and accounts.
- Layers, audio recording, page templates beyond the five listed, and shape-recognition languages beyond the basic shapes.

## 8. Success criteria

- A student can create a concept notebook and write a full derivation with a pen on any of the three platforms, without strokes from a resting palm.
- Ink latency stays within 16 ms, and the 5,000-stroke page pans at 60 fps.
- A plate snapshot and a bank question can be dropped onto a page, and each links back to its step or question.
- A page exports to PDF with vector strokes, and a notebook round-trips through JSON.
- Handwriting → LaTeX works offline after the first download, with the benchmark result recorded.
- Existing notebook drawings appear in Ink. The tool panel opens Ink.
- The existing suite, typecheck, build, e2e and axe all stay green.
