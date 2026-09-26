import { validatePlate } from "@forma/plate";
import { describe, expect, it } from "vitest";
import { checks, course, labs, registry, templatesFor } from "../src";

describe("explore labs", () => {
  for (const [conceptId, lab] of Object.entries(labs)) {
    it(`${conceptId}: belongs to a real concept and validates cleanly`, () => {
      expect(course.concepts.some((c) => c.id === conceptId)).toBe(true);
      expect(validatePlate(registry, lab.plate)).toEqual([]);
    });
    it(`${conceptId}: every control targets a declared handle and every experiment a real check`, () => {
      for (const c of lab.controls) {
        const inst = lab.plate.instances.find((i) => i.id === c.instance);
        expect(inst, c.instance).toBeDefined();
        expect(registry.get(inst!.component).handles, `${c.instance}.${c.param}`).toContain(c.param);
      }
      for (const e of lab.experiments) expect(checks[e.check], e.check).toBeDefined();
    });
  }
});

it("templatesFor filters by concept tag", () => {
  expect(templatesFor("em1.electrostatics.gauss-applications").map((t) => t.id).sort()).toEqual(["f2425-qt", "q06-octant", "q08-e", "q08-q", "q09a-cube"]);
  expect(templatesFor("em1.math.vectors")).toEqual([]);
});
