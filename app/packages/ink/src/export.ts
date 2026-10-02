import { PDFDocument, rgb } from "pdf-lib";
import { applyAffine, itemBounds, localBox, outlineToSvgPath, shapeOutline, strokeOutline, unionRect } from "./geometry";
import { ItemSchema, NotebookSchema, newId, PageSchema, type ColorToken, type Item, type Notebook, type Page, type Rect, type StrokeItem, type Template, type Vec } from "./model";
import { A4, paintOrder, renderToCanvas, type BitmapProvider, type Colors } from "./render";

/** Item id → PNG data URL, for items that aren't vector (text, equations, plates, cards, images). */
export type Rasters = Map<string, string>;
export type ExportColors = Record<ColorToken, string>;

const MARGIN = 24;

/** The page's export rectangle: the A4 sheet when framed, otherwise the content plus a margin. */
export function exportBounds(items: Item[], frame: Page["frame"] = "none"): Rect {
  if (frame === "a4") return { x: 0, y: 0, ...A4 };
  const b = unionRect(items.map(itemBounds)) ?? { x: 0, y: 0, w: 400, h: 300 };
  return { x: b.x - MARGIN, y: b.y - MARGIN, w: b.w + 2 * MARGIN, h: b.h + 2 * MARGIN };
}

const n = (v: number) => Math.round(v * 100) / 100;
const worldPts = (it: Item, pts: Vec[]) => pts.map((p) => applyAffine(it.transform, p));
const strokeWorld = (s: StrokeItem) => worldPts(s, strokeOutline(s));
const shapeWorld = (it: Extract<Item, { kind: "shape" }>) => worldPts(it, shapeOutline(it.shape, it.pts));
const arrowHead = (a: Vec, b: Vec, size: number): [Vec, Vec, Vec] => {
  const ang = Math.atan2(b.y - a.y, b.x - a.x), L = Math.max(10, size * 4);
  return [{ x: b.x - L * Math.cos(ang - 0.45), y: b.y - L * Math.sin(ang - 0.45) }, b, { x: b.x - L * Math.cos(ang + 0.45), y: b.y - L * Math.sin(ang + 0.45) }];
};
const polyline = (pts: Vec[]) => pts.map((p, i) => `${i ? "L" : "M"}${n(p.x)} ${n(p.y)}`).join("");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** One page as standalone SVG. Strokes and shapes are vector paths; box items are their rasters when given. */
export function pageToSVG(items: Item[], opts: { bounds?: Rect; template?: Template; colors: ExportColors; rasters?: Rasters; background?: string }): string {
  const r = opts.bounds ?? exportBounds(items);
  const out: string[] = [];
  if (opts.background) out.push(`<rect x="${n(r.x)}" y="${n(r.y)}" width="${n(r.w)}" height="${n(r.h)}" fill="${opts.background}"/>`);
  for (const it of paintOrder(items)) {
    const c = opts.colors[it.style.color];
    if (it.kind === "stroke") {
      const op = it.style.opacity * (it.tool === "highlighter" ? 0.35 : 1);
      out.push(`<path d="${outlineToSvgPath(strokeWorld(it))}" fill="${c}"${op < 1 ? ` fill-opacity="${op}"` : ""}/>`);
    } else if (it.kind === "shape") {
      const pts = shapeWorld(it);
      let d = polyline(pts);
      if (it.shape === "arrow" && pts.length >= 2) d += polyline(arrowHead(pts[pts.length - 2]!, pts[pts.length - 1]!, it.style.size));
      out.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width="${it.style.size}" stroke-linecap="round" stroke-linejoin="round"/>`);
    } else {
      const src = opts.rasters?.get(it.id);
      if (!src) continue;
      const b = localBox(it), t = it.transform;
      out.push(`<image href="${esc(src)}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" transform="matrix(${t.map(n).join(" ")})"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(r.w)}" height="${n(r.h)}" viewBox="${n(r.x)} ${n(r.y)} ${n(r.w)} ${n(r.h)}">${out.join("")}</svg>`;
}

/** One page (or a selection) as PNG at `scale` × CSS px. */
export async function pageToPNG(items: Item[], scale: number, opts: { bounds?: Rect; colors: Colors; bitmap?: BitmapProvider; background?: string }): Promise<Blob> {
  const r = opts.bounds ?? exportBounds(items);
  const draw = (bitmap?: BitmapProvider) => renderToCanvas(items, opts.colors, Math.round(r.w * scale), Math.round(r.h * scale), { rect: r, pad: 0, ...(opts.background ? { background: opts.background } : {}), ...(bitmap ? { bitmap } : {}) });
  const blob = (c: HTMLCanvasElement) => new Promise<Blob | null>((ok) => c.toBlob(ok, "image/png"));
  let out: Blob | null;
  try { out = await blob(draw(opts.bitmap)); } catch { out = await blob(draw()); } // a tainted canvas: export the vector parts
  if (!out) throw new Error("PNG export failed");
  return out;
}

/** "#rrggbb" or "rgb(r, g, b)" → pdf-lib colour. */
function pdfColor(css: string) {
  const h = /^#([0-9a-f]{6})$/i.exec(css.trim());
  if (h) { const v = parseInt(h[1]!, 16); return rgb(((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255); }
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(css);
  return m ? rgb(Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255) : rgb(0, 0, 0);
}
const dataUrlBytes = (url: string) => Uint8Array.from(atob(url.slice(url.indexOf(",") + 1)), (c) => c.charCodeAt(0));

/**
 * A notebook (or one page) as PDF: one PDF page per Ink page, A4 when framed, otherwise sized to the content.
 * Strokes and shapes are vector paths; box items are the PNG rasters given (2× is enough for print).
 */
export async function notebookToPDF(pages: { page: Page; items: Item[] }[], colors: ExportColors, rasters: Rasters = new Map()): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const PT = 0.75; // CSS px → PDF points
  for (const { page, items } of pages) {
    const r = exportBounds(items, page.frame);
    const pp = doc.addPage([r.w * PT, r.h * PT]);
    // drawSvgPath puts the path's origin at (x, y) with y pointing down, so shift world coordinates by the bounds.
    const at = { x: -r.x * PT, y: r.h * PT + r.y * PT, scale: PT };
    for (const it of paintOrder(items)) {
      const color = pdfColor(colors[it.style.color]);
      if (it.kind === "stroke") {
        pp.drawSvgPath(outlineToSvgPath(strokeWorld(it)), { ...at, color, borderWidth: 0, opacity: it.style.opacity * (it.tool === "highlighter" ? 0.35 : 1) });
      } else if (it.kind === "shape") {
        const pts = shapeWorld(it);
        const paths = [polyline(pts), ...(it.shape === "arrow" && pts.length >= 2 ? [polyline(arrowHead(pts[pts.length - 2]!, pts[pts.length - 1]!, it.style.size))] : [])];
        for (const d of paths) pp.drawSvgPath(d, { ...at, borderColor: color, borderWidth: it.style.size, borderOpacity: it.style.opacity });
      } else {
        const src = rasters.get(it.id);
        if (!src) continue;
        const img = await doc.embedPng(dataUrlBytes(src));
        const b = itemBounds(it);
        pp.drawImage(img, { x: (b.x - r.x) * PT, y: (r.h - (b.y - r.y) - b.h) * PT, width: b.w * PT, height: b.h * PT });
      }
    }
  }
  return doc.save();
}

/** Backup: the notebook, its pages and items. */
export function notebookToJSON(n: Notebook, pages: { page: Page; items: Item[] }[]): string {
  return JSON.stringify({ version: 1, notebook: n, pages });
}

/** Restore a backup as a new notebook: validated, and every id re-minted so it never collides with the original. */
export function notebookFromJSON(json: string): { notebook: Notebook; pages: { page: Page; items: Item[] }[] } {
  const raw = JSON.parse(json) as { version?: number; notebook?: unknown; pages?: { page?: unknown; items?: unknown[] }[] };
  if (raw.version !== 1 || !Array.isArray(raw.pages)) throw new Error("Not a Forma Ink backup.");
  const nb = NotebookSchema.parse(raw.notebook);
  const nbId = newId(), now = Date.now();
  const pages = raw.pages.map((p) => {
    const page = PageSchema.parse(p.page);
    return { page: { ...page, id: newId(), notebookId: nbId }, items: (p.items ?? []).map((x) => ({ ...ItemSchema.parse(x), id: newId() })), old: page.id };
  });
  const order = nb.pageIds.map((id) => pages.find((p) => p.old === id)).filter((p): p is (typeof pages)[number] => !!p);
  const ordered = [...order, ...pages.filter((p) => !order.includes(p))];
  return {
    notebook: { ...nb, id: nbId, pageIds: ordered.map((p) => p.page.id), createdAt: now, updatedAt: now },
    pages: ordered.map(({ page, items }) => ({ page, items })),
  };
}
