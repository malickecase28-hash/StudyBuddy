import { cartOf, gaussLegendre, nativeOf, scalarFields, vectorFields, type Vec3 } from "@forma/physics";
import { toSI } from "@forma/engine";
import { z } from "zod";
import { defineComponent } from "../component";

const V3 = z.tuple([z.number(), z.number(), z.number()]);
const finite = (v: number) => (Number.isFinite(v) ? v : null);
const ScalarId = z.enum(Object.keys(scalarFields) as [string, ...string[]]);
const VectorId = z.enum(Object.keys(vectorFields) as [string, ...string[]]);

export const ScalarSlice = defineComponent({
  id: "scalar-slice",
  params: z.object({
    field: ScalarId, plane: z.enum(["xz", "xy"]).default("xz"), offset: z.number().default(0),
    probe: V3, draggable: z.boolean().default(false), arrows: z.boolean().default(true),
  }),
  model: (p) => {
    const s = scalarFields[p.field]!;
    const n = nativeOf(p.probe as Vec3, s.system);
    const g = s.grad(n);
    return { system: s.system, f: finite(s.f(n)), g1: finite(g[0]), g2: finite(g[1]), g3: finite(g[2]), gmag: finite(Math.hypot(g[0], g[1], g[2])) };
  },
  handles: ["probe"],
  readouts: { f: "", g1: "", g2: "", g3: "", gmag: "" },
  quotable: { f: "", g1: "", g2: "", g3: "", gmag: "" },
});

/** Net outward flux of F through a cube of side s centred at c (4×4 Gauss–Legendre per face). */
export function boxFlux(F: (p: Vec3) => Vec3, c: Vec3, s: number): number {
  const { nodes, weights } = gaussLegendre(4);
  const h = s / 2;
  let sum = 0;
  for (let axis = 0; axis < 3; axis++) {
    const [u, v] = [0, 1, 2].filter((k) => k !== axis) as [number, number];
    for (const sign of [1, -1]) {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const p = [c[0], c[1], c[2]];
          p[axis] = c[axis]! + sign * h;
          p[u] = c[u]! + h * nodes[i]!;
          p[v] = c[v]! + h * nodes[j]!;
          sum += weights[i]! * weights[j]! * h * h * sign * F(p as unknown as Vec3)[axis]!;
        }
      }
    }
  }
  return sum;
}

/** Counter-clockwise circulation of F round a square of side s centred at c, in the plane spanned by axes u then v (normal u × v). */
export function loopCirculation(F: (p: Vec3) => Vec3, c: Vec3, s: number, u: number, v: number): number {
  const { nodes, weights } = gaussLegendre(4);
  const h = s / 2;
  const edges: [number, number, number, number][] = [
    // [fixed axis, fixed offset, moving axis, direction]
    [v, -h, u, 1], [u, h, v, 1], [v, h, u, -1], [u, -h, v, -1],
  ];
  let sum = 0;
  for (const [fa, fo, ma, dir] of edges) {
    for (let i = 0; i < 4; i++) {
      const p = [c[0], c[1], c[2]];
      p[fa] = c[fa]! + fo;
      p[ma] = c[ma]! + h * nodes[i]!;
      sum += weights[i]! * h * dir * F(p as unknown as Vec3)[ma]!;
    }
  }
  return sum;
}

export const VectorSlice = defineComponent({
  id: "vector-slice",
  params: z.object({
    field: VectorId, plane: z.enum(["xz", "xy"]).default("xz"), offset: z.number().default(0),
    probe: V3, draggable: z.boolean().default(false),
    box: z.number().min(0).default(0), loop: z.number().min(0).default(0),
  }),
  model: (p) => {
    const f = vectorFields[p.field]!;
    const c = p.probe as Vec3;
    const n = nativeOf(c, f.system);
    const Fv = f.F(n);
    const cu = f.curl(n);
    const cart = (q: Vec3) => cartOf(f.F(nativeOf(q, f.system)), q, f.system);
    const out: Record<string, number | string | null> = {
      system: f.system, F1: finite(Fv[0]), F2: finite(Fv[1]), F3: finite(Fv[2]),
      div: finite(f.div(n)), c1: finite(cu[0]), c2: finite(cu[1]), c3: finite(cu[2]),
      loopAxis: p.plane === "xy" ? "+z" : "−y",
    };
    if (p.box > 0) {
      const b = boxFlux(cart, c, p.box);
      out.boxFlux = finite(b);
      out.boxRatio = finite(b / p.box ** 3);
    }
    if (p.loop > 0) {
      // xy: x then y, normal +z. xz on screen is x right, z up: counter-clockwise on screen is x then z, normal x × z = −y.
      const k = p.plane === "xy" ? loopCirculation(cart, c, p.loop, 0, 1) : loopCirculation(cart, c, p.loop, 0, 2);
      out.circ = finite(k);
      out.circRatio = finite(k / p.loop ** 2);
    }
    return out;
  },
  handles: ["probe"],
  readouts: { F1: "", F2: "", F3: "", div: "", c1: "", c2: "", c3: "", boxFlux: "", boxRatio: "", circ: "", circRatio: "" },
  quotable: { F1: "", F2: "", F3: "", div: "", c1: "", c2: "", c3: "", boxRatio: "", circRatio: "" },
});

