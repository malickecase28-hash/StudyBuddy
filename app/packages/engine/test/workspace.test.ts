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
    expect(s.workspace.layouts.solve).toEqual({ split: 0.2, pinned: ["paper", "formulas"], toolWidth: 0.5 });
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
import { defaultWorkspace, migrate } from "../src";

describe("tool width", () => {
  it("defaults to 45%, 50% in Solve, and clamps to [0.2, 0.8]", () => {
    expect(defaultWorkspace().layouts.learn.toolWidth).toBe(0.45);
    expect(defaultWorkspace().layouts.solve.toolWidth).toBe(0.5);
    expect(withLayout(initialState(), "learn", { toolWidth: 0.95 }).workspace.layouts.learn.toolWidth).toBe(0.8);
    expect(withLayout(initialState(), "learn", { toolWidth: 0.05 }).workspace.layouts.learn.toolWidth).toBe(0.2);
  });
  it("existing v2 state without toolWidth migrates with the default and nothing lost", () => {
    const s = initialState();
    const old = JSON.parse(JSON.stringify({ ...s, notebook: [{ id: "n", createdAt: 1, conceptId: "c", kind: "note", title: "t", body: "b" }] }));
    for (const m of ["learn", "solve", "explore", "revise"]) delete old.workspace.layouts[m].toolWidth;
    const out = migrate(old);
    expect(out.reset).toBe(false);
    expect(out.state.workspace.layouts.solve).toEqual({ split: 0.5, pinned: ["paper"], toolWidth: 0.45 });
    expect(out.state.notebook).toHaveLength(1);
  });
});
