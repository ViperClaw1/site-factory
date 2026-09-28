# Deploying site01 + site02 to a self-hosted Supabase VPS (GitHub Actions)

Russian version: [`deploy-supabase-vps.ru.md`](./deploy-supabase-vps.ru.md)

Audience: the DevOps engineer who owns the VPS. This guide covers two apps:
`apps/site01-path-marketplace` (toy marketplace) and
`apps/site02-edu-marketplace` (course marketplace). For these two apps it
replaces the Coolify flow in [`deployment.md`](./deployment.md). The existing
`ci.yml` (lint, type-check, build, gitleaks) stays as it is.

All hostnames, ports, and paths below (`site01.example.com`, `/opt/site-factory`,
`5432`…) are placeholders. Replace them with your own values.

---

## 1. What each app needs from Supabase

| Feature | site01 (toys) | site02 (courses) |
|---|---|---|
| Email + password sign-up / login | ✅ | ✅ |
| Email confirmation via `/auth/callback` | ✅ | ✅ |
| Google OAuth | — | ✅ |
| Forgot / reset password | — | ✅ (`/forgot-password` → `/reset-password`) |
| Email change from the profile page | ✅ | — |
| Route protection (server-side) | ✅ `middleware.ts`: `/account/*`, `/favorites/*` | client-side only |
| Roles | `app_metadata.role` (`admin` / customer) | — |
| Storage buckets | `avatars` (created by migration), `characters`, `toys` | none yet |
| Pregenerated image variants + blurhash | ✅ products + avatars | — |
| Realtime | `product_variants` (stock counters) | — |
| DB migrations | `apps/site01-path-marketplace/supabase/migrations/` | `apps/site02-edu-marketplace/supabase/migrations/` |

Not implemented in site02 yet: `/api/checkout/create-order`,
`/api/paymesh/webhook`, and `/api/media/[lessonId]` all return `501`. You
don't need payment or media configuration for site02.

