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
        expect(Math.abs(authored - real) / Math.abs(real), `${v.key}`).toBeLessThan(0.005);
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
