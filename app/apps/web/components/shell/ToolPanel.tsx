"use client";

import type { ToolId } from "@forma/engine";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { conceptHref, getConcept, lessonForPlate } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { TOOLS } from "@/lib/tools";
import { useUi } from "@/lib/ui";
import { ConceptInk } from "../ink/InkEditor";
import { FormulaSheet } from "../calc/FormulaSheet";
import { GraphingCalculator } from "../calc/GraphingCalculator";

export function ToolBody({ tool, conceptId }: { tool: ToolId; conceptId: string | null }) {
  const notebook = useStudy((s) => s.learner.notebook);
  const concept = conceptId ? getConcept(conceptId) : undefined;
  switch (tool) {
    case "paper":
      return <ConceptInk conceptId={conceptId && getConcept(conceptId) ? conceptId : "em1.electrostatics.gauss-law"} />;
    case "calculator":
      return (
        <div className="space-y-2">
          <Link className="text-sm underline" href="/calculator">Open full screen ↗</Link>
          <GraphingCalculator />
        </div>
      );
    case "formulas":
      return (
        <div className="space-y-2">
          <Link className="text-sm underline" href="/formulas">Open full screen ↗</Link>
          <FormulaSheet />
        </div>
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

export function useToolState() {
  const { panel, openPanel, closePanel, workspaceMode: mode, toolWidth, setToolWidth, pin, setPin } = useUi();
  const layouts = useStudy((s) => s.learner.workspace.layouts);
  const setLayout = useStudy((s) => s.setLayout);
  const pinnedTool = mode ? layouts[mode].pinned[0] ?? null : pin;
  const tool = panel ?? pinnedTool;
  return {
    tool,
    pinned: tool !== null && tool === pinnedTool,
    width: mode ? layouts[mode].toolWidth : toolWidth,
    setWidth: (w: number) => (mode ? setLayout(mode, { toolWidth: w }) : setToolWidth(w)),
    open: (t: ToolId) => openPanel(t),
    /** Closing a pinned tool unpins it for this mode, so it doesn't come back on the next page. */
    close: () => {
      if (tool === pinnedTool) { if (mode) setLayout(mode, { pinned: [] }); else setPin(null); }
      closePanel();
    },
    togglePin: (t: ToolId) => {
      if (mode) setLayout(mode, { pinned: pinnedTool === t ? [] : [t] });
      else setPin(pinnedTool === t ? null : t);
      openPanel(t);
    },
  };
}

/** Page | handle | tool. The page is always the first child, so opening a tool never remounts it. */
export function ToolSplit({ children }: { children: ReactNode }) {
  const { tool, pinned, width, setWidth, close, togglePin } = useToolState();
  const mode = useUi((s) => s.workspaceMode);
  const loadPin = useUi((s) => s.loadPin);
  useEffect(() => { loadPin(); }, [loadPin]);
  const { activeConceptId, toolExpanded, setToolExpanded } = useUi();
  const box = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const narrow = useNarrow();
  const label = tool ? TOOLS.find((x) => x.id === tool)!.label : "";
  // Hidden page and handle take no grid cells, so an expanded tool is the only (full-width) column.
  const cols = !tool || toolExpanded ? "minmax(0, 1fr)" : `minmax(0, ${1 - width}fr) 12px minmax(0, ${width}fr)`;
  const sheet = !!tool && (narrow || toolExpanded);

  // Expansion belongs to the tool that was expanded; it never carries over to the next one.
  useEffect(() => {
    if (!tool && toolExpanded) setToolExpanded(false);
  }, [tool, toolExpanded, setToolExpanded]);
  // As a full-screen sheet, the tool takes focus; Escape closes it (unless a dialog already used the key).
  useEffect(() => {
    if (tool && narrow) closeButton.current?.focus();
  }, [tool, narrow]);
  useEffect(() => {
    if (!tool) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector("[role=dialog]")) return;
      e.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, close]);
  return (
    <div ref={box} className="tool-split" style={{ gridTemplateColumns: cols }}>
      <div className="tool-split-page" hidden={!!tool && toolExpanded} inert={sheet}>
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
            <button className="btn text-sm" aria-pressed={pinned} onClick={() => togglePin(tool)} title={mode ? "Keep this tool open whenever you use this mode" : "Keep this tool open on every page outside a lesson"}>
              {pinned ? "Pinned" : "Pin"}
            </button>
            <button className="btn text-sm" aria-pressed={toolExpanded} onClick={() => setToolExpanded(!toolExpanded)} aria-label={toolExpanded ? "Show the page again" : "Expand the tool"}>
              ⤢
            </button>
            <button ref={closeButton} className="btn text-sm" onClick={close} aria-label={`Close ${label}`}>✕</button>
          </header>
          <ToolBody tool={tool} conceptId={activeConceptId} />
        </aside>
      )}
    </div>
  );
}

/** Below 900 px the tool pane is a full-screen sheet (matches the CSS breakpoint). */
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 900px)");
    const on = () => setNarrow(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return narrow;
}
