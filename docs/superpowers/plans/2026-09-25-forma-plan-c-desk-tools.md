# Forma Plan C: Desk, Countdown and Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v1 StudyBuddy home with the Forma Desk (option A). Show the finals countdown only on the Desk and in Revise. Open tools as a resizable split that is remembered per mode, expandable, and a full-screen sheet on phones.

**Architecture:**
- `deskContinue(learner)` (pure, tested) decides where "Continue" goes and which plate state the thumbnail shows. `DeskScreen` renders it with a read-only `PlateStage`.
- Tools move out of the fixed side column into `ToolSplit`, a stable grid: page | handle | tool. The page is always the first child, so opening a tool never remounts the lesson.
- Tool width and the pinned tool live in each mode's layout (`toolWidth`, `pinned[0]`). Outside a concept workspace, the width is kept for the session only.

**Tech Stack:** Next.js 16, React 19, Zustand 5, Zod 4, Vitest 5, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-09-25-forma-teaching-depth-desk-tools-design.md` §2. The base spec `2026-09-25-forma-identity-shell-plate-engine-design.md` §3 governs everything else.

## Global Constraints

- **Countdown:** on the Desk (one small line inside "Due today") and in Revise's exam view. Nowhere else, and the footer keeps save status only.
- **Desk:** uses the full window width, with no "StudyBuddy" text and no embedded 3D toy.
- **Tools:**
  - The default width is 45% (50% in Solve). Width is clamped to [0.2, 0.8].
  - One tool is open at a time. `pinned` holds at most one tool per mode.
  - Below 900 px, the tool pane is a full-screen sheet.
- **Opening, closing or resizing a tool must never remount the page content** (lesson state is preserved).
- **Colours:** tokens only (existing hex-scan tests apply). The workspace keeps working with the keyboard and passes axe with no serious issues in Paper and Blueprint.
- **Commands** run from `F:\StudyBuddy\app` unless stated. Commit after each task.

## Review Focus

1. **Opening a tool mid-lesson** (e.g. at §4 with a committed prediction) keeps the lesson's state. The page subtree is not remounted. Tested in Task 4 (e2e: open paper at §4 and the "Measured" readout is still shown).
2. **A stored v2 learner state without `toolWidth`** (every existing user) migrates, gets the 0.45 default, and loses nothing. Tested in Task 1.
3. **Continue from the Desk** after a detour, a classic lesson or a first run always resolves to a real route and never throws. Tested in Task 2 (`deskContinue` cases).
4. **A narrow window** (< 900 px): the tool pane covers the screen and can be closed from the keyboard. Tested in Task 4 (phone viewport e2e).
5. **Closing a pinned tool** unpins it for that mode, so it doesn't reappear on the next page. Tested in Task 4.

---

## File Structure

```
app/packages/engine/src/learner-state.ts         + toolWidth in layouts (default, schema default, withLayout clamp)
app/packages/engine/test/workspace.test.ts       + toolWidth cases
app/apps/web/lib/desk.ts                          deskContinue (pure)
app/apps/web/test/desk.test.ts
app/apps/web/components/screens/DeskScreen.tsx    replaces HomeScreen on "/"
app/apps/web/components/plate/PlateThumb.tsx      read-only plate at a step
app/apps/web/app/page.tsx                         renders DeskScreen
app/apps/web/components/shell/ToolPanel.tsx       → ToolSplit, useToolState, ToolBody
app/apps/web/components/shell/{AppShell,ToolDock}.tsx
app/apps/web/components/workspace/{SolveMode,ConceptWorkspace,ReviseMode}.tsx
app/apps/web/lib/ui.ts                            session toolWidth, toolExpanded
app/packages/ui/src/forma.css                     tool-split / tool-pane / desk styles
app/apps/web/e2e/{desk,tools}.spec.ts, modes.spec.ts (update)
```

---

### Task 1: Engine: tool width per mode

**Files:**
- Modify: `app/packages/engine/src/learner-state.ts`
- Test: `app/packages/engine/test/workspace.test.ts`

**Interfaces:**
- Produces:
  - `Workspace["layouts"][Mode] = { split: number; pinned: ToolId[]; toolWidth: number }`
  - `defaultWorkspace()` gives `toolWidth` 0.45 (0.5 for solve)
  - `withLayout(s, mode, { toolWidth })` clamps to [0.2, 0.8]
  - `migrate` fills a missing `toolWidth` with 0.45

- [ ] **Step 1: Write the failing tests**: append to `test/workspace.test.ts`:

```ts
import { defaultWorkspace, migrate } from "../src";

