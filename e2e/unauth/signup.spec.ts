/**
 * Unauthenticated signup flow tests.
 *
 * Key structure of SignupForm:
 *  - /signup?plan=pro  → signup screen, selectedPlan="pro"
 *  - /signup?plan=free → signup screen, selectedPlan="free"
 *  - Submitting with an existing email → "duplicate" screen
 *  - The ?next=stripe-pro sign-in link only appears on the duplicate screen
 */

import { test, expect } from "@playwright/test";

// ─── Helper: fill and submit the signup form ──────────────────────────────────

async function submitSignupForm(
  page: Parameters<Parameters<typeof test>[1]>[0]["page"],
  email: string,
  plan: "free" | "pro"
) {
  await page.goto(`/signup?plan=${plan}`);
  await page.getByPlaceholder("Mike Henderson").fill("Test User");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("Min 6 characters").fill("somepassword123");
  const btnName = plan === "pro" ? /start free trial/i : /get started free/i;
  await page.getByRole("button", { name: btnName }).click();
}

// ─── Case 4: Existing email shows "Account already exists" screen ─────────────

test("signing up with an existing email shows error and sign-in link", async ({
  page,
}) => {
  const existingEmail = process.env.E2E_EMAIL!;
  await submitSignupForm(page, existingEmail, "free");

  await expect(page.getByText(/account already exists/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("link", { name: /sign in to your account/i })).toBeVisible();
});

// ─── Case 4b: Duplicate screen on Pro signup carries ?next=stripe-pro ─────────

test("sign-in link on pro signup duplicate screen includes ?next=stripe-pro", async ({
  page,
}) => {
  const existingEmail = process.env.E2E_EMAIL!;
  await submitSignupForm(page, existingEmail, "pro");

  // Wait for the duplicate screen
  await expect(page.getByText(/account already exists/i)).toBeVisible({
    timeout: 10_000,
  });

  // The CTA link on the duplicate screen should carry ?next=stripe-pro for Pro
  const signinLink = page.locator('a[href*="next=stripe-pro"]');
  await expect(signinLink).toBeVisible();
});

// ─── Case 4c: Duplicate screen on Free signup does NOT carry stripe-pro ────────

test("sign-in link on free signup duplicate screen does NOT include ?next=stripe-pro", async ({
  page,
}) => {
  const existingEmail = process.env.E2E_EMAIL!;
  await submitSignupForm(page, existingEmail, "free");

  await expect(page.getByText(/account already exists/i)).toBeVisible({
    timeout: 10_000,
  });

  // The CTA link should be plain /login for free plan
  const signinLink = page.getByRole("link", { name: /sign in to your account/i });
  await expect(signinLink).toBeVisible();
  const href = await signinLink.getAttribute("href");
  expect(href).not.toContain("stripe-pro");
  expect(href).toBe("/login");
});
