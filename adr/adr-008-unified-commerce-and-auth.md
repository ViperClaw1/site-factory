---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-11-06
updated: 2026-11-12
aliases: [Unified commerce DB, Unified Auth]
adr-id: "008"
supersedes: ["006"]
superseded-by: []
---

# ADR-008: Unified Commerce Database and Unified Auth

## Status

Approved by the site-factory team on 2026-11-06, amended 2026-11-10 and 2026-11-12 (see [Amendments](#amendments)). The customer has not confirmed the choice of one database over separate ones; the requirements it rests on (one account, purchase in any channel, one customer history, shared stock across channels) come from the customer's answers of 27.10, 05.11 and 06.11 recorded in `path-ecosystem-rules`.

One self-hosted Supabase stack on our server in Germany (netcup, Nuremberg) serves every site and sales channel. No cloud services hold our data: database, files and backups stay on our servers (decision of 12.11). Analytics: [[adr-005-analytics|ADR-005]] (revised 12.11), self-hosted or none.

Supersedes [[adr-006-ecommerce-stack|ADR-006]] (the per-site Supabase projects, and Stripe). Amends [[adr-002-cms-strategy|ADR-002]]: Directus moves to the shared commerce DB. The analytics part of the 06.11 version (PostHog Cloud US) is withdrawn and returned to ADR-005.

## Context

- site01 (toys) and site02 (courses) each have their own Supabase schema. Both define `orders`, `order_status` and `set_updated_at()`, so they can't share a database, and the plan was to run a separate Supabase Cloud Pro project for each site.
- With ~20 sites that means 20 user pools, 20 copies of orders and 20 Directus connections. A customer who buys on two sites becomes two people, and nobody can answer "what is this customer's LTV?" or "what did channel X sell?".
- Requirements from the ecosystem rules:
  - purchase in any sales channel, including a payment link in Telegram, Facebook or Instagram, outside any site (rule 01, 06.11);
  - one account across all sites, mandatory for purchase (rule 05, 06.11);
  - products do not overlap between sites: each product belongs to exactly one site, but is sold in every channel, and its stock is shared across those channels in real time (rule 02, 27.10 and 05.11);
  - accounting in our own database; external platforms are only sales channels (rule 02, 28.10);
  - one customer with the purchase history of all sites (rule 05, 06.11);
  - attribution by channel and campaign.
- Directus works with one database per instance, and it should manage the catalog and stock, not only editorial content.
- Reliability (rule 05, 05.11): the system runs around the clock, backups are continuous and stored separately, and the failure of one server or site must not stop the rest.

## Options

### Option A: one Supabase Cloud Pro project per site (previous plan)

| Pros | Cons |
|------|------|
| No ops | N user pools, N order tables, no cross-site customer |
| Isolation between sites | A channel order (payment link) has no site database to land in without routing |
| | One Directus per DB, or Directus without the catalog |
| | Cost grows linearly with the number of sites |

### Option B: one self-hosted Supabase stack for all sites (chosen)

| Pros | Cons |
|------|------|
| One customer, one order history, one stock figure per product across channels | We run Postgres ourselves: backups, PITR, upgrades |
| One Directus over the catalog and content of every site | One database is a shared point of failure (mitigated below) |
| Fixed cost, US region under our control | A noisy site can hurt the others, so per-site limits are needed |
| | One schema for all sites needs migration discipline |

### Option C: a database per site plus a read-only summary for dashboards

Raised on 05.11, when it became clear that products don't overlap between sites: each site keeps its own stock and orders, and dashboards read a merged view.

| Pros | Cons |
|------|------|
| A failing database stops only its own site | One account across sites still needs a separate shared sign-in service and customer store |
| Smaller blast radius for migrations | Orders from shared channels (payment links, bots, marketplaces) must be routed to the right site database |
| | One Directus per database: N instances, N configurations |
| | Customer history and LTV only exist in the summary, not in the source of truth |

Rejected: the shared account and customer history would require a second shared store anyway, so C ends up with N+1 databases and cross-database consistency problems. The reliability argument for C is addressed inside B (see Reliability).

## Decision

**Database**
- One Supabase self-hosted stack on our server in Germany (netcup, Nuremberg), plus a small staging server. Per-site Cloud Pro projects are cancelled. The infrastructure is in DE; content and legal texts target the US and Commonwealth markets ([[adr-013-launch-markets|ADR-013]]).
- Today (12.11): Directus runs on the shared instance `shared-infra-postgres` (image `pgvector/pgvector:pg16`, PostgreSQL 16.14), database `directus`, runtime role `directus_app` without DDL rights. The Supabase stack is deployed but not working. When it works, the `directus` database moves into the Postgres of the Supabase stack (`pg_dump`/`pg_restore`, schema `public`) and Directus is switched over. Supabase Auth, Storage and RLS need the `supabase/postgres` image, so the reverse (commerce inside `shared-infra-postgres`) is not possible.
- Reference tables (sites, legal entities, categories, countries, languages, legal documents) are created by the same migrations before the move, in the `directus` database: see [[adr-012-reference-data|ADR-012]].
- One schema, `public`. Directus has bugs with multiple schemas via `DB_SEARCH_PATH` ([directus#5397](https://github.com/directus/directus/issues/5397)), and PostgREST exposes `public` by default. `directus_*` tables are `REVOKE`d from `anon` and `authenticated`.
- Migrations live in one package, `packages/db/supabase/migrations`, and CI runs `supabase db push` only from there. The per-site migrations in `apps/*/supabase/migrations` are frozen. The new schema starts from a fresh baseline: there are no real orders to migrate, only the catalog (site01) and courses (site02).
- Every product has exactly one `site_id`. There is no product-to-many-sites table.

**Catalog contract**
- The schema is built from the catalog standard, `05-shablony/katalog/katalog.schema.json` in `Path-platform-standards`, not designed separately. Mapping:
  - the file's top-level `catalog` is the code of the ecosystem catalog (the standard has one catalog for the ecosystem), not a site. A product's site comes from its category: `categories.site_id` ([[adr-012-reference-data|ADR-012]]);
  - `mode` (`merge` | `replace`) decides whether items absent from a `replace` file are archived;
  - `items[].sku` → `product_variants.sku`, unique across the ecosystem;
  - `price_usd` → price in minor units;
  - `type` (`physical` | `digital` | `service`): only `physical` has stock; `quantity` is optional;
  - `not_sold_to` → country restriction checked inside order creation;
  - `texts.<lang>` with `source: machine | human` → a translations table, English as the source language;
  - `images`, `videos`, `audio` with `rights` → media with the rights source and who confirmed it.
- Imports set stock through a function that writes `stock_movements` (`reason = 'import'`), never by a direct `UPDATE`. See [[adr-011-catalog-upload-format|ADR-011]] for the upload format.

**Customers and identity**
- One user pool for every site and channel.
- `customers` is its own entity, linked to `auth.users` by a nullable unique `auth_user_id`. Emails, phones and Telegram/Google/Apple IDs live in `customer_identities`, and only verified identifiers are linked.
- Consents (analytics, marketing email/SMS) go to an append-only `consents` table with the text version, source and region. Withdrawing consent works the same way as giving it.
- The shared sign-in domain is not decided (standards, question 2). Until it is, each site signs in on its own domain against the same user pool.

**Commerce**
- Carts belong to each site (`carts.site_id`). Orders are shared and carry `site_id`, `channel`, `campaign` and an optional `payment_link_id`.
- Money is stored in minor units (`bigint`), as in PayMesh and the dashboard. The only currency is USD (rule 01).
- Stock lives in `product_variants` (`stock`, `reserved`, `allocated_external`, generated `available`), and every change is logged in `stock_movements`. Reservation and order creation happen in one transaction inside a `SECURITY DEFINER` function that only `service_role` can execute. External channels get a share of stock through `channel_allocations`; accounting stays in this database (rule 02, 28.10).
- Payments go through PayMesh. Its webhook confirms the order, and `GET /payments/{id}` is the fallback. Stripe from ADR-006 is not used.
- Payment acceptance is switched on per site with `PAYMENTS_ENABLED`. Until the legal entity that accepts the money is decided (rules, O-3), it is off and a purchase is recorded as a request (`inquiry`) in the CRM. A button that does nothing is not allowed (rule 06).
- A product without a price is a request for a quote, not an order (rule 01).
- The order total includes a "duties and taxes" line; until the calculation method is decided (rules, O-2) it is an estimate and is labelled as such.
- A payment link lives on the domain of the site that owns the product (`<site>/pay/l/<slug>`). There is no shared payment domain: sites have their own brands (rule 21), and a checkout on a foreign domain looks like phishing.
- Side effects (CRM copy, analytics server events, email) go through an `outbox` table, never inline in the request.

**CMS and files**
- One Directus runs on top of the same database and manages the catalog, stock and editorial content for every site.
- No cloud object storage. Directus files stay on a local volume (`STORAGE_LOCATIONS=local`). Private media (digital goods, course videos) and anything that needs an S3 API go to self-hosted MinIO on our server: only the endpoint and keys differ, the code (`@aws-sdk/client-s3`, signed URLs) stays the same. Cloudflare R2 is not used; production media is not kept there. `packages/lib/src/r2.ts` and the `R2_*` variables are renamed to a generic S3 client and `S3_*`.

**Analytics and consent**
- The tool is decided in [[adr-005-analytics|ADR-005]] (revised 12.11): self-hosted on our server, or no analytics tool. Cloud analytics (PostHog Cloud) is not used.
- Whatever the tool, the user id is `customers.id`, revenue events (`order_paid`, refunds) are sent server-side from `outbox`, and money and LTV are computed in the commerce DB (views), not in the analytics tool.
- Consent banner (CMP): optional cookies, analytics and tracking start only after consent, on every site and in every region (rule 05). Opt-out in the US is an open question for the customer (rules, O-10); until it is answered, consent-first applies everywhere. Children's sites never get session recordings or advertising pixels, with or without consent.

**Languages**
- Every page has a language-prefixed address; see [[adr-010-locale-routing|ADR-010]].

**Reliability**
- Continuous WAL archiving with point-in-time recovery (`wal-g` or `pgBackRest`) to our second server, not to a cloud. Target RPO ≤ 5 minutes. Daily dumps with sha256 checks continue, as already done for the `directus` database (cron `/etc/cron.d/vibecod-backup-directus`, 03:40, offsite to a separate host).
- A streaming hot standby on our second server, in a different data centre from the primary. Promotion is manual by runbook; target RTO ≤ 1 hour. Automatic failover (Patroni) is deferred until load requires it.
- RPO and RTO values are a proposal; the customer confirms them.
- Isolation between sites: a Supavisor pool size per site; a database role per site with its own `statement_timeout`; each site in its own container.
- Degradation when the database is down: catalog pages are served from the ISR cache (and from a CDN, if one is approved: see Consequences); checkout and sign-in are switched off with a clear message.
- A restore from backup is test-deployed every month; a backup that was never restored does not count.

## Consequences

- Roadmap (numbering as in `Implementation_Plan_v2.md`):
  - 1 — this ADR and doc fixes;
  - 2.5 — infra: server and standby, PITR backups to external S3, Supavisor with per-site limits, provider firewall;
  - 2 — unified schema from the catalog standard + pgTAP tests;
  - 3 — auth and checkout by link (email OTP as the primary login, `<site>/pay/l/<slug>`);
  - 4 — CMP and analytics;
  - 6 — the B2B company graph, a separate module next to the dashboard; it doesn't depend on this.
- `docs/deploy-supabase-vps.*` (two stacks) is valid only until the baseline in `packages/db` ships, and will then be rewritten for one stack. Release and deployment: [[adr-009-release-and-deployment|ADR-009]].
- `SUPABASE_SERVICE_ROLE_KEY` must never reach a client bundle. All state-changing functions are `SECURITY DEFINER` with `EXECUTE` granted only to `service_role`.
- `anon` reads only the catalog and `available`. `product_variants` internals and `lesson_content` are closed by RLS.
- Admin roles live in `app_metadata` and are scoped to a site.
- Countries that require local storage of citizens' data (Russia first) are not served by this database. Whether they are sales markets is open (rules, O-1); if they are, a separate regional contour is added.
- Visitors are in the US and Commonwealth countries, servers are in Germany: every uncached request crosses the Atlantic or further (about 100 ms to the US East Coast, more to Australia and New Zealand). Pages must be served from the ISR cache; whether a CDN in front of the sites counts as "cloud" is open.
- A data processing agreement (AVV/DPA) with netcup is needed for personal data on its servers.
- External services that cannot be self-hosted stay external and are listed explicitly: the payment provider, the transactional email provider (deliverability), Google sign-in, DNS. They hold only the data needed for their function.
- Payments at launch (customer, 11.11): leading payment providers first, our own financial platform later; PayMesh only after the legal entity exists and with a banking licence or bank agreement. The provider is chosen with the legal entity (O-3); until then `PAYMENTS_ENABLED` is off.
- External blockers: a working Supabase stack on the netcup server, the standby server, PayMesh credentials and a named maintainer for PayMesh (it is not deployed and has no maintainer as of 15.09), domains and DNS, a transactional email provider, the analytics decision (ADR-005), the legal entity for payments (O-3).

## Amendments

### 2026-11-12

Approved decision package of 12.11:

- Region: Germany (netcup, Nuremberg) instead of a US VPS. Content and legal texts still target the US and Commonwealth (ADR-013).
- No cloud for our data: files on a local volume or self-hosted MinIO; backups to our second server; Cloudflare R2 dropped.
- Analytics: PostHog Cloud US withdrawn; the decision returns to ADR-005 (self-hosted or none). ADR-008 no longer supersedes ADR-005.
- Current state recorded: Directus on `shared-infra-postgres`, database `directus`, role `directus_app`; the Supabase stack is not working yet; Directus moves into the commerce DB when it does.
- Catalog mapping corrected: `catalog` is the ecosystem catalog code, not the site; a product's site comes from its category; `mode` is `merge | replace`.
- Reference tables: ADR-012. Launch markets: ADR-013.
- Consequences: latency from DE to the US and Commonwealth, DPA with netcup, explicit list of external services, payments at launch through leading providers (11.11).

### 2026-11-10

Aligned with the ecosystem rules (05.11, 06.11) and the platform standards (decision 0002):

- Status names who approved the ADR and that the customer has not confirmed it.
- Context: products don't overlap between sites; stock is shared across channels, not across sites; accounting stays in our own database; reliability requirements.
- Option C (a database per site plus a summary) added with the reason it was rejected.
- Decision:
  - one `site_id` per product, no product-to-many-sites table;
  - the schema is built from `katalog.schema.json`;
  - USD is the only currency, not just the default;
  - `PAYMENTS_ENABLED` per site, a request instead of payment until O-3 is closed;
  - a quote request for products without a price;
  - a labelled duties-and-taxes estimate;
  - payment links on the product's own site domain instead of `pay.<brand>`, and a PostHog proxy subdomain per site instead of `e.<brand>`;
  - consent-first everywhere until O-10 is answered (was opt-out in the US);
  - a Reliability section;
  - a Languages pointer to ADR-010.
- Consequences: roadmap numbering as in `Implementation_Plan_v2.md`; data-residency limit; PayMesh maintainer and standby server added to the blockers.

## Related

- [[adr-002-cms-strategy]]
- [[adr-005-analytics]]
- [[adr-006-ecommerce-stack]]
- [[adr-009-release-and-deployment]]
- [[adr-010-locale-routing]]
- [[adr-011-catalog-upload-format]]
- [[adr-012-reference-data]]
- [[adr-013-launch-markets]]
- [[Implementation_Plan_v2]]
- `path-ecosystem-rules`: rules 01, 02, 05, 06; open questions O-1, O-2, O-3, O-10
- `Path-platform-standards`: decision 0002; catalog standard
