"use client";

import { exportBounds, notebookToJSON, notebookToPDF, pageToPNG, pageToSVG, type InkEngine, type Item, type Notebook, type Page } from "@forma/ink";
import { useRef, useState } from "react";
import { loadImages, PRINT_COLORS, toRasters } from "@/lib/ink-bitmaps";
import { inkStore } from "@/lib/ink-store";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ink";

export function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

/** PNG, SVG, PDF, share and backup, in print colours. */
export function ExportMenu({ engine, notebook, page }: { engine: InkEngine; notebook: Notebook; page: Page }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const [status, setStatus] = useState("");
  const items = () => [...engine.items.values()];
  const name = `${slug(notebook.title)}-${notebook.pageIds.indexOf(page.id) + 1}`;
  /** Every page of the notebook; this one from the engine, so unsaved ops are included. */
  const allPages = async () => {
    const got = await Promise.all(notebook.pageIds.map(async (id) => (id === page.id ? { page, items: items() } : inkStore().getPage(id))));
    const missing = got.filter((x) => !x).length;
    if (missing) throw new Error(`${missing} of ${got.length} pages couldn't be read, so it would be incomplete`);
    return got as { page: Page; items: Item[] }[];
  };
  const pdf = async (pages: { page: Page; items: Item[] }[]) => {
    const all = pages.flatMap((p) => p.items);
    const rasters = toRasters(all, await loadImages(all, PRINT_COLORS, 2), 2);
    return new Blob([(await notebookToPDF(pages, PRINT_COLORS, rasters)) as BlobPart], { type: "application/pdf" });
  };
  const run = (label: string, f: () => Promise<void>) => async () => {
    if (menu.current) menu.current.open = false;
    setStatus(`${label}…`);
    try { await f(); setStatus(""); } catch (e) { setStatus(`${label} didn't work: ${e instanceof Error ? e.message : String(e)}`); }
  };

  const png = (selection: boolean) => run("Exporting PNG", async () => {
    const its = selection ? items().filter((i) => engine.selection.has(i.id)) : items();
    const images = await loadImages(its, PRINT_COLORS, 2);
    const blob = await pageToPNG(its, 2, { bounds: selection ? exportBounds(its) : exportBounds(its, page.frame), colors: PRINT_COLORS, bitmap: (it) => images.get(it.id) ?? null, background: PRINT_COLORS["paper-2"] });
    download(blob, `${name}${selection ? "-selection" : ""}.png`);
  });
  const svg = run("Exporting SVG", async () => {
    const its = items();
    const rasters = toRasters(its, await loadImages(its, PRINT_COLORS, 2), 2);
    download(new Blob([pageToSVG(its, { bounds: exportBounds(its, page.frame), colors: PRINT_COLORS, rasters, background: PRINT_COLORS["paper-2"] })], { type: "image/svg+xml" }), `${name}.svg`);
  });
  const pagePdf = run("Exporting PDF", async () => download(await pdf([{ page, items: items() }]), `${name}.pdf`));
  const bookPdf = run("Exporting PDF", async () => download(await pdf(await allPages()), `${slug(notebook.title)}.pdf`));
  const share = run("Sharing", async () => {
    const file = new File([await pdf([{ page, items: items() }])], `${name}.pdf`, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: notebook.title }); } catch (e) { if ((e as Error).name !== "AbortError") throw e; }
    } else download(file, file.name);
  });
  const backup = run("Saving backup", async () => download(new Blob([notebookToJSON(notebook, await allPages())], { type: "application/json" }), `${slug(notebook.title)}.forma-ink.json`));

  const hasSelection = engine.selection.size > 0;
  return (
    <>
      <details ref={menu} className="relative">
        <summary className="btn list-none">Export</summary>
        <div className="ink-menu absolute right-0 z-20 mt-1 flex w-56 flex-col gap-1 rounded border border-[var(--grid)] bg-[var(--paper)] p-2 shadow-sm" role="menu">
          <button role="menuitem" className="btn justify-start" onClick={png(false)}>Page as PNG</button>
          <button role="menuitem" className="btn justify-start" onClick={png(true)} disabled={!hasSelection}>Selection as PNG</button>
          <button role="menuitem" className="btn justify-start" onClick={svg}>Page as SVG</button>
          <button role="menuitem" className="btn justify-start" onClick={pagePdf}>Page as PDF</button>
          <button role="menuitem" className="btn justify-start" onClick={bookPdf}>Notebook as PDF</button>
          <button role="menuitem" className="btn justify-start" onClick={share}>Share page…</button>
          <button role="menuitem" className="btn justify-start" onClick={backup}>Back up notebook</button>
        </div>
      </details>
      {status && <span role="status" className="text-xs text-soft">{status}</span>}
    </>
  );
}
