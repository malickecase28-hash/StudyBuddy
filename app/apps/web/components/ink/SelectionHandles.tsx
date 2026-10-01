"use client";

import { useEffect, useRef } from "react";
import { COLOR_TOKENS, rotateAbout, scaleAbout, type InkEngine, type Vec } from "@forma/ink";

type Drag = { t: ReturnType<InkEngine["transformSelection"]>; kind: "scale" | "rotate"; anchor: Vec; from: Vec };

/**
 * Overlay for the lasso selection: its bounds, four corner scale handles, a rotate handle and a small action bar.
 * Each handle drag previews live and commits one `update` op on release. `version` re-renders it when the view,
 * selection or items change.
 */
export function SelectionHandles({ engine, version, onConvert }: { engine: InkEngine | null; version: number; onConvert?: () => void }) {
  const drag = useRef<Drag | null>(null);

  useEffect(() => {
    if (!engine) return;
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea, [contenteditable]")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); void engine.paste(); return; }
      if (!engine.selection.size) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); engine.deleteSelection(); }
      else if (e.key === "Escape") engine.select([]);
      else if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); engine.copySelection(); }
      else if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); engine.duplicateSelection(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [engine]);

  void version;
  const b = engine?.selection.size ? engine.selectionBounds() : null;
  if (!engine || !b) return null;
  const cam = engine.camera;
  const tl = cam.toScreen(b.x, b.y), br = cam.toScreen(b.x + b.w, b.y + b.h);
  const corners: Vec[] = [{ x: b.x, y: b.y }, { x: b.x + b.w, y: b.y }, { x: b.x + b.w, y: b.y + b.h }, { x: b.x, y: b.y + b.h }];
  const centre = { x: b.x + b.w / 2, y: b.y + b.h / 2 };

  const world = (e: React.PointerEvent) => { const r = engine.host.getBoundingClientRect(); return cam.toWorld(e.clientX - r.left, e.clientY - r.top); };
  const start = (kind: Drag["kind"], anchor: Vec) => (e: React.PointerEvent) => {
    e.stopPropagation();
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    drag.current = { t: engine.transformSelection(), kind, anchor, from: world(e) };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = world(e);
    if (d.kind === "rotate") {
      d.t.set(rotateAbout(Math.atan2(p.y - d.anchor.y, p.x - d.anchor.x) - Math.atan2(d.from.y - d.anchor.y, d.from.x - d.anchor.x), d.anchor));
    } else {
      const k = (a: number, b: number) => { const r = b ? a / b : 1; return Math.sign(r || 1) * Math.max(0.05, Math.abs(r)); };
      let sx = k(p.x - d.anchor.x, d.from.x - d.anchor.x), sy = k(p.y - d.anchor.y, d.from.y - d.anchor.y);
      if (!e.shiftKey) sx = sy = Math.sign(sx) * Math.max(Math.abs(sx), Math.abs(sy)); // keep proportions unless Shift
      d.t.set(scaleAbout(sx, sy, d.anchor));
    }
  };
  const end = () => { drag.current?.t.commit(); drag.current = null; };
  const cancel = () => { drag.current?.t.cancel(); drag.current = null; };
  const handle = "absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-[var(--field)] bg-[var(--paper)] touch-none";

  return (
    <div className="pointer-events-none absolute inset-0" data-testid="ink-selection">
      <div className="absolute border border-dashed border-[var(--field)]" style={{ left: tl.x, top: tl.y, width: br.x - tl.x, height: br.y - tl.y }} />
      {corners.map((c, i) => {
        const s = cam.toScreen(c.x, c.y);
        return (
          <div key={i} role="slider" aria-label="Scale selection" aria-valuenow={1} tabIndex={-1}
            className={`${handle} pointer-events-auto ${i % 2 ? "cursor-nesw-resize" : "cursor-nwse-resize"}`} style={{ left: s.x, top: s.y }}
            onPointerDown={start("scale", corners[(i + 2) % 4]!)} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} />
        );
      })}
      <div role="slider" aria-label="Rotate selection" aria-valuenow={0} tabIndex={-1}
        className={`${handle} pointer-events-auto cursor-grab rounded-full`} style={{ left: (tl.x + br.x) / 2, top: tl.y - 24 }}
        onPointerDown={start("rotate", centre)} onPointerMove={move} onPointerUp={end} onPointerCancel={cancel} />
      <div className="pointer-events-auto absolute flex gap-1 rounded border border-[var(--grid)] bg-[var(--paper)] p-1 text-xs shadow-sm"
        style={{ left: tl.x, top: Math.max(4, tl.y - 64) }} role="toolbar" aria-label="Selection">
        <button className="btn" onClick={() => engine.duplicateSelection()}>Duplicate</button>
        <button className="btn" onClick={() => engine.copySelection()}>Copy</button>
        <button className="btn" onClick={() => engine.deleteSelection()}>Delete</button>
        {onConvert && [...engine.selection].some((id) => engine.items.get(id)?.kind === "stroke") && <button className="btn" onClick={onConvert}>Convert to equation</button>}
        {COLOR_TOKENS.map((c) => (
          <button key={c} aria-label={`Colour ${c}`} className="h-6 w-6 rounded-full border border-[var(--grid)]" style={{ background: `var(--${c})` }} onClick={() => engine.recolorSelection(c)} />
        ))}
      </div>
    </div>
  );
}
