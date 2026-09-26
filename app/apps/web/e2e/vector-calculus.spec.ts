import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const C = "em1.math.vector-calculus";
const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();

test("vector calculus opens at depth", async ({ page }) => {
  for (const [block, title, label] of [
    ["idea-gradient", "The gradient points uphill", "Idea 1 · The gradient · Explanation 1 of 4"],
    ["idea-divergence", "Divergence: outflow per unit volume", "Idea 2 · Divergence and the divergence theorem · Explanation 1 of 4"],
    ["idea-curl", "Curl: circulation per unit area", "Idea 3 · Curl and Stokes' theorem · Explanation 1 of 4"],
  ] as const) {
    await open(page, concept(C, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("HW02 2.1(c): the spherical gradient step reads −4", async ({ page }) => {
  await open(page, concept(C, "mode=learn&lesson=main&block=idea-gradient&step=2"));
  await margin(page, "Cylindrical and spherical: scale factors");
  await expect(page.locator(".readouts")).toContainText("-4");
});
