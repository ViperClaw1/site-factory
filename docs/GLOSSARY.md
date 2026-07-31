# Глоссарий

**site-factory** — этот монорепозиторий: общий стек, из которого собирается
~20 разных сайтов.

**site01-path-marketplace** — первый сайт фабрики, маркетплейс коллекционных
игрушек Path Animation.

**apps/site-template** — пока не существует в репозитории. Планируемый общий
шаблон сайта, из которого будут стартовать site02..site20. См.
`docs/architecture.md`.

**Directus** — headless CMS, редакторский контент (`sites`, `pages`, `blocks`,
`collections`, `characters`). Не хранит товары. Самостоятельный self-hosted
инстанс на `cms.vcpath.us`.

**Directus assets URL** — отдельный публичный адрес для медиафайлов Directus
(`assets.vcpath.us`), намеренно отделённый от API-адреса, чтобы будущий
переезд медиа на CDN/R2 не требовал переписывания контента. См.
`docs/env-template.md`.

**Supabase** — Postgres + Realtime + Auth, источник правды для коммерции:
`products`, `orders`, `subscriptions`, `wishlists`, `digital_access`. RLS
привязана к `auth.uid()`.

**RLS (Row Level Security)** — политики доступа на уровне БД в Postgres;
в этом проекте гарантируют, что пользователь видит только свои заказы/
wishlist/подписки, а смена статуса (paid/shipped/refunded) — только через
`service_role` на сервере, не через клиентскую запись.

**ISR (Incremental Static Regeneration)** — стратегия рендеринга Next.js;
здесь используется с `revalidate = 0` (по требованию через вебхук), а не по
таймеру.

**RSC (React Server Components)** — модель рендеринга Next.js App Router;
упомянута в контексте CVE-2025-55182 (см. `docs/deployment.md` про версии
зависимостей).

**Turborepo** — оркестратор монорепозитория (кэш задач, граф зависимостей
между `packages/*` и `apps/*`), используется для `build`/`lint`/`type-check`
и для `turbo prune --docker` при сборке образа.

**Coolify** — self-hosted PaaS на сервере; разворачивает каждый сайт как
отдельное приложение по вебхуку из GitHub Actions после merge в `main`.

**Traefik** — reverse proxy перед всеми сервисами, выпускает и продлевает
TLS-сертификаты автоматически.

**Hyperswitch** — self-hosted платёжный процессор (карты/банковские переводы).

**BTCPay Server** — self-hosted приём криптоплатежей.

**Formance** — внутренний ledger (бухгалтерский учёт транзакций), отдельно от
Supabase `orders`.

**Cloudflare R2** — S3-совместимое хранилище; сейчас используется для
подписанных ссылок на скачивание цифровых товаров (`packages/lib/src/r2.ts`).
Целевое хранилище для медиа Directus после переезда с локального диска.

**Plausible** — self-hosted веб-аналитика без cookie; проксируется через
`/stats/*` в `next.config.js`, чтобы обходить блокировщики рекламы.
Опциональна — сайт должен собираться и работать без неё.

**gitleaks** — сканер секретов в git-истории, часть CI (`.github/workflows/ci.yml`).
