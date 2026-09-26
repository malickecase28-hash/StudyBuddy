import { expect, test } from "@playwright/test";
import { concept, G, margin, open } from "./helpers";

const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("the main lesson numbers ideas across its five plates and opens each", async ({ page }) => {
  await open(page, concept(G, "mode=learn"));
  await margin(page, "One charge, four materials");
  await expect(kicker(page)).toHaveText("Idea 1 · Faraday's spheres: why flux exists · Explanation 1 of 4");
  for (const [block, title, label] of [
    ["flux-surface", "A steady stream of D", "Idea 2 · Flux through a surface · Explanation 1 of 7"],
    ["idea-closed", "A closed surface", "Idea 3 · Closed surfaces and the outward normal · Explanation 1 of 6"],
    ["idea-gauss-law", "The law", "Idea 4 · Gauss's law · Explanation 1 of 6"],
    ["idea-symmetry", "True, but hard to use", "Idea 5 · Using Gauss's law: symmetry · Explanation 1 of 5"],
  ] as const) {
    await open(page, concept(G, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("symmetry: the line-charge step shows the exact D", async ({ page }) => {
  await open(page, concept(G, "mode=learn&lesson=main&block=idea-symmetry&step=2"));
  await margin(page, "A line charge: a cylinder");
  await expect(page.locator(".readouts")).toContainText("0.3183");
});
