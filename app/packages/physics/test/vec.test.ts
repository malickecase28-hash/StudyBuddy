import { describe, expect, it } from "vitest";
import { add, cross, dot, norm, normalize, scale, sub, vec, EPS0, K_E } from "../src";

describe("vec", () => {
  it("does basic algebra", () => {
    expect(add(vec(1, 2, 3), vec(4, 5, 6))).toEqual([5, 7, 9]);
    expect(sub(vec(4, 5, 6), vec(1, 2, 3))).toEqual([3, 3, 3]);
    expect(scale(vec(1, -2, 3), 2)).toEqual([2, -4, 6]);
    expect(dot(vec(1, 2, 3), vec(4, 5, 6))).toBe(32);
  });
  it("cross product follows right-hand rule", () => {
    expect(cross(vec(1, 0, 0), vec(0, 1, 0))).toEqual([0, 0, 1]);
    expect(cross(vec(0, 1, 0), vec(0, 0, 1))).toEqual([1, 0, 0]);
  });
  it("norm and normalize", () => {
    expect(norm(vec(3, 4, 12))).toBe(13);
    expect(norm(normalize(vec(3, 4, 12)))).toBeCloseTo(1, 15);
  });
  it("constants are consistent", () => {
    expect(K_E * 4 * Math.PI * EPS0).toBeCloseTo(1, 15);
  });
});
