import type { InkEngine } from "../engine";
import { lassoHits, translate } from "../geometry";
import type { Item, Vec } from "../model";
import { vec, type Tool, type WorldSample } from "./types";

/** Lasso: draw round items to select them; press inside the selection to drag it (one update op on release). */
export const makeLasso = (engine: InkEngine): Tool => {
  let poly: Vec[] | null = null;
  let drag: { from: Vec; t: ReturnType<InkEngine["transformSelection"]> } | null = null;
  const inside = (p: Vec) => {
    const b = engine.selectionBounds();
    return !!b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  };
  return {
    cursor: "crosshair",
    down(s) {
      const p = vec(s);
      if (engine.selection.size && inside(p)) drag = { from: p, t: engine.transformSelection() };
      else { poly = [p]; engine.select([]); }
    },
    move(samples: WorldSample[]) {
      const s = samples[samples.length - 1];
      if (!s) return;
      if (drag) drag.t.set(translate(s.wx - drag.from.x, s.wy - drag.from.y));
      else if (poly) { for (const x of samples) poly.push(vec(x)); engine.requestFrame(); }
    },
    up() {
      if (drag) { drag.t.commit(); drag = null; }
      else if (poly) {
        if (poly.length > 2) {
          const xs = poly.map((p) => p.x), ys = poly.map((p) => p.y);
          const x0 = Math.min(...xs), y0 = Math.min(...ys);
          const near = [...engine.index.query({ x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 })]
            .map((id) => engine.items.get(id))
            .filter((x): x is Item => !!x);
          engine.select(lassoHits(near, poly));
        }
        poly = null;
      }
      engine.requestFrame();
    },
    cancel() { drag?.t.cancel(); drag = null; poly = null; engine.requestFrame(); },
    deactivate() { engine.select([]); },
    drawLive(ctx) {
      const z = engine.camera.zoom;
      ctx.lineWidth = 1 / z;
      ctx.strokeStyle = engine.renderer.colors().field;
      ctx.setLineDash([5 / z, 4 / z]);
      if (poly && poly.length > 1) {
        ctx.beginPath();
        poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.stroke();
      }
      ctx.setLineDash([]);
    },
  };
};
