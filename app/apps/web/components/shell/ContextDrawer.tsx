"use client";

import Link from "next/link";
import { formulaSheet, getConcept } from "@/lib/course";
import { useStudy } from "@/lib/store";
import { useUi } from "@/lib/ui";
import { Tex } from "../Tex";

const TABS = [
  { id: "sources", label: "Sources" },
  { id: "formulas", label: "Formula sheet" },
  { id: "notebook", label: "Notebook" },
] as const;

/** Right-hand context drawer: provenance, formula sheet and recent notes. Closed by default. */
export function ContextDrawer() {
  const { drawerOpen, drawerTab, closeDrawer, openDrawer, activeConceptId } = useUi();
  const notebook = useStudy((s) => s.learner.notebook);
  if (!drawerOpen) return null;
  const concept = activeConceptId ? getConcept(activeConceptId) : undefined;
  return (
    <aside className="w-80 shrink-0 border-l border-line bg-raised px-4 py-4 text-sm" aria-label="Context drawer">
      <div className="mb-3 flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="rounded-md px-2 py-1 text-soft data-[on=true]:bg-sunken data-[on=true]:text-ink"
            data-on={drawerTab === t.id}
            onClick={() => openDrawer(t.id)}
          >
            {t.label}
          </button>
        ))}
        <button className="ml-auto px-2" onClick={closeDrawer} aria-label="Close drawer">
          ✕
        </button>
      </div>

      {drawerTab === "sources" && (
        <div className="space-y-3">
          {concept ? (
            <>
              <p className="label">{concept.title}</p>
              <ul className="space-y-2">
                {concept.sources.map((s, i) => (
                  <li key={i}>
                    <span className="font-medium">{s.doc}</span>
                    <br />
                    <span className="text-soft">{s.locator}</span>
                  </li>
                ))}
              </ul>
              <p className="text-faint">
                Every block also names its own source. Look for the ⓘ at its corner. Quoted UTech and textbook material is marked as restricted.
              </p>
            </>
          ) : (
            <p className="text-soft">Open a lesson to see where its content comes from.</p>
          )}
        </div>
      )}

      {drawerTab === "formulas" && (
        <ul className="space-y-4">
          {formulaSheet.map((f) => (
            <li key={f.id}>
              <p className="label mb-1">{f.title}</p>
              <Tex latex={f.latex} display />
              <p className="text-xs text-faint">{f.source}</p>
            </li>
          ))}
        </ul>
      )}

      {drawerTab === "notebook" && (
        <div className="space-y-3">
          {notebook.length === 0 && <p className="text-soft">Nothing saved yet. Use “Save to notebook” on equations and simulations.</p>}
          {notebook.slice(0, 8).map((n) => (
            <div key={n.id} className="rounded-md border border-line p-2">
              <p className="font-medium">{n.title}</p>
              {n.kind === "equation" ? <Tex latex={n.body} /> : <p className="text-soft">{n.body}</p>}
            </div>
          ))}
          <Link href="/notebook" className="underline">
            Open notebook
          </Link>
        </div>
      )}
    </aside>
  );
}
