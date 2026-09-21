---
tags: [project/task-4-site-factory, type/adr, status/draft]
project: "Task 4 - Site Factory"
status: draft
created: 2026-07-17
updated: 2026-07-17
aliases: []
adr-id: "006"
supersedes: []
superseded-by: []
---

# ADR-006: E-Commerce Stack

## Status

Draft — Supabase + Stripe proposed, pending account access confirmation.

## Context

Site 01 (Path Animation Marketplace) and potentially other sites require e-commerce: product catalog, cart, checkout, order management, user accounts, real-time stock. CMS (Directus) is unsuitable for transactional commerce data — needs ACID, RLS, and Realtime.

## Options

### Option A: Supabase + Stripe

| Pros | Cons |
|------|------|
| Hosted PostgreSQL — zero ops for commerce DB | Vendor dependency |
| Supabase Realtime — live stock counters without extra infrastructure | Supabase free tier has limits |
| Supabase Auth — user accounts, RLS for order isolation | |
| Stripe — industry standard, PCI-compliant, handles 3D Secure | |
| REST API auto-generated — fast integration | |

### Option B: Self-hosted PostgreSQL + Stripe

| Pros | Cons |
|------|------|
| Full control | Ops burden (same VPS, competing with 20 sites) |
| No vendor dependency | Need to build Realtime manually (WebSockets or polling) |

### Option C: Shopify (headless)

| Pros | Cons |
|------|------|
| Full e-commerce platform | Monthly cost, vendor lock-in |
| Handles payments, shipping, inventory | Overkill for marketplace of this scale |

## Decision

Draft. Supabase + Stripe proposed.

**Pending**:
- Supabase instance: team-lead managed (shared with other projects) or dedicated for Site 01?
- Stripe account owner and region
- Blind box / mystery mechanic: in scope? Requires additional inventory logic

**Rationale if approved**:
1. Supabase Realtime powers live stock counters (critical for collectible/limited-edition products)
2. Supabase Auth handles user accounts with built-in RLS — orders isolated per user automatically
3. Stripe handles PCI compliance — no card data touches our servers
4. Dedicated Supabase instance preferred over shared — avoids schema conflicts with other projects

## Consequences

- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to client bundle
- Stripe webhook endpoint (`/api/stripe/webhook`) must verify `stripe-signature` header
- Stock decrement on order creation must be transactional (Supabase RPC / database function)
- Digital product delivery (PDF/epub) requires Supabase Storage or Cloudflare R2

## Related

- [[adr-004-rendering-strategy]]
- [[Path Animation Marketplace]]
