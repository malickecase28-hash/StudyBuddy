import { Camera } from "./camera";
import { itemBounds, unionRect } from "./geometry";
import { History } from "./history";
import { InputRouter, type Gesture, type PointerSample } from "./input";
import { DEFAULT_STYLE, type InkPoint, type Item, type StrokeItem, type Style, type Template } from "./model";
import type { Op } from "./ops";
import { Renderer, type BitmapProvider } from "./render";
import { GridIndex } from "./spatial";
import { makeHand } from "./tools/hand";
import { makePen } from "./tools/pen";
import type { Tool, ToolFactory, WorldSample } from "./tools/types";

export type ToolId = "pen" | "highlighter" | "eraser" | "precise-eraser" | "lasso" | "shape" | "ruler" | "text" | "equation" | "hand";
export type EngineEvents = { onChange?: (op: Op, origin: "do" | "undo" | "redo") => void; onSelection?: (ids: string[]) => void; onView?: () => void; onTool?: (t: ToolId) => void };
/** A ruler that can straighten strokes near its edge (Task 4 provides it). */
export type RulerLike = { snapper(): ((pts: InkPoint[]) => InkPoint[]) | null; drawLive(ctx: CanvasRenderingContext2D): void };

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
    this.renderer = new Renderer(host, () => this.requestFrame());
    this.reducedMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.registerTool("pen", makePen("pen"));
    this.registerTool("highlighter", makePen("highlighter"));
    this.registerTool("hand", makeHand);
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
