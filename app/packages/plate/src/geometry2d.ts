import { blobRadius, type SurfaceShape, type Vec3 } from "@forma/physics";

/** SVG pixels per metre. Plates draw the x–z plane: x to the right, z up. */
export const PX = 100;
export const VIEWBOX = { x: -260, y: -190, w: 520, h: 380 } as const;

export const toSvg = (p: readonly number[]): [number, number] => [p[0]! * PX, -(p[2] ?? 0) * PX];
export const fromSvg = (x: number, y: number): Vec3 => [x / PX, 0, -y / PX === 0 ? 0 : -y / PX];

function rect(hx: number, hz: number, n: number): [number, number][] {
  const per = 4 * (hx + hz);
  return Array.from({ length: n }, (_, i) => {
    let s = (per * i) / n;
    if (s < 2 * hz) return [hx, -hz + s];
    s -= 2 * hz;
    if (s < 2 * hx) return [hx - s, hz];
    s -= 2 * hx;
    if (s < 2 * hz) return [-hx, hz - s];
    s -= 2 * hz;
    return [-hx + s, -hz];
  });
}

/** Cross-section of a closed surface in the plane y = center.y: n points, counter-clockwise in (x, z). */
export function outline(shape: SurfaceShape, n = 96): Vec3[] {
  const [cx, cy, cz] = shape.center;
  const at = (x: number, z: number): Vec3 => [cx + x, cy, cz + z];
  switch (shape.kind) {
    case "sphere":
      return Array.from({ length: n }, (_, i) => {
        const t = (2 * Math.PI * i) / n;
        return at(shape.radius * Math.cos(t), shape.radius * Math.sin(t));
      });
    case "cube":
      return rect(shape.side / 2, shape.side / 2, n).map(([x, z]) => at(x, z));
    case "cylinder":
      return rect(shape.radius, shape.height / 2, n).map(([x, z]) => at(x, z));
    case "blob":
      return Array.from({ length: n }, (_, i) => {
        const t = (2 * Math.PI * i) / n;
        const x = Math.cos(t);
        const z = Math.sin(t);
        // Direction (x, 0, z) is spherical θ = acos(z), φ = 0 (x ≥ 0) or π (x < 0), matching physics `contains`.
        const r = blobRadius(shape, Math.acos(z), x >= 0 ? 0 : Math.PI);
        return at(r * x, r * z);
      });
  }
}

/** Outward unit normals in the x–z plane, from each point's neighbour chord. Shapes are star-shaped about center. */
export function outlineNormals(pts: readonly Vec3[], center: Vec3): Vec3[] {
  return pts.map((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length]!;
    const b = pts[(i + 1) % pts.length]!;
    let nx = b[2] - a[2];
    let nz = -(b[0] - a[0]);
    const len = Math.hypot(nx, nz) || 1;
    nx /= len;
    nz /= len;
    if (nx * (p[0] - center[0]) + nz * (p[2] - center[2]) < 0) {
      nx = -nx;
      nz = -nz;
    }
    return [nx, 0, nz];
  });
}

export const pathD = (pts: readonly (readonly number[])[], closed = true) =>
  pts
    .map((p, i) => {
      const [x, y] = toSvg(p);
      return `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ") + (closed ? " Z" : "");
