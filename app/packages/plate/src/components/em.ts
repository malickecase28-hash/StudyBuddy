import {
  EPS0, K_E, contains, dot, electricField, enclosedCharge, fluxDensity, fluxThrough, norm, potential, scale, surfaceArea, surfacePatches,
  type Charge, type SurfaceShape, type Vec3,
} from "@forma/physics";
import { z } from "zod";
import { vecComponents } from "./vec";
import { mathComponents } from "./math";
import { mediaComponents } from "./media";
import { defineComponent, type AnyComponent } from "../component";
import { outline as outlineOf, outlineNormals } from "../geometry2d";

const V3 = z.tuple([z.number(), z.number(), z.number()]);
/** Integer params round on parse, so timeline tweens between two integers stay valid mid-transition. */
const int = (min: number, max: number, def: number) => z.number().transform(Math.round).pipe(z.number().int().min(min).max(max)).default(def);
const ChargeItem = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("point"), q: z.number(), pos: V3, label: z.string().optional(), draggable: z.boolean().default(false) }),
  z.object({ id: z.string(), kind: z.literal("ball"), rhoV: z.number(), radius: z.number().positive(), center: V3 }),
  z.object({ id: z.string(), kind: z.literal("line"), rhoL: z.number(), x: z.number(), y: z.number() }),
  z.object({ id: z.string(), kind: z.literal("sheet"), rhoS: z.number(), z0: z.number() }),
]);
type Item = z.infer<typeof ChargeItem>;

const toSI = (it: Item): Charge => {
  if (it.kind === "point") return { kind: "point", q: it.q * 1e-6, pos: it.pos as Vec3 };
  if (it.kind === "ball") return { kind: "ball", rhoV: it.rhoV * 1e-6, radius: it.radius, center: it.center as Vec3 };
  if (it.kind === "line") return { kind: "line", rhoL: it.rhoL * 1e-9, x: it.x, y: it.y };
  return { kind: "sheet", rhoS: it.rhoS * 1e-6, z0: it.z0 };
};

export const Charges = defineComponent({
  id: "charges",
  params: z.object({ items: z.array(ChargeItem).min(1), drawScale: z.number().positive().default(1), oblique: z.boolean().default(false) }),
  model: (p) => ({
    charges: p.items.map(toSI),
    items: p.items,
    // Line and sheet charges have no finite total.
    ...(p.items.every((it) => it.kind === "point" || it.kind === "ball") ? { total: p.items.reduce((s, it) => s + (it.kind === "point" ? it.q : it.kind === "ball" ? (it.rhoV * (4 / 3) * Math.PI * it.radius ** 3) : 0), 0) } : {}),
    qs: p.items.flatMap((it) => (it.kind === "point" ? [it.q] : [])),
    rhoVs: p.items.flatMap((it) => (it.kind === "ball" ? [it.rhoV] : [])),
    rhoSs: p.items.flatMap((it) => (it.kind === "sheet" ? [it.rhoS] : [])),
    rhoLs: p.items.flatMap((it) => (it.kind === "line" ? [it.rhoL] : [])),
  }),
  handles: ["items"],
  readouts: { total: "µC" },
  quotable: { qs: "µC", rhoVs: "µC/m^3", rhoSs: "µC/m^2", rhoLs: "nC/m" },
});

const chargesOf = (ctx: { link: (n: string) => { model: Record<string, unknown> } }) => ctx.link("charges").model.charges as Charge[];
/** True when p lies within r of a point or line charge, or within 1e-9 m of a sheet: D is undefined or unreadable there. */
const nearCharge = (cs: Charge[], p: Vec3, r: number) =>
  cs.some((c) =>
    c.kind === "point"
      ? norm([p[0] - c.pos[0], p[1] - c.pos[1], p[2] - c.pos[2]]) < r
      : c.kind === "ball"
        ? false
        : c.kind === "line"
          ? Math.hypot(p[0] - c.x, p[1] - c.y) < r
          : Math.abs(p[2] - c.z0) < 1e-9,
  );
const SINGULAR = 1e-9;

