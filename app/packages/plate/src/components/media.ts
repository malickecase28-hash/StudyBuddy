import { capCoax, capParallel, capSphere, dielectricBoundary, EPS0, norm } from "@forma/physics";
import { z } from "zod";
import { defineComponent } from "../component";

const V3 = z.tuple([z.number(), z.number(), z.number()]);
const GROUPS = {
  n: ["nx", "ny", "nz"],
  split: ["D1nx", "D1ny", "D1nz", "D1tx", "D1ty", "D1tz"],
  D: ["D1x", "D1y", "D1z", "D2x", "D2y", "D2z"],
  E: ["E1x", "E1y", "E1z", "E2x", "E2y", "E2z"],
  angles: ["th1", "th2"],
  mag: ["D1mag", "D2mag", "E1mag", "E2mag"],
  P: ["P1x", "P1y", "P1z", "P2x", "P2y", "P2z"],
  rhoS: ["rhoS"],
} as const;
type Group = keyof typeof GROUPS;
const unitOf = (k: string) => (k.startsWith("E") ? "V/m" : k.startsWith("th") ? "°" : k.startsWith("n") ? "" : "C/m^2");
const BOUNDARY_UNITS = Object.fromEntries(Object.values(GROUPS).flat().map((k) => [k, unitOf(k)]));

export const Boundary = defineComponent({
  id: "boundary",
  params: z.object({
    D1: V3, normal: V3, er1: z.number().positive(), er2: z.number().positive(),
    rhoS: z.number().default(0), conductor: z.boolean().default(false),
    measure: z.enum(["normal", "tangent"]).default("normal"),
    show: z.array(z.enum(Object.keys(GROUPS) as [Group, ...Group[]])).default(["split", "D", "angles"]),
    /** Where the plate draws the interface. The physics depends only on the normal, so the plane's offset is not modelled. */
    anchor: V3.default([0, 0, 0]),
  }),
  model: (p) => {
    const r = dielectricBoundary({ D1: p.D1, normal: p.normal, er1: p.er1, er2: p.er2, rhoS: p.rhoS, conductor: p.conductor });
    const from = (t: number) => (p.measure === "normal" ? t : 90 - t);
    const v = (name: string, x: readonly number[]) => ({ [`${name}x`]: x[0]!, [`${name}y`]: x[1]!, [`${name}z`]: x[2]! });
    const all: Record<string, number | null> = {
      nx: r.n[0], ny: r.n[1], nz: r.n[2],
      ...v("D1n", r.D1n), ...v("D1t", r.D1t), ...v("D1", p.D1), ...v("D2", r.D2), ...v("E1", r.E1), ...v("E2", r.E2), ...v("P1", r.P1), ...v("P2", r.P2),
      th1: from(r.theta1), th2: r.theta2 === null ? null : from(r.theta2),
      D1mag: norm(p.D1), D2mag: norm(r.D2), E1mag: norm(r.E1), E2mag: norm(r.E2),
      rhoS: r.rhoS,
    };
    const out: Record<string, unknown> = { draw: { n: r.n, D1: p.D1, D2: r.D2, D1n: r.D1n, D1t: r.D1t, split: p.show.includes("split") } };
    for (const g of p.show) for (const k of GROUPS[g]) if (all[k] !== null) out[k] = all[k];
    return out;
  },
  handles: [],
  readouts: BOUNDARY_UNITS,
  quotable: BOUNDARY_UNITS,
});

export const Capacitor = defineComponent({
  id: "capacitor",
  params: z.object({
    kind: z.enum(["parallel", "coax", "sphere"]),
    er: z.number().positive().default(1),
    /** Volts across the capacitor. */
    V: z.number().default(1),
    area: z.number().positive().optional(), d: z.number().positive().optional(),
    a: z.number().positive().optional(), b: z.number().positive().optional(), length: z.number().positive().optional(),
  }),
  model: (p) => {
    let C: number, Eg: number;
    if (p.kind === "parallel") {
      if (p.area === undefined || p.d === undefined) throw new Error("a parallel-plate capacitor needs area and d");
      C = capParallel(p.area, p.d, p.er);
      Eg = p.V / p.d;
    } else if (p.kind === "coax") {
      if (p.a === undefined || p.b === undefined || p.length === undefined || !(p.b > p.a)) throw new Error("a coax needs a < b and a length");
      C = capCoax(p.a, p.b, p.length, p.er);
      Eg = p.V / (p.a * Math.log(p.b / p.a));
    } else {
      const b = p.b ?? Infinity;
      if (p.a === undefined || !(b > p.a)) throw new Error("a spherical capacitor needs a < b");
      C = capSphere(p.a, b, p.er);
      Eg = p.V / (p.a * p.a * (1 / p.a - 1 / b));
    }
    const dims = p.kind === "parallel" ? { S: p.area } : { innerD: 2 * p.a!, ...(p.b !== undefined ? { outerD: 2 * p.b } : {}) };
    return { C, Q: C * p.V, W: 0.5 * C * p.V * p.V, Eg, wE: 0.5 * p.er * EPS0 * Eg * Eg, ...dims };
  },
  handles: [],
  readouts: { C: "F", Q: "C", W: "J", Eg: "V/m", wE: "J/m^3" },
  quotable: { C: "F", Q: "C", W: "J", Eg: "V/m", wE: "J/m^3", S: "m^2", innerD: "m", outerD: "m" },
});

export const mediaComponents = [Boundary, Capacitor];
