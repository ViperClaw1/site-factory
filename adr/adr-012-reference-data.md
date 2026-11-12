---
tags: [project/task-4-site-factory, type/adr, status/proposed]
project: "Task 4 - Site Factory"
status: proposed
created: 2026-11-12
updated: 2026-11-12
aliases: [Reference data, Data ownership, Справочники]
adr-id: "012"
supersedes: []
superseded-by: []
---

# ADR-012: Reference Data in the Commerce Database and Data Ownership

## Status

Proposed.

- **Agreed 11.11 by the infrastructure owner:**
  - no separate store for shared data;
  - reference tables live in `packages/db`, are edited in Directus, and their types are generated in CI;
  - legal documents come first, before the consent banner;
  - a CRM lead refers to `customers.id`, with no copy of the customer.
- **This ADR records** the ownership map, the triggers for a separate store, and the fields of the reference tables.

## Context

- **Shared data that is hard-coded today:**
  - site01 categories in `lib/catalog-taxonomy.mjs` and `shop-categories.ts`, used in 10 files;
  - site02 course sections as a `CHECK` in `20261111000000_course_sections.sql`;
  - legal texts in the interface dictionaries of each site.
- **Missing:** there is no country list for `not_sold_to`, delivery and duties.
- **Directus snapshot of 12.11:**
  - `sites` already exists (`slug`, `domain`, `name`, `theme`);
  - `characters` and `collections` have no site;
  - `blocks.page` has no database foreign key;
  - no collection has translations.
- **Rules that apply:**
  - categories are maintained by the customer (rule 02, O-6);
  - one legal set for the ecosystem, with the site's name filled in (rule 05);
  - legal texts are written per jurisdiction, not translated (decision 12.11);
  - country names are formatted by `Intl`, not stored in dictionaries (rule 04).

## Decision

### No separate store for shared data

- **One database.** Shared data lives in the commerce database (ADR-008) next to the products and orders that reference it, with ordinary foreign keys. Directus edits it.
- **Code stays in packages.** The language registry, components, validation schemas and shared interface strings (`packages/i18n/messages/common.*`) stay in the factory packages.

### Ownership

| Data | Source of truth | Edited by | Copies and references |
|---|---|---|---|
| Customers, accounts, identifiers, consents | commerce DB (`customers`, `customer_identities`, `consents`, `auth.users`) | server functions; the customer through the site | the CRM refers to `customers.id` and keeps no copy |
| Products, variants, stock, stock movements | commerce DB | Directus (catalog, `stock`), uploads in the catalog standard (ADR-011), reservation functions | external channels get a quota (`channel_allocations`) |
| Orders, payments, order items | commerce DB | server functions only | the CRM gets a copy through `outbox` |
| Reference tables (sites, legal entities, categories, countries, languages) | commerce DB | Directus (reference-data admin role) | types generated into `packages/types` |
| Legal documents | commerce DB (`legal_documents`, versioned) | Directus (lawyer, editor); a published version never changes | `consents` refers to the version |
| Content: pages, blocks, news, collections, characters, instructors | commerce DB (moves from the `directus` database) | Directus, an editor role limited to its own site | — |
| Content translations | commerce DB (`*_translations`) | machine translation (status `machine`) + translator (status `reviewed`) | — |
| Files and media | Directus Files on a local volume; private media in self-hosted MinIO | Directus, the admin | — |
| Leads, deals, financial reports | CRM (dashboard, `crm.vcpath.us`) | managers, the parser, PayMesh (`crmreporting`) | a lead refers to `customers.id` |
| Behaviour events | the analytics tool (ADR-005) | — | revenue also as server events from `outbox` |
| Interface strings, language registry, components | factory packages (code) | developers, through pull requests | — |
| Secrets and environment settings | GitHub Environments, `.env` on the server | the deployment owner | — |

### Triggers for a separate store

| Trigger | What to add |
|---|---|
| Sales in a country that requires local storage of citizens' data (Russia first, O-1) | A regional contour: the same schema in that country, its own customers and orders; the catalog is replicated into it |
| Reporting across commerce, CRM, analytics and the parser | A read-only analytical store fed from `outbox` or CDC |
| Read load | A read replica and caching, not a new store |
| The B2B company graph | A separate module next to the CRM (ADR-008, step 6) |
| Sites of different legal entities must have isolated data | A separate stack per legal entity with the same schema |
| Full-text or semantic search over a large catalog | Postgres FTS or pgvector in the same database; an external engine only if that is not enough |

