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
import { Interaction } from "../src";

describe("worked lines and template checks", () => {
  const t = defineTemplate<{ Q: number }>({
    id: "w", params: { Q: { min: 2, max: 2, step: 1 } }, prompt: (p) => `Q = ${p.Q}`,
    solve: (p) => ({ answer: { value: p.Q / 2, unit: "µC" } }),
    worked: (p) => [{ text: `Half of ${p.Q} is ${p.Q / 2}.` }],
    dimension: "computational", tags: { concepts: [], misconceptions: [], difficulty: 1 },
  });
  it("instantiates worked lines with the variant's numbers", () => {
    expect(instantiate(t, 1).worked).toEqual([{ text: "Half of 2 is 1." }]);
    expect(instantiate(octant, 1).worked).toEqual([]);
  });
  it("numeric interactions may name a template", () => {
    const i = Interaction.parse({ id: "n", type: "numeric", prompt: "p", answer: { value: 1, unit: "µC" }, template: "w", dimension: "computational" });
    expect(i.type === "numeric" && i.template).toBe("w");
  });
});