describe("tool width", () => {
  it("defaults to 45%, 50% in Solve, and clamps to [0.2, 0.8]", () => {
    expect(defaultWorkspace().layouts.learn.toolWidth).toBe(0.45);
    expect(defaultWorkspace().layouts.solve.toolWidth).toBe(0.5);
    expect(withLayout(initialState(), "learn", { toolWidth: 0.95 }).workspace.layouts.learn.toolWidth).toBe(0.8);
    expect(withLayout(initialState(), "learn", { toolWidth: 0.05 }).workspace.layouts.learn.toolWidth).toBe(0.2);
  });
  it("existing v2 state without toolWidth migrates with the default and nothing lost", () => {
    const s = initialState();
    const old = JSON.parse(JSON.stringify({ ...s, notebook: [{ id: "n", createdAt: 1, conceptId: "c", kind: "note", title: "t", body: "b" }] }));
    for (const m of ["learn", "solve", "explore", "revise"]) delete old.workspace.layouts[m].toolWidth;
    const out = migrate(old);
    expect(out.reset).toBe(false);
    expect(out.state.workspace.layouts.solve).toEqual({ split: 0.5, pinned: ["paper"], toolWidth: 0.45 });
    expect(out.state.notebook).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/workspace.test.ts`
Expected: FAIL (`toolWidth` is undefined).

- [ ] **Step 3: Implement**: in `src/learner-state.ts`:
  1. `Workspace` layouts become `Record<Mode, { split: number; pinned: ToolId[]; toolWidth: number }>`.
  2. `defaultWorkspace()`:
     - learn `{ split: 0.7, pinned: [], toolWidth: 0.45 }`
     - solve `{ split: 0.5, pinned: ["paper"], toolWidth: 0.5 }`
     - explore `{ split: 1, pinned: [], toolWidth: 0.45 }`
     - revise `{ split: 0.33, pinned: [], toolWidth: 0.45 }`
  3. `ModeLayout` schema: add `toolWidth: z.number().min(0).max(1).default(0.45)`.
  4. In `withLayout`, after computing `split`:

```ts
  const toolWidth = Math.min(0.8, Math.max(0.2, patch.toolWidth ?? cur.toolWidth));
  return { ...s, workspace: { lastMode: mode, layouts: { ...s.workspace.layouts, [mode]: { ...cur, ...patch, split, toolWidth } } } };
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/engine && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS (the web store's `setLayout` patch type widens automatically if it uses `Partial<Workspace["layouts"][Mode]>`; if it is written out as `{ split; pinned }`, add `toolWidth: number` there).

- [ ] **Step 5: Commit**

```bash
git add packages/engine apps/web/lib/store.ts && git commit -m "feat(engine): per-mode tool width with migration default"
```

---

### Task 2: Web: `deskContinue`, the Desk, and countdown placement

**Files:**
- Create: `app/apps/web/lib/desk.ts`, `app/apps/web/test/desk.test.ts`, `app/apps/web/components/plate/PlateThumb.tsx`, `app/apps/web/components/screens/DeskScreen.tsx`
- Modify: `app/apps/web/app/page.tsx`, `components/shell/AppShell.tsx` (footer), `components/workspace/ReviseMode.tsx` (countdown line)
- Delete: `components/screens/HomeScreen.tsx` (its `WelcomeBack` moves into `DeskScreen`)

**Interfaces:**
- Produces:
  - `DeskContinue = { href: string; title: string; sub: string; plate?: { plateId: string; step: number } }`
  - `deskContinue(learner): DeskContinue`
  - `PlateThumb({ plateId, step, label })`
  - `DeskScreen()`

- [ ] **Step 1: Write the failing test**: `app/apps/web/test/desk.test.ts`

```ts
import { initialState } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { deskContinue } from "@/lib/desk";

const G = "em1.electrostatics.gauss-law";
const at = (position: ReturnType<typeof initialState>["position"], history = [{ type: "blockViewed", conceptId: G, blockId: "x", at: 1 }]) =>
  ({ ...initialState(), position, history }) as never;

describe("deskContinue", () => {
  it("first run goes to the readiness check", () => {
    expect(deskContinue(initialState()).href).toBe("/diagnostic");
  });
  it("resumes the exact plate step, with a thumbnail", () => {
    const c = deskContinue(at({ conceptId: G, lessonId: "main", blockId: "gauss", branchStack: [], plateStep: 3 }));
    expect(c.href).toBe(`/c/em1/${G}?mode=learn&lesson=main&block=gauss&step=3`);
    expect(c.plate).toEqual({ plateId: "gauss", step: 3 });
    expect(c.title).toBe("§4 Flux");
    expect(c.sub).toMatch(/Gauss's Law/);
  });
  it("resumes a detour plate and a classic lesson", () => {
    expect(deskContinue(at({ conceptId: G, lessonId: "why-area", blockId: "why-area-p", branchStack: [], plateStep: 1 })).plate).toEqual({ plateId: "why-area-plate", step: 1 });
    const classic = deskContinue(at({ conceptId: G, lessonId: "main-classic", blockId: "hook", branchStack: [] }));
    expect(classic.href).toBe(`/learn/${G}/main-classic`);
    expect(classic.plate).toBeUndefined();
  });
  it("a stale position (lesson or block gone) falls back to the concept, never throws", () => {
    expect(deskContinue(at({ conceptId: G, lessonId: "gone", blockId: "x", branchStack: [] })).href).toBe(`/c/em1/${G}?mode=learn`);
    expect(deskContinue(at({ conceptId: "nope", lessonId: "x", blockId: "x", branchStack: [] })).href).toMatch(/^\/c\/em1\//);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run apps/web/test/desk.test.ts`
Expected: FAIL (cannot resolve `@/lib/desk`).

- [ ] **Step 3: `lib/desk.ts`**

```ts
import { plates } from "@forma/course-em1";
import type { LearnerState } from "@forma/engine";
import { conceptHref, conceptOrder, getConcept, getLesson, isPlateLesson, lessonHref } from "./course";

export type DeskContinue = { href: string; title: string; sub: string; plate?: { plateId: string; step: number } };

/** Where "Continue" goes and what the thumbnail shows. Always a real route. */
export function deskContinue(learner: LearnerState): DeskContinue {
  if (!learner.diagnostic && learner.history.length === 0) return { href: "/diagnostic", title: "Start with a 5-minute readiness check", sub: "It builds your route through the course." };
  const pos = learner.position;
  const concept = pos ? getConcept(pos.conceptId) : undefined;
  const lesson = pos && concept ? getLesson(pos.conceptId, pos.lessonId) : undefined;
  if (pos && concept && lesson) {
    const block = lesson.blocks.find((b) => b.id === pos.blockId);
    if (isPlateLesson(lesson) && block?.type === "plate" && plates[block.plateId]) {
      const plate = plates[block.plateId]!;
      const step = Math.min(pos.plateStep ?? 0, plate.steps.length - 1);
      return {
        href: conceptHref(concept.id, "learn", { lesson: lesson.id, block: block.id, step: String(step) }),
        title: plate.steps[step]!.title,
        sub: `${concept.title} · ${plate.title} · step ${step + 1} of ${plate.steps.length}`,
        plate: { plateId: plate.id, step },
      };
    }
    if (!isPlateLesson(lesson)) return { href: lessonHref(concept.id, lesson.id), title: lesson.title, sub: `${concept.title} · classic lesson` };
  }
  const fallback = concept ?? getConcept(conceptOrder.find((id) => !getConcept(id)!.locked)!)!;
  return { href: conceptHref(fallback.id, "learn"), title: fallback.title, sub: "Pick up where the course continues." };
}
```

- [ ] **Step 4: `components/plate/PlateThumb.tsx`**

```tsx
"use client";

import { plates, registry } from "@forma/course-em1";
import { createEvaluator, frameAt } from "@forma/plate";
import { useMemo } from "react";
import { PlateStage } from "./PlateStage";

/** A read-only plate at one step: the real model output, not a picture. */
export function PlateThumb({ plateId, step, label }: { plateId: string; step: number; label: string }) {
  const plate = plates[plateId]!;
  const timeline = useMemo(() => frameAt(plate, step), [plate, step]);
  const frame = useMemo(() => createEvaluator(registry, plate.instances)(timeline.state), [plate, timeline]);
  return (
    <div className="plate-thumb" inert>
      <PlateStage plate={plate} timeline={timeline} frame={frame} label={label} />
    </div>
  );
}
```

- [ ] **Step 5: `components/screens/DeskScreen.tsx`**

```tsx
"use client";

import { DAY_MS } from "@forma/engine";
import Link from "next/link";
import { conceptHref, conceptOrder, course, examDateMs, getConcept } from "@/lib/course";
import { deskContinue } from "@/lib/desk";
import { conceptProgress, STATE_GLYPH } from "@/lib/progress";
import { dueCount } from "@/lib/retrieval";
import { useStudy } from "@/lib/store";
import { PlateThumb } from "../plate/PlateThumb";
import { RetrievalQuiz } from "./RetrievalQuiz";

export function DeskScreen() {
  const learner = useStudy((s) => s.learner);
  const now = useStudy((s) => s.now)();
  const returnInfo = useStudy((s) => s.returnInfo);
  const welcomeDismissed = useStudy((s) => s.welcomeDismissed);
  const dismissWelcome = useStudy((s) => s.dismissWelcome);
  const c = deskContinue(learner);
  const due = dueCount(learner, now);
  const days = Math.max(0, Math.ceil((examDateMs - now) / DAY_MS));
  const current = learner.position?.conceptId;
  const returning = !!returnInfo && returnInfo.gapDays >= 2 && !welcomeDismissed;

  return (
    <div className="desk">
      <h1 className="sr-only">Your desk</h1>
      {returning && (
        <section className="card space-y-3 desk-wide" aria-labelledby="welcome-back">
          <h2 id="welcome-back" className="text-xl">It&apos;s been {Math.floor(returnInfo.gapDays)} days.</h2>
          <p className="text-soft">Two quick recalls before you continue, so your place comes back.</p>
          <RetrievalQuiz count={2} onFinished={dismissWelcome} />
        </section>
      )}
      <section className="desk-continue" aria-labelledby="continue-title">
        {c.plate ? <PlateThumb plateId={c.plate.plateId} step={c.plate.step} label={`Where you stopped: ${c.title}`} /> : <div className="plate-thumb plate-thumb-empty" aria-hidden />}
        <div className="space-y-3">
          <p className="kicker">Continue</p>
          <h2 id="continue-title" className="text-3xl">{c.title}</h2>
          <p className="text-soft">{c.sub}</p>
          <Link href={c.href} className="btn btn-primary">Continue →</Link>
        </div>
      </section>
      <section className="desk-due card space-y-2" aria-labelledby="due-title">
        <p id="due-title" className="kicker">Due today</p>
        <p className="text-xl">{due ? `${due} recall${due === 1 ? "" : "s"} due` : "Nothing due"}</p>
        {due > 0 && <Link className="btn" href="/review">Start review →</Link>}
        <p className="text-sm text-soft">Finals in {days} days · {course.code}</p>
      </section>
      <section className="desk-route card" aria-labelledby="route-title">
        <h2 id="route-title" className="kicker">{course.title} · your route</h2>
        <ol className="desk-route-list">
          {conceptOrder.map((id) => {
            const k = getConcept(id)!;
            const g = STATE_GLYPH[conceptProgress(learner, id).state];
            return (
              <li key={id}>
                {k.locked ? (
                  <span className="text-faint">🔒 {k.title}</span>
                ) : (
                  <Link href={conceptHref(id, "learn")} aria-current={id === current ? "step" : undefined}>
                    <span aria-label={g.label}>{id === current ? "▶" : g.glyph}</span> {k.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>
      {learner.notebook.length > 0 && (
        <section className="desk-notes card space-y-2" aria-labelledby="recent-notes">
          <h2 id="recent-notes" className="kicker">Recent in your notebook</h2>
          <ul className="space-y-1 text-sm">
            {learner.notebook.slice(0, 3).map((n) => (
              <li key={n.id}>
                <Link className="underline" href="/notebook">{n.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
```

`app/page.tsx` renders `<DeskScreen />` in place of `<HomeScreen />`. Delete `components/screens/HomeScreen.tsx`.

Append to `packages/ui/src/forma.css`:

```css
.desk { display: grid; grid-template-columns: minmax(0, 1.9fr) minmax(16rem, 1fr); gap: 20px; align-items: start; }
.desk-wide, .desk-route, .desk-notes { grid-column: 1 / -1; }
.desk-continue { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 24px; align-items: center; padding: 20px; background: var(--paper-2); border: 1.5px solid var(--ink); }
.plate-thumb { pointer-events: none; }
.plate-thumb-empty { aspect-ratio: 520 / 380; background: var(--paper); border: 1.5px dashed var(--grid); }
.desk-route-list { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: 8px; font-size: 0.95rem; }
.desk-route-list a[aria-current="step"] { color: var(--flux-text); font-weight: 600; }
@media (max-width: 900px) { .desk, .desk-continue { grid-template-columns: 1fr; } }
```

- [ ] **Step 6: Countdown placement**
- **`AppShell.tsx`:** `StatusFooter` keeps only the Course and Progress cells. Delete the Finals and Due reviews cells, plus the now-unused `DAY_MS`, `examDateMs`, `dueCount` and `now` usages there.
- **`ReviseMode.tsx`:** under the "Exam view" heading, add `<p className="text-sm text-soft">Finals in {Math.max(0, Math.ceil((examDateMs - now()) / DAY_MS))} days</p>`, with `const now = useStudy((s) => s.now);` and imports of `DAY_MS` (`@forma/engine`) and `examDateMs` (`@/lib/course`).

- [ ] **Step 7: Run tests, both typechecks and the build**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add -A apps/web packages/ui && git commit -m "feat(web): Forma Desk (continue with live plate, due today, route, notes); countdown only on Desk and Revise"
```

---

### Task 3: Web: tools as a resizable split

**Files:**
- Modify:
  - `app/apps/web/lib/ui.ts`
  - `components/shell/ToolPanel.tsx` (becomes `ToolSplit` plus `useToolState`)
  - `components/shell/ToolDock.tsx`
  - `components/shell/AppShell.tsx`
  - `components/workspace/SolveMode.tsx`, `components/workspace/ConceptWorkspace.tsx`
  - `packages/ui/src/forma.css`

**Interfaces:**
- Produces:
  - `useUi` adds `toolWidth: number` (session width outside workspaces, default 0.45), `toolExpanded: boolean`, `setToolWidth(w)` and `setToolExpanded(b)`.
  - `useToolState()`: `{ tool: ToolId | null; pinned: boolean; width: number; setWidth(w); open(t); close(); togglePin(t) }`
  - `ToolSplit({ children })`

- [ ] **Step 1: UI store**: in `lib/ui.ts`, add to the state type, initial state and actions:

```ts
  toolWidth: number;
  toolExpanded: boolean;
  setToolWidth: (w: number) => void;
  setToolExpanded: (b: boolean) => void;
```

```ts
  toolWidth: 0.45,
  toolExpanded: false,
  setToolWidth: (w) => set({ toolWidth: Math.min(0.8, Math.max(0.2, w)) }),
  setToolExpanded: (toolExpanded) => set({ toolExpanded }),
```

Change `closePanel` to `set({ panel: null, toolExpanded: false })`.

- [ ] **Step 2: `ToolPanel.tsx`**: keep `ToolBody` unchanged. Replace the `ToolPanel` export with:

```tsx
export function useToolState() {
  const { panel, openPanel, closePanel, workspaceMode: mode, toolWidth, setToolWidth } = useUi();
  const layouts = useStudy((s) => s.learner.workspace.layouts);
  const setLayout = useStudy((s) => s.setLayout);
  const pinnedTool = mode ? layouts[mode].pinned[0] ?? null : null;
  const tool = panel ?? pinnedTool;
  return {
    tool,
    pinned: tool !== null && tool === pinnedTool,
    width: mode ? layouts[mode].toolWidth : toolWidth,
    setWidth: (w: number) => (mode ? setLayout(mode, { toolWidth: w }) : setToolWidth(w)),
    open: (t: ToolId) => openPanel(t),
    /** Closing a pinned tool unpins it for this mode, so it doesn't come back on the next page. */
    close: () => {
      if (mode && tool === pinnedTool) setLayout(mode, { pinned: [] });
      closePanel();
    },
    togglePin: (t: ToolId) => {
      if (!mode) return;
      setLayout(mode, { pinned: pinnedTool === t ? [] : [t] });
      openPanel(t);
    },
  };
}

/** Page | handle | tool. The page is always the first child, so opening a tool never remounts it. */
export function ToolSplit({ children }: { children: ReactNode }) {
  const { tool, pinned, width, setWidth, close, togglePin } = useToolState();
  const { activeConceptId, toolExpanded, setToolExpanded } = useUi();
  const box = useRef<HTMLDivElement>(null);
  const label = tool ? TOOLS.find((x) => x.id === tool)!.label : "";
  const cols = !tool ? "minmax(0, 1fr)" : toolExpanded ? "0 0 minmax(0, 1fr)" : `minmax(0, ${1 - width}fr) 12px minmax(0, ${width}fr)`;
  return (
    <div ref={box} className="tool-split" style={{ gridTemplateColumns: cols }}>
      <div className="tool-split-page" hidden={!!tool && toolExpanded}>
        {children}
      </div>
      {tool && (
        <div
          role="separator" aria-orientation="vertical" aria-label="Resize the page and the tool" tabIndex={0}
          aria-valuemin={20} aria-valuemax={80} aria-valuenow={Math.round(width * 100)} className="split-handle" hidden={toolExpanded}
          onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId) || !box.current) return;
            const r = box.current.getBoundingClientRect();
            setWidth(1 - (e.clientX - r.left) / r.width);
          }}
          onKeyDown={(e) => {
            const d = e.key === "ArrowLeft" ? 0.05 : e.key === "ArrowRight" ? -0.05 : 0;
            if (!d) return;
            e.preventDefault();
            setWidth(width + d);
          }}
        />
      )}
      {tool && (
        <aside className="tool-pane" aria-label={`Tool: ${label}`}>
          <header className="tool-pane-head">
            <h2 className="label">{label}</h2>
            <button className="btn text-sm" aria-pressed={pinned} onClick={() => togglePin(tool)} title="Keep this tool open in this mode">
              {pinned ? "Pinned" : "Pin"}
            </button>
            <button className="btn text-sm" aria-pressed={toolExpanded} onClick={() => setToolExpanded(!toolExpanded)} aria-label={toolExpanded ? "Show the page again" : "Expand the tool"}>
              ⤢
            </button>
            <button className="btn text-sm" onClick={close} aria-label={`Close ${label}`}>✕</button>
          </header>
          <ToolBody tool={tool} conceptId={activeConceptId} />
        </aside>
      )}
    </div>
  );
}
```

Add imports: `useRef`, `type ReactNode` from `react`. `usePathname` is no longer needed.

- [ ] **Step 3: Dock and shell**
- **`ToolDock.tsx`:** use `useToolState()`:
  - `aria-pressed={tool === t.id}`
  - on click:

```tsx
            onClick={(e) => {
              if (e.shiftKey) togglePin(t.id);
              else if (tool === t.id) close();
              else open(t.id);
            }}
```

  - title `` `${t.label}${mode ? " (Shift-click to pin in this mode)" : ""}` ``, with `mode` from `useUi((s) => s.workspaceMode)`.
- **`AppShell.tsx`:**
  - replace `<main …>…</main><ToolPanel />` with `<ToolSplit><main id="main" className="shell-main"><Hydrated>{children}</Hydrated></main></ToolSplit>`;
  - update the import (`ToolSplit` from `./ToolPanel`).
- **`SolveMode.tsx`:**
  - delete the `Split` and pinned-tools branch and return `sheet` directly;
  - remove the `split`, `onSplit` and `pinned` props and their imports.
  - Solve's paper now comes from the tool split: its default layout is `pinned: ["paper"], toolWidth: 0.5`.
- **`ConceptWorkspace.tsx`:** render `<SolveMode conceptId={conceptId} />`.
- **Keyboard:** make the `p` and `n` shortcuts in `CommandPalette.tsx` call `openPanel` (unchanged). They now open the split.

Replace the `.tool-panel` rule in `packages/ui/src/forma.css` with:

```css
.tool-split { flex: 1; min-width: 0; display: grid; align-items: stretch; }
.tool-split-page { min-width: 0; }
.tool-pane { border-left: 1.5px solid var(--ink); background: var(--paper-2); padding: 12px 14px; overflow: auto; max-height: calc(100vh - 110px); position: sticky; top: 50px; display: grid; gap: 12px; align-content: start; }
.tool-pane-head { display: flex; align-items: center; gap: 6px; }
.tool-pane-head h2 { margin-right: auto; }
@media (max-width: 900px) {
  .tool-split { grid-template-columns: minmax(0, 1fr) !important; }
  .tool-split .split-handle { display: none; }
  .tool-pane { position: fixed; inset: 0; z-index: 40; max-height: none; border-left: 0; }
}
```

and change `.shell-main` to `.shell-main { min-width: 0; padding: 20px 24px 32px; }` (the split now owns the flex growth).

In `components/paper/WorkingPaper.tsx`, make the compact drawing host fill the pane: ``compact ? "h-[calc(100vh-330px)] min-h-[360px]" : "h-[620px]"``.

- [ ] **Step 4: Run tests, both typechecks and the build**

Run: `pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A apps/web packages/ui && git commit -m "feat(web): tools open as a resizable, expandable split remembered per mode; full-screen sheet on phones"
```

---

### Task 4: Playwright for the Desk and tools; update existing specs

**Files:**
- Create: `app/apps/web/e2e/desk.spec.ts`, `app/apps/web/e2e/tools.spec.ts`
- Modify: `app/apps/web/e2e/modes.spec.ts` (the palette test's tool assertion)

- [ ] **Step 1: `e2e/desk.spec.ts`**

```ts
import { expect, test } from "@playwright/test";
import { concept, G, margin, next, open } from "./helpers";

test("the Desk continues to the exact plate step, and the countdown lives only there and in Revise", async ({ page }) => {
  await open(page, concept(G, "mode=learn&lesson=main&block=gauss"));
  await margin(page, "§1 Charge");
  await next(page);
  await margin(page, "§2 Field");
  await expect(page.locator(".status-footer")).not.toContainText("Finals");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "§2 Field" })).toBeVisible();
  await expect(page.getByText(/Finals in \d+ days/)).toBeVisible();
  await expect(page.getByText("StudyBuddy")).toHaveCount(0);
  await page.getByRole("link", { name: "Continue →" }).click();
  await margin(page, "§2 Field");
  await page.goto(concept(G, "mode=revise"));
  await expect(page.getByText(/Finals in \d+ days/)).toBeVisible();
});

