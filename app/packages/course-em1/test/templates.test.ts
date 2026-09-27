import { checkNumeric, instantiate, toSI } from "@forma/engine";
import { EPS0, dot, fluxThrough, norm, scale, surfacePatches, vec, type Vec3 } from "@forma/physics";
import { describe, expect, it } from "vitest";
import { templates } from "../src";

const byId = Object.fromEntries(templates.map((t) => [t.id, t]));
/** Flux of a radial field D(r) = a·r² (nC/m²) through a sphere, integrated numerically. */
const radialFlux = (a: number, R: number) =>
  surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: R }, 24).reduce((s, p) => {
    const r = norm(p.center);
    return s + dot(scale(p.center, (a * 1e-9 * r * r) / r), p.dS);
  }, 0);

const truth: Record<string, (p: Record<string, number>) => number> = {
  "coulomb-mag": (p) => (1 / (4 * Math.PI * EPS0)) * p.q1! * 1e-6 * p.q2! * 1e-6 / (p.d! / 100) ** 2,
  "e-point": (p) => (1 / (4 * Math.PI * EPS0)) * p.q! * 1e-9 / (p.r! / 100) ** 2,
  "e-line": (p) => (p.rl! * 1e-9) / (2 * Math.PI * EPS0 * (p.rho! / 100)),
  "grad-comp": (p) => 3 * p.a! * p.y! + 6 * p.b!,
  "grad-cyl-phi": (p) => p.c! * Math.cos([0, 60, 120, 180][p.k!]! * Math.PI / 180),
  "div-cart": (p) => p.p! * p.y0! + 2 * p.q! * p.y0! - p.s! * p.x0!,
  "curl-z": (p) => p.b! * p.y0! - p.a! * p.z0!,
  "em-wavelength": (p) => 299_792_458 / (p.f! * 1e6),
  "unit-si-length": (p) => p.v! * [1e-3, 1e-6, 1e-2, 0.0254][p.k!]!,
  "vec-sum-mag": (p) => Math.hypot(p.a! + 5, p.b!, 3 - p.c!),
  "vec-distance-mm": (p) => Math.hypot(p.dx!, p.dz!) / 1000,
  "vec-angle": (p) => Math.acos((p.b! - 6 * p.a!) / (Math.hypot(1, p.a!) * Math.hypot(p.b!, 2, 6))) * 180 / Math.PI,
  "coord-phi": (p) => {
    const signs = [[1, 1], [-1, 1], [-1, -1], [1, -1]][p.quad!]!;
    return (Math.atan2(signs[1]! * p.qy!, signs[0]! * p.qx!) * 180 / Math.PI + 360) % 360;
  },
  "sph-patch-area": (p) => {
    const theta = [30, 45, 60, 90][p.t!]! * Math.PI / 180;
    return (p.rc! / 100) ** 2 * (1 - Math.cos(theta)) * (p.dp! * Math.PI / 180);
  },
  "q06-octant": (p) =>
    fluxThrough(
      [{ kind: "point", q: p.Q! * 1e-6, pos: vec(0, 0, 0) }],
      surfacePatches({ kind: "sphere", center: vec(0, 0, 0), radius: 0.26 }, 32).filter((pt) => pt.center[0] > 0 && pt.center[1] > 0 && pt.center[2] > 0),
    ),
  "q08-e": (p) => (p.a! * 1e-9 * p.r! * p.r!) / EPS0,
  "q08-q": (p) => radialFlux(p.a!, p.r!),
  "q09a-cube": (p) =>
    fluxThrough(
      [
        { kind: "point", q: p.q1! * 1e-6, pos: vec(1, -2, 3) },
        { kind: "point", q: p.q2! * 1e-6, pos: vec(-1, 2, -2) },
      ],
      surfacePatches({ kind: "cube", center: vec(0, 0, 0), side: 10 }, 48),
    ),
  "f2425-qt": (p) => radialFlux(p.a!, p.R!),
  "flux-flat-patch": (p) => dot(vec(p.D! * 1e-6, 0, 0), vec(Math.cos((p.theta! * Math.PI) / 180), 0, Math.sin((p.theta! * Math.PI) / 180))) * p.a! * p.b!,
  "charge-line-poly": (p) => (p.a! * (p.x2! ** 3 - p.x1! ** 3) / 3) * 1e-3,
  "flux-patch": (p) => p.q! * 1e-6 * ((1 - Math.cos([30, 45, 60, 90][p.t!]! * Math.PI / 180)) * (p.dp! * Math.PI / 180)) / (4 * Math.PI),
  "ball-d": (p) => (p.rv! * (p.r! / 10 < p.a! / 10 ? p.r! / 10 : (p.a! / 10) ** 3 / (p.r! / 10) ** 2) / 3) * 1e-6,
  "rhov-from-d": (p) => p.a! * p.y0!,
  "v-point": (p) => (1 / (4 * Math.PI * EPS0)) * p.q! * 1e-9 / (p.r! / 100),
  "work-move": (p) => p.q! * 1e-6 * (1 / (4 * Math.PI * EPS0)) * p.Q! * 1e-6 * (1 - 1 / p.ra!),
  "current-density": (p) => p.I! / (Math.PI * (p.r! / 1000) ** 2),
  "ohm-wire": (p) => p.L! / (5.8e7 * Math.PI * (p.d! / 2000) ** 2),
  "continuity-rate": (p) => -2 * p.a! * p.x0!,
};

describe("question templates", () => {
  it("defines exactly the expected templates", () => {
    expect(templates.map((t) => t.id).sort()).toEqual(Object.keys(truth).sort());
  });
  for (const id of Object.keys(truth)) {
    it(`${id}: answers match independent physics for seeds 1-50`, () => {
      for (let seed = 1; seed <= 50; seed++) {
        const v = instantiate(byId[id]!, seed);
        const authored = toSI(v.spec.answer.value, v.spec.answer.unit).value;
        const real = truth[id]!(v.params);
        expect(Math.abs(authored - real), `${v.key}`).toBeLessThan(0.005 * Math.max(Math.abs(real), 1));
        expect(checkNumeric(v.spec, `${v.spec.answer.value} ${v.spec.answer.unit}`).correct).toBe(true);
      }
    });
    it(`${id}: no distractor coincides with the answer (seeds 1-200)`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const v = instantiate(byId[id]!, seed);
        const a = toSI(v.spec.answer.value, v.spec.answer.unit).value;
        for (const d of v.spec.distractors) {
          const dv = toSI(d.value, d.unit).value;
          expect(Math.abs(dv - a) > v.spec.relTol * Math.abs(a), `${v.key} distractor ${d.value}`).toBe(true);
        }
      }
    });
  }
});
