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
