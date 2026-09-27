import { expect, test } from "@playwright/test";

// RBAC gate + client validation. No Supabase account needed: the guest is
// redirected by middleware.ts, and validation fails before any auth call.

test("guest is redirected from protected routes to login", async ({ page }) => {
  for (const path of ["/account", "/favorites"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}$`));
  }
});

test("signup form rejects invalid input before calling Supabase", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Name").fill("A");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Name must be 2–80 characters.")).toBeVisible();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  await expect(page).toHaveURL(/\/signup$/);
});

test("login ignores off-site ?next redirects", async ({ page }) => {
  await page.goto("/login?next=//evil.example");
  await expect(page.getByRole("link", { name: "New here? Create an account" })).toHaveAttribute(
    "href",
    "/signup?next=%2Faccount"
  );
});
