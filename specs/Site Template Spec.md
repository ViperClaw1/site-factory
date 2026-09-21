---
tags: [project/task-4-site-factory, type/spec, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-07-17
aliases: [Site Template Spec, Next.js Template]
---

# Site Template Spec

Conventions every site in `apps/` must follow. Based on the shared Next.js 14 App Router template.

## Directory Structure

```
apps/siteNN-name/
  app/
    layout.tsx                # Root layout: theme CSS vars, PlausibleProvider, fonts
    template.tsx              # Page transitions (Framer Motion) — NOT layout.tsx
    globals.css               # CSS variables for this site's theme
    page.tsx                  # Homepage — thin: imports FSD-style page component
    api/
      revalidate/route.ts     # POST /api/revalidate — ISR cache invalidation
  components/                 # Site-specific components (domain logic)
  lib/
    api-client.ts             # Directus + (if e-commerce) Supabase fetch helpers
    auth.ts                   # (e-commerce sites only)
  public/                     # Static assets (favicon, og-image)
  next.config.js              # Extends base config; adds Plausible proxy rewrites
  tailwind.config.js          # Extends @repo/config/tailwind.preset; site-specific theme
  .env.example                # All required env vars with descriptions
  package.json                # name: "@repo/siteNN-name"
```

## Required Files

Every site MUST have:
- `app/layout.tsx` with `PlausibleProvider` from `next-plausible`
- `app/template.tsx` with Framer Motion page transition
- `app/globals.css` with all CSS variables defined (see [[adr-007-styling-approach]])
- `app/api/revalidate/route.ts` for Directus webhook
- `.env.example` with all required vars
- `tailwind.config.js` extending `@repo/config/tailwind.preset`

## Imports

```typescript
// Correct — from shared packages
import { Button, Section } from '@repo/ui';
import { fadeUp, directus } from '@repo/lib';
import type { Site, Page, Block } from '@repo/types';

// Wrong — never duplicate in site
// import { createDirectus } from '@directus/sdk'; // use @repo/lib/directus.ts
// const fadeUp = { ... }; // use @repo/lib/animations.ts
```

## Rendering Rules

| Page | `async` Server Component? | Strategy |
|------|:---:|----------|
| Homepage, catalog, product pages | ✓ | ISR — `export const revalidate = 0` + webhook |
| Search, cart, checkout, account | ✗ | CSR — `'use client'` |
| Legal pages | ✓ | ISR |

## Framer Motion Rules

- All `motion.*` elements only in `'use client'` components
- Use `useReducedMotion()` — disable animations if user has reduced motion enabled
- Import variants from `@repo/lib/animations` — do not redefine locally
- Page transitions: `app/template.tsx` only — never `app/layout.tsx`
- `viewport={{ once: true }}` on all scroll-triggered animations

## SEO Conventions

```typescript
// app/products/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  return generateMetadata({  // from @repo/lib/seo.ts
    title: product.title,
    description: product.description,
    image: product.images[0]?.url,
  });
}
```

## Plausible Proxy (required in every `next.config.js`)

```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      { source: '/stats/js/script.js', destination: `${process.env.NEXT_PUBLIC_PLAUSIBLE_URL}/js/script.js` },
      { source: '/stats/api/event', destination: `${process.env.NEXT_PUBLIC_PLAUSIBLE_URL}/api/event` },
    ];
  },
};
```

## Related

- [[Site Factory Architecture]]
- [[adr-004-rendering-strategy]]
- [[adr-007-styling-approach]]
