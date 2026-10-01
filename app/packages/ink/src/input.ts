export type PointerSample = { x: number; y: number; pressure: number; tiltX: number; tiltY: number; t: number; type: "pen" | "touch" | "mouse"; button: number; buttons: number };
export type Gesture = { kind: "pan"; dx: number; dy: number } | { kind: "pinch"; cx: number; cy: number; factor: number } | { kind: "tap"; fingers: 2 | 3 };
export type InputHandlers = {
  onDown(s: PointerSample): void;
  onMove(samples: PointerSample[], predicted: PointerSample[]): void;
  onUp(s: PointerSample): void;
  onCancel(): void;
  onGesture(g: Gesture): void;
  onHover?(s: PointerSample | null): void;
};

/** Once any page has seen a pen, touch never draws again this session (pages share it). */
let penEver = false;
/** A touch that lands while the pen is down, or this soon after it moved, is a resting palm. */
const PALM_MS = 500;

/**
 * Routes pointer input. Palm rejection: once a pen is seen, touch never draws (one finger pans, two pan/pinch),
 * and touches that land while the pen is writing (or just after) are ignored entirely.
 * Before any pen, a single touch draws; a second finger cancels that stroke and starts a gesture.
 * Coordinates are screen px relative to the element.
 */
export class InputRouter {
  get penSeen(): boolean { return penEver; }
  set penSeen(v: boolean) { penEver = v; }
  private drawing: number | null = null;
  private drawingType: string | null = null;
  private lastPen = -Infinity;
  private palms = new Set<number>();
  private touches = new Map<number, { x: number; y: number }>();
  private tap: { start: number; max: number; moved: boolean } | null = null;
  private off: (() => void)[] = [];

  constructor(private el: HTMLElement, private h: InputHandlers) {
    el.style.touchAction = "none";
    const on = <K extends keyof HTMLElementEventMap>(k: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      el.addEventListener(k, fn as EventListener, { passive: false });
      this.off.push(() => el.removeEventListener(k, fn as EventListener));
    };
    on("pointerdown", (e) => this.down(e));
    on("pointermove", (e) => this.move(e));
    on("pointerup", (e) => this.up(e));
    on("pointercancel", (e) => this.cancel(e));
    on("pointerleave", (e) => { if (e.pointerType !== "touch") this.h.onHover?.(null); });
    on("contextmenu", (e) => e.preventDefault());
  }

  private sample(e: PointerEvent): PointerSample {
    const r = this.el.getBoundingClientRect();
    const type = e.pointerType === "pen" ? "pen" : e.pointerType === "touch" ? "touch" : "mouse";
    // Mouse and many touch screens report 0 or 0.5; normalise "no pressure" to 0.5 so strokes get simulated pressure.
    const pressure = type === "pen" ? (e.pressure > 0 ? e.pressure : 0.5) : 0.5;
    return { x: e.clientX - r.left, y: e.clientY - r.top, pressure, tiltX: e.tiltX || 0, tiltY: e.tiltY || 0, t: e.timeStamp, type, button: e.button, buttons: e.buttons };
  }

  private down(e: PointerEvent) {
    e.preventDefault();
    if (e.pointerType === "pen") { penEver = true; this.lastPen = e.timeStamp; }
    if (e.pointerType === "touch" && (this.drawingType === "pen" || e.timeStamp - this.lastPen < PALM_MS)) { this.palms.add(e.pointerId); return; }
    if (e.pointerType === "touch") {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { this.el.setPointerCapture(e.pointerId); } catch { /* synthetic events have no active pointer */ }
      if (this.touches.size >= 2) {
        if (this.drawing !== null && this.drawingType === "touch") { this.drawing = null; this.drawingType = null; this.h.onCancel(); }
        this.tap = this.tap && this.touches.size <= 3 ? { ...this.tap, max: this.touches.size } : { start: e.timeStamp, max: this.touches.size, moved: false };
        return;
      }
      if (this.penSeen) { this.tap = null; return; } // a lone finger after a pen: pan only
    }
    if (this.drawing !== null) return;
    if (e.pointerType === "mouse" && e.button === 1) return; // middle button pans (handled in move)
    this.drawing = e.pointerId;
    this.drawingType = e.pointerType;
    try { this.el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    this.h.onDown(this.sample(e));
  }

  private move(e: PointerEvent) {
    if (e.pointerType === "pen") { penEver = true; this.lastPen = e.timeStamp; }
    if (this.palms.has(e.pointerId)) return;
    if (e.pointerType === "touch" && this.touches.has(e.pointerId) && this.drawing !== e.pointerId) {
      const prev = this.touches.get(e.pointerId)!;
      const before = [...this.touches.values()];
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const after = [...this.touches.values()];
      if (Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > 0.5 && this.tap) this.tap.moved = this.tap.moved || Math.hypot(e.clientX - prev.x, e.clientY - prev.y) > 10;
      const c = (ps: { x: number; y: number }[]) => ({ x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length });
      const c0 = c(before), c1 = c(after);
      this.h.onGesture({ kind: "pan", dx: c1.x - c0.x, dy: c1.y - c0.y });
      if (after.length >= 2) {
        const d = (ps: { x: number; y: number }[]) => Math.hypot(ps[0]!.x - ps[1]!.x, ps[0]!.y - ps[1]!.y);
        const f = d(after) / Math.max(1, d(before));
        const r = this.el.getBoundingClientRect();
        if (Math.abs(f - 1) > 1e-4) this.h.onGesture({ kind: "pinch", cx: c1.x - r.left, cy: c1.y - r.top, factor: f });
      }
      return;
    }
    if (e.pointerType === "mouse" && (e.buttons & 4)) { this.h.onGesture({ kind: "pan", dx: e.movementX, dy: e.movementY }); return; }
    if (this.drawing !== e.pointerId) { if (e.pointerType !== "touch") this.h.onHover?.(this.sample(e)); return; }
    const co = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
    const pr = typeof e.getPredictedEvents === "function" ? e.getPredictedEvents() : [];
    this.h.onMove((co.length ? co : [e]).map((x) => this.sample(x)), pr.map((x) => this.sample(x)));
  }

  private up(e: PointerEvent) {
    if (e.pointerType === "pen") this.lastPen = e.timeStamp;
    if (this.palms.delete(e.pointerId)) return;
    if (e.pointerType === "touch" && this.touches.has(e.pointerId)) {
      this.touches.delete(e.pointerId);
      if (this.touches.size === 0 && this.tap) {
        const quick = e.timeStamp - this.tap.start < 250 && !this.tap.moved;
        if (quick && (this.tap.max === 2 || this.tap.max === 3)) this.h.onGesture({ kind: "tap", fingers: this.tap.max as 2 | 3 });
        this.tap = null;
      }
      if (this.drawing !== e.pointerId) return;
    }
    if (this.drawing !== e.pointerId) return;
    this.drawing = null;
    this.drawingType = null;
    this.h.onUp(this.sample(e));
  }

  private cancel(e: PointerEvent) {
    this.touches.delete(e.pointerId);
    this.palms.delete(e.pointerId);
    if (this.drawing === e.pointerId) { this.drawing = null; this.drawingType = null; this.h.onCancel(); }
  }

  destroy(): void { for (const f of this.off) f(); }
}