test("first run points at the readiness check", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Start with a 5-minute readiness check" })).toBeVisible();
});
```

- [ ] **Step 2: `e2e/tools.spec.ts`**

```ts
import { expect, test } from "@playwright/test";
import { choose, concept, G, margin, next, open } from "./helpers";

test("a tool opens as a wide split without remounting the lesson, expands, and closes", async ({ page }) => {
  await open(page, concept(G, "mode=learn&lesson=main&block=gauss&step=2"));
  await margin(page, "§3 Surface");
  await choose(page, "Always outward");
  await next(page);
  await page.getByRole("slider", { name: "Your prediction, in µC" }).fill("2");
  await page.getByRole("button", { name: "Commit prediction" }).click();
  await expect(page.getByText("Measured")).toBeVisible();

  await page.getByRole("button", { name: "Working paper" }).click();
  const pane = page.getByRole("complementary", { name: "Tool: Working paper" });
  await expect(pane).toBeVisible();
  const vw = page.viewportSize()!.width;
  const box = (await pane.boundingBox())!;
  expect(box.width).toBeGreaterThan(vw * 0.35);
  expect(box.x + box.width).toBeLessThanOrEqual(vw + 1);
  await expect(page.getByText("Measured")).toBeVisible(); // lesson state survived

  await page.getByRole("button", { name: "Expand the tool" }).click();
  await expect(page.getByRole("complementary", { name: "Margin" })).toBeHidden();
  await page.getByRole("button", { name: "Show the page again" }).click();
  await page.getByRole("button", { name: "Close Working paper" }).click();
  await expect(pane).toHaveCount(0);
  await expect(page.getByText("Measured")).toBeVisible();
});

