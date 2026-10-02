import type { ShapeKind, Vec } from "./model";

export type ShapeGuess = { shape: ShapeKind; pts: Vec[]; score: number } | null;

const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
const pathLength = (ps: Vec[]) => ps.reduce((s, p, i) => (i ? s + dist(ps[i - 1]!, p) : 0), 0);

/** Resample a polyline to n points evenly spaced by arc length. */
export function resample(ps: Vec[], n = 64): Vec[] {
  const L = pathLength(ps);
  if (ps.length < 2 || L === 0) return ps.slice();
  const step = L / (n - 1), out: Vec[] = [ps[0]!];
  let acc = 0;
  for (let i = 1; i < ps.length; i++) {
    let a = ps[i - 1]!; const b = ps[i]!;
    let d = dist(a, b);
    while (acc + d >= step && out.length < n) {
      const t = (step - acc) / d;
      const q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
      out.push(q);
      a = q; d = dist(a, b); acc = 0;
    }
    acc += d;
  }
  while (out.length < n) out.push(ps[ps.length - 1]!);
  return out;
}

const lineDev = (ps: Vec[], a: Vec, b: Vec) => {
  const L = dist(a, b) || 1;
  return Math.max(...ps.map((p) => Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / L));
};

/** Indices where the path turns sharply (> 50°), one per corner. */
function corners(ps: Vec[], closed: boolean): number[] {
  const n = ps.length, k = 4, out: { i: number; a: number }[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = ps[closed ? (i - k + n) % n : Math.max(0, i - k)]!, p1 = ps[i]!, p2 = ps[closed ? (i + k) % n : Math.min(n - 1, i + k)]!;
    const a1 = Math.atan2(p1.y - p0.y, p1.x - p0.x), a2 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    let d = Math.abs(a2 - a1); if (d > Math.PI) d = 2 * Math.PI - d;
    if (d > (50 * Math.PI) / 180) out.push({ i, a: d });
  }
  // Keep the sharpest point of each run of neighbouring candidates.
  const peaks: number[] = [];
  for (const c of out) {
    const last = peaks[peaks.length - 1];
    if (last !== undefined && (c.i - last + n) % n <= k) { if (c.a > out.find((o) => o.i === last)!.a) peaks[peaks.length - 1] = c.i; }
    else peaks.push(c.i);
  }
  if (closed && peaks.length > 1 && (peaks[0]! + n - peaks[peaks.length - 1]!) % n <= k) peaks.pop();
  return peaks;
}

/**
 * Recognise a hand-drawn line, rectangle, ellipse, triangle or polygon. Returns null when nothing fits well.
 * ponytail: heuristics on 64 resampled points; swap for a $1/$P-style template matcher if users want more shapes.
 */
export function recognizeShape(raw: Vec[]): ShapeGuess {
  if (raw.length < 3) return null;
  const ps = resample(raw, 64);
  const L = pathLength(ps), first = ps[0]!, last = ps[ps.length - 1]!;
  if (L < 20) return null;
  const chord = dist(first, last);
  if (chord / L > 0.9 && lineDev(ps, first, last) < 0.06 * chord) return { shape: "line", pts: [first, last], score: 1 - lineDev(ps, first, last) / chord };
  // Arrow: a straight shaft over the first 85%, then a hook of at least 25° in the last 15%.
  const cut = Math.round(ps.length * 0.85), tip = ps[cut]!, shaft = ps.slice(0, cut + 1);
  const shaftLen = dist(first, tip);
  if (shaftLen > 0.6 * L && lineDev(shaft, first, tip) < 0.06 * shaftLen) {
    const a1 = Math.atan2(tip.y - first.y, tip.x - first.x), a2 = Math.atan2(last.y - tip.y, last.x - tip.x);
    let d = Math.abs(a2 - a1); if (d > Math.PI) d = 2 * Math.PI - d;
    if (d >= (25 * Math.PI) / 180) return { shape: "arrow", pts: [first, tip], score: 0.85 };
  }
  if (chord > 0.15 * L) return null; // open and not straight: leave it as ink
  const xs = ps.map((p) => p.x), ys = ps.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 || 1, ry = (y1 - y0) / 2 || 1;
  const cs = corners(ps, true);
  if (cs.length === 3) return { shape: "triangle", pts: cs.map((i) => ps[i]!), score: 0.85 };
  if (cs.length === 4) {
    const pts = cs.map((i) => ps[i]!);
    // Near-axis-aligned quadrilateral → rectangle from the bounds; otherwise keep the four corners.
    const aligned = pts.every((p) => Math.min(Math.abs(p.x - x0), Math.abs(p.x - x1)) < 0.15 * 2 * rx && Math.min(Math.abs(p.y - y0), Math.abs(p.y - y1)) < 0.15 * 2 * ry);
    return aligned ? { shape: "rect", pts: [{ x: x0, y: y0 }, { x: x1, y: y1 }], score: 0.85 } : { shape: "polygon", pts, score: 0.8 };
  }
  // Ellipse: the normalised radius from the centre barely varies (coefficient of variation < 0.12).
  const rs = ps.map((p) => Math.hypot((p.x - cx) / rx, (p.y - cy) / ry));
  const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
  const cv = Math.sqrt(rs.reduce((a, r) => a + (r - mean) ** 2, 0) / rs.length) / mean;
  if (cs.length <= 1 && cv < 0.12) return { shape: "ellipse", pts: [{ x: x0, y: y0 }, { x: x1, y: y1 }], score: 1 - cv };
  if (cs.length >= 5 && cs.length <= 8) return { shape: "polygon", pts: cs.map((i) => ps[i]!), score: 0.8 };
  return null;
}
