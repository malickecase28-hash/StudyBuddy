import { describe, expect, it } from "vitest";
import { initialState, retireConcept } from "../src";

const OLD = "em1.electrostatics.flux-density", NEW = "em1.electrostatics.gauss-law";
describe("retireConcept", () => {
  it("moves the position to the successor's lesson, keeping the block", () => {
    const s = { ...initialState(), position: { conceptId: OLD, lessonId: "main", blockId: "q7a", branchStack: [] } };
    expect(retireConcept(s, OLD, NEW, "flux-density").position).toEqual({ conceptId: NEW, lessonId: "flux-density", blockId: "q7a", branchStack: [] });
  });
  it("drops the old progress and moves notebook entries", () => {
    const base = initialState();
    const s = { ...base, concepts: { [OLD]: { ...base.concepts[OLD]!, seen: true } as never }, notebook: [{ id: "n1", conceptId: OLD } as never] };
    const r = retireConcept(s, OLD, NEW, "flux-density");
    expect(OLD in r.concepts).toBe(false);
    expect((r.notebook[0] as { conceptId: string }).conceptId).toBe(NEW);
  });
  it("returns the same state when nothing refers to the old concept", () => {
    const s = initialState();
    expect(retireConcept(s, OLD, NEW, "flux-density")).toBe(s);
  });
});
