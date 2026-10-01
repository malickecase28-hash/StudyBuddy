import { itemBounds, localBox, outlineToSvgPath, shapeOutline, strokeOutline, intersects } from "./geometry";
import type { Camera } from "./camera";
import type { ColorToken, Item, ShapeItem, StrokeItem, Template } from "./model";
import { COLOR_TOKENS } from "./model";
import type { GridIndex } from "./spatial";

export type Colors = Record<ColorToken | "paper" | "paper-2" | "grid", string>;
/** Supplies a raster for box items (text, equation, image, plate, bank, link); null = not ready yet. */
export type BitmapProvider = (it: Item) => CanvasImageSource | null;

const pathCache = new WeakMap<object, Path2D>();
const strokePath = (s: StrokeItem) => {
  let p = pathCache.get(s);
  if (!p) pathCache.set(s, (p = new Path2D(outlineToSvgPath(strokeOutline(s)))));
  return p;
};

function arrowHead(ctx: CanvasRenderingContext2D, a: { x: number; y: number }, b: { x: number; y: number }, size: number) {
  const ang = Math.atan2(b.y - a.y, b.x - a.x), L = Math.max(10, size * 4);
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - L * Math.cos(ang - 0.45), b.y - L * Math.sin(ang - 0.45));
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - L * Math.cos(ang + 0.45), b.y - L * Math.sin(ang + 0.45));
  ctx.stroke();
}

/** Draws one item into ctx, whose transform already maps world → device. Shared by the screen and export. */
export function drawItem(ctx: CanvasRenderingContext2D, it: Item, colors: Colors, bitmap?: BitmapProvider, zoom = 1): void {
  ctx.save();
  ctx.transform(...it.transform);
  const col = colors[it.style.color];
  ctx.globalAlpha = it.style.opacity;
  if (it.kind === "stroke") {
    if (it.tool === "highlighter") ctx.globalAlpha = it.style.opacity * 0.35;
    if (it.style.size * zoom < 1.5) {
      // Level of detail: hairline-thin at this zoom, so a plain polyline looks the same and costs far less.
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(it.style.size, 0.75 / zoom);
      ctx.beginPath();
      it.points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.stroke();
    } else {
      ctx.fillStyle = col;
      ctx.fill(strokePath(it));
    }
  } else if (it.kind === "shape") {
    drawShape(ctx, it, col);
  } else {
    const box = localBox(it);
    const img = bitmap?.(it) ?? null;
    if (img) ctx.drawImage(img, box.x, box.y, box.w, box.h);
    else {
      ctx.strokeStyle = colors.graphite;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.setLineDash([]);
      ctx.fillStyle = colors.graphite;
      ctx.font = "13px system-ui, sans-serif";
      const label = it.kind === "text" ? it.text.slice(0, 60) : it.kind === "equation" ? it.latex.slice(0, 60) : it.kind === "link" ? it.label : it.kind === "bank" ? it.title : it.kind === "plate" ? it.caption : "image";
      ctx.fillText(label, box.x + 6, box.y + 18, Math.max(10, box.w - 12));
    }
  }
  ctx.restore();
}

function drawShape(ctx: CanvasRenderingContext2D, s: ShapeItem, col: string) {
  const pts = shapeOutline(s.shape, s.pts);
  ctx.strokeStyle = col;
  ctx.lineWidth = s.style.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
  if (s.shape === "arrow" && s.pts.length >= 2) arrowHead(ctx, s.pts[s.pts.length - 2]!, s.pts[s.pts.length - 1]!, s.style.size);
}

/** Items in paint order: highlighters beneath everything else, then by z. */
export const paintOrder = (items: Item[]) => [...items].sort((a, b) => ((a.kind === "stroke" && a.tool === "highlighter" ? 0 : 1) - (b.kind === "stroke" && b.tool === "highlighter" ? 0 : 1)) || a.z - b.z);

/** Three stacked canvases: template background, committed items (redrawn only when dirty), live overlay (every frame). */
export class Renderer {
  readonly bg: HTMLCanvasElement;
  readonly items: HTMLCanvasElement;
  readonly live: HTMLCanvasElement;
  w = 0; h = 0; dpr = 1;
  template: Template = "grid";
  bitmap?: BitmapProvider;
  private dirty = true;
  private camKey = "";
  private colorsCache: Colors | null = null;
  private ro: ResizeObserver;

