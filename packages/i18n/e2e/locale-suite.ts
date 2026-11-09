import { expect, test } from "@playwright/test";
import { LOCALES, isLocaleFree, localizedPaths, pickLocale, sitemapEntries, stripLocale, withLocale } from "../src";

interface SuiteOptions {
  // Public page with a query-free address, without the language prefix.
  page: string;
  // Page a guest gets bounced from to the login form.
  protectedPage: string;
  // Interface text that only the German dictionary contains.
  germanText: string;
}

// Locale routing checks shared by every site that uses @repo/i18n.
export function registerLocaleTests({ page: samplePage, protectedPage, germanText }: SuiteOptions) {
  test("routing helpers", () => {
    expect(withLocale("/", "de")).toBe("/de");
    expect(withLocale("/shop?sort=new#top", "de")).toBe("/de/shop?sort=new#top");
    expect(withLocale("/#pricing", "fr")).toBe("/fr#pricing");
    expect(withLocale("/de/shop", "fr")).toBe("/fr/shop");
    expect(withLocale("/de", "fr")).toBe("/fr");
    // A segment that merely starts like a language is not one.
    expect(withLocale("/design", "fr")).toBe("/fr/design");

    for (const href of ["/admin", "/admin/x", "/api/health", "/auth/callback?next=/x", "/brand/logo.webp", "https://a.b", "//a.b", "#top"]) {
      expect(withLocale(href, "de")).toBe(href);
    }
    expect(isLocaleFree("/administrator")).toBe(false);

    expect(stripLocale("/de")).toBe("/");
    expect(stripLocale("/de/shop")).toBe("/shop");
    expect(stripLocale("/design")).toBe("/design");

    expect(pickLocale("fr", "de")).toBe("fr");
    expect(pickLocale("xx", "de")).toBe("de");
    expect(pickLocale(null, "xx, pt-PT;q=0.5, de;q=0.9")).toBe("de");
    expect(pickLocale(null, "zh-TW")).toBe("zh");
    expect(pickLocale(null, "de;q=0")).toBe("en");
    expect(pickLocale(null, null)).toBe("en");

    expect(localizedPaths("/shop")).toHaveLength(LOCALES.length);
    expect(localizedPaths("/admin")).toEqual(["/admin"]);

    const [entry] = sitemapEntries("https://x.test", "/shop");
    expect(entry?.url).toBe("https://x.test/en/shop");
    expect(entry?.alternates?.languages).toMatchObject({ "pt-BR": "https://x.test/pt/shop", "x-default": "https://x.test/" });
  });

  test("root negotiates the language and is never cached", async ({ request }) => {
    const root = (headers: Record<string, string>) => request.get("/", { headers, maxRedirects: 0 });

    const accept = await root({ "accept-language": "de" });
    expect(accept.status()).toBe(307);
    expect(accept.headers().location).toBe("/de");
    expect(accept.headers()["cache-control"]).toBe("private, no-store");

    expect((await root({ "accept-language": "de", cookie: "lang=fr" })).headers().location).toBe("/fr");
    expect((await root({ "accept-language": "" })).headers().location).toBe("/en");
  });

  test("old addresses move permanently and keep the query", async ({ request }) => {
    const plain = await request.get(`${samplePage}?a=1`, { maxRedirects: 0 });
    expect(plain.status()).toBe(308);
    expect(plain.headers().location).toBe(`/en${samplePage}?a=1`);

    const saved = await request.get(samplePage, { maxRedirects: 0, headers: { cookie: "lang=fr" } });
    expect(saved.headers().location).toBe(`/fr${samplePage}`);
  });

  test("an unknown language prefix is a 404", async ({ request }) => {
    expect((await request.get(`/xx${samplePage}`, { maxRedirects: 0 })).status()).toBe(404);
  });

  test("addresses outside the prefix are left alone", async ({ request }) => {
    for (const path of ["/api/health", "/robots.txt", "/sitemap.xml"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBeLessThan(300);
    }
    // The Plausible proxy must reach its rewrite instead of a language redirect.
    expect((await request.post("/stats/api/event", { maxRedirects: 0, data: {} })).status()).not.toBe(308);
  });

  test("html carries the language and direction", async ({ page }) => {
    await page.goto(`/de${samplePage}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    await page.goto(`/pt${samplePage}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");

    await page.goto(`/ar${samplePage}`);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("the server already answers in the requested language", async ({ request }) => {
    const [en, de] = await Promise.all([request.get(`/en${samplePage}`), request.get(`/de${samplePage}`)]);
    expect(await de.text()).toContain(germanText);
    expect(await en.text()).not.toContain(germanText);
  });

  test("canonical and hreflang are absolute and every target answers", async ({ page, request }) => {
    // 20 uncached server renders in a row.
    test.setTimeout(120_000);
    await page.goto(`/de${samplePage}`);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical!).pathname).toBe(`/de${samplePage}`);

    const links = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((nodes) =>
      nodes.map((node) => ({ lang: node.getAttribute("hreflang")!, href: node.getAttribute("href")! })),
    );
    expect(links.map((link) => link.lang).sort()).toEqual(
      [...LOCALES.map((locale) => locale.tag), "x-default"].sort(),
    );
    for (const link of links) {
      expect(link.href, link.lang).toMatch(/^https?:\/\//);
      expect((await request.get(link.href)).status(), link.href).toBe(200);
    }
  });

  test("language links keep the page and the query", async ({ page }) => {
    await page.goto(`/de${samplePage}?a=1`);
    const link = page.locator('footer a[hreflang="fr"]');
    await expect(link).toHaveAttribute("href", `/fr${samplePage}`);
    await link.click();

    await expect(page).toHaveURL(new RegExp(`/fr${samplePage}\\?a=1$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    expect((await page.context().cookies()).find((cookie) => cookie.name === "lang")?.value).toBe("fr");
  });

  test("guests go to the login form in their language", async ({ page }) => {
    await page.goto(`/de${protectedPage}`);
    await page.waitForURL(/\/login\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/de/login");
    expect(url.searchParams.get("next")).toBe(`/de${protectedPage}`);
  });

  test("home links carry the language prefix", async ({ page }) => {
    await page.goto("/de");
    const hrefs = await page.locator("a[href^='/']").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThan(0);

    const missing = hrefs.filter((href) => {
      const path = href.split(/[?#]/)[0]!;
      return !isLocaleFree(path) && !/^\/[a-z]{2}(?:\/|$)/.test(path);
    });
    expect(missing).toEqual([]);
  });
}
