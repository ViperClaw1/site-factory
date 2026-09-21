---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-07-17
aliases: []
adr-id: "005"
supersedes: []
superseded-by: []
---

# ADR-005: Analytics

## Status

Approved — Plausible Analytics (self-hosted, single instance).

## Context

20 sites need analytics. Must be GDPR-compliant (no cookie consent banner required), lightweight (no impact on Lighthouse score), and cost-effective.

## Options

### Option A: Plausible (self-hosted)

| Pros | Cons |
|------|------|
| GDPR-compliant by design — no cookies | Requires VPS resources |
| ~1KB script (vs 45KB Google Analytics) | |
| Single instance tracks all 20 domains | |
| ClickHouse internally for fast queries | |
| No cost (self-hosted on existing VPS) | |

### Option B: Google Analytics 4

| Pros | Cons |
|------|------|
| Free, feature-rich | Cookie consent required (GDPR) |
| | Heavy script impacts Lighthouse |
| | Data sent to Google |

### Option C: Plausible Cloud (SaaS)

| Pros | Cons |
|------|------|
| No ops | €9+/month, scales with pageviews |

## Decision

Approved. Plausible self-hosted via Coolify One-Click App.

**Rationale**:
1. GDPR-compliant — no cookie banner needed on any of the 20 sites
2. One Coolify deployment serves all 20 sites (separate site entries in Plausible UI)
3. Proxy via Next.js rewrites (`/stats/js/script.js`) bypasses ad blockers
4. Script weight negligible: ~1KB vs GA4's 45KB

## Consequences

- `NEXT_PUBLIC_PLAUSIBLE_URL` env var set per site in Coolify (or Shared Variable)
- `next-plausible` npm package used in `packages/lib/analytics.ts`
- Custom events tracked via `usePlausible()` hook (form submissions, checkout steps)
- Ad-blocker bypass: `next.config.js` rewrites for `/stats/js/script.js` and `/stats/api/event`

## Related

- [[adr-003-deployment-strategy]]
- [[Site Factory Architecture]]
