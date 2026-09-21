---
tags: [project/task-4-site-factory, type/index, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-09-21
aliases: [Task 4, Site Factory, 20 Sites]
---

# Task 4 — Site Factory (20 Sites)

A monorepo-based factory for building and deploying 20 thematically different sites under a single infrastructure (Turborepo + Coolify + Directus). Each site shares a common Next.js template, UI primitives, and tooling while having its own content, theme, and domain.

## Status

In progress — architecture approved. Infrastructure setup in Phase 1.

## Sites

| # | Site | Domain | Status |
|---|------|--------|--------|
| 01 | Path Animation Marketplace | TBD | Spec in progress |
| 02 | Edu Marketplace (`site02-edu-marketplace`) | TBD | Spec in [[Implementation_Plan_v2\|Implementation Plan v2]] |
| 03-20 | TBD | TBD | Planned |

## Key Documents

- [[Site Factory Architecture|Site Factory Architecture]] — Monorepo structure, shared packages, infrastructure
- [[Site Template Spec|Site Template Spec]] — Next.js template conventions for all sites
- [[Path Animation Marketplace|Path Animation Marketplace]] — Spec for Site 01 (e-commerce, popmart.com reference)
- [[Environment Setup|Environment Setup]] — Required env vars, secrets, deployment checklist
- [[Implementation Plan|Implementation Plan]] — Phased timeline (v1)
- [[Implementation_Plan_v2|Implementation Plan v2]] — v2.1: PayMesh + Dashboard + site01 toys + site02 edu marketplace
- [[Site Factory TZ v2|Site Factory TZ v2]] — v2.0: PayMesh Gateway payment integration + Dashboard/CRM integration (supersedes payment sections of the above)

## Architecture Decisions

- [[adr-001-monorepo-vs-polyrepo|ADR-001]] — Monorepo (Turborepo) vs polyrepo
- [[adr-002-cms-strategy|ADR-002]] — Headless CMS: Directus (self-hosted, single instance)
- [[adr-003-deployment-strategy|ADR-003]] — Deployment: Coolify on VPS vs Vercel
- [[adr-004-rendering-strategy|ADR-004]] — Rendering: ISR for catalog, CSR for cart/checkout
- [[adr-005-analytics|ADR-005]] — Analytics: Plausible (self-hosted)
- [[adr-006-ecommerce-stack|ADR-006]] — E-commerce stack for marketplace sites (Supabase + Stripe)
- [[adr-007-styling-approach|ADR-007]] — Styling: Tailwind CSS with per-site design tokens

## Open Questions

- [ ] Final list of all 20 site domains and slugs
- [ ] Stripe account setup for marketplace
- [ ] Supabase instance: team-lead managed or self-hosted on VPS?
- [ ] X/Twitter API access for social feed integration (if needed)
- [ ] Content migration plan for sites with existing content

## Russian Version

- [[_index.ru]]