None of these applies today. The B2B graph is planned but not started.

### Table conventions

- **Keys:** `uuid` primary keys, except ISO codes.
- **Common columns:** `created_at` and `updated_at` everywhere.
- **Status values:** enforced by `CHECK` in the database, not only in the Directus UI.
- **Translations:** translatable fields live in `<table>_translations (id, <table>_id, languages_code, …, status machine|reviewed|stale, source_hash, translated_at)`. This is the native translations interface of Directus, so each language is a tab.
- **Structure changes:** created by SQL migrations in `packages/db`. Directus metadata is applied from `docs/directus-snapshot.yaml` after the migrations. The snapshot is re-exported in the same pull request.

### `languages`

- `code` `text` PK (`en`, `de`, …, 19 rows);
- `tag` (`pt-BR`, `zh-CN`, …), `sort`, `rtl` `bool`.
- Seeded from `packages/i18n/src/locales.ts`; CI checks that the two match.

### `sites`

Extends the existing Directus collection (`id`, `slug`, `domain`, `name`, `theme`).

| Field | Type | Purpose |
|---|---|---|
| `slug` | `text` unique | site code (`path-kids`) |
| `name` | `text` | brand (rule 21) |
| `domain` | `text` unique, nullable | null until decided |
| `status` | `closed` \| `public` | closed contour or public launch (rule 06) |
| `legal_entity_id` | FK `legal_entities`, nullable | the seller; null while O-3 is open |
| `payments_enabled` | `bool` default `false` | `PAYMENTS_ENABLED` (ADR-008) |
| `default_locale` | FK `languages`, default `en` | |
| `markets` | `char(2)[]` → `countries` | the site's sales countries (ADR-013) |
| `support_email` | `text` | footer, legal texts |
| `logo` | file | `Organization` JSON-LD, header |
| `social_links` | `jsonb` | footer, `sameAs` in JSON-LD |
| `analytics_host` | `text`, nullable | first-party analytics proxy (ADR-005) |
| `theme` | `jsonb` | theme variables (ADR-007) |
| translations: `tagline`, `seo_title`, `seo_description` | | footer, home page |

### `legal_entities`

Rows are created once O-3 is answered; until then the table is empty.

| Field | Type | Purpose |
|---|---|---|
| `legal_name`, `short_name` | `text` | |
| `country_code` | FK `countries` | the jurisdiction the base legal texts are written for |
| `registration_number`, `tax_id` | `text` | details in the terms and the footer |
| `address` | `jsonb` (`line1`, `line2`, `city`, `region`, `postal_code`, `country_code`) | no fixed address format (localisation standard) |
| `email`, `phone` | `text` | |
| `is_data_controller` | `bool` | the personal-data controller (rule 06) |
| `dpo_contact` | `text`, nullable | where a data protection officer is required |
| `uk_representative`, `eu_representative` | `jsonb`, nullable | UK/EU GDPR art. 27, if selling there without an establishment |
| `status` | `active` \| `inactive` | |

### `categories`

Follows `kategorii.csv` of the catalog standard (`code`, `name`, `fields`).

