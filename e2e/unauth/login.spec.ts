/**
 * Unauthenticated login flow tests — no saved session, no real Stripe calls.
 *
 * Stripe checkout is intercepted at the network level so no card is charged.
 */

import { test, expect } from "@playwright/test";

// ─── Case 5: Normal login ────────────────────────────────────────────────────

test("normal login lands on dashboard", async ({ page }) => {
  const email = process.env.E2E_EMAIL!;
  const password = process.env.E2E_PASSWORD!;

  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL(/\/(dashboard|onboarding)/);
  expect(page.url()).toMatch(/\/(dashboard|onboarding)/);
});

// ─── Case 12: Wrong password ─────────────────────────────────────────────────

test("wrong password shows error, stays on login", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("nobody@example.com");
  await page.getByPlaceholder("••••••••").fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator("[class*=danger], [style*=danger]").first()).toBeVisible();
});

// ─── Case 6–8: ?next=stripe-pro with existing Pro subscriber ─────────────────

test("login with ?next=stripe-pro as existing Pro user goes to dashboard", async ({
  page,
}) => {
  const email = process.env.E2E_PRO_EMAIL ?? process.env.E2E_EMAIL!;
  const password = process.env.E2E_PRO_PASSWORD ?? process.env.E2E_PASSWORD!;

  // Intercept the Stripe checkout API — assert it is NOT called
  let checkoutCalled = false;
  await page.route("**/api/stripe/checkout", async (route) => {
    checkoutCalled = true;
    await route.fulfill({ json: { url: "https://stripe.com/checkout/test" } });
  });

  await page.goto("/login?next=stripe-pro");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL(/\/(dashboard|onboarding)/);
  expect(checkoutCalled).toBe(false);
});

// ─── Case 9: ?next=stripe-pro with free user opens checkout ──────────────────

test("login with ?next=stripe-pro as free user calls Stripe checkout", async ({
  page,
}) => {
  const email = process.env.E2E_FREE_EMAIL;
  const password = process.env.E2E_FREE_PASSWORD;

  if (!email || !password) {
    test.skip(true, "E2E_FREE_EMAIL / E2E_FREE_PASSWORD not set — skipping");
    return;
  }

  let checkoutCalled = false;
  await page.route("**/api/stripe/checkout", async (route) => {
    checkoutCalled = true;
    await route.fulfill({ json: { url: "/dashboard?checkout=mocked" } });
  });

  await page.goto("/login?next=stripe-pro");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 10_000,
  });
  expect(checkoutCalled).toBe(true);
});
