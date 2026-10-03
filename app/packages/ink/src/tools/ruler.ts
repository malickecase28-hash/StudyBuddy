import type { InkEngine, RulerLike } from "../engine";
import type { InkPoint, Vec } from "../model";
import { vec, type Tool, type WorldSample } from "./types";

/** Ruler body size and snap distance, in screen px. */
const LEN = 720, H = 56, SNAP = 12;

/**
 * A straightedge on the page. Its top edge passes through `c` at `angle`; its body lies below that edge. Like a real
 * ruler, ink cannot cross the body: a stroke stays on the side it started on, points that would enter the body
 * are pushed back onto the nearer long edge, and points within 12 screen px of that edge are projected onto it.
 * Past the ends of the ruler, ink goes anywhere.
 */
export class Ruler implements RulerLike {
  angle = 0;
  constructor(private engine: InkEngine, public c: Vec) {}
  /** The angle as shown on the ruler: degrees anticlockwise from the page's x axis, 0 ≤ deg < 360. */
  degrees() { const d = ((-this.angle * 180) / Math.PI) % 360; return d < 0 ? d + 360 : d; }
  /** Rotate to `deg` degrees anticlockwise, rounded to 0.1°. */
  setDegrees(deg: number) { this.angle = (-Math.round(deg * 10) / 10) * (Math.PI / 180); this.engine.requestFrame(); }
  private dir() { return { x: Math.cos(this.angle), y: Math.sin(this.angle) }; }
  /** Position along the edge and signed offset from it, world units. */
  local(p: Vec) {
    const d = this.dir(), dx = p.x - this.c.x, dy = p.y - this.c.y;
    return { along: dx * d.x + dy * d.y, off: -dx * d.y + dy * d.x };
  }
  snapper() {
    let edge: number | null = null; // the long edge this stroke writes against (offset, world units), set by its first point beside the ruler
    return (pts: InkPoint[]): InkPoint[] => {
      const z = this.engine.camera.zoom, d = this.dir(), h = H / z;
      return pts.map((p): InkPoint => {
        const l = this.local({ x: p[0], y: p[1] });
        if (Math.abs(l.along) * z > LEN / 2) return p;
        edge ??= l.off < h / 2 ? 0 : h;
        const off = edge === 0 ? Math.min(l.off, 0) : Math.max(l.off, h);
        const snapped = Math.abs(off - edge) * z <= SNAP ? edge : off;
        if (snapped === l.off) return p;
        return [this.c.x + l.along * d.x - snapped * d.y, this.c.y + l.along * d.y + snapped * d.x, p[2], p[3], p[4], p[5]];
      });
    };
  }
  drawLive(ctx: CanvasRenderingContext2D) {
    const z = this.engine.camera.zoom, col = this.engine.renderer.colors();
    ctx.save();
    ctx.translate(this.c.x, this.c.y);
    ctx.rotate(this.angle);
    ctx.scale(1 / z, 1 / z); // draw in screen px
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = col.paper;
    ctx.fillRect(-LEN / 2, 0, LEN, H);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = col.graphite;
    ctx.lineWidth = 1;
    ctx.strokeRect(-LEN / 2, 0, LEN, H);
    ctx.beginPath();
    for (let x = -LEN / 2 + 8; x < LEN / 2; x += 8) { ctx.moveTo(x, 0); ctx.lineTo(x, (x + LEN / 2) % 80 === 0 ? 14 : 7); }
    ctx.stroke();
    for (const x of [-LEN / 2 + 14, LEN / 2 - 14]) { ctx.beginPath(); ctx.arc(x, H / 2, 8, 0, 2 * Math.PI); ctx.stroke(); }
    ctx.fillStyle = col.ink;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${this.degrees().toFixed(1)}°`, 0, H / 2 + 4);
    ctx.restore();
  }
}

/** Show the ruler at the view centre, or hide it. */
export function toggleRuler(engine: InkEngine): void {
  if (engine.ruler) engine.ruler = null;
  else {
    const v = engine.camera.visibleRect(engine.renderer.w, engine.renderer.h);
    engine.ruler = new Ruler(engine, { x: v.x + v.w / 2, y: v.y + v.h / 2 });
  }
  engine.requestFrame();
}

/** The ruler tool moves the ruler (drag the body) and rotates it (drag an end knob). */
export const makeRulerTool = (engine: InkEngine): Tool => {
  let mode: { kind: "move" | "rotate"; from: Vec; c0: Vec; a0: number } | null = null;
  return {
    cursor: "move",
    down(s) {
      if (!engine.ruler) toggleRuler(engine);
      const r = engine.ruler as Ruler, p = vec(s), l = r.local(p), z = engine.camera.zoom;
      const onEnd = Math.abs(Math.abs(l.along) * z - (LEN / 2 - 14)) < 24;
      mode = { kind: onEnd ? "rotate" : "move", from: p, c0: { ...r.c }, a0: r.angle };
    },
    move(samples: WorldSample[]) {
      const s = samples[samples.length - 1], r = engine.ruler as Ruler | null;
      if (!s || !mode || !r) return;
      if (mode.kind === "move") r.c = { x: mode.c0.x + s.wx - mode.from.x, y: mode.c0.y + s.wy - mode.from.y };
      else r.setDegrees(Math.round(-((mode.a0 + Math.atan2(s.wy - r.c.y, s.wx - r.c.x) - Math.atan2(mode.from.y - r.c.y, mode.from.x - r.c.x)) * 180) / Math.PI));
      engine.requestFrame();
    },
    up() { mode = null; engine.viewChanged(); },
    cancel() { mode = null; },
  };
};
