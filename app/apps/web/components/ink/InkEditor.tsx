"use client";

import { A4, renderToCanvas, type EditRequest, type InkEngine, type Notebook, type Page, type Template, type ToolId } from "@forma/ink";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createBitmapProvider } from "@/lib/ink-bitmaps";
import { inkStore, newPage } from "@/lib/ink-store";
import { EquationEditor } from "./EquationEditor";
import { ExportMenu } from "./ExportMenu";
import { InkCanvas } from "./InkCanvas";
import { InkToolbar, TOOLS } from "./InkToolbar";
import { insertImage, InsertMenu, LinkChips } from "./InsertMenu";
import { PageStrip } from "./PageStrip";
import { plateItem } from "./PlateSnapshotPicker";
import { SelectionHandles } from "./SelectionHandles";
import { StorageBanner } from "./StorageBanner";
import { TextLayer } from "./TextLayer";

const typing = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable], dialog, math-field");

/** A canvas as PNG. If foreignObject text tainted it (some browsers), redraw without the box bitmaps. */
export function canvasBlob(draw: (withBitmaps: boolean) => HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((ok) => {
    try { draw(true).toBlob(ok, "image/png"); } catch { draw(false).toBlob(ok, "image/png"); }
  });
}

/**
 * One page of a notebook: canvas, toolbar, page strip. Every op is saved as it happens. `compact` is the tool-panel
 * version beside a lesson: it opens pages in place and only takes keyboard shortcuts while focus is inside it.
 */
