import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const frameOf = (patch: Record<string, unknown>, field: Record<string, unknown> = {}) => {
  const p = PlateDef.parse({
    id: "t", title: "t",
    instances: [
      { id: "field", component: "uniform-field", params: field, visible: true },
      { id: "patch", component: "flat-patch", params: patch, links: { field: "field" }, visible: true },
    ],
    steps: [{ id: "s1", title: "t", note: "n" }],
  });
  return createEvaluator(reg, p.instances)(stateAt(p, 0));
};

describe("flat-patch in a uniform field", () => {
  it("square-on: dΨ = |D| A", () => {
    const m = frameOf({ size: 1, normalAngle: 0 }, { Dx: 3 }).patch!.model;
    expect(m.dPsi).toBeCloseTo(3, 12);
    expect(m.area).toBe(1);
    expect(m.theta).toBeCloseTo(0, 9);
  });
  it("tilted 60°: dΨ = |D| A cos θ and the shadow is A cos θ", () => {
    const m = frameOf({ size: 1, normalAngle: 60 }, { Dx: 3 }).patch!.model;
    expect(m.dPsi).toBeCloseTo(1.5, 12);
    expect(m.shadow).toBeCloseTo(0.5, 12);
    expect(m.theta).toBeCloseTo(60, 9);
  });
  it("against the normal the flux is negative", () => {
    expect(frameOf({ size: 1, normalAngle: 150 }, { Dx: 3 }).patch!.model.dPsi as number).toBeCloseTo(-3 * Math.sqrt(3) / 2, 12);
  });
  it("vector D and a rectangular patch: dΨ = (D·n̂) a b", () => {
    const m = frameOf({ size: 3, depth: 0.5, normalAngle: 90 }, { Dx: 4, Dz: 3 }).patch!.model;
    expect(m.Dn).toBeCloseTo(3, 12);
    expect(m.area).toBeCloseTo(1.5, 12);
    expect(m.dPsi).toBeCloseTo(4.5, 12);
  });
  it("uniform-field magnitude and direction", () => {
    const f = frameOf({}, { Dx: 2, Dz: 2 }).field!.model;
    expect(f.magnitude).toBeCloseTo(2 * Math.SQRT2, 12);
    expect(f.directionDeg).toBeCloseTo(45, 12);
  });
});

describe("patch-tiling", () => {
  it("the patch sum converges to the enclosed charge", () => {
    const p = PlateDef.parse({
      id: "t", title: "t",
      instances: [
        { id: "q", component: "charges", params: { items: [{ id: "a", kind: "point", q: 2, pos: [0.3, 0, 0.2] }] }, visible: true },
        { id: "tiles", component: "patch-tiling", params: { n: 24 }, links: { charges: "q" }, visible: true },
      ],
      steps: [{ id: "s1", title: "t", note: "n" }],
    });
    const m = createEvaluator(reg, p.instances)(stateAt(p, 0)).tiles!.model;
    expect(m.sum as number).toBeCloseTo(2, 4);
    expect(m.count).toBe(24 * 48);
    expect((m.segments as unknown[]).length).toBeGreaterThanOrEqual(8);
  });
});
