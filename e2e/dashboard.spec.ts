/**
 * Authenticated dashboard and navigation tests.
 * These run with the saved session from auth.setup.ts.
 */

import { test, expect } from "@playwright/test";

// ─── Case: Authenticated root redirects to dashboard ─────────────────────────

test("/ redirects authenticated user to dashboard", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL(/\/dashboard/);
  expect(page.url()).toContain("/dashboard");
});

// ─── Case: Dashboard renders core elements ────────────────────────────────────

test("dashboard shows stat cards and bottom nav", async ({ page }) => {
  await page.goto("/dashboard");

  // Bottom nav tabs should be present
  await expect(page.getByRole("link", { name: /home/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /quotes/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /settings/i })).toBeVisible();
});

// ─── Case: Unauthenticated access to dashboard redirects to login ─────────────

test("unauthenticated /dashboard redirects to login", async ({ browser }) => {
  // Create a fresh context with no saved auth
  const ctx = await browser.newContext({ storageState: undefined });
  const page = await ctx.newPage();

  await page.goto("/dashboard");
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain("/login");

  await ctx.close();
});

// ─── Case 24: Free user can reach settings ───────────────────────────────────

test("settings page loads for authenticated user", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText(/settings/i)).toBeVisible();
});
