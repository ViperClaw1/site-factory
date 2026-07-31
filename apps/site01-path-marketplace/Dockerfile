# Built from the monorepo root:
#   docker build -f apps/site01-path-marketplace/Dockerfile -t site01-path-marketplace .
#
# Standard Turborepo pattern: `turbo prune` strips the workspace down to only
# the packages this app actually depends on before installing, so adding a
# 20th site to the monorepo doesn't drag its dependency tree into this image
# or blow up build time. Combined with `output: "standalone"` in
# next.config.js, the final image ships only the traced node_modules subset
# instead of the full workspace (hundreds of MB saved per site, times twenty).

FROM node:20-alpine AS base
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

CMD ["node", "apps/site01-path-marketplace/server.js"]
