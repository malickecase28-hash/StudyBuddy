import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { emComponents } from "@forma/plate";
import { expect, it } from "vitest";
import { overlayViews, views2d } from "@/components/plate/views2d";

it("every EM component has a 2D view or an overlay", () => {
  for (const c of emComponents) expect(c.id in views2d || c.id in overlayViews, c.id).toBe(true);
});

it("plate views use theme tokens, never hex colours (so a theme switch recolours everything)", () => {
  const src = readFileSync(fileURLToPath(new URL("../components/plate/views2d.tsx", import.meta.url)), "utf8");
  expect(src.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
});