  constructor(private host: HTMLElement, private onResize: () => void) {
    const mk = (name: string) => {
      const c = document.createElement("canvas");
      c.dataset.layer = name;
      Object.assign(c.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" });
      host.appendChild(c);
      return c;
    };
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    this.bg = mk("bg"); this.items = mk("items"); this.live = mk("live");
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
  }

  private resize() {
    const r = this.host.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    for (const c of [this.bg, this.items, this.live]) { c.width = Math.round(this.w * this.dpr); c.height = Math.round(this.h * this.dpr); }
    this.dirty = true; this.camKey = "";
    this.onResize();
  }

  /** Theme tokens resolved from CSS; refresh on theme change. */
  colors(): Colors {
    if (this.colorsCache) return this.colorsCache;
    const cs = getComputedStyle(this.host);
    const get = (k: string) => cs.getPropertyValue(`--${k}`).trim() || "black";
    const out = Object.fromEntries([...COLOR_TOKENS, "paper", "paper-2", "grid"].map((k) => [k, get(k)])) as Colors;
    return (this.colorsCache = out);
  }
  refreshColors(): void { this.colorsCache = null; this.dirty = true; this.camKey = ""; }
  invalidate(): void { this.dirty = true; }

  private worldCtx(c: HTMLCanvasElement, cam: Camera) {
    const ctx = c.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    const k = this.dpr * cam.zoom;
    ctx.setTransform(k, 0, 0, k, -cam.x * k, -cam.y * k);
    return ctx;
  }

  private drawBg(cam: Camera) {
    const ctx = this.bg.getContext("2d")!;
    const colors = this.colors();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = colors["paper-2"];
    ctx.fillRect(0, 0, this.bg.width, this.bg.height);
    const t = this.template;
    if (t === "blank") return;
    const v = cam.visibleRect(this.w, this.h);
    const wctx = this.bg.getContext("2d")!;
    const k = this.dpr * cam.zoom;
    wctx.setTransform(k, 0, 0, k, -cam.x * k, -cam.y * k);
    wctx.strokeStyle = colors.grid;
    wctx.fillStyle = colors.grid;
    wctx.lineWidth = 1 / cam.zoom;
    const step = t === "lined" || t === "derivation" ? 32 : 24;
    if (step * cam.zoom < 6) return; // too dense to be useful
    const x0 = Math.floor(v.x / step) * step, y0 = Math.floor(v.y / step) * step;
    wctx.beginPath();
    if (t === "grid") for (let x = x0; x <= v.x + v.w; x += step) { wctx.moveTo(x, v.y); wctx.lineTo(x, v.y + v.h); }
    if (t === "grid" || t === "lined" || t === "derivation") for (let y = y0; y <= v.y + v.h; y += step) { wctx.moveTo(v.x, y); wctx.lineTo(v.x + v.w, y); }
    if (t === "derivation") {
      const col = 480;
      for (let x = Math.floor(v.x / col) * col; x <= v.x + v.w; x += col) { wctx.moveTo(x, v.y); wctx.lineTo(x, v.y + v.h); }
    }
    wctx.stroke();
    if (t === "dot") {
      const r = 1.2 / cam.zoom;
      for (let x = x0; x <= v.x + v.w; x += step) for (let y = y0; y <= v.y + v.h; y += step) wctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }

  /** The last full render and the camera it was drawn with: reused, transformed, while the camera moves. */
  private cache: HTMLCanvasElement | null = null;
  private cacheCam: { x: number; y: number; zoom: number } | null = null;
  private settle = 0;

  /**
   * Paint a frame. While only the camera moves, the items layer reuses the last full render, scaled and shifted
   * (cheap at any item count); a full redraw follows 120 ms after motion stops, or at once when items change.
   * `live` draws the overlay in world coordinates (in-progress stroke, lasso, selection).
   */
  frame(items: Map<string, Item>, index: GridIndex, cam: Camera, live: (ctx: CanvasRenderingContext2D) => void, requestFrame?: () => void): void {
    const key = `${cam.x},${cam.y},${cam.zoom},${this.w},${this.h},${this.template}`;
    const moved = key !== this.camKey;
    if (moved) { this.drawBg(cam); this.camKey = key; }
    if (this.dirty || (moved && !this.cache)) this.fullRedraw(items, index, cam);
    else if (moved && this.cache && this.cacheCam) {
      const ctx = this.items.getContext("2d")!;
      const s = cam.zoom / this.cacheCam.zoom;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.items.width, this.items.height);
      ctx.setTransform(s, 0, 0, s, (this.cacheCam.x - cam.x) * cam.zoom * this.dpr, (this.cacheCam.y - cam.y) * cam.zoom * this.dpr);
      ctx.drawImage(this.cache, 0, 0);
      clearTimeout(this.settle);
      this.settle = window.setTimeout(() => { this.dirty = true; requestFrame?.(); }, 120);
    }
    live(this.worldCtx(this.live, cam));
  }

  private fullRedraw(items: Map<string, Item>, index: GridIndex, cam: Camera) {
    const ctx = this.worldCtx(this.items, cam);
    const view = cam.visibleRect(this.w, this.h);
    const visible: Item[] = [];
    for (const id of index.query(view)) { const it = items.get(id); if (it && intersects(itemBounds(it), view)) visible.push(it); }
    const colors = this.colors();
    for (const it of paintOrder(visible)) drawItem(ctx, it, colors, this.bitmap, cam.zoom);
    this.dirty = false;
    if (!this.cache) this.cache = document.createElement("canvas");
    if (this.cache.width !== this.items.width || this.cache.height !== this.items.height) { this.cache.width = this.items.width; this.cache.height = this.items.height; }
    const cc = this.cache.getContext("2d")!;
    cc.setTransform(1, 0, 0, 1, 0, 0);
    cc.clearRect(0, 0, this.cache.width, this.cache.height);
    cc.drawImage(this.items, 0, 0);
    this.cacheCam = { x: cam.x, y: cam.y, zoom: cam.zoom };
  }

  destroy(): void {
    this.ro.disconnect();
    this.bg.remove(); this.items.remove(); this.live.remove();
  }
}
