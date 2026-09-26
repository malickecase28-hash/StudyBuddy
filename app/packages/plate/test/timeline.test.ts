import { describe, expect, it } from "vitest";
import { applyCues, ease, frameAt, PlateDef, stateAt } from "../src";

const plate = PlateDef.parse({
  id: "demo",
  title: "Demo",
  instances: [
    { id: "q", component: "charges", params: { items: [{ id: "q1", q: 2, pos: [0, 0, 0] }] } },
    { id: "s", component: "gaussian-surface", params: { shape: "sphere", size: 1 }, links: { charges: "q" } },
  ],
  steps: [
    { id: "s1", title: "Charge", show: ["q"], focus: ["q"], note: "A charge." },
    { id: "s2", title: "Surface", show: ["s"], focus: ["s"], note: "Wrap it." },
    { id: "s3", title: "Grow", patch: { s: { size: 3 } }, focus: ["s"], note: "Grow it." },
  ],
});

describe("frameAt", () => {
  it("whole positions equal step states", () => {
    expect(frameAt(plate, 2).state).toEqual(stateAt(plate, 2));
    expect(frameAt(plate, 0).appear.q).toBe(1);
  });
  it("tweens numeric params through the tween window", () => {
    expect(frameAt(plate, 1.1).state.s!.params.size).toBe(1);
    const mid = frameAt(plate, 1.5).state.s!.params.size as number;
    expect(mid).toBeCloseTo(1 + 2 * ease(0.5), 10);
    expect(frameAt(plate, 1.85).state.s!.params.size).toBe(3);
  });
  it("draws entering instances on and switches focus late", () => {
    const f = frameAt(plate, 0.7);
    expect(f.state.s!.visible).toBe(true);
    expect(f.appear.s).toBeGreaterThan(0);
    expect(f.appear.s).toBeLessThan(1);
    expect(f.focus).toEqual(["q"]);
    expect(frameAt(plate, 0.95).focus).toEqual(["s"]);
  });
  it("clamps out-of-range and NaN positions", () => {
    expect(frameAt(plate, -3).stepIndex).toBe(0);
    expect(frameAt(plate, 99).state).toEqual(stateAt(plate, 2));
    expect(frameAt(plate, Number.NaN).stepIndex).toBe(0);
  });
  it("snaps under reduced motion", () => {
    expect(frameAt(plate, 1.3, { reducedMotion: true }).state.s!.params.size).toBe(3);
  });
});

describe("applyCues", () => {
  it("applies show, highlight window, tween and camera by time", () => {
    const base = stateAt(plate, 0);
    const cues = [
      { t: 0, action: "show" as const, target: "s", params: {} },
      { t: 100, action: "highlight" as const, target: "q", params: { durationMs: 500 } },
      { t: 200, action: "tween" as const, target: "s", params: { param: "size", to: 2, durationMs: 400 } },
      { t: 300, action: "camera" as const, target: "view", params: { yaw: 30 } },
    ];
    const early = applyCues(base, cues, 150);
    expect(early.state.s!.visible).toBe(true);
    expect(early.highlight).toEqual(["q"]);
    const late = applyCues(base, cues, 1000);
    expect(late.highlight).toEqual([]);
    expect(late.state.s!.params.size).toBe(2);
    expect(late.camera).toEqual({ yaw: 30 });
  });
});
