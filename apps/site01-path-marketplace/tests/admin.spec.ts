import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import {
  CATALOG_TEMPLATE,
  fileIndex,
  inspectDraft,
  parseCatalogJson,
  productToJson,
  titleFromFilename,
  type CatalogDbRow,
} from "../lib/admin/catalog-json";
import { CATEGORIES } from "../lib/catalog-taxonomy.mjs";


function attach(...names: string[]) {
  return fileIndex(names.map((name) => new File([new Uint8Array([1])], name)));
}

function catalog(...products: unknown[]): string {
  return JSON.stringify({ version: 1, products });
}

// A click that lands before hydration does nothing on a cold dev server, so retry until the modal is up.
async function openBulkModal(page: Page) {
  await expect(async () => {
    await page.getByRole("button", { name: "Bulk upload" }).first().click();
    await expect(page.getByTestId("bulk-files")).toBeAttached({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });
}

// TEMPORARY while ADMIN_PUBLIC is true. Restore the login redirect and 401
// assertions when the admin role gate comes back.
test("catalog admin is reachable without a session", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Catalog admin" })).toBeVisible();

  expect((await request.get("/api/admin/products")).status()).toBe(200);
  expect((await request.post("/api/admin/products", { data: {} })).status()).toBe(400);
  expect((await request.post("/api/admin/uploads/sign", { data: {} })).status()).toBe(400);
  expect((await request.post("/api/admin/products/export", { data: { ids: ["nope"] } })).status()).toBe(400);
  expect((await request.post("/api/admin/products/slugs", { data: { slugs: [] } })).status()).toBe(400);
});

// The template is the documentation people copy from, so it must stay importable.
test("json template validates and covers every category", async () => {
  const parsed = parseCatalogJson(CATALOG_TEMPLATE);
  expect(parsed.errors).toEqual([]);
  expect(parsed.rows.map((row) => row.category).sort()).toEqual([...CATEGORIES].sort());

  const names = parsed.rows.flatMap((row) => row.media.flatMap((item) => (item.file ? [item.file] : [])));
  const files = attach(...names);
  for (const row of parsed.rows) {
    expect(inspectDraft(row, files).errors).toEqual({});
  }
});

// Same checks the bulk preview runs. No Supabase and no admin session:
// the preview never uploads, it only validates the file against the dropped media.
test("catalog json reports structural problems against the file", async () => {
  expect(titleFromFilename("img_0818.webp")).toBe("Img 0818");

  expect(parseCatalogJson("{ nope").errors[0]).toContain("Not valid JSON");
  expect(parseCatalogJson(JSON.stringify({ version: 2, products: [] })).errors[0]).toContain("version");
  expect(parseCatalogJson(catalog()).errors[0]).toContain("no products");

  // A bad entry is reported by position and the good one still loads.
  const good = { title: "Good Toy", category: "toys", price: 5, media: [{ file: "a.webp" }] };
  const typo = parseCatalogJson(catalog({ ...good, slug: "typo", weigthGrams: 5 }, good));
  expect(typo.errors).toHaveLength(1);
  expect(typo.errors[0]).toContain("products[0]");
  expect(typo.errors[0]).toContain("weigthGrams");
  expect(typo.rows).toHaveLength(1);

  const both = parseCatalogJson(catalog({ ...good, media: [{ file: "a.webp", url: "https://example.com/a.webp" }] }));
  expect(both.errors[0]).toContain("products[0].media[0]");

  const unsafe = parseCatalogJson(catalog({ ...good, media: [{ url: "javascript:alert(1)" }] }));
  expect(unsafe.rows).toHaveLength(0);

  const repeatedSlug = parseCatalogJson(catalog(good, good));
  expect(repeatedSlug.rows).toHaveLength(1);
  expect(repeatedSlug.errors[0]).toContain('duplicate slug "good-toy"');

  const variant = { sku: "SAME", stock: 1 };
  const repeatedSku = parseCatalogJson(catalog({ ...good, variants: [variant, variant] }));
  expect(repeatedSku.errors[0]).toContain('duplicate SKU "SAME"');
});

test("catalog json preview rejects a bad price and a missing file", async () => {
  const parsed = parseCatalogJson(
    catalog(
      { title: "Ghost", category: "toys", price: "nope", media: [{ file: "missing.webp" }] },
      { title: "Ok Toy", category: "toys", price: "$12.50", media: [{ file: "Sub/A.WEBP" }] },
      { title: "Remote Toy", category: "toys", price: 3, media: [{ url: "https://example.com/toy.webp" }] },
      { title: "Bare Toy", category: "nowhere", price: 3 }
    )
  );
  expect(parsed.errors).toEqual([]);

  const files = attach("a.webp");
  const [bad, ok, remote, bare] = parsed.rows.map((row) => inspectDraft(row, files));
  expect(bad?.errors.price).toBeTruthy();
  expect(bad?.missingFiles).toContain("missing.webp");
  expect(bad?.input).toBeUndefined();
  expect(ok?.input?.price).toBe(12.5);
  expect(remote?.errors).toEqual({});
  expect(bare?.errors.media).toBeTruthy();
  expect(bare?.errors.category).toBeTruthy();
});

test("nested fields reach the product input", async () => {
  const [row] = parseCatalogJson(
    catalog({
      title: "Limited Bear",
      category: "collectible_toys",
      price: 120,
      status: "archived",
      weightGrams: 500,
      collection: "limited",
      collectible: { editionSize: 50, story: [{ title: "Forest", body: "Woke early.", image: "/seed/bear.jpg" }] },
      media: [{ url: "https://example.com/bear.webp", alt: "Bear" }],
      variants: [
        { sku: "BEAR-A", attributes: { edition: "a" }, stock: 3 },
        { sku: "BEAR-B", attributes: { edition: "b" }, price: 150, stock: 4 },
      ],
    })
  ).rows;

  const { input } = inspectDraft(row!, attach());
  expect(input).toMatchObject({
    status: "archived",
    stock: 7,
    weightGrams: 500,
    collection: "limited",
    isCollectible: true,
    editionSize: 50,
    story: [{ title: "Forest" }],
    variants: [{ sku: "BEAR-A" }, { sku: "BEAR-B", price: 150 }],
  });

  // The stock cell edits a lone variant.
  const [single] = parseCatalogJson(
    catalog({ title: "Solo", category: "toys", price: 1, media: [{ url: "/a.webp" }], variants: [{ sku: "S", stock: 1 }] })
  ).rows;
  expect(inspectDraft({ ...single!, stock: "9" }, attach()).input?.variants?.[0]?.stock).toBe(9);
});

test("an export loads back, including older seeded rows", async () => {
  const stored: CatalogDbRow = {
    slug: "limited-bear",
    title: "Limited Bear",
    description: "Numbered",
    category: "collectible_toys",
    product_type: "physical",
    collection: "limited",
    character: "bear",
    is_collectible: true,
    edition_size: 50,
    series: "bears",
    images: [{ type: "image", url: "https://example.com/bear.webp", alt: "Bear", variants: ["thumb"] }],
    base_price: "120.00",
    weight_grams: 500,
    collectible_story: [{ title: "Forest", body: "Woke early.", image: "https://example.com/forest.webp" }],
    status: "archived",
    product_variants: [{ sku: "BEAR-STD", attributes: { edition: "standard" }, price: "130.00", stock: 3 }],
  };
  const parsed = parseCatalogJson(catalog(productToJson(stored)));
  expect(parsed.errors).toEqual([]);
  expect(inspectDraft(parsed.rows[0]!, attach()).input).toMatchObject({
    slug: "limited-bear",
    price: 120,
    status: "archived",
    character: "bear",
    weightGrams: 500,
    isCollectible: true,
    editionSize: 50,
    variants: [{ sku: "BEAR-STD", price: 130, stock: 3, attributes: { edition: "standard" } }],
  });
  expect(parsed.rows[0]?.media).toEqual([{ url: "https://example.com/bear.webp", alt: "Bear" }]);

  // Seed format: string images, story `text`, null attributes, edition without the flag.
  const seeded: CatalogDbRow = {
    ...stored,
    slug: "robot-buddy",
    is_collectible: false,
    edition_size: 100,
    images: ["/seed/robot.jpg"],
    collectible_story: [{ title: "Tin", text: "Wound up.", image: "/seed/tin.jpg" }],
    product_variants: [{ sku: "ROBOT-STD", attributes: null, price: null, stock: 2 }],
  };
  const legacy = parseCatalogJson(catalog(productToJson(seeded)));
  expect(legacy.errors).toEqual([]);
  const input = inspectDraft(legacy.rows[0]!, attach()).input;
  expect(input?.isCollectible).toBe(false);
  expect(input?.editionSize).toBe(100);
  expect(input?.story?.[0]?.body).toBe("Wound up.");
  expect(legacy.rows[0]?.media).toEqual([{ url: "/seed/robot.jpg" }]);
});

// Real modal in a real browser. The slug check is mocked and nothing is imported.
test("bulk upload previews a json file with images and unticks existing slugs", async ({ page }) => {
  await page.route("**/api/admin/products/slugs", (route) => route.fulfill({ json: { existing: ["old-toy"] } }));
  await page.goto("/admin");
  await openBulkModal(page);

  const manifest = catalog(
    { title: "Old Toy", category: "toys", price: 5, slug: "old-toy", media: [{ file: "toy.webp", alt: "Old toy photo" }] },
    {
      title: "New Toy",
      category: "toys",
      price: 6,
      slug: "new-toy",
      media: [{ file: "toy.webp", alt: "New toy photo" }, { file: "absent.png" }],
      variants: [
        { sku: "NEW-A", stock: 1 },
        { sku: "NEW-B", stock: 2 },
      ],
    },
    { title: "Ready Toy", category: "toys", price: 7, slug: "ready-toy", media: [{ file: "toy.webp", alt: "Ready toy photo" }] },
    { title: "Drop Me", category: "toys", price: 8, slug: "drop-me", media: [{ file: "never.png" }] }
  );

  // Loading the JSON alone jumps straight to the preview; Files is checked off.
  await page.getByTestId("bulk-files").setInputFiles({ name: "catalog.json", mimeType: "application/json", buffer: Buffer.from(manifest) });
  const progress = page.getByRole("list", { name: "Progress" });
  await expect(progress.locator("[aria-current=step]")).toContainText("Preview");
  await expect(page.getByText("Attach 3 files named in the JSON, or drop them here: toy.webp, absent.png, never.png")).toBeVisible();
  await expect(page.getByRole("img", { name: "Not attached: never.png" })).toBeVisible();

  // Per-row removal.
  await page.getByRole("button", { name: "Remove Drop Me" }).click();
  await expect(page.getByRole("checkbox", { name: "Include Drop Me" })).toHaveCount(0);

  // A real WebP attached on the preview step decodes into the thumbnail.
  const webp = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#e91e63" } }).webp().toBuffer();
  await page.getByTestId("bulk-attach").setInputFiles({ name: "toy.webp", mimeType: "image/webp", buffer: webp });
  const thumb = page.getByRole("img", { name: "Old toy photo" });
  await expect(thumb).toBeVisible();
  await expect.poll(() => thumb.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText("Attach 1 file named in the JSON, or drop them here: absent.png")).toBeVisible();

  // Preview table: existing slug unticked but tickable, missing file blocks, valid row ready.
  await expect(page.getByText("Already exists — tick to import as a copy")).toHaveCount(1);
  const oldRow = page.getByRole("checkbox", { name: "Include Old Toy" });
  await expect(oldRow).not.toBeChecked();
  await expect(oldRow).toBeEnabled();
  await expect(page.getByRole("checkbox", { name: "Include New Toy" })).toBeDisabled();
  await expect(page.getByText("Missing file: absent.png")).toBeVisible();
  await expect(page.getByRole("img", { name: "Not attached: absent.png" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Include Drop Me" })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Include Ready Toy" })).toBeChecked();
  await expect(page.getByText("2 variants")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import 1 product", exact: true })).toBeEnabled();

  const all = page.getByRole("checkbox", { name: "Select all valid rows" });
  await all.check();
  await expect(oldRow).toBeChecked();
  await expect(page.getByRole("button", { name: "Import 2 products", exact: true })).toBeEnabled();
  await all.uncheck();
  await expect(page.getByRole("button", { name: "Import 0 products", exact: true })).toBeDisabled();
  await oldRow.check();
  await expect(page.getByRole("button", { name: "Import 1 product", exact: true })).toBeEnabled();
});

test("the json template downloads from the bulk modal", async ({ page }) => {
  await page.goto("/admin");
  await openBulkModal(page);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download JSON template" }).click()]);
  expect(download.suggestedFilename()).toBe("catalog-template.json");
});

// DELETE is mocked, so the real catalog is untouched. Needs at least two products to select.
test("selected rows are deleted together after one confirmation", async ({ page }) => {
  const deleted: string[] = [];
  await page.route("**/api/admin/products/*", async (route) => {
    if (route.request().method() !== "DELETE") return route.fallback();
    deleted.push(route.request().url());
    await route.fulfill({ json: { slug: "x", warnings: [] } });
  });
  await page.goto("/admin");
  const boxes = page.getByRole("checkbox", { name: /^Select (?!all)/ });
  test.skip((await boxes.count()) < 2, "needs a catalog with at least two products");

  await expect(page.getByRole("button", { name: "Search", exact: true })).toHaveCount(0);
  const [first, second] = [boxes.nth(0), boxes.nth(1)];
  await expect(async () => {
    await first.check();
    await second.check();
    await expect(page.getByRole("button", { name: "Delete rows (2)" })).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });

  await page.getByRole("button", { name: "Delete rows (2)" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Delete 2 products?");
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("Deleted 2 products.");
  expect(deleted).toHaveLength(2);
  // Selection clears. Rows themselves come back on refresh, since the mock deleted nothing.
  await expect(page.getByRole("button", { name: /^Delete rows/ })).toHaveCount(0);
});

// Typing filters on its own after a short pause; no Enter, no button.
test("search filters the list live while typing", async ({ page }) => {
  await page.goto("/admin");
  const search = page.getByPlaceholder("Title or slug");
  // Results replace the list in place; the page must not jump back to the top.
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect(async () => {
    await search.fill("zz-no-such-product");
    await expect(page).toHaveURL(/[?&]q=zz-no-such-product/, { timeout: 3000 });
  }).toPass({ timeout: 30_000 });
  await expect(page.getByText("No products match")).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(300);

  await search.fill("");
  await expect(page).toHaveURL(/\/admin$/);
});
