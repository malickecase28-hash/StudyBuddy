import { strokeOutline, outlineToSvgPath } from "../geometry";
import { IDENTITY, newId, type InkPoint, type StrokeItem } from "../model";
import { toInkPoint, type Tool, type WorldSample } from "./types";

/**
 * Pen and highlighter. The live stroke is drawn every frame from its own outline; up to three predicted points
 * are drawn as a faint tail and replaced as real points arrive. On lift, one `add` op.
 */
export function makePen(tool: "pen" | "highlighter") {
  return (engine: import("../engine").InkEngine): Tool => {
    let points: InkPoint[] | null = null;
    let predicted: InkPoint[] = [];
    let snap: ((pts: InkPoint[]) => InkPoint[]) | null = null;
    /** Width is chosen in screen px: zoomed in, the same pen writes finer (stored in world units). */
    const style = () => ({ ...engine.style, size: engine.style.size / engine.camera.zoom });
    const live = (): StrokeItem | null => points && points.length ? { id: "live", kind: "stroke", tool, z: 0, transform: IDENTITY, style: style(), points } : null;
    return {
      cursor: "crosshair",
      down(s) {
        points = [toInkPoint(s)];
        predicted = [];
        snap = engine.ruler?.snapper() ?? null;
        engine.requestFrame();
      },
      move(samples: WorldSample[], pred: WorldSample[]) {
        if (!points) return;
        for (const s of samples) points.push(toInkPoint(s));
        if (snap) points = snap(points);
        predicted = engine.reducedMotion ? [] : pred.slice(0, 3).map(toInkPoint);
        engine.requestFrame();
      },
      up(s) {
        if (!points) return;
        points.push(toInkPoint(s));
        if (snap) points = snap(points);
        const stroke: StrokeItem = { id: newId(), kind: "stroke", tool, z: engine.nextZ(), transform: IDENTITY, style: style(), points };
        points = null;
        predicted = [];
        if (engine.onStrokeEnd?.(stroke)) return; // shape snap took over
        engine.do({ type: "add", items: [stroke] });
      },
      cancel() { points = null; predicted = []; engine.requestFrame(); },
      drawLive(ctx) {
        const s = live();
        if (!s) return;
        const colors = engine.renderer.colors();
        ctx.fillStyle = colors[s.style.color];
        ctx.globalAlpha = tool === "highlighter" ? 0.35 : s.style.opacity;
        ctx.fill(new Path2D(outlineToSvgPath(strokeOutline({ ...s }))));
        if (predicted.length) {
          ctx.globalAlpha = 0.4;
          ctx.fill(new Path2D(outlineToSvgPath(strokeOutline({ ...s, points: [s.points[s.points.length - 1]!, ...predicted] }))));
        }
        ctx.globalAlpha = 1;
      },
    };
  };
}
