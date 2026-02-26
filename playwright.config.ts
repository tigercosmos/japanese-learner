import { defineConfig, devices } from "@playwright/test";

// Use a dedicated port for e2e tests so it doesn't conflict with `npm run dev` (port 5173).
// This ensures Playwright always starts a fresh server that picks up test fixture data.
const E2E_PORT = 5174;

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: `http://127.0.0.1:${E2E_PORT}/japanese-learner/`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx vite --port ${E2E_PORT}`,
    url: `http://127.0.0.1:${E2E_PORT}/japanese-learner/`,
    reuseExistingServer: false,
  },
});
