import { cartOf, gaussLegendre, nativeOf, scalarFields, vectorFields, type Vec3 } from "@forma/physics";
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
          p[axis] = c[axis] + sign * h;
          p[u] = c[u] + h * nodes[i]!;
          p[v] = c[v] + h * nodes[j]!;
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
      p[fa] = c[fa] + fo;
      p[ma] = c[ma] + h * nodes[i]!;
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

export const mathComponents = [ScalarSlice, VectorSlice];
