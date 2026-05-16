import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
import path from "path";

// Load .env.local so E2E_ variables are available to the test runner process
config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // auth state is shared, run sequentially
  workers: 1,          // one worker prevents concurrent Supabase auth collisions
  retries: 1,
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    // Persist auth cookies between tests in the same project
    storageState: "e2e/.auth/user.json",
    trace: "on-first-retry",
  },
  projects: [
    // Setup project: log in once and save session
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      use: { storageState: undefined },
    },
    // Main tests that reuse the saved session (excludes unauth/ subdirectory)
    {
      name: "authenticated",
      testMatch: /e2e\/(?!unauth\/).*\.spec\.ts/,
      dependencies: ["setup"],
    },
    // Tests that run without any session
    {
      name: "unauthenticated",
      testMatch: /e2e\/unauth\/.*\.spec\.ts/,
      use: { storageState: undefined },
      dependencies: [],
    },
  ],
  // Start the Next.js dev server automatically
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
