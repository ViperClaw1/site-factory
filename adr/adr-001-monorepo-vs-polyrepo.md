---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-07-17
aliases: []
adr-id: "001"
supersedes: []
superseded-by: []
---

# ADR-001: Monorepo vs Polyrepo

## Status

Approved — Turborepo monorepo chosen.

## Context

20 sites with different themes and content, but sharing Next.js template, UI primitives, utility functions, and TypeScript types. Decision: one repository or many?

## Options

### Option A: Turborepo Monorepo (single repo)

```
repo/
  apps/site01/, apps/site02/, ..., apps/site20/
  packages/ui, packages/lib, packages/types, packages/config
```

| Pros | Cons |
|------|------|
| Atomic changes across sites and shared packages in one PR | Single repo grows larger over time |
| Shared tooling (eslint, tsconfig, tailwind) configured once | All developers have access to all sites |
| `pnpm workspace:*` protocol — no registry needed | Build time scales with site count (mitigated by Turborepo cache) |
| Turborepo caches and parallelizes builds | |
| One CI/CD pipeline with Coolify | |

### Option B: Polyrepo (separate repo per site + shared repos)

```
org/shared-ui         # npm package
org/shared-lib        # npm package
org/site01
org/site02
...
org/site20
```

| Pros | Cons |
|------|------|
| Site-level access control | Change in shared-ui → publish package → update 20 repos → 20 PRs |
| Independent deploy pipelines | Atomic cross-site changes impossible |
| | Shared tooling duplicated or versioned separately per repo |
| | Version drift inevitable after 3-6 months |

## Decision

Approved. Turborepo monorepo.

**Rationale**:
1. 20 sites share UI primitives and utilities — any shared change in polyrepo requires 20 PRs
2. Single pnpm workspace eliminates npm registry overhead for internal packages
3. Turborepo remote cache makes build time acceptable even at 20 sites
4. Coolify deploys each `apps/siteN` independently from the same repo — no coupling between site deployments
5. Team is one group working on all sites simultaneously — access control not a concern

## Consequences

- All developers have read access to all 20 sites — acceptable for this team structure
- Turborepo `turbo.json` pipeline must be configured so changes in `apps/site01` don't rebuild `apps/site02` (path-based filtering)
- Repository size will grow — use `.gitignore` carefully, keep media assets in Directus/Cloudflare R2 not in repo

## Related

- [[adr-003-deployment-strategy]]
- [[Site Factory Architecture]]
