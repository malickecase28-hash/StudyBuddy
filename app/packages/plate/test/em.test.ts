import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const registry = new Registry().register(...emComponents);
const plate = (surface: Record<string, unknown>, items: unknown[]) =>
  PlateDef.parse({
    id: "t",
    title: "t",
    instances: [
      { id: "q", component: "charges", params: { items }, visible: true },
      { id: "f", component: "field-arrows", params: {}, links: { charges: "q" }, visible: true },
      { id: "s", component: "gaussian-surface", params: surface, links: { charges: "q" }, visible: true },
      { id: "far", component: "faraday-spheres", params: { material: "Glass" }, visible: true },
    ],
    steps: [{ id: "s1", title: "t", note: "n" }],
  });
const frame = (p: PlateDef) => createEvaluator(registry, p.instances)(stateAt(p, 0));

describe("em components", () => {
  it("gaussian-surface flux equals enclosed charge (µC) for any shape", () => {
    for (const shape of ["sphere", "cube", "blob", "cylinder"]) {
      const f = frame(plate({ shape, size: 1.2, height: 2 }, [{ id: "a", kind: "point", q: 2, pos: [0.2, 0.1, 0] }]));
      expect(f.s!.model.flux as number).toBeCloseTo(2, 4);
      expect(f.s!.model.enclosed).toBeCloseTo(2, 12);
    }
  });
  it("field-arrows probe gives D = q/(4 pi r^2) in µC/m^2 and E = D/(eps0 epsR)", () => {
    const f = frame(plate({}, [{ id: "a", kind: "point", q: 2, pos: [0, 0, 0] }]));
    expect(f.f!.model.probeD as number).toBeCloseTo(2 / (4 * Math.PI), 9);
    expect((f.f!.model.probeE as number) / ((2e-6 / (4 * Math.PI)) / 8.8541878128e-12)).toBeCloseTo(1, 9);
    expect((f.f!.model.samples as unknown[]).length).toBeGreaterThan(10);
  });
  it("a charge sitting on the surface keeps finite readouts (half counted)", () => {
    const f = frame(plate({ shape: "sphere", size: 1 }, [{ id: "a", kind: "point", q: 2, pos: [1, 0, 0] }]));
    expect(f.s!.model.onSurface).toBe(true);
    expect(f.s!.model.flux).toBeCloseTo(1, 12);
    expect(Number.isFinite(f.s!.model.flux as number)).toBe(true);
  });
  it("a line charge piercing the surface gives the exact flux rhoL x chord (no singular quadrature)", () => {
    const f = frame(plate({ shape: "sphere", size: 1 }, [{ id: "l", kind: "line", rhoL: 1000, x: 0.3, y: 0 }]));
    expect(f.s!.model.flux as number).toBeCloseTo(1000e-3 * 2 * Math.sqrt(0.91), 12);
    expect(f.s!.model.onSurface).toBe(false);
  });
  it("never flags interior or exterior charges as on the surface", () => {
    for (const x of [0.97, 1.03]) {
      const f = frame(plate({ shape: "cube", size: 2 }, [{ id: "a", kind: "point", q: 2, pos: [x, 0.4, -0.3] }]));
      expect(f.s!.model.onSurface).toBe(false);
    }
  });
  it("faraday outer charge ignores the material; E does not", () => {
    const f = frame(plate({}, [{ id: "a", kind: "point", q: 1, pos: [0, 0, 0] }]));
    expect(f.far!.model.outerQ).toBe(2);
    expect(f.far!.model.epsR).toBeGreaterThan(1);
  });
  it("faraday-spheres reports D halfway and exposes its given quantities", () => {
    const f = frame(plate({}, [{ id: "a", kind: "point", q: 1, pos: [0, 0, 0] }]));
    expect(f.far!.model.dMid as number).toBeCloseTo(2 / (4 * Math.PI * 0.25), 12);
    expect(f.far!.model.rMid).toBe(0.5);
    expect(f.far!.model.innerQ).toBe(2);
  });
});
