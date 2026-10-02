import { getStroke } from "perfect-freehand";
import type { Affine, InkPoint, Item, Rect, StrokeItem, Vec } from "./model";

export const applyAffine = (m: Affine, p: Vec): Vec => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });
export const mul = (a: Affine, b: Affine): Affine => [
  a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
];
export function invertAffine(m: Affine): Affine {
  const det = m[0] * m[3] - m[1] * m[2] || 1e-12;
  const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}
export const translate = (dx: number, dy: number): Affine => [1, 0, 0, 1, dx, dy];
export const scaleAbout = (sx: number, sy: number, o: Vec): Affine => [sx, 0, 0, sy, o.x - sx * o.x, o.y - sy * o.y];
export const rotateAbout = (rad: number, o: Vec): Affine => {
  const c = Math.cos(rad), s = Math.sin(rad);
  return [c, s, -s, c, o.x - c * o.x + s * o.y, o.y - s * o.x - c * o.y];
};

/** Whether a stroke carries real pressure (pens) or the 0.5 default (mouse, most touch). */
export const hasPressure = (pts: InkPoint[]) => pts.some((p) => p[2] !== 0.5 && p[2] !== 0);

const outlineCache = new WeakMap<StrokeItem, Vec[]>();
/** perfect-freehand outline in the stroke's local space. Cached per (immutable) item object. */
export function strokeOutline(s: StrokeItem): Vec[] {
  const hit = outlineCache.get(s);
  if (hit) return hit;
  const pen = s.tool === "pen";
  const raw = getStroke(s.points.map((p) => [p[0], p[1], p[2]]), {
    size: pen ? s.style.size : s.style.size * 3,
    thinning: pen ? 0.55 : 0,
    smoothing: pen ? 0.5 : 0.6,
    streamline: pen ? 0.4 : 0.5,
    simulatePressure: pen && !hasPressure(s.points),
    last: true,
    start: { cap: pen, taper: 0 },
    end: { cap: pen, taper: 0 },
  });
  const out = raw.map(([x, y]) => ({ x: x!, y: y! }));
  outlineCache.set(s, out);
  return out;
}

/** perfect-freehand's recommended quadratic SVG path through an outline. */
export function outlineToSvgPath(pts: Vec[]): string {
  if (pts.length < 2) return "";
  const avg = (a: number, b: number) => (a + b) / 2;
  let d = `M${pts[0]!.x.toFixed(2)},${pts[0]!.y.toFixed(2)} Q`;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!, b = pts[(i + 1) % pts.length]!;
    d += `${a.x.toFixed(2)},${a.y.toFixed(2)} ${avg(a.x, b.x).toFixed(2)},${avg(a.y, b.y).toFixed(2)} `;
  }
  return d + "Z";
}

