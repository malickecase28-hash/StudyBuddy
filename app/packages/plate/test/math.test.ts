import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const model = (component: string, params: Record<string, unknown>) => {
  const p = PlateDef.parse({ id: "t", title: "t", instances: [{ id: "a", component, params, visible: true }], steps: [{ id: "s", title: "t", note: "n" }] });
  return createEvaluator(reg, p.instances)(stateAt(p, 0)).a!.model as Record<string, number | string | null>;
};

describe("scalar-slice", () => {
  it("reports the value and native gradient at the probe", () => {
    const m = model("scalar-slice", { field: "tut-3.4", probe: [1, 2, 3] });
    expect(m).toMatchObject({ system: "cart", f: 11, g1: 5, g2: 4, g3: 3 });
    expect(m.gmag as number).toBeCloseTo(Math.sqrt(50), 12);
  });
  it("uses native components for a spherical field (HW02 2.1(c) at R(1, π/6, π/2))", () => {
    const m = model("scalar-slice", { field: "hw-2.1c", probe: [0, 0.5, Math.sqrt(3) / 2] });
    expect(m.g1 as number).toBeCloseTo(0, 10);
    expect(m.g2 as number).toBeCloseTo(0, 10);
    expect(m.g3 as number).toBeCloseTo(-4, 10);
  });
  it("is null at a singular point, not NaN", () => {
    expect(model("scalar-slice", { field: "hw-2.1c", probe: [0, 0, 0] }).g1).toBeNull();
  });
});

describe("vector-slice", () => {
  it("a shrinking box gives the divergence: exact for linear fields", () => {
    expect(model("vector-slice", { field: "source", probe: [0.5, 0, 0.2], box: 0.4 }).boxRatio as number).toBeCloseTo(3, 10);
    expect(model("vector-slice", { field: "tut-3.6a", probe: [1, -2, 3], box: 0.2 }).boxRatio as number).toBeCloseTo(4, 10);
  });
  it("a counter-clockwise loop in the x–y plane gives curl_z; in the x–z plane it measures about −y", () => {
    const xy = model("vector-slice", { field: "swirl", plane: "xy", probe: [0.3, 0.1, 0], loop: 0.3 });
    expect(xy.circRatio as number).toBeCloseTo(2, 10);
    expect(xy.loopAxis).toBe("+z");
    const xz = model("vector-slice", { field: "tut-3.6a", plane: "xz", probe: [1, -2, 3], loop: 0.2 });
    expect(xz.circRatio as number).toBeCloseTo(2, 8); // curl·(−ay) = −y = 2 at y = −2
    expect(xz.loopAxis).toBe("−y");
  });
  it("omits the box and loop readouts when their size is 0", () => {
    const m = model("vector-slice", { field: "uniform", probe: [0, 0, 0] });
    expect("boxRatio" in m || "circRatio" in m).toBe(false);
    expect(m).toMatchObject({ F1: 1, F2: 0, F3: 0, div: 0 });
  });
});
