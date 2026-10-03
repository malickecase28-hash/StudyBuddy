import { Camera } from "./camera";
import { distToItem, itemBounds, mul, unionRect } from "./geometry";
import { History } from "./history";
import { InputRouter, type Gesture, type PointerSample } from "./input";
import { DEFAULT_STYLE, ItemSchema, newId, type Affine, type ColorToken, type InkPoint, type Item, type StrokeItem, type Style, type Template, type Vec } from "./model";
import type { Op } from "./ops";
import { Renderer, type BitmapProvider } from "./render";
import { GridIndex } from "./spatial";
import { makeEraser, makePreciseEraser } from "./tools/eraser";
import { makeHand } from "./tools/hand";
import { makeLasso } from "./tools/lasso";
import { makePen } from "./tools/pen";
import { makeRulerTool } from "./tools/ruler";
import { makeShape } from "./tools/shape";
import { makeEditTool } from "./tools/text";
import type { Tool, ToolFactory, WorldSample } from "./tools/types";

export type ToolId = "pen" | "highlighter" | "eraser" | "precise-eraser" | "lasso" | "shape" | "ruler" | "text" | "equation" | "hand";
/** A request to open the text or equation editor: on an existing item, or new at a world point. */
export type EditRequest = { kind: "text" | "equation"; at: Vec; item?: Item };
export type EngineEvents = { onChange?: (op: Op, origin: "do" | "undo" | "redo") => void; onSelection?: (ids: string[]) => void; onView?: () => void; onTool?: (t: ToolId) => void; onEdit?: (r: EditRequest) => void };
/** A ruler that can straighten strokes near its edge (Task 4 provides it). */
export type RulerLike = { snapper(): ((pts: InkPoint[]) => InkPoint[]) | null; drawLive(ctx: CanvasRenderingContext2D): void; degrees(): number; setDegrees(deg: number): void };

/** The ink engine: items, undo, camera, renderer, input and tools. Framework-free; React wraps it in <InkCanvas>. */
export class InkEngine {
  readonly items = new Map<string, Item>();
  readonly index = new GridIndex();
  readonly camera = new Camera();
  readonly history: History;
  readonly renderer: Renderer;
  readonly input: InputRouter;
  readonly selection = new Set<string>();
  style: Style = { ...DEFAULT_STYLE };
  toolId: ToolId = "pen";
  ruler: RulerLike | null = null;
  reducedMotion = false;
  /** Lets the shape tool replace a just-finished stroke; return true to suppress the default add. */
  onStrokeEnd: ((s: StrokeItem) => boolean) | null = null;
  /** Extra overlay painters (selection handles, lasso, ruler…), drawn after the active tool's overlay. */
  readonly overlays = new Set<(ctx: CanvasRenderingContext2D) => void>();
  private factories = new Map<ToolId, ToolFactory>();
  private tools = new Map<ToolId, Tool>();
  private temp: ToolId | null = null;
  private active: Tool | null = null;
  private raf = 0;
  private maxZ = 0;
  private off: (() => void)[] = [];

