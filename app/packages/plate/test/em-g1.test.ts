import { describe, expect, it } from "vitest";
import { createEvaluator, emComponents, PlateDef, Registry, stateAt } from "../src";

const reg = new Registry().register(...emComponents);
const frame = (items: unknown[], extra: unknown[]) => {
  const p = PlateDef.parse({
    id: "t", title: "t",
    instances: [{ id: "q", component: "charges", params: { items }, visible: true }, ...extra],
    steps: [{ id: "s", title: "t", note: "n" }],
  });
  return createEvaluator(reg, p.instances)(stateAt(p, 0));
};
const pt = (id: string, q: number, pos: number[]) => ({ id, kind: "point", q, pos });

describe("coulomb-force", () => {
  it("lecture 2b Example 1: F12 on Q2 = −9.986, 19.97, −19.97 N, R = 3 m", () => {
    const f = frame([pt("a", 300, [1, 2, 3]), pt("b", -100, [2, 0, 5])], [{ id: "f", component: "coulomb-force", params: { on: "b" }, links: { charges: "q" }, visible: true }]);
    const m = f.f!.model as Record<string, number>;
    expect(m.Fx).toBeCloseTo(-9.98617, 4);
    expect(m.Fy).toBeCloseTo(19.9723, 3);
    expect(m.Fz).toBeCloseTo(-19.9723, 3);
    expect(m.R).toBeCloseTo(3, 12);
  });
  it("Newton's third law: the force on a is minus the force on b", () => {
    const items = [pt("a", 2, [-0.8, 0, 0]), pt("b", -1, [0.8, 0, 0])];
    const on = (id: string) => frame(items, [{ id: "f", component: "coulomb-force", params: { on: id }, links: { charges: "q" }, visible: true }]).f!.model.Fx as number;
    expect(on("a")).toBeCloseTo(-on("b"), 15);
    expect(on("b")).toBeCloseTo(-0.00702152, 7);
  });
  it("omits R with three charges", () => {
    const m = frame([pt("a", 2, [0, 0, 0]), pt("b", -1, [1, 0, 0]), pt("c", 1, [0, 0, 1])], [{ id: "f", component: "coulomb-force", params: { on: "c" }, links: { charges: "q" }, visible: true }]).f!.model;
    expect("R" in m).toBe(false);
    expect(m.Fx as number).toBeCloseTo(0.00317758, 7);
    expect(m.Fz as number).toBeCloseTo(0.0147975, 6);
  });
});

describe("e-probe", () => {
  it("HW02 2.4(b): 2.45 nm from −6.76 µC, |E| = 1.012e22 V/m, pointing at the charge", () => {
    const m = frame([pt("a", -6.76, [0, 0, 0])], [{ id: "e", component: "e-probe", params: { point: [2.45e-9, 0, 0] }, links: { charges: "q" }, visible: true }]).e!.model as Record<string, number>;
    expect(m.Emag).toBeCloseTo(1.01218e22, -17);
    expect(m.Ex).toBeLessThan(0);
  });
  it("MST Q2(b): E at P(1, 2, 5) µm", () => {
    const u = 1e-6;
    const m = frame([pt("a", 0.5, [4 * u, -3 * u, 7 * u]), pt("b", -0.3, [2 * u, -3 * u, 1 * u])], [{ id: "e", component: "e-probe", params: { point: [u, 2 * u, 5 * u] }, links: { charges: "q" }, visible: true }]).e!.model as Record<string, number>;
    expect(m.Ex! / 1e12).toBeCloseTo(-47.646, 3);
    expect(m.Ey! / 1e12).toBeCloseTo(46.390, 3);
    expect(m.Ez! / 1e12).toBeCloseTo(-77.991, 3);
  });
  it("is null on a charge", () => {
    expect(frame([pt("a", 1, [0, 0, 0])], [{ id: "e", component: "e-probe", params: { point: [0, 0, 0] }, links: { charges: "q" }, visible: true }]).e!.model.Emag).toBeNull();
  });
});
