import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Smoke runs against the static export, so `npm run build` must run first.
  webServer: {
    command: `npm run preview -- -l ${port} -L`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
