"use client";

import type { ToolId } from "@forma/engine";
import Link from "next/link";
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
  const { panel, closePanel, activeConceptId, workspaceMode: mode } = useUi();
  const layouts = useStudy((s) => s.learner.workspace.layouts);
  // Solve shows its pinned tools inside its own split (spec: problem sheet | working paper).
  const pinned = mode && mode !== "solve" ? layouts[mode].pinned : [];
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
