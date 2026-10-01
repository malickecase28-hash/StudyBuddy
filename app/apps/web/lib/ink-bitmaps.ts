import { localBox, type BitmapProvider, type Colors, type Item } from "@forma/ink";
import { THEMES } from "@forma/ui";
import katex from "katex";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Letters and digits in a mathvariant, as the Unicode math alphanumerics (MathML Core ignores mathvariant). */
const STYLED: Record<string, [number, number, number | null]> = { bold: [0x1d400, 0x1d41a, 0x1d7ce], "bold-italic": [0x1d468, 0x1d482, null] };
const restyle = (variant: string, text: string) => {
  const base = STYLED[variant];
  if (!base) return null;
  return [...text].map((ch) => {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(base[0] + c - 65);
    if (c >= 97 && c <= 122) return String.fromCodePoint(base[1] + c - 97);
    if (c >= 48 && c <= 57 && base[2] !== null) return String.fromCodePoint(base[2] + c - 48);
    return ch;
  }).join("");
};

/** KaTeX as MathML: it renders inside an SVG image with no stylesheet or web fonts to fetch. */
export const mathml = (latex: string, display = false) =>
  katex.renderToString(latex, { output: "mathml", displayMode: display, throwOnError: false })
    .replace(/<(mi|mn|mtext) mathvariant="([a-z-]+)">([^<]*)<\/\1>/g, (m, tag: string, v: string, t: string) => {
      const r = restyle(v, t);
      return r === null ? m : `<${tag}${tag === "mi" && [...r].length === 1 ? ' mathvariant="normal"' : ""}>${r}</${tag}>`;
    });

/** Markdown-lite as in lessons: $maths$, **bold**, *italic*; one line per source line. */
export function textHtml(text: string): string {
  return text.split("\n").map((line) => line.split(/(\$[^$]+\$|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p) =>
    p.startsWith("$") && p.endsWith("$") && p.length > 2 ? mathml(p.slice(1, -1))
    : p.startsWith("**") && p.endsWith("**") && p.length > 4 ? `<b>${esc(p.slice(2, -2))}</b>`
    : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? `<i>${esc(p.slice(1, -1))}</i>`
    : esc(p)).join("") || "&#8203;").map((l) => `<div style="height:24px;white-space:pre">${l}</div>`).join("");
}

export const TEXT_STYLE = "font:16px/24px system-ui,sans-serif;padding:4px 0";
export const EQ_STYLE = "font-size:22px;padding:6px 8px";

/** The HTML a box item shows. Colours are resolved values: an SVG image can't see the page's CSS variables. */
function itemHtml(it: Item, c: Colors): string | null {
  switch (it.kind) {
    case "text": return `<div style="${TEXT_STYLE};color:${c[it.style.color]}">${textHtml(it.text)}</div>`;
    case "equation": return `<div style="${EQ_STYLE};color:${c[it.style.color]}">${mathml(it.latex, true)}</div>`;
    case "bank": return `<div style="box-sizing:border-box;height:100%;padding:10px 12px;border:1px solid ${c.graphite};border-radius:8px;background:${c.paper};color:${c.ink};font:13px/18px system-ui,sans-serif;overflow:hidden">`
      + `<div style="font-weight:600;margin-bottom:4px">${esc(it.title)}</div><div>${esc(it.text)}</div></div>`;
    case "link": return `<div style="box-sizing:border-box;height:100%;padding:4px 12px;border:1px solid ${c.field};border-radius:14px;background:${c.paper};color:${c.field};font:600 13px/18px system-ui,sans-serif;white-space:nowrap">↗ ${esc(it.label)}</div>`;
    default: return null;
  }
}

