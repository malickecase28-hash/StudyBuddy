import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, fromSvg3, PlateDef, Registry, stateAt, toSvg3 } from "../src";

const reg = new Registry().register(...emComponents);
const frameOf = (instances: unknown[]) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances, steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0));
};

describe("oblique projection", () => {
  it("draws y right, z up, x down-left at half length", () => {
    expect(toSvg3([0, 1, 0])).toEqual([100, -0]);
    expect(toSvg3([0, 0, 1])).toEqual([0, -100]);
    const [sx, sy] = toSvg3([1, 0, 0]);
    expect(sx).toBeCloseTo(-35.3553, 3);
    expect(sy).toBeCloseTo(35.3553, 3);
  });
  it("round-trips a screen point at a fixed x", () => {
    for (const p of [[0.4, -1.2, 0.7], [-1, 2, -0.3], [1.5, 0, 0]] as const) {
      const [sx, sy] = toSvg3(p);
      const q = fromSvg3(sx, sy, p[0]);
      q.forEach((v, i) => expect(v).toBeCloseTo(p[i]!, 10));
    }
  });
});

describe("vector3 and coord-frame", () => {
  it("vector3 reports components and magnitude", () => {
    const f = frameOf([{ id: "a", component: "vector3", params: { from: [0, 0, 0], to: [2, -3, 6], label: "A" }, visible: true }]);
    expect(f.a!.model).toMatchObject({ vx: 2, vy: -3, vz: 6, vmag: 7 });
  });
  it("vector3 in metres keys its readouts by unit (MST R12 = 8, 0, −6 mm)", () => {
    const f = frameOf([{ id: "r", component: "vector3", params: { from: [0.002, 0.002, 0.013], to: [0.01, 0.002, 0.007], label: "R12", unit: "m", drawScale: 150 }, visible: true }]);
    expect(f.r!.model.vmagm as number).toBeCloseTo(0.01, 12);
    expect("vmag" in f.r!.model).toBe(false);
  });
  it("coord-frame shows only its system's coordinates", () => {
    const cyl = frameOf([{ id: "c", component: "coord-frame", params: { point: [1, 3, 5], system: "cyl" }, visible: true }]).c!.model;
    expect(cyl.pRho as number).toBeCloseTo(3.16228, 5);
    expect(cyl.pPhi as number).toBeCloseTo(71.56505, 4);
    expect(cyl.pz).toBe(5);
    expect("pR" in cyl || "px" in cyl).toBe(false);
    const sph = frameOf([{ id: "c", component: "coord-frame", params: { point: [1, 3, 5], system: "sph" }, visible: true }]).c!.model;
    expect(sph.pR as number).toBeCloseTo(5.91608, 5);
    expect(sph.pTheta as number).toBeCloseTo(32.31153, 4);
  });
});
