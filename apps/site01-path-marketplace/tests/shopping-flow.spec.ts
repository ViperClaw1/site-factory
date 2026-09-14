import { expect, test } from "@playwright/test";

// The real catalog (Directus/Supabase) is unavailable in this environment, so
// the home page renders placeholder cards (see lib/placeholders.ts). These
// tests cover the flow those placeholders exist to validate: browse → PDP →
// cart → checkout → mock confirmation. Real payment (PayMesh Gateway) isn't
// wired up yet — see the disclaimers asserted in the checkout test.

test("placeholder product card navigates to a real PDP with placeholder copy", async ({ page }) => {
  await page.goto("/");

  // Index 2 (not 0) to avoid colliding with the hero's own placeholder-0 link.
  await page.locator('a[href="/p/placeholder-2"]').first().click();

  await expect(page).toHaveURL(/\/p\/placeholder-2$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Limited Print");
  await expect(page.getByText("Full product details, gallery, and variants are coming soon.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to Cart" })).toBeVisible();
});

test("placeholder character card navigates to a real character page with placeholder copy", async ({ page }) => {
  await page.goto("/");

  await page.locator('a[href="/characters/placeholder-0"]').click();

  await expect(page).toHaveURL(/\/characters\/placeholder-0$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mystery Character");
  await expect(page.getByText("This character's bio and gallery are coming soon.")).toBeVisible();
});

test("full flow: home -> PDP -> add to cart -> cart -> checkout -> mock confirmation", async ({ page }) => {
  await page.goto("/");

  // 1. Browse from the home page to a product.
  await page.locator('a[href="/p/placeholder-1"]').first().click();
  await expect(page).toHaveURL(/\/p\/placeholder-1$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mystery Figure");

  // 2. Add to cart — header badge updates, inline confirmation appears.
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByText("Added to cart.")).toBeVisible();
  await expect(page.getByLabel("Cart")).toContainText("1");

  // 3. Go to the cart via the header.
  await page.getByLabel("Cart").click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByText("Mystery Figure")).toBeVisible();

  // 4. Proceed to checkout.
  await page.getByRole("link", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText("Payment is not wired up yet")).toBeVisible();

  // 5. Place a mock order.
  await page.getByLabel("Email").fill("shopper@example.com");
  await page.getByRole("button", { name: "Place order" }).click();

  // 6. Confirmation page shows the mock order, and is explicit that nothing was charged.
  await expect(page).toHaveURL(/\/checkout\/confirmation\?order=mock_/);
  await expect(page.getByRole("heading", { name: "Order confirmed" })).toBeVisible();
  await expect(page.getByText("shopper@example.com")).toBeVisible();
  await expect(page.getByText("Mystery Figure")).toBeVisible();
  await expect(page.getByText("This is a mock confirmation")).toBeVisible();

  // 7. Cart is empty again after the order was placed.
  await page.goto("/cart");
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});
