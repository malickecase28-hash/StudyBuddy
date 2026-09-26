import {
  EPS0, contains, dot, electricField, enclosedCharge, fluxDensity, fluxThrough, norm, scale, surfaceArea, surfacePatches,
  type Charge, type SurfaceShape, type Vec3,
} from "@forma/physics";
import { z } from "zod";
import { defineComponent, type AnyComponent } from "../component";

const V3 = z.tuple([z.number(), z.number(), z.number()]);
const ChargeItem = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("point"), q: z.number(), pos: V3, draggable: z.boolean().default(false) }),
  z.object({ id: z.string(), kind: z.literal("line"), rhoL: z.number(), x: z.number(), y: z.number() }),
  z.object({ id: z.string(), kind: z.literal("sheet"), rhoS: z.number(), z0: z.number() }),
]);
type Item = z.infer<typeof ChargeItem>;

const toSI = (it: Item): Charge =>
  it.kind === "point"
    ? { kind: "point", q: it.q * 1e-6, pos: it.pos as Vec3 }
    : it.kind === "line"
      ? { kind: "line", rhoL: it.rhoL * 1e-9, x: it.x, y: it.y }
      : { kind: "sheet", rhoS: it.rhoS * 1e-6, z0: it.z0 };

export const Charges = defineComponent({
  id: "charges",
  params: z.object({ items: z.array(ChargeItem).min(1) }),
  model: (p) => ({
    charges: p.items.map(toSI),
    items: p.items,
    total: p.items.reduce((s, it) => (it.kind === "point" ? s + it.q : s), 0),
  }),
  handles: ["items"],
  readouts: { total: "µC" },
});

const chargesOf = (ctx: { link: (n: string) => { model: Record<string, unknown> } }) => ctx.link("charges").model.charges as Charge[];
const nearPoint = (cs: Charge[], p: Vec3, r: number) => cs.some((c) => c.kind === "point" && norm([p[0] - c.pos[0], p[1] - c.pos[1], p[2] - c.pos[2]]) < r);

export const FieldArrows = defineComponent({
  id: "field-arrows",
  params: z.object({
    grid: z.number().int().min(3).max(9).default(5),
    extent: z.number().positive().default(1.6),
    plane: z.enum(["xz", "3d"]).default("xz"),
    probe: z.number().positive().default(1),
    epsR: z.number().positive().default(1),
  }),
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const t = (i: number) => -p.extent + (2 * p.extent * i) / (p.grid - 1);
    const pts: Vec3[] = [];
    for (let i = 0; i < p.grid; i++)
      for (let k = 0; k < p.grid; k++) {
        if (p.plane === "xz") pts.push([t(i), 0, t(k)]);
        else for (let j = 0; j < p.grid; j++) pts.push([t(i), t(j), t(k)]);
      }
    const minGap = (0.35 * 2 * p.extent) / (p.grid - 1);
    const samples = pts
      .filter((pt) => !nearPoint(cs, pt, minGap))
      .map((pt) => {
        const d = fluxDensity(cs, pt);
        const m = norm(d);
        return { p: pt, dir: m > 0 ? scale(d, 1 / m) : ([0, 0, 0] as Vec3), mag: m * 1e6 };
      });
    const probePt: Vec3 = [p.probe, 0, 0];
    return {
      samples,
      probeD: norm(fluxDensity(cs, probePt)) * 1e6,
      probeE: norm(electricField(cs, probePt)) / p.epsR,
    };
  },
  handles: ["probe", "epsR"],
  readouts: { probeD: "µC/m^2", probeE: "V/m" },
  links: ["charges"],
});

export const FieldProfile = defineComponent({
  id: "field-profile",
  params: z.object({
    rMin: z.number().positive().default(0.3),
    rMax: z.number().positive().default(3),
    samples: z.number().int().min(4).max(400).default(60),
    quantity: z.enum(["D", "E"]).default("D"),
  }),
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const points = Array.from({ length: p.samples }, (_, i) => {
      const r = p.rMin + ((p.rMax - p.rMin) * i) / (p.samples - 1);
      const v = p.quantity === "D" ? norm(fluxDensity(cs, [r, 0, 0])) * 1e6 : norm(electricField(cs, [r, 0, 0]));
      return { r, v };
    });
    return { points };
  },
  handles: [],
  readouts: {},
  links: ["charges"],
});

