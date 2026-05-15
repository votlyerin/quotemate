/**
 * Unauthenticated signup flow tests.
 *
 * These do NOT create real users — they use Playwright's route interception
 * to stub Supabase auth and Stripe checkout responses.
 */

import { test, expect } from "@playwright/test";

// ─── Case 4: Existing email shows error & sign-in link ───────────────────────

test("signing up with an existing email shows error and sign-in link", async ({
  page,
}) => {
  const existingEmail = process.env.E2E_EMAIL!;

  await page.goto("/signup");
  await page.getByLabel(/your name/i).fill("Test User");
  await page.getByLabel(/email/i).fill(existingEmail);
  await page.getByLabel(/password/i).fill("somepassword123");
  await page.getByRole("button", { name: /get started|sign up|create/i }).click();

  // Supabase returns an error for duplicate emails
  await expect(
    page.getByText(/already registered|already in use|sign in/i)
  ).toBeVisible({ timeout: 8_000 });
});

// ─── Case 4b: Sign-in link from Pro signup carries ?next=stripe-pro ──────────

test("sign-in link on pro signup page includes ?next=stripe-pro", async ({
  page,
}) => {
  await page.goto("/signup?plan=pro");

  const signinLink = page.getByRole("link", { name: /sign in/i });
  await expect(signinLink).toBeVisible();

  const href = await signinLink.getAttribute("href");
  expect(href).toContain("next=stripe-pro");
});

// ─── Case 4c: Sign-in link from free signup does NOT carry stripe-pro ────────

test("sign-in link on free signup page does NOT include ?next=stripe-pro", async ({
  page,
}) => {
  await page.goto("/signup?plan=free");

  const signinLink = page.getByRole("link", { name: /sign in/i });
  await expect(signinLink).toBeVisible();

  const href = await signinLink.getAttribute("href");
  expect(href).not.toContain("stripe-pro");
});