  constructor(readonly host: HTMLElement, private ev: EngineEvents = {}) {
    this.history = new History(this.items, (op, origin) => this.changed(op, origin));
    // When the host resizes, keep the world point at its centre where it was.
    this.renderer = new Renderer(host, (dw, dh) => { this.camera.pan(dw / 2, dh / 2); this.requestFrame(); });
    this.reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.registerTool("pen", makePen("pen"));
    this.registerTool("highlighter", makePen("highlighter"));
    this.registerTool("hand", makeHand);
    this.registerTool("eraser", makeEraser);
    this.registerTool("precise-eraser", makePreciseEraser);
    this.registerTool("lasso", makeLasso);
    this.registerTool("shape", makeShape);
    this.registerTool("ruler", makeRulerTool);
    this.registerTool("text", makeEditTool("text"));
    this.registerTool("equation", makeEditTool("equation"));
    this.input = new InputRouter(host, {
      onDown: (s) => this.pointer("down", s),
      onMove: (ss, pr) => this.active?.move(ss.map((s) => this.world(s)), pr.map((s) => this.world(s))),
      onUp: (s) => { this.active?.up(this.world(s)); this.active = null; this.requestFrame(); },
      onCancel: () => { this.active?.cancel(); this.active = null; this.requestFrame(); },
      onGesture: (g) => this.gesture(g),
    });
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = host.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) this.zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.002));
      else this.panBy(-e.deltaX, -e.deltaY);
    };
    host.addEventListener("wheel", wheel, { passive: false });
    this.off.push(() => host.removeEventListener("wheel", wheel));
    const theme = new MutationObserver(() => { this.renderer.refreshColors(); this.requestFrame(); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    this.off.push(() => theme.disconnect());
    this.requestFrame();
  }

  registerTool(id: ToolId, f: ToolFactory): void { this.factories.set(id, f); this.tools.delete(id); }
  hasTool(id: ToolId): boolean { return this.factories.has(id); }
  private tool(id: ToolId): Tool | null {
    let t = this.tools.get(id);
    if (!t) { const f = this.factories.get(id); if (!f) return null; this.tools.set(id, (t = f(this))); }
    return t;
  }
  setTool(id: ToolId): void {
    if (id === this.toolId) return;
    this.tools.get(this.toolId)?.deactivate?.();
    this.toolId = id;
    this.host.style.cursor = this.tool(id)?.cursor ?? "default";
    this.ev.onTool?.(id);
    this.requestFrame();
  }
  /** Temporarily switch (Space → hand, pen eraser end → eraser); null restores. */
  setTemporaryTool(id: ToolId | null): void { this.temp = id; this.host.style.cursor = this.tool(id ?? this.toolId)?.cursor ?? "default"; }
  setStyle(s: Partial<Style>): void { this.style = { ...this.style, ...s }; }
  setTemplate(t: Template): void { this.renderer.template = t; this.requestFrame(); }
  setBitmapProvider(b: BitmapProvider): void { this.renderer.bitmap = b; this.renderer.invalidate(); this.requestFrame(); }

  world(s: PointerSample): WorldSample {
    const w = this.camera.toWorld(s.x, s.y);
    return { ...s, wx: w.x, wy: w.y };
  }

  private pointer(_k: "down", s: PointerSample) {
    const eraserEnd = s.type === "pen" && (s.button === 5 || (s.buttons & 32) !== 0 || s.button === 2);
    const id = eraserEnd && this.factories.has("eraser") ? "eraser" : this.temp ?? this.toolId;
    this.active = this.tool(id);
    this.active?.down(this.world(s));
  }

  private gesture(g: Gesture) {
    if (g.kind === "pan") this.panBy(g.dx, g.dy);
    else if (g.kind === "pinch") this.zoomAt(g.cx, g.cy, g.factor);
    else if (g.fingers === 2) this.undo();
    else this.redo();
  }

  /** Tell the UI the view changed (ruler moved or turned), so readouts follow. */
  viewChanged(): void { this.ev.onView?.(); }
  panBy(dx: number, dy: number): void { this.camera.pan(dx, dy); this.ev.onView?.(); this.requestFrame(); }
  zoomAt(sx: number, sy: number, f: number): void { this.camera.zoomAt(sx, sy, f); this.ev.onView?.(); this.requestFrame(); }
  setZoom(z: number): void { this.zoomAt(this.renderer.w / 2, this.renderer.h / 2, z / this.camera.zoom); }

  nextZ(): number { return ++this.maxZ; }

  /** Apply an op through history (undoable). */
  do(op: Op): void { this.history.push(op); }
  /** Run fn as one undo step. */
  group<T>(fn: () => T): T { this.history.begin(); try { return fn(); } finally { this.history.end(); } }
  undo(): boolean { const r = this.history.undo(); this.requestFrame(); return r; }
  redo(): boolean { const r = this.history.redo(); this.requestFrame(); return r; }

  private changed(op: Op, origin: "do" | "undo" | "redo") {
    const touch = (it: Item) => { this.index.upsert(it.id, itemBounds(it)); if (it.z > this.maxZ) this.maxZ = it.z; };
    if (op.type === "add") op.items.forEach(touch);
    else if (op.type === "remove") op.items.forEach((it) => { this.index.remove(it.id); if (this.selection.delete(it.id)) this.ev.onSelection?.([...this.selection]); });
    else if (op.type === "update") op.after.forEach(touch);
    else op.ids.forEach((id) => { const it = this.items.get(id); if (it) touch(it); });
    this.renderer.invalidate();
    this.requestFrame();
    this.ev.onChange?.(op, origin);
  }

  /** Replace the content without history (opening a page). */
  load(items: Item[]): void {
    this.items.clear(); this.index.clear(); this.selection.clear(); this.history.clear();
    this.maxZ = 0;
    for (const it of items) { this.items.set(it.id, it); this.index.upsert(it.id, itemBounds(it)); if (it.z > this.maxZ) this.maxZ = it.z; }
    this.renderer.invalidate();
    this.requestFrame();
  }

  /** Topmost item within `r` world units of p that passes `filter`. */
  itemAt(p: Vec, r = 0, filter: (it: Item) => boolean = () => true): Item | undefined {
    let best: Item | undefined;
    for (const id of this.index.query({ x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r })) {
      const it = this.items.get(id);
      if (it && filter(it) && distToItem(p, it) <= r && (!best || it.z > best.z)) best = it;
    }
    return best;
  }
  /** Ask the host to open an editor (text and equation tools call this). */
  requestEdit(r: EditRequest): void { this.ev.onEdit?.(r); }

  /** Show items mid-gesture without history; the gesture's final op (or a restore) follows. */
  preview(items: Item[]): void {
    for (const it of items) { this.items.set(it.id, it); this.index.upsert(it.id, itemBounds(it)); }
    this.renderer.invalidate();
    this.requestFrame();
    this.ev.onView?.();
  }

  /** Live transform of the selection: set(m) previews m ∘ transform; commit() is one `update` op (one undo step). */
  transformSelection() {
    const before = this.selected();
    let after = before;
    return {
      set: (m: Affine) => { after = before.map((it) => ({ ...it, transform: mul(m, it.transform) })); this.preview(after); },
      commit: () => { if (before.length && after !== before) { this.preview(before); this.do({ type: "update", before, after }); } },
      cancel: () => this.preview(before),
    };
  }

  private selected(): Item[] { return [...this.selection].map((id) => this.items.get(id)).filter((x): x is Item => !!x); }
  deleteSelection(): void { const its = this.selected(); if (its.length) this.do({ type: "remove", items: its }); }
  recolorSelection(color: ColorToken): void {
    const before = this.selected();
    if (before.length) this.do({ type: "update", before, after: before.map((it) => ({ ...it, style: { ...it.style, color } })) });
  }
  /** Adds copies offset by (dx, dy) world units as one step and selects them. */
  addCopies(items: Item[], dx: number, dy: number): void {
    if (!items.length) return;
    const copies = items.map((it) => ({ ...it, id: newId(), z: this.nextZ(), transform: mul([1, 0, 0, 1, dx, dy], it.transform) }));
    this.do({ type: "add", items: copies });
    this.select(copies.map((c) => c.id));
  }
  duplicateSelection(): void { this.addCopies(this.selected(), 16, 16); }
  /** Internal clipboard; also written to the system clipboard as JSON so it pastes across tabs. */
  clipboard: Item[] = [];
  copySelection(): void {
    this.clipboard = this.selected();
    if (this.clipboard.length) void navigator.clipboard?.writeText(JSON.stringify({ forma: "ink", items: this.clipboard })).catch(() => {});
  }
  /** Items from a paste: copied ink (JSON from copySelection) when it validates, else the internal clipboard. */
  pasteText(text: string): boolean {
    let items = text ? [] as Item[] : this.clipboard;
    try {
      const j = JSON.parse(text) as { forma?: string; items?: unknown[] };
      if (j.forma === "ink" && Array.isArray(j.items)) items = j.items.flatMap((x) => { const r = ItemSchema.safeParse(x); return r.success ? [r.data] : []; });
    } catch { /* not ink */ }
    this.addCopies(items, 24, 24);
    return items.length > 0;
  }

  select(ids: string[]): void {
    this.selection.clear();
    for (const id of ids) if (this.items.has(id)) this.selection.add(id);
    this.ev.onSelection?.([...this.selection]);
    this.requestFrame();
  }
  selectionBounds() { return unionRect([...this.selection].map((id) => this.items.get(id)).filter((x): x is Item => !!x).map(itemBounds)); }

  contentBounds() { return unionRect([...this.items.values()].map(itemBounds)); }
  fitToContent(): void {
    const b = this.contentBounds();
    if (!b) { this.camera.x = 0; this.camera.y = 0; this.camera.zoom = 1; }
    else this.camera.fit(b, this.renderer.w, this.renderer.h);
    this.ev.onView?.();
    this.requestFrame();
  }

  requestFrame(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.renderer.frame(this.items, this.index, this.camera, (ctx) => {
        this.ruler?.drawLive(ctx);
        this.tool(this.temp ?? this.toolId)?.drawLive?.(ctx, this);
        for (const o of this.overlays) o(ctx);
      }, () => this.requestFrame());
    });
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    for (const f of this.off) f();
    this.input.destroy();
    this.renderer.destroy();
  }
}
