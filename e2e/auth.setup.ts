/**
 * Playwright global setup: logs in once and saves the session cookie
 * so all tests in the "authenticated" project share a valid session.
 *
 * Reads credentials from environment variables set in .env.local:
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
      "E2E_EMAIL and E2E_PASSWORD must be set in .env.local"
    );
  }

  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

  await page.context().storageState({ path: authFile });
});
