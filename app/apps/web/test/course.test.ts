import { expect, it } from "vitest";
import { conceptHref, getLesson, isPlateLesson, lessonForPlate, lessonHref } from "@/lib/course";

const G = "em1.electrostatics.gauss-law";

it("plate lessons open in the concept workspace; classic lessons keep /learn", () => {
  expect(isPlateLesson(getLesson(G, "main")!)).toBe(true);
  expect(isPlateLesson(getLesson(G, "main-classic")!)).toBe(false);
  expect(lessonHref(G, "main")).toBe(`/c/em1/${G}?mode=learn&lesson=main`);
  expect(lessonHref(G, "why-area", "?return=%2Fx")).toBe(`/c/em1/${G}?mode=learn&lesson=why-area&return=%2Fx`);
  expect(lessonHref(G, "main-classic")).toBe(`/learn/${G}/main-classic`);
  expect(conceptHref(G, "solve")).toBe(`/c/em1/${G}?mode=solve`);
  expect(lessonForPlate(G, "gauss")).toBe("main");
  expect(lessonForPlate(G, "why-area-plate")).toBe("why-area");
  expect(lessonForPlate(G, "nope")).toBeUndefined();
});
