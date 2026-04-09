import { defineConfig } from "@playwright/test";

const PORT = parseInt(process.env.PREVIEW_PORT || "8100", 10);

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  reporter: "list",

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "firefox",
      use: {
        browserName: "firefox",
      },
    },
  ],

  globalSetup: "./helpers/global-setup.ts",
  globalTeardown: "./helpers/global-teardown.ts",
});
