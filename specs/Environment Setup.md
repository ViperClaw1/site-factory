---
tags: [project/task-4-site-factory, type/spec, status/draft]
project: "Task 4 - Site Factory"
status: draft
created: 2026-07-17
updated: 2026-07-17
aliases: [Environment Setup, Env Vars, Secrets]
---

# Environment Setup

Required environment variables, secrets, and deployment checklist for the Site Factory.

## Infrastructure Services

### Directus (`cms.yourdomain.com`)

```env
# Directus docker-compose / Coolify env
SECRET=<64-char-random-string>          # openssl rand -base64 48
DB_CLIENT=pg
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=directus
DB_USER=directus
DB_PASSWORD=<strong-password>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
```

### Plausible (`analytics.yourdomain.com`)

```env
BASE_URL=https://analytics.yourdomain.com
SECRET_KEY_BASE=<64-char-random-string>
DISABLE_REGISTRATION=true
```

## Per-Site Next.js Variables

Every site deployment in Coolify has these env vars. Set in Coolify UI → Project → Environment Variables.

**Shared across all sites** (use Coolify Shared Variables):

```env
DIRECTUS_URL=https://cms.yourdomain.com
REVALIDATE_TOKEN=<secret-token>          # shared between Directus webhook and Next.js
NEXT_PUBLIC_PLAUSIBLE_URL=https://analytics.yourdomain.com
```

**Unique per site** (set per deployment):

```env
NEXT_PUBLIC_SITE_SLUG=path-marketplace   # matches slug in Directus sites table
NEXT_PUBLIC_SITE_DOMAIN=site1.com
```

**E-commerce sites only** (Site 01 and any future commerce sites):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-side only, never expose to client

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## `.env.example` Template

Every app in `apps/` must have `.env.example` with all required vars and descriptions. Never commit `.env` files.

```env
# apps/site01-path-marketplace/.env.example

# --- Directus CMS ---
DIRECTUS_URL=                      # https://cms.yourdomain.com
REVALIDATE_TOKEN=                  # secret shared with Directus webhook

# --- This site ---
NEXT_PUBLIC_SITE_SLUG=             # e.g. path-marketplace
NEXT_PUBLIC_SITE_DOMAIN=           # e.g. path-marketplace.com

# --- Analytics ---
NEXT_PUBLIC_PLAUSIBLE_URL=         # https://analytics.yourdomain.com

# --- Supabase (e-commerce sites only) ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-side only

# --- Stripe (e-commerce sites only) ---
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## New Site Deployment Checklist

- [ ] Add site entry to Directus `sites` table (`slug`, `domain`, `name`, `primary_color`, `font`)
- [ ] Copy template from `apps/site01-path-marketplace` → `apps/siteNN-name`
- [ ] Set `NEXT_PUBLIC_SITE_SLUG` in Coolify (unique per site)
- [ ] Set `NEXT_PUBLIC_SITE_DOMAIN` in Coolify
- [ ] Add domain DNS A-record in Cloudflare → VPS IP
- [ ] Add site in Coolify → attach domain → SSL auto-provisioned by Traefik
- [ ] Add Uptime Kuma monitor for new domain
- [ ] Add site in Plausible (Settings → Sites → Add Site → domain)
- [ ] Set `NEXT_PUBLIC_PLAUSIBLE_URL` in Coolify (or use Shared Variable)
- [ ] Trigger first deploy in Coolify → verify site loads
- [ ] Lighthouse audit → Performance 90+, no broken links

## Secrets Storage Policy

- **Never commit** `.env` files — `.gitignore` enforces this
- **Production secrets** live only in Coolify Environment Variables
- **Local development** uses `.env.local` (git-ignored) copied from `.env.example`
- **Service role keys** (Supabase `SUPABASE_SERVICE_ROLE_KEY`, Stripe `STRIPE_SECRET_KEY`) — never expose to client bundle. Only in server components / API routes

## Catalog admin (site 01)

`/admin` uploads products into Supabase Storage and `products`. It needs `SUPABASE_SERVICE_ROLE_KEY` in the Next.js runtime (Coolify env), not only in a laptop `.env.local` for scripts.

Grant the role (writes `app_metadata.role`, which clients cannot set):

```bash
cd apps/site01-path-marketplace
node scripts/grant-admin.mjs --email you@example.com
```

Storage buckets are one per category (`toys`, `collectible_toys`, `books`, `artbooks`, `designs`, `merch`, `figures`). Underscores are accepted by the hosted project (`collectible_toys` was created successfully on 2026-10-03).

The admin allows video up to 200 MB, and the migration sets `storage.buckets.file_size_limit` to 209715200. The hosted project's Storage API currently rejects any bucket limit above **50 MB** (`The object exceeded the maximum allowed size`). Raise the project-wide Storage file size limit before uploading files larger than 50 MB. Until then, `ensureBucket` falls back to a 50 MB bucket limit and the admin UI says so.

## Related

- [[Site Factory Architecture]]
- [[adr-003-deployment-strategy]]
