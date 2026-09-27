import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { concept, G, open, setTheme } from "./helpers";

const SCREENS = [
  "/", "/courses", "/c/em1",
  concept("em1.intro.em-world", "mode=learn"),
  concept("em1.math.vectors", "mode=learn&lesson=main&block=idea-coords"), concept("em1.math.vector-calculus", "mode=learn&lesson=main&block=idea-divergence"),
  concept("em1.electrostatics.coulomb", "mode=learn"), concept("em1.electrostatics.field", "mode=learn&lesson=main&block=idea-e-continuous"),
  concept(G, "mode=learn"), concept(G, "mode=solve"), concept(G, "mode=explore"), concept(G, "mode=revise"),
  concept("em1.electrostatics.gauss-applications", "mode=learn"), "/notebook", "/review",
  concept("em1.electrostatics.potential", "mode=learn"),
  concept("em1.electrostatics.current", "mode=learn&lesson=main&block=idea-ohm"),
  concept("em1.electrostatics.dielectrics", "mode=learn"),
  concept("em1.electrostatics.capacitance", "mode=learn&lesson=main&block=idea-coax-sphere"),
  concept("em1.electrostatics.divergence", "mode=learn&lesson=main&block=idea-div-theorem"),
  concept(G, "mode=learn&lesson=main&block=flux-surface"), concept(G, "mode=learn&lesson=main&block=idea-symmetry"), `/c/em1/${G}/sheet`,
];

for (const theme of ["Paper", "Blueprint"] as const)
  test(`no serious axe violations on every screen (${theme})`, async ({ page }) => {
    await open(page, "/");
    await setTheme(page, theme);
    for (const url of SCREENS) {
      await open(page, url);
      await page.waitForTimeout(300); // the stored theme swaps in after hydration; let the 160 ms colour transitions finish
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${url}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 3).map((n) => `${n.target.join(" ")} ${n.any[0]?.message ?? ""}`).join(" | ")}`)).toEqual([]);
    }
  });
