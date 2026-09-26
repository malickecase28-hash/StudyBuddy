# Forma Plan B: Interface (identity, plate renderer, shell, modes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Forma usable. Build the identity system as `@forma/ui`, draw plates as living SVG on engineering paper, and replace the StudyBuddy shell with the Forma shell: top bar, tool dock, ⌘K and title-block footer. Deliver the four modes (Learn, Solve, Explore, Revise) on the Plan A core, with Playwright, axe and visual tests.

**Architecture:**
- `@forma/ui` owns the tested palette. `themeCss()` generates the CSS that ships, so the contrast tests cover exactly what users see.
- `@forma/ui` also owns the fonts' CSS, the wordmark and mark, and small token-driven primitives.
- Pure view helpers live in `@forma/plate`: 2D projection, surface outlines, playback rules, and the text the device reader speaks.
- React views are registered by the app (`apps/web/components/plate`). They render only model output and params.
- The concept workspace (`/c/[course]/[concept]?mode=`) composes the modes. Classic block lessons keep their v1 renderer.

**Tech Stack:** Next.js 16, React 19.3, Tailwind 4, Zag.js 1.44 (dialog), KaTeX 0.18, Zustand 5 + Dexie 4, `@fontsource/*` (OFL, self-hosted), Vitest 5, Playwright 1.63 + axe.