**The two apps need two separate Supabase instances.** Both schemas define
`orders`, `order_status`, and `set_updated_at()`, and site02's migration says
so explicitly ("Dedicated Supabase project — do not apply on the toys
marketplace database").

---

## 2. Target layout

```
                        GitHub Actions
   ┌───────────────────────────────────────────────────────────┐
   │ build (Dockerfile) → ghcr.io/<owner>/<app>:<sha>          │
   │ migrate: SSH tunnel → supabase db push (per site DB)       │
   │ deploy: SSH → docker compose pull/up --wait                │
   │ images (site01, manual): pregen / thumbs / blurhash        │
   └───────────────────────────┬───────────────────────────────┘
                               │ SSH
 VPS ──────────────────────────▼────────────────────────────────
  reverse proxy (Traefik / nginx, TLS)
    site01.example.com      → site01 container :3000
    api.site01.example.com  → supabase-site01 Kong :8000
    site02.example.com      → site02 container :3000
    api.site02.example.com  → supabase-site02 Kong :8000

  /opt/supabase-site01   (supabase/docker stack #1: db, auth, rest, storage, realtime, kong…)
  /opt/supabase-site02   (supabase/docker stack #2)
  /opt/site-factory      (docker-compose.yml + site01.env + site02.env for the two Next.js apps)
```

You need four DNS records: two site domains and two Supabase API domains.

---

## 3. Supabase stacks (one per site)

Follow the official self-hosting guide (`supabase/docker` in the
`supabase/supabase` repo) **twice**, once into `/opt/supabase-site01` and once
into `/opt/supabase-site02`, and run each with its own compose project name
(`docker compose -p supabase-site01 …`).

### 3.1 Running two stacks on one host

The upstream `docker-compose.yml` hard-codes `container_name: supabase-*` and
fixed host ports. For the second stack:

- Rename the containers, e.g. `sed -i 's/container_name: supabase-/container_name: s02-supabase-/' docker-compose.yml`.
  Apply the same rename in `volumes/logs/vector.yml`, which routes logs by
  container name, or disable the analytics/vector services.
- Give each stack its own `POSTGRES_PORT`, `POOLER_PROXY_PORT_TRANSACTION`,
  `KONG_HTTP_PORT`, and `KONG_HTTPS_PORT`.
- **Bind the published ports to 127.0.0.1**, e.g. `"127.0.0.1:${POSTGRES_PORT}:5432"`.
  Docker writes iptables rules that bypass ufw (see `deployment.md`), so
  Postgres must never be reachable from the internet. CI reaches it through
  an SSH tunnel (§6).
- Give each stack its own `POOLER_TENANT_ID`.

### 3.2 Stack `.env`: values the apps depend on

Generate a fresh `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`,
`POSTGRES_PASSWORD`, `SECRET_KEY_BASE`, `VAULT_ENC_KEY`, and dashboard
credentials **per stack**. The apps use the legacy JWT key pair: `anon` for
the apps, `service_role` for CI scripts.

| Variable | site01 stack | site02 stack | Why |
|---|---|---|---|
| `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL` | `https://api.site01.example.com` | `https://api.site02.example.com` | Public API base. The same value becomes `NEXT_PUBLIC_SUPABASE_URL` in the app |
| `SITE_URL` | `https://site01.example.com` | `https://site02.example.com` | Default redirect for auth emails |
| `ADDITIONAL_REDIRECT_URLS` | `https://site01.example.com/auth/callback**` | `https://site02.example.com/auth/callback**` | Every auth flow redirects to `<origin>/auth/callback?next=…`. GoTrue rejects URLs not on this list |
| `ENABLE_EMAIL_SIGNUP` | `true` | `true` | |
| `ENABLE_EMAIL_AUTOCONFIRM` | `false` | `false` | The apps expect the confirmation-link flow |
| `DISABLE_SIGNUP` | `false` | `false` | |
| `SMTP_HOST/PORT/USER/PASS/ADMIN_EMAIL/SENDER_NAME` | required | required | Confirmation, email-change (site01), and recovery (site02) emails |
| Google (§3.3) | — | required | |

The default email templates work as they are. Links go through
`/auth/v1/verify` and land on `/auth/callback?code=…`, which calls
`exchangeCodeForSession`. The `@supabase/ssr` PKCE flow is the default.

**Supabase Studio** is served through Kong with basic auth
(`DASHBOARD_USERNAME/PASSWORD`). Use strong credentials, or IP-restrict it at
the proxy.

### 3.3 Google OAuth (site02 stack only)

Google Cloud Console → APIs & Services → Credentials → OAuth client ID (type *Web application*):

- Authorized JavaScript origins: `https://site02.example.com`
- Authorized redirect URIs: `https://api.site02.example.com/auth/v1/callback` (the **Supabase API** domain, not the site)
- OAuth consent screen: scopes `openid`, `email`, `profile`; publishing status *In production*. In *Testing*, only listed test users can sign in.

The upstream compose file doesn't pass Google settings to GoTrue. Add them to
the `auth` service `environment:` and set the values in the stack `.env`:

```yaml
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: ${GOOGLE_ENABLED}          # true
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_SECRET}
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${API_EXTERNAL_URL}/auth/v1/callback
```

Flow: the site's "Continue with Google" button goes to
`api.site02…/auth/v1/authorize`, then Google, then
`api.site02…/auth/v1/callback`, then `site02…/auth/callback?code=…&next=…`,
which sets the session cookie. On failure the user lands on
`/login?error=oauth`, and the container log shows
`[auth/callback] provider error` or `code exchange failed`.

### 3.4 Storage (site01 stack)

| Bucket | Public | Created by | Contents |
|---|---|---|---|
| `avatars` | yes, 2 MB limit, jpeg/png/webp | migration `20260927000000_auth_profiles.sql` | `<uid>/<ts>.<ext>` + `_thumb.webp` (160²) + `_hero.webp` (512²) |
| `characters` | yes | `scripts/seed-showcase-catalog.mjs`, or the SQL below | product images + `_thumb/_gallery/_hero.webp` |
| `toys` | yes | same | same |

If you don't run the seed script, create the product buckets once in the
Supabase SQL editor:

```sql
insert into storage.buckets (id, name, public)
values ('characters', 'characters', true), ('toys', 'toys', true)
on conflict (id) do nothing;
```

Only the service role writes to product buckets. The `avatars` policies let
each user write only under their own `<uid>/` folder. Public URLs have the
form `https://api.site01.example.com/storage/v1/object/public/<bucket>/<path>`.
Variants are uploaded with `Cache-Control: max-age=31536000` and
cache-busted with `?v=`.

- With the default file backend, objects live in the stack's
  `volumes/storage`. Include it in backups together with the Postgres volume.
  An S3 backend works just as well.
- imgproxy (on-the-fly transforms) isn't used. All variants are pregenerated.
- **Hairpin requirement:** the site01 container calls
  `https://api.site01.example.com` itself. `/api/avatar` downloads the
  uploaded original, and `middleware.ts` validates sessions. The public API
  domain must therefore resolve and be reachable **from inside the app
  container**.

---

## 4. App environment variables

`NEXT_PUBLIC_*` values, and anything read by `next.config.js` or at static
generation, are **baked into the image at `docker build`**. Changing one
requires a rebuild (re-run the deploy workflow), not just a container
restart.

The Dockerfiles aren't changed for this. `.dockerignore` excludes `.env` and
`.env.local` but **not** `.env.production`. CI writes
`apps/<app>/.env.production` before `docker build` (verified: it survives
`turbo prune`), and `next build` loads it. Only non-secret values go there,
because the file can end up inside the image.

### site01-path-marketplace

| Variable | Build | Runtime | Secret | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | no | `https://api.site01.example.com`. Also whitelists the host for `next/image` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | no (RLS-protected) | site01 stack `ANON_KEY` |
| `BASE_URL` | ✅ | ✅ | no | `https://site01.example.com`. Canonical URLs, `sitemap.xml` |
| `NEXT_PUBLIC_SITE_DOMAIN` | ✅ | — | no | Plausible domain |
| `NEXT_PUBLIC_PLAUSIBLE_URL` | ✅ | — | no | optional. Unset means no `/stats/*` proxy |
| `NEXT_PUBLIC_DIRECTUS_ASSETS_URL` | ✅ | — | no | optional (Directus media) |
| `DIRECTUS_URL` | — | ✅ | no | optional (Directus CMS) |
| `REVALIDATE_TOKEN` | — | ✅ | **yes** | HMAC key for `POST /api/revalidate` |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | — | ✅ | **yes** | optional (digital-goods signed URLs) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | **never** | **yes** | Used **only** by the CI image scripts (§7). The app itself doesn't need it |

### site02-edu-marketplace

| Variable | Build | Runtime | Secret | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | no | `https://api.site02.example.com` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | no | site02 stack `ANON_KEY` |
| `BASE_URL` | ✅ | ✅ | no | `https://site02.example.com` |
| `NEXT_PUBLIC_SITE_DOMAIN` | ✅ | — | no | |
| `NEXT_PUBLIC_PLAUSIBLE_URL` | ✅ | — | no | optional |
| `REVALIDATE_TOKEN` | — | ✅ | **yes** | |

Runtime values live on the VPS in `/opt/site-factory/site01.env` and
`site02.env` (mode `600`, owned by the deploy user). Secrets never pass
through GitHub. Keep the `NEXT_PUBLIC_*`/`BASE_URL` values in these files
identical to the GitHub variables.

---

## 5. GitHub configuration

Create two **Environments** (Settings → Environments): `site01` and `site02`.
The workflows use the same variable names in both. The environment selects
the values.

**Repository secrets** (shared):

| Secret | Value |
|---|---|
| `VPS_HOST` | VPS hostname/IP |
| `VPS_USER` | deploy user (member of the `docker` group) |
| `VPS_SSH_KEY` | private key (ed25519) for that user |
| `VPS_KNOWN_HOSTS` | output of `ssh-keyscan <VPS_HOST>` |

**Environment variables** (per environment, *Variables* tab):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `BASE_URL`,
`NEXT_PUBLIC_SITE_DOMAIN`, `NEXT_PUBLIC_PLAUSIBLE_URL` (optional),
`NEXT_PUBLIC_DIRECTUS_ASSETS_URL` (site01, optional), and `DB_PORT`, which is
this stack's pooler port on the VPS (`POSTGRES_PORT` from §3.1).

**Environment secrets:**

| Secret | Env | Value |
|---|---|---|
| `SUPABASE_DB_URL` | both | `postgresql://postgres.<POOLER_TENANT_ID>:<POSTGRES_PASSWORD>@127.0.0.1:15432/postgres`. Port `15432` is the local end of the CI tunnel. URL-encode special characters in the password |
| `SUPABASE_SERVICE_ROLE_KEY` | site01 | site01 stack `SERVICE_ROLE_KEY` |

Optionally add *required reviewers* to the environments to gate production
deploys.

---

## 6. Deploy workflow

Three files: one reusable workflow plus one small trigger per site, so a
site02-only commit doesn't restart site01.

### `.github/workflows/_deploy-site.yml`

```yaml
name: Deploy site (reusable)

on:
  workflow_call:
    inputs:
      site: { type: string, required: true } # site01 | site02 — also the GitHub Environment name
      app: { type: string, required: true }  # folder under apps/

jobs:
  build:
    runs-on: ubuntu-latest
    environment: ${{ inputs.site }}
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4

      # Build-time values: inlined by `next build`. Non-secret only.
      - name: Write .env.production
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ vars.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          BASE_URL: ${{ vars.BASE_URL }}
          NEXT_PUBLIC_SITE_DOMAIN: ${{ vars.NEXT_PUBLIC_SITE_DOMAIN }}
          NEXT_PUBLIC_PLAUSIBLE_URL: ${{ vars.NEXT_PUBLIC_PLAUSIBLE_URL }}
          NEXT_PUBLIC_DIRECTUS_ASSETS_URL: ${{ vars.NEXT_PUBLIC_DIRECTUS_ASSETS_URL }}
        run: |
          f=apps/${{ inputs.app }}/.env.production
          : > "$f"
          for k in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY BASE_URL \
                   NEXT_PUBLIC_SITE_DOMAIN NEXT_PUBLIC_PLAUSIBLE_URL NEXT_PUBLIC_DIRECTUS_ASSETS_URL; do
            if [ -n "${!k}" ]; then echo "$k=${!k}" >> "$f"; fi
          done
          test -s "$f" || { echo "no build vars for ${{ inputs.site }}"; exit 1; }

      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Image name (GHCR needs lowercase)
        id: img
        run: echo "name=ghcr.io/${GITHUB_REPOSITORY_OWNER,,}/${{ inputs.app }}" >> "$GITHUB_OUTPUT"

      - uses: docker/build-push-action@v6
        with:
          context: .                       # monorepo root, as the Dockerfile expects
          file: apps/${{ inputs.app }}/Dockerfile
          push: true
          tags: |
            ${{ steps.img.outputs.name }}:${{ github.sha }}
            ${{ steps.img.outputs.name }}:latest
          cache-from: type=gha,scope=${{ inputs.app }}
          cache-to: type=gha,mode=max,scope=${{ inputs.app }}

  migrate:
    runs-on: ubuntu-latest
    environment: ${{ inputs.site }}
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }

      - name: SSH key
        env:
          SSH_KEY: ${{ secrets.VPS_SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.VPS_KNOWN_HOSTS }}
        run: |
          install -m 700 -d ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519 && chmod 600 ~/.ssh/id_ed25519
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts

      # Postgres is bound to 127.0.0.1 on the VPS — reach it through a tunnel.
      - name: Tunnel to this site's Postgres
        run: ssh -fN -o ExitOnForwardFailure=yes -L 15432:127.0.0.1:${{ vars.DB_PORT }} "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}"

      # Applies only migrations not yet recorded in supabase_migrations.schema_migrations.
      - name: supabase db push
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          app=apps/${{ inputs.app }}
          test -f "$app/supabase/config.toml" || supabase init --workdir "$app"
          supabase db push --workdir "$app" --db-url "$SUPABASE_DB_URL"

  deploy:
    needs: [build, migrate]
    runs-on: ubuntu-latest
    environment: ${{ inputs.site }}
    steps:
      - name: SSH key
        env:
          SSH_KEY: ${{ secrets.VPS_SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.VPS_KNOWN_HOSTS }}
        run: |
          install -m 700 -d ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519 && chmod 600 ~/.ssh/id_ed25519
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts

      # Token goes over stdin, never on the remote command line.
      - name: Pull + restart (waits for the healthcheck)
        env:
          GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          tag_var="$(echo '${{ inputs.site }}' | tr a-z A-Z)_TAG"
          printf '%s' "$GHCR_TOKEN" | ssh "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}" "
            set -e
            docker login ghcr.io -u '${{ github.actor }}' --password-stdin
            cd /opt/site-factory
            export $tag_var=${{ github.sha }}
            docker compose pull ${{ inputs.site }}
            docker compose up -d --wait --wait-timeout 120 ${{ inputs.site }}
            docker image prune -f
          "
```

### `.github/workflows/deploy-site01.yml`

```yaml
name: Deploy site01
on:
  push:
    branches: [main]
    paths: ["apps/site01-path-marketplace/**", "packages/**", "pnpm-lock.yaml"]
  workflow_dispatch:
concurrency: { group: deploy-site01, cancel-in-progress: false }
jobs:
  deploy:
    uses: ./.github/workflows/_deploy-site.yml
    with: { site: site01, app: site01-path-marketplace }
    secrets: inherit
    permissions: { contents: read, packages: write }
```

`deploy-site02.yml` is identical, with `site02` / `site02-edu-marketplace`
and paths `apps/site02-edu-marketplace/**`.

Notes:

- **Migrations run before the new container starts.** The migrations are
  additive, so the old container keeps working in between.
- `supabase db push` records applied versions in
  `supabase_migrations.schema_migrations`. If a database was migrated by hand
  earlier (SQL editor), mark those versions once so they aren't re-applied:
  `supabase migration repair --db-url "$SUPABASE_DB_URL" --status applied <version>`.
  Check with `supabase migration list --db-url …`.
- site02's `20260921000001_seed_courses.sql` is a migration. It inserts
  5 demo courses into production on the first push. Remove it before the
  first deploy if that's not wanted.
- The migration step requires a running stack. site01's migration inserts
  into `storage.buckets`, which the storage service creates on its first
  start.
- `docker compose up --wait` fails the job if the container isn't healthy
  within 120 s.

---

## 7. Images: pregen, thumbs, blurhash (site01)

The storefront never resizes at runtime. `lib/image-variants.ts` points
`next/image` at pregenerated files, and the blurhash is decoded to an inline
placeholder on the server. The scripts in
`apps/site01-path-marketplace/scripts/` produce these files. They use the
**service role**, read **only** `.env.local` in the app folder, and are
idempotent: files that already exist are skipped unless `--force` is passed.

| Task | Script | Output |
|---|---|---|
| `pregen` | `backfill-product-image-pregen.mjs` | `<img>_thumb.webp` (400w), `_gallery.webp` (960w), `_hero.webp` (1600w) next to the original in `characters`/`toys`; `products.images[i].variants` + `v` |
| `thumbs` | `backfill-product-image-thumbs.mjs` | only `_thumb.webp` (quick pass for grid cards) |
| `blurhash` | `backfill-product-image-blurhashes.mjs` | `products.images[i].blurhash` (samples `_thumb` if present, so run after pregen) |
| `avatars` | `backfill-avatar-thumbs.mjs` | `avatars/<uid>/<ts>_thumb.webp` (160²) + `profiles.avatar_meta.blurhash` |
| `optimize` | pregen → blurhash | the usual full pass |

Flags: `--dry-run`, `--force`, `--limit N`, `--slug <product-slug>` (products
only), `--variants thumb,hero` (pregen only).

When to run them:

- After products or product images are added or replaced, run `optimize`.
  Products without `variants` still render, but at full size and without a
  blur placeholder.
- New avatars are processed at upload by `POST /api/avatar`. Run `avatars`
  only for avatars uploaded before migration `20260928000000` or after a
  data import.
- After changing the rendering settings in `scripts/lib/product-images.mjs`,
  run `pregen --force`. The `v` version bump busts CDN and browser caches.

### `.github/workflows/images-site01.yml`

```yaml
name: site01 images (pregen / thumbs / blurhash)
on:
  workflow_dispatch:
    inputs:
      task:
        type: choice
        options: [optimize, pregen, thumbs, blurhash, avatars]
        default: optimize
      args:
        description: "Flags: --dry-run --force --limit N --slug x --variants thumb,hero"
        default: "--dry-run"
  # schedule: [{ cron: "30 3 * * *" }]   # optional nightly `optimize` (uses defaults below)

jobs:
  run:
    runs-on: ubuntu-latest
    environment: site01
    defaults: { run: { working-directory: apps/site01-path-marketplace } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.12.3 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile --filter "@repo/site01-path-marketplace..."

      # The scripts read .env.local only (no dotenv). Never commit or print it.
      - name: Write .env.local
        env:
          URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL }}
          KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: printf 'NEXT_PUBLIC_SUPABASE_URL=%s\nSUPABASE_SERVICE_ROLE_KEY=%s\n' "$URL" "$KEY" > .env.local

      - name: Run
        env:
          TASK: ${{ inputs.task || 'optimize' }}
          ARGS: ${{ inputs.args }} # empty on schedule → real run
        run: |
          case "$TASK" in
            optimize) node scripts/backfill-product-image-pregen.mjs $ARGS && node scripts/backfill-product-image-blurhashes.mjs $ARGS ;;
            pregen)   node scripts/backfill-product-image-pregen.mjs $ARGS ;;
            thumbs)   node scripts/backfill-product-image-thumbs.mjs $ARGS ;;
            blurhash) node scripts/backfill-product-image-blurhashes.mjs $ARGS ;;
            avatars)  node scripts/backfill-avatar-thumbs.mjs $ARGS ;;
          esac
```

The default input is `--dry-run`. Look at the log first, then re-run with the
field cleared. The script prints `done: N file(s) created, M already
present`. Per-image failures are logged as `skip …` and don't abort the run.

**Seeding the showcase catalog** (`scripts/seed-showcase-catalog.mjs`) needs
`temp_assets/`, which is git-ignored and exists only on a developer machine.
It's a one-time step run by a developer against the new URL/key, followed by
the `optimize` task. `supabase/seed.sql` holds test products whose image
paths (`/seed/*.jpg`) don't exist. Don't run it in production.

---

## 8. App compose file on the VPS

`/opt/site-factory/docker-compose.yml`. The Traefik labels are an example;
translate them if you use a different proxy.

```yaml
services:
  site01:
    image: ghcr.io/path-animation/site01-path-marketplace:${SITE01_TAG:-latest}
    env_file: site01.env
    restart: unless-stopped
    expose: ["3000"]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks: [proxy]
    labels:
      - traefik.enable=true
      - traefik.http.routers.site01.rule=Host(`site01.example.com`)
      - traefik.http.routers.site01.tls.certresolver=letsencrypt
      - traefik.http.services.site01.loadbalancer.server.port=3000

  site02:
    image: ghcr.io/path-animation/site02-edu-marketplace:${SITE02_TAG:-latest}
    env_file: site02.env
    restart: unless-stopped
    expose: ["3000"]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks: [proxy]
    labels:
      - traefik.enable=true
      - traefik.http.routers.site02.rule=Host(`site02.example.com`)
      - traefik.http.routers.site02.tls.certresolver=letsencrypt
      - traefik.http.services.site02.loadbalancer.server.port=3000

networks:
  proxy:
    external: true
    name: traefik-public
```

- `GET /api/health` returns `{"status":"ok"}` without touching Supabase, so a
  Supabase outage doesn't make the container restart-loop.
- No `ports:` are published. Traffic reaches the apps only through the
  proxy.
- Route each Supabase stack's Kong (`:8000`) the same way on
  `api.siteXX.example.com`.

**Rollback:** `cd /opt/site-factory && SITE01_TAG=<older-git-sha> docker compose up -d --wait site01`.
Every deploy keeps its `:<sha>` image in GHCR. Migrations are forward-only,
so reverting a schema change needs a new migration.

---

## 9. First deployment runbook

1. DNS: create the four records (§2) and wait for them to resolve.
2. Bring up the `supabase-site01` and `supabase-site02` stacks (§3). Open
   Studio on each to confirm Auth and Storage are healthy.
3. Configure SMTP, and Google for site02. Send one test email from each
   stack (sign-up in step 9 does this).
4. Create the GitHub Environments, variables, and secrets (§5).
5. On the VPS: create `/opt/site-factory/{docker-compose.yml,site01.env,site02.env}` (§4, §8).
6. Commit the three deploy workflows and the images workflow (§6, §7) to
   `main`, or run *Deploy site01* / *Deploy site02* manually.
7. site01 only: create the `characters`/`toys` buckets (§3.4), have a
   developer seed or upload products, then run *site01 images* with `optimize`.
8. If you're importing existing data, see §11 first.
9. Smoke-test the user flows (§10).

---

## 10. User flows to verify after deploy

### site01

| # | Flow | Expected |
|---|---|---|
| 1 | `/signup`: name, email, password | Confirmation email arrives. The link opens `…/auth/callback?code=…`, then the user lands signed in (default `/account`). `full_name` is stored in user metadata |
| 2 | `/login` with the confirmed account | Signed in. Header shows the account icons |
| 3 | Open `/account` or `/favorites` signed out | Redirect to `/login?next=/account` (middleware) |
| 4 | `/account`: save name + phone (E.164) | Row in `public.profiles` |
| 5 | `/account`: upload a photo (≤ 2 MB, jpeg/png/webp) | `avatars/<uid>/<ts>.<ext>` + `_thumb.webp` + `_hero.webp` appear, `profiles.avatar_meta` has `blurhash`/`variants`, the old photo is deleted. `/api/avatar` returning 5xx usually means the container can't reach the API domain (§3.4) |
| 6 | `/account`: change email | Confirmation link(s) land on `/auth/callback?next=/account` |
| 7 | Heart a product | Row in `wishlists`. Survives reload |
| 8 | Catalog / product page | Images load from `api.site01…/storage/v1/object/public/…_thumb.webp?v=…` with a blur placeholder first |
| 9 | Stock counter on a limited product | Updates live when `product_variants.stock` changes (Realtime) |
| 10 | Cart + checkout | Works for guests, stored locally (mock checkout) |

Admin role (JWT `app_metadata`, not editable by users):

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
where email = 'someone@example.com';
```

The user must sign in again to get a new JWT. Right now `admin` has the same
UI grants as a customer (`lib/rbac.ts`).

### site02

| # | Flow | Expected |
|---|---|---|
| 1 | `/signup` email + password | Confirmation email, then `/auth/callback`, then signed in |
| 2 | `/login` email + password | Signed in |
| 3 | `/login` → Continue with Google | Google consent, then back on the site signed in. `/account` shows the Google name + avatar |
| 4 | Google with a bad client secret or redirect URI | Lands on `/login?error=oauth` with an error message |
| 5 | `/forgot-password` | Recovery email. The link signs the user in and opens `/reset-password`; the new password works |
| 6 | Expired or reused recovery link | `/reset-password` shows "link expired" |
| 7 | `/courses`, `/courses/<slug>` | Seeded courses listed (if the seed migration was kept) |

---

## 11. Importing existing data (only if moving from Supabase Cloud)

- Follow Supabase's official backup/restore guide (`pg_dump` of roles, the
  schema, and data including `auth`) into the matching stack. Then mark all
  migrations as applied (`supabase migration repair … --status applied`) so
  CI doesn't re-run them.
- Storage **files** aren't in the database dump. Copy the objects bucket by
  bucket (`characters`, `toys`, `avatars`) through the Storage API or S3.
- `JWT_SECRET` is different, so every user must sign in again. Password
  hashes and Google identities carry over with `auth.users` / `auth.identities`.
- **Stored URLs contain the old host.** Rewrite them:

```sql
update products set images = replace(images::text, 'https://<old-ref>.supabase.co', 'https://api.site01.example.com')::jsonb;
update profiles set avatar_url = replace(avatar_url, 'https://<old-ref>.supabase.co', 'https://api.site01.example.com');
```

---

## 12. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Browser console: requests go to `undefined/auth/v1/…` | `NEXT_PUBLIC_*` missing at build. Check the Environment variables and rebuild |
| `next/image`: "hostname … is not configured" | Image built with a different `NEXT_PUBLIC_SUPABASE_URL`. Rebuild |
| Auth email link ends on the Supabase domain or shows "redirect not allowed" | `ADDITIONAL_REDIRECT_URLS` / `SITE_URL` in the stack `.env` |
| Google: `redirect_uri_mismatch` | Google console redirect URI must be `https://api.site02…/auth/v1/callback` |
| Google: "provider is not enabled" | `GOTRUE_EXTERNAL_GOOGLE_*` not passed to the `auth` container (§3.3) |
| No emails | SMTP settings. Check the `auth` container logs |
| Migration job: connection refused | Wrong `DB_PORT` variable, or the pooler isn't bound to `127.0.0.1:<port>` |
| Migration job: "relation already exists" | DB was migrated by hand. Use `supabase migration repair` (§6) |
| `/api/avatar` 404/500 | App container can't reach `api.site01…` (DNS or hairpin NAT) |
| Signed-in user bounced to `/login` on `/account` | Container can't reach Supabase Auth, or the anon key belongs to the other stack |
| Images workflow: "Missing … in .env.local" | `SUPABASE_SERVICE_ROLE_KEY` secret missing in the `site01` environment |
