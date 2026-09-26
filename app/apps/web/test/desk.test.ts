import { initialState } from "@forma/engine";
import { describe, expect, it } from "vitest";
import { deskContinue } from "@/lib/desk";

const G = "em1.electrostatics.gauss-law";
const at = (position: ReturnType<typeof initialState>["position"], history = [{ type: "blockViewed", conceptId: G, blockId: "x", at: 1 }]) =>
  ({ ...initialState(), position, history }) as never;

describe("deskContinue", () => {
  it("first run goes to the readiness check", () => {
    expect(deskContinue(initialState()).href).toBe("/diagnostic");
  });
  it("a saved position in main whose block moved to the quick tour still resolves", () => {
    const c = deskContinue(at({ conceptId: G, lessonId: "main", blockId: "gauss", branchStack: [], plateStep: 2 }));
    expect(c.href).toBe(`/c/em1/${G}?mode=learn&lesson=quick&block=gauss&step=2`);
  });
  it("resumes the exact plate step, with a thumbnail", () => {
    const c = deskContinue(at({ conceptId: G, lessonId: "quick", blockId: "gauss", branchStack: [], plateStep: 3 }));
    expect(c.href).toBe(`/c/em1/${G}?mode=learn&lesson=quick&block=gauss&step=3`);
    expect(c.plate).toEqual({ plateId: "gauss", step: 3 });
    expect(c.title).toBe("§4 Flux");
    expect(c.sub).toMatch(/Gauss's Law/);
  });
  it("resumes a detour plate and a classic lesson", () => {
    expect(deskContinue(at({ conceptId: G, lessonId: "why-area", blockId: "why-area-p", branchStack: [], plateStep: 1 })).plate).toEqual({ plateId: "why-area-plate", step: 1 });
    const classic = deskContinue(at({ conceptId: G, lessonId: "main-classic", blockId: "hook", branchStack: [] }));
    expect(classic.href).toBe(`/learn/${G}/main-classic`);
    expect(classic.plate).toBeUndefined();
  });
  it("a stale position (lesson or block gone) falls back to the concept, never throws", () => {
    expect(deskContinue(at({ conceptId: G, lessonId: "gone", blockId: "x", branchStack: [] })).href).toBe(`/c/em1/${G}?mode=learn`);
    expect(deskContinue(at({ conceptId: "nope", lessonId: "x", blockId: "x", branchStack: [] })).href).toMatch(/^\/c\/em1\//);
  });
  it("a corrupt negative step clamps to the first step instead of crashing", () => {
    expect(deskContinue(at({ conceptId: G, lessonId: "main", blockId: "gauss", branchStack: [], plateStep: -3 })).plate).toEqual({ plateId: "gauss", step: 0 });
  });
});