| Field | Type | Purpose |
|---|---|---|
| `code` | `text`, unique across the ecosystem, the standard's `code` format | the key `items[].category` refers to |
| `site_id` | FK `sites`, not null | a category belongs to one site; a product gets its site from its category (products don't overlap between sites, rule 02) |
| `parent_id` | FK `categories`, nullable | subcategories |
| `fields` | `text[]` | category attributes from the standard; a product's `attributes` are checked against them |
| `sort`, `status` (`draft` \| `published`) | | |
| `image` | file, nullable | category tile |
| translations: `name`, `description`, `seo_title`, `seo_description` | | |

Open for the standards team: can one category code (for example `merch`) belong to two sites? If yes, the upload file needs a site field (per item or per file), which the standard doesn't have today.

### `countries`

Codes and flags only. Names come from `Intl.DisplayNames` (rule 04).

| Field | Type | Purpose |
|---|---|---|
| `code` | `char(2)` PK, ISO 3166-1 alpha-2 | `not_sold_to`, delivery, legal entities |
| `code3` | `char(3)` | |
| `region` | `text` (`EU`, `NA`, `OC`, …) | grouping |
| `sales_enabled` | `bool` | whether we sell there at all (ADR-013; O-1 for `RU`) |
| `consent_model` | `opt_in` \| `opt_out` | banner; `opt_in` everywhere until O-10 is answered |
| `marketing_consent_required` | `bool` | whether marketing email needs prior consent (true for GB, CA, AU, NZ; see ADR-013) |
| `min_consent_age` | `smallint` | age of own consent |
| `data_residency_required` | `bool` | trigger for a regional contour |
| `legal_profile` | `text`, nullable | country profile in `Path-platform-standards/03-strany` |

Seeded with all ISO 3166-1 countries; `sales_enabled` only for the launch markets.

### `legal_documents`

Each jurisdiction and language is its own row, because each is approved separately. Texts are written for a jurisdiction, not translated from another one (12.11).

| Field | Type | Purpose |
|---|---|---|
| `kind` | `terms` \| `privacy` \| `cookies` \| `returns` \| `shipping` \| `seller_info` | |
| `legal_entity_id` | FK `legal_entities`, nullable while drafting | the seller whose jurisdiction the base text follows |
| `jurisdiction` | FK `countries`, nullable | the buyer's country the text is written for; null = base text |
| `locale` | FK `languages` | |
| `version` | `int` | increases per (`kind`, `legal_entity_id`, `jurisdiction`, `locale`) |
| `source_id` | FK `legal_documents`, nullable | the English original of a language version within the same jurisdiction |
| `title`, `body` | `text` (Markdown) | placeholders `{site_name}`, `{site_domain}`, `{support_email}` filled from `sites` when rendered |
| `status` | `draft` \| `in_review` \| `approved` \| `published` \| `retired` | a machine translation is never above `draft` |
| `translation` | `human` \| `machine`, nullable | |
| `approved_by`, `approved_at` | `text`, `timestamptz` | the lawyer who approved it |
| `effective_from`, `published_at` | `timestamptz` | |
| `checksum` | `text` (sha256 of `body`) | `consents` stores `document_id` + `checksum` |

Constraints:
- unique (`kind`, `legal_entity_id`, `jurisdiction`, `locale`, `version`);
- `CHECK`: `published` requires `legal_entity_id` and `approved_at`;
- a trigger forbids changing a `published` row except to `retired`.

A new wording is a new version.

### Fixes to the existing Directus collections

- A database foreign key `blocks.page → pages ON DELETE CASCADE`. Today the relation exists only in Directus metadata.
- `one_deselect_action: delete` for the same relation: `page` is `NOT NULL`, so `nullify` fails.
- Unique (`site`, `slug`) for `pages`; `site` relation and unique (`site`, `slug`) for `characters` and `collections`.
- `CHECK` on `status` in every collection.
- Translation tables for `pages` (`title`, `seo_*`), `blocks` (text fields per block-type registry), `collections`, `characters`, `instructors` (`bio`).

## Consequences

- Order of work: legal documents first, before the consent banner:
  1. `languages`, `countries`, `legal_entities`, `legal_documents`;
  2. `sites` extension and `categories`;
  3. fixes to the content collections.
  - The tables are created now in the `directus` database (`shared-infra-postgres`). They move with it into the commerce DB.
  - Until the move, they have no references to `auth.users`.
- site01 categories move from `lib/catalog-taxonomy.mjs` to `categories`; site02 sections from the `CHECK` to `categories`.
- CI:
  - generates `packages/types/src/db.ts` (`supabase gen types`) and Directus types from the snapshot, and fails on a difference;
  - a nightly job compares the live Directus schema with `docs/directus-snapshot.yaml`.
- Directus roles:
  - reference-data admin;
  - site editor, limited to its own `site`;
  - translator;
  - lawyer, who moves `in_review → approved`.
- Each site gets its own read-only token.

## Related

- [[adr-002-cms-strategy]]
- [[adr-008-unified-commerce-and-auth]]
- [[adr-011-catalog-upload-format]]
- [[adr-013-launch-markets]]
- `docs/directus-schema.md`, `docs/directus-snapshot.yaml`
- `Path-platform-standards`: catalog standard (`05-shablony/katalog/`), country profiles (`03-strany/`)
