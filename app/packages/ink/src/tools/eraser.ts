import type { InkEngine } from "../engine";
import { distToStroke, splitStroke } from "../geometry";
import { newId, type StrokeItem, type Vec } from "../model";
import { vec, type Tool, type WorldSample } from "./types";

/** Strokes within r of p (world units). */
function touched(engine: InkEngine, p: Vec, r: number): StrokeItem[] {
  const out: StrokeItem[] = [];
  for (const id of engine.index.query({ x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r })) {
    const it = engine.items.get(id);
    if (it?.kind === "stroke" && distToStroke(p, it) < r) out.push(it);
  }
  return out;
}

/** Shared gesture shell: one undo group per press; `hit` runs for each sample with r = 8 screen px. */
function eraserTool(engine: InkEngine, hit: (p: Vec, r: number) => void): Tool {
  let on = false;
  let at: Vec | null = null;
  const r = () => 8 / engine.camera.zoom;
  const end = () => { if (on) engine.history.end(); on = false; at = null; engine.requestFrame(); };
  return {
    cursor: "cell",
    down(s) { engine.history.begin(); on = true; at = vec(s); hit(at, r()); },
    move(samples: WorldSample[]) {
      if (!on) return;
      for (const s of samples) { at = vec(s); hit(at, r()); }
      engine.requestFrame();
    },
    up(s) { if (on) hit(vec(s), r()); end(); },
    cancel: end,
    drawLive(ctx) {
      if (!at) return;
      ctx.strokeStyle = engine.renderer.colors().graphite;
      ctx.lineWidth = 1 / engine.camera.zoom;
      ctx.beginPath();
      ctx.arc(at.x, at.y, r(), 0, 2 * Math.PI);
      ctx.stroke();
    },
  };
}

/** Stroke eraser: removes whole strokes it touches. */
export const makeEraser = (engine: InkEngine): Tool =>
  eraserTool(engine, (p, r) => { for (const s of touched(engine, p, r)) engine.do({ type: "remove", items: [s] }); });

/** Precise eraser: cuts the touched part out; the pieces replace the stroke. */
export const makePreciseEraser = (engine: InkEngine): Tool =>
  eraserTool(engine, (p, r) => {
    for (const s of touched(engine, p, r)) {
      const pieces = splitStroke(s, p, r, newId);
      engine.do({ type: "remove", items: [s] });
      if (pieces.length) engine.do({ type: "add", items: pieces });
    }
  });
