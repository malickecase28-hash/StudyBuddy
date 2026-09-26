import { expect, it } from "vitest";
import { rankCommands } from "../src/palette";

const cmds = [
  { id: "a", label: "Gauss's Law · Learn", group: "Concepts" },
  { id: "b", label: "Applications of Gauss's Law · Solve", group: "Concepts" },
  { id: "c", label: "Working paper", group: "Tools", keywords: "draw sketch" },
  { id: "d", label: "Explore mode", group: "Modes" },
];

it("ranks label-prefix matches first and requires every term", () => {
  expect(rankCommands("", cmds)).toHaveLength(4);
  expect(rankCommands("gauss", cmds).map((c) => c.id)).toEqual(["a", "b"]);
  expect(rankCommands("gau sol", cmds).map((c) => c.id)).toEqual(["b"]);
  expect(rankCommands("sketch", cmds).map((c) => c.id)).toEqual(["c"]);
  expect(rankCommands("zzz", cmds)).toEqual([]);
  expect(rankCommands("", cmds, 2)).toHaveLength(2);
});
