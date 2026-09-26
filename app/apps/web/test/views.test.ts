import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { emComponents } from "@forma/plate";
import { expect, it } from "vitest";
import { toSvg, toSvg3 } from "@forma/plate";
import { overlayViews, place, views2d } from "@/components/plate/views2d";

it("every EM component has a 2D view or an overlay", () => {
  for (const c of emComponents) expect(c.id in views2d || c.id in overlayViews, c.id).toBe(true);
});

it("plate views use theme tokens, never hex colours (so a theme switch recolours everything)", () => {
  const src = readFileSync(fileURLToPath(new URL("../components/plate/views2d.tsx", import.meta.url)), "utf8");
  expect(src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
});

it("charges, forces and probes share the scaled oblique projection", () => {
  const point = [1, 2, 3];
  expect(place(point, 120, true)).toEqual(toSvg3([120, 240, 360]));
  expect(place(point, 1, false)).toEqual(toSvg(point));
});
import { emComponents as all } from "@forma/plate";
import { readFileSync as read } from "node:fs";

it("every declared readout has a human label", () => {
  const src = read(fileURLToPath(new URL("../components/plate/Readouts.tsx", import.meta.url)), "utf8");
  for (const c of all) for (const name of Object.keys(c.readouts)) expect(src, `${c.id}.${name}`).toMatch(new RegExp(`\\b${name}: "`));
});

it("global styles use theme tokens, never hex colours", () => {
  const css = read(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
  expect(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
});
