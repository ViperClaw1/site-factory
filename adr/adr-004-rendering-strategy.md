---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-07-17
aliases: []
adr-id: "004"
supersedes: []
superseded-by: []
---

# ADR-004: Rendering Strategy

## Status

Approved — ISR for public/SEO pages, CSR for authenticated/interactive pages.

## Context

Sites serve both public content (catalog, product pages — must be SEO-indexed and fast) and interactive authenticated content (cart, checkout, account — must be fresh and not indexed). Next.js App Router supports SSR, ISR, and CSR in the same app.

## Decision

Approved. Hybrid rendering per page type.

| Page Type | Strategy | Reason |
|-----------|----------|--------|
| Catalog, product cards, collection pages | ISR (revalidate on Directus webhook) | SEO-indexed, cacheable, fast TTFB |
| Homepage hero, landing sections | ISR | Same — SEO and speed |
| Search results | CSR | Query-dependent, not indexable |
| Cart, checkout | CSR | Authenticated, real-time, must not be cached |
| User account, order history | CSR | Authenticated, personal data |
| Legal pages (Privacy, Terms) | ISR | Static, SEO-indexed |

## ISR Revalidation Trigger

Directus webhook fires on content change → `POST /api/revalidate?secret=TOKEN` on the affected site → `revalidatePath('/')`. Max staleness: 60 seconds (fallback TTL if webhook fails).

## Consequences

- `'use client'` required for all components using Framer Motion, Zustand, Supabase Realtime
- Server Components handle all Directus fetches (CMS content) — no client-side CMS calls
- Supabase client (Realtime, Auth) initialized only in Client Components
- `app/template.tsx` (not `layout.tsx`) used for page transition animations

## Related

- [[adr-002-cms-strategy]]
- [[adr-006-ecommerce-stack]]
- [[Site Factory Architecture]]
