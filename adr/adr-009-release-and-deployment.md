---
tags: [project/task-4-site-factory, type/adr, status/proposed]
project: "Task 4 - Site Factory"
status: proposed
created: 2026-11-10
updated: 2026-11-12
aliases: [Release and deployment, Site acceptance]
adr-id: "009"
supersedes: ["003"]
superseded-by: []
---

# ADR-009: Release, Source Archive and Deployment

## Status

Proposed. Based on the site acceptance checklist of 09.11, the acceptance additions by Eduard (acceptance and deployment) of 10.11, and the customer's requirement of 10.11: "файлы в зипе сдавать полностью перед заливкой на GitHub Actions".

Decided by the customer: a full source ZIP of every site is handed over before deployment. Decided on 11.11: deployment goes over SSH with docker compose, not Coolify. Decided on 12.11: GitHub Actions only; no GHCR — the image is built on our server from a snapshot of the repository, the same way `parser` is deployed (`ci-parser` + `pathctl update`). Still open: the tag scheme.

Supersedes [[adr-003-deployment-strategy|ADR-003]] (Coolify on a VPS, auto-deploy on push).

## Context

- Today the demo runs on Vercel (commit `17af766`), and `ci.yml` runs gitleaks plus lint, type-check and build for the packages changed since `HEAD^1`. Nothing deploys to our own servers.
- Four documents describe deployment differently: ADR-003 (Coolify), `docs/deployment.md` (Coolify webhook from Actions), `docs/deploy-supabase-vps.*` (GitHub Actions → GHCR → SSH → docker compose, two Supabase stacks) and ADR-008 (one stack on our server in Germany).
- `parser` is already deployed by GitHub Actions without a registry: the workflow `ci-parser` triggers `pathctl update` on the server, which takes a snapshot of the repository at the commit and builds the image there.
- The customer wants every site's complete source as a ZIP before it goes live, kept on their side and editable.
- A hand-made ZIP has already leaked secrets: an earlier site02 archive shared for review contained real `.env` and `.env.local` with R2 keys.
- A green build is not proof that a site works: `lib/api-client.ts` in site01 catches a missing `DIRECTUS_URL` and renders an empty catalog (CI log of PR #1: "DIRECTUS_URL is not set" with a success result).

## Options

### Option A: Vercel for production

Fast and zero-ops, but the database and Directus live on our VPS (ADR-008), so every server render crosses the internet to another region; cost grows with 20 sites; backups, rollback and monitoring are split between two providers.

### Option B: Coolify on the VPS, deploy on push (ADR-003)

Simple, but a push deploys without the acceptance checklist, there is no approval step for the customer's archive, and the panel runs with access to the Docker socket on the host.

### Option C: GitHub Actions pipeline with a registry (GHCR)

The image is built in CI and pulled by the server. Rejected on 12.11: the image would live in a third-party registry, which conflicts with "no cloud for our data", and the team already has a working registry-free pattern (`parser`).

### Option D: GitHub Actions pipeline, image built on our server from a repository snapshot (chosen)

A tag starts checks, then a source archive is built and published, the customer approves, and only then the server builds the image from a snapshot of the repository at the tag and deploys it, with a health gate and automatic rollback. Same pattern as `parser` (`ci-parser` + `pathctl update`).

## Decision

**Where**
- Production and stage run on our VPS (ADR-008). Vercel is not used for production; at most for pull-request previews of the closed demo.
- Developers have no SSH or production access. Deployment happens only through GitHub Actions. The owner has a break-glass procedure for emergencies, documented in the runbook.

**Release**
- A release is a tag on `main` after green CI. Tag scheme (to confirm): one repository tag `vX.Y.Z` whose release notes list the affected sites. If per-site cadence becomes necessary, switch to `site01/vX.Y.Z`.
- On the tag, CI builds **every** site listed in the release explicitly (`--filter=@repo/<site>`), not only the packages changed since the previous commit.

**Source archive (customer requirement of 10.11)**
- Job `package`, run by CI from the same tag that is deployed. No archive is built by hand.
- One ZIP per site, `<site>-<version>-<sha7>.zip`, made from `turbo prune @repo/<site>`. It contains:
  - `apps/<site>/**`, the shared `packages/*` it needs, the pruned `pnpm-lock.yaml`;
  - root `package.json`, `turbo.json`, `.nvmrc`, `Dockerfile`, `.env.example`, migrations, README.
  - Plus one ZIP of the whole repository at the tag.
- Excluded: `node_modules`, `.next`, `dist`, `.turbo`, `.git`, every `.env*` except `.env.example`, logs, screenshots, test results.
- Each archive comes with `MANIFEST.txt` (tag, full SHA, build date, Node and pnpm versions, file list) and `sha256sums.txt`. Everything is attached to the GitHub Release.
- Completeness check before approval:
  - unpack into an empty folder;
  - `pnpm install --frozen-lockfile && pnpm turbo run build --filter=@repo/<site>` must pass;
  - gitleaks on the unpacked folder;
  - `sha256sum -c sha256sums.txt`.
- The archive is a controlled copy; git is the source of truth. Changes the customer makes in archive files come back as a pull request, pass CI and ship in the next tag. Nothing is deployed from a hand-made or edited archive.

**Deployment**
- Workflow `deploy.yml`, next to `ci.yml`. Pipeline:
  1. checks on the tag;
  2. `package` and Release;
  3. approval: GitHub environment `production` with required reviewers. The customer confirms receipt of the archive;
  4. over SSH as user `deploy`, the server takes a snapshot of the repository at the tag (`pathctl update`, as for `parser`) and builds the image locally, tagged by full SHA;
  5. database backup, then migrations as a separate step (forward-only, expand–contract, pending = 0);
  6. `docker compose up --wait` with the new image tag;
  7. health gate and smoke test;
  8. on failure, automatic rollback to the previous SHA.
- Stage goes first and is closed to indexing (`X-Robots-Tag: noindex`) and to outsiders.
- Rollback is a `workflow_dispatch` with `action: rollback, tag: <previous-sha>`. `current` and `previous` SHAs are recorded on the server, and the images of the last N releases (at least 3) are kept locally, so a rollback needs no rebuild. A rollback is rehearsed at least once before the first production release.
- Building on the production server takes CPU and memory from the running sites. Builds run with a CPU and memory limit, outside peak hours where possible; if that is not enough, the image is built on the stage server and copied with `docker save | ssh … docker load`, still without a registry.

**What every site must provide**
- Startup fails with a clear list of missing required environment variables (`lib/env.ts`) instead of rendering empty pages. CI builds with placeholder values; production starts with real ones.
- `GET /api/health` returns `{"status":"ok","version":"<sha>"}`. It stays shallow: it does not check Directus or Supabase, so a CMS outage doesn't make the orchestrator kill a healthy container. The version is also shown in the footer.
- Dockerfile:
  - multi-stage, non-root user;
  - a `HEALTHCHECK` against `/api/health`;
  - the Node version from `.nvmrc`. The Dockerfiles use `node:20`, CI uses 24: unify on one LTS.
- `.env.example` matches every `process.env` the code reads.

**Smoke test after each deploy**
- `http` → `https` and `www` → apex redirects (301);
- TLS valid for at least 14 days; HSTS and security headers;
- 404 for unknown pages; health returns the deployed SHA;
- containers are `healthy`; no 5xx in the logs;
- the catalog of a catalog site is not empty;
- no secrets or personal data in the logs.

**Server**
- No published ports (`expose` only); routing through Traefik with the `traefik.docker.network` label.
- Container resource limits; log rotation.
- Production keys differ from stage keys; production PayMesh keys start with `pm_live_`.

**Roles**
- Site teams: code, Dockerfile, health endpoint, `.env.example`, fail-fast env check, forward-only migrations, tests.
- Deployment owner (Eduard): pipeline, `pathctl` on the servers, environments and CI secrets; stage, Traefik, DNS, TLS; backups, applying migrations; health gate, rollback, monitoring, runbook; sign-off.
- A named deputy for the deployment owner is required, with the same access and the runbook.

**Acceptance**
- The checklist of 09.11 gets section 1.7 "Deployment and technical acceptance" from the additions of 10.11.
- The release carries:
  - `report.md`: SHA, stage, verdict, open issues with P0/P1, who accepted;
  - the smoke report;
  - the archives with checksums;
  - the rollback record.

## Consequences

- ADR-003 is superseded. Coolify is not part of the release path. `docs/deployment.md` and `docs/deploy-supabase-vps.*` are rewritten for this pipeline when the one-stack baseline (ADR-008, step 2.5) lands.
- The CI filter `...[HEAD^1]` checks only the last commit of a multi-commit push to `main`. Replace it with `turbo --affected` against `github.event.before`.
- Add the existing Playwright suites (`locale-suite`) to CI.
- Site teams must add `lib/env.ts`, the `version` field in `/api/health`, a `HEALTHCHECK` and one Node version before the first release.
- Fonts from `next/font/google` are downloaded at build time, so the build needs network access to Google Fonts. Font Awesome is loaded from `cdnjs` at runtime in site01; bundle it locally to meet the "no external required resources" condition of 20.10.
- Open:
  - the tag scheme (one repository tag or per site);
  - whether Vercel previews are kept for pull requests;
  - a machine-readable checklist (`checklist.yaml` with auto and manual items) proposed in the additions of 10.11.

## Related

- [[adr-003-deployment-strategy]]
- [[adr-008-unified-commerce-and-auth]]
- `docs/deploy-supabase-vps.en.md`, `docs/deployment.md`
- Site acceptance checklist of 09.11 and its additions of 10.11
