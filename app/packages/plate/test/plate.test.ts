import { describe, expect, it } from "vitest";
import { diffStates, isEmptyDiff, PlateDef, stateAt } from "../src";

const plate = PlateDef.parse({
  id: "demo",
  title: "Demo",
  instances: [
    { id: "q", component: "charges", params: { items: [{ id: "q1", q: 2, pos: [0, 0, 0] }] } },
    { id: "s", component: "gaussian-surface", params: { shape: "sphere", size: 1 }, links: { charges: "q" } },
  ],
  steps: [
    { id: "s1", title: "Charge", show: ["q"], note: "A charge." },
    { id: "s2", title: "Surface", show: ["s"], note: "Wrap it." },
    { id: "s3", title: "Grow", patch: { s: { size: 2, shape: "cube" } }, note: "Grow it." },
  ],
});

describe("plate state", () => {
  it("accumulates steps", () => {
    expect(stateAt(plate, 0).s!.visible).toBe(false);
    expect(stateAt(plate, 1).s!.visible).toBe(true);
    expect(stateAt(plate, 2).s!.params).toMatchObject({ size: 2, shape: "cube" });
    expect(stateAt(plate, 1).s!.params.size).toBe(1);
  });
  it("diffs enters, tweens and sets", () => {
    const d1 = diffStates(stateAt(plate, 0), stateAt(plate, 1));
    expect(d1.enters).toEqual(["s"]);
    const d2 = diffStates(stateAt(plate, 1), stateAt(plate, 2));
    expect(d2.tweens).toEqual([{ id: "s", param: "size", from: 1, to: 2 }]);
    expect(d2.sets).toEqual([{ id: "s", param: "shape", to: "cube" }]);
    expect(isEmptyDiff(diffStates(stateAt(plate, 2), stateAt(plate, 2)))).toBe(true);
  });
  it("rejects a step that names an unknown instance", () => {
    const bad = PlateDef.parse({ ...plate, steps: [{ id: "x", title: "X", show: ["ghost"], note: "n" }] });
    expect(() => stateAt(bad, 0)).toThrow(/Unknown instance "ghost" in step "x"/);
  });
});