export function InkEditor({ notebookId, pageId, compact = false, onOpenPage }: { notebookId: string; pageId: string; compact?: boolean; onOpenPage?: (id: string) => void }) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<InkEngine | null>(null);
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [missing, setMissing] = useState(false);
  const [tool, setTool] = useState<ToolId>("pen");
  const [edit, setEdit] = useState<EditRequest | null>(null);
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const pageRef = useRef<Page | null>(null);
  const nbRef = useRef<Notebook | null>(null);
  pageRef.current = page;
  nbRef.current = notebook;
  const thumbTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openPage = (id: string) => (onOpenPage ? onOpenPage(id) : router.push(`/ink/${notebookId}/${id}`));

  /** Thumbnail and timestamps, 1 s after the last change. */
  const scheduleThumb = useCallback((touch = true) => {
    clearTimeout(thumbTimer.current);
    thumbTimer.current = setTimeout(() => {
      const p = pageRef.current, nb = nbRef.current;
      if (!engine || !p || !nb) return;
      const colors = engine.renderer.colors(), items = [...engine.items.values()];
      void canvasBlob((bm) => renderToCanvas(items, colors, 320, 200, { background: colors["paper-2"], ...(bm && engine.renderer.bitmap ? { bitmap: engine.renderer.bitmap } : {}) }))
        .then((b) => { if (b) void inkStore().putThumb(p.id, b).then(bump); });
      if (!touch) return;
      const t = Date.now();
      void inkStore().putPage({ ...p, updatedAt: t });
      void inkStore().putNotebook({ ...nb, updatedAt: t });
    }, 1000);
  }, [engine, bump]);

  // Load the notebook and page into the engine.
  useEffect(() => {
    if (!engine) return;
    let live = true;
    void Promise.all([inkStore().getNotebook(notebookId), inkStore().getPage(pageId)]).then(([nb, p]) => {
      if (!live) return;
      if (!nb || !p) { setMissing(true); return; }
      setNotebook(nb); setPage(p.page); setMissing(false); setEdit(null);
      engine.setTemplate(p.page.template);
      engine.load(p.items);
      engine.fitToContent();
      if (!p.items.length) { engine.camera.zoom = 1; engine.camera.x = 0; engine.camera.y = 0; engine.requestFrame(); }
      else if (engine.camera.zoom > 1) engine.setZoom(1); // a little ink opens at 100%, not blown up
      if (p.items.length) void inkStore().getThumb(p.page.id).then((t) => { if (!t && live) scheduleThumb(false); });
      (window as unknown as { __inkLoaded?: number }).__inkLoaded = performance.now();
      bump();
    });
    return () => { live = false; };
  }, [engine, notebookId, pageId, bump, scheduleThumb]);

  // Text, equations, plates, cards and images draw from bitmaps built off the canvas.
  useEffect(() => {
    if (!engine) return;
    engine.setBitmapProvider(createBitmapProvider(() => engine.renderer.colors(), () => { engine.renderer.invalidate(); engine.requestFrame(); }));
  }, [engine]);

  // Pasting an image adds it.
  useEffect(() => {
    if (!engine) return;
    const paste = (e: ClipboardEvent) => {
      if (typing(e.target) || (compact && !root.current?.contains(document.activeElement))) return;
      const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
      if (f) { e.preventDefault(); void insertImage(engine, f); }
    };
    window.addEventListener("paste", paste);
    return () => window.removeEventListener("paste", paste);
  }, [engine, compact]);

  // A4 frame overlay.
  useEffect(() => {
    if (!engine || page?.frame !== "a4") return;
    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = engine.renderer.colors().graphite;
      ctx.lineWidth = 1 / engine.camera.zoom;
      ctx.setLineDash([6 / engine.camera.zoom, 4 / engine.camera.zoom]);
      ctx.strokeRect(0, 0, A4.w, A4.h);
      ctx.setLineDash([]);
    };
    engine.overlays.add(draw);
    engine.requestFrame();
    return () => { engine.overlays.delete(draw); engine.requestFrame(); };
  }, [engine, page?.frame]);

  const updatePage = (patch: Partial<Page>) => {
    bump();
    if (!page || !Object.keys(patch).length) return;
    const next = { ...page, ...patch, updatedAt: Date.now() };
    setPage(next);
    if (patch.template) engine?.setTemplate(patch.template);
    void inkStore().putPage(next);
  };
  const saveNotebook = async (nb: Notebook) => { setNotebook(nb); await inkStore().putNotebook(nb); };
  const chooseTool = (t: ToolId) => { engine?.setTool(t); setTool(t); };

  // Keyboard: capture phase, so the app's global single-key shortcuts don't fire while writing.
  useEffect(() => {
    if (!engine) return;
    const keys = new Map(TOOLS.filter((t) => t.key && t.key.length === 1).map((t) => [t.key!.toLowerCase(), t.id]));
    let spaceHeld = false;
    const down = (e: KeyboardEvent) => {
      if (typing(e.target) || (compact && !root.current?.contains(e.target as Node))) return;
      const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (mod && k === "z") { e.preventDefault(); if (e.shiftKey) engine.redo(); else engine.undo(); bump(); }
      else if (mod && k === "y") { e.preventDefault(); engine.redo(); bump(); }
      else if (mod && k === "0") { e.preventDefault(); engine.fitToContent(); }
      else if (!mod && !e.altKey && e.key === " ") {
        if ((e.target as HTMLElement | null)?.closest?.("button, a, summary")) return; // Space still presses buttons
        e.preventDefault();
        if (!spaceHeld) { spaceHeld = true; engine.setTemporaryTool("hand"); }
      }
      else if (!mod && !e.altKey && keys.has(k) && engine.hasTool(keys.get(k)!)) { e.preventDefault(); chooseTool(keys.get(k)!); }
    };
    const up = (e: KeyboardEvent) => { if (e.key === " " && spaceHeld) { spaceHeld = false; engine.setTemporaryTool(null); } };
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    return () => { window.removeEventListener("keydown", down, true); window.removeEventListener("keyup", up, true); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, bump, compact]);

  /** Lesson tool panel: copy the plate beside it, at its current step. */
  const snapshotStep = () => {
    const svg = document.querySelector<SVGSVGElement>(".tool-split-page svg.plate-svg");
    if (!engine || !svg) return;
    const it = plateItem(engine, svg, location.pathname + location.search, svg.getAttribute("aria-label") ?? "Plate");
    engine.do({ type: "add", items: [it] });
  };

  const addPage = async (t: Template) => {
    if (!notebook) return;
    const p = newPage(notebook.id, t, `Page ${notebook.pageIds.length + 1}`);
    await inkStore().putPage(p);
    await saveNotebook({ ...notebook, pageIds: [...notebook.pageIds, p.id], updatedAt: Date.now() });
    openPage(p.id);
  };
  const deletePage = async (id: string) => {
    if (!notebook || notebook.pageIds.length < 2) return;
    const old = await inkStore().getPage(id);
    if (old?.items.length) await inkStore().applyOp(id, { type: "remove", items: old.items });
    const ids = notebook.pageIds.filter((x) => x !== id);
    await saveNotebook({ ...notebook, pageIds: ids, updatedAt: Date.now() });
    if (id === pageId) openPage(ids[Math.max(0, notebook.pageIds.indexOf(id) - 1)]!);
  };

  if (missing) return (
    <div className="mx-auto max-w-xl space-y-3 py-10">
      <h1 className="text-2xl font-semibold">This page isn&apos;t here</h1>
      <p className="text-soft">It may have been deleted, or it was saved in another browser.</p>
      <Link className="btn" href="/ink">Back to notebooks</Link>
    </div>
  );

  return (
    <div ref={root} tabIndex={-1}
      onPointerDown={() => { if (!root.current?.contains(document.activeElement)) root.current?.focus({ preventScroll: true }); }}
      className={compact ? "flex h-[calc(100dvh-190px)] min-h-[360px] min-w-0 flex-col overflow-hidden outline-none" : "-mx-6 -mb-8 -mt-5 flex h-[calc(100dvh-126px)] min-h-[480px] flex-col outline-none"}>
      <div className="flex items-center gap-3 px-3 py-1.5">
        <Link href={compact ? `/ink/${notebookId}/${pageId}` : "/ink"} className="label">{compact ? "Open full page" : "Notebooks"}</Link>
        {notebook && (
          <input className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none focus:underline" aria-label="Notebook title" defaultValue={notebook.title} key={notebook.id}
            onBlur={(e) => { const t = e.target.value.trim(); if (t && t !== notebook.title) void saveNotebook({ ...notebook, title: t, updatedAt: Date.now() }); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
        )}
        {compact && engine && (
          <>
            <button className="btn" onClick={snapshotStep}>Snapshot this step</button>
            <InsertMenu engine={engine} {...(notebook?.conceptId ? { conceptId: notebook.conceptId } : {})} />
            {notebook && page && <ExportMenu engine={engine} notebook={notebook} page={page} />}
          </>
        )}
      </div>
      <StorageBanner />
      {engine && page && (
        <InkToolbar engine={engine} tool={tool} onTool={chooseTool} page={page} onPage={updatePage} version={version} compact={compact}>
          {!compact && <InsertMenu engine={engine} {...(notebook?.conceptId ? { conceptId: notebook.conceptId } : {})} />}
          {!compact && notebook && <ExportMenu engine={engine} notebook={notebook} page={page} />}
        </InkToolbar>
      )}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <InkCanvas onReady={setEngine} label={page ? `${notebook?.title ?? "Notebook"}, ${page.title}` : "Ink page"}
          events={{
            onChange: (op) => { if (pageRef.current) void inkStore().applyOp(pageRef.current.id, op); scheduleThumb(); bump(); },
            onView: bump, onSelection: bump, onTool: (t) => setTool(t), onEdit: setEdit,
          }} />
        <SelectionHandles engine={engine} version={version} />
        {engine && <LinkChips engine={engine} version={version} />}
        {engine && edit?.kind === "text" && <TextLayer key={edit.item?.id ?? `${edit.at.x},${edit.at.y}`} engine={engine} request={edit} onDone={() => setEdit(null)} />}
        {engine && edit?.kind === "equation" && <EquationEditor key={edit.item?.id ?? `${edit.at.x},${edit.at.y}`} engine={engine} request={edit} onDone={() => setEdit(null)} />}
      </div>
      {notebook && <PageStrip notebook={notebook} pageId={pageId} version={version} onOpen={openPage} onAdd={addPage} onDelete={deletePage}
        onReorder={(ids) => void saveNotebook({ ...notebook, pageIds: ids, updatedAt: Date.now() })} />}
    </div>
  );
}

/** The tool-panel working paper: the concept's notebook, opened on its latest page. */
export function ConceptInk({ conceptId }: { conceptId: string }) {
  const [at, setAt] = useState<{ notebookId: string; pageId: string } | null>(null);
  useEffect(() => {
    let live = true;
    void import("@/lib/ink-migrate").then(async ({ conceptNotebook, migrateWorkingPaper }) => {
      await migrateWorkingPaper();
      const nb = await conceptNotebook(conceptId);
      if (live) setAt({ notebookId: nb.id, pageId: nb.pageIds[nb.pageIds.length - 1]! });
    });
    return () => { live = false; };
  }, [conceptId]);
  if (!at) return <p className="p-2 text-sm text-soft">Opening your working paper…</p>;
  return <InkEditor compact notebookId={at.notebookId} pageId={at.pageId} onOpenPage={(pageId) => setAt({ ...at, pageId })} />;
}
