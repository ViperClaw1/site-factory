---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-07-17
aliases: []
adr-id: "003"
supersedes: []
superseded-by: []
---

# ADR-003: Deployment Strategy

## Status

Approved — Coolify (self-hosted PaaS) on existing VPS.

## Context

20 Next.js sites + infrastructure services (Directus, Plausible, Uptime Kuma) need a deployment and hosting solution. The team has an existing VPS (Canada / France).

## Options

### Option A: Coolify (self-hosted PaaS on VPS)

| Pros | Cons |
|------|------|
| Zero hosting cost — uses existing VPS | VPS must be maintained (OS updates, monitoring) |
| Deploy all 20 sites + infra from one UI | Single point of failure (no multi-region by default) |
| Traefik built-in: automatic domain routing + SSL | |
| Auto-deploy on git push (webhook) | |
| Docker-based: any language/framework supported | |

### Option B: Vercel

| Pros | Cons |
|------|------|
| Zero ops, native Next.js support | Paid for 20 projects at any real scale |
| Automatic preview deployments | Cannot host Directus, Plausible, Uptime Kuma |
| Edge network globally | Vendor lock-in |

### Option C: Railway / Render

| Pros | Cons |
|------|------|
| Good DX, easy first deploy | Costs scale with 20 sites + infra |
| Managed infra | Same vendor lock-in concern |

## Decision

Approved. Coolify on existing VPS.

**Rationale**:
1. Existing VPS (Canada/France) — no additional infra cost
2. Single Coolify instance manages all 20 sites + Directus + Plausible + Uptime Kuma
3. Traefik handles all domain routing and Let's Encrypt SSL automatically
4. Auto-deploy from monorepo: each `apps/siteN` is a separate Coolify resource, deployed independently

## Consequences

- VPS RAM/CPU must be monitored as sites are added — 20 Next.js containers + infra is significant load
- Coolify itself must be backed up (SQLite database at `/data/coolify`)
- `git push main` triggers parallel deploys of all changed apps via Turborepo + Coolify webhooks

## Related

- [[adr-001-monorepo-vs-polyrepo]]
- [[Site Factory Architecture]]
- [[Environment Setup]]
