import { initialState } from "@forma/engine";
import { expect, it } from "vitest";
import { getConcept } from "@/lib/course";
import { parseWorkspaceParams } from "@/lib/workspace";

const concept = getConcept("em1.electrostatics.gauss-law")!;
const learner = { ...initialState(), notebook: [{ id: "n1", createdAt: 1, conceptId: concept.id, kind: "sim-state" as const, title: "t", body: "", plate: { plateId: "gauss", stepId: "law", state: {} } }] };
const parse = (q: string) => parseWorkspaceParams(new URLSearchParams(q), concept, learner);

it("reads good params", () => {
  expect(parse("mode=solve&lesson=why-area&return=%2Fc%2Fem1%2Fx&snapshot=n1&step=2&block=gauss")).toEqual({
    mode: "solve", lessonId: "why-area", returnTo: "/c/em1/x", snapshotId: "n1", step: 2, blockId: "gauss",
  });
});

it("falls back safely on junk, missing and hostile params", () => {
  expect(parse("mode=dance&lesson=nope&snapshot=missing&step=abc")).toEqual({ mode: "learn", lessonId: "main" });
  expect(parse("return=https%3A%2F%2Fevil.example").returnTo).toBeUndefined();
  expect(parse("return=%2F%2Fevil.example").returnTo).toBeUndefined();
  expect(parse("").step).toBeUndefined();
});
