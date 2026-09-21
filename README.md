# site-factory

Turborepo monorepo powering the Path Animation site factory — 20 thematically different sites sharing a common Next.js 14 template, UI primitives, and infrastructure.

## Structure

- apps/ # 20 Next.js sites
- site01-path-marketplace/ # Path Animation toy marketplace
- packages/
- ui/ # Shared React primitives
- lib/ # Directus client, Supabase, animations, SEO, R2
- types/ # TypeScript types (CMS, commerce, payments)
- config/ # ESLint, tsconfig, Tailwind preset

## Stack

- **Framework**: Next.js 14 App Router
- **Monorepo**: Turborepo + pnpm workspaces
- **CMS**: Directus (self-hosted)
- **Commerce DB**: Supabase (PostgreSQL + Realtime + Auth)
- **Payments**: Hyperswitch (self-hosted) + BTCPay Server
- **Ledger**: Formance (internal)
- **Storage**: Cloudflare R2
- **Deploy**: Coolify on VPS
- **Analytics**: Plausible (self-hosted)

## Getting started

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` in the target app and fill in credentials.

## Documentation

- Index: [`_index.md`](./_index.md) — project overview, site list, and links to specs and ADRs.
- Specs: [`specs/`](./specs) — architecture, template, marketplace, environment, implementation plans.
- ADRs: [`adr/`](./adr) — architecture decision records.
- In-repo, verified against code: [`docs/`](./docs) — architecture, conventions,
  Directus schema, API contracts, env vars, deployment, glossary.