export const FieldArrows = defineComponent({
  id: "field-arrows",
  params: z.object({
    grid: int(3, 9, 5),
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
      .filter((pt) => !nearCharge(cs, pt, minGap))
      .map((pt) => {
        const d = fluxDensity(cs, pt);
        const m = norm(d);
        return { p: pt, dir: m > 0 ? scale(d, 1 / m) : ([0, 0, 0] as Vec3), mag: m * 1e6 };
      });
    // At a charge (or on a sheet) the field is undefined: report null rather than NaN or a misleading 0.
    const probePt: Vec3 = [p.probe, 0, 0];
    const singular = nearCharge(cs, probePt, SINGULAR);
    return {
      samples,
      probeD: singular ? null : norm(fluxDensity(cs, probePt)) * 1e6,
      probeE: singular ? null : norm(electricField(cs, probePt)) / p.epsR,
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
    samples: int(4, 400, 60),
    quantity: z.enum(["D", "E"]).default("D"),
  }),
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const points = Array.from({ length: p.samples }, (_, i) => p.rMin + ((p.rMax - p.rMin) * i) / (p.samples - 1))
      .filter((r) => !nearCharge(cs, [r, 0, 0], SINGULAR))
      .map((r) => ({ r, v: p.quantity === "D" ? norm(fluxDensity(cs, [r, 0, 0])) * 1e6 : norm(electricField(cs, [r, 0, 0])) }));
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
  lobes: int(1, 8, 3),
  showNormals: z.boolean().default(false),
  shading: z.boolean().default(false),
  readout: z.boolean().default(true),
  quality: int(8, 96, 24),
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
    // A point charge on the surface (to 1e-9 relative) makes the integrand singular. Physically a smooth
    // surface catches half of it, so count it as ½ and flag it. Anywhere else the charge is fully in or out.
    const grown = toShape({ ...p, size: p.size * (1 + SINGULAR), height: p.height * (1 + SINGULAR) });
    const shrunk = toShape({ ...p, size: p.size * (1 - SINGULAR), height: p.height * (1 - SINGULAR) });
    const onSurface = cs.filter((c) => c.kind === "point" && contains(grown, c.pos) && !contains(shrunk, c.pos));
    const regular = cs.filter((c) => !onSurface.includes(c));
    const halfOnSurface = onSurface.reduce((s, c) => s + (c.kind === "point" ? c.q : 0), 0) / 2;
    // Gauss's law is exact, so the flux readout is the analytic enclosed charge (quadrature where lines pierce a
    // surface converges only O(1/n)). A blob has no closed form for a crossing line or sheet, so that is refused.
    let inScope = regular;
    if (p.shape === "blob") {
      const reach = p.size * (1 + p.amplitude);
      const c0 = p.center;
      if (regular.some((c) => (c.kind === "line" ? Math.hypot(c.x - c0[0], c.y - c0[1]) < reach : c.kind === "sheet" && Math.abs(c.z0 - c0[2]) < reach)))
        throw new Error("gaussian-surface: line and sheet charges crossing a blob have no exact flux; use a sphere, cube or cylinder");
      inScope = regular.filter((c) => c.kind === "point");
    }
    const enclosed = enclosedCharge(inScope, shape);
    const flux = enclosed + halfOnSurface;
    const pts = outlineOf(shape, 96);
    const normals = outlineNormals(pts, shape.center);
    const outline = pts.map((pt, i) => {
      const n = normals[i]!;
      const dn = dot(fluxDensity(regular, pt), n) * 1e6;
      return { p: pt, n, dn: Number.isFinite(dn) ? dn : null };
    });
    return { flux: flux * 1e6, enclosed: (enclosed + halfOnSurface) * 1e6, area: surfaceArea(shape, 16), onSurface: onSurface.length > 0, outline };
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
    const dMid = p.innerQ / (4 * Math.PI * 0.25); // µC/m² at r = 0.5 m
    return { outerQ: p.innerQ, epsR, eMid: (dMid * 1e-6) / (EPS0 * epsR), dMid, innerQ: p.innerQ, rMid: 0.5 };
  },
  handles: ["material"],
  readouts: { outerQ: "µC", eMid: "V/m", dMid: "µC/m^2" },
  quotable: { innerQ: "µC", rMid: "m" },
});

const itemToSI = toSI;

export const CoulombForce = defineComponent({
  id: "coulomb-force",
  params: z.object({ on: z.string(), drawScale: z.number().positive().default(1), oblique: z.boolean().default(false) }),
  links: ["charges"],
  model: (p, ctx) => {
    const items = ctx.link("charges").params.items as Item[];
    const target = items.find((i) => i.id === p.on && i.kind === "point");
    if (!target || target.kind !== "point") return {};
    const at = target.pos as Vec3;
    const others = items.filter((i) => i.id !== p.on);
    const E = electricField(others.map(itemToSI), at);
    const q = target.q * 1e-6;
    const F: Vec3 = [E[0] * q, E[1] * q, E[2] * q];
    const pts = others.filter((i) => i.kind === "point") as Extract<Item, { kind: "point" }>[];
    const R = pts.length === 1 && others.length === 1 ? norm([at[0] - pts[0]!.pos[0], at[1] - pts[0]!.pos[1], at[2] - pts[0]!.pos[2]]) : undefined;
    const U = R !== undefined && pts.length === 1 ? (K_E * q * (pts[0]!.q * 1e-6)) / R : undefined;
    return { Fx: F[0], Fy: F[1], Fz: F[2], Fmag: norm(F), at, ...(R === undefined ? {} : { R }), ...(U === undefined ? {} : { U }) };
  },
  handles: [],
  readouts: { Fx: "N", Fy: "N", Fz: "N", Fmag: "N", R: "m", U: "J" },
  quotable: { Fx: "N", Fy: "N", Fz: "N", Fmag: "N", R: "m", U: "J" },
});

