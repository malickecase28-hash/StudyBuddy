import { expect, test } from "@playwright/test";
import { concept, margin, open } from "./helpers";

const kicker = (page: import("@playwright/test").Page) => page.getByRole("complementary", { name: "Margin" }).locator(".kicker").first();
const U1 = "em1.intro.em-world";
const V = "em1.math.vectors";

test("Unit 1 and vectors open at depth, numbered per concept", async ({ page }) => {
  await open(page, concept(U1, "mode=learn"));
  await margin(page, "Fields from charges");
  await expect(kicker(page)).toHaveText("Idea 1 · What electromagnetics is, and where it runs the world · Explanation 1 of 5");
  await open(page, concept(U1, "mode=learn&lesson=main&block=idea-units"));
  await expect(kicker(page)).toHaveText("Idea 2 · Units, prefixes and symbols · Explanation 1 of 5");
  for (const [block, title, label] of [
    ["idea-vec-basics", "A vector is three numbers", "Idea 1 · Components, length, unit and displacement vectors · Explanation 1 of 4"],
    ["idea-vec-products", "The dot product: how much lies along", "Idea 2 · Dot and cross products, angles and projections · Explanation 1 of 4"],
    ["idea-coords", "Cylindrical: ρ, φ, z", "Idea 3 · Cylindrical and spherical coordinates · Explanation 1 of 4"],
    ["idea-elements", "dl, dS and dv in cartesian", "Idea 4 · dl, dS and dv · Explanation 1 of 4"],
  ] as const) {
    await open(page, concept(V, `mode=learn&lesson=main&block=${block}`));
    await margin(page, title);
    await expect(kicker(page)).toHaveText(label);
  }
});

test("coordinates: the quadrant step reads 233.1°", async ({ page }) => {
  await open(page, concept(V, "mode=learn&lesson=main&block=idea-coords&step=2"));
  await margin(page, "The quadrant trap");
  await expect(page.locator(".readouts")).toContainText("233.1");
});
