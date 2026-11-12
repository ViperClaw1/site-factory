---
tags: [project/task-4-site-factory, type/adr, status/approved]
project: "Task 4 - Site Factory"
status: approved
created: 2026-07-17
updated: 2026-11-12
aliases: [Analytics, Self-hosted analytics]
adr-id: "005"
supersedes: []
superseded-by: []
---

# ADR-005: Analytics — Self-hosted or None

## Status

Revised 2026-11-12.

- **Approved (decision package of 12.11):** no cloud analytics. Analytics runs on our own server or not at all. PostHog Cloud US, chosen by ADR-008 on 06.11, is withdrawn.
- **Proposed, awaiting approval:** the tool, Option A (Umami).

History:
- 2026-07-17: approved Plausible, self-hosted through Coolify. Never deployed.
- 2026-11-06: superseded by ADR-008 (PostHog Cloud US).
- 2026-11-12: returned here.

## Context

- **Requirement (12.11):** no cloud services for our data.
- **What the customer wants to see (06.11):** traffic by source, language and country; what visitors looked at; who bought and how much; follow-up of those who didn't buy (rules 05, 06.11).
- **What is already decided elsewhere** (ADR-008):
  - Money and LTV are computed in the commerce database (views), not in the analytics tool.
  - Revenue events are sent server-side from `outbox`.
- **Consent** (rule 05; O-10 open):
  - Optional cookies and tracking start only after consent, in every country.
  - Children's sites get no session recordings and no advertising pixels.
- **Infrastructure** (12.11): servers in Germany (netcup), PostgreSQL 16 in `shared-infra-postgres`, backups to our second server. A tool that needs its own ClickHouse/Kafka cluster adds a stack to run and back up.
- **Current code:**
  - Both sites load `PlausibleProvider` unconditionally in `components/RootDocument.tsx`, before any consent.
  - No Plausible server exists, so the script points nowhere.

## Options

| | A. Umami | B. Plausible CE | C. Matomo | D. OpenPanel | E. PostHog self-hosted | F. None |
|---|---|---|---|---|---|---|
| Licence | MIT | AGPL-3.0 | GPL-3.0 | AGPL-3.0 | MIT | — |
| Stack | Node + **PostgreSQL** | PostgreSQL + ClickHouse | PHP + MySQL/MariaDB | Postgres, ClickHouse, Redis | Postgres, ClickHouse, Kafka, Redis | — |
| Resources | small | ≥ 2 GB RAM | ≥ 2 GB RAM | 4 vCPU / 8 GB | ≥ 4 vCPU / 16 GB; officially unsupported, ~300k events/month | — |
| Without cookies | yes (default) | yes | configurable | yes | configurable | — |
| Known user (`identify`) | optional distinct id | no | User ID | yes | yes | DB only |
| Funnels, journeys, retention | listed by the vendor (verify on a PoC) | no | partly, some paid | yes | yes | DB views only |
| Session replay | listed by the vendor (verify on a PoC) | no | paid plugin | no | yes | no |
| Fits our backups | same Postgres, same dumps | separate ClickHouse | separate MySQL | separate ClickHouse | separate cluster | — |

The vendor data and comparison sources disagree on Umami's funnels and replay. These must be checked on a test instance before approval.

## Decision

- **No cloud analytics.** The analytics tool runs on our server or isn't used.
- **Proposed tool: A, Umami, self-hosted.**
  - Its own database `umami` in `shared-infra-postgres`, or later in the commerce stack's Postgres. It is covered by the same backup routine.
  - Served from a first-party subdomain of each site, as a proxy route of the site itself.
- **Before consent:** cookieless counting only (pages, sources, languages, countries), no `identify`.
- **After consent:**
  - `identify` with `customers.id` (never an email);
  - product events (`product_viewed`, `added_to_cart`, `checkout_started`, `order_created`), using the event taxonomy in `packages/analytics`;
  - session replay only if confirmed on the PoC, and never on children's sites.
- **Revenue:** `order_paid` and refunds are sent from `outbox` on the server; money and LTV stay in the commerce DB.
- **When to escalate to E (PostHog self-hosted):** only if session replay, feature flags or A/B experiments at scale are required and Umami can't do them. E runs on a separate server: its ClickHouse must not compete with the commerce Postgres.
- **Fallback F:**
  - DB views (orders, LTV, channels) and server logs only, if no tool is approved.
  - The customer's request "see who, how much, from where, what they looked at" is then answered only for orders, not for browsing.

## Consequences

- **Now, independent of the tool:** remove `PlausibleProvider` and the Plausible rewrites from both sites. Today they load before consent and point to no server.
- **Before choosing:** a PoC of Umami on the stage server — check funnels, journeys and replay against the customer's list.
- `packages/analytics`: a tool-agnostic layer (`track`, `identify`, event taxonomy). The tool can be swapped without touching the sites.
- The consent banner (`packages/consent`) gates everything except cookieless counting.
- ADR-008 refers here for the analytics tool.

## Related

- [[adr-008-unified-commerce-and-auth]]
- `path-ecosystem-rules`: rule 05, O-10
- [Umami vs PostHog (vendor page)](https://umami.is/compare/posthog) · [Self-hosted web analytics 2026 (comparison)](https://openpanel.dev/articles/self-hosted-web-analytics) · [PostHog self-hosting](https://posthog.com/docs/self-host)