const svgUrl = (svg: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

/** Measures HTML laid out like a box item would be, in CSS px. */
export function measureHtml(html: string): { w: number; h: number } {
  const d = document.createElement("div");
  Object.assign(d.style, { position: "absolute", left: "-10000px", top: "0", width: "max-content" });
  d.innerHTML = html;
  document.body.appendChild(d);
  const r = d.getBoundingClientRect();
  d.remove();
  return { w: Math.ceil(r.width), h: Math.ceil(r.height) };
}

/** The image source for a box item at `scale` × its size; null for strokes and shapes. */
export function imageSrc(it: Item, c: Colors, scale: number): string | null {
  const box = localBox(it);
  if (it.kind === "image") return it.src;
  if (it.kind === "plate") return svgUrl(it.svg.replace(/^<svg\b/, `<svg width="${box.w * scale}" height="${box.h * scale}"`));
  const html = itemHtml(it, c);
  return html ? svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${box.w * scale}" height="${box.h * scale}" viewBox="0 0 ${box.w} ${box.h}"><foreignObject width="${box.w}" height="${box.h}"><div xmlns="http://www.w3.org/1999/xhtml">${html}</div></foreignObject></svg>`) : null;
}

/** Print colours: the Paper theme, whatever theme is on screen. */
export const PRINT_COLORS: Colors = (() => {
  const p = THEMES.paper;
  return { ink: p.ink, graphite: p.graphite, charge: p.charge, field: p.field, flux: p.flux, surface: p.surface, paper: p.paper, "paper-2": p.paper2, grid: p.grid };
})();

/** Decoded images for every box item, at `scale`, in the given colours. For exports, which can't wait a frame. */
export async function loadImages(items: Item[], c: Colors, scale: number): Promise<Map<string, HTMLImageElement>> {
  const out = new Map<string, HTMLImageElement>();
  await Promise.all(items.map(async (it) => {
    const src = imageSrc(it, c, scale);
    if (!src) return;
    const img = new Image();
    img.src = src;
    try { await img.decode(); out.set(it.id, img); } catch { /* left out of the export */ }
  }));
  return out;
}

/** PNG data URLs of decoded images (for SVG and PDF). An image the browser won't read back is left out. */
export function toRasters(items: Item[], images: Map<string, HTMLImageElement>, scale: number): Map<string, string> {
  const out = new Map<string, string>();
  for (const it of items) {
    const img = images.get(it.id);
    if (!img) continue;
    const b = localBox(it), c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(b.w * scale)); c.height = Math.max(1, Math.round(b.h * scale));
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    try { out.set(it.id, c.toDataURL("image/png")); } catch { /* tainted (foreignObject in some browsers) */ }
  }
  return out;
}

/**
 * Rasters for box items, built off-thread by the browser's image decoder. Text and equations are HTML in an SVG
 * foreignObject; plates are their own SVG; images are their data URL. Rebuilt when the item changes (items are
 * immutable) or the zoom crosses a power of two, so they stay sharp.
 */
export function createBitmapProvider(colors: () => Colors, onReady: () => void): BitmapProvider {
  // Keyed by the colour set too, so a theme switch rebuilds text in the new colours.
  const byColors = new WeakMap<Colors, WeakMap<Item, Map<number, HTMLImageElement | null>>>();
  return (it, zoom) => {
    const c = colors();
    let cache = byColors.get(c);
    if (!cache) byColors.set(c, (cache = new WeakMap()));
    const bucket = it.kind === "image" ? 1 : Math.min(8, Math.max(1, 2 ** Math.ceil(Math.log2(zoom * (window.devicePixelRatio || 1)))));
    let byBucket = cache.get(it);
    if (!byBucket) cache.set(it, (byBucket = new Map()));
    if (byBucket.has(bucket)) return byBucket.get(bucket) ?? null;
    // Until this bucket is ready, show any other bucket already built.
    const fallback = [...byBucket.values()].find((x) => x) ?? null;
    byBucket.set(bucket, null);
    const src = imageSrc(it, c, bucket);
    if (!src) return null;
    const img = new Image();
    img.src = src;
    img.decode().then(() => { byBucket.set(bucket, img); onReady(); }, () => {});
    return fallback;
  };
}
