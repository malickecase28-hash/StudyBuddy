import { capCoax, capParallel, capSphere, dielectricBoundary, enclosedCurrentAt, hphiAt, indCoax, indSolenoid, indToroid, indTwoWire, magneticBoundary, magneticFieldH, planeWave, EPS0, MU0, norm, scale, sub, dot, type Current, type Vec3 } from "@forma/physics";
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
    const out: Record<string, unknown> = { draw: { n: r.n, D1: p.D1, D2: r.D2, D1n: r.D1n, D1t: r.D1t, split: p.show.includes("split"), sym: "D", mat: "εr" } };
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

const CurrentItem = z.discriminatedUnion("kind", [
  z.object({ id: z.string(), kind: z.literal("line"), I: z.number(), point: V3.default([0, 0, 0]), dir: V3.default([0, 0, 1]) }),
  z.object({ id: z.string(), kind: z.literal("segment"), I: z.number(), from: V3, to: V3 }),
  z.object({ id: z.string(), kind: z.literal("loop"), I: z.number(), N: z.number().int().positive().default(1), radius: z.number().positive(), z: z.number().default(0) }),
  z.object({ id: z.string(), kind: z.literal("cylinder"), I: z.number(), a: z.number().min(0).default(0), b: z.number().positive() }),
  z.object({ id: z.string(), kind: z.literal("sheet"), K: z.number(), radius: z.number().positive() }),
]);

export const Currents = defineComponent({
  id: "currents",
  params: z.object({ items: z.array(CurrentItem), probe: V3, mur: z.number().positive().default(1), drawScale: z.number().positive().default(1) }),
  model: (p) => {
    const cs = p.items as Current[];
    const H = magneticFieldH(cs, p.probe);
    const Hmag = norm(H);
    return { Hx: H[0], Hy: H[1], Hz: H[2], Hmag, Hphi: hphiAt(H, p.probe), Bmag: p.mur * MU0 * Hmag, Ienc: enclosedCurrentAt(cs, p.probe) };
  },
  handles: ["probe"],
  readouts: { Hx: "A/m", Hy: "A/m", Hz: "A/m", Hmag: "A/m", Hphi: "A/m", Bmag: "T", Ienc: "A" },
  quotable: { Hx: "A/m", Hy: "A/m", Hz: "A/m", Hmag: "A/m", Hphi: "A/m", Bmag: "T", Ienc: "A" },
});

const MGROUPS = {
  n: ["nx", "ny", "nz"],
  split: ["H1nx", "H1ny", "H1nz", "H1tx", "H1ty", "H1tz"],
  H: ["H1x", "H1y", "H1z", "H2x", "H2y", "H2z"],
  B: ["B1x", "B1y", "B1z", "B2x", "B2y", "B2z"],
  M: ["M1x", "M1y", "M1z", "M2x", "M2y", "M2z"],
  angles: ["th1", "th2"],
  mag: ["H1mag", "H2mag", "B1mag", "B2mag"],
} as const;
type MGroup = keyof typeof MGROUPS;
const munit = (k: string) => (k.startsWith("B") ? "T" : k.startsWith("th") ? "°" : k.startsWith("n") ? "" : "A/m");
const MAG_UNITS = Object.fromEntries(Object.values(MGROUPS).flat().map((k) => [k, munit(k)]));

export const MagBoundary = defineComponent({
  id: "mag-boundary",
  params: z.object({
    given: z.enum(["H", "B"]).default("H"), F1: V3, normal: V3, mur1: z.number().positive(), mur2: z.number().positive(),
    measure: z.enum(["normal", "tangent"]).default("normal"),
    show: z.array(z.enum(Object.keys(MGROUPS) as [MGroup, ...MGroup[]])).default(["split", "H", "angles"]),
    anchor: V3.default([0, 0, 0]),
  }),
  model: (p) => {
    const B1: Vec3 = p.given === "B" ? p.F1 : scale(p.F1, p.mur1 * MU0);
    const r = magneticBoundary({ B1, normal: p.normal, mur1: p.mur1, mur2: p.mur2 });
    const h1n = dot(r.H1, r.n);
    const H1n = scale(r.n, h1n);
    const H1t = sub(r.H1, H1n);
    const from = (t: number) => (p.measure === "normal" ? t : 90 - t);
    const v = (name: string, x: readonly number[]) => ({ [`${name}x`]: x[0]!, [`${name}y`]: x[1]!, [`${name}z`]: x[2]! });
    const all: Record<string, number> = {
      nx: r.n[0], ny: r.n[1], nz: r.n[2],
      ...v("H1n", H1n), ...v("H1t", H1t), ...v("H1", r.H1), ...v("H2", r.H2), ...v("B1", B1), ...v("B2", r.B2), ...v("M1", r.M1), ...v("M2", r.M2),
      th1: from(r.theta1), th2: from(r.theta2), H1mag: norm(r.H1), H2mag: norm(r.H2), B1mag: norm(B1), B2mag: norm(r.B2),
    };
    const out: Record<string, unknown> = { draw: { n: r.n, D1: B1, D2: r.B2, D1n: r.B1n, D1t: r.B1t, split: p.show.includes("split"), sym: "B", mat: "μr" } };
    for (const g of p.show) for (const k of MGROUPS[g]) out[k] = all[k];
    return out;
  },
  handles: [],
  readouts: MAG_UNITS,
  quotable: MAG_UNITS,
});

