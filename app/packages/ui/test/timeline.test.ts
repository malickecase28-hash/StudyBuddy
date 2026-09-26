import { expect, it } from "vitest";
import { visibleTicks } from "../src/primitives";

it("shows one tick per step for short lessons, and only the marks for long ones", () => {
  expect(visibleTicks(3)).toEqual([{ index: 0, label: "§1" }, { index: 1, label: "§2" }, { index: 2, label: "§3" }]);
  expect(visibleTicks(40, [{ index: 0, label: "1 Flux" }, { index: 9, label: "Example 1" }])).toEqual([{ index: 0, label: "1 Flux" }, { index: 9, label: "Example 1" }]);
});
