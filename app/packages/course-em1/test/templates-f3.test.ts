import { instantiate } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { checks, templates } from "../src";

const IDS = ["em-wavelength", "unit-si-length", "vec-sum-mag", "vec-distance-mm", "vec-angle", "coord-phi", "sph-patch-area"];

describe("F3 templates", () => {
  for (const id of IDS) {
    it(`${id}: 50 seeds give finite answers, worked lines, and no distractor equal to the answer`, () => {
      const t = templates.find((x) => x.id === id);
      expect(t, id).toBeDefined();
      for (let seed = 1; seed <= 50; seed++) {
        const v = instantiate(t!, seed);
        expect(Number.isFinite(v.spec.answer.value), `${id}#${seed}`).toBe(true);
        expect(v.worked.length).toBeGreaterThan(0);
        for (const d of v.spec.distractors) expect(Math.abs(d.value - v.spec.answer.value) > 1e-9 * Math.max(1, Math.abs(v.spec.answer.value)), `${id}#${seed}`).toBe(true);
      }
    });
  }
  it("vec-angle reproduces Tutorial 1.4 when a = 3, b = 5", () => {
    const t = templates.find((x) => x.id === "vec-angle")!;
    expect(t.solve({ a: 3, b: 5 } as never).answer.value).toBeCloseTo(120.66, 2);
  });
  it("coord-phi puts (−2, 2) at 135°, not −45°", () => {
    const t = templates.find((x) => x.id === "coord-phi")!;
    expect(t.solve({ qx: 2, qy: 2, quad: 1 } as never).answer.value).toBeCloseTo(135, 6);
  });
  it("sph-patch-area reproduces MST Q3(a)'s patch at r = 25 cm, θ to 60°, a 15° wedge", () => {
    const t = templates.find((x) => x.id === "sph-patch-area")!;
    expect(t.solve({ rc: 25, t: 2, dp: 15 } as never).answer.value).toBeCloseTo(0.008181, 6);
  });
  it("phi-second-quadrant fires only for 90° < φ < 180°", () => {
    const at = (pPhi: number) => ({ cf: { params: {}, model: { pPhi }, visible: true } }) as never;
    expect(checks["phi-second-quadrant"]!(at(135), at(243))).toBe(true);
    expect(checks["phi-second-quadrant"]!(at(243), at(243))).toBe(false);
    expect(checks["phi-second-quadrant"]!(at(60), at(243))).toBe(false);
  });
});