const boundsOf = (pts: Vec[], pad: number): Rect => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
};
const corners = (r: Rect): Vec[] => [{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, { x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }];

/** Size of a box-like item in its local space. Text height is estimated from its line count. */
export function localBox(it: Item): Rect {
  switch (it.kind) {
    case "stroke": return boundsOf(it.points.map((p) => ({ x: p[0], y: p[1] })), (it.tool === "pen" ? it.style.size : it.style.size * 3) / 2 + 1);
    case "shape": return boundsOf(it.pts, it.style.size / 2 + 1);
    case "text": return { x: 0, y: 0, w: it.width, h: Math.max(1, it.text.split("\n").length) * 24 + 8 };
    case "link": return { x: 0, y: 0, w: Math.max(80, it.label.length * 8 + 32), h: 28 };
    default: return { x: 0, y: 0, w: it.w, h: it.h };
  }
}

/** World-space axis-aligned bounds, after the item's transform. */
export function itemBounds(it: Item): Rect {
  return boundsOf(corners(localBox(it)).map((p) => applyAffine(it.transform, p)), 0);
}

const segDist = (p: Vec, a: Vec, b: Vec) => {
  const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

/** World distance from p to the stroke's edge (negative inside the ink). */
export function distToStroke(p: Vec, s: StrokeItem): number {
  const q = applyAffine(invertAffine(s.transform), p);
  const scale = Math.sqrt(Math.abs(s.transform[0] * s.transform[3] - s.transform[1] * s.transform[2])) || 1;
  const half = (s.tool === "pen" ? s.style.size : s.style.size * 3) / 2;
  let best = Infinity;
  const pts = s.points;
  if (pts.length === 1) best = Math.hypot(q.x - pts[0]![0], q.y - pts[0]![1]);
  for (let i = 1; i < pts.length; i++) best = Math.min(best, segDist(q, { x: pts[i - 1]![0], y: pts[i - 1]![1] }, { x: pts[i]![0], y: pts[i]![1] }));
  return (best - half) * scale;
}

/** Distance from p to an item: strokes by their ink, shapes by their outline, other items 0 inside their box. */
export function distToItem(p: Vec, it: Item): number {
  if (it.kind === "stroke") return distToStroke(p, it);
  if (it.kind === "shape") {
    const q = applyAffine(invertAffine(it.transform), p);
    const closed = it.shape !== "line" && it.shape !== "arrow";
    const pts = shapeOutline(it.shape, it.pts);
    let best = Infinity;
    for (let i = 1; i < pts.length; i++) best = Math.min(best, segDist(q, pts[i - 1]!, pts[i]!));
    if (closed && pointInPolygon(q, pts)) best = 0;
    return best - it.style.size / 2;
  }
  const b = itemBounds(it);
  const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

export function pointInPolygon(p: Vec, poly: Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!, b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Items selected by a lasso: strokes when ≥ 60% of their points are inside; anything else by its bounds centre. */
export function lassoHits(items: Iterable<Item>, poly: Vec[]): string[] {
  const out: string[] = [];
  for (const it of items) {
    if (it.kind === "stroke") {
      let n = 0;
      for (const pt of it.points) if (pointInPolygon(applyAffine(it.transform, { x: pt[0], y: pt[1] }), poly)) n++;
      if (n >= 0.6 * it.points.length) out.push(it.id);
    } else {
      const b = itemBounds(it);
      if (pointInPolygon({ x: b.x + b.w / 2, y: b.y + b.h / 2 }, poly)) out.push(it.id);
    }
  }
  return out;
}

/** The parts of a stroke outside radius r (world) of `eraser`. Pieces keep ≥ 2 points; ids are fresh. */
export function splitStroke(s: StrokeItem, eraser: Vec, r: number, newId: () => string): StrokeItem[] {
  const pieces: InkPoint[][] = [];
  let cur: InkPoint[] = [];
  for (const pt of s.points) {
    const w = applyAffine(s.transform, { x: pt[0], y: pt[1] });
    if (Math.hypot(w.x - eraser.x, w.y - eraser.y) <= r) { if (cur.length >= 2) pieces.push(cur); cur = []; }
    else cur.push(pt);
  }
  if (cur.length >= 2) pieces.push(cur);
  return pieces.map((points) => ({ ...s, id: newId(), points }));
}

/** Polyline (closed shapes repeat their first point) for a shape kind and its defining points. */
export function shapeOutline(shape: string, pts: Vec[]): Vec[] {
  if (shape === "ellipse" && pts.length >= 2) {
    const [a, b] = pts as [Vec, Vec];
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, rx = Math.abs(b.x - a.x) / 2, ry = Math.abs(b.y - a.y) / 2;
    return Array.from({ length: 65 }, (_, i) => ({ x: cx + rx * Math.cos((i / 64) * 2 * Math.PI), y: cy + ry * Math.sin((i / 64) * 2 * Math.PI) }));
  }
  if (shape === "rect" && pts.length === 2) {
    const [a, b] = pts as [Vec, Vec];
    return [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }, a];
  }
  if (shape === "line" || shape === "arrow") return pts;
  return [...pts, pts[0]!];
}

export const unionRect = (rs: Rect[]): Rect | null => {
  if (!rs.length) return null;
  const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
  return { x: x0, y: y0, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: Math.max(...rs.map((r) => r.y + r.h)) - y0 };
};
export const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
