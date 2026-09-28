# Built from the monorepo root:
#   docker build -f apps/site02-edu-marketplace/Dockerfile -t site02-edu-marketplace .
#
# Same pattern as apps/site01-path-marketplace/Dockerfile: `turbo prune`
# keeps only this app's workspace deps, `output: "standalone"` ships only the
# traced node_modules. NEXT_PUBLIC_* values are inlined at build time — CI
# writes them to apps/site02-edu-marketplace/.env.production before building
# (see docs/deploy-supabase-vps.en.md).

FROM node:20-alpine AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY . .
RUN npx turbo prune @repo/site02-edu-marketplace --docker

FROM base AS installer
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@repo/site02-edu-marketplace

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=installer --chown=nextjs:nodejs \
  /app/apps/site02-edu-marketplace/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs \
  /app/apps/site02-edu-marketplace/.next/static ./apps/site02-edu-marketplace/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "apps/site02-edu-marketplace/server.js"]
