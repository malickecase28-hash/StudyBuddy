"use client";

import { COLOR_TOKENS, toggleRuler, type InkEngine, type Page, type Template, type ToolId } from "@forma/ink";

export const TOOLS: { id: ToolId; label: string; key?: string }[] = [
  { id: "pen", label: "Pen", key: "P" },
  { id: "highlighter", label: "Highlighter", key: "H" },
  { id: "eraser", label: "Eraser", key: "E" },
  { id: "precise-eraser", label: "Precise eraser" },
  { id: "lasso", label: "Select", key: "L" },
  { id: "shape", label: "Shapes", key: "S" },
  { id: "text", label: "Text", key: "T" },
  { id: "equation", label: "Equation", key: "M" },
  { id: "ruler", label: "Ruler", key: "R" },
  { id: "hand", label: "Hand", key: "Space" },
];
export const SIZES = [{ label: "Fine", size: 1.5 }, { label: "Medium", size: 3 }, { label: "Bold", size: 6 }];
const TEMPLATES: [Template, string][] = [["blank", "Blank"], ["grid", "Grid"], ["lined", "Lined"], ["dot", "Dot"], ["derivation", "Derivation"]];

/** Tools, size, colour, history, zoom, template and frame for one page. */
export function InkToolbar({ engine, tool, onTool, page, onPage, version, compact = false, children }: {
  engine: InkEngine; tool: ToolId; onTool: (t: ToolId) => void; page: Page; onPage: (p: Partial<Page>) => void; version: number; compact?: boolean; children?: React.ReactNode;
}) {
  void version;
  const style = engine.style;
  return (
    <div role="toolbar" aria-label="Ink tools" className={`flex min-w-0 ${compact ? "flex-nowrap overflow-x-auto" : "flex-wrap"} items-center gap-1 border-b border-[var(--grid)] bg-[var(--paper)] px-2 py-1.5 text-sm [&>*]:shrink-0`}>
      {TOOLS.filter((t) => engine.hasTool(t.id)).map((t) => (
        <button key={t.id} className={`btn ${tool === t.id ? "btn-primary" : ""}`} aria-pressed={tool === t.id} title={t.key ? `${t.label} (${t.key})` : t.label} {...(t.key ? { "aria-keyshortcuts": t.key } : {})} onClick={() => onTool(t.id)}>{t.label}</button>
      ))}
      <span className="mx-1 h-6 w-px bg-[var(--grid)]" aria-hidden />
      {SIZES.map((s) => (
        <button key={s.size} className={`btn ${style.size === s.size ? "btn-primary" : ""}`} aria-pressed={style.size === s.size} aria-label={`${s.label} line`} title={`${s.label} line`} onClick={() => { engine.setStyle({ size: s.size }); onPage({}); }}>
          <span aria-hidden className="inline-block rounded-full bg-current" style={{ width: s.size + 2, height: s.size + 2 }} />
        </button>
      ))}
      {COLOR_TOKENS.map((c) => (
        <button key={c} aria-label={`Colour ${c}`} aria-pressed={style.color === c} title={c}
          className={`h-7 w-7 rounded-full border-2 ${style.color === c ? "border-[var(--ink)]" : "border-transparent"}`} style={{ background: `var(--${c})` }}
          onClick={() => { engine.setStyle({ color: c }); onPage({}); }} />
      ))}
      <span className="mx-1 h-6 w-px bg-[var(--grid)]" aria-hidden />
      <button className="btn" onClick={() => engine.undo()} disabled={!engine.history.canUndo()} title="Undo (Ctrl+Z)" aria-keyshortcuts="Control+Z">Undo</button>
      <button className="btn" onClick={() => engine.redo()} disabled={!engine.history.canRedo()} title="Redo (Ctrl+Y)" aria-keyshortcuts="Control+Y Control+Shift+Z">Redo</button>
      <span className="mx-1 h-6 w-px bg-[var(--grid)]" aria-hidden />
      <button className="btn tabular-nums" onClick={() => engine.setZoom(1)} title="Zoom to 100%" aria-label={`Zoom ${Math.round(engine.camera.zoom * 100)}%, reset to 100%`}>{Math.round(engine.camera.zoom * 100)}%</button>
      <button className="btn" onClick={() => engine.fitToContent()} title="Fit (Ctrl+0)" aria-keyshortcuts="Control+0">Fit</button>
      <button className={`btn ${engine.ruler ? "btn-primary" : ""}`} aria-pressed={!!engine.ruler} onClick={() => { toggleRuler(engine); onPage({}); }}>Show ruler</button>
      <span className="ml-auto" />
      {children}
      <label className="flex items-center gap-1">
        <span className="label">Template</span>
        <select className="input py-1" value={page.template} onChange={(e) => onPage({ template: e.target.value as Template })}>
          {TEMPLATES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <button className={`btn ${page.frame === "a4" ? "btn-primary" : ""}`} aria-pressed={page.frame === "a4"} onClick={() => onPage({ frame: page.frame === "a4" ? "none" : "a4" })}>A4 frame</button>
    </div>
  );
}
