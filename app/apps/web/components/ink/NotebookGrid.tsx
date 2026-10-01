"use client";

import { COLOR_TOKENS, notebookFromJSON, type ColorToken, type Notebook } from "@forma/ink";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { conceptById, course } from "@/lib/course";
import { createNotebook, inkStore, listNotebooksEnsuringScratch } from "@/lib/ink-store";
import { ConfirmDialog } from "./ConfirmDialog";
import { StorageBanner } from "./StorageBanner";

/** The thumbnail of a notebook's first page, or a blank sheet. */
function Thumb({ pageId }: { pageId: string | undefined }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!pageId) return;
    let u: string | null = null, live = true;
    void inkStore().getThumb(pageId).then((b) => { if (b && live) setUrl((u = URL.createObjectURL(b))); });
    return () => { live = false; if (u) URL.revokeObjectURL(u); };
  }, [pageId]);
  return (
    <div className="aspect-[8/5] w-full overflow-hidden rounded border border-[var(--grid)] bg-[var(--paper-2)]">
      {url && <img src={url} alt="" className="h-full w-full object-contain" />}
    </div>
  );
}

/** /ink: every notebook, with search, new, rename and delete. */
export function NotebookGrid() {
  const router = useRouter();
  const [list, setList] = useState<Notebook[] | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [conceptId, setConceptId] = useState("");
  const [color, setColor] = useState<ColorToken>("ink");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [doomed, setDoomed] = useState<Notebook | null>(null);

  const refresh = () => listNotebooksEnsuringScratch().then(setList);
  // First visit: bring old working-paper pages across, then list.
  useEffect(() => { void import("@/lib/ink-migrate").then((m) => m.migrateWorkingPaper()).then(() => refresh()); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const nb = await createNotebook(title.trim() || "Untitled notebook", { color, ...(conceptId ? { conceptId } : {}) });
    router.push(`/ink/${nb.id}/${nb.pageIds[0]}`);
  };
  const rename = async (nb: Notebook, t: string) => {
    setRenaming(null);
    if (t.trim() && t.trim() !== nb.title) { await inkStore().putNotebook({ ...nb, title: t.trim(), updatedAt: Date.now() }); void refresh(); }
  };
  const importer = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");
  /** A backup becomes a new notebook (fresh ids), so importing twice never overwrites anything. */
  const importBackup = async (f: File) => {
    try {
      const { notebook, pages } = notebookFromJSON(await f.text());
      for (const { page, items } of pages) {
        await inkStore().putPage(page);
        if (items.length) await inkStore().applyOp(page.id, { type: "add", items });
      }
      await inkStore().putNotebook(notebook);
      setImportError("");
      void refresh();
    } catch (e) {
      setImportError(`That file couldn't be imported: ${e instanceof Error ? e.message.slice(0, 160) : "unknown error"}`);
    }
  };
  const shown = (list ?? []).filter((n) => n.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Forma Ink</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Notebooks</h1>
          <p className="mt-2 text-sm text-soft">Write by hand, sketch fields, and keep every page.</p>
        </div>
        <div className="flex gap-2">
          <input className="input" type="search" placeholder="Search notebooks" aria-label="Search notebooks" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn" onClick={() => importer.current?.click()}>Import backup</button>
          <input ref={importer} type="file" accept="application/json,.json" className="hidden" aria-label="Backup file" onChange={(e) => { const f = e.target.files?.[0]; if (f) void importBackup(f); e.target.value = ""; }} />
          <button className="btn btn-primary" onClick={() => setCreating((c) => !c)} aria-expanded={creating}>New notebook</button>
        </div>
      </div>
      <StorageBanner />
      {importError && <p className="fb fb-again" role="alert">{importError}</p>}
      {creating && (
        <form className="card flex flex-wrap items-end gap-3" onSubmit={create}>
          <label className="flex flex-col gap-1 text-sm">Title
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled notebook" autoFocus />
          </label>
          <label className="flex flex-col gap-1 text-sm">Concept (optional)
            <select className="input" value={conceptId} onChange={(e) => setConceptId(e.target.value)}>
              <option value="">None</option>
              {course.concepts.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <fieldset className="flex flex-col gap-1 text-sm">
            <legend>Colour</legend>
            <div className="flex gap-1">
              {COLOR_TOKENS.map((c) => (
                <button type="button" key={c} aria-label={`Colour ${c}`} aria-pressed={color === c}
                  className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-[var(--ink)]" : "border-transparent"}`} style={{ background: `var(--${c})` }} onClick={() => setColor(c)} />
              ))}
            </div>
          </fieldset>
          <button className="btn btn-primary">Create</button>
        </form>
      )}
      {list === null ? <p className="text-soft">Opening notebooks…</p> : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {shown.map((nb) => (
            <li key={nb.id} className="card space-y-2" style={{ borderTop: `4px solid var(--${nb.color})` }}>
              <Link href={`/ink/${nb.id}/${nb.pageIds[0] ?? ""}`} aria-label={`Open ${nb.title}`}><Thumb pageId={nb.pageIds[0]} /></Link>
              {renaming === nb.id ? (
                <input className="input w-full" defaultValue={nb.title} aria-label="Notebook title" autoFocus
                  onBlur={(e) => void rename(nb, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setRenaming(null); }} />
              ) : (
                <Link href={`/ink/${nb.id}/${nb.pageIds[0] ?? ""}`} className="block font-semibold">{nb.title}</Link>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {nb.conceptId && conceptById.get(nb.conceptId) && <span className="label rounded border border-[var(--grid)] px-1.5 py-0.5">{conceptById.get(nb.conceptId)!.title}</span>}
                <span className="text-soft">{nb.pageIds.length} {nb.pageIds.length === 1 ? "page" : "pages"}</span>
                <span className="ml-auto flex gap-1">
                  <button className="btn" onClick={() => setRenaming(nb.id)}>Rename</button>
                  <button className="btn" onClick={() => setDoomed(nb)}>Delete</button>
                </span>
              </div>
            </li>
          ))}
          {shown.length === 0 && <li className="text-soft">No notebooks match “{query}”.</li>}
        </ul>
      )}
      <ConfirmDialog
        message={doomed ? `Delete “${doomed.title}” and its ${doomed.pageIds.length} ${doomed.pageIds.length === 1 ? "page" : "pages"}? This can't be undone.` : null}
        onConfirm={() => { if (doomed) void inkStore().deleteNotebook(doomed.id).then(refresh); }}
        onClose={() => setDoomed(null)}
      />
    </div>
  );
}
