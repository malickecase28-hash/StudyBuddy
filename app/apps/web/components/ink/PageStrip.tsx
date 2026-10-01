"use client";

import type { Notebook, Template } from "@forma/ink";
import { useEffect, useState } from "react";
import { inkStore } from "@/lib/ink-store";
import { ConfirmDialog } from "./ConfirmDialog";

function PageThumb({ pageId, version }: { pageId: string; version: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let u: string | null = null, live = true;
    void inkStore().getThumb(pageId).then((b) => { if (b && live) setUrl((u = URL.createObjectURL(b))); });
    return () => { live = false; if (u) { const old = u; setTimeout(() => URL.revokeObjectURL(old), 5000); } }; // the img may still be reading it
  }, [pageId, version]);
  return <div className="h-[60px] w-24 overflow-hidden rounded border border-[var(--grid)] bg-[var(--paper-2)]">{url && <img src={url} alt="" className="h-full w-full object-contain" />}</div>;
}

/** The notebook's pages: open, add with a template, drag to reorder, delete. */
export function PageStrip({ notebook, pageId, version, onOpen, onAdd, onReorder, onDelete }: {
  notebook: Notebook; pageId: string; version: number; onOpen: (id: string) => void;
  onAdd: (t: Template) => void; onReorder: (ids: string[]) => void; onDelete: (id: string) => void;
}) {
  const [template, setTemplate] = useState<Template>("grid");
  const [drag, setDrag] = useState<string | null>(null);
  const [doomed, setDoomed] = useState<string | null>(null);
  const ids = notebook.pageIds;
  const drop = (target: string) => {
    if (!drag || drag === target) return;
    const next = ids.filter((i) => i !== drag);
    next.splice(next.indexOf(target) + (ids.indexOf(drag) < ids.indexOf(target) ? 1 : 0), 0, drag);
    onReorder(next);
  };
  return (
    <nav aria-label="Pages" className="flex items-center gap-2 overflow-x-auto border-t border-[var(--grid)] bg-[var(--paper)] px-2 py-1.5">
      <ol className="flex gap-2">
        {ids.map((id, i) => (
          <li key={id} draggable onDragStart={() => setDrag(id)} onDragEnd={() => setDrag(null)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(id)}
            className={`group relative rounded p-0.5 ${id === pageId ? "outline outline-2 outline-[var(--field)]" : ""}`}>
            <button onClick={() => onOpen(id)} aria-label={`Page ${i + 1}`} aria-current={id === pageId ? "page" : undefined}>
              <PageThumb pageId={id} version={id === pageId ? version : 0} />
              <span className="label block text-center">{i + 1}</span>
            </button>
            {ids.length > 1 && (
              <button className="absolute right-0 top-0 hidden rounded bg-[var(--paper)] px-1 text-xs group-hover:block group-focus-within:block" aria-label={`Delete page ${i + 1}`} onClick={() => setDoomed(id)}>×</button>
            )}
          </li>
        ))}
      </ol>
      <select className="input py-1 text-sm" aria-label="New page template" value={template} onChange={(e) => setTemplate(e.target.value as Template)}>
        {(["blank", "grid", "lined", "dot", "derivation"] as Template[]).map((t) => <option key={t} value={t}>{t[0]!.toUpperCase() + t.slice(1)}</option>)}
      </select>
      <button className="btn" onClick={() => onAdd(template)}>Add page</button>
      <ConfirmDialog message={doomed ? `Delete page ${ids.indexOf(doomed) + 1}? This can't be undone.` : null}
        onConfirm={() => doomed && onDelete(doomed)} onClose={() => setDoomed(null)} />
    </nav>
  );
}
