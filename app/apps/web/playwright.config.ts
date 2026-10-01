import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3101", viewport: { width: 1360, height: 900 } },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } }, grepInvert: /@perf/ },
    {
      // "Cheap laptop": 4× CPU throttle, low-power simulation tier.
      name: "throttled",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
      grep: /@perf/,
    },
  ],
  webServer: {
    command: "pnpm build && pnpm next start -p 3101",
    url: "http://localhost:3101",
    env: { NEXT_PUBLIC_COMMONS: "off" },
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
