---
tags: [project/task-4-site-factory, type/spec, status/draft]
project: "Task 4 - Site Factory"
status: draft
created: 2026-07-17
updated: 2026-07-17
aliases: [Path Animation Marketplace, Site 01, Marketplace Spec]
---

# Path Animation Marketplace

## Overview

E-commerce marketplace embedded in Section 4 of the Path Animation brand site. Sells physical and digital products tied to the Path Animation IP: books, comics, merch, toys, collectible toys, souvenirs, characters, constructors, designs, artbooks, arts, paintings, and figures.

**Visual reference**: popmart.com — product card layout, collection browsing UX, limited edition callouts, unboxing reveal mechanic.

**Deployment**: `apps/site01-path-marketplace/`. Domain TBD. `NEXT_PUBLIC_SITE_SLUG=path-marketplace`.

## Requirements

### Functional

- Browse products by category, collection, and character
- Product detail page: images (gallery), description, price, stock, variants (size/color/edition)
- Add to cart, checkout via Stripe
- Limited edition / collectible products: edition size, series name, remaining stock counter
- User accounts: order history, wishlist
- Search and filter (by category, price range, character, availability)
- Mobile-first responsive layout
- Embedded in Path Animation site Section 4 (iframe or route-based embedding — TBD)

### Non-Functional

- Lighthouse Performance 90+ on mobile
- ISR for product catalog (SEO-indexed)
- CSR for cart, checkout, user account (authenticated, not indexed)
- Stock updates via Supabase Realtime (live "X left" counter without page refresh)

## Product Categories

| Category | Notes |
|----------|-------|
| Books | Physical + digital (PDF/epub) |
| Comics | Issues and collections |
| Merch | Apparel, accessories |
| Toys | Standard play toys |
| Collectible Toys | Limited editions, blind boxes (popmart.com pattern) |
| Souvenirs | Keychains, pins, stickers |
| Characters | Art prints, standees of IP characters |
| Constructors | Build-your-own kits featuring IP characters |
| Designs | Digital design files, prints |
| Artbooks & Arts | Hardcover artbooks, individual art prints |
| Paintings | Canvas prints, original art |
| Figures | Vinyl figures, resin statues |

## Design

### Architecture

```
apps/site01-path-marketplace/
  app/
    (catalog)/
      page.tsx                        # Homepage — featured collections, hero banner
      products/[slug]/page.tsx        # Product detail page (ISR)
      category/[slug]/page.tsx        # Category listing (ISR)
      collections/[slug]/page.tsx     # Collection listing (ISR)
      search/page.tsx                 # Search results (CSR)
    (commerce)/
      cart/page.tsx                   # Cart (CSR)
      checkout/page.tsx               # Checkout — Stripe Elements (CSR)
      checkout/success/page.tsx       # Order confirmation (CSR)
    (account)/
      account/orders/page.tsx         # Order history (CSR, authenticated)
      account/wishlist/page.tsx       # Wishlist (CSR, authenticated)
    (legal)/
      legal/[slug]/page.tsx           # Privacy Policy, Terms, Refund Policy
    api/
      revalidate/route.ts             # Webhook from Directus → ISR invalidation
      stripe/webhook/route.ts         # Stripe payment webhooks
  components/
    product/
      ProductCard.tsx                 # Grid card (image, name, price, stock badge)
      ProductGallery.tsx              # Image gallery with zoom
      ProductVariantSelector.tsx      # Size / color / edition picker
      StockCounter.tsx                # Realtime "X left" via Supabase Realtime
      CollectibleBadge.tsx            # "Limited Edition", "Blind Box" callouts
    catalog/
      CategoryNav.tsx                 # Horizontal category scroll nav
      CollectionGrid.tsx              # Collection cards
      FilterSidebar.tsx               # Price, category, character, availability filters
    cart/
      CartDrawer.tsx                  # Slide-out cart panel
      CartItem.tsx
    checkout/
      StripeCheckoutForm.tsx          # Stripe Elements integration
  lib/
    api-client.ts                     # Directus + Supabase fetch helpers
    cart.ts                           # Zustand cart store
    stripe.ts                         # Stripe client init
    auth.ts                           # Supabase auth helpers
```

