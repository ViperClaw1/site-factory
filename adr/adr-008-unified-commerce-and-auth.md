---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-11-06
updated: 2026-11-06
aliases: [Unified commerce DB, Unified Auth]
adr-id: "008"
supersedes: ["005", "006"]
superseded-by: []
---

# ADR-008: Unified Commerce Database and Unified Auth

## Status

Approved. One self-hosted Supabase stack in the US serves every site and sales channel. Analytics move to PostHog Cloud US.

Supersedes [[adr-006-ecommerce-stack|ADR-006]] (the per-site Supabase projects, and Stripe) and [[adr-005-analytics|ADR-005]] (Plausible). Amends [[adr-002-cms-strategy|ADR-002]]: Directus now runs on the shared commerce DB.

## Context

- site01 (toys) and site02 (courses) each have their own Supabase schema. Both define `orders`, `order_status` and `set_updated_at()`, so they can't share a database, and the plan was to run a separate Supabase Cloud Pro project for each site.
- With ~20 sites that means 20 user pools, 20 copies of orders and 20 Directus connections. A customer who buys on two sites becomes two people, and nobody can answer "what is this customer's LTV?" or "what did channel X sell?".
- New requirements:
  - checkout from a payment link sent in Telegram, Facebook or Instagram, outside any site;
  - one account across all sites;
  - stock shared across sites and external channels;
  - attribution by channel and campaign.
- Directus works with one database per instance, and it should manage the catalog and stock, not only editorial content.

## Options

### Option A: one Supabase Cloud Pro project per site (previous plan)

| Pros | Cons |
|------|------|
| No ops | N user pools, N order tables, no cross-site customer |
| Isolation between sites | Stock can't be shared across sites and channels |
| | One Directus per DB, or Directus without the catalog |
| | Cost grows linearly with the number of sites |

### Option B: one self-hosted Supabase stack for all sites (chosen)

| Pros | Cons |
|------|------|
| One customer, one order history, one stock figure | We run Postgres ourselves: backups, PITR, upgrades |
| One Directus over the catalog and content of every site | A noisy site can hurt the others, so per-site pool limits are needed |
| Fixed cost, US region under our control | One schema for all sites needs migration discipline |

## Decision

**Database**
- One Supabase self-hosted stack on a US VPS (Hetzner Ashburn or Hillsboro), plus a small staging server. Per-site Cloud Pro projects are cancelled.
- One schema, `public`. Directus has bugs with multiple schemas via `DB_SEARCH_PATH` ([directus#5397](https://github.com/directus/directus/issues/5397)), and PostgREST exposes `public` by default. `directus_*` tables are `REVOKE`d from `anon` and `authenticated`.
- Migrations live in one package, `packages/db/supabase/migrations`, and CI runs `supabase db push` only from there. The per-site migrations in `apps/*/supabase/migrations` are frozen. The new schema starts from a fresh baseline: there are no real orders to migrate, only the catalog (site01) and courses (site02).

**Customers and identity**
- One user pool for every site and channel.
- `customers` is its own entity, linked to `auth.users` by a nullable unique `auth_user_id`. Emails, phones and Telegram/Google/Apple IDs live in `customer_identities`, and only verified identifiers are linked.
- Consents (analytics, marketing email/SMS) go to an append-only `consents` table with the text version, source and region.

**Commerce**
- Carts belong to each site (`carts.site_id`). Orders are shared and carry `site_id`, `channel`, `campaign` and an optional `payment_link_id`.
- Money is stored in minor units (`bigint`), as in PayMesh and the dashboard. The default currency is USD.
- Stock lives in `product_variants` (`stock`, `reserved`, `allocated_external`, generated `available`), and every change is logged in `stock_movements`. Reservation and order creation happen in one transaction inside a `SECURITY DEFINER` function that only `service_role` can execute.
- Payments go through PayMesh. Its webhook confirms the order, and `GET /payments/{id}` is the fallback. Stripe from ADR-006 is not used.
- Side effects (CRM copy, analytics server events, email) go through an `outbox` table, never inline in the request.

**CMS**
- One Directus runs on top of the same database and manages the catalog, stock and editorial content for every site.

**Analytics**
- PostHog Cloud US, proxied through a first-party subdomain (`e.<brand>`) to cut ad-blocker losses. It is not self-hosted, because ClickHouse would compete with Postgres for resources, and Cloud is cheaper at our volume.
- `distinct_id` = `customers.id`. Revenue events (`order_paid`, refunds) are sent server-side from `outbox`.
- Money and LTV are computed in the commerce DB (views). PostHog is used for funnels, paths, cohorts and session recordings.
- Plausible is retired. We don't run two systems for the same events.
- A consent banner (CMP) is required: opt-in in the EU, opt-out with GPC support in the US.

## Consequences

- Roadmap:
  1. this ADR and doc fixes;
  2. infra: server, PITR backups (`wal-g`/`pgBackRest` to external S3), Supavisor with per-site limits, provider firewall;
  3. unified schema + pgTAP tests;
  4. auth and checkout by link (email OTP as the primary login, `pay.<brand>/l/<slug>`);
  5. CMP and analytics.

  The B2B company graph is a separate module next to the dashboard and doesn't depend on this.
- `docs/deploy-supabase-vps.*` (two stacks) is valid only until the baseline in `packages/db` ships, and will then be rewritten for one stack.
- `SUPABASE_SERVICE_ROLE_KEY` must never reach a client bundle. All state-changing functions are `SECURITY DEFINER` with `EXECUTE` granted only to `service_role`.
- `anon` reads only the catalog and `available`. `product_variants` internals and `lesson_content` are closed by RLS.
- Admin roles live in `app_metadata` and are scoped to a site.
- External blockers: PayMesh credentials, domains and DNS, a transactional email provider, the US VPS, a PostHog Cloud US account.

## Related

- [[adr-002-cms-strategy]]
- [[adr-005-analytics]]
- [[adr-006-ecommerce-stack]]
- [[Implementation_Plan_v2]]
