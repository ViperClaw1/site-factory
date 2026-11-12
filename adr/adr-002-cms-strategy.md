---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-11-12
aliases: []
adr-id: "002"
supersedes: []
superseded-by: []
---

# ADR-002: Headless CMS Strategy

## Status

Approved — Directus (self-hosted, single instance) chosen.

Amended by [[adr-008-unified-commerce-and-auth|ADR-008]]: Directus moves to the shared commerce database and also manages the catalog and stock. Amended 2026-11-12: files and backups stay on our servers (no Cloudflare R2), deployment is not through Coolify (ADR-009). Current state below.

## Context

20 sites need a CMS for content management. Non-technical team members must be able to edit content (text, images, blocks) without code changes. Content updates must propagate to sites within 60 seconds without a redeploy.

## Options

### Option A: Directus (self-hosted)

| Pros | Cons |
|------|------|
| Single instance serves all 20 sites (isolated by `site_id`) | Requires VPS maintenance |
| No SaaS costs — runs on existing VPS | Initial setup time |
| REST + GraphQL API auto-generated from schema | |
| Webhook support for ISR revalidation | |
| PostgreSQL underneath — full SQL power, JSONB blocks | |
| Role-based access: per-site editors can only see their site's content | |

### Option B: Sanity.io (SaaS)

| Pros | Cons |
|------|------|
| Managed, no ops | Per-seat pricing, costs scale with team size |
| Excellent DX | Vendor lock-in |
| Real-time collaborative editing | 20 projects = separate Sanity projects or complex dataset sharing |

### Option C: Contentful (SaaS)

| Pros | Cons |
|------|------|
| Mature product | Expensive at scale (20 sites) |
| Good API | Vendor lock-in |
| | Less flexible schema than Directus |

### Option D: No CMS (content in code / MDX)

| Pros | Cons |
|------|------|
| Zero ops | Developers required for every content change |
| Git history for content | Non-technical team cannot edit |
| | Redeploy required for content updates |

## Decision

Approved. Directus self-hosted on our server.

**State on 2026-11-12**:
- Instance `cms.vcpath.us`, Directus 12.2.0.
- Database `directus` in the shared instance `shared-infra-postgres` (image `pgvector/pgvector:pg16`, PostgreSQL 16.14). Runtime role `directus_app` has no DDL rights. It moves into the commerce DB when the Supabase stack works (ADR-008).
- The structure is locked in the admin UI. It changes only by migration or script, together with `docs/directus-snapshot.yaml`.
- Collections: `sites`, `pages`, `blocks`, `collections`, `characters`, `instructors`. File fields (`image`, `hero_image`, `seo_image`) are relations to `directus_files`; the frontend builds URLs with `getDirectusAssetUrl(...)`.
- Files on a local volume (`STORAGE_LOCATIONS=local`). If an S3 API is needed, self-hosted MinIO; only the endpoint and keys change.
- `CORS_ORIGIN` lists the sites' domains. A new domain is added to `DIRECTUS_CORS_ORIGIN` and the container is recreated.
- Statuses: `draft` / `published` (`pages` also `archived`), default `draft`.

**Rationale**:
1. Zero SaaS cost — VPS already exists
2. Single instance handles all 20 sites via `site_id` isolation
3. Webhook → ISR revalidation pipeline: content change live in < 60s without redeploy
4. Non-technical editors use Directus UI to manage content per site
5. PostgreSQL JSONB blocks allow flexible page structure without schema migrations per site

## Consequences

- VPS must have sufficient resources for Directus + PostgreSQL alongside 20 Next.js containers
- Backups (in place): daily at **09:00 UTC** (systemd timer `vibecod-backup-directus.timer`, `OnCalendar=*-*-* 09:00:00 UTC`, DST-proof; the former cron entry is disabled), script `/usr/local/sbin/vibecod-backup-directus`: `pg_dump` of the database, an archive of uploads, the schema snapshot, cluster roles and the `.env`; locally in `/var/backups/directus` and offsite on a separate host, with sha256 checks. No cloud storage. A restore must be test-deployed monthly; the first restore test is required before the first production release (ADR-008, Reliability).
- Fixes from the 12.11 snapshot (ADR-012): a database foreign key `blocks.page → pages ON DELETE CASCADE` (today the relation exists only in Directus metadata); unique `(site, slug)` for `pages`; a `site` relation for `characters` and `collections`; `CHECK` constraints on `status`; translation tables for content.
- Directus upgrade path must be tested on staging before production

## Related

- [[adr-003-deployment-strategy]]
- [[adr-004-rendering-strategy]]
- [[Site Factory Architecture]]
