import { expect, test } from "@playwright/test";
import { concept, G, margin, next, open, setTheme } from "./helpers";

test.use({ reducedMotion: "reduce" });

for (const theme of ["Paper", "Blueprint"] as const)
  test(`key plate states (${theme})`, async ({ page }) => {
    await open(page, "/");
    await setTheme(page, theme);
    const shot = async (name: string) => {
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme.toLowerCase());
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("figure.plate").first()).toHaveScreenshot(`${name}-${theme.toLowerCase()}.png`, { maxDiffPixelRatio: 0.01 });
    };
    await open(page, concept(G, "mode=learn"));
    await margin(page, "One charge, four materials");
    await shot("faraday-first-frame");
    await open(page, concept(G, "mode=learn&lesson=why-area"));
    await shot("why-area-r1");
    await next(page);
    await margin(page, "r = 1.8 m");
    await shot("why-area-r18");
    await open(page, concept(G, "mode=explore"));
    await shot("gauss-lab");
  });
