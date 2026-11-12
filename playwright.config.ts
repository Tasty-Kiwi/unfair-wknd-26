import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: process.env.DOMINO_BASE_URL || "http://localhost:5173",
    channel: process.env.CI ? undefined : "chrome",
    viewport: { width: 1440, height: 900 },
  },
  webServer: process.env.DOMINO_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
      },
});
