# Переменные окружения

Реальный `.env.example` лежит в `apps/site01-path-marketplace/.env.example`
(не воспроизводится здесь целиком, чтобы не плодить два места, которые могут
разойтись) — этот файл объясняет **что означает** каждая группа и почему она
разделена именно так. Список ниже собран сканом `process.env.*` по коду на
2026-07-31, при добавлении новой переменной — дополнить эту таблицу.

## Directus (контент)

| Переменная | Публичная? | Назначение |
|---|---|---|
| `DIRECTUS_URL` | нет | Server-only клиент (`@repo/lib/directus`) для чтения `collections`/`characters`/`pages` |
| `NEXT_PUBLIC_DIRECTUS_URL` | да | Пока не используется напрямую в коде site01, зарезервирована для клиентских запросов к API |
| `NEXT_PUBLIC_DIRECTUS_ASSETS_URL` | да | **Отдельный адрес для медиа**, см. ниже — используется через `getDirectusAssetUrl()` из `@repo/lib` |

### Почему `NEXT_PUBLIC_DIRECTUS_ASSETS_URL` — отдельная переменная, а не путь под общим API-URL

`https://cms.vcpath.us` и `https://assets.vcpath.us` сейчас указывают на один
сервер — разница проявится, когда медиа (самая быстрорастущая часть бюджета
инфраструктуры) переедет на Cloudflare R2 / CDN. Если URL картинок на всех
сайтах фабрики собраны из `NEXT_PUBLIC_DIRECTUS_URL + "/assets/..."`, переезд
превращается в переписывание URL внутри контента базы данных на двадцати
сайтах. Если через отдельную переменную — это смена одной DNS-записи и один
редеплой. Побочный эффект: cookie сессии админки Directus привязана к
`cms.`-домену и не улетает с каждым запросом картинки на публичных страницах.

**Правило:** новый код никогда не строит URL картинки из
`NEXT_PUBLIC_DIRECTUS_URL` вручную — только через `getDirectusAssetUrl(assetId)`
(`packages/lib/src/media.ts`).

## Supabase (коммерция)

| Переменная | Публичная? | Назначение |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | да | Все три клиента: browser/public/server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | да | anon-ключ, RLS ограничивает доступ на уровне БД (см. `supabase/migrations/`) |

Supabase Cloud Pro сейчас, self-hosted — в плане. Код не завязан ни на что
специфичное для облака (только URL + anon key), переезд должен быть сменой
`.env`, не кода — см. `docs/conventions.md`.

## Прочее

| Переменная | Публичная? | Назначение |
|---|---|---|
| `BASE_URL` | нет | Канонические URL в метаданных (`generateMetadata`) и `app/sitemap.ts` |
| `NEXT_PUBLIC_SITE_DOMAIN` | да | Домен для Plausible (`PlausibleProvider domain=`) |
| `NEXT_PUBLIC_PLAUSIBLE_URL` | да | Self-hosted Plausible; **опционально** — при отсутствии рewrite в `next.config.js` просто отключается, сборка не падает |
| `REVALIDATE_TOKEN` | нет | Секрет для HMAC-подписи `/api/revalidate` — см. `docs/api-contracts.md`. Больше не передаётся как значение токена в запросе, только как ключ для проверки подписи |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | нет | Cloudflare R2, подписанные URL для цифровых товаров (`packages/lib/src/r2.ts`) |

## Redis

Не читается напрямую из `apps/site01-path-marketplace` на 2026-07-31 (в коде
сайта нет клиента Redis), но зарезервирован инфраструктурой:
`shared-infra-redis:6379`, **db 3** для site-factory. Если/когда появится
кэш-слой на стороне сайта — использовать db 3, не 0. Общий номер 0 уже
приводил к инциденту, когда сервисы разбирали чужие ключи.

## Чек-лист для нового сайта

1. Скопировать `.env.example` из `apps/site01-path-marketplace`.
2. Завести отдельную БД/роль Postgres на проект (не шарить с другими сайтами).
3. `NEXT_PUBLIC_SITE_DOMAIN` — домен именно этого сайта (нужен и для Plausible,
   и для `CORS_ORIGIN` на стороне Directus, см. `docs/directus-schema.md`).
4. Если сайт использует Redis — db 3, без исключений.
