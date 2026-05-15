/**
 * Playwright global setup: logs in once and saves the session cookie
 * so all tests in the "authenticated" project share a valid session.
 *
 * Reads credentials from environment variables:
 *   E2E_EMAIL    — a real QuoteMate test account email
 *   E2E_PASSWORD — its password
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("log in and save session", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_EMAIL and E2E_PASSWORD must be set.\n" +
        "Add them to a .env.test.local file or export them before running Playwright."
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait until we land somewhere past the login page
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

  // Save the auth cookies/storage for reuse
  await page.context().storageState({ path: authFile });
});
