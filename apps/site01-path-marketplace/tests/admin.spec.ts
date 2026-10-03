import { expect, test } from "@playwright/test";
import { CSV_TEMPLATE, fileIndex, inspectDraft, parseCatalogCsv, titleFromFilename } from "../lib/admin/csv";

// TEMPORARY while ADMIN_PUBLIC is true. Restore the login redirect and 401
// assertions when the admin role gate comes back.
test("catalog admin is reachable without a session", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Catalog admin" })).toBeVisible();

  expect((await request.get("/api/admin/products")).status()).toBe(200);
  expect((await request.post("/api/admin/products", { data: {} })).status()).toBe(400);
  expect((await request.post("/api/admin/uploads/sign", { data: {} })).status()).toBe(400);
});

// Same checks the bulk preview runs on each row. No Supabase and no admin session:
// the preview never uploads, it only validates the manifest against the dropped files.
test("catalog csv preview rejects a bad price and a missing file", async () => {
  expect(titleFromFilename("img_0818.webp")).toBe("Img 0818");

  const parsed = parseCatalogCsv(CSV_TEMPLATE);
  expect(parsed.errors).toEqual([]);
  expect(parsed.rows).toHaveLength(1);

  const files = fileIndex([
    new File([new Uint8Array([1])], "molly-1.webp", { type: "image/webp" }),
    new File([new Uint8Array([1])], "molly-2.webp", { type: "image/webp" }),
    new File([new Uint8Array([1])], "teaser.mp4", { type: "video/mp4" }),
  ]);
  expect(inspectDraft(parsed.rows[0]!, files).input?.price).toBe(16.99);

  const broken = parseCatalogCsv(
    "title,category,price,description,media\nGhost,toys,nope,x,missing.webp\nOk Toy,toys,$12.50,Fine,molly-1.webp\n"
  );
  const bad = inspectDraft(broken.rows[0]!, files);
  const good = inspectDraft(broken.rows[1]!, files);
  expect(bad.errors.price).toBeTruthy();
  expect(bad.missingFiles).toContain("missing.webp");
  expect(bad.input).toBeUndefined();
  expect(good.input?.title).toBe("Ok Toy");
  expect(good.input?.price).toBe(12.5);
});
