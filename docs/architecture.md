# Архитектура site-factory

## Что это

Turborepo-монорепозиторий, из которого собирается ~20 тематически разных
сайтов на общем стеке: Next.js 14 (App Router) + общие пакеты UI/типов/клиентов
+ единая инфраструктура на одном сервере.

```
apps/
  site01-path-marketplace/   # первый сайт: маркетплейс коллекционных игрушек
  ...                        # site02..site20 по мере запуска
packages/
  ui/       # React-примитивы (Button, Card, Grid, Modal, ...)
  lib/      # клиенты Directus/Supabase/R2, SEO-хелперы, аналитика, форматирование
  types/    # общие типы: cms.ts (Directus), commerce.ts / payments.ts / subscriptions.ts (Supabase)
  config/   # eslint, tsconfig.base, tailwind.preset
```

`apps/site-template` в репозитории пока не существует — на данный момент есть
только `site01-path-marketplace`. Как только появится второй сайт, общие куски
(layout-обвязка, health-check, revalidate-роут, next.config.js) должны
переехать в шаблон, а не копироваться руками между сайтами.

## Источники данных: два независимых бэкенда

Сайты читают из двух разных систем, и это осознанное разделение, не историческая
случайность:

- **Directus** (`packages/lib/src/directus.ts`) — редакторский контент:
  `sites`, `pages`, `blocks`, `collections`, `characters`. То, что правит
  контент-менеджер: обложки, описания, сторителлинг.
- **Supabase** (`packages/lib/src/supabase.ts`, `supabase-server.ts`) —
  коммерческие данные: `products`, `orders`, `subscriptions`, `wishlists`,
  `digital_access`. Источник правды для каталога и всего, что связано с
  деньгами и авторизацией пользователя.

`lib/api-client.ts` в каждом сайте — единственное место, где эти два источника
смешиваются на уровне страницы (см. `docs/api-contracts.md`).

## Рендеринг и обновление контента

Страницы каталога используют `revalidate = 60` (ISR, ADR-004): страница
кэшируется и перегенерируется не чаще раза в 60 секунд, а `/api/revalidate`,
который дёргает Directus-вебхук при публикации/обновлении записи, сбрасывает
кэш сразу. `revalidate = 0` здесь не использовать — это полное отключение кэша
(рендер на каждый запрос), и вебхук тогда ничего не делает.

## Деплой (кратко, подробности — `docs/deployment.md`)

```
push → GitHub Actions (lint/typecheck/build/gitleaks) → PR → merge в main
     → Actions дёргает webhook Coolify → Coolify собирает образ и разворачивает
```

Каждый сайт — отдельное приложение в Coolify с своим `Base Directory`
(`apps/siteNN-...`). Общая инфраструктура одна на все сайты:

| Компонент | Адрес |
|---|---|
| Directus (контент/API) | `https://cms.vcpath.us` |
| Directus (медиа) | `https://assets.vcpath.us` |
| Postgres | `shared-infra-postgres:5432` (своя БД/роль на проект) |
| Redis | `shared-infra-redis:6379`, db 3 для site-factory |
| Docker-сети | `traefik-public` (наружу), `shared-data` (до БД) |

## Известные архитектурные долги

- `apps/site-template` не выделен — см. выше.
- Локализация (`next-intl`, 16 языков, RTL) в коде отсутствует — заложить в
  шаблон, не в отдельные сайты (см. `docs/conventions.md`).
- Индивидуальной страницы товара (`/shop/[category]/[slug]`) ещё нет, только
  листинг категории — `docs/api-contracts.md` и `app/sitemap.ts` это отражают.
