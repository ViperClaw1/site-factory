---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-07-17
aliases: []
adr-id: "002"
supersedes: []
superseded-by: []
---

# ADR-002: Headless CMS Strategy

## Status

Approved — Directus (self-hosted, single instance) chosen.

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

Approved. Directus self-hosted on VPS via Coolify.

**Rationale**:
1. Zero SaaS cost — VPS already exists
2. Single instance handles all 20 sites via `site_id` isolation
3. Webhook → ISR revalidation pipeline: content change live in < 60s without redeploy
4. Non-technical editors use Directus UI to manage content per site
5. PostgreSQL JSONB blocks allow flexible page structure without schema migrations per site

## Consequences

- VPS must have sufficient resources for Directus + PostgreSQL alongside 20 Next.js containers
- Backup strategy required: daily `pg_dump` + Cloudflare R2 upload (see [[Environment Setup]])
- Directus upgrade path must be tested on staging before production

## Related

- [[adr-003-deployment-strategy]]
- [[adr-004-rendering-strategy]]
- [[Site Factory Architecture]]