const Range = z.tuple([z.number(), z.number()]).refine(([a, b]) => b > a, "range must increase");
const DEG = Math.PI / 180;

export const CoordRegion = defineComponent({
  id: "coord-region",
  params: z.object({
    system: z.enum(["cart", "cyl", "sph"]),
    ranges: z.tuple([Range, Range, Range]),
    face: z.union([z.literal(0), z.literal(1), z.literal(2), z.null()]).default(null),
    faceAt: z.enum(["max", "min"]).default("max"),
    /** Drawing magnification only (a 7 m cylinder or a 25 cm patch); readouts use the true region. */
    drawScale: z.number().positive().default(1),
  }),
  model: (p) => {
    const [[a1, b1], [a2, b2], [a3, b3]] = p.ranges;
    const pick = (a: number, b: number) => (p.faceAt === "max" ? b : a);
    if (p.system === "cart") {
      const [dx, dy, dz] = [b1 - a1, b2 - a2, b3 - a3];
      const area = p.face === null ? undefined : [dy * dz, dx * dz, dx * dy][p.face];
      return { len1: dx, len2: dy, len3: dz, volume: dx * dy * dz, ...(area === undefined ? {} : { area }) };
    }
    if (p.system === "cyl") {
      const dphi = (b2 - a2) * DEG, dz = b3 - a3;
      const area = p.face === null ? undefined : [pick(a1, b1) * dphi * dz, (b1 - a1) * dz, 0.5 * (b1 * b1 - a1 * a1) * dphi][p.face];
      return { len1: b1 - a1, len2: a1 * dphi, len3: dz, volume: 0.5 * (b1 * b1 - a1 * a1) * dphi * dz, ...(area === undefined ? {} : { area }) };
    }
    const ta = a2 * DEG, tb = b2 * DEG, dth = tb - ta, dphi = (b3 - a3) * DEG;
    const rs = pick(a1, b1), ts = pick(ta, tb);
    const area = p.face === null ? undefined : [rs * rs * (Math.cos(ta) - Math.cos(tb)) * dphi, 0.5 * (b1 * b1 - a1 * a1) * Math.sin(ts) * dphi, 0.5 * (b1 * b1 - a1 * a1) * dth][p.face];
    return {
      len1: b1 - a1, len2: a1 * dth, len3: a1 * Math.sin(ta) * dphi,
      volume: ((b1 ** 3 - a1 ** 3) / 3) * (Math.cos(ta) - Math.cos(tb)) * dphi,
      ...(area === undefined ? {} : { area }),
    };
  },
  handles: [],
  readouts: { len1: "m", len2: "m", len3: "m", area: "m^2", volume: "m^3" },
  quotable: { len1: "m", len2: "m", len3: "m", area: "m^2", volume: "m^3" },
});

export const C0 = 299_792_458;
const BANDS: [number, string][] = [[3e8, "Radio"], [3e11, "Microwave"], [4e14, "Infrared"], [7.9e14, "Visible"], [3e16, "Ultraviolet"], [3e19, "X-ray"], [Infinity, "Gamma"]];

export const Spectrum = defineComponent({
  id: "spectrum",
  params: z.object({ f: z.number().positive().default(2.45e9), draggable: z.boolean().default(false) }),
  model: (p) => ({ f: p.f, lambda: C0 / p.f, band: BANDS.find(([top]) => p.f < top)![1] }),
  handles: ["f"],
  readouts: { f: "Hz", lambda: "m" },
  quotable: { f: "Hz", lambda: "m" },
});

export const UnitConvert = defineComponent({
  id: "unit-convert",
  params: z.object({ value: z.number(), unit: z.string().min(1) }),
  model: (p) => {
    try {
      const q = toSI(p.value, p.unit);
      const key = ({ m: "siM", "m^2": "siM2", "m^3": "siM3", C: "siC", Hz: "siHz", V: "siV", F: "siF", N: "siN" } as Record<string, string>)[q.dim] ?? "si";
      return { [key]: q.value, dim: q.dim, ok: true } as Record<string, number | string | boolean>;
    } catch {
      return { dim: "", ok: false };
    }
  },
  handles: [],
  readouts: { siM: "m", siM2: "m^2", siM3: "m^3", siC: "C", siHz: "Hz", siV: "V", siF: "F", siN: "N", si: "" },
  quotable: { siM: "m", siM2: "m^2", siM3: "m^3", siC: "C", siHz: "Hz", siV: "V", siF: "F", siN: "N" },
});

export const mathComponents = [ScalarSlice, VectorSlice, CoordRegion, Spectrum, UnitConvert];
