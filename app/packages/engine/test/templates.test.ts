import { describe, expect, it } from "vitest";
import { checkNumeric, defineTemplate, instantiate, mulberry32, sampleParams } from "../src";

const octant = defineTemplate<{ Q: number }>({
  id: "q06-octant",
  params: { Q: { min: 10, max: 90, step: 5 } },
  prompt: (p) => `A ${p.Q} µC charge sits at the origin. Flux through the octant of a sphere around it?`,
  solve: (p) => ({
    answer: { value: p.Q / 8, unit: "µC" },
    distractors: [{ value: p.Q / 4, unit: "µC", errorClass: "conceptual", feedback: "That's a quarter; the octant is 1/8." }],
  }),
  dimension: "application",
  tags: { concepts: ["em1.electrostatics.gauss-applications"], misconceptions: [], difficulty: 2 },
});

describe("templates", () => {
  it("mulberry32 is deterministic and in [0,1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const xs = Array.from({ length: 5 }, () => a());
    expect(xs).toEqual(Array.from({ length: 5 }, () => b()));
    for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
  });
  it("samples on the step grid within range", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const { Q } = sampleParams(octant, seed);
      expect(Q).toBeGreaterThanOrEqual(10);
      expect(Q).toBeLessThanOrEqual(90);
      expect(Math.abs((Q - 10) / 5 - Math.round((Q - 10) / 5))).toBeLessThan(1e-9);
    }
  });
  it("instantiates a gradable variant, reproducible by seed", () => {
    const v = instantiate(octant, 7);
    expect(v).toEqual(instantiate(octant, 7));
    expect(v.key).toBe("q06-octant#7");
    expect(checkNumeric(v.spec, `${v.params.Q / 8} µC`).correct).toBe(true);
    expect(checkNumeric(v.spec, `${v.params.Q / 4} µC`).errorClass).toBe("conceptual");
  });
  it("different seeds give different variants", () => {
    const qs = new Set(Array.from({ length: 30 }, (_, i) => instantiate(octant, i + 1).params.Q));
    expect(qs.size).toBeGreaterThan(5);
  });
});
