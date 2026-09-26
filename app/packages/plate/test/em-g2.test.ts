import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const one = (component: string, params: Record<string, unknown>, extra: unknown[] = []) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances: [...extra, { id: "a", component, params, visible: true, ...(component === "e-probe" ? { links: { charges: "q" } } : {}) }], steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0)).a!.model as Record<string, number>;
};

describe("coord-region density and central charge", () => {
  it("reports Q in coulombs for HW02 2.5(c)", () => {
    expect(one("coord-region", { system: "sph", ranges: [[0, 5.25], [0, 180], [0, 360]], density: "hw-2.5c" }).Q).toBeCloseTo(829.6945, 3);
  });
  it("MST Q3(a): the flux through the patch from a central 100 µC is 1.0417 µC, at any radius", () => {
    expect(one("coord-region", { system: "sph", ranges: [[0, 0.25], [0, 60], [30, 45]], face: 0, centralCharge: 100 }).patchFlux).toBeCloseTo(1.041667, 5);
    expect(one("coord-region", { system: "sph", ranges: [[0, 3], [0, 60], [30, 45]], face: 0, centralCharge: 100 }).patchFlux).toBeCloseTo(1.041667, 5);
  });
  it("one face of a cube centred on the charge carries Q/6", () => {
    expect(one("coord-region", { system: "cart", ranges: [[-1, 1], [-1, 1], [-1, 1]], face: 2, centralCharge: 12 }).patchFlux).toBeCloseTo(2, 6);
  });
});

describe("ball and D readouts", () => {
  it("e-probe reports D in µC/m² inside a uniform ball", () => {
    const m = one("e-probe", { point: [0.5, 0, 0] }, [{ id: "q", component: "charges", params: { items: [{ id: "b", kind: "ball", rhoV: 3, radius: 1, center: [0, 0, 0] }] }, visible: true }]);
    expect(m.Dmag).toBeCloseTo(0.5, 10);
  });
});
