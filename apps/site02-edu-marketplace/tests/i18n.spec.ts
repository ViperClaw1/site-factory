import { expect, test } from "@playwright/test";
import { registerLocaleTests } from "@repo/i18n/e2e";

registerLocaleTests({ page: "/courses", protectedPage: "/cart", germanText: "Kurse" });

// The layout must not read this cookie on the server, and a language switch
// remounts the layout, so the client has to restore the theme each time.
test("the saved theme survives first paint and a language switch", async ({ context, page, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "light", url: baseURL! }]);

  await page.goto("/de/courses");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.locator('footer a[hreflang="fr"]').click();
  await page.waitForURL(/\/fr\/courses/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
