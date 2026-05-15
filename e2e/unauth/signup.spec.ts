/**
 * Unauthenticated signup flow tests.
 */

import { test, expect } from "@playwright/test";

// ─── Case 4: Existing email shows error & sign-in link ───────────────────────

test("signing up with an existing email shows error and sign-in link", async ({
  page,
}) => {
  const existingEmail = process.env.E2E_EMAIL!;

  await page.goto("/signup");
  // "choose" screen — click the Free plan to get to the signup form
  await page.getByRole("button", { name: /free/i }).first().click();

  await page.getByPlaceholder(/sarah johnson/i).fill("Test User");
  await page.getByPlaceholder(/sarah@example\.com|you@example\.com/i).fill(existingEmail);
  await page.getByPlaceholder(/password/i).fill("somepassword123");
  await page.getByRole("button", { name: /get started|sign up|create/i }).click();

  await expect(
    page.getByText(/already registered|already in use|sign in/i)
  ).toBeVisible({ timeout: 8_000 });
});

// ─── Case 4b: Sign-in link from Pro signup page carries ?next=stripe-pro ─────

test("sign-in link on pro signup page includes ?next=stripe-pro", async ({
  page,
}) => {
  await page.goto("/signup?plan=pro");

  // Target the specific sign-in link that carries the stripe-pro param,
  // not the other generic /login links on the page
  const proSigninLink = page.locator('a[href*="next=stripe-pro"]');
  await expect(proSigninLink).toBeVisible();
});

// ─── Case 4c: Free signup page sign-in link does NOT carry stripe-pro ─────────

test("sign-in link on free signup page does NOT include ?next=stripe-pro", async ({
  page,
}) => {
  await page.goto("/signup?plan=free");

  const proSigninLink = page.locator('a[href*="next=stripe-pro"]');
  await expect(proSigninLink).toHaveCount(0);
});
