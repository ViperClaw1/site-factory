---
tags: [project/task-4-site-factory, type/spec, status/draft]
project: "Task 4 - Site Factory"
status: draft
created: 2026-07-17
updated: 2026-07-17
aliases: [Implementation Plan, Timeline, Roadmap]
---

# Implementation Plan

## Scope

| Scope | Phases | Description |
|-------|--------|-------------|
| **Minimal** | 0 + 1 + 2 | Infrastructure + shared template + Site 01 (Path Animation Marketplace) |
| **Maximum** | 0 + 1 + 2 + 3 | Minimal + remaining 19 sites |

## Pending Items (blocking Phase 1 start)

- [ ] Final list of all 20 site domains and `NEXT_PUBLIC_SITE_SLUG` values
- [ ] Supabase credentials for marketplace (team-lead managed or new instance?)
- [ ] Stripe account access
- [ ] Cloudflare organization access (to add 20 domains)
- [ ] VPS SSH access (Canada / France)
- [ ] Path Animation brand assets (logo, colors, fonts, character artwork)

## Phase 0 — Infrastructure (Week 1)

| Task | Hours | Notes |
|------|-------|-------|
| Install Coolify on VPS | 2 | `curl -fsSL https://cdn.coollabs.io/coolify/install.sh \| bash` |
| Install Directus via Coolify One-Click | 2 | PostgreSQL + Directus container |
| Install Plausible via Coolify One-Click | 1 | Analytics for all sites |
| Install Uptime Kuma via Coolify One-Click | 1 | Monitoring for all sites |
| Configure Cloudflare DNS for all 20 domains | 3 | A-records → VPS IP |
| Set up Turborepo monorepo skeleton | 3 | `apps/`, `packages/ui`, `packages/lib`, `packages/types`, `packages/config` |
| Configure `packages/config` (eslint, tsconfig, tailwind preset) | 2 | Shared tooling baseline |
| Connect monorepo to Coolify (GitHub integration) | 1 | Auto-deploy on push to `main` |
| **Total** | **15** | |

**Milestone**: VPS running, Coolify managing infrastructure, monorepo wired to auto-deploy.

## Phase 1 — Shared Template (Week 2)

| Task | Hours | AI Speedup |
|------|-------|:----------:|
| `packages/ui`: Button, Card, Section, Grid, ImageWithFallback | 4 | 3x |
| `packages/lib`: directus.ts client, animations.ts, seo.ts, analytics.ts, format.ts | 4 | 3x |
| `packages/types`: Site, Page, Block, Product TypeScript interfaces | 2 | 3x |
| Next.js base template (`app/layout.tsx`, `app/template.tsx`, theme system via CSS vars) | 3 | 2x |
| Directus data model: `sites`, `pages`, `blocks` tables + per-site isolation | 3 | 2x |
| Revalidation webhook: Directus → Next.js `/api/revalidate` | 2 | 2x |
| Plausible integration in template (`PlausibleProvider` + proxy rewrites) | 2 | 3x |
| Deploy template as `site01-path-marketplace` placeholder on Coolify | 1 | — |
| **Total** | **21** | |

**Milestone**: Shared template deployed. Any new site = copy template + set env vars + add Directus content.

## Phase 2 — Site 01: Path Animation Marketplace (Weeks 3-5)

**Sprint 1: Catalog (Week 3)**

| Task | Hours | AI Speedup |
|------|-------|:----------:|
| Supabase schema: `products`, `product_variants`, `orders`, `wishlists` | 4 | 3x |
| Product catalog pages: homepage, category, collection (ISR) | 6 | 2x |
| ProductCard, CategoryNav, CollectionGrid, FilterSidebar components | 5 | 2x |
| **Sprint total** | **15** | |

**Sprint 2: Product Detail + Cart (Week 4)**

| Task | Hours | AI Speedup |
|------|-------|:----------:|
| Product detail page: gallery, variants, stock counter (Supabase Realtime) | 6 | 2x |
| CollectibleBadge, StockCounter (live updates) | 3 | 2x |
| Cart: Zustand store + CartDrawer + CartItem | 4 | 2x |
| Wishlist (authenticated, Supabase) | 3 | 2x |
| **Sprint total** | **16** | |

**Sprint 3: Checkout + Auth (Week 5)**

| Task | Hours | AI Speedup |
|------|-------|:----------:|
| Supabase Auth (email/password, magic link) | 3 | 2x |
| Stripe Payment Intent + Stripe Elements checkout form | 6 | 1.5x |
| Stripe webhook handler: `payment_intent.succeeded` → order `paid` | 3 | 2x |
| Order confirmation page, order history | 3 | 2x |
| E2E test: browse → cart → checkout (Playwright, Stripe test mode) | 4 | 1.5x |
| **Sprint total** | **19** | |

**Milestone**: Site 01 fully functional. Catalog browsing, cart, Stripe checkout, order history live.

## Phase 3 — Sites 02-20 (Weeks 6+)

Each subsequent site follows a repeatable process:

| Step | Time | Notes |
|------|------|-------|
| Copy template from `apps/site01-path-marketplace` | 30 min | |
| Configure `NEXT_PUBLIC_SITE_SLUG` in Coolify | 10 min | |
| Add site entry in Directus (`sites` table) | 10 min | |
| Create Directus pages + blocks for this site | 4-8 hrs | Content-dependent |
| Customize theme (CSS vars: colors, fonts) | 1-2 hrs | |
| Add domain in Cloudflare + Coolify | 20 min | |
| Add Uptime Kuma monitor | 10 min | |
| Smoke test + Lighthouse check | 30 min | |
| **Per site total** | **~1 day** | For content-heavy sites: 2-3 days |

E-commerce sites (with Supabase + Stripe) require additional setup — see [[Path Animation Marketplace]] as the reference implementation.

## Summary

| Phase | Weeks | Hours | Deliverable |
|-------|:-----:|:-----:|-------------|
| 0: Infrastructure | 1 | 15 | VPS + Coolify + Directus + monorepo skeleton |
| 1: Shared Template | 1 | 21 | Reusable Next.js template + shared packages |
| 2: Site 01 Marketplace | 3 | 50 | Path Animation Marketplace fully live |
| 3: Sites 02-20 | ~5-10 | ~100-200 | All 20 sites live |

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| VPS resources insufficient for 20 containers | Performance degradation | Monitor RAM/CPU; upgrade VPS if needed. Sites share PostgreSQL — not 20 separate DBs |
| Directus webhook → revalidation latency | Content updates delayed | Cache TTL fallback (60s ISR) ensures max 60s stale content |
| Stripe integration delays (account approval, test mode issues) | Checkout blocked | Build catalog first, add checkout in final sprint |
| Site 01 e-commerce scope expands (blind box mechanic, subscriptions) | Phase 2 extends | Lock scope before Sprint 1 — open questions must be resolved |
| 20 domains at Cloudflare — DNS propagation delays | New site deployment slow | Add domains early, before code is ready |

## Related

- [[Site Factory Architecture]]
- [[Path Animation Marketplace]]
- [[Environment Setup]]
- [[adr-001-monorepo-vs-polyrepo]]
- [[adr-003-deployment-strategy]]
