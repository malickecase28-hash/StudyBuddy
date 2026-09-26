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

describe("coord-region", () => {
  it("MST Q3(a): the spherical patch r = 25 cm, 0 < θ < 60°, 30° < φ < 45°", () => {
    const m = model("coord-region", { system: "sph", ranges: [[0, 0.25], [0, 60], [30, 45]], face: 0 });
    expect(m.area as number).toBeCloseTo(0.00818123, 8);
  });
  it("HW02 2.5(b): the cylinder side ρ = 4 m, 0 < z < 7 m", () => {
    const m = model("coord-region", { system: "cyl", ranges: [[0, 4], [0, 360], [0, 7]], face: 0 });
    expect(m.area as number).toBeCloseTo(175.929, 3);
  });
  it("volumes in all three systems", () => {
    expect(model("coord-region", { system: "cart", ranges: [[0, 2], [0, 2], [0, 2]] }).volume).toBe(8);
    expect(model("coord-region", { system: "cyl", ranges: [[0, 0.2], [0, 180], [-4, -2]] }).volume as number).toBeCloseTo(0.04 * Math.PI * 2 / 2, 12);
    expect(model("coord-region", { system: "sph", ranges: [[0, 5.25], [0, 180], [0, 360]] }).volume as number).toBeCloseTo(606.131, 3);
  });
  it("edge lengths of a small spherical element carry the scale factors", () => {
    const m = model("coord-region", { system: "sph", ranges: [[2, 2.1], [30, 31], [0, 1]] });
    const d = Math.PI / 180;
    expect(m.len1 as number).toBeCloseTo(0.1, 12);
    expect(m.len2 as number).toBeCloseTo(2 * d, 12);
    expect(m.len3 as number).toBeCloseTo(2 * Math.sin(30 * d) * d, 12);
  });
});

describe("spectrum and unit-convert", () => {
  it("Wi-Fi at 2.45 GHz is a 12.2 cm microwave", () => {
    const m = model("spectrum", { f: 2.45e9 });
    expect(m.band).toBe("Microwave");
    expect(m.lambda as number).toBeCloseTo(0.12236, 5);
  });
  it("green light at 5.45e14 Hz is visible, 550 nm", () => {
    const m = model("spectrum", { f: 5.45e14 });
    expect(m.band).toBe("Visible");
    expect(m.lambda as number).toBeCloseTo(5.5008e-7, 10);
  });
  it("converts the coax core 0.28 inch and the sphere diameter 12.8 cm to metres", () => {
    expect(model("unit-convert", { value: 0.28, unit: "in" })).toMatchObject({ dim: "m", ok: true });
    expect(model("unit-convert", { value: 0.28, unit: "in" }).siM as number).toBeCloseTo(0.007112, 12);
    expect(model("unit-convert", { value: 12.8, unit: "cm" }).siM as number).toBeCloseTo(0.128, 12);
    expect(model("unit-convert", { value: 200, unit: "mC" }).siC as number).toBeCloseTo(0.2, 12);
    expect(model("unit-convert", { value: 5, unit: "cm^2" }).siM2 as number).toBeCloseTo(5e-4, 15);
  });
  it("flags a unit it cannot read instead of throwing", () => {
    expect(model("unit-convert", { value: 3, unit: "furlong" })).toMatchObject({ ok: false });
  });
});
