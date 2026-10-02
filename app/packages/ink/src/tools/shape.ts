import type { InkEngine } from "../engine";
import { IDENTITY, newId, type ShapeItem, type StrokeItem } from "../model";
import { recognizeShape } from "../shapes";
import { makePen } from "./pen";
import type { Tool } from "./types";

/** Draws like the pen; on lift a recognised line, arrow, rect, ellipse, triangle or polygon replaces the stroke. */
export const makeShape = (engine: InkEngine): Tool => {
  const pen = makePen("pen")(engine);
  const snap = (s: StrokeItem): boolean => {
    const g = recognizeShape(s.points.map((p) => ({ x: p[0], y: p[1] })));
    if (!g || g.score < 0.8) return false;
    const shape: ShapeItem = { id: newId(), kind: "shape", shape: g.shape, pts: g.pts, z: s.z, transform: IDENTITY, style: s.style };
    engine.do({ type: "add", items: [shape] });
    return true;
  };
  return {
    ...pen,
    up(s) {
      const prev = engine.onStrokeEnd;
      engine.onStrokeEnd = snap;
      try { pen.up(s); } finally { engine.onStrokeEnd = prev; }
    },
  };
};