export const EProbe = defineComponent({
  id: "e-probe",
  params: z.object({ point: V3, drawScale: z.number().positive().default(1), oblique: z.boolean().default(false), draggable: z.boolean().default(false) }),
  links: ["charges"],
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const pt = p.point as Vec3;
    const onCharge = nearCharge(cs, pt, SINGULAR);
    if (onCharge) return { Ex: null, Ey: null, Ez: null, Emag: null, Dx: null, Dy: null, Dz: null, Dmag: null };
    const E = electricField(cs, pt);
    const V = (() => { try { return potential(cs, pt); } catch { return undefined; } })();
    return { Ex: E[0], Ey: E[1], Ez: E[2], Emag: norm(E), Dx: E[0] * EPS0 * 1e6, Dy: E[1] * EPS0 * 1e6, Dz: E[2] * EPS0 * 1e6, Dmag: norm(E) * EPS0 * 1e6, ...(V === undefined ? {} : { V }) };
  },
  handles: ["point"],
  readouts: { Ex: "V/m", Ey: "V/m", Ez: "V/m", Emag: "V/m", Dx: "µC/m^2", Dy: "µC/m^2", Dz: "µC/m^2", Dmag: "µC/m^2", V: "V" },
  quotable: { Ex: "V/m", Ey: "V/m", Ez: "V/m", Emag: "V/m", Dx: "µC/m^2", Dy: "µC/m^2", Dz: "µC/m^2", Dmag: "µC/m^2", V: "V" },
});

export const Axes = defineComponent({ id: "axes", params: z.object({ length: z.number().positive().default(1.8) }), model: () => ({}), handles: [], readouts: {} });

export const DimensionCallout = defineComponent({
  id: "dimension-callout",
  params: z.object({ from: V3, to: V3, label: z.string().min(1) }),
  model: () => ({}),
  handles: [],
  readouts: {},
});

export const UniformField = defineComponent({
  id: "uniform-field",
  params: z.object({ Dx: z.number().default(3), Dz: z.number().default(0), spacing: z.number().positive().default(0.45) }),
  model: (p) => {
    const D: Vec3 = [p.Dx, 0, p.Dz];
    return { D, magnitude: norm(D), directionDeg: (Math.atan2(p.Dz, p.Dx) * 180) / Math.PI, Dx: p.Dx, Dz: p.Dz };
  },
  handles: ["Dx", "Dz"],
  readouts: { magnitude: "µC/m^2" },
  quotable: { Dx: "µC/m^2", Dz: "µC/m^2" },
});

export const FlatPatch = defineComponent({
  id: "flat-patch",
  params: z.object({
    center: V3.default([0, 0, 0]),
    size: z.number().positive().default(1),
    depth: z.number().positive().optional(),
    normalAngle: z.number().default(0),
    showNormal: z.boolean().default(true),
    showShadow: z.boolean().default(false),
  }),
  model: (p, ctx) => {
    const D = ctx.link("field").model.D as Vec3;
    const a = (p.normalAngle * Math.PI) / 180;
    const n: Vec3 = [Math.cos(a), 0, Math.sin(a)];
    const area = p.size * (p.depth ?? p.size);
    const Dn = dot(D, n);
    const mag = norm(D);
    const theta = mag > 0 ? (Math.acos(Math.max(-1, Math.min(1, Dn / mag))) * 180) / Math.PI : null;
    return { n, area, Dn, dPsi: Dn * area, theta, shadow: mag > 0 ? (area * Math.abs(Dn)) / mag : 0 };
  },
  handles: ["normalAngle", "size", "center"],
  readouts: { dPsi: "µC", Dn: "µC/m^2", area: "m^2", shadow: "m^2", theta: "°" },
  links: ["field"],
});

export const Vector = defineComponent({
  id: "vector",
  params: z.object({
    from: V3,
    to: V3,
    label: z.string().min(1),
    tone: z.enum(["charge", "field", "flux", "surface", "ink"]).default("ink"),
    arcTo: V3.optional(),
  }),
  model: () => ({}),
  handles: [],
  readouts: {},
});

export const PatchTiling = defineComponent({
  id: "patch-tiling",
  params: z.object({ shape: z.enum(["sphere", "cube"]).default("sphere"), center: V3.default([0, 0, 0]), size: z.number().positive().default(1), n: int(1, 48, 2) }),
  model: (p, ctx) => {
    const cs = chargesOf(ctx);
    const center = p.center as Vec3;
    const shape: SurfaceShape = p.shape === "cube" ? { kind: "cube", center, side: p.size } : { kind: "sphere", center, radius: p.size };
    const pts = outlineOf(shape, Math.max(8, 4 * p.n));
    const normals = outlineNormals(pts, center);
    const segments = pts.map((pt, i) => {
      const v = dot(fluxDensity(cs, pt), normals[i]!) * 1e6;
      return { p: pt, dn: Number.isFinite(v) ? v : null };
    });
    return { sum: fluxThrough(cs, surfacePatches(shape, p.n)) * 1e6, count: surfacePatches(shape, p.n).length, segments };
  },
  handles: ["n"],
  readouts: { sum: "µC", count: "" },
  links: ["charges"],
});

export const emComponents: AnyComponent[] = [Charges, FieldArrows, FieldProfile, GaussianSurface, Equation, FaradaySpheres, CoulombForce, EProbe, Axes, DimensionCallout, UniformField, FlatPatch, Vector, PatchTiling, ...vecComponents, ...mathComponents, ...mediaComponents];
