import { describe, expect, it } from "vitest";
import { potential, scalarFields, vectorFields } from "../src";

const EPS0 = 8.8541878128e-12;
describe("potential", () => {
  it("lecture 2b Example 5: −5.864 kV at (1, 0, 1)", () => {
    const v = potential([{ kind: "point", q: -4e-6, pos: [2, -1, 3] }, { kind: "point", q: 5e-6, pos: [0, 4, -2] }], [1, 0, 1]);
    expect(v).toBeCloseTo(-5863.59, 1);
  });
  it("a uniform ball: continuous at the surface, kQ/r outside", () => {
    const ball = { kind: "ball" as const, rhoV: 3e-6, radius: 1, center: [0, 0, 0] as [number, number, number] };
    const Q = (3e-6 * 4 * Math.PI) / 3;
    expect(potential([ball], [1, 0, 0])).toBeCloseTo(Q / (4 * Math.PI * EPS0), 3);
    expect(potential([ball], [0, 0, 0])).toBeCloseTo((3e-6 * 3) / (6 * EPS0), 3);
    expect(potential([ball], [2, 0, 0])).toBeCloseTo(Q / (4 * Math.PI * EPS0 * 2), 3);
  });
});

describe("new fields", () => {
  it("ex4-V gives E = −∇V = y ax + x ay + 2 az", () => {
    const g = scalarFields["ex4-V"]!.grad([1, 0, 1]);
    expect([-g[0], -g[1], -g[2]]).toEqual([0, 1, 2]);
    expect(vectorFields["ex4-E"]!.F([1, 0, 1])).toEqual([0, 1, 2]);
  });
  it("Finals 23-24 Q1(b)(i): ∇V at (5, π/3, −π/2) = 25 aφ", () => {
    const g = scalarFields["f2324-1b"]!.grad([5, Math.PI / 3, -Math.PI / 2]);
    expect(g[0]).toBeCloseTo(0, 10);
    expect(g[1]).toBeCloseTo(0, 10);
    expect(g[2]).toBeCloseTo(25, 10);
  });
  it("cont-5x has divergence 5", () => {
    expect(vectorFields["cont-5x"]!.div([0.3, 1, 2])).toBe(5);
  });
});