### Data Model

Products stored in Supabase (not Directus — commerce data needs ACID, RLS, and Realtime):

```sql
-- Supabase tables
products (
  id uuid PRIMARY KEY,
  site_id text NOT NULL DEFAULT 'path-marketplace',
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,       -- enum: books, comics, merch, toys, ...
  collection text,              -- e.g. 'Spring 2026 Drop'
  character text,               -- IP character name if applicable
  is_collectible boolean DEFAULT false,
  edition_size integer,         -- null if not limited
  series text,
  images jsonb NOT NULL,        -- [{url, alt}, ...]
  base_price numeric(10,2) NOT NULL,
  status text DEFAULT 'active', -- active | draft | archived
  created_at timestamptz DEFAULT now()
)

product_variants (
  id uuid PRIMARY KEY,
  product_id uuid REFERENCES products(id),
  sku text UNIQUE NOT NULL,
  attributes jsonb,             -- {size: 'L', color: 'red', edition: '001/500'}
  price numeric(10,2),          -- null = use base_price
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
)

orders (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  items jsonb NOT NULL,         -- [{variant_id, qty, price_at_purchase}, ...]
  status text DEFAULT 'pending',-- pending | paid | shipped | delivered | cancelled
  stripe_payment_intent text,
  total numeric(10,2) NOT NULL,
  shipping_address jsonb,
  created_at timestamptz DEFAULT now()
)

wishlists (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  product_id uuid REFERENCES products(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
)
```

Static/CMS content (hero banner, collection descriptions, legal pages) stays in Directus.

### Interfaces / API

**Directus** (CMS content — ISR):
- `GET /rest/v1/sites?slug=path-marketplace` — site config
- `GET /rest/v1/pages?site_id=...&slug=home` — homepage blocks

**Supabase** (commerce data):
- Products: `GET /rest/v1/products?site_id=path-marketplace&status=active`
- Product detail: `GET /rest/v1/products?slug=eq.{slug}&select=*,product_variants(*)`
- Stock (Realtime): `supabase.channel('stock').on('postgres_changes', ...)` for live updates
- Cart → Checkout → Stripe Payment Intent → Stripe webhook → order status update

**Stripe**:
- `POST /api/stripe/create-payment-intent` — creates intent from cart items
- `POST /api/stripe/webhook` — handles `payment_intent.succeeded` → update order status

## Dependencies

- `@directus/sdk` — CMS content
- `@supabase/supabase-js` — commerce DB + Realtime + Auth
- `stripe` (server), `@stripe/stripe-js` + `@stripe/react-stripe-js` (client)
- `zustand` — cart state
- `@tanstack/react-query` — server state / data fetching
- `packages/ui` — Button, Card, Section, ImageWithFallback
- `packages/lib` — animations.ts, seo.ts, analytics.ts
- `packages/types` — Site, Page, Block types

## Testing Considerations

- Unit: ProductCard renders with correct price formatting and stock badge
- Unit: cart Zustand store — add, remove, update qty, clear
- Integration: Stripe webhook handler — `payment_intent.succeeded` → order `paid`
- Integration: stock decrement on order creation (Supabase transaction)
- E2E (Playwright): browse → add to cart → checkout flow (Stripe test mode)
- E2E: collectible product with limited stock shows correct remaining count

## Open Questions

- [ ] Is the marketplace embedded via iframe in Path Animation Section 4, or is it a route (`/shop`) on the same Next.js app?
- [ ] Supabase instance: shared with team-lead's instance or dedicated for this site?
- [ ] Stripe account: who owns it? Which currency / region?
- [ ] Blind box / mystery box mechanic (popmart.com core feature) — in scope?
- [ ] Digital product delivery (PDF/epub for books) — file hosting via Supabase Storage or Cloudflare R2?
- [ ] Localization: RU + EN required at launch?
- [ ] Physical shipping: self-fulfilled or third-party logistics?

## Related

- [[Site Factory Architecture]]
- [[Site Template Spec]]
- [[adr-004-rendering-strategy]]
- [[adr-006-ecommerce-stack]]