test("Solve opens with working paper pinned beside the problem; closing unpins it", async ({ page }) => {
  await open(page, concept("em1.electrostatics.gauss-applications", "mode=solve"));
  await expect(page.getByRole("complementary", { name: "Tool: Working paper" })).toBeVisible();
  await page.getByRole("button", { name: "Close Working paper" }).click();
  await page.waitForTimeout(400); // learner state saves on a 250 ms debounce
  await page.reload();
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("complementary", { name: "Tool: Working paper" })).toHaveCount(0);
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("a tool is a full-screen sheet you can close from the keyboard", async ({ page }) => {
    await open(page, concept(G, "mode=learn"));
    await page.getByRole("button", { name: "Formula sheet" }).click();
    const pane = page.getByRole("complementary", { name: "Tool: Formula sheet" });
    const box = (await pane.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(385);
    await page.getByRole("button", { name: "Close Formula sheet" }).focus();
    await page.keyboard.press("Enter");
    await expect(pane).toHaveCount(0);
  });
});
```

- [ ] **Step 3: Update `modes.spec.ts`**: in the palette test, change the last assertion to `await expect(page.getByRole("complementary", { name: "Tool: Working paper" })).toBeVisible();`.

- [ ] **Step 4: Run the whole e2e suite**

Run: `cd /f/StudyBuddy/app/apps/web && pnpm e2e`
Expected: all pass. The a11y spec already scans `/` and every mode in both themes, which covers the new Desk and panes. The visual baselines don't include the Desk or panes, so they are unchanged.

- [ ] **Step 5: Commit**

```bash
git add -A apps/web && git commit -m "test(e2e): Desk continue and countdown placement; tool split, pin, expand, phone sheet"
```

---

### Task 5: Verification and handoff

- [ ] **Step 1:** Run `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`. Expected: all green.
- [ ] **Step 2:** Open `/` and `/c/em1/em1.electrostatics.gauss-law?mode=learn` in the built-in browser at 1360×900 and at 390×844. Open paper, drag the split, expand and close it. Fix anything visibly broken and record it in the commit message.
- [ ] **Step 3:** In `app/README.md` "Using Forma", add: "Tools open as a resizable split (Shift-click or Pin keeps one open per mode; ⤢ expands; on phones they open full-screen)." Commit with `git commit -m "docs: Desk and tools"`.

---

## Self-Review Notes

- **Spec coverage:** spec §2 in full.
  - Desk A: continue with a live thumbnail (Task 2), due today with the countdown line only (Task 2), route strip and recent notes (Task 2), the hero, 3D toy and duplicate blocks removed (Task 2).
  - Countdown out of the footer and into Revise (Task 2).
  - Tools: resizable split, 45%/50% defaults, handle and keys, expand and close, one tool, pin per mode, re-fit, phone sheet (Tasks 1 and 3).
  - Tests (Task 4).
- **Type consistency:**
  - `toolWidth` is defined in Task 1 and used by `useToolState` in Task 3.
  - `deskContinue` (Task 2) is consumed only by `DeskScreen`.
  - `ToolBody` is kept with its existing signature.
  - `SolveMode`'s props shrink to `{ conceptId }`, and `ConceptWorkspace` is updated in the same task.
- **Known ceiling:** the Desk thumbnail shows the authored step state, not the learner's unsaved overrides (those aren't persisted outside snapshots).