export const Inductor = defineComponent({
  id: "inductor",
  params: z.object({
    kind: z.enum(["coax", "twowire", "solenoid", "toroid"]),
    mur: z.number().positive().default(1), I: z.number().default(1), internal: z.boolean().default(false),
    a: z.number().positive().optional(), b: z.number().positive().optional(), s: z.number().positive().optional(),
    length: z.number().positive().optional(), N: z.number().positive().optional(), radius: z.number().positive().optional(), h: z.number().positive().optional(),
  }),
  model: (p) => {
    const need = (...k: (keyof typeof p)[]) => { for (const x of k) if (p[x] === undefined) throw new Error(`a ${p.kind} inductor needs ${k.join(", ")}`); };
    let L: number;
    if (p.kind === "coax") { need("a", "b", "length"); if (!(p.b! > p.a!)) throw new Error("a coax needs a < b"); L = indCoax(p.a!, p.b!, p.length!, p.mur, p.internal); }
    else if (p.kind === "twowire") { need("a", "s", "length"); if (!(p.s! > 2 * p.a!)) throw new Error("the wires overlap: s must exceed 2a"); L = indTwoWire(p.a!, p.s!, p.length!, p.mur, p.internal); }
    else if (p.kind === "solenoid") { need("N", "radius", "length"); L = indSolenoid(p.N!, p.radius!, p.length!, p.mur); }
    else { need("N", "a", "b", "h"); if (!(p.b! > p.a!)) throw new Error("a toroid needs a < b"); L = indToroid(p.N!, p.a!, p.b!, p.h!, p.mur); }
    return { L, link: L * p.I, W: 0.5 * L * p.I * p.I };
  },
  handles: [],
  readouts: { L: "H", link: "Wb", W: "J" },
  quotable: { L: "H", link: "Wb", W: "J" },
});

export const EmfLoop = defineComponent({
  id: "emf-loop",
  params: z.object({
    mode: z.enum(["ramp", "transformer", "rod"]),
    N: z.number().positive().default(1), S: z.number().positive().default(0.01),
    /** ramp: dB/dt in T/s. */ rate: z.number().default(0),
    /** transformer: B = B0 sin(2πft). */ B0: z.number().default(0), f: z.number().positive().default(50), t: z.number().default(0),
    /** rod: a bar of length `length` spinning about one end at `rps` revolutions per second in B. */ B: z.number().default(0), length: z.number().positive().default(0.1), rps: z.number().default(0),
    R: z.number().positive().optional(),
  }),
  model: (p) => {
    let emf: number, extra: Record<string, number> = {};
    if (p.mode === "ramp") emf = -p.N * p.rate * p.S;
    else if (p.mode === "transformer") {
      const w = 2 * Math.PI * p.f;
      emf = -p.N * w * p.B0 * p.S * Math.cos(w * p.t);
      extra = { Phi: p.B0 * p.S * Math.sin(w * p.t), emfPeak: p.N * w * p.B0 * p.S, f: p.f };
    } else emf = 0.5 * p.B * (2 * Math.PI * p.rps) * p.length * p.length;
    return { emf, ...extra, ...(p.R ? { I: Math.abs(emf) / p.R } : {}), S: p.S };
  },
  handles: [],
  readouts: { emf: "V", emfPeak: "V", Phi: "Wb", I: "A" },
  quotable: { emf: "V", emfPeak: "V", Phi: "Wb", I: "A", f: "Hz", S: "m^2" },
});

export const PlaneWave = defineComponent({
  id: "plane-wave",
  params: z.object({
    f: z.number().positive(), er: z.number().positive().default(1), mur: z.number().positive().default(1), sigma: z.number().min(0).default(0),
    E0: z.number().positive().default(1), phi: z.number().default(0), z: z.number().default(0), t: z.number().default(0),
    /** Drawing only: plate units per wavelength. */ drawScale: z.number().positive().default(1),
  }),
  model: (p) => {
    const w = planeWave({ f: p.f, er: p.er, mur: p.mur, sigma: p.sigma });
    const ph = w.omega * p.t - w.beta * p.z + (p.phi * Math.PI) / 180;
    const env = Math.exp(-w.alpha * p.z);
    const th = (w.thetaEta * Math.PI) / 180;
    return {
      alpha: w.alpha, beta: w.beta, lambda: w.lambda, u: w.u, eta: w.eta, thetaEta: w.thetaEta, lossTan: w.lossTan,
      ...(w.alpha > 0 ? { delta: 1 / w.alpha } : {}),
      Eamp: p.E0 * env, Ewave: p.E0 * env * Math.cos(ph), Hwave: (p.E0 / w.eta) * env * Math.cos(ph - th),
      Pave: ((p.E0 * p.E0) / (2 * w.eta)) * env * env * Math.cos(th),
      f: p.f,
    };
  },
  handles: [],
  readouts: { alpha: "Np/m", beta: "rad/m", lambda: "m", u: "m/s", eta: "Ω", thetaEta: "°", lossTan: "", delta: "m", Eamp: "V/m", Ewave: "V/m", Hwave: "A/m", Pave: "W/m^2" },
  quotable: { alpha: "Np/m", beta: "rad/m", lambda: "m", u: "m/s", eta: "Ω", thetaEta: "°", lossTan: "", delta: "m", Eamp: "V/m", Ewave: "V/m", Hwave: "A/m", Pave: "W/m^2", f: "Hz" },
});

export const mediaComponents = [Boundary, Capacitor, Currents, MagBoundary, Inductor, EmfLoop, PlaneWave];
