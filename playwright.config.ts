import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: process.env.DOMINO_BASE_URL || "http://localhost:5173",
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "browser-only",
      testIgnore: [/cloud-journey\.spec\.ts/, /cloud-worker-journey\.spec\.ts/],
    },
    ...(!process.env.DOMINO_BASE_URL
      ? [
          {
            name: "cloud-opt-in",
            testMatch: [
              /cloud-journey\.spec\.ts/,
              /cloud-worker-journey\.spec\.ts/,
            ],
            use: { baseURL: "http://localhost:5174" },
          },
        ]
      : []),
  ],
  webServer: process.env.DOMINO_BASE_URL
    ? undefined
    : [
        {
          command: "npm run dev",
          url: "http://localhost:5173",
          reuseExistingServer: !process.env.CI,
        },
        {
          command:
            "VITE_CLOUD_ENABLED=true npm run dev -- --port 5174 --strictPort",
          url: "http://localhost:5174",
          reuseExistingServer: false,
        },
      ],
});
