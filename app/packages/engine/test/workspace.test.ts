import { describe, expect, it } from "vitest";
import { evaluateNumeric, initialState, seedOf, withLayout, withNextSeed } from "../src";

describe("workspace state", () => {
  it("seeds start at 1 and advance per template", () => {
    const s = initialState();
    expect(seedOf(s, "q06-octant")).toBe(1);
    const t = withNextSeed(withNextSeed(s, "q06-octant"), "q06-octant");
    expect(seedOf(t, "q06-octant")).toBe(3);
    expect(seedOf(t, "q08-e")).toBe(1);
  });
  it("layouts update one mode, remember it as last, and clamp the split", () => {
    const s = withLayout(initialState(), "solve", { split: 0.05, pinned: ["paper", "formulas"] });
    expect(s.workspace.lastMode).toBe("solve");
    expect(s.workspace.layouts.solve).toEqual({ split: 0.2, pinned: ["paper", "formulas"] });
    expect(s.workspace.layouts.learn).toEqual(initialState().workspace.layouts.learn);
    expect(withLayout(s, "learn", { split: 3 }).workspace.layouts.learn.split).toBe(1);
  });
});

describe("evaluateNumeric", () => {
  it("evaluates LaTeX arithmetic, with ε₀ as its SI value", () => {
    expect(evaluateNumeric("2^{10}")).toBe(1024);
    expect(evaluateNumeric("\\frac{1}{4\\pi\\varepsilon_0}")! / 8.98755179e9).toBeCloseTo(1, 8);
    expect(evaluateNumeric("\\frac{")).toBeNull();
    expect(evaluateNumeric("x+1")).toBeNull();
  });
});
