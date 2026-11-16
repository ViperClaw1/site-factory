# Built from the monorepo root:
#   docker build -f apps/site01-path-marketplace/Dockerfile -t site01-path-marketplace .
#
# Standard Turborepo pattern: `turbo prune` strips the workspace down to only
# the packages this app actually depends on before installing, so adding a
# 20th site to the monorepo doesn't drag its dependency tree into this image
# or blow up build time. Combined with `output: "standalone"` in
# next.config.js, the final image ships only the traced node_modules subset
# instead of the full workspace (hundreds of MB saved per site, times twenty).

# Keep in sync with /.nvmrc (one Node version for CI and images, ADR-009).
FROM node:24-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY . .
RUN npx turbo prune @repo/site01-path-marketplace --docker

FROM base AS installer
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# NEXT_PUBLIC_* are inlined into the bundle at build time, so the server build
# (pathctl) passes them as --build-arg. APP_VERSION is the full commit SHA:
# the source snapshot has no .git to read it from.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_DOMAIN
ARG NEXT_PUBLIC_PLAUSIBLE_URL
ARG APP_VERSION=unknown
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION
RUN pnpm turbo run build --filter=@repo/site01-path-marketplace

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=installer --chown=nextjs:nodejs \
  /app/apps/site01-path-marketplace/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs \
  /app/apps/site01-path-marketplace/.next/static ./apps/site01-path-marketplace/.next/static
COPY --from=installer --chown=nextjs:nodejs \
  /app/apps/site01-path-marketplace/public ./apps/site01-path-marketplace/public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

# busybox wget ships with alpine; /api/health is shallow (no Directus/Supabase).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "apps/site01-path-marketplace/server.js"]
