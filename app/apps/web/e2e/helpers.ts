import { expect, type Page } from "@playwright/test";

export const G = "em1.electrostatics.gauss-law";
export const concept = (id: string, q: string) => `/c/em1/${id}?${q}`;

/** Wait for hydration: the workspace heading renders only after the learner store loads. */
export async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15_000 }); // hydration is slow under CPU throttling
}

/** Keyboard-only step: leave any focused control, then press →. */
export async function next(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("ArrowRight");
}

export async function margin(page: Page, title: string) {
  await expect(page.getByRole("complementary", { name: "Margin" }).getByRole("heading", { name: title })).toBeVisible();
}

export async function choose(page: Page, label: string) {
  await page.getByRole("radio", { name: label }).check();
  await page.getByRole("button", { name: "Check", exact: true }).click();
}

export async function setTheme(page: Page, name: "Paper" | "Blueprint") {
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", name.toLowerCase());
  await page.keyboard.press("Escape");
  // Persistence is debounced; wait until the theme is really in IndexedDB before the next page load reads it.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise((res) => {
            const r = indexedDB.open("studybuddy");
            r.onsuccess = () => {
              const g = r.result.transaction("kv").objectStore("kv").get("learner");
              g.onsuccess = () => res((g.result?.value as { settings?: { theme?: string } } | undefined)?.settings?.theme);
            };
          }),
      ),
    )
    .toBe(name.toLowerCase());
}
