---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-11-10
updated: 2026-11-10
aliases: [Locale routing, Language addresses, hreflang]
adr-id: "010"
supersedes: []
superseded-by: []
---

# ADR-010: A Separate Address for Every Language

## Status

Approved and implemented in both sites (branch `feat/locale-routes`, merged into `main`). This ADR records the decisions behind the implementation.

## Context

- The ecosystem rules require 19 languages on every site from day one, English as the default and the source of translations, and every language as its own page, because search engines don't see a translation applied in the browser (rules 15–16).
- site01 kept the language in `localStorage`, and the server always rendered English. site02 kept it in a cookie read by the root layout. That made every page dynamic, and one address served all languages. Neither site had `hreflang` or a self-referencing `canonical`.
- The language registry was duplicated in both sites, in a different order from the rules, and Portuguese was tagged `pt-PT` while the rules say Brazilian.

## Decision

- Every language has an address prefix, including English: `/en/…`, `/de/…`. The segment is the language code in lower case.
- `hreflang` and `<html lang>` values come from the registry:
  - language only: `en`, `de`, `fr`, `es`, `it`, `tr`, `ru`, `ja`, `ko`, `ar`, `id`, `hi`, `vi`, `th`, `sw`, `ha`, `am`;
  - with a region: `pt-BR`, `zh-CN`.
  - Spanish stays region-free until the rules decide its variant.
- Redirects:
  - `/` negotiates the language: cookie `lang`, then `Accept-Language`, then `en`. The response is a 307 with `Cache-Control: private, no-store`, so neither a CDN nor the browser keeps a visitor's language.
  - An old address without a prefix moves permanently (308) to the saved or default language and keeps the query.
  - A segment shaped like an unsupported language (`/xx/…`) returns 404.
- Every page has a self-referencing `canonical` and an `hreflang` link to every language plus `x-default` (`/`). The sitemap lists every language version with its siblings.
- Slugs are the same in all languages. Model names and brands are not translated (rules).
- Addresses without a language:
  - `/api/*`;
  - `/auth/callback` (registered in the Supabase Redirect URLs);
  - `/admin`;
  - `/stats/*` (analytics proxy);
  - `/_next/*` and any file (`robots.txt`, `sitemap.xml`, `/brand/*`).
- A shared package `packages/i18n` holds:
  - the registry in the order of the rules;
  - the routing helpers `withLocale`, `stripLocale`, `localeOf`, `pickLocale`;
  - metadata (`alternates`, `sitemapEntries`, `localizedPaths`);
  - the middleware;
  - the locale-aware `Link` and router;
  - the shared language menu (flag as SVG, native name, code, as rule 04 requires);
  - the shared Playwright suite `locale-suite`.
  - Dictionaries stay in each site's `lib/i18n/`.
- Pages render on the server from `params.locale`. The language is not read from cookies in layouts, so pages can be cached per language (ISR).
- Cache invalidation purges every language of a path (`localizedPaths`).
- An own thin package was chosen over next-intl. The dictionaries already existed in two shapes in 19 languages, and the need was mostly routing.

## Consequences

- Each language is a separate cache entry: 19 × number of pages per site. Product and course pages are generated on demand, not at build time.
- `<html lang>` and `dir` come from the language segment, so RTL works for Arabic on the server.
- Still to do under the rules:
  - Arabic numerals via `ar-u-nu-latn` in `Intl` formatting;
  - `lang="en"` on brand and model names inside uppercase Turkish text;
  - system fonts for CJK, Thai, Arabic, Amharic and Hindi;
  - course content in English as the source language, translated into all 19 languages. Today the base columns are Russian, and 7 languages are translated;
  - product texts per language from the catalog standard (`texts.<lang>`, ADR-008).
- Until a page's content is translated, the language version shows the interface in that language and the content in English. Before indexing is switched on, such versions get `noindex` or are not listed in the sitemap.
- New links must go through the locale-aware `Link` or router. A raw `next/link` to an internal path is a review finding.

## Related

- [[adr-004-rendering-strategy]]
- [[adr-008-unified-commerce-and-auth]]
- `docs/conventions.md`, section on languages
- `path-ecosystem-rules`, rules 04, 15, 16