const SurfaceParams = z.object({
  shape: z.enum(["sphere", "cube", "blob", "cylinder"]).default("sphere"),
  center: V3.default([0, 0, 0]),
  size: z.number().positive().default(1),
  height: z.number().positive().default(1),
  amplitude: z.number().min(0).max(0.6).default(0.2),
  lobes: z.number().int().min(1).max(8).default(3),
  showNormals: z.boolean().default(false),
  shading: z.boolean().default(false),
  readout: z.boolean().default(true),
  quality: z.number().int().min(8).max(96).default(24),
});

const toShape = (p: z.infer<typeof SurfaceParams>): SurfaceShape => {
  const center = p.center as Vec3;
  switch (p.shape) {
    case "sphere":
      return { kind: "sphere", center, radius: p.size };
    case "cube":
      return { kind: "cube", center, side: p.size };
    case "blob":
      return { kind: "blob", center, radius: p.size, amplitude: p.amplitude, lobes: p.lobes };
    case "cylinder":
      return { kind: "cylinder", center, radius: p.size, height: p.height };
  }
};

export const GaussianSurface = defineComponent({
  id: "gaussian-surface",
  params: SurfaceParams,
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const shape = toShape(p);
    // A point charge within 1% of the surface (inside the 1.01× shape, outside the 0.99× shape) makes the
    // integrand singular. Physically a smooth surface catches half of it, so count it as ½ and flag it.
    const grown = toShape({ ...p, size: p.size * 1.01, height: p.height * 1.01 });
    const shrunk = toShape({ ...p, size: p.size * 0.99, height: p.height * 0.99 });
    const onSurface = cs.filter((c) => c.kind === "point" && contains(grown, c.pos) && !contains(shrunk, c.pos));
    const regular = cs.filter((c) => !onSurface.includes(c));
    const halfOnSurface = onSurface.reduce((s, c) => s + (c.kind === "point" ? c.q : 0), 0) / 2;
    // Gauss's law is exact, so the flux readout is the analytic enclosed charge. Quadrature is used only where
    // no closed form exists (line/sheet charges crossing a blob); where lines pierce a surface it converges O(1/n).
    const analytic = p.shape !== "blob" || regular.every((c) => c.kind === "point");
    const enclosed = analytic ? enclosedCharge(regular, shape) : fluxThrough(regular, surfacePatches(shape, p.quality));
    const flux = enclosed + halfOnSurface;
    const patches = surfacePatches(shape, 8).map((pt) => {
      const a = norm(pt.dS);
      const n = scale(pt.dS, 1 / a);
      return { center: pt.center, normal: n, area: a, contribution: dot(fluxDensity(regular, pt.center), pt.dS) * 1e6 };
    });
    return { flux: flux * 1e6, enclosed: (enclosed + halfOnSurface) * 1e6, area: surfaceArea(shape, 16), onSurface: onSurface.length > 0, patches };
  },
  handles: ["size", "shape", "center"],
  readouts: { flux: "µC", enclosed: "µC", area: "m^2" },
  links: ["charges"],
});

export const Equation = defineComponent({
  id: "equation",
  params: z.object({
    latex: z.string().min(1),
    terms: z.array(z.object({ key: z.string().min(1), speech: z.string().min(1) })).default([]),
    speech: z.string().min(1),
    shortSpeech: z.string().min(1),
  }),
  model: () => ({}),
  handles: [],
  readouts: {},
});

const MATERIAL_EPS_R = { Air: 1.0006, Glass: 5, Sulphur: 4, Shellac: 3.5 } as const;

export const FaradaySpheres = defineComponent({
  id: "faraday-spheres",
  params: z.object({
    innerQ: z.number().default(2),
    material: z.enum(["Air", "Glass", "Sulphur", "Shellac"]).default("Air"),
    revealed: z.boolean().default(false),
  }),
  model: (p) => {
    const epsR = MATERIAL_EPS_R[p.material];
    const d = (p.innerQ * 1e-6) / (4 * Math.PI * 0.25); // D at r = 0.5 m
    return { outerQ: p.innerQ, epsR, eMid: d / (EPS0 * epsR) };
  },
  handles: ["material"],
  readouts: { outerQ: "µC", eMid: "V/m" },
});

export const Axes = defineComponent({ id: "axes", params: z.object({ length: z.number().positive().default(1.8) }), model: () => ({}), handles: [], readouts: {} });

export const DimensionCallout = defineComponent({
  id: "dimension-callout",
  params: z.object({ from: V3, to: V3, label: z.string().min(1) }),
  model: () => ({}),
  handles: [],
  readouts: {},
});

export const emComponents: AnyComponent[] = [Charges, FieldArrows, FieldProfile, GaussianSurface, Equation, FaradaySpheres, Axes, DimensionCallout];
