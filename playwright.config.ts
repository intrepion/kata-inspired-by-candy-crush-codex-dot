import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./browser-tests",
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  use: {
    baseURL: "http://127.0.0.1:5226",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  },
  reporter: [["list"]],
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:5226",
    reuseExistingServer: !process.env.CI,
  },
});