**Spec:** `docs/superpowers/specs/2026-09-25-forma-identity-shell-plate-engine-design.md` (§1, §3, §4.3–4.7, §5, §6, §8, §10). It builds on Plan A (`docs/superpowers/plans/2026-09-25-forma-plan-a-core.md`, merged locally, PR #1).

## Decisions for review (deviations from the spec's library list, each YAGNI-driven)

| # | Spec says | This plan does | Why / when to revisit |
|---|---|---|---|
| D1 | Equations render with MathLive | Equations render with **KaTeX**, which is already installed and supports `\htmlClass` term keys. The Compute Engine is used for checking and the calculator. | No plate step uses `build-equation` yet. Add MathLive with the first `build-equation` content (sub-project 3). |
| D2 | `Plot2D` via JSXGraph | The `field-profile` plot is drawn as an **SVG inset** from model points. | A static curve needs no plotting library. Add JSXGraph when a learner must manipulate a function plot. |
| D3 | 3D "engraving" view (R3F) when `view: "3d"` | **Deferred.** No authored step declares `view: "3d"`. The v1 R3F `GaussLab` stays for classic lessons and the Desk. | Build it with the first step that needs rotation to teach. |
| D4 | Canvas fallback beyond ~2k SVG elements | **Not built.** Arrow density is capped by the quality tier: `grid ≤ 9`, so at most 81 arrows in the x–z plane, plus a 96-point outline. | Revisit if a plate exceeds ~2k elements. |
| D5 | All nine interaction types render | Renders `predict-drag`, `manipulate-goal`, `place`, `choose`, `numeric` and `identify`. A test fails if any plate uses `build-equation`, `step-solve` or `sketch`. | Each arrives with its first content. |

## Global Constraints

- **Runtime:** zero network or LLM calls. Fonts are bundled from `@fontsource/*`, with no Google Fonts requests.
- **Colour:**
  - Colour tokens come only from `@forma/ui` `themeCss()`. Components use `var(--…)` and never hex literals (tested for plate views).
  - Semantic meaning: `--charge` vermilion Q, `--field` viridian E, `--flux` ultramarine D/Ψ, `--surface` ochre surfaces/normals/"take another look", `--ok` confirmed (always with ✓).
  - Colour is never the only carrier of meaning. Contrast minimums:
    - ink ≥ 7:1;
    - graphite and semantic *text* variants ≥ 4.5:1;
    - semantic strokes and focus ≥ 3:1 on `--paper` and `--paper-2`.
- **Type:** Source Serif 4 (reading, notes, headings), IBM Plex Sans (UI), IBM Plex Mono (readouts and labels, uppercase labels tracked 0.18 em).
- **Wordmark geometry:** exactly spec §1.2 (cap 120, stroke 24, gap 20, offsets F 0 / O 116 / R 256 / M 378 / A 518). The F alone is the mark.
- **Plates:**
  - Views render only `Evaluated` params and model. They never call `@forma/physics`.
  - The SVG scale is `PX = 100` px/m on the x–z plane (x right, z up).
  - Motion: a step transition takes 900 ms through `frameAt`. `prefers-reduced-motion`, or the setting `motion: "reduced"`, snaps it.
- **Text:** the margin note is ≤ 60 words (already linted). Readouts use mono, value + unit, and "—" when undefined.
- **Shortcuts:**
  - ← / → step
  - Space play/pause
  - 1–4 mode
  - P paper, N notebook
  - ⌘K / Ctrl+K palette
  - Shortcuts never fire while focus is in a text field or a range input, or when a focused handle already used the key.
- **Commands** run from `F:\StudyBuddy\app` unless stated. Commit after each task.

## Review Focus

1. **A learner override on a param that the next step also patches** (e.g. the learner drags q2, then §6 replaces `q.items`). While the override exists it wins at every timeline position, and Reset returns exactly to the authored state. Tested in Task 3 (`applyOverrides` over `frameAt` at fractional positions).
2. **A predict-drag target readout must not be visible before the learner commits,** or the prediction is spoiled. `hiddenReadouts` hides it until the interaction is answered. Tested in Task 3.
3. **Switching theme mid-lesson** must recolour every plate stroke. Plate views may not contain hex colour literals. Tested in Task 7 by a source scan.
4. **Deep links with junk params** (`?mode=dance`, `?lesson=nope`, `?snapshot=missing`) fall back to the last mode, the main lesson and no snapshot, and never crash. Tested in Task 13 (`parseWorkspaceParams`).
5. **Reduced motion:** stepping lands on the next state immediately, with no requestAnimationFrame tween. Tested in Task 14 (Playwright with `reducedMotion: "reduce"`).

---

## File Structure

```
app/
  vitest.config.ts                         + apps/web/test, "@" alias
  tsconfig.json                            + jsx, dom lib (for packages/ui)
  packages/
    ui/                                    NEW @forma/ui
      src/contrast.ts                      luminance, contrast, mix, textVariant
      src/tokens.ts                        THEMES, SEMANTIC, textColours, themeCss
      src/format.ts                        formatValue (instrument numbers)
      src/palette.ts                       Command, rankCommands
      src/Wordmark.tsx                     Wordmark, Mark
      src/primitives.tsx                   Readout, TitleBlock, MarginNote, Segmented, Timeline
      src/forma.css                        type, primitives, plate linework classes
      src/index.ts
      test/{tokens,format,palette}.test.ts
    plate/src/geometry2d.ts                PX, VIEWBOX, toSvg, fromSvg, outline, outlineNormals, pathD
    plate/src/playback.ts                  lockIndex, gradePrediction, applyOverrides, hiddenReadouts, readAloudText
    plate/src/components/em.ts             (+ gaussian-surface `outline` model output)
    plate/test/{geometry2d,playback}.test.ts
    engine/src/learner-state.ts            (+ seedOf, withNextSeed, withLayout)
    engine/src/symbolic.ts                 (+ evaluateNumeric)
    course-em1/src/labs.ts                 Explore labs: plate, controls, experiments
    course-em1/src/templates.ts            (+ templatesFor)
    course-em1/src/plates/{gauss,detours}.ts   (per-stage equation speech; "blue" outflow wording)
  apps/web/
    app/layout.tsx                         themeCss, fonts, Forma metadata
    app/icon.svg                           the F mark
    app/courses/page.tsx                   Library
    app/c/[course]/page.tsx                Course overview
    app/c/[course]/[concept]/page.tsx      Concept workspace
    components/plate/{stage-context,views2d,PlateStage,Readouts,interactions,PlatePlayer}.tsx
    components/workspace/{ConceptWorkspace,Split,LearnMode,SolveMode,ExploreMode,ReviseMode}.tsx
    components/shell/{AppShell,ToolDock,ToolPanel,CommandPalette,Calculator}.tsx
    components/paper/WorkingPaper.tsx      extracted from app/paper/page.tsx
    components/map/ConceptMap.tsx          extracted from app/map/page.tsx
    lib/{playback,commands,workspace}.ts
    lib/course.ts                          (lessonHref routes plate lessons to the workspace; lessonForPlate)
    lib/store.ts, lib/ui.ts                (modes, layouts, seeds, tool panel, palette)
    test/{views,interactions,commands,workspace,course}.test.ts
    e2e/{journey,modes,a11y,visual}.spec.ts
```

---

### Task 1: `@forma/ui` palette, contrast and theme CSS

**Files:**
- Create: `app/packages/ui/package.json`, `src/contrast.ts`, `src/tokens.ts`, `src/index.ts`
- Modify: `app/tsconfig.json` (`"jsx": "react-jsx"`, `"lib": ["es2022", "dom", "dom.iterable"]`)
- Test: `app/packages/ui/test/tokens.test.ts`

**Interfaces:**
- Produces:
  - `luminance(hex): number`, `contrast(a, b): number`, `mix(a, b, t): string` (upper-case `#RRGGBB`), `textVariant(fg, ink, backgrounds, min = 4.5): string`
  - `ThemeName = "paper" | "blueprint" | "contrast"`
  - `SEMANTIC = ["charge", "field", "flux", "surface", "ok"] as const`
  - `Palette = { ink; paper; paper2; grid; graphite; focus } & Record<Semantic, string>`
  - `THEMES: Record<ThemeName, Palette>`, `textColours(p): Record<Semantic, string>`
  - `themeCss(): string` emits `--ink --paper --paper-2 --grid --graphite --focus --<semantic> --<semantic>-text`, plus legacy aliases (`--bg --bg-raised --bg-sunken --ink-soft --ink-faint --line --sem-* --look-again-* --confirmed-* --lab-bg --system-error`) so classic screens re-skin.

- [ ] **Step 1: Package and compiler options**

`app/packages/ui/package.json`:

```json
{
  "name": "@forma/ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts", "./forma.css": "./src/forma.css" },
  "dependencies": { "@zag-js/dialog": "1.44.0", "@zag-js/react": "1.44.0" },
  "peerDependencies": { "react": "19.3.0" },
  "devDependencies": { "@types/react": "^19.3.0", "react": "19.3.0" }
}
```

In `app/tsconfig.json` `compilerOptions`, set `"lib": ["es2022", "dom", "dom.iterable"]` and add `"jsx": "react-jsx"`. Run `pnpm install`.

- [ ] **Step 2: Write the failing test**: `app/packages/ui/test/tokens.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { contrast, mix } from "../src/contrast";
import { SEMANTIC, textColours, themeCss, THEMES } from "../src/tokens";

describe("contrast", () => {
  it("matches WCAG reference values", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });
  it("mixes hex colours", () => {
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });
});

describe.each(Object.entries(THEMES))("%s theme", (_, p) => {
  const grounds = [p.paper, p.paper2];
  it("ink reads at 7:1 and graphite at 4.5:1", () => {
    for (const g of grounds) {
      expect(contrast(p.ink, g)).toBeGreaterThanOrEqual(7);
      expect(contrast(p.graphite, g)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("semantic strokes reach 3:1 (WCAG 1.4.11) and their text variants 4.5:1", () => {
    const t = textColours(p);
    for (const k of SEMANTIC)
      for (const g of grounds) {
        expect(contrast(p[k], g), k).toBeGreaterThanOrEqual(3);
        expect(contrast(t[k], g), `${k}-text`).toBeGreaterThanOrEqual(4.5);
      }
  });
  it("the focus ring reaches 3:1", () => {
    for (const g of grounds) expect(contrast(p.focus, g)).toBeGreaterThanOrEqual(3);
  });
});

it("themeCss emits every theme, semantic text variants and legacy aliases", () => {
  const css = themeCss();
  for (const t of Object.keys(THEMES)) expect(css).toContain(`[data-theme="${t}"]`);
  expect(css).toContain("--charge-text:");
  expect(css).toContain("--sem-flux:var(--flux)");
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm vitest run packages/ui`
Expected: FAIL (cannot resolve `../src/contrast`).

- [ ] **Step 4: Implement `src/contrast.ts`**

```ts
const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? [...h].map((x) => x + x).join("") : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)) as [number, number, number];
};
const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map(channel) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export function mix(a: string, b: string, t: number): string {
  const A = rgb(a);
  const B = rgb(b);
  return `#${A.map((v, i) => Math.round(v + (B[i]! - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** The lightest shade of fg, mixed toward ink in 5% steps, that reads as text on every background. */
export function textVariant(fg: string, ink: string, backgrounds: readonly string[], min = 4.5): string {
  for (let k = 0; k <= 20; k++) {
    const c = mix(fg, ink, k / 20);
    if (backgrounds.every((bg) => contrast(c, bg) >= min)) return c;
  }
  return ink;
}
```

- [ ] **Step 5: Implement `src/tokens.ts`**

```ts
import { textVariant } from "./contrast";

export type ThemeName = "paper" | "blueprint" | "contrast";
export const SEMANTIC = ["charge", "field", "flux", "surface", "ok"] as const;
export type Semantic = (typeof SEMANTIC)[number];
export type Palette = { ink: string; paper: string; paper2: string; grid: string; graphite: string; focus: string } & Record<Semantic, string>;

/** Spec §1.4. Paper is the owner-approved palette; Blueprint and High-contrast keep the same meanings. */
export const THEMES: Record<ThemeName, Palette> = {
  paper: {
    ink: "#1B1F24", paper: "#F3EFE6", paper2: "#FBF8F1", grid: "#E4DDCD", graphite: "#5E6167", focus: "#2B47C9",
    charge: "#C8412B", field: "#1F7A64", flux: "#2B47C9", surface: "#A8761A", ok: "#2E7D4F",
  },
  blueprint: {
    ink: "#E8EEF6", paper: "#12233A", paper2: "#18304D", grid: "#22406A", graphite: "#A9B8CC", focus: "#F2C063",
    charge: "#FF8A70", field: "#5FD3AE", flux: "#8FA8FF", surface: "#F2C063", ok: "#6FDB98",
  },
  contrast: {
    ink: "#000000", paper: "#FFFFFF", paper2: "#FFFFFF", grid: "#BDBDBD", graphite: "#262626", focus: "#0026B3",
    charge: "#A3001B", field: "#005A45", flux: "#0026B3", surface: "#6B4400", ok: "#005C2A",
  },
};

export const textColours = (p: Palette) =>
  Object.fromEntries(SEMANTIC.map((k) => [k, textVariant(p[k], p.ink, [p.paper, p.paper2])])) as Record<Semantic, string>;

function vars(p: Palette): string {
  const text = textColours(p);
  const own: Record<string, string> = {
    ink: p.ink, paper: p.paper, "paper-2": p.paper2, grid: p.grid, graphite: p.graphite, focus: p.focus,
    ...Object.fromEntries(SEMANTIC.flatMap((k) => [[k, p[k]], [`${k}-text`, text[k]]])),
  };
  // Legacy names used by the classic (v1) screens, mapped onto Forma tokens.
  const legacy: Record<string, string> = {
    bg: "var(--paper)", "bg-raised": "var(--paper-2)", "bg-sunken": "var(--grid)",
    "ink-soft": "var(--graphite)", "ink-faint": "var(--graphite)",
    line: "color-mix(in srgb, var(--ink) 18%, var(--paper))",
    "sem-charge": "var(--charge)", "sem-field": "var(--field)", "sem-flux": "var(--flux)", "sem-surface": "var(--surface)", "sem-confirmed": "var(--ok)",
    "look-again-bg": "color-mix(in srgb, var(--surface) 12%, var(--paper-2))", "look-again-line": "var(--surface)", "look-again-ink": "var(--surface-text)",
    "confirmed-bg": "color-mix(in srgb, var(--ok) 12%, var(--paper-2))", "confirmed-line": "var(--ok)", "confirmed-ink": "var(--ok-text)",
    "lab-bg": "var(--paper-2)", "system-error": "var(--charge-text)",
  };
  return Object.entries({ ...own, ...legacy }).map(([k, v]) => `--${k}:${v};`).join("");
}

/** The CSS that ships. Generated from THEMES so the contrast tests cover exactly what users see. */
export const themeCss = () =>
  [
    `:root,[data-theme="paper"]{${vars(THEMES.paper)}}`,
    `[data-theme="blueprint"]{${vars(THEMES.blueprint)}}`,
    `[data-theme="contrast"]{${vars(THEMES.contrast)}}`,
  ].join("\n");
```

`src/index.ts`:

```ts
export * from "./contrast";
export * from "./tokens";
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run packages/ui && pnpm typecheck`
Expected: PASS. If a Blueprint or High-contrast value misses a threshold, adjust that **hex value** (never the threshold) and re-run. Paper's values are the owner's and must pass as given.

- [ ] **Step 7: Commit**

```bash
git add packages/ui tsconfig.json pnpm-lock.yaml && git commit -m "feat(ui): Forma palette with tested contrast and generated theme CSS"
```

---

### Task 2: `@forma/ui` wordmark, instrument formatting, primitives, command ranking, CSS

**Files:**
- Create: `app/packages/ui/src/format.ts`, `src/palette.ts`, `src/Wordmark.tsx`, `src/primitives.tsx`, `src/forma.css`
- Modify: `app/packages/ui/src/index.ts`
- Test: `app/packages/ui/test/format.test.ts`, `app/packages/ui/test/palette.test.ts`

**Interfaces:**
- Produces:
  - `formatValue(v: number | null, digits = 4): string`
  - `Command = { id: string; label: string; group: string; keywords?: string }`; `rankCommands<C extends Command>(query, commands, limit = 12): C[]`
  - `Wordmark({ height?, title? })`, `Mark({ size?, title? })`
  - `Readout({ label, value: number | null, unit, digits?, tone? })`, `TitleBlock({ cells })`, `MarginNote({ kicker, title, children })`, `Segmented<T>({ label, value, options, onChange })`
  - `Timeline({ steps: { id; title }[], pos, lock, playing, onScrub(pos), onTogglePlay() })`
  - `@forma/ui/forma.css`

- [ ] **Step 1: Write the failing tests**

`app/packages/ui/test/format.test.ts`:

```ts
import { expect, it } from "vitest";
import { formatValue } from "../src/format";

it("formats instrument readouts with 4 significant figures", () => {
  expect(formatValue(2)).toBe("2");
  expect(formatValue(-3)).toBe("-3");
  expect(formatValue(0)).toBe("0");
  expect(formatValue(0.159155)).toBe("0.1592");
  expect(formatValue(4493.8)).toBe("4494");
  expect(formatValue(1.5e-7)).toBe("1.500×10⁻⁷");
  expect(formatValue(123456)).toBe("1.235×10⁵");
  expect(formatValue(null)).toBe("—");
  expect(formatValue(Number.NaN)).toBe("—");
});
```

`app/packages/ui/test/palette.test.ts`:

```ts
import { expect, it } from "vitest";
import { rankCommands } from "../src/palette";

const cmds = [
  { id: "a", label: "Gauss's Law · Learn", group: "Concepts" },
  { id: "b", label: "Applications of Gauss's Law · Solve", group: "Concepts" },
  { id: "c", label: "Working paper", group: "Tools", keywords: "draw sketch" },
  { id: "d", label: "Explore mode", group: "Modes" },
];

it("ranks label-prefix matches first and requires every term", () => {
  expect(rankCommands("", cmds)).toHaveLength(4);
  expect(rankCommands("gauss", cmds).map((c) => c.id)).toEqual(["a", "b"]);
  expect(rankCommands("gau sol", cmds).map((c) => c.id)).toEqual(["b"]);
  expect(rankCommands("sketch", cmds).map((c) => c.id)).toEqual(["c"]);
  expect(rankCommands("zzz", cmds)).toEqual([]);
  expect(rankCommands("", cmds, 2)).toHaveLength(2);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run packages/ui`
Expected: FAIL (cannot resolve `../src/format`, `../src/palette`).

- [ ] **Step 3: Implement `src/format.ts` and `src/palette.ts`**

```ts
const SUP: Record<string, string> = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };

/** Instrument-style number: `digits` significant figures, scientific (×10ⁿ) outside [1e-3, 1e5). */
export function formatValue(v: number | null, digits = 4): string {
  if (v === null || !Number.isFinite(v)) return "—";
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e-3 && a < 1e5) return String(Number(v.toPrecision(digits)));
  const [m, e] = v.toExponential(digits - 1).split("e") as [string, string];
  return `${m}×10${String(Number(e)).replace(/./g, (c) => SUP[c] ?? c)}`;
}
```

```ts
export type Command = { id: string; label: string; group: string; keywords?: string };

const words = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Every query term must prefix some word; label-prefix beats word-prefix beats the rest; ties keep input order. */
export function rankCommands<C extends Command>(query: string, commands: readonly C[], limit = 12): C[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands.slice(0, limit);
  const terms = words(q);
  return commands
    .flatMap((c, i) => {
      const hay = words(`${c.label} ${c.keywords ?? ""} ${c.group}`);
      if (!terms.every((t) => hay.some((w) => w.startsWith(t)))) return [];
      const label = c.label.toLowerCase();
      const score = label.startsWith(q) ? 0 : words(label).some((w) => w.startsWith(terms[0]!)) ? 1 : 2;
      return [{ c, i, score }];
    })
    .sort((a, b) => a.score - b.score || a.i - b.i)
    .slice(0, limit)
    .map((s) => s.c);
}
```

- [ ] **Step 4: Implement `src/Wordmark.tsx`** (geometry verbatim from spec §1.2)

```tsx
const LETTERS: { x: number; d: string[]; evenodd?: boolean }[] = [
  { x: 0, d: ["M0 0 H84 A12 12 0 0 1 84 24 H0 Z", "M0 120 V58 A24 24 0 0 1 24 34 H72 A12 12 0 0 1 72 58 H24 V120 Z"] },
  { x: 116, d: ["M60 0 A60 60 0 1 1 59.99 0 Z M60 24 A36 36 0 1 0 60.01 24 Z"], evenodd: true },
  { x: 256, d: ["M0 0 H24 V120 H0 Z", "M24 0 H62 A34 34 0 0 1 62 68 H24 V44 H62 A10 10 0 0 0 62 24 H24 Z", "M42 68 H68 L102 120 H76 Z"] },
  { x: 378, d: ["M0 120 V0 H22 L60 42 L98 0 H120 V120 H96 V38 L60 78 L24 38 V120 Z"] },
  { x: 518, d: ["M0 120 L44 0 H68 L112 120 H86 L56 36 L26 120 Z"] },
];

const glyph = (l: (typeof LETTERS)[number]) => (
  <g key={l.x} transform={`translate(${l.x} 0)`}>
    {l.d.map((d) => (
      <path key={d} d={d} fillRule={l.evenodd ? "evenodd" : undefined} />
    ))}
  </g>
);

/** FORMA on the 120-unit cap grid. `height` is the rendered height in px (cap ≥ 16 px ⇒ height ≥ 19). */
export function Wordmark({ height = 20, title = "Forma" }: { height?: number; title?: string }) {
  return (
    <svg viewBox="-12 -12 654 144" height={height} role="img" aria-label={title} fill="currentColor">
      {LETTERS.map(glyph)}
    </svg>
  );
}

/** The F alone: favicon, app icon, avatar fallback. */
export function Mark({ size = 24, title = "Forma" }: { size?: number; title?: string }) {
  return (
    <svg viewBox="-12 -12 120 144" height={size} role="img" aria-label={title} fill="currentColor">
      {glyph(LETTERS[0]!)}
    </svg>
  );
}
```

- [ ] **Step 5: Implement `src/primitives.tsx`**

```tsx
"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { formatValue } from "./format";

export function Readout({ label, value, unit, digits = 4, tone }: { label: string; value: number | null; unit: string; digits?: number; tone?: "charge" | "field" | "flux" | "surface" }) {
  return (
    <div className="readout" data-tone={tone}>
      <span className="readout-label">{label}</span>
      <output className="readout-value">
        {formatValue(value, digits)}
        {value !== null && Number.isFinite(value) && <span className="readout-unit"> {unit}</span>}
      </output>
      {(value === null || !Number.isFinite(value)) && <span className="sr-only">undefined at this point</span>}
    </div>
  );
}

export function TitleBlock({ cells }: { cells: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="title-block">
      {cells.map((c) => (
        <div key={c.label}>
          <dt>{c.label}</dt>
          <dd>{c.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MarginNote({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="margin-note" aria-label={title}>
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
      <div className="margin-body">{children}</div>
    </section>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  const move = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = options[(i + d + options.length) % options.length]!;
    onChange(next[0]);
    ((e.currentTarget.parentElement?.children[(i + d + options.length) % options.length]) as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="segmented">
      {options.map(([v, l], i) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} tabIndex={value === v ? 0 : -1} onClick={() => onChange(v)} onKeyDown={(e) => move(e, i)}>
          {l}
        </button>
      ))}
    </div>
  );
}

/** Scrub bar: a native range (continuous, keyboard-operable) plus § ticks. Positions past `lock` are unreachable. */
export function Timeline({ steps, pos, lock, playing, onScrub, onTogglePlay }: { steps: { id: string; title: string }[]; pos: number; lock: number; playing: boolean; onScrub: (pos: number) => void; onTogglePlay: () => void }) {
  const i = Math.min(Math.round(pos), steps.length - 1);
  return (
    <div className="timeline">
      <button type="button" className="btn" onClick={onTogglePlay} aria-label={playing ? "Pause" : "Play to the next step"}>
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="timeline-track">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          step="any"
          value={pos}
          aria-label="Lesson timeline"
          aria-valuetext={`§${i + 1} of ${steps.length}: ${steps[i]?.title ?? ""}`}
          onChange={(e) => onScrub(Math.min(Number(e.target.value), lock))}
        />
        <ol className="timeline-ticks">
          {steps.map((s, k) => (
            <li key={s.id}>
              <button type="button" disabled={k > lock} aria-current={k === i ? "step" : undefined} onClick={() => onScrub(k)}>
                §{k + 1}
                <span className="sr-only"> {s.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

`src/index.ts` becomes:

```ts
export * from "./contrast";
export * from "./tokens";
export * from "./format";
export * from "./palette";
export * from "./Wordmark";
export * from "./primitives";
```

- [ ] **Step 6: `src/forma.css`** (type, primitives, plate linework; token-only)

```css
:root {
  --font-read: "Source Serif 4", Georgia, serif;
  --font-ui: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
body { background: var(--paper); color: var(--ink); font-family: var(--font-ui); }
h1, h2, h3 { font-family: var(--font-read); font-weight: 600; letter-spacing: -0.01em; }
.label, .kicker, .readout-label, .title-block dt, .plate-label {
  font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.68rem; color: var(--graphite);
}
.plate-label { text-transform: none; letter-spacing: 0.04em; font-size: 11px; fill: var(--graphite); }

.readout { display: grid; gap: 2px; padding: 6px 10px; border-left: 2px solid var(--ink); }
.readout[data-tone="flux"] { border-color: var(--flux); }
.readout[data-tone="charge"] { border-color: var(--charge); }
.readout[data-tone="surface"] { border-color: var(--surface); }
.readout[data-tone="field"] { border-color: var(--field); }
.readout-value { font-family: var(--font-mono); font-size: 1.15rem; font-variant-numeric: tabular-nums; }
.readout-unit { color: var(--graphite); font-size: 0.85em; }

.title-block { display: flex; flex-wrap: wrap; border: 1.5px solid var(--ink); background: var(--paper-2); }
.title-block > div { padding: 6px 12px; border-right: 1.5px solid var(--ink); }
.title-block > div:last-child { border-right: 0; }
.title-block dd { font-family: var(--font-mono); font-size: 0.85rem; }

.margin-note { display: grid; gap: 10px; }
.margin-note h2 { font-size: 1.5rem; line-height: 1.2; }
.margin-body { font-family: var(--font-read); font-size: 1.06rem; line-height: 1.6; max-width: 46ch; }
.margin-body details > summary { cursor: pointer; font-family: var(--font-ui); font-size: 0.9rem; color: var(--flux-text); }

.segmented { display: inline-flex; border: 1.5px solid var(--ink); }
.segmented > button { padding: 4px 12px; font-size: 0.85rem; }
.segmented > button + button { border-left: 1.5px solid var(--ink); }
.segmented > button[aria-checked="true"] { background: var(--ink); color: var(--paper); }

.timeline { display: flex; align-items: center; gap: 12px; }
.timeline-track { flex: 1; display: grid; gap: 4px; }
.timeline-track input[type="range"] { width: 100%; accent-color: var(--flux); }
.timeline-ticks { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 0.72rem; }
.timeline-ticks button[aria-current="step"] { color: var(--flux-text); font-weight: 600; }
.timeline-ticks button:disabled { opacity: 0.45; }

/* Plate linework (spec §1.5): 1.2–1.6 px ink lines, hatching, dashed dimensions. */
.plate { position: relative; margin: 0; }
.plate-svg { width: 100%; height: auto; display: block; background: var(--paper-2); border: 1.5px solid var(--ink); }
.plate-svg * { vector-effect: non-scaling-stroke; }
.grid-line { stroke: var(--grid); stroke-width: 1; }
.ink { stroke: var(--ink); stroke-width: 1.4; }
.ink-graphite { stroke: var(--graphite); stroke-width: 1.2; }
.ink-charge { stroke: var(--charge); stroke-width: 1.4; }
.ink-flux { stroke: var(--flux); stroke-width: 1.3; }
.ink-field { stroke: var(--field); stroke-width: 1.3; }
.ink-surface { stroke: var(--surface); stroke-width: 1.6; }
.fill-charge { fill: var(--charge); }
.ring-charge { fill: var(--paper-2); stroke: var(--charge); stroke-width: 2; }
.fill-charge-soft { fill: color-mix(in srgb, var(--charge) 18%, var(--paper-2)); }
.fill-paper { fill: var(--paper-2); }
.charge-sign { fill: var(--paper-2); font-family: var(--font-mono); font-size: 12px; font-weight: 600; }
.ring-charge + .charge-sign { fill: var(--charge); }
.shade-out { stroke: var(--flux); stroke-width: 6; }
.shade-in { stroke: var(--surface); stroke-width: 6; }
.inset { fill: var(--paper-2); stroke: var(--ink); stroke-width: 1; }
.handle { cursor: grab; }
.handle:focus-visible { outline: none; }
.handle:focus-visible .handle-ring, .handle:hover .handle-ring { stroke: var(--focus); stroke-width: 2; }
.handle-ring { fill: none; stroke: var(--graphite); stroke-dasharray: 3 3; }
.plate-instance[data-highlight="true"] { filter: drop-shadow(0 0 3px var(--focus)); }
.plate-equation { position: absolute; left: 14px; top: 10px; padding: 4px 10px; background: color-mix(in srgb, var(--paper-2) 88%, transparent); font-size: 1.1rem; }
.plate-equation [class*="t-"] { cursor: pointer; }
@media (prefers-reduced-motion: reduce) { .plate * { transition: none !important; animation: none !important; } }
```

- [ ] **Step 7: Run tests**

Run: `pnpm vitest run packages/ui && pnpm typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/ui && git commit -m "feat(ui): wordmark and mark, instrument formatting, primitives, command ranking, plate CSS"
```

---

### Task 3: Plate view geometry and playback rules (pure)

**Files:**
- Create: `app/packages/plate/src/geometry2d.ts`, `app/packages/plate/src/playback.ts`
- Modify: `app/packages/plate/src/components/em.ts` (gaussian-surface adds `outline`), `app/packages/plate/src/index.ts`
- Test: `app/packages/plate/test/geometry2d.test.ts`, `app/packages/plate/test/playback.test.ts`

**Interfaces:**
- Consumes: `blobRadius`, `contains`, `fluxDensity`, `SurfaceShape`, `Vec3` (`@forma/physics`); `PlateDef`, `frameAt`, `stateAt`, `SceneState`.
- Produces:
  - `PX = 100`; `VIEWBOX = { x: -260, y: -190, w: 520, h: 380 }`
  - `toSvg(p): [number, number]` maps (x, z) to SVG with z up; `fromSvg(x, y): Vec3`
  - `outline(shape, n = 96): Vec3[]` gives the counter-clockwise cross-section in the x–z plane through the centre; `outlineNormals(pts, center): Vec3[]`; `pathD(pts, closed = true): string`
  - The gaussian-surface model adds `outline: { p: Vec3; n: Vec3; dn: number | null }[]`, where `dn` = D·n in µC/m² (`null` where undefined)
  - `Overrides = Record<string, { params?: Record<string, unknown>; visible?: boolean }>`
  - `lockIndex(plate, answered: ReadonlySet<string>): number`
  - `gradePrediction(guess, truth, relTol, range): "close" | "far"`
  - `applyOverrides(state, overrides): SceneState`
  - `hiddenReadouts(plate, index, answered): { instance: string; readout: string }[]`
  - `readAloudText(plate, index): string`

- [ ] **Step 1: Write the failing tests**

`app/packages/plate/test/geometry2d.test.ts`:

```ts
import { contains, vec, type SurfaceShape } from "@forma/physics";
import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, fromSvg, outline, outlineNormals, pathD, PlateDef, Registry, stateAt, toSvg } from "../src";

describe("projection", () => {
  it("maps x right and z up, and round-trips", () => {
    expect(toSvg([1, 0, 0.5])).toEqual([100, -50]);
    expect(fromSvg(...toSvg([0.25, 0, -1.5]))).toEqual([0.25, 0, -1.5]);
    expect(pathD([[0, 0, 0], [1, 0, 0]], false)).toBe("M0.00 0.00 L100.00 0.00");
  });
});

describe("outlines lie on the surface", () => {
  const onSurface = (s: SurfaceShape, p: number[]) => {
    const scaled = (k: number): SurfaceShape =>
      s.kind === "cube" ? { ...s, side: s.side * k } : s.kind === "cylinder" ? { ...s, radius: s.radius * k, height: s.height * k } : { ...s, radius: s.radius * k };
    return contains(scaled(1.001), p as never) && !contains(scaled(0.999), p as never);
  };
  const shapes: SurfaceShape[] = [
    { kind: "sphere", center: vec(0.2, 0, -0.1), radius: 1 },
    { kind: "cube", center: vec(0, 0, 0), side: 1.5 },
    { kind: "cylinder", center: vec(0, 0, 0), radius: 0.6, height: 2 },
    { kind: "blob", center: vec(0, 0, 0), radius: 1, amplitude: 0.2, lobes: 3 },
  ];
  for (const s of shapes)
    it(`${s.kind}: every point is on the surface and normals point outward`, () => {
      const pts = outline(s, 96);
      expect(pts).toHaveLength(96);
      for (const p of pts) expect(onSurface(s, p), `${s.kind} ${p}`).toBe(true);
      const ns = outlineNormals(pts, s.center);
      ns.forEach((n, i) => {
        expect(Math.hypot(n[0], n[2])).toBeCloseTo(1, 9);
        expect(n[0] * (pts[i]![0] - s.center[0]) + n[2] * (pts[i]![2] - s.center[2])).toBeGreaterThan(0);
      });
    });
});

describe("gaussian-surface outline model", () => {
  const registry = new Registry().register(...emComponents);
  const plate = (items: unknown[]) =>
    PlateDef.parse({
      id: "t", title: "t",
      instances: [
        { id: "q", component: "charges", params: { items }, visible: true },
        { id: "s", component: "gaussian-surface", params: { size: 1 }, links: { charges: "q" }, visible: true },
      ],
      steps: [{ id: "s1", title: "t", note: "n" }],
    });
  it("a centred charge gives D·n = q/(4πr²) all round", () => {
    const p = plate([{ id: "a", kind: "point", q: 2, pos: [0, 0, 0] }]);
    const o = createEvaluator(registry, p.instances)(stateAt(p, 0)).s!.model.outline as { dn: number }[];
    for (const s of o) expect(s.dn).toBeCloseTo(2 / (4 * Math.PI), 6);
  });
  it("an outside charge gives inflow on the near side and outflow on the far side", () => {
    const p = plate([{ id: "a", kind: "point", q: 2, pos: [2, 0, 0] }]);
    const dn = (createEvaluator(registry, p.instances)(stateAt(p, 0)).s!.model.outline as { dn: number }[]).map((s) => s.dn);
    expect(Math.min(...dn)).toBeLessThan(0);
    expect(Math.max(...dn)).toBeGreaterThan(0);
  });
});
```

`app/packages/plate/test/playback.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyOverrides, frameAt, gradePrediction, hiddenReadouts, lockIndex, PlateDef, readAloudText, stateAt } from "../src";

const plate = PlateDef.parse({
  id: "p", title: "P",
  instances: [
    { id: "q", component: "charges", params: { items: [{ id: "q1", kind: "point", q: 2, pos: [0, 0, 0] }] } },
    { id: "s", component: "gaussian-surface", params: { size: 1 }, links: { charges: "q" } },
    { id: "eq", component: "equation", params: { latex: "\\Psi", speech: "psi", shortSpeech: "psi" } },
  ],
  steps: [
    { id: "a", title: "A", show: ["q"], note: "A charge." },
    {
      id: "b", title: "B", show: ["s", "eq"], note: "Predict.",
      patch: { eq: { latex: "\\Psi=\\oint", speech: "psi equals the closed surface integral of D dot d S", shortSpeech: "flux" } },
      interaction: {
        id: "guess", type: "predict-drag", prompt: "p", target: { instance: "s", readout: "flux" }, range: [0, 10], unit: "µC",
        reveal: { s: { size: 2 } }, dimension: "conceptual", feedback: { close: "c", far: "f" },
      },
    },
    { id: "c", title: "C", patch: { q: { items: [{ id: "q1", kind: "point", q: 4, pos: [0, 0, 0] }] } }, note: "More.", narration: { transcript: "Now double the charge and watch." } },
  ],
});

describe("playback rules", () => {
  it("locks forward travel at the first unanswered interaction", () => {
    expect(lockIndex(plate, new Set())).toBe(1);
    expect(lockIndex(plate, new Set(["guess"]))).toBe(2);
  });
  it("grades predictions against a tolerance floored by the range", () => {
    expect(gradePrediction(2.05, 2, 0.05, [0, 10])).toBe("close");
    expect(gradePrediction(3, 2, 0.05, [0, 10])).toBe("far");
    expect(gradePrediction(0.04, 0, 0.05, [0, 10])).toBe("close");
  });
  it("overrides win at every timeline position and vanish when cleared", () => {
    const o = { q: { params: { items: [{ id: "q1", kind: "point", q: 9, pos: [0.5, 0, 0] }] } } };
    for (const pos of [1, 1.3, 1.7, 2]) expect((applyOverrides(frameAt(plate, pos).state, o).q!.params.items as { q: number }[])[0]!.q).toBe(9);
    expect(applyOverrides(stateAt(plate, 2), {})).toEqual(stateAt(plate, 2));
    expect(applyOverrides(stateAt(plate, 0), { ghost: { visible: true } })).toEqual(stateAt(plate, 0));
  });
  it("hides a predict-drag target until it is answered", () => {
    expect(hiddenReadouts(plate, 1, new Set())).toEqual([{ instance: "s", readout: "flux" }]);
    expect(hiddenReadouts(plate, 1, new Set(["guess"]))).toEqual([]);
    expect(hiddenReadouts(plate, 0, new Set())).toEqual([]);
  });
  it("reads the transcript or note, plus the speech of an equation this step introduces", () => {
    expect(readAloudText(plate, 0)).toBe("A charge.");
    expect(readAloudText(plate, 1)).toBe("Predict. psi equals the closed surface integral of D dot d S");
    expect(readAloudText(plate, 2)).toBe("Now double the charge and watch.");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run packages/plate/test/geometry2d.test.ts packages/plate/test/playback.test.ts`
Expected: FAIL (`toSvg`, `lockIndex` not exported).

- [ ] **Step 3: Implement `src/geometry2d.ts`**

```ts
import { blobRadius, type SurfaceShape, type Vec3 } from "@forma/physics";

/** SVG pixels per metre. Plates draw the x–z plane: x to the right, z up. */
export const PX = 100;
export const VIEWBOX = { x: -260, y: -190, w: 520, h: 380 } as const;

export const toSvg = (p: readonly number[]): [number, number] => [p[0]! * PX, -(p[2] ?? 0) * PX];
export const fromSvg = (x: number, y: number): Vec3 => [x / PX, 0, -y / PX === 0 ? 0 : -y / PX];

function rect(hx: number, hz: number, n: number): [number, number][] {
  const per = 4 * (hx + hz);
  return Array.from({ length: n }, (_, i) => {
    let s = (per * i) / n;
    if (s < 2 * hz) return [hx, -hz + s];
    s -= 2 * hz;
    if (s < 2 * hx) return [hx - s, hz];
    s -= 2 * hx;
    if (s < 2 * hz) return [-hx, hz - s];
    s -= 2 * hz;
    return [-hx + s, -hz];
  });
}

/** Cross-section of a closed surface in the plane y = center.y: n points, counter-clockwise in (x, z). */
export function outline(shape: SurfaceShape, n = 96): Vec3[] {
  const [cx, cy, cz] = shape.center;
  const at = (x: number, z: number): Vec3 => [cx + x, cy, cz + z];
  switch (shape.kind) {
    case "sphere":
      return Array.from({ length: n }, (_, i) => {
        const t = (2 * Math.PI * i) / n;
        return at(shape.radius * Math.cos(t), shape.radius * Math.sin(t));
      });
    case "cube":
      return rect(shape.side / 2, shape.side / 2, n).map(([x, z]) => at(x, z));
    case "cylinder":
      return rect(shape.radius, shape.height / 2, n).map(([x, z]) => at(x, z));
    case "blob":
      return Array.from({ length: n }, (_, i) => {
        const t = (2 * Math.PI * i) / n;
        const x = Math.cos(t);
        const z = Math.sin(t);
        // Direction (x, 0, z) is spherical θ = acos(z), φ = 0 (x ≥ 0) or π (x < 0), matching physics `contains`.
        const r = blobRadius(shape, Math.acos(z), x >= 0 ? 0 : Math.PI);
        return at(r * x, r * z);
      });
  }
}

/** Outward unit normals in the x–z plane, from each point's neighbour chord. Shapes are star-shaped about center. */
export function outlineNormals(pts: readonly Vec3[], center: Vec3): Vec3[] {
  return pts.map((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length]!;
    const b = pts[(i + 1) % pts.length]!;
    let nx = b[2] - a[2];
    let nz = -(b[0] - a[0]);
    const len = Math.hypot(nx, nz) || 1;
    nx /= len;
    nz /= len;
    if (nx * (p[0] - center[0]) + nz * (p[2] - center[2]) < 0) {
      nx = -nx;
      nz = -nz;
    }
    return [nx, 0, nz];
  });
}

export const pathD = (pts: readonly (readonly number[])[], closed = true) =>
  pts
    .map((p, i) => {
      const [x, y] = toSvg(p);
      return `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ") + (closed ? " Z" : "");
```

(`fromSvg` normalises `-0` to `0` so the round-trip test's `toEqual` holds.)

- [ ] **Step 4: Add the outline to the gaussian-surface model**: in `src/components/em.ts`, import `{ outline as outlineOf, outlineNormals } from "../geometry2d"`. In `GaussianSurface.model`, before `return`, add:

```ts
    const pts = outlineOf(shape, 96);
    const normals = outlineNormals(pts, shape.center);
    const outline = pts.map((pt, i) => {
      const n = normals[i]!;
      const dn = dot(fluxDensity(regular, pt), n) * 1e6;
      return { p: pt, n, dn: Number.isFinite(dn) ? dn : null };
    });
```

and add `outline` to the returned object.

- [ ] **Step 5: Implement `src/playback.ts`**

```ts
import type { PlateDef } from "./plate";
import type { SceneState } from "./scene";

export type Overrides = Readonly<Record<string, { params?: Record<string, unknown>; visible?: boolean }>>;

/** Assessment steps lock forward travel: the furthest reachable step given answered interaction ids. */
export function lockIndex(plate: PlateDef, answered: ReadonlySet<string>): number {
  const i = plate.steps.findIndex((s) => s.interaction && !answered.has(s.interaction.id));
  return i < 0 ? plate.steps.length - 1 : i;
}

/** Close when within relTol of the truth, with the tolerance floored at relTol × 10% of the range (so a truth of 0 is gradable). */
export function gradePrediction(guess: number, truth: number, relTol: number, range: readonly [number, number]): "close" | "far" {
  const tol = relTol * Math.max(Math.abs(truth), 0.1 * Math.abs(range[1] - range[0]));
  return Math.abs(guess - truth) <= tol ? "close" : "far";
}

/** Learner edits layered over the authored state: params merged, visibility replaced; unknown ids ignored. */
export function applyOverrides(state: SceneState, overrides: Overrides): SceneState {
  const out: SceneState = { ...state };
  for (const [id, o] of Object.entries(overrides)) {
    const s = out[id];
    if (!s) continue;
    out[id] = { params: { ...s.params, ...(o.params ?? {}) }, visible: o.visible ?? s.visible };
  }
  return out;
}

/** Readouts the plate must not show yet: an unanswered predict-drag's target. */
export function hiddenReadouts(plate: PlateDef, index: number, answered: ReadonlySet<string>): { instance: string; readout: string }[] {
  const i = plate.steps[index]?.interaction;
  return i?.type === "predict-drag" && !answered.has(i.id) ? [{ instance: i.target.instance, readout: i.target.readout }] : [];
}

/** What the device reader speaks: the transcript if authored, else the note, then the speech of any equation this step shows or changes. */
export function readAloudText(plate: PlateDef, index: number): string {
  const step = plate.steps[index]!;
  const speech = plate.instances
    .filter((i) => i.component === "equation" && (step.show.includes(i.id) || i.id in step.patch))
    .map((i) => ({ ...i.params, ...(step.patch[i.id] ?? {}) }).speech)
    .filter((s): s is string => typeof s === "string" && s.length > 0);
  return [step.narration?.transcript ?? step.note, ...speech].join(" ");
}
```

Append to `src/index.ts`:

```ts
export * from "./geometry2d";
export * from "./playback";
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run packages/plate && pnpm typecheck`
Expected: PASS. If a cube or cylinder corner point misses the ±0.1% band, check that `rect` starts at `(hx, −hz)` and walks counter-clockwise. The test's band is the contract.

- [ ] **Step 7: Commit**

```bash
git add packages/plate && git commit -m "feat(plate): 2D projection, surface outlines with D·n, playback rules and read-aloud text"
```

---

### Task 4: Course: Explore labs, templates by concept, spoken-equation and colour-word fixes

**Files:**
- Create: `app/packages/course-em1/src/labs.ts`
- Modify:
  - `src/templates.ts` (add `templatesFor`)
  - `src/plates/gauss.ts` (per-stage equation speech)
  - `src/plates/detours.ts` ("violet" → "blue")
  - `src/index.ts`
- Test: `app/packages/course-em1/test/labs.test.ts`; extend `test/plates.test.ts`

**Interfaces:**
- Consumes: `PlateDef`, `validatePlate`, `readAloudText`, `registry`, `checks`, `emComponents`.
- Produces:
  - `Control = { instance; param; label } & ({ kind: "slider"; min; max; step; unit } | { kind: "segmented"; options: [string, string][] })`
  - `Experiment = { id; title; goal; check }`; `Lab = { plate: PlateDef; controls: Control[]; experiments: Experiment[] }`
  - `labs: Record<conceptId, Lab>` (key `em1.electrostatics.gauss-law`)
  - `templatesFor(conceptId): TemplateDef<any>[]`

- [ ] **Step 1: Write the failing tests**

`app/packages/course-em1/test/labs.test.ts`:

```ts
import { validatePlate } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { checks, course, labs, registry, templatesFor } from "../src";

describe("explore labs", () => {
  for (const [conceptId, lab] of Object.entries(labs)) {
    it(`${conceptId}: belongs to a real concept and validates cleanly`, () => {
      expect(course.concepts.some((c) => c.id === conceptId)).toBe(true);
      expect(validatePlate(registry, lab.plate)).toEqual([]);
    });
    it(`${conceptId}: every control targets a declared handle and every experiment a real check`, () => {
      for (const c of lab.controls) {
        const inst = lab.plate.instances.find((i) => i.id === c.instance);
        expect(inst, c.instance).toBeDefined();
        expect(registry.get(inst!.component).handles, `${c.instance}.${c.param}`).toContain(c.param);
      }
      for (const e of lab.experiments) expect(checks[e.check], e.check).toBeDefined();
    });
  }
});

it("templatesFor filters by concept tag", () => {
  expect(templatesFor("em1.electrostatics.gauss-applications").map((t) => t.id).sort()).toEqual(["f2425-qt", "q06-octant", "q08-e", "q08-q", "q09a-cube"]);
  expect(templatesFor("em1.math.vectors")).toEqual([]);
});
```

Append to `test/plates.test.ts` (and add `readAloudText` to its `@forma/plate` import):

```ts
  it("gauss equation speech matches what each stage shows", () => {
    const g = plates.gauss!;
    const flux = g.steps.findIndex((s) => s.id === "flux");
    const law = g.steps.findIndex((s) => s.id === "law");
    expect(readAloudText(g, flux)).toMatch(/closed surface integral/);
    expect(readAloudText(g, flux)).not.toMatch(/enclosed/);
    expect(readAloudText(g, law)).toMatch(/charge enclosed/);
  });

  it("colour words in notes match the Forma palette", () => {
    for (const p of Object.values(plates)) for (const s of p.steps) expect(s.note, `${p.id}/${s.id}`).not.toMatch(/violet|purple/i);
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run packages/course-em1`
Expected: FAIL (`labs` and `templatesFor` not exported; the speech and colour tests fail).

- [ ] **Step 3: Implement `src/labs.ts`**

```ts
import { PlateDef } from "@forma/plate";

export type Control = { instance: string; param: string; label: string } & (
  | { kind: "slider"; min: number; max: number; step: number; unit: string }
  | { kind: "segmented"; options: [string, string][] }
);
export type Experiment = { id: string; title: string; goal: string; check: string };
export type Lab = { plate: PlateDef; controls: Control[]; experiments: Experiment[] };

const gaussLab: Lab = {
  plate: PlateDef.parse({
    id: "gauss-lab",
    title: "Gauss lab",
    instances: [
      {
        id: "q",
        component: "charges",
        params: { items: [{ id: "q1", kind: "point", q: 2, pos: [0, 0, 0] }, { id: "q2", kind: "point", q: -1, pos: [0.6, 0, 0.4], draggable: true }] },
        visible: true,
      },
      { id: "field", component: "field-arrows", params: { grid: 7 }, links: { charges: "q" }, visible: true },
      { id: "surface", component: "gaussian-surface", params: { shape: "sphere", size: 1.2, shading: true }, links: { charges: "q" }, visible: true },
      { id: "axes", component: "axes", params: {}, visible: true },
    ],
    steps: [{ id: "free", title: "Free exploration", focus: ["surface"], note: "Change anything you like. Ψ always equals the charge inside the surface." }],
  }),
  controls: [
    { instance: "surface", param: "size", label: "Surface size", kind: "slider", min: 0.3, max: 2.2, step: 0.05, unit: "m" },
    { instance: "surface", param: "shape", label: "Shape", kind: "segmented", options: [["sphere", "Sphere"], ["cube", "Cube"], ["blob", "Lumpy"], ["cylinder", "Cylinder"]] },
  ],
  experiments: [
    { id: "resize", title: "Resize it", goal: "Change the surface size by at least 40% and watch Ψ.", check: "resize-constant" },
    { id: "reshape", title: "Reshape it", goal: "Swap to another shape with the charge still inside.", check: "shape-swap" },
    { id: "outside", title: "Move one out", goal: "Drag the −1 µC charge outside the surface.", check: "outside-zero" },
  ],
};

export const labs: Record<string, Lab> = { "em1.electrostatics.gauss-law": gaussLab };
```

- [ ] **Step 4: `templatesFor`**: append to `src/templates.ts`:

```ts
export const templatesFor = (conceptId: string) => templates.filter((t) => t.tags.concepts.includes(conceptId));
```

In `src/index.ts`, change `export { templates } from "./templates";` to `export { templates, templatesFor } from "./templates";` and add `export * from "./labs";`.

- [ ] **Step 5: Per-stage equation speech**: in `src/plates/gauss.ts`, replace the `eq` helper with:

```ts
const eq = (latex: string, speech: string, shortSpeech: string) => ({
  latex,
  terms: [
    { key: "t-flux", speech: "psi, the electric flux" },
    { key: "t-surface", speech: "over the closed surface S" },
    { key: "t-charge", speech: "Q enclosed" },
  ],
  speech,
  shortSpeech,
});
```

and update its three call sites:
- **instance:** `eq(String.raw\`\htmlClass{t-flux}{\Psi}\`, "psi, the electric flux", "psi")`
- **`flux` step:** `eq(String.raw\`…\oint…d\mathbf S\`, "psi equals the closed surface integral of D dot d S", "the flux integral")`, keeping the existing LaTeX
- **`law` step:** `eq(String.raw\`…=\htmlClass{t-charge}{Q_{\mathrm{enc}}}\`, "psi equals the closed surface integral of D dot d S, which equals the charge enclosed", "Gauss's law")`, keeping the existing LaTeX

- [ ] **Step 6: Colour word**: in `src/plates/detours.ts`, in the `outside-charge-plate` `drag` note, replace `Amber patches (inflow) and violet patches (outflow) balance exactly.` with `Ochre patches (inflow) and blue patches (outflow) balance exactly.`

- [ ] **Step 7: Run tests**

Run: `pnpm vitest run packages/course-em1 && pnpm typecheck`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/course-em1 && git commit -m "feat(course-em1): Gauss explore lab, templates by concept, per-stage equation speech"
```

---

### Task 5: Engine: seeds, layouts and a numeric evaluator

**Files:**
- Modify: `app/packages/engine/src/learner-state.ts`, `app/packages/engine/src/symbolic.ts`
- Test: `app/packages/engine/test/workspace.test.ts`

**Interfaces:**
- Produces:
  - `seedOf(state, templateId): number` (default 1); `withNextSeed(state, templateId): LearnerState`
  - `withLayout(state, mode, patch: Partial<{ split: number; pinned: ToolId[] }>): LearnerState` also sets `workspace.lastMode = mode` and clamps `split` to [0.2, 1]
  - `evaluateNumeric(latex: string): number | null` reads ε₀ as 8.8541878128×10⁻¹² and returns `null` for unparseable or non-finite input

- [ ] **Step 1: Write the failing test**: `app/packages/engine/test/workspace.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { evaluateNumeric, initialState, seedOf, withLayout, withNextSeed } from "../src";

describe("workspace state", () => {
  it("seeds start at 1 and advance per template", () => {
    const s = initialState();
    expect(seedOf(s, "q06-octant")).toBe(1);
    const t = withNextSeed(withNextSeed(s, "q06-octant"), "q06-octant");
    expect(seedOf(t, "q06-octant")).toBe(3);
    expect(seedOf(t, "q08-e")).toBe(1);
  });
  it("layouts update one mode, remember it as last, and clamp the split", () => {
    const s = withLayout(initialState(), "solve", { split: 0.05, pinned: ["paper", "formulas"] });
    expect(s.workspace.lastMode).toBe("solve");
    expect(s.workspace.layouts.solve).toEqual({ split: 0.2, pinned: ["paper", "formulas"] });
    expect(s.workspace.layouts.learn).toEqual(initialState().workspace.layouts.learn);
    expect(withLayout(s, "learn", { split: 3 }).workspace.layouts.learn.split).toBe(1);
  });
});

describe("evaluateNumeric", () => {
  it("evaluates LaTeX arithmetic, with ε₀ as its SI value", () => {
    expect(evaluateNumeric("2^{10}")).toBe(1024);
    expect(evaluateNumeric("\\frac{1}{4\\pi\\varepsilon_0}")! / 8.98755179e9).toBeCloseTo(1, 8);
    expect(evaluateNumeric("\\frac{")).toBeNull();
    expect(evaluateNumeric("x+1")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run packages/engine/test/workspace.test.ts`
Expected: FAIL (`seedOf` not exported).

- [ ] **Step 3: Implement**: append to `src/learner-state.ts`:

```ts
export const seedOf = (s: LearnerState, templateId: string) => s.seeds[templateId] ?? 1;

export const withNextSeed = (s: LearnerState, templateId: string): LearnerState => ({
  ...s,
  seeds: { ...s.seeds, [templateId]: seedOf(s, templateId) + 1 },
});

export function withLayout(s: LearnerState, mode: Mode, patch: Partial<Workspace["layouts"][Mode]>): LearnerState {
  const cur = s.workspace.layouts[mode];
  const split = Math.min(1, Math.max(0.2, patch.split ?? cur.split));
  return { ...s, workspace: { lastMode: mode, layouts: { ...s.workspace.layouts, [mode]: { ...cur, ...patch, split } } } };
}
```

Append to `src/symbolic.ts`:

```ts
/** Calculator: evaluate a closed LaTeX expression numerically; ε₀ is its SI value. Free variables ⇒ null. */
export function evaluateNumeric(latex: string): number | null {
  const e = ce.parse(latex.replace(/\\(varepsilon|epsilon)_(?:0|\{0\})/g, "(8.8541878128\\times10^{-12})"));
  if (!e.isValid || e.unknowns.length > 0) return null;
  const v = Number(e.N().re);
  return Number.isFinite(v) ? v : null;
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run packages/engine && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/engine && git commit -m "feat(engine): template seeds, per-mode layouts, numeric evaluator for the calculator"
```

---

### Task 6: Web: theme CSS, fonts, mark icon, and plate-aware lesson links

**Files:**
- Modify:
  - `app/apps/web/package.json` (deps `@forma/ui`, `@forma/plate`, `@fontsource/source-serif-4`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono`)
  - `next.config.ts`, `app/layout.tsx`, `app/tokens.css`, `app/globals.css`, `lib/course.ts`
- Create: `app/apps/web/app/icon.svg`, `app/apps/web/test/course.test.ts`
- Modify: `app/vitest.config.ts`

**Interfaces:**
- Produces:
  - `lessonHref(conceptId, lessonId, extra?)` sends plate lessons to `/c/em1/<concept>?mode=learn&lesson=<id>` (merging `extra`'s query) and classic lessons to `/learn/…` as before
  - `conceptHref(conceptId, mode = "learn", query = {})`
  - `isPlateLesson(lesson): boolean`
  - `lessonForPlate(conceptId, plateId): string | undefined`

- [ ] **Step 1: Test harness for the web package**: replace `app/vitest.config.ts`:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./apps/web", import.meta.url)) } },
  test: { include: ["packages/*/test/**/*.test.ts", "apps/web/test/**/*.test.{ts,tsx}"] },
});
```

Then run:

```bash
cd /f/StudyBuddy/app/apps/web
pnpm add @forma/ui@workspace:* @forma/plate@workspace:* @fontsource/source-serif-4 @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
```

- [ ] **Step 2: Write the failing test**: `app/apps/web/test/course.test.ts`

```ts
import { expect, it } from "vitest";
import { conceptHref, getLesson, isPlateLesson, lessonForPlate, lessonHref } from "@/lib/course";

const G = "em1.electrostatics.gauss-law";

it("plate lessons open in the concept workspace; classic lessons keep /learn", () => {
  expect(isPlateLesson(getLesson(G, "main")!)).toBe(true);
  expect(isPlateLesson(getLesson(G, "main-classic")!)).toBe(false);
  expect(lessonHref(G, "main")).toBe(`/c/em1/${G}?mode=learn&lesson=main`);
  expect(lessonHref(G, "why-area", "?return=%2Fx")).toBe(`/c/em1/${G}?mode=learn&lesson=why-area&return=%2Fx`);
  expect(lessonHref(G, "main-classic")).toBe(`/learn/${G}/main-classic`);
  expect(conceptHref(G, "solve")).toBe(`/c/em1/${G}?mode=solve`);
  expect(lessonForPlate(G, "gauss")).toBe("main");
  expect(lessonForPlate(G, "why-area-plate")).toBe("why-area");
  expect(lessonForPlate(G, "nope")).toBeUndefined();
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm vitest run apps/web/test/course.test.ts`
Expected: FAIL (`conceptHref` not exported).

- [ ] **Step 4: Implement in `lib/course.ts`**: replace `lessonHref` with:

```ts
export const isPlateLesson = (l: Lesson) => l.blocks.length > 0 && l.blocks.every((b) => b.type === "plate");

export const conceptHref = (conceptId: string, mode = "learn", query: Record<string, string> = {}) =>
  `/c/${course.id}/${encodeURIComponent(conceptId)}?${new URLSearchParams({ mode, ...query }).toString()}`;

/** Plate lessons live in the concept workspace; classic block lessons keep their v1 route. */
export function lessonHref(conceptId: string, lessonId: string, extra = "") {
  const lesson = getLesson(conceptId, lessonId);
  if (lesson && isPlateLesson(lesson)) {
    const base = conceptHref(conceptId, "learn", { lesson: lessonId });
    return extra ? `${base}&${extra.replace(/^\?/, "")}` : base;
  }
  return `/learn/${encodeURIComponent(conceptId)}/${encodeURIComponent(lessonId)}${extra}`;
}

export const lessonForPlate = (conceptId: string, plateId: string) =>
  getConcept(conceptId)?.lessons.find((l) => l.blocks.some((b) => b.type === "plate" && b.plateId === plateId))?.id;
```

(`getLesson` and `getConcept` are function declarations and hoist, so their order is fine.)

- [ ] **Step 5: Theme, fonts, metadata**
- **`next.config.ts`:** set `transpilePackages: ["@forma/engine", "@forma/physics", "@forma/course-em1", "@forma/plate", "@forma/ui"]`.
- **`app/tokens.css`:** delete the three colour blocks (`:root, [data-theme="paper"]`, `[data-theme="blueprint"]`, `[data-theme="contrast"]`). Keep a `:root { … }` holding only the non-colour tokens (`--radius`, `--radius-lg`, `--space`, `--measure`, `--motion-*`, `--ease`), plus the `[data-density]` and `[data-motion]` blocks. Remove `--font-read`/`--font-ui` from it: `forma.css` owns fonts.
- **`app/globals.css`:** change the term colours to text variants:
  ```bash
  sed -i -E 's/color: var\(--sem-(charge|field|flux|surface)\);/color: var(--\1-text);/; s/color: var\(--sem-confirmed\);/color: var(--ok-text);/' app/globals.css
  ```
  Also replace the `html, body` background gradient rule with `background: var(--paper);`, and add `--font-mono: var(--font-mono);` to `@theme inline`.
- **`app/layout.tsx`:**

```tsx
import "katex/dist/katex.min.css";
import "@xyflow/react/dist/style.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@forma/ui/forma.css";
import "./globals.css";
import { themeCss } from "@forma/ui";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Providers } from "@/components/shell/Providers";

export const metadata: Metadata = {
  title: { default: "Forma", template: "%s · Forma" },
  description: "Forma: shape how you understand. Living, exact diagrams for university courses.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="paper" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
```

- **`app/icon.svg`** (the F mark: Next serves it as the favicon):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -12 144 144"><rect x="-24" y="-12" width="144" height="144" rx="20" fill="#1B1F24"/><g fill="#F3EFE6"><path d="M0 0 H84 A12 12 0 0 1 84 24 H0 Z"/><path d="M0 120 V58 A24 24 0 0 1 24 34 H72 A12 12 0 0 1 72 58 H24 V120 Z"/></g></svg>
```

- [ ] **Step 6: Run tests, typecheck and build**

Run: `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all pass. The build proves the fonts and the generated CSS resolve.

- [ ] **Step 7: Commit**

```bash
git add -A apps/web vitest.config.ts pnpm-lock.yaml && git commit -m "feat(web): Forma theme CSS, self-hosted fonts, F mark icon, plate-aware lesson links"
```

---

### Task 7: Web: 2D plate views

**Files:**
- Create: `app/apps/web/components/plate/stage-context.tsx`, `app/apps/web/components/plate/views2d.tsx`
- Test: `app/apps/web/test/views.test.ts`

**Interfaces:**
- Consumes: `Evaluated`, `PX`, `pathD`, `toSvg` (`@forma/plate`); `Tex`.
- Produces:
  - `StageApi = { toMetres(clientX, clientY): Vec3; edit(id, params): void; editable(id): boolean }`, with `StageContext` and `usePlateStage()`
  - `ViewProps = { id: string; ev: Evaluated; appear: number; focused: boolean; highlighted: boolean }`
  - `views2d: Record<componentId, ComponentType<ViewProps>>` for charges, field-arrows, field-profile, gaussian-surface, faraday-spheres, axes and dimension-callout
  - `EquationView({ ev, onTerm? })`; `overlayViews = { equation: EquationView }`

- [ ] **Step 1: Write the failing test**: `app/apps/web/test/views.test.ts`

```ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { emComponents } from "@forma/plate";
import { expect, it } from "vitest";
import { overlayViews, views2d } from "@/components/plate/views2d";

it("every EM component has a 2D view or an overlay", () => {
  for (const c of emComponents) expect(c.id in views2d || c.id in overlayViews, c.id).toBe(true);
});

it("plate views use theme tokens, never hex colours (so a theme switch recolours everything)", () => {
  const src = readFileSync(fileURLToPath(new URL("../components/plate/views2d.tsx", import.meta.url)), "utf8");
  expect(src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run apps/web/test/views.test.ts`
Expected: FAIL (cannot resolve `@/components/plate/views2d`).

- [ ] **Step 3: `stage-context.tsx`**

```tsx
"use client";

import type { Vec3 } from "@forma/physics";
import { createContext, useContext } from "react";

export type StageApi = {
  toMetres: (clientX: number, clientY: number) => Vec3;
  edit: (id: string, params: Record<string, unknown>) => void;
  editable: (id: string) => boolean;
};

export const StageContext = createContext<StageApi>({ toMetres: () => [0, 0, 0], edit: () => {}, editable: () => false });
export const usePlateStage = () => useContext(StageContext);
```

(`@forma/physics` is already a web dependency.)

- [ ] **Step 4: `views2d.tsx`**

```tsx
"use client";

import { PX, pathD, toSvg, type Evaluated } from "@forma/plate";
import type { ComponentType, KeyboardEvent, PointerEvent } from "react";
import { Tex } from "../Tex";
import { usePlateStage } from "./stage-context";

export type ViewProps = { id: string; ev: Evaluated; appear: number; focused: boolean; highlighted: boolean };

type V3 = [number, number, number];
type Item =
  | { id: string; kind: "point"; q: number; pos: V3; draggable: boolean }
  | { id: string; kind: "line"; rhoL: number; x: number; y: number }
  | { id: string; kind: "sheet"; rhoS: number; z0: number };

const r2 = (v: number) => Math.round(v * 100) / 100;
const STEP = 0.1; // metres per arrow-key press
const KEYS: Record<string, [number, number]> = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, STEP], ArrowDown: [0, -STEP] };

function ChargesView({ id, ev }: ViewProps) {
  const stage = usePlateStage();
  const items = ev.params.items as Item[];
  const move = (itemId: string, pos: V3) => stage.edit(id, { items: items.map((it) => (it.id === itemId && it.kind === "point" ? { ...it, pos } : it)) });
  return (
    <g className="v-charges">
      {items.map((it) => {
        if (it.kind === "line") {
          const [x] = toSvg([it.x, 0, 0]);
          return (
            <g key={it.id} role="img" aria-label={`Line charge ${it.rhoL} nC per metre`}>
              <line x1={x} x2={x} y1={-180} y2={180} className="ink-charge" strokeDasharray="6 4" />
              <text x={x + 6} y={-166} className="plate-label">{`ρL ${it.rhoL} nC/m`}</text>
            </g>
          );
        }
        if (it.kind === "sheet") {
          const [, y] = toSvg([0, 0, it.z0]);
          return (
            <g key={it.id} role="img" aria-label={`Sheet charge ${it.rhoS} µC per square metre`}>
              <rect x={-260} y={y - 3} width={520} height={6} fill="url(#hatch-charge)" />
              <text x={-252} y={y - 8} className="plate-label">{`ρS ${it.rhoS} µC/m²`}</text>
            </g>
          );
        }
        const [x, y] = toSvg(it.pos);
        const can = it.draggable && stage.editable(id);
        const label = `${it.q > 0 ? "+" : ""}${it.q} µC`;
        const onPointerDown = (e: PointerEvent<SVGGElement>) => can && e.currentTarget.setPointerCapture(e.pointerId);
        const onPointerMove = (e: PointerEvent<SVGGElement>) => {
          if (!can || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
          const [mx, , mz] = stage.toMetres(e.clientX, e.clientY);
          move(it.id, [r2(mx), it.pos[1], r2(mz)]);
        };
        const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
          const d = KEYS[e.key];
          if (!can || !d) return;
          e.preventDefault();
          move(it.id, [r2(it.pos[0] + d[0]), it.pos[1], r2(it.pos[2] + d[1])]);
        };
        const a11y = can
          ? { tabIndex: 0, role: "button", "aria-label": `${label} charge at x ${it.pos[0].toFixed(2)} m, z ${it.pos[2].toFixed(2)} m. Drag, or use the arrow keys, to move it.`, onPointerDown, onPointerMove, onKeyDown }
          : { role: "img", "aria-label": `${label} charge` };
        return (
          <g key={it.id} transform={`translate(${x} ${y})`} className={can ? "handle" : undefined} {...a11y}>
            <circle r={9} className={it.q >= 0 ? "fill-charge" : "ring-charge"} />
            <text y={4} textAnchor="middle" className="charge-sign">{it.q >= 0 ? "+" : "−"}</text>
            <text x={13} y={-11} className="plate-label">{label}</text>
            {can && <circle r={16} className="handle-ring" />}
          </g>
        );
      })}
    </g>
  );
}

function FieldArrowsView({ ev }: ViewProps) {
  const samples = (ev.model.samples as { p: number[]; dir: number[]; mag: number }[]).filter((s) => Math.abs(s.p[1]!) < 1e-9);
  const max = Math.max(1e-30, ...samples.map((s) => s.mag));
  const [px, py] = toSvg([ev.params.probe as number, 0, 0]);
  return (
    <g className="v-field" aria-hidden>
      {samples.map((s, i) => {
        const L = (0.08 + 0.16 * Math.sqrt(s.mag / max)) * PX;
        const [x, y] = toSvg(s.p);
        const dx = s.dir[0]! * L;
        const dy = -s.dir[2]! * L;
        return <line key={i} x1={x - dx / 2} y1={y - dy / 2} x2={x + dx / 2} y2={y + dy / 2} className="ink-flux" markerEnd="url(#arrow-flux)" />;
      })}
      <g transform={`translate(${px} ${py})`}>
        <path d="M-5 0H5M0 -5V5" className="ink-graphite" />
        <text x={7} y={14} className="plate-label">probe</text>
      </g>
    </g>
  );
}

function FieldProfileView({ ev }: ViewProps) {
  const pts = ev.model.points as { r: number; v: number }[];
  if (pts.length < 2) return null;
  const W = 150, H = 90, X0 = 96, Y0 = -178;
  const rMax = pts.at(-1)!.r;
  const vMax = Math.max(1e-30, ...pts.map((p) => p.v));
  const d = pts.map((p, i) => `${i ? "L" : "M"}${(X0 + (p.r / rMax) * W).toFixed(1)} ${(Y0 + H - (p.v / vMax) * H).toFixed(1)}`).join(" ");
  return (
    <g className="v-profile" role="img" aria-label={`Plot of |${String(ev.params.quantity)}| against distance r, falling as 1 over r squared`}>
      <rect x={X0} y={Y0} width={W} height={H} className="inset" />
      <path d={d} className="ink-flux" fill="none" />
      <text x={X0 + 4} y={Y0 + 12} className="plate-label">{`|${String(ev.params.quantity)}| vs r`}</text>
      <text x={X0 + W - 4} y={Y0 + H - 4} textAnchor="end" className="plate-label">{`r → ${rMax} m`}</text>
    </g>
  );
}

function GaussianSurfaceView({ ev, appear }: ViewProps) {
  const o = ev.model.outline as { p: number[]; n: number[]; dn: number | null }[];
  const max = Math.max(1e-30, ...o.map((s) => Math.abs(s.dn ?? 0)));
  const drawing = appear < 1;
  return (
    <g className="v-surface" role="img" aria-label={`Closed ${String(ev.params.shape)} Gaussian surface`}>
      {ev.params.shading === true &&
        o.map((s, i) => {
          const b = o[(i + 1) % o.length]!;
          const [x1, y1] = toSvg(s.p);
          const [x2, y2] = toSvg(b.p);
          const c = s.dn ?? 0;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={c >= 0 ? "shade-out" : "shade-in"} strokeOpacity={0.15 + (0.85 * Math.abs(c)) / max} />;
        })}
      <path d={pathD(o.map((s) => s.p))} className="ink-surface" fill="none" pathLength={1} strokeDasharray={drawing ? 1 : undefined} strokeDashoffset={drawing ? 1 - appear : undefined} />
      {ev.params.showNormals === true &&
        o
          .filter((_, i) => i % 8 === 0)
          .map((s, i) => {
            const [x, y] = toSvg(s.p);
            return <line key={i} x1={x} y1={y} x2={x + s.n[0]! * 0.14 * PX} y2={y - s.n[2]! * 0.14 * PX} className="ink-surface" markerEnd="url(#arrow-surface)" />;
          })}
    </g>
  );
}

function FaradaySpheresView({ ev }: ViewProps) {
  const p = ev.params as { innerQ: number; material: string; revealed: boolean };
  return (
    <g className="v-faraday" role="img" aria-label={`Charged ball of +${p.innerQ} µC inside a metal sphere, with ${p.material} between them`}>
      <circle r={0.8 * PX} fill="url(#hatch-surface)" className="ink" />
      <circle r={0.72 * PX} className="fill-paper ink" />
      {p.material !== "Air" && <circle r={0.72 * PX} fill="url(#hatch-graphite)" />}
      <circle r={0.25 * PX} className="fill-charge-soft ink-charge" />
      <text y={5} textAnchor="middle" className="plate-label">{`+${p.innerQ} µC`}</text>
      <text y={-0.48 * PX} textAnchor="middle" className="plate-label">{p.material}</text>
      <text x={0.86 * PX} y={-0.6 * PX} className="plate-label">{p.revealed ? `outer: +${String(ev.model.outerQ)} µC` : "outer: ?"}</text>
    </g>
  );
}

function AxesView({ ev }: ViewProps) {
  const L = (ev.params.length as number) * PX;
  return (
    <g className="v-axes" aria-hidden>
      <line x1={-L} y1={0} x2={L} y2={0} className="ink-graphite" markerEnd="url(#arrow-graphite)" />
      <line x1={0} y1={L * 0.7} x2={0} y2={-L * 0.7} className="ink-graphite" markerEnd="url(#arrow-graphite)" />
      <text x={L + 4} y={4} className="plate-label">x</text>
      <text x={4} y={-L * 0.7 - 4} className="plate-label">z</text>
    </g>
  );
}

function DimensionCalloutView({ ev }: ViewProps) {
  const [x1, y1] = toSvg(ev.params.from as number[]);
  const [x2, y2] = toSvg(ev.params.to as number[]);
  return (
    <g className="v-dimension" role="img" aria-label={String(ev.params.label)}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="ink-graphite" strokeDasharray="4 3" markerStart="url(#tick)" markerEnd="url(#tick)" />
      <text x={(x1 + x2) / 2 + 4} y={(y1 + y2) / 2 - 6} className="plate-label">{String(ev.params.label)}</text>
    </g>
  );
}

/** HTML overlay: KaTeX with \htmlClass term keys. Clicking a term reports its key for focus links. */
export function EquationView({ ev, onTerm }: { ev: Evaluated; onTerm?: (key: string) => void }) {
  return (
    <div
      className="plate-equation"
      onClick={(e) => {
        const key = [...((e.target as HTMLElement).closest("[class*='t-']")?.classList ?? [])].find((c) => c.startsWith("t-"));
        if (key) onTerm?.(key);
      }}
    >
      <Tex latex={ev.params.latex as string} display />
    </div>
  );
}

export const views2d: Record<string, ComponentType<ViewProps>> = {
  charges: ChargesView,
  "field-arrows": FieldArrowsView,
  "field-profile": FieldProfileView,
  "gaussian-surface": GaussianSurfaceView,
  "faraday-spheres": FaradaySpheresView,
  axes: AxesView,
  "dimension-callout": DimensionCalloutView,
};

export const overlayViews = { equation: EquationView };
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run apps/web && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web && git commit -m "feat(web): 2D plate views for the EM components, token-coloured"
```

---

### Task 8: Web: plate stage and readout strip

**Files:**
- Create: `app/apps/web/components/plate/PlateStage.tsx`, `app/apps/web/components/plate/Readouts.tsx`

**Interfaces:**
- Consumes: `views2d`, `EquationView`, `StageContext` (Task 7); `fromSvg`, `VIEWBOX`, `Frame`, `PlateDef`, `TimelineFrame` (`@forma/plate`); `registry` (`@forma/course-em1`); `Readout` (`@forma/ui`).
- Produces:
  - `PlateStage({ plate, timeline, frame, label, highlight?, editable?, onEdit?, onTerm? })` draws each visible instance inside its own error boundary
  - `PlateReadouts({ plate, frame, hidden? })` shows every declared readout of the visible instances. It skips surfaces with `readout: false`, an unrevealed Faraday outer charge, and anything in `hidden`.

- [ ] **Step 1: Implement `PlateStage.tsx`**

```tsx
"use client";

import { fromSvg, VIEWBOX, type Frame, type PlateDef, type TimelineFrame } from "@forma/plate";
import { Component, useMemo, useRef, type ReactNode } from "react";
import { StageContext, type StageApi } from "./stage-context";
import { EquationView, views2d } from "./views2d";

class Guard extends Component<{ id: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <text className="plate-label">{`${this.props.id}: could not be drawn`}</text> : this.props.children;
  }
}

function PlateDefs() {
  return (
    <defs>
      <pattern id="plate-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M20 0H0V20" fill="none" className="grid-line" />
      </pattern>
      {(["charge", "surface", "graphite"] as const).map((c) => (
        <pattern key={c} id={`hatch-${c}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" style={{ stroke: `var(--${c})` }} strokeWidth="1" />
        </pattern>
      ))}
      {(["flux", "surface", "graphite"] as const).map((c) => (
        <marker key={c} id={`arrow-${c}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7" fill="none" style={{ stroke: `var(--${c})` }} />
        </marker>
      ))}
      <marker id="tick" markerWidth="2" markerHeight="10" refX="1" refY="5" orient="auto">
        <path d="M1 0V10" style={{ stroke: "var(--graphite)" }} />
      </marker>
    </defs>
  );
}

export function PlateStage({
  plate, timeline, frame, label, highlight = [], editable = [], onEdit, onTerm,
}: {
  plate: PlateDef; timeline: TimelineFrame; frame: Frame; label: string;
  highlight?: string[]; editable?: string[]; onEdit?: (id: string, params: Record<string, unknown>) => void; onTerm?: (key: string) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const api = useMemo<StageApi>(
    () => ({
      toMetres: (cx, cy) => {
        const m = svg.current?.getScreenCTM();
        if (!m) return [0, 0, 0];
        const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
        return fromSvg(p.x, p.y);
      },
      edit: (id, params) => onEdit?.(id, params),
      editable: (id) => editable.includes(id),
    }),
    [editable, onEdit],
  );
  return (
    <StageContext value={api}>
      <figure className="plate">
        <svg ref={svg} viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`} className="plate-svg" role="group" aria-label={label}>
          <PlateDefs />
          <rect x={VIEWBOX.x} y={VIEWBOX.y} width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#plate-grid)" />
          {plate.instances.map((inst) => {
            const ev = frame[inst.id];
            const View = views2d[inst.component];
            if (!ev?.visible || !View) return null;
            const focused = timeline.focus.includes(inst.id);
            return (
              <g key={inst.id} data-instance={inst.id} className="plate-instance" opacity={timeline.opacity[inst.id] ?? 1} data-focus={focused} data-highlight={highlight.includes(inst.id)}>
                <Guard id={inst.id}>
                  <View id={inst.id} ev={ev} appear={timeline.appear[inst.id] ?? 1} focused={focused} highlighted={highlight.includes(inst.id)} />
                </Guard>
              </g>
            );
          })}
        </svg>
        {plate.instances
          .filter((i) => i.component === "equation" && frame[i.id]?.visible)
          .map((i) => (
            <EquationView key={i.id} ev={frame[i.id]!} {...(onTerm ? { onTerm } : {})} />
          ))}
      </figure>
    </StageContext>
  );
}
```

- [ ] **Step 2: Implement `Readouts.tsx`**

```tsx
"use client";

import { registry } from "@forma/course-em1";
import type { Frame, PlateDef } from "@forma/plate";
import { Readout } from "@forma/ui";

const LABEL: Record<string, string> = {
  flux: "Ψ, flux out", enclosed: "Q enclosed", area: "Surface area", probeD: "|D| at probe", probeE: "|E| at probe",
  outerQ: "Outer sphere", eMid: "|E| at 0.5 m", total: "Total charge",
};
const TONE: Record<string, "flux" | "charge" | "surface" | "field"> = {
  flux: "flux", enclosed: "charge", area: "surface", probeD: "flux", probeE: "field", outerQ: "charge", eMid: "field", total: "charge",
};
const pretty = (unit: string) => unit.replace("^2", "²");

export function PlateReadouts({ plate, frame, hidden = [] }: { plate: PlateDef; frame: Frame; hidden?: { instance: string; readout: string }[] }) {
  const rows = plate.instances.flatMap((inst) => {
    const ev = frame[inst.id];
    if (!ev?.visible || ev.params.readout === false || (inst.component === "faraday-spheres" && ev.params.revealed !== true)) return [];
    return Object.entries(registry.get(inst.component).readouts)
      .filter(([name]) => !hidden.some((h) => h.instance === inst.id && h.readout === name))
      .map(([name, unit]) => ({ key: `${inst.id}.${name}`, name, unit, value: typeof ev.model[name] === "number" ? (ev.model[name] as number) : null }));
  });
  if (!rows.length) return null;
  return (
    <div className="readouts" role="group" aria-label="Instrument readouts">
      {rows.map((r) => (
        <Readout key={r.key} label={LABEL[r.name] ?? r.name} value={r.value} unit={pretty(r.unit)} {...(TONE[r.name] ? { tone: TONE[r.name] } : {})} />
      ))}
    </div>
  );
}
```

Append to `packages/ui/src/forma.css`:

```css
.readouts { display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 10px 0; }
```

- [ ] **Step 2b: Keep the exact-readout labels honest**

Add to `apps/web/test/views.test.ts`:

```ts
import { emComponents as all } from "@forma/plate";
import { readFileSync as read } from "node:fs";

it("every declared readout has a human label", () => {
  const src = read(fileURLToPath(new URL("../components/plate/Readouts.tsx", import.meta.url)), "utf8");
  for (const c of all) for (const name of Object.keys(c.readouts)) expect(src, `${c.id}.${name}`).toMatch(new RegExp(`\\b${name}: "`));
});
```

- [ ] **Step 3: Run tests and typecheck**

Run: `pnpm vitest run apps/web && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web packages/ui && git commit -m "feat(web): plate stage (linework defs, per-instance guards, equation overlay) and readout strip"
```

---

### Task 9: Web: on-plate interactions

**Files:**
- Create: `app/apps/web/components/plate/rendered.ts`, `app/apps/web/components/plate/interactions.tsx`
- Modify: `app/apps/web/components/blocks/numeric.tsx` (export `NumericField`)
- Test: `app/apps/web/test/interactions.test.ts`

**Interfaces:**
- Consumes: `Interaction`, `Effect`, `ErrorClass` (`@forma/engine`); `gradePrediction` (`@forma/plate`); `Readout` (`@forma/ui`); `Feedback`; `NumericField`.
- Produces:
  - `RENDERED_INTERACTIONS: readonly Interaction["type"][]`
  - `AnswerInput = { correct: boolean; attempt: number; tag?: string; errorClass?: ErrorClass }`
  - `InteractionView({ interaction, goalMet, truth, onAnswer, onReveal, onComplete, onHighlight })`, where:
    - `truth(reveal) => number | null` measures the target after applying the reveal
    - `onReveal(patch)` layers the authored reveal
    - `onComplete()` unlocks the timeline
    - `onHighlight(ids)` lights up plate instances

- [ ] **Step 1: Write the failing test**: `app/apps/web/test/interactions.test.ts`

```ts
import { labs, plates } from "@forma/course-em1";
import { expect, it } from "vitest";
import { RENDERED_INTERACTIONS } from "@/components/plate/rendered";

it("every interaction authored in a plate has a renderer", () => {
  const used = [...Object.values(plates), ...Object.values(labs).map((l) => l.plate)].flatMap((p) => p.steps.flatMap((s) => (s.interaction ? [s.interaction.type] : [])));
  for (const t of used) expect(RENDERED_INTERACTIONS, t).toContain(t);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run apps/web/test/interactions.test.ts`
Expected: FAIL (cannot resolve `@/components/plate/rendered`).

- [ ] **Step 3: `rendered.ts`**

```ts
import type { Interaction } from "@forma/engine";

/** Interaction types the web app renders on a plate. Others arrive with their first content (plan decision D5). */
export const RENDERED_INTERACTIONS: readonly Interaction["type"][] = ["predict-drag", "manipulate-goal", "place", "choose", "numeric", "identify"];
```

- [ ] **Step 4: Export `NumericField`**: in `components/blocks/numeric.tsx`, change `function NumericField(` to `export function NumericField(`.

- [ ] **Step 5: `interactions.tsx`**

```tsx
"use client";

import type { Effect, ErrorClass, Interaction } from "@forma/engine";
import { gradePrediction } from "@forma/plate";
import { Readout } from "@forma/ui";
import { useEffect, useRef, useState } from "react";
import { Feedback } from "../blocks/Feedback";
import { NumericField } from "../blocks/numeric";

export type AnswerInput = { correct: boolean; attempt: number; tag?: string; errorClass?: ErrorClass };
type Patch = Record<string, Record<string, unknown>>;
type Props = {
  interaction: Interaction;
  goalMet: boolean;
  truth: (reveal: Patch) => number | null;
  onAnswer: (a: AnswerInput) => Effect[];
  onReveal: (patch: Patch) => void;
  onComplete: () => void;
  onHighlight: (ids: string[]) => void;
};
type I<T extends Interaction["type"]> = Extract<Interaction, { type: T }>;

function PredictDrag({ i, truth, onAnswer, onReveal, onComplete }: { i: I<"predict-drag"> } & Pick<Props, "truth" | "onAnswer" | "onReveal" | "onComplete">) {
  const [guess, setGuess] = useState((i.range[0] + i.range[1]) / 2);
  const [result, setResult] = useState<{ grade: "close" | "far"; value: number } | null>(null);
  const commit = () => {
    const value = truth(i.reveal);
    if (value === null) return;
    const grade = gradePrediction(guess, value, i.relTol, i.range);
    setResult({ grade, value });
    onReveal(i.reveal);
    onAnswer({ correct: grade === "close", attempt: 1, ...(grade === "far" && i.tag ? { tag: i.tag } : {}) });
    onComplete();
  };
  return (
    <div className="interaction space-y-3">
      <p className="prompt">{i.prompt}</p>
      <input
        type="range" className="w-full" aria-label={`Your prediction, in ${i.unit}`}
        min={i.range[0]} max={i.range[1]} step={(i.range[1] - i.range[0]) / 200}
        value={guess} disabled={!!result} onChange={(e) => setGuess(Number(e.target.value))}
      />
      <div className="readouts">
        <Readout label="Your prediction" value={guess} unit={i.unit} />
        {result && <Readout label="Measured" value={result.value} unit={i.unit} tone="flux" />}
      </div>
      {!result ? (
        <button className="btn btn-primary" onClick={commit}>Commit prediction</button>
      ) : (
        <Feedback correct={result.grade === "close"} text={result.grade === "close" ? i.feedback.close : i.feedback.far} />
      )}
    </div>
  );
}

function Goal({ text, hint, goalMet, onAnswer, onComplete }: { text: string; hint?: string } & Pick<Props, "goalMet" | "onAnswer" | "onComplete">) {
  const done = useRef(false);
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    if (goalMet && !done.current) {
      done.current = true;
      onAnswer({ correct: true, attempt: 1 });
      onComplete();
    }
  }, [goalMet, onAnswer, onComplete]);
  return (
    <div className="interaction space-y-3">
      <p className="prompt">{text}</p>
      {goalMet ? (
        <Feedback correct text="Done. Look at the readouts." />
      ) : (
        hint && (showHint ? <p className="text-soft">{hint}</p> : <button className="btn text-sm" onClick={() => setShowHint(true)}>Hint</button>)
      )}
    </div>
  );
}

function Choose({ i, onAnswer, onComplete }: { i: I<"choose"> } & Pick<Props, "onAnswer" | "onComplete">) {
  const [picked, setPicked] = useState<string | null>(null);
  const [checked, setChecked] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const choice = i.options.find((o) => o.id === checked);
  const check = () => {
    const o = i.options.find((x) => x.id === picked);
    if (!o) return;
    const a = attempt + 1;
    setAttempt(a);
    setChecked(o.id);
    onAnswer({ correct: o.correct, attempt: a, ...(!o.correct && o.tag ? { tag: o.tag } : {}) });
    if (o.correct || a >= 2) onComplete();
  };
  return (
    <fieldset className="interaction space-y-2">
      <legend className="prompt">{i.prompt}</legend>
      {i.options.map((o) => (
        <label key={o.id} className="option flex gap-2">
          <input type="radio" name={i.id} value={o.id} checked={picked === o.id} disabled={!!choice?.correct} onChange={() => setPicked(o.id)} />
          {o.label}
        </label>
      ))}
      {!choice?.correct && <button className="btn btn-primary" disabled={!picked} onClick={check}>Check</button>}
      {choice && <Feedback correct={choice.correct} text={choice.feedback} />}
      {choice?.correct && i.selfExplain && (
        <fieldset className="space-y-1">
          <legend className="text-sm">{i.selfExplain.prompt}</legend>
          {i.selfExplain.options.map((o) => (
            <label key={o.id} className="option flex gap-2 text-sm">
              <input type="radio" name={`${i.id}-why`} checked={reason === o.id} onChange={() => setReason(o.id)} />
              {o.label}
            </label>
          ))}
          {reason && <Feedback correct={!!i.selfExplain.options.find((o) => o.id === reason)?.correct} text={i.selfExplain.options.find((o) => o.id === reason)!.feedback} />}
        </fieldset>
      )}
    </fieldset>
  );
}

function Identify({ i, onAnswer, onComplete, onHighlight }: { i: I<"identify"> } & Pick<Props, "onAnswer" | "onComplete" | "onHighlight">) {
  const [attempt, setAttempt] = useState(0);
  const [last, setLast] = useState<(typeof i.targets)[number] | null>(null);
  return (
    <div className="interaction space-y-2">
      <p className="prompt">{i.prompt}</p>
      <div className="flex flex-wrap gap-2">
        {i.targets.map((t) => (
          <button
            key={t.id} className="btn" disabled={!!last?.correct}
            onFocus={() => onHighlight([t.id])} onMouseEnter={() => onHighlight([t.id])} onBlur={() => onHighlight([])} onMouseLeave={() => onHighlight([])}
            onClick={() => {
              const a = attempt + 1;
              setAttempt(a);
              setLast(t);
              onAnswer({ correct: t.correct, attempt: a, ...(!t.correct && t.tag ? { tag: t.tag } : {}) });
              if (t.correct || a >= 2) onComplete();
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {last && <Feedback correct={last.correct} text={last.feedback} />}
    </div>
  );
}

export function InteractionView(p: Props) {
  const i = p.interaction;
  switch (i.type) {
    case "predict-drag":
      return <PredictDrag i={i} truth={p.truth} onAnswer={p.onAnswer} onReveal={p.onReveal} onComplete={p.onComplete} />;
    case "manipulate-goal":
      return <Goal text={i.goal} goalMet={p.goalMet} onAnswer={p.onAnswer} onComplete={p.onComplete} />;
    case "place":
      return <Goal text={i.prompt} hint={i.hint} goalMet={p.goalMet} onAnswer={p.onAnswer} onComplete={p.onComplete} />;
    case "choose":
      return <Choose i={i} onAnswer={p.onAnswer} onComplete={p.onComplete} />;
    case "identify":
      return <Identify i={i} onAnswer={p.onAnswer} onComplete={p.onComplete} onHighlight={p.onHighlight} />;
    case "numeric":
      return (
        <NumericField
          spec={{ answer: i.answer, relTol: i.relTol, distractors: i.distractors }}
          prompt={i.prompt}
          hints={i.hints}
          onAnswer={(v, attempt) => {
            const fx = p.onAnswer({ correct: v.correct, attempt, ...(v.tag ? { tag: v.tag } : {}), ...(v.errorClass ? { errorClass: v.errorClass } : {}) });
            return { revealWorked: fx.some((e) => e.type === "revealWorkedStep") };
          }}
          onSolved={p.onComplete}
        />
      );
    default:
      return <p className="text-soft">This step's activity isn&apos;t available in this build yet.</p>;
  }
}
```

- [ ] **Step 6: Run tests and typecheck**

Run: `pnpm vitest run apps/web && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS. (`onAnswer` and `onComplete` must be stable callbacks from the player, because `Goal`'s effect depends on them. Task 10 wraps them in `useCallback`.)

- [ ] **Step 7: Commit**

```bash
git add apps/web && git commit -m "feat(web): on-plate interactions (predict-drag, goals, choose, identify, numeric)"
```

---

### Task 10: Web: the plate player (Learn): timeline, margin, overrides, cues, snapshots

**Files:**
- Create: `app/apps/web/lib/playback.ts`, `app/apps/web/components/workspace/Split.tsx`, `app/apps/web/components/plate/PlatePlayer.tsx`
- Test: `app/apps/web/test/playback.test.ts`

**Interfaces:**
- Consumes: Tasks 3, 7–9; `plates`, `registry`, `checks` (`@forma/course-em1`); `pickRoute`, `Block` (`@forma/engine`); store `dispatch`, `setPosition`, `addNote`; `lessonHref`, `conceptHref`, `getLesson`, `getConcept`, `misconceptionFor`, `splitRef`; `conceptProgress`.
- Produces:
  - `answeredFromHistory(history, plateId): Set<string>` (pure)
  - `usePlayback(count, lock, reduced, initial)`: `{ pos, playing, go(i), scrub(p), toggle() }`
  - `useCueClock(cues, key)`: ms since arriving, a silent clock at reading pace
  - `Split({ ratio, onRatio, label, children: [a, b] })`
  - `PlatePlayer({ conceptId, lessonId, returnTo?, snapshotId?, initialStep?, initialBlock?, split, onSplit })`

- [ ] **Step 1: Write the failing test**: `app/apps/web/test/playback.test.ts`

```ts
import { expect, it } from "vitest";
import { answeredFromHistory } from "@/lib/playback";

it("recovers answered interactions for one plate from the event history", () => {
  const h = [
    { type: "answer", conceptId: "c", blockId: "gauss.flux-guess", blockType: "plate", dimensions: [], correct: false, attempt: 1, at: 1 },
    { type: "answer", conceptId: "c", blockId: "faraday.faraday-predict", blockType: "plate", dimensions: [], correct: true, attempt: 1, at: 2 },
    { type: "blockViewed", conceptId: "c", blockId: "gauss#charge", at: 3 },
  ] as const;
  expect([...answeredFromHistory(h as never, "gauss")]).toEqual(["flux-guess"]);
  expect([...answeredFromHistory([], "gauss")]).toEqual([]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run apps/web/test/playback.test.ts`
Expected: FAIL (cannot resolve `@/lib/playback`).

- [ ] **Step 3: `lib/playback.ts`**

```ts
"use client";

import type { LearnEvent } from "@forma/engine";
import type { Cue } from "@forma/plate";
import { useCallback, useEffect, useState } from "react";

/** One step transition, matching the phase windows in @forma/plate `frameAt`. */
export const STEP_MS = 900;

export const answeredFromHistory = (history: readonly LearnEvent[], plateId: string) =>
  new Set(history.flatMap((e) => (e.type === "answer" && e.blockId.startsWith(`${plateId}.`) ? [e.blockId.slice(plateId.length + 1)] : [])));

/** Continuous timeline position animated toward a target step; reduced motion jumps. */
export function usePlayback(count: number, lock: number, reduced: boolean, initial = 0) {
  const max = Math.max(0, Math.min(lock, count - 1));
  const start = Math.min(initial, max);
  const [pos, setPos] = useState(start);
  const [target, setTarget] = useState(start);
  const moving = pos !== target;
  useEffect(() => {
    if (!moving) return;
    if (reduced) {
      setPos(target);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / STEP_MS;
      last = now;
      setPos((p) => (Math.abs(target - p) <= dt ? target : p + Math.sign(target - p) * dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [moving, target, reduced]);
  const go = useCallback((i: number) => setTarget(Math.max(0, Math.min(max, i))), [max]);
  const scrub = useCallback(
    (p: number) => {
      const c = Math.max(0, Math.min(max, p));
      setPos(c);
      setTarget(c);
    },
    [max],
  );
  const toggle = useCallback(() => (moving ? setTarget(pos) : go(Math.floor(pos) + 1)), [moving, pos, go]);
  return { pos, playing: moving, go, scrub, toggle };
}

/** Silent clock for a step's cue track (spec §4.6): runs from arrival until 2 s after the last cue. */
export function useCueClock(cues: readonly Cue[], key: string): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    setT(0);
    if (!cues.length) return;
    const end = Math.max(...cues.map((c) => c.t)) + 2000;
    const t0 = performance.now();
    const id = setInterval(() => {
      const now = performance.now() - t0;
      setT(now);
      if (now > end) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [cues, key]);
  return t;
}
```

- [ ] **Step 4: `components/workspace/Split.tsx`**

```tsx
"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

const clamp = (r: number) => Math.min(0.85, Math.max(0.2, r));

/** Two panes with a draggable, keyboard-operable divider. ratio ≥ 0.999 renders the first pane alone. */
export function Split({ ratio, onRatio, label, children }: { ratio: number; onRatio: (r: number) => void; label: string; children: [ReactNode, ReactNode] }) {
  const box = useRef<HTMLDivElement>(null);
  if (ratio >= 0.999) return <div className="split-full">{children[0]}</div>;
  const drag = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId) || !box.current) return;
    const r = box.current.getBoundingClientRect();
    onRatio(clamp((e.clientX - r.left) / r.width));
  };
  return (
    <div ref={box} className="split" style={{ gridTemplateColumns: `minmax(0, ${ratio}fr) 12px minmax(0, ${1 - ratio}fr)` }}>
      <div className="split-pane">{children[0]}</div>
      <div
        role="separator" aria-orientation="vertical" aria-label={label} tabIndex={0}
        aria-valuemin={20} aria-valuemax={85} aria-valuenow={Math.round(ratio * 100)} className="split-handle"
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)} onPointerMove={drag}
        onKeyDown={(e) => {
          const d = e.key === "ArrowLeft" ? -0.05 : e.key === "ArrowRight" ? 0.05 : 0;
          if (!d) return;
          e.preventDefault();
          onRatio(clamp(ratio + d));
        }}
      />
      <div className="split-pane">{children[1]}</div>
    </div>
  );
}
```

Append to `packages/ui/src/forma.css`:

```css
.split { display: grid; gap: 0; align-items: start; }
.split-pane { min-width: 0; }
.split-handle { align-self: stretch; cursor: col-resize; background: linear-gradient(var(--grid), var(--grid)) center / 1.5px 100% no-repeat; }
.split-handle:hover, .split-handle:focus-visible { background-image: linear-gradient(var(--focus), var(--focus)); }
@media (max-width: 900px) { .split { grid-template-columns: 1fr !important; } .split-handle { display: none; } }
```

- [ ] **Step 5: `components/plate/PlatePlayer.tsx`**

```tsx
"use client";

import { checks, plates, registry } from "@forma/course-em1";
import { pickRoute, type Block, type Effect, type Interaction } from "@forma/engine";
import {
  applyCues, applyOverrides, createEvaluator, frameAt, hiddenReadouts, lockIndex, readAloudText, stateAt, termTargets,
  type Frame, type Overrides, type PlateDef,
} from "@forma/plate";
import { MarginNote, Timeline } from "@forma/ui";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { conceptHref, getLesson, lessonHref, misconceptionFor, splitRef } from "@/lib/course";
import { answeredFromHistory, useCueClock, usePlayback } from "@/lib/playback";
import { conceptProgress } from "@/lib/progress";
import { useStudy } from "@/lib/store";
import { Split } from "../workspace/Split";
import { InteractionView, type AnswerInput } from "./interactions";
import { PlateStage } from "./PlateStage";
import { PlateReadouts } from "./Readouts";

type PlateBlock = Extract<Block, { type: "plate" }>;
type Snapshot = { plateId: string; stepId: string; state: Record<string, { params: Record<string, unknown>; visible: boolean }> };
type Offer = { key: string; text: string; href: string };
const toOverrides = (p: Record<string, Record<string, unknown>>): Overrides => Object.fromEntries(Object.entries(p).map(([id, params]) => [id, { params }]));

function useReducedMotion() {
  const setting = useStudy((s) => s.learner.settings.motion);
  const [media, setMedia] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMedia(m.matches);
    const on = () => setMedia(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return setting === "reduced" || media;
}

function ReadAloud({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => setSupported("speechSynthesis" in window), []);
  useEffect(() => () => window.speechSynthesis?.cancel(), [text]);
  if (!supported) return null;
  return (
    <button
      className="btn text-sm" aria-pressed={speaking}
      onClick={() => {
        speechSynthesis.cancel();
        if (speaking) return setSpeaking(false);
        const u = new SpeechSynthesisUtterance(text);
        u.onend = () => setSpeaking(false);
        setSpeaking(true);
        speechSynthesis.speak(u);
      }}
    >
      🔊 {speaking ? "Stop reading" : "Read this"}
    </button>
  );
}

export function PlatePlayer(props: {
  conceptId: string; lessonId: string; returnTo?: string; snapshotId?: string; initialStep?: number; initialBlock?: string;
  split: number; onSplit: (r: number) => void;
}) {
  const lesson = getLesson(props.conceptId, props.lessonId)!;
  const blocks = lesson.blocks.filter((b): b is PlateBlock => b.type === "plate");
  const snapshot = useStudy((s) => (props.snapshotId ? s.learner.notebook.find((n) => n.id === props.snapshotId)?.plate : undefined));
  const position = useStudy((s) => s.learner.position);
  const start = Math.max(
    0,
    blocks.findIndex((b) =>
      snapshot ? b.plateId === snapshot.plateId : props.initialBlock ? b.id === props.initialBlock : position?.lessonId === props.lessonId && position.conceptId === props.conceptId && b.id === position.blockId,
    ),
  );
  const [bi, setBi] = useState(start);
  const block = blocks[bi]!;
  const plate = plates[block.plateId]!;
  const resumeStep = snapshot?.plateId === plate.id
    ? Math.max(0, plate.steps.findIndex((s) => s.id === snapshot.stepId))
    : props.initialStep ?? (position?.blockId === block.id ? position.plateStep ?? 0 : 0);
  const next = blocks[bi + 1];
  return (
    <PlateRun
      key={block.id} {...props} block={block} plate={plate} resumeStep={resumeStep}
      snapshot={snapshot?.plateId === plate.id ? snapshot : undefined}
      next={next ? { title: plates[next.plateId]!.title, go: () => setBi(bi + 1) } : undefined}
    />
  );
}

function PlateRun({
  conceptId, lessonId, returnTo, split, onSplit, block, plate, resumeStep, snapshot, next,
}: {
  conceptId: string; lessonId: string; returnTo?: string; split: number; onSplit: (r: number) => void;
  block: PlateBlock; plate: PlateDef; resumeStep: number; snapshot?: Snapshot; next?: { title: string; go: () => void };
}) {
  const reduced = useReducedMotion();
  const dispatch = useStudy((s) => s.dispatch);
  const setPosition = useStudy((s) => s.setPosition);
  const addNote = useStudy((s) => s.addNote);
  const narration = useStudy((s) => s.learner.settings.narration);
  const history = useStudy((s) => s.learner.history);
  const evaluate = useMemo(() => createEvaluator(registry, plate.instances), [plate]);

  const [answered, setAnswered] = useState<Set<string>>(() => answeredFromHistory(history, plate.id));
  const lock = lockIndex(plate, answered);
  const pb = usePlayback(plate.steps.length, lock, reduced, resumeStep);
  const index = Math.min(Math.round(pb.pos), plate.steps.length - 1);
  const step = plate.steps[index]!;

  const [overrides, setOverrides] = useState<Overrides>(() => (snapshot ? snapshot.state : {}));
  const [editedAt, setEditedAt] = useState<number | null>(snapshot ? resumeStep : null);
  const [revealed, setRevealed] = useState<{ step: number; o: Overrides } | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const cueMs = useCueClock(step.cues, `${plate.id}:${index}`);

  // Frame: timeline state → learner overrides → authored reveal → cue track.
  const tl = frameAt(plate, pb.pos, { reducedMotion: reduced });
  let state = applyOverrides(tl.state, overrides);
  if (revealed?.step === index) state = applyOverrides(state, revealed.o);
  const cued = applyCues(state, step.cues, cueMs);
  let frame: Frame;
  try {
    frame = evaluate(cued.state);
  } catch {
    frame = evaluate(tl.state);
  }
  const settled = useMemo(() => evaluate(stateAt(plate, index)), [evaluate, plate, index]);

  useEffect(() => {
    setPosition({ conceptId, lessonId, blockId: block.id, branchStack: [], plateStep: index });
    dispatch({ type: "blockViewed", conceptId, blockId: `${plate.id}#${step.id}` });
  }, [conceptId, lessonId, block.id, index, plate.id, step.id, setPosition, dispatch]);

  // Global shortcuts for the lesson (spec §3). Keys a focused control already used are left alone.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable='true'], [role='separator'], [role='radiogroup'], .handle")) return;
      if (e.key === "ArrowRight") pb.go(index + 1);
      else if (e.key === "ArrowLeft") pb.go(index - 1);
      else if (e.key === " " && !t.closest("button, a, summary")) pb.toggle();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pb, index]);

  const interaction = step.interaction;
  const editable =
    interaction?.type === "manipulate-goal" ? plate.instances.filter((x) => registry.get(x.component).handles.length > 0).map((x) => x.id)
    : interaction?.type === "place" ? [interaction.handle.instance]
    : [];
  const goalMet = interaction && (interaction.type === "manipulate-goal" || interaction.type === "place") ? (checks[interaction.check]?.(frame, settled) ?? false) : false;

  const onEdit = useCallback(
    (id: string, params: Record<string, unknown>) => {
      setOverrides((o) => ({ ...o, [id]: { ...o[id], params: { ...o[id]?.params, ...params } } }));
      setEditedAt(index);
    },
    [index],
  );

  const here = conceptHref(conceptId, "learn", { lesson: lessonId, block: block.id, step: String(index) });
  const onAnswer = useCallback(
    (i: Interaction) => (a: AnswerInput): Effect[] => {
      const effects = dispatch({
        type: "answer", conceptId, blockId: `${plate.id}.${i.id}`, blockType: "plate", dimensions: [i.dimension],
        correct: a.correct, attempt: a.attempt, ...(a.tag ? { tag: a.tag } : {}), ...(a.errorClass ? { errorClass: a.errorClass } : {}),
      });
      const learner = useStudy.getState().learner;
      const route = pickRoute(i.routes, {
        outcome: a.correct ? "correct" : "incorrect", attempt: a.attempt, ...(a.tag ? { tag: a.tag } : {}),
        tags: learner.concepts[conceptId]?.tags ?? {}, mastery: (id) => conceptProgress(learner, id).mastery,
      });
      const back = `?return=${encodeURIComponent(here)}`;
      const found: Offer[] = effects.flatMap((e) => {
        if (e.type !== "offerRemediation") return [];
        const { conceptId: c, lessonId: l } = splitRef(e.lessonRef);
        return [{ key: `${e.tag}-${Date.now()}`, text: misconceptionFor(conceptId, e.tag)?.description ?? "Take a short detour.", href: lessonHref(c, l, back) }];
      });
      if (route?.goto.lessonRef) {
        const { conceptId: c, lessonId: l } = splitRef(route.goto.lessonRef);
        found.push({ key: `route-${Date.now()}`, text: route.say ?? "Take a short detour.", href: lessonHref(c, l, back) });
      }
      if (found.length) setOffers((o) => [...o, ...found]);
      if (route?.goto.step) {
        const k = plate.steps.findIndex((s) => s.id === route.goto.step);
        if (k >= 0) {
          setAnswered((s) => new Set(s).add(i.id));
          pb.go(k);
        }
      }
      return effects;
    },
    [dispatch, conceptId, plate, here, pb],
  );
  const onComplete = useCallback(() => interaction && setAnswered((s) => new Set(s).add(interaction.id)), [interaction]);
  const answer = useMemo(() => (interaction ? onAnswer(interaction) : () => []), [interaction, onAnswer]);

  const truth = (reveal: Record<string, Record<string, unknown>>) => {
    if (interaction?.type !== "predict-drag") return null;
    const s = applyOverrides(applyOverrides(stateAt(plate, index), overrides), toOverrides(reveal));
    const v = evaluate(s)[interaction.target.instance]?.model[interaction.target.readout];
    return typeof v === "number" ? v : null;
  };

  const saveSnapshot = async () => {
    const s = applyOverrides(stateAt(plate, index), overrides);
    await addNote({ conceptId, kind: "sim-state", title: `${plate.title} · §${index + 1} ${step.title}`, body: "Saved plate setup", plate: { plateId: plate.id, stepId: step.id, state: s } });
    setStatus("Saved to your notebook. Restore it from there.");
  };

  const last = plate.steps.length - 1;
  const finished = index === last && plate.steps.every((s) => !s.interaction || answered.has(s.interaction.id));
  const hasEdits = Object.keys(overrides).length > 0;

  return (
    <div className="plate-player space-y-4">
      <Split ratio={split} onRatio={onSplit} label="Resize the plate and the margin">
        <div className="space-y-2">
          <PlateStage
            plate={plate} timeline={tl} frame={frame} label={`${plate.title}, §${index + 1}: ${step.title}`}
            highlight={[...highlight, ...cued.highlight]} editable={editable} onEdit={onEdit}
            onTerm={(k) => setHighlight(termTargets(plate, k))}
          />
          <PlateReadouts plate={plate} frame={frame} hidden={hiddenReadouts(plate, index, answered)} />
        </div>
        <aside className="margin space-y-5 pl-4" aria-label="Margin">
          <MarginNote kicker={`§${index + 1} of ${plate.steps.length} · ${plate.title}`} title={step.title}>
            <p>{step.note}</p>
            {step.why && (
              <details>
                <summary>Why?</summary>
                <p>{step.why}</p>
              </details>
            )}
            {step.derivation && (
              <details>
                <summary>Derivation</summary>
                <p>{step.derivation}</p>
              </details>
            )}
            {narration === "device" && <ReadAloud text={readAloudText(plate, index)} />}
          </MarginNote>
          {interaction && (
            <InteractionView
              key={`${plate.id}:${interaction.id}`} interaction={interaction} goalMet={goalMet} truth={truth}
              onAnswer={answer} onReveal={(p) => setRevealed({ step: index, o: toOverrides(p) })} onComplete={onComplete} onHighlight={setHighlight}
            />
          )}
          {offers.map((o) => (
            <div key={o.key} className="fb fb-again text-sm" role="status">
              ↺ {o.text} <Link className="underline" href={o.href}>Take the detour</Link>
            </div>
          ))}
          {hasEdits && editedAt !== null && editedAt !== index && (
            <div className="fb fb-again text-sm" role="status">
              You changed the setup on §{editedAt + 1}.{" "}
              <button className="underline" onClick={() => setEditedAt(index)}>Keep it</button>{" · "}
              <button className="underline" onClick={() => { setOverrides({}); setEditedAt(null); }}>Reset</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-sm">
            {hasEdits && <button className="btn" onClick={() => { setOverrides({}); setEditedAt(null); }}>Reset the setup</button>}
            <button className="btn" onClick={saveSnapshot}>Save this setup to the notebook</button>
          </div>
          {status && <p className="text-sm text-soft" role="status">{status}</p>}
          {finished && (
            <div className="space-y-2">
              {next ? (
                <button className="btn btn-primary" onClick={next.go}>Continue: {next.title} →</button>
              ) : returnTo ? (
                <Link className="btn btn-primary" href={returnTo}>Back to where you were →</Link>
              ) : (
                <Link className="btn btn-primary" href={conceptHref(conceptId, "solve")}>Practise in Solve mode →</Link>
              )}
            </div>
          )}
        </aside>
      </Split>
      <footer className="title-strip">
        <Timeline steps={plate.steps} pos={pb.pos} lock={lock} playing={pb.playing} onScrub={pb.scrub} onTogglePlay={pb.toggle} />
      </footer>
    </div>
  );
}
```

- [ ] **Step 6: Run tests and typecheck**

Run: `pnpm vitest run apps/web && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json)`
Expected: PASS. The player is exercised end to end by the Task 14 Playwright journey. It isn't mounted until Task 13.

- [ ] **Step 7: Commit**

```bash
git add apps/web packages/ui && git commit -m "feat(web): plate player with scrub timeline, margin notes, overrides, cue clock, detours and snapshots"
```

---

### Task 11: Web: the Forma shell: top bar, tool dock, tool panel, footer, library and course overview

**Files:**
- Create:
  - `app/apps/web/lib/tools.ts`
  - `components/shell/ToolDock.tsx`, `components/shell/ToolPanel.tsx`, `components/shell/Calculator.tsx`
  - `components/paper/WorkingPaper.tsx`, `components/map/ConceptMap.tsx`
  - `app/courses/page.tsx`, `app/c/[course]/page.tsx`
- Modify:
  - `components/shell/AppShell.tsx` (rewrite), `lib/ui.ts` (rewrite), `lib/store.ts`
  - `app/paper/page.tsx`, `app/map/page.tsx`
  - `components/screens/HomeScreen.tsx`, `components/screens/LessonScreen.tsx`, `components/shell/SettingsDialog.tsx`
- Delete: `components/shell/ContextDrawer.tsx`

**Interfaces:**
- Consumes: `Mark`, `Wordmark`, `TitleBlock`, `Segmented` (`@forma/ui`); `withLayout`, `withNextSeed`, `evaluateNumeric`, `Mode`, `ToolId` (`@forma/engine`); `conceptHref`.
- Produces:
  - `TOOLS: { id: ToolId; label: string; glyph: string; keywords: string }[]`
  - `useUi`: `{ panel: ToolId | null; paletteOpen: boolean; activeConceptId: string | null; togglePanel(t); openPanel(t); closePanel(); setPalette(open); setActiveConcept(id) }`
  - store: `setLayout(mode, patch)`, `nextVariant(templateId)`
  - `WorkingPaper({ conceptId?, noteId?, compact? })`, `ConceptMap({ height? })`, `ToolBody({ tool, conceptId })`
  - routes `/courses` and `/c/[course]`

- [ ] **Step 1: Tools, UI store and learner store**

`lib/tools.ts`:

```ts
import type { ToolId } from "@forma/engine";

export const TOOLS: { id: ToolId; label: string; glyph: string; keywords: string }[] = [
  { id: "paper", label: "Working paper", glyph: "✎", keywords: "draw sketch pen write" },
  { id: "notebook", label: "Notebook", glyph: "▤", keywords: "notes saved snapshots" },
  { id: "formulas", label: "Formula sheet", glyph: "∑", keywords: "equations formulas" },
  { id: "sources", label: "Sources", glyph: "ⓘ", keywords: "references slides textbook provenance" },
  { id: "calculator", label: "Calculator", glyph: "⌗", keywords: "compute evaluate numbers" },
];
```

Replace `lib/ui.ts`:

```ts
"use client";

import type { ToolId } from "@forma/engine";
import { create } from "zustand";

/** Ephemeral UI state (not persisted). Pinned tools live in the learner's per-mode layouts. */
export const useUi = create<{
  panel: ToolId | null;
  paletteOpen: boolean;
  activeConceptId: string | null;
  togglePanel: (t: ToolId) => void;
  openPanel: (t: ToolId) => void;
  closePanel: () => void;
  setPalette: (open: boolean) => void;
  setActiveConcept: (id: string | null) => void;
}>((set) => ({
  panel: null,
  paletteOpen: false,
  activeConceptId: null,
  togglePanel: (t) => set((s) => ({ panel: s.panel === t ? null : t })),
  openPanel: (t) => set({ panel: t }),
  closePanel: () => set({ panel: null }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
  setActiveConcept: (activeConceptId) => set({ activeConceptId }),
}));
```

In `lib/store.ts`:
- Add `withLayout, withNextSeed, type Mode, type ToolId` to the `@forma/engine` import.
- Add to `Store`: `setLayout: (mode: Mode, patch: Partial<{ split: number; pinned: ToolId[] }>) => void; nextVariant: (templateId: string) => void;`
- Add to the implementation:

```ts
  setLayout: (mode, patch) => set((s) => ({ learner: withLayout(s.learner, mode, patch) })),
  nextVariant: (templateId) => set((s) => ({ learner: withNextSeed(s.learner, templateId) })),
```

- [ ] **Step 2: Extract working paper and the concept map**

`components/paper/WorkingPaper.tsx`:
- Move the whole `WorkingPaper` function from `app/paper/page.tsx` here, with its imports (`Link`, `useEffect`, `useRef`, `useState`, `Editor` type, `getConcept`, `load`, `save`, `TIMED_OUT`, `useStudy`), and export it.
- Change its first lines to:

```tsx
export function WorkingPaper({ conceptId: requested, noteId, compact = false }: { conceptId?: string; noteId?: string; compact?: boolean }) {
  const learner = useStudy((s) => s.learner);
  const addNote = useStudy((s) => s.addNote);
  const note = learner.notebook.find((n) => n.id === noteId && n.kind === "drawing");
  const want = requested ?? note?.conceptId ?? learner.position?.conceptId;
  const conceptId = want && getConcept(want) ? want : "em1.electrostatics.gauss-law";
```

(This deletes the `useSearchParams` read and the two `search.get(...)` uses.)

- In the returned JSX:
  - Wrap the heading block (`<div className="flex flex-wrap items-end justify-between gap-4">…</div>`) in `{!compact && (…)}`.
  - Change the drawing host class to ``className={`working-paper ${compact ? "h-[440px]" : "h-[620px]"} overflow-hidden rounded-xl bg-white`}``.
  - Change the grid class to ``className={compact ? "space-y-3" : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]"}``.
  - Replace the string `StudyBuddy` in `appInfo` with `Forma`.

`app/paper/page.tsx` becomes:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { WorkingPaper } from "@/components/paper/WorkingPaper";

function Paper() {
  const search = useSearchParams();
  return <WorkingPaper {...(search.get("concept") ? { conceptId: search.get("concept")! } : {})} {...(search.get("note") ? { noteId: search.get("note")! } : {})} />;
}

export default function PaperPage() {
  return <Suspense fallback={<p className="p-8 text-soft">Opening working paper…</p>}><Paper /></Suspense>;
}
```

`components/map/ConceptMap.tsx`:
- Move `Ring`, `ConceptNode`, `nodeTypes` and the body of `MapPage` here, with their imports.
- Rename `MapPage` to `export function ConceptMap({ height = 560 }: { height?: number })`, and set the React Flow container's height style to `height`.
- Change the node click navigation from `lessonHref(…mainLesson…)` to `conceptHref(id, "learn")`.
- `app/map/page.tsx` renders its heading copy plus `<ConceptMap />`.

- [ ] **Step 3: Calculator, tool panel, dock**

`components/shell/Calculator.tsx`:

```tsx
"use client";

import { evaluateNumeric } from "@forma/engine";
import { formatValue } from "@forma/ui";
import { useState } from "react";

/** LaTeX-in, number-out. ε₀ is its SI value; anything with a free variable is refused. */
export function Calculator() {
  const [input, setInput] = useState("\\frac{2\\times10^{-6}}{4\\pi (0.5)^2}");
  const value = evaluateNumeric(input);
  return (
    <div className="space-y-2">
      <label className="label block" htmlFor="calc">Expression (LaTeX)</label>
      <input id="calc" className="input w-full font-mono" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
      <output className="readout-value block" aria-live="polite">{value === null ? "Can't evaluate that yet" : `= ${formatValue(value, 6)}`}</output>
      <p className="text-xs text-soft">Use \frac{a}{b}, ^{…}, \pi, \times, \varepsilon_0.</p>
    </div>
  );
}
```

`components/shell/ToolPanel.tsx`:

```tsx
"use client";

import type { ToolId } from "@forma/engine";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Tex } from "@/components/Tex";
import { conceptHref, formulaSheet, getConcept, lessonForPlate } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { TOOLS } from "@/lib/tools";
import { useUi } from "@/lib/ui";
import { WorkingPaper } from "../paper/WorkingPaper";
import { Calculator } from "./Calculator";

export function ToolBody({ tool, conceptId }: { tool: ToolId; conceptId: string | null }) {
  const notebook = useStudy((s) => s.learner.notebook);
  const concept = conceptId ? getConcept(conceptId) : undefined;
  switch (tool) {
    case "paper":
      return <WorkingPaper compact {...(conceptId ? { conceptId } : {})} />;
    case "calculator":
      return <Calculator />;
    case "formulas":
      return (
        <ul className="space-y-3">
          {formulaSheet.map((f) => (
            <li key={f.id}>
              <p className="label">{f.title}</p>
              <Tex latex={f.latex} display />
              <p className="text-xs text-soft">{f.source}</p>
            </li>
          ))}
        </ul>
      );
    case "sources":
      return concept ? (
        <ul className="space-y-2 text-sm">
          {concept.sources.map((s, i) => (
            <li key={i}>{s.doc} · {s.locator}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-soft">Open a concept to see its sources.</p>
      );
    case "notebook":
      return notebook.length ? (
        <ul className="space-y-2 text-sm">
          {notebook.slice(0, 12).map((n) => {
            const lesson = n.plate ? lessonForPlate(n.conceptId, n.plate.plateId) : undefined;
            return (
              <li key={n.id} className="border-b border-line pb-2">
                <p className="font-medium">{n.title}</p>
                {n.plate && lesson && <Link className="underline" href={conceptHref(n.conceptId, "learn", { lesson, snapshot: n.id })}>Restore this setup</Link>}
                {n.kind === "drawing" && <Link className="underline" href={`/paper?note=${encodeURIComponent(n.id)}`}>Open on paper</Link>}
              </li>
            );
          })}
          <li><Link className="underline" href="/notebook">Whole notebook →</Link></li>
        </ul>
      ) : (
        <p className="text-sm text-soft">Nothing saved yet. Save a plate setup or a page of working.</p>
      );
  }
}

export function ToolPanel() {
  const { panel, closePanel, activeConceptId } = useUi();
  const path = usePathname();
  const mode = useSearchParams().get("mode");
  const layouts = useStudy((s) => s.learner.workspace.layouts);
  // Solve shows its pinned tools inside its own split (spec: problem sheet | working paper).
  const pinned = path.startsWith("/c/") && mode !== "solve" ? (layouts[(mode as keyof typeof layouts) ?? "learn"]?.pinned ?? []) : [];
  const shown = [...new Set([...pinned, ...(panel ? [panel] : [])])];
  if (!shown.length) return null;
  return (
    <aside className="tool-panel" aria-label="Tools">
      {shown.map((t) => (
        <section key={t} aria-label={TOOLS.find((x) => x.id === t)!.label} className="space-y-2">
          <header className="flex items-center">
            <h2 className="label">{TOOLS.find((x) => x.id === t)!.label}{pinned.includes(t) && " · pinned"}</h2>
            {t === panel && !pinned.includes(t) && <button className="ml-auto px-2" onClick={closePanel} aria-label="Close tool">✕</button>}
          </header>
          <ToolBody tool={t} conceptId={activeConceptId} />
        </section>
      ))}
    </aside>
  );
}
```

`components/shell/ToolDock.tsx`:

```tsx
"use client";

import type { Mode } from "@forma/engine";
import { usePathname, useSearchParams } from "next/navigation";
import { useStudy } from "@/lib/store";
import { TOOLS } from "@/lib/tools";
import { useUi } from "@/lib/ui";

/** Click opens a tool in the margin; Shift-click pins it for the current mode. */
export function ToolDock() {
  const { panel, togglePanel } = useUi();
  const path = usePathname();
  const mode = (useSearchParams().get("mode") ?? "learn") as Mode;
  const layouts = useStudy((s) => s.learner.workspace.layouts);
  const setLayout = useStudy((s) => s.setLayout);
  const inWorkspace = path.startsWith("/c/") && path.split("/").length === 4;
  const pinned = inWorkspace ? layouts[mode]?.pinned ?? [] : [];
  return (
    <nav className="tool-dock" aria-label="Tools">
      {TOOLS.map((t) => (
        <button
          key={t.id} className="tool-button" aria-pressed={panel === t.id || pinned.includes(t.id)}
          title={`${t.label}${inWorkspace ? " (Shift-click to pin)" : ""}`} aria-label={t.label}
          onClick={(e) => {
            if (e.shiftKey && inWorkspace) setLayout(mode, { pinned: pinned.includes(t.id) ? pinned.filter((x) => x !== t.id) : [...pinned, t.id] });
            else togglePanel(t.id);
          }}
        >
          <span aria-hidden>{t.glyph}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Rewrite `components/shell/AppShell.tsx`**

```tsx
"use client";

import { DAY_MS, type Mode } from "@forma/engine";
import { Mark, Segmented, TitleBlock, Wordmark } from "@forma/ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { conceptHref, course, examDateMs, getConcept } from "@/lib/course";
import { dueCount } from "@/lib/retrieval";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { CommandPalette, useShortcuts } from "./CommandPalette";
import { Hydrated } from "./Providers";
import { SettingsDialog } from "./SettingsDialog";
import { ToolDock } from "./ToolDock";
import { ToolPanel } from "./ToolPanel";

const MODES = [["learn", "Learn"], ["solve", "Solve"], ["explore", "Explore"], ["revise", "Revise"]] as const;
const PAGES: Record<string, string> = {
  "/courses": "Library", "/notebook": "Notebook", "/dashboard": "Progress", "/past-papers": "Past papers",
  "/review": "Review", "/diagnostic": "Readiness check", "/paper": "Working paper", "/lab": "Classic lab", "/map": "Concept map",
};

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

function Shell({ children }: { children: ReactNode }) {
  useShortcuts();
  return (
    <div className="shell">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      <TopBar />
      <ResetNotice />
      <div className="shell-body">
        <ToolDock />
        <main id="main" className="shell-main">
          <Hydrated>{children}</Hydrated>
        </main>
        <ToolPanel />
      </div>
      <StatusFooter />
      <CommandPalette />
    </div>
  );
}

function TopBar() {
  const path = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const setPalette = useUi((s) => s.setPalette);
  const setLayout = useStudy((s) => s.setLayout);
  const lastMode = useStudy((s) => s.learner.workspace.lastMode);
  const [, , courseId, rawConcept] = path.split("/");
  const concept = rawConcept ? getConcept(decodeURIComponent(rawConcept)) : undefined;
  const mode = (search.get("mode") ?? lastMode) as Mode;
  const crumbs: { label: string; href?: string }[] =
    path === "/" ? [{ label: "Desk" }]
    : path.startsWith("/c/") ? [{ label: "Library", href: "/courses" }, { label: course.title, ...(concept ? { href: `/c/${courseId}` } : {}) }, ...(concept ? [{ label: `Unit ${concept.unit}` }, { label: concept.title }] : [])]
    : [{ label: PAGES[path] ?? (path.startsWith("/learn/") ? "Classic lesson" : "Forma") }];
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="Forma: go to your desk">
        <Mark size={22} title="" />
        <Wordmark height={16} title="" />
      </Link>
      <nav aria-label="Breadcrumb" className="crumbs">
        <ol>
          {crumbs.map((c, i) => (
            <li key={i}>{c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>}</li>
          ))}
        </ol>
      </nav>
      {concept && (
        <Segmented
          label="Mode" value={mode} options={MODES}
          onChange={(m) => {
            setLayout(m, {});
            router.replace(conceptHref(concept.id, m));
          }}
        />
      )}
      <div className="topbar-end">
        <button className="btn" onClick={() => setPalette(true)} aria-label="Search and jump (Control K)">⌘K</button>
        <SettingsDialog />
        <span className="label" title="Accounts arrive with sub-project 5">Guest</span>
      </div>
    </header>
  );
}

function StatusFooter() {
  const hydrated = useStudy((s) => s.hydrated);
  const unavailable = useStudy((s) => s.storageUnavailable);
  const learner = useStudy((s) => s.learner);
  const now = useStudy((s) => s.now);
  const days = Math.max(0, Math.ceil((examDateMs - now()) / DAY_MS));
  return (
    <footer className="status-footer">
      <TitleBlock
        cells={[
          { label: "Course", value: course.code },
          { label: "Progress", value: !hydrated ? "…" : unavailable ? "Not saved (memory only)" : "Saved on this device" },
          { label: "Finals", value: `${days} days` },
          { label: "Due reviews", value: hydrated ? String(dueCount(learner, now())) : "…" },
        ]}
      />
    </footer>
  );
}

function ResetNotice() {
  const notice = useStudy((s) => s.resetNotice);
  const unavailable = useStudy((s) => s.storageUnavailable);
  const dismiss = useStudy((s) => s.dismissResetNotice);
  if (unavailable)
    return (
      <div className="fb fb-again m-4" role="status">
        ↺ Your saved progress couldn&apos;t be opened (another tab may be holding it). This session works normally but won&apos;t be saved.
      </div>
    );
  if (!notice) return null;
  return (
    <div className="fb fb-again m-4" role="status">
      ↺ Your saved progress couldn&apos;t be read, so it was backed up and a fresh workspace was started.{" "}
      <button className="underline" onClick={dismiss}>OK</button>
    </div>
  );
}
```

(`CommandPalette` and `useShortcuts` come in Task 12. Until then, create `components/shell/CommandPalette.tsx` containing `export function CommandPalette() { return null; } export function useShortcuts() {}` so this task builds.)

Append to `packages/ui/src/forma.css`:

```css
.shell { min-height: 100vh; display: grid; grid-template-rows: auto auto 1fr auto; }
.topbar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 18px; padding: 8px 16px; background: var(--paper); border-bottom: 1.5px solid var(--ink); }
.brand { display: flex; align-items: center; gap: 10px; color: var(--ink); }
.crumbs ol { display: flex; gap: 8px; font-size: 0.85rem; color: var(--graphite); }
.crumbs li + li::before { content: "›"; margin-right: 8px; }
.topbar-end { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.shell-body { display: flex; min-height: 0; }
.tool-dock { display: flex; flex-direction: column; gap: 4px; padding: 10px 6px; border-right: 1.5px solid var(--ink); }
.tool-button { width: 36px; height: 36px; display: grid; place-items: center; font-size: 1.1rem; border: 1.5px solid transparent; }
.tool-button[aria-pressed="true"] { border-color: var(--ink); background: var(--paper-2); }
.shell-main { flex: 1; min-width: 0; padding: 20px 24px 32px; }
.tool-panel { width: 26rem; max-width: 40vw; border-left: 1.5px solid var(--ink); padding: 14px; display: grid; gap: 20px; align-content: start; background: var(--paper-2); overflow-y: auto; }
.status-footer { padding: 8px 16px; border-top: 1.5px solid var(--ink); }
.title-strip { border-top: 1.5px solid var(--ink); padding-top: 10px; }
@media (max-width: 900px) { .crumbs { display: none; } .tool-panel { position: fixed; inset: auto 0 0 0; width: auto; max-width: none; max-height: 60vh; z-index: 30; } }
```

- [ ] **Step 5: Library, course overview, and the Desk's recent notes**

`app/courses/page.tsx`:

```tsx
import Link from "next/link";
import { course } from "@/lib/course";

export const metadata = { title: "Library" };

export default function CoursesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="kicker">Library</p>
      <h1 className="text-4xl">Courses</h1>
      <Link href={`/c/${course.id}`} className="card block space-y-1 hover:bg-sunken">
        <p className="label">{course.code}</p>
        <h2 className="text-2xl">{course.title}</h2>
        <p className="text-soft">{course.concepts.filter((c) => !c.locked).length} concepts open · finals {course.examDate}</p>
      </Link>
    </div>
  );
}
```

`app/c/[course]/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { ConceptMap } from "@/components/map/ConceptMap";
import { conceptHref, course } from "@/lib/course";
import { conceptProgress, STATE_GLYPH } from "@/lib/progress";
import { useStudy } from "@/lib/store";

export default function CourseOverview() {
  const learner = useStudy((s) => s.learner);
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="kicker">{course.code}</p>
        <h1 className="text-4xl">{course.title}</h1>
      </header>
      <ConceptMap height={420} />
      {course.units.map((u) => (
        <section key={u.number} aria-labelledby={`unit-${u.number}`} className="space-y-2">
          <h2 id={`unit-${u.number}`} className="text-xl">Unit {u.number} · {u.title}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {course.concepts.filter((c) => c.unit === u.number).map((c) => {
              const g = STATE_GLYPH[conceptProgress(learner, c.id).state];
              return (
                <li key={c.id}>
                  {c.locked ? (
                    <span className="card block text-faint">🔒 {c.title}</span>
                  ) : (
                    <Link className="card block hover:bg-sunken" href={conceptHref(c.id, "learn")}>
                      <span aria-label={g.label}>{g.glyph}</span> {c.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
```

(`generateStaticParams` can't live in a client page. Add `app/c/[course]/layout.tsx` exporting `export function generateStaticParams() { return [{ course: "em1" }]; } export const dynamicParams = false; export default function L({ children }: { children: React.ReactNode }) { return children; }`.)

**Desk:** in `components/screens/HomeScreen.tsx`, before the component's final closing `</div>`, add:

```tsx
      {learner.notebook.length > 0 && (
        <section className="card space-y-2" aria-labelledby="recent-notes">
          <h2 id="recent-notes" className="label">Recent in your notebook</h2>
          <ul className="space-y-1 text-sm">
            {learner.notebook.slice(0, 3).map((n) => (
              <li key={n.id}><Link className="underline" href="/notebook">{n.title}</Link></li>
            ))}
          </ul>
        </section>
      )}
```

(`learner` and `Link` are already in scope there. Its `lessonHref` calls now route plate lessons to the workspace, via Task 6.)

**Remaining `useUi` users:** in `components/screens/LessonScreen.tsx`, keep `setActiveConcept` (it still exists). Replace any `openDrawer(x)` elsewhere with `openPanel(x)`, and delete `components/shell/ContextDrawer.tsx`. Check with:

```bash
cd /f/StudyBuddy/app/apps/web && grep -rn "openDrawer\|toggleRail\|railOpen\|drawerTab\|ContextDrawer" --include=*.tsx --include=*.ts . | grep -v node_modules | grep -v .next
```

Expected: no output.

**`SettingsDialog`:**
- rename the Paper theme label `"Studio light"` → `"Paper"`;
- add the option `{ key: "narration", label: "Read aloud", hint: "Shows a “Read this” button that uses this device's voice. Voices differ between devices.", values: [["off", "Off"], ["device", "Device voice"]] }` after `motion`;
- change the export filename to `forma-progress.json`.

- [ ] **Step 6: Run the whole suite, both typechecks and the build**

Run: `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A apps/web packages/ui && git commit -m "feat(web): Forma shell (top bar, breadcrumb, modes switcher, tool dock and panel, title-block footer), library and course overview"
```

---

### Task 12: Web: ⌘K command palette and global shortcuts

**Files:**
- Create: `app/apps/web/lib/commands.ts`, `app/apps/web/test/commands.test.ts`
- Modify: `app/apps/web/components/shell/CommandPalette.tsx` (replace the Task 11 stub)

**Interfaces:**
- Consumes: `rankCommands`, `Command` (`@forma/ui`); `course`, `conceptHref`, `formulaSheet`; `TOOLS`; `useUi`; `@zag-js/dialog`.
- Produces:
  - `PaletteCommand = Command & { action: { kind: "href"; href: string } | { kind: "tool"; tool: ToolId } }`
  - `buildCommands({ dueReviews }): PaletteCommand[]`
  - `CommandPalette()`
  - `useShortcuts()`: ⌘K/Ctrl+K opens the palette; outside text fields, 1–4 switch mode on a concept screen, P opens paper and N the notebook

- [ ] **Step 1: Write the failing test**: `app/apps/web/test/commands.test.ts`

```ts
import { rankCommands } from "@forma/ui";
import { expect, it } from "vitest";
import { buildCommands } from "@/lib/commands";
import { conceptHref, course } from "@/lib/course";

const cmds = buildCommands({ dueReviews: 3 });

it("offers every unlocked concept in all four modes and no locked concept", () => {
  for (const c of course.concepts) {
    const mine = cmds.filter((x) => x.id.startsWith(`c:${c.id}:`));
    expect(mine, c.id).toHaveLength(c.locked ? 0 : 4);
    if (!c.locked) expect(mine.map((m) => m.action)).toContainEqual({ kind: "href", href: conceptHref(c.id, "solve") });
  }
});

it("includes tools, formulas and pages, and ranks a concept+mode query", () => {
  expect(cmds.some((c) => c.action.kind === "tool" && c.action.tool === "calculator")).toBe(true);
  expect(cmds.some((c) => c.group === "Formulas")).toBe(true);
  expect(cmds.find((c) => c.id === "p:/review")!.label).toBe("Due reviews (3)");
  expect(rankCommands("gauss sol", cmds)[0]!.id).toBe("c:em1.electrostatics.gauss-law:solve");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run apps/web/test/commands.test.ts`
Expected: FAIL (cannot resolve `@/lib/commands`).

- [ ] **Step 3: `lib/commands.ts`**

```ts
import type { ToolId } from "@forma/engine";
import type { Command } from "@forma/ui";
import { conceptHref, course, formulaSheet } from "./course";
import { TOOLS } from "./tools";

export type PaletteCommand = Command & { action: { kind: "href"; href: string } | { kind: "tool"; tool: ToolId } };

const MODES = [["learn", "Learn"], ["solve", "Solve"], ["explore", "Explore"], ["revise", "Revise"]] as const;

export function buildCommands({ dueReviews }: { dueReviews: number }): PaletteCommand[] {
  const concepts = course.concepts
    .filter((c) => !c.locked)
    .flatMap((c) =>
      MODES.map(([m, label]) => ({ id: `c:${c.id}:${m}`, label: `${c.title} · ${label}`, group: "Concepts", keywords: `unit ${c.unit}`, action: { kind: "href" as const, href: conceptHref(c.id, m) } })),
    );
  const tools = TOOLS.map((t) => ({ id: `t:${t.id}`, label: t.label, group: "Tools", keywords: t.keywords, action: { kind: "tool" as const, tool: t.id } }));
  const formulas = formulaSheet.map((f) => ({ id: `f:${f.id}`, label: f.title, group: "Formulas", keywords: "formula equation", action: { kind: "tool" as const, tool: "formulas" as const } }));
  const pages = (
    [
      ["/", "Desk"], ["/courses", "Library"], [`/c/${course.id}`, `${course.title} overview`], ["/notebook", "Notebook"],
      ["/dashboard", "Progress dashboard"], ["/past-papers", "Past papers"], ["/review", `Due reviews (${dueReviews})`], ["/diagnostic", "Readiness check"],
    ] as const
  ).map(([href, label]) => ({ id: `p:${href}`, label, group: "Pages", action: { kind: "href" as const, href } }));
  return [...concepts, ...tools, ...formulas, ...pages];
}
```

- [ ] **Step 4: `components/shell/CommandPalette.tsx`**

```tsx
"use client";

import * as dialog from "@zag-js/dialog";
import type { Mode } from "@forma/engine";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import { rankCommands } from "@forma/ui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { buildCommands, type PaletteCommand } from "@/lib/commands";
import { conceptHref, getConcept } from "@/lib/course";
import { dueCount } from "@/lib/retrieval";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";

const MODE_KEYS: Record<string, Mode> = { "1": "learn", "2": "solve", "3": "explore", "4": "revise" };
const typing = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable='true']");

export function useShortcuts() {
  const router = useRouter();
  const path = usePathname();
  const { setPalette, openPanel } = useUi();
  const setLayout = useStudy((s) => s.setLayout);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
        return;
      }
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      const [, c, , raw] = path.split("/");
      const concept = c === "c" && raw ? getConcept(decodeURIComponent(raw)) : undefined;
      const mode = MODE_KEYS[e.key];
      if (mode && concept) {
        setLayout(mode, {});
        router.replace(conceptHref(concept.id, mode));
      } else if (e.key === "p") openPanel("paper");
      else if (e.key === "n") openPanel("notebook");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [path, router, setPalette, openPanel, setLayout]);
}

export function CommandPalette() {
  const { paletteOpen, setPalette, openPanel } = useUi();
  const router = useRouter();
  const learner = useStudy((s) => s.learner);
  const now = useStudy((s) => s.now);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const all = useMemo(() => buildCommands({ dueReviews: dueCount(learner, now()) }), [learner, now]);
  const results = rankCommands(q, all);
  const service = useMachine(dialog.machine, { id: useId(), open: paletteOpen, onOpenChange: (d) => setPalette(d.open) });
  const api = dialog.connect(service, normalizeProps);
  const run = (c: PaletteCommand) => {
    setPalette(false);
    setQ("");
    if (c.action.kind === "href") router.push(c.action.href);
    else openPanel(c.action.tool);
  };
  if (!api.open) return null;
  return (
    <Portal>
      <div {...api.getBackdropProps()} className="fixed inset-0 z-40 bg-black/30" />
      <div {...api.getPositionerProps()} className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-[12vh]">
        <div {...api.getContentProps()} className="palette">
          <h2 {...api.getTitleProps()} className="sr-only">Search and jump</h2>
          <input
            autoFocus className="palette-input" role="combobox" aria-expanded aria-controls="palette-list"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            placeholder="Jump to a concept, mode, tool or formula…" value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter" && results[active]) { e.preventDefault(); run(results[active]); }
            }}
          />
          <ul id="palette-list" role="listbox" aria-label="Results" className="palette-list">
            {results.map((c, i) => (
              <li key={c.id} id={`cmd-${c.id}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onClick={() => run(c)}>
                <span>{c.label}</span>
                <span className="label">{c.group}</span>
              </li>
            ))}
            {!results.length && <li className="text-soft">Nothing matches “{q}”.</li>}
          </ul>
        </div>
      </div>
    </Portal>
  );
}
```

Append to `packages/ui/src/forma.css`:

```css
.palette { width: min(640px, 100%); background: var(--paper-2); border: 1.5px solid var(--ink); }
.palette-input { width: 100%; padding: 12px 14px; font-size: 1rem; border-bottom: 1.5px solid var(--ink); background: transparent; }
.palette-list { max-height: 50vh; overflow-y: auto; }
.palette-list li { display: flex; justify-content: space-between; gap: 12px; padding: 8px 14px; cursor: pointer; }
.palette-list li[aria-selected="true"] { background: var(--grid); }
```

- [ ] **Step 5: Run tests, typecheck, build**

Run: `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -A apps/web packages/ui && git commit -m "feat(web): ⌘K command palette and global shortcuts"
```

---

### Task 13: Web: the concept workspace and the four modes

**Files:**
- Create:
  - `app/apps/web/lib/workspace.ts`, `app/apps/web/test/workspace.test.ts`
  - `components/workspace/{ConceptWorkspace,LearnMode,SolveMode,ExploreMode,ReviseMode}.tsx`
  - `app/c/[course]/[concept]/page.tsx`

**Interfaces:**
- Consumes: Tasks 4, 5, 8–12; `LessonPlayer`, `RetrievalQuiz`, `NumericField`, `ConceptMap`, `pastPapers`.
- Produces:
  - `WorkspaceParams = { mode: Mode; lessonId: string; returnTo?: string; snapshotId?: string; step?: number; blockId?: string }`
  - `parseWorkspaceParams(search: URLSearchParams, concept: Concept, learner: LearnerState): WorkspaceParams`
  - route `/c/[course]/[concept]?mode=&lesson=&return=&snapshot=&step=&block=`

- [ ] **Step 1: Write the failing test**: `app/apps/web/test/workspace.test.ts`

```ts
import { initialState } from "@forma/engine";
import { expect, it } from "vitest";
import { getConcept } from "@/lib/course";
import { parseWorkspaceParams } from "@/lib/workspace";

const concept = getConcept("em1.electrostatics.gauss-law")!;
const learner = { ...initialState(), notebook: [{ id: "n1", createdAt: 1, conceptId: concept.id, kind: "sim-state" as const, title: "t", body: "", plate: { plateId: "gauss", stepId: "law", state: {} } }] };
const parse = (q: string) => parseWorkspaceParams(new URLSearchParams(q), concept, learner);

it("reads good params", () => {
  expect(parse("mode=solve&lesson=why-area&return=%2Fc%2Fem1%2Fx&snapshot=n1&step=2&block=gauss")).toEqual({
    mode: "solve", lessonId: "why-area", returnTo: "/c/em1/x", snapshotId: "n1", step: 2, blockId: "gauss",
  });
});

it("falls back safely on junk, missing and hostile params", () => {
  expect(parse("mode=dance&lesson=nope&snapshot=missing&step=abc")).toEqual({ mode: "learn", lessonId: "main" });
  expect(parse("return=https%3A%2F%2Fevil.example").returnTo).toBeUndefined();
  expect(parse("return=%2F%2Fevil.example").returnTo).toBeUndefined();
  expect(parse("").step).toBeUndefined();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run apps/web/test/workspace.test.ts`
Expected: FAIL (cannot resolve `@/lib/workspace`).

- [ ] **Step 3: `lib/workspace.ts`**

```ts
import type { Concept, LearnerState, Mode } from "@forma/engine";

export const MODES: readonly Mode[] = ["learn", "solve", "explore", "revise"];
export type WorkspaceParams = { mode: Mode; lessonId: string; returnTo?: string; snapshotId?: string; step?: number; blockId?: string };

/** URL → workspace state. Unknown values fall back; `return` must be a same-site path (no open redirect). */
export function parseWorkspaceParams(search: URLSearchParams, concept: Concept, learner: LearnerState): WorkspaceParams {
  const m = search.get("mode");
  const mode = MODES.includes(m as Mode) ? (m as Mode) : learner.workspace.lastMode;
  const l = search.get("lesson");
  const lessonId = l && concept.lessons.some((x) => x.id === l) ? l : concept.lessons[0]!.id;
  const snap = search.get("snapshot");
  const r = search.get("return");
  const st = search.get("step");
  const b = search.get("block");
  return {
    mode,
    lessonId,
    ...(r && r.startsWith("/") && !r.startsWith("//") ? { returnTo: r } : {}),
    ...(snap && learner.notebook.some((n) => n.id === snap && n.plate) ? { snapshotId: snap } : {}),
    ...(st !== null && /^\d+$/.test(st) ? { step: Number(st) } : {}),
    ...(b && concept.lessons.some((x) => x.blocks.some((k) => k.id === b)) ? { blockId: b } : {}),
  };
}
```

- [ ] **Step 4: The modes**

`components/workspace/LearnMode.tsx`:

```tsx
"use client";

import { getLesson, isPlateLesson } from "@/lib/course";
import type { WorkspaceParams } from "@/lib/workspace";
import { PlatePlayer } from "../plate/PlatePlayer";
import { LessonPlayer } from "../player/LessonPlayer";

export function LearnMode({ conceptId, p, split, onSplit }: { conceptId: string; p: WorkspaceParams; split: number; onSplit: (r: number) => void }) {
  const lesson = getLesson(conceptId, p.lessonId)!;
  if (isPlateLesson(lesson))
    return (
      <PlatePlayer
        key={`${p.lessonId}:${p.snapshotId ?? ""}`} conceptId={conceptId} lessonId={p.lessonId} split={split} onSplit={onSplit}
        {...(p.returnTo ? { returnTo: p.returnTo } : {})} {...(p.snapshotId ? { snapshotId: p.snapshotId } : {})}
        {...(p.step !== undefined ? { initialStep: p.step } : {})} {...(p.blockId ? { initialBlock: p.blockId } : {})}
      />
    );
  return (
    <div className="space-y-4">
      <p className="text-sm text-soft">This concept hasn&apos;t been rebuilt as a living plate yet, so it opens as a classic lesson.</p>
      <LessonPlayer conceptId={conceptId} lessonId={p.lessonId} {...(p.returnTo ? { returnTo: p.returnTo } : {})} />
    </div>
  );
}
```

`components/workspace/SolveMode.tsx`:

```tsx
"use client";

import { instantiate, seedOf, type ToolId } from "@forma/engine";
import { Segmented } from "@forma/ui";
import Link from "next/link";
import { useState } from "react";
import { conceptHref, course, templatesFor } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { NumericField } from "../blocks/numeric";
import { ToolBody } from "../shell/ToolPanel";
import { Split } from "./Split";

const TITLES: Record<string, string> = {
  "q06-octant": "Q.06 Octant", "q08-e": "Q.08 |E|", "q08-q": "Q.08 Charge", "q09a-cube": "Q.09(a) Cube", "f2425-qt": "Finals 24-25 Q2(a)",
};

export function SolveMode({ conceptId, split, onSplit, pinned }: { conceptId: string; split: number; onSplit: (r: number) => void; pinned: ToolId[] }) {
  const list = templatesFor(conceptId);
  const [id, setId] = useState(list[0]?.id ?? "");
  const learner = useStudy((s) => s.learner);
  const dispatch = useStudy((s) => s.dispatch);
  const nextVariant = useStudy((s) => s.nextVariant);
  const t = list.find((x) => x.id === id);
  if (!t) {
    const withProblems = course.concepts.filter((c) => templatesFor(c.id).length > 0);
    return (
      <div className="card space-y-2">
        <p>No templated problems for this concept yet.</p>
        {withProblems.map((c) => (
          <Link key={c.id} className="underline block" href={conceptHref(c.id, "solve")}>Practise {c.title} →</Link>
        ))}
      </div>
    );
  }
  const v = instantiate(t, seedOf(learner, t.id));
  const sheet = (
    <section className="problem-sheet space-y-4" aria-label="Problem sheet">
      <Segmented label="Problem" value={t.id} options={list.map((x) => [x.id, TITLES[x.id] ?? x.id] as const)} onChange={setId} />
      <p className="label">Variant {v.seed} · {v.key}</p>
      <NumericField
        key={v.key} spec={v.spec} prompt={v.prompt} hints={v.hints}
        onAnswer={(verdict, attempt) => {
          const fx = dispatch({
            type: "answer", conceptId, blockId: v.key, blockType: "numeric", dimensions: [v.dimension], correct: verdict.correct, attempt,
            ...(verdict.tag ? { tag: verdict.tag } : {}), ...(verdict.errorClass ? { errorClass: verdict.errorClass } : {}),
          });
          return { revealWorked: fx.some((e) => e.type === "revealWorkedStep") };
        }}
        onSolved={() => {}}
      />
      <button className="btn" onClick={() => nextVariant(t.id)}>New variant</button>
    </section>
  );
  if (!pinned.length) return sheet;
  return (
    <Split ratio={split} onRatio={onSplit} label="Resize the problem sheet and your tools">
      {sheet}
      <div className="space-y-6">
        {pinned.map((tool) => <ToolBody key={tool} tool={tool} conceptId={conceptId} />)}
      </div>
    </Split>
  );
}
```

Add `templatesFor` to the re-exports in `lib/course.ts`: `export { templatesFor } from "@forma/course-em1";`.

`components/workspace/ExploreMode.tsx`:

```tsx
"use client";

import { checks, labs, registry, type Lab } from "@forma/course-em1";
import { applyOverrides, createEvaluator, frameAt, stateAt, type Frame, type Overrides } from "@forma/plate";
import { Segmented } from "@forma/ui";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStudy } from "@/lib/store";
import { PlateStage } from "../plate/PlateStage";
import { PlateReadouts } from "../plate/Readouts";

export function ExploreMode({ conceptId }: { conceptId: string }) {
  const lab = labs[conceptId];
  if (!lab) return <p className="card">No living lab for this concept yet. <Link className="underline" href="/lab">Open the classic 3D lab →</Link></p>;
  return <LabBench lab={lab} conceptId={conceptId} />;
}

function LabBench({ lab, conceptId }: { lab: Lab; conceptId: string }) {
  const dispatch = useStudy((s) => s.dispatch);
  const evaluate = useMemo(() => createEvaluator(registry, lab.plate.instances), [lab]);
  const base = useMemo(() => stateAt(lab.plate, 0), [lab]);
  const start = useMemo(() => evaluate(base), [evaluate, base]);
  const [o, setO] = useState<Overrides>({});
  let frame: Frame;
  try {
    frame = evaluate(applyOverrides(base, o));
  } catch {
    frame = start;
  }
  const done = useRef(new Set<string>());
  const [, rerender] = useState(0);
  useEffect(() => {
    for (const e of lab.experiments)
      if (!done.current.has(e.id) && checks[e.check]?.(frame, start)) {
        done.current.add(e.id);
        dispatch({ type: "answer", conceptId, blockId: `${lab.plate.id}.${e.id}`, blockType: "plate", dimensions: ["application"], correct: true, attempt: 1 });
        rerender((n) => n + 1);
      }
  });
  const set = (id: string, params: Record<string, unknown>) => setO((x) => ({ ...x, [id]: { params: { ...x[id]?.params, ...params } } }));
  return (
    <div className="explore">
      <PlateStage plate={lab.plate} timeline={frameAt(lab.plate, 0)} frame={frame} editable={lab.plate.instances.map((i) => i.id)} onEdit={set} label={`${lab.plate.title}: free exploration`} />
      <aside className="instrument-panel space-y-5" aria-label="Instruments">
        <h2 className="text-xl">Instruments</h2>
        {lab.controls.map((c) => {
          const value = frame[c.instance]!.params[c.param];
          return c.kind === "slider" ? (
            <label key={`${c.instance}.${c.param}`} className="block space-y-1">
              <span className="label">{c.label}</span>
              <input type="range" className="w-full" aria-label={c.label} min={c.min} max={c.max} step={c.step} value={Number(value)} onChange={(e) => set(c.instance, { [c.param]: Number(e.target.value) })} />
              <output className="readout-value">{Number(value).toFixed(2)} {c.unit}</output>
            </label>
          ) : (
            <div key={`${c.instance}.${c.param}`} className="space-y-1">
              <span className="label">{c.label}</span>
              <Segmented label={c.label} value={String(value)} options={c.options} onChange={(v) => set(c.instance, { [c.param]: v })} />
            </div>
          );
        })}
        <PlateReadouts plate={lab.plate} frame={frame} />
        <button className="btn" onClick={() => setO({})}>Reset the bench</button>
        <h2 className="text-xl">Experiments</h2>
        <ul className="space-y-3">
          {lab.experiments.map((e) => (
            <li key={e.id} className="experiment card" data-done={done.current.has(e.id)}>
              <p className="kicker">{done.current.has(e.id) ? "✓ Done" : "To try"}</p>
              <h3>{e.title}</h3>
              <p className="text-sm">{e.goal}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
```

`@forma/course-em1` must export the `Lab` type (it does, via `export * from "./labs"`).

Append to `packages/ui/src/forma.css`:

```css
.explore { display: grid; grid-template-columns: minmax(0, 1fr) 20rem; gap: 20px; align-items: start; }
.experiment[data-done="true"] { border-color: var(--ok); }
@media (max-width: 900px) { .explore { grid-template-columns: 1fr; } }
```

`components/workspace/ReviseMode.tsx`:

```tsx
"use client";

import Link from "next/link";
import { pastPapers } from "@/lib/course";
import { ConceptMap } from "../map/ConceptMap";
import { RetrievalQuiz } from "../screens/RetrievalQuiz";
import { Split } from "./Split";

export function ReviseMode({ conceptId, split, onSplit }: { conceptId: string; split: number; onSplit: (r: number) => void }) {
  const exam = pastPapers.filter((q) => q.concepts.some((c) => c.conceptId === conceptId));
  return (
    <Split ratio={split} onRatio={onSplit} label="Resize the map and the review column">
      <section aria-labelledby="rv-map" className="space-y-2">
        <h2 id="rv-map" className="text-xl">Concept map</h2>
        <ConceptMap height={520} />
      </section>
      <div className="space-y-8">
        <section aria-labelledby="rv-due" className="space-y-2">
          <h2 id="rv-due" className="text-xl">Due reviews</h2>
          <RetrievalQuiz count={3} />
        </section>
        <section aria-labelledby="rv-exam" className="space-y-2">
          <h2 id="rv-exam" className="text-xl">Exam view</h2>
          {exam.length ? (
            <ul className="space-y-3">
              {exam.map((q) => (
                <li key={q.id} className="card space-y-1 text-sm">
                  <p className="label">{q.paper} · {q.question} · {q.marks} marks</p>
                  <p>{q.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-soft">No past-paper questions map to this concept yet.</p>
          )}
          <Link className="underline" href="/past-papers">All past papers →</Link>
        </section>
      </div>
    </Split>
  );
}
```

`components/workspace/ConceptWorkspace.tsx`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { course, getConcept } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { parseWorkspaceParams } from "@/lib/workspace";
import { ExploreMode } from "./ExploreMode";
import { LearnMode } from "./LearnMode";
import { ReviseMode } from "./ReviseMode";
import { SolveMode } from "./SolveMode";

export function ConceptWorkspace({ conceptId }: { conceptId: string }) {
  const search = useSearchParams();
  const learner = useStudy((s) => s.learner);
  const setLayout = useStudy((s) => s.setLayout);
  const setActive = useUi((s) => s.setActiveConcept);
  const concept = getConcept(conceptId);
  const p = concept ? parseWorkspaceParams(search, concept, learner) : null;
  useEffect(() => {
    setActive(conceptId);
    return () => setActive(null);
  }, [conceptId, setActive]);
  useEffect(() => {
    if (p && learner.workspace.lastMode !== p.mode) setLayout(p.mode, {});
  }, [p?.mode, learner.workspace.lastMode, setLayout, p]);
  if (!concept || !p || concept.locked)
    return (
      <div className="card">
        That concept isn&apos;t open yet. <Link className="underline" href={`/c/${course.id}`}>Back to the course</Link>
      </div>
    );
  const layout = learner.workspace.layouts[p.mode];
  const onSplit = (split: number) => setLayout(p.mode, { split });
  return (
    <div className="workspace space-y-4" data-mode={p.mode}>
      <header>
        <p className="kicker">Unit {concept.unit} · {course.title}</p>
        <h1 className="text-3xl">{concept.title}</h1>
      </header>
      {p.mode === "learn" && <LearnMode conceptId={conceptId} p={p} split={layout.split} onSplit={onSplit} />}
      {p.mode === "solve" && <SolveMode conceptId={conceptId} split={layout.split} onSplit={onSplit} pinned={layout.pinned} />}
      {p.mode === "explore" && <ExploreMode conceptId={conceptId} />}
      {p.mode === "revise" && <ReviseMode conceptId={conceptId} split={layout.split} onSplit={onSplit} />}
    </div>
  );
}
```

`app/c/[course]/[concept]/page.tsx`:

```tsx
import { course } from "@forma/course-em1";
import { Suspense } from "react";
import { ConceptWorkspace } from "@/components/workspace/ConceptWorkspace";

export function generateStaticParams() {
  return course.concepts.filter((c) => !c.locked).map((c) => ({ course: course.id, concept: c.id }));
}
export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  return (
    <Suspense>
      <ConceptWorkspace conceptId={decodeURIComponent(concept)} />
    </Suspense>
  );
}
```

(Because `app/c/[course]/layout.tsx` already sets `dynamicParams = false` for the course segment, this page's params must include `course`. They do.)

- [ ] **Step 5: Run the whole suite, both typechecks and the build**

Run: `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build)`
Expected: all pass. The build lists `/c/em1/[concept]` with one page per unlocked concept.

- [ ] **Step 6: See it**
- Run `pnpm --dir apps/web dev` and open `http://localhost:3100/c/em1/em1.electrostatics.gauss-law?mode=learn` in the built-in browser.
- Step through §1–§6 with → and scrub the timeline.
- Switch to Blueprint in Settings.
- Try all four modes with the 1–4 keys and ⌘K.
- Fix anything visibly broken before committing. Record fixes in the task's commit message.

- [ ] **Step 7: Commit**

```bash
git add -A apps/web packages/ui && git commit -m "feat(web): concept workspace with Learn, Solve, Explore and Revise modes"
```

---

### Task 14: Playwright: one journey per mode, palette, keyboard, reduced motion, axe in both themes, visual snapshots, throttled CPU

**Files:**
- Create: `app/apps/web/e2e/helpers.ts`, `e2e/modes.spec.ts`, `e2e/a11y.spec.ts`, `e2e/visual.spec.ts`
- Modify: `app/apps/web/e2e/journey.spec.ts`:
  - replace the `test.fixme` "full learning journey" with the plate journey;
  - delete the old a11y test (superseded by `a11y.spec.ts`);
  - keep "return experience", "@perf lab" and "workbench…", updating their selectors where the shell changed.

**Interfaces:**
- Consumes: the UI built in Tasks 7–13. Accessible names used below: "Check", "Commit prediction", "Your prediction, in µC", "Your answer, with units", "Take the detour", "Lesson timeline", "Surface size", "Settings", "Blueprint", "Search and jump (Control K)", "Continue: …", "Back to where you were →", "Practise in Solve mode →".

- [ ] **Step 1: `e2e/helpers.ts`**

```ts
import { expect, type Page } from "@playwright/test";

export const G = "em1.electrostatics.gauss-law";
export const concept = (id: string, q: string) => `/c/em1/${id}?${q}`;

/** Wait for hydration: the workspace heading renders only after the learner store loads. */
export async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator("main h1").first()).toBeVisible();
}

/** Keyboard-only step: leave any focused control, then press →. */
export async function next(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("ArrowRight");
}

export async function margin(page: Page, title: string) {
  await expect(page.getByRole("complementary", { name: "Margin" }).getByRole("heading", { name: title })).toBeVisible();
}

export async function choose(page: Page, label: string) {
  await page.getByRole("radio", { name: label }).check();
  await page.getByRole("button", { name: "Check", exact: true }).click();
}

export async function setTheme(page: Page, name: "Paper" | "Blueprint") {
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name, exact: true }).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400); // store persistence is debounced (250 ms)
}
```

- [ ] **Step 2: The Learn journey**: in `e2e/journey.spec.ts`, replace the `test.fixme("full learning journey", …)` block and its comment with:

```ts
import { choose, concept, G, margin, next, open } from "./helpers";

test("learn: Faraday hook and the six-step Gauss plate, keyboard-first", async ({ page }) => {
  await open(page, concept(G, "mode=learn"));
  await margin(page, "One charge, four materials");
  await choose(page, "Exactly +Q");
  await next(page);
  await margin(page, "Always +Q");
  await page.getByRole("button", { name: /Continue: Electric flux/ }).click();

  await margin(page, "§1 Charge");
  await next(page);
  await margin(page, "§2 Field");
  await next(page);
  await margin(page, "§3 Surface");
  await next(page); // locked until §3 is answered
  await margin(page, "§3 Surface");
  await choose(page, "Always outward");
  await next(page);

  await margin(page, "§4 Flux");
  await expect(page.getByText("Ψ, flux out")).toHaveCount(0); // hidden until the prediction is committed
  await page.getByRole("slider", { name: "Your prediction, in µC" }).fill("2");
  await page.getByRole("button", { name: "Commit prediction" }).click();
  await expect(page.getByText(/Unchanged\. Area ×4, D ÷4/)).toBeVisible();
  await next(page);

  await margin(page, "§5 The law");
  const q2 = page.getByRole("button", { name: /\+3 µC charge/ });
  await q2.focus();
  for (let i = 0; i < 13; i++) await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Done. Look at the readouts.")).toBeVisible();
  await next(page);

  await margin(page, "§6 Prove it");
  await page.getByRole("textbox", { name: "Your answer, with units" }).fill("4 µC");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("✓ Understood.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Practise in Solve mode →" })).toBeVisible();
});

test("learn: two wrong normals open the detour, which returns to the same step", async ({ page }) => {
  await open(page, concept(G, "mode=learn&lesson=main&block=gauss&step=2"));
  await margin(page, "§3 Surface");
  await choose(page, "Along D, whichever way D points");
  await choose(page, "Inward, toward the charge");
  await page.getByRole("link", { name: "Take the detour" }).click();
  await expect(page).toHaveURL(/lesson=normal-direction/);
  await margin(page, "A negative charge");
  await next(page);
  await choose(page, "Negative");
  await page.getByRole("link", { name: "Back to where you were →" }).click();
  await expect(page).toHaveURL(/lesson=main.*step=2/);
  await margin(page, "§3 Surface");
});
```

Keep the existing imports. Delete the old test `"no serious accessibility violations on key screens"`. In "workbench changes the physics…", replace any click on a removed nav link (e.g. `getByRole("link", { name: "Working paper" })`) with `page.goto("/paper")` or `/lab`, keeping every assertion.

- [ ] **Step 3: `e2e/modes.spec.ts`**

```ts
import { expect, test } from "@playwright/test";
import { concept, G, margin, next, open } from "./helpers";

test("solve: a templated variant grades, and a new variant replaces it", async ({ page }) => {
  await open(page, concept("em1.electrostatics.gauss-applications", "mode=solve"));
  await page.getByRole("radio", { name: "Q.09(a) Cube" }).click();
  await expect(page.getByText("Variant 1")).toBeVisible();
  const prompt = await page.getByText(/Find the total flux leaving the cube/).textContent();
  const [, a, b] = prompt!.match(/charges ([\d.]+) µC at .* and ([\d.]+) µC at/)!;
  const sum = Math.round((Number(a) + Number(b)) * 1e4) / 1e4;
  await page.getByRole("textbox", { name: "Your answer, with units" }).fill(`${sum} µC`);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText("✓ Understood.")).toBeVisible();
  await page.getByRole("button", { name: "New variant" }).click();
  await expect(page.getByText("Variant 2")).toBeVisible();
});

test("explore: moving the instruments completes experiment cards", async ({ page }) => {
  await open(page, concept(G, "mode=explore"));
  await page.getByRole("slider", { name: "Surface size" }).fill("2.2");
  await expect(page.locator(".experiment", { hasText: "Resize it" })).toContainText("✓ Done");
  await page.getByRole("radio", { name: "Cube" }).click();
  await expect(page.locator(".experiment", { hasText: "Reshape it" })).toContainText("✓ Done");
});

test("revise: map, due reviews and exam view", async ({ page }) => {
  await open(page, concept(G, "mode=revise"));
  for (const h of ["Concept map", "Due reviews", "Exam view"]) await expect(page.getByRole("heading", { name: h })).toBeVisible();
});

test("⌘K palette and number keys switch concepts and modes", async ({ page }) => {
  await open(page, "/");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("gauss sol");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/gauss-law\?mode=solve/);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("3");
  await expect(page).toHaveURL(/mode=explore/);
  await page.keyboard.press("p");
  await expect(page.getByRole("complementary", { name: "Tools" })).toContainText("Working paper");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("a step change lands immediately, with no tween", async ({ page }) => {
    await open(page, concept(G, "mode=learn&lesson=why-area"));
    await margin(page, "r = 1 m");
    await next(page);
    await expect(page.getByRole("slider", { name: "Lesson timeline" })).toHaveValue("1", { timeout: 150 });
    await margin(page, "r = 2.5 m");
  });
});
```

(`toHaveValue` on a range compares the string value. Under reduced motion the first render after the keypress is already at `1`.)

- [ ] **Step 4: `e2e/a11y.spec.ts`**

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { concept, G, open, setTheme } from "./helpers";

const SCREENS = [
  "/", "/courses", "/c/em1",
  concept(G, "mode=learn"), concept(G, "mode=solve"), concept(G, "mode=explore"), concept(G, "mode=revise"),
  concept("em1.electrostatics.gauss-applications", "mode=learn"), "/notebook", "/review",
];

for (const theme of ["Paper", "Blueprint"] as const)
  test(`no serious axe violations on every screen (${theme})`, async ({ page }) => {
    await open(page, "/");
    await setTheme(page, theme);
    for (const url of SCREENS) {
      await open(page, url);
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${url}: ${v.id} (${v.nodes.length})`)).toEqual([]);
    }
  });
```

- [ ] **Step 5: `e2e/visual.spec.ts`**

```ts
import { expect, test } from "@playwright/test";
import { concept, G, margin, next, open, setTheme } from "./helpers";

test.use({ reducedMotion: "reduce" });

for (const theme of ["Paper", "Blueprint"] as const)
  test(`key plate states (${theme})`, async ({ page }) => {
    await open(page, "/");
    await setTheme(page, theme);
    const shot = async (name: string) => {
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("figure.plate").first()).toHaveScreenshot(`${name}-${theme.toLowerCase()}.png`, { maxDiffPixelRatio: 0.01 });
    };
    await open(page, concept(G, "mode=learn"));
    await margin(page, "One charge, four materials");
    await shot("faraday-first-frame");
    await open(page, concept(G, "mode=learn&lesson=why-area"));
    await shot("why-area-r1");
    await next(page);
    await margin(page, "r = 2.5 m");
    await shot("why-area-r25");
    await open(page, concept(G, "mode=explore"));
    await shot("gauss-lab");
  });
```

- [ ] **Step 6: Throttled CPU**: append to `e2e/modes.spec.ts`:

```ts
test("@perf explore stays responsive on a 4× throttled CPU", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await open(page, concept(G, "mode=explore"));
  const size = page.getByRole("slider", { name: "Surface size" });
  const t0 = Date.now();
  for (let i = 0; i < 20; i++) await size.fill(String(0.5 + i * 0.08));
  await expect(page.getByText("Ψ, flux out")).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(4000); // < 200 ms per update, including the recompute
});
```

- [ ] **Step 7: Run e2e, then create the visual baselines**

```bash
cd /f/StudyBuddy/app/apps/web
pnpm e2e --update-snapshots -g "key plate states"
pnpm e2e
```

Expected: all pass (desktop project, then `@perf` under the throttled project).
- Open the generated PNGs under `e2e/visual.spec.ts-snapshots/` and look at them. They are the owner-facing first frames, so check that they are legible and nothing is clipped.
- If a test fails, fix the app (not the assertion), unless the assertion names something this plan never built. Record that as a ruling.

- [ ] **Step 8: Commit**

```bash
git add -A apps/web && git commit -m "test(e2e): journeys per mode, palette, reduced motion, axe in both themes, visual baselines, throttled CPU"
```

---

### Task 15: Full verification and handoff

**Files:**
- Modify: `app/README.md`

- [ ] **Step 1: Run everything**

Run: `cd /f/StudyBuddy/app && pnpm test && pnpm typecheck && (cd apps/web && ../../node_modules/.bin/tsc -p tsconfig.json && pnpm build && pnpm e2e)`
Expected: all green.

- [ ] **Step 2: Check the success criteria (spec §10) by hand in the dev server**, and write one line per criterion into the commit message: met / not met, and why.
1. The Gauss concept's first frame is a striking, legible plate before any interaction.
2. Each step has ≤ 60 words and a plate change; there is no "possible slide" (already enforced by tests).
3. Scrubbing morphs continuously and intermediate readouts are exact (replay test plus manual scrub).
4. Detours, variants and mastery updates are deterministic.
5. All four modes work with saved layouts; ⌘K and the shortcuts work.
6. Paper and Blueprint pass axe.
7. Owner judgement: leave for the owner.

- [ ] **Step 3: README**: in `app/README.md`:
- add `@forma/ui` to the package table ("Palette with tested contrast, generated theme CSS, fonts, wordmark and mark, primitives");
- replace the Plan B pointer paragraph with a "Using Forma" section listing the routes (`/`, `/courses`, `/c/em1`, `/c/em1/<concept>?mode=learn|solve|explore|revise`) and the shortcuts (← → Space 1–4 P N ⌘K);
- update the test count and add `pnpm --dir apps/web e2e --update-snapshots -g "key plate states"` for intentional visual changes.

- [ ] **Step 4: Commit**

```bash
git add app/README.md && git commit -m "docs: Forma interface handoff"
```

---

## Self-Review Notes

- **Spec coverage:**
  - §1 identity: Tasks 1, 2, 6 (palette, fonts, wordmark and mark, primitives, icon).
  - §1.5 drawing language: Tasks 2 and 7–8 (linework, hatching, dashed dimensions, arrowheads). 3D engraving is decision D3.
  - §3 shell and modes: Tasks 11–13 (top bar, breadcrumb, mode switcher, ⌘K, account placeholder, tool dock with Shift-pin, title-block footer, routes, modes and shortcuts). Themes: Tasks 1 and 6.
  - §4.3 timeline: Tasks 3 and 10 (continuous scrub, 900 ms phased transitions, reduced motion snaps, assessment lock).
  - §4.4 focus links: Tasks 7 and 10 (term click → `termTargets` highlight). The reverse (hovering a component lights its term) is not built: it needs term-level DOM hooks inside KaTeX output. Add it with MathLive (D1).
  - §4.5 learner edits: Task 10 (override layer, keep/reset prompt, snapshot save and exact restore).
  - §4.6 narration hooks: Tasks 3 and 10 (cue clock, `readAloudText`, device reader behind the setting).
  - §4.7: memoised models (Plan A), per-instance error boundaries (Task 8), quality cap (D4).
  - §5 interactions: Task 9 (D5 lists the deferred types); branching via `pickRoute` and rule offers: Task 10; templates in Solve: Task 13.
  - §6 content scope: Learn (plates), Solve (templates), Explore (Gauss lab with experiment cards), Revise (map, reviews, exam view), with the classic renderer for the rest: Tasks 4 and 13.
  - §7 persistence: layouts and seeds (Tasks 5 and 11), snapshots (Task 10).
  - §8 testing: unit (Tasks 1–5, 7, 9, 10, 12, 13); Playwright journey per mode, palette, keyboard traversal, axe in both themes, visual snapshots, 4× CPU (Task 14).
- **Type consistency:**
  - `Overrides` is defined in Task 3 and used in Tasks 10 and 13.
  - `StageApi` / `ViewProps` come from Task 7 and are used by Task 8.
  - `AnswerInput` from Task 9 is used in Task 10.
  - `PaletteCommand` comes from Task 12.
  - `WorkspaceParams` comes from Task 13.
  - Store actions `setLayout` and `nextVariant` (Task 11) are used in Tasks 12 and 13.
  - `TOOLS` (Task 11) is used in Task 12.
  - Readout units come from the Plan A components; `Readouts.tsx` pretty-prints `^2`.
- **Known ceilings (ponytail):**
  - The Desk still embeds the v1 R3F lab preview.
  - The Solve "plate popover" is the pinned-tools pane, not a floating plate.
  - Pinned tools outside Solve stack in the tool panel column.
