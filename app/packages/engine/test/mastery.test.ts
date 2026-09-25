import { describe, expect, it } from "vitest";
import { applyEvidence, deriveState, overallMastery, zeroDimensions } from "../src";

describe("mastery", () => {
  it("correct evidence moves toward 1, incorrect toward 0, bounded", () => {
    let d = zeroDimensions();
    d = applyEvidence(d, ["conceptual"], true);
    expect(d.conceptual).toBeCloseTo(0.35, 10);
    d = applyEvidence(d, ["conceptual"], true);
    expect(d.conceptual).toBeCloseTo(0.5775, 10);
    d = applyEvidence(d, ["conceptual"], false);
    expect(d.conceptual).toBeLessThan(0.5775);
    expect(d.computational).toBe(0);
    for (let i = 0; i < 50; i++) d = applyEvidence(d, ["conceptual"], true);
    expect(d.conceptual).toBeLessThanOrEqual(1);
  });
  it("derives concept state from dimensions", () => {
    const z = zeroDimensions();
    expect(deriveState(z, false)).toBe("NOT_STARTED");
    expect(deriveState(z, true)).toBe("INTRODUCED");
    expect(deriveState({ ...z, conceptual: 0.4 }, true)).toBe("EXPLORED");
    expect(deriveState({ ...z, conceptual: 0.4, computational: 0.6 }, true)).toBe("PRACTICED");
    expect(deriveState({ ...z, conceptual: 0.75, computational: 0.6, independent: 0.65 }, true)).toBe("DEMONSTRATED");
    const all = { conceptual: 0.9, computational: 0.85, recognition: 0.8, independent: 0.8, application: 0.95 };
    expect(deriveState(all, true)).toBe("MASTERED");
    expect(overallMastery(all)).toBeCloseTo(0.86, 10);
  });
});
