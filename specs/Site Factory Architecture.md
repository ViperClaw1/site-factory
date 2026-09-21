---
tags: [project/task-4-site-factory, type/spec, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-07-17
aliases: [Site Factory Architecture, Infrastructure Architecture]
---

# Site Factory Architecture

## Overview

A single monorepo containing 20 Next.js sites with shared UI primitives, utilities, and TypeScript types. A single VPS hosts all infrastructure: Coolify (PaaS), Directus (CMS), Plausible (analytics), Uptime Kuma (monitoring). Each site has its own domain, theme, and content in Directus, but shares the same codebase template.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare DNS / CDN                  │
│           site1.com  site2.com  ...  site20.com          │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────┐
│                  VPS (Canada / France)                    │
│                                                           │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │   Coolify   │  │ Directus │  │    Plausible      │    │
│  │  (PaaS +    │  │  (CMS)   │  │   (Analytics)     │    │
│  │   Traefik)  │  │          │  │                   │    │
│  └──────┬──────┘  └────┬─────┘  └──────────────────┘    │
│         │              │                                  │
│  ┌──────▼──────────────▼──────────────────────────┐      │
│  │              PostgreSQL                         │      │
│  │    (Directus data for all 20 sites)             │      │
│  └─────────────────────────────────────────────────┘     │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Uptime Kuma  (monitors all 20 domains + infra)  │    │
│  └──────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘

Per-site Next.js container (×20):
  - NEXT_PUBLIC_SITE_SLUG=site1
  - Fetches content from Directus filtered by site_id
  - Theme via CSS variables (colors, fonts)
  - Deployed and routed by Coolify + Traefik
```

## Monorepo Structure

```
repo/
  apps/
    site01-path-marketplace/   # Next.js — Path Animation Marketplace
    site02-xxx/                # Next.js — site 2
    ...
    site20-xxx/                # Next.js — site 20
  packages/
    ui/                        # Shared React primitives: Button, Card, Section, Grid
    lib/                       # directus.ts, animations.ts, seo.ts, analytics.ts, format.ts
    types/                     # TypeScript types: Site, Page, Block, Product
    config/                    # eslint.config.js, tsconfig.base.json, tailwind.preset.js
  tools/
    scripts/                   # codegen, migrations, deploy scripts
  turbo.json
  pnpm-workspace.yaml
  package.json
```

## Shared Packages

### `packages/ui`

Framework-agnostic React primitives. No domain logic. Theming via CSS variables.

```typescript
// Exported components
Button, Input, Card, Modal, Badge, Spinner
Section        // wrapper with padding/margin
Grid, Container
ImageWithFallback
```

### `packages/lib`

```typescript
// directus.ts — Directus SDK client
import { createDirectus, rest } from '@directus/sdk';
const directus = createDirectus(process.env.DIRECTUS_URL).with(rest());

// animations.ts — Framer Motion variants
export const fadeUp = { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, ... };
export const fadeIn = { ... };
export const scaleIn = { ... };

// seo.ts — generateMetadata() helper for Next.js
// analytics.ts — Plausible wrapper (usePlausible hook)
// format.ts — formatDate, formatPrice, truncate
```

### `packages/types`

```typescript
interface Site {
  id: string;
  slug: string;            // matches NEXT_PUBLIC_SITE_SLUG
  domain: string;
  name: string;
  primary_color: string;
  font: string;
  logo: string;
}

interface Page {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  blocks: Block[];
}

interface Block {
  id: string;
  page_id: string;
  type: string;            // 'hero', 'product-grid', 'text', 'cta', etc.
  content: unknown;        // JSONB — typed per block type
  order: number;
}
```

### `packages/config`

```
eslint.config.js          — shared ESLint config (eslint-plugin-boundaries, jsx-a11y)
tsconfig.base.json        — shared TypeScript strict config
tailwind.preset.js        — base Tailwind preset (CSS vars, breakpoints)
```

## Directus Data Model

```sql
-- Core tables (shared across all 20 sites)
sites          (id, slug, domain, name, primary_color, font, logo, created_at)
pages          (id, site_id → sites, slug, title, status, created_at)
blocks         (id, page_id → pages, type, content jsonb, order)
media          (managed by Directus Files)

-- Per-site tables (added as needed per site type)
-- E-commerce sites:
products       (id, site_id → sites, category, title, price, images jsonb, stock, ...)
product_variants (id, product_id → products, sku, attributes jsonb, stock, price)
orders         (id, site_id → sites, user_id, items jsonb, status, total, ...)
```

## Content Update Flow

```
Editor changes content in Directus UI
    ↓
Directus fires webhook → POST /api/revalidate?secret=TOKEN on affected site
    ↓
Next.js revalidatePath('/') invalidates ISR cache
    ↓
Next.js re-fetches from Directus on next request
    ↓
Updated page served to users (no redeploy needed)
```

## Site Isolation

Each site is completely isolated in Directus via `site_id`. One developer cannot accidentally edit another site's content. Each site's Next.js deployment reads only its own `site_id` content via:

```typescript
// lib/directus.ts
const site = await directus.request(
  readItems('sites', {
    filter: { slug: { _eq: process.env.NEXT_PUBLIC_SITE_SLUG } },
    fields: ['*', 'pages.*', 'pages.blocks.*']
  })
);
```

## Infrastructure Services

| Service | Port | Domain | Purpose |
|---------|------|--------|---------|
| Coolify | 8000 | coolify.yourdomain.com | PaaS — deploys all containers |
| Directus | 8055 | cms.yourdomain.com | CMS — content for all 20 sites |
| Plausible | 8001 | analytics.yourdomain.com | Analytics for all 20 sites |
| Uptime Kuma | 3001 | status.yourdomain.com | Uptime monitoring |
| PostgreSQL | 5432 | internal | DB for Directus |

## SLA Targets

| Metric | Target |
|--------|--------|
| Page load (Lighthouse Performance) | 90+ |
| Time to First Contentful Paint | < 1.5s |
| Uptime per site | 99.5% |
| Content update → live | < 60s (ISR revalidation) |
| New site deploy (from template) | < 1 day |

## Dependencies

- **Runtime**: Node.js 20+ LTS
- **Framework**: Next.js 14+ (App Router only)
- **Monorepo**: Turborepo + pnpm workspaces
- **CMS**: Directus (self-hosted, Docker)
- **PaaS**: Coolify (self-hosted, Docker)
- **DNS/CDN**: Cloudflare
- **Analytics**: Plausible (self-hosted, Docker)
- **Monitoring**: Uptime Kuma (self-hosted, Docker)
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS

## Related

- [[adr-001-monorepo-vs-polyrepo]]
- [[adr-002-cms-strategy]]
- [[adr-003-deployment-strategy]]
- [[Site Template Spec]]
- [[Environment Setup]]
