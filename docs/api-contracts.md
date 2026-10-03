# API-контракты

## Внутренние (Next.js route handlers)

### `POST /api/revalidate`

Вебхук из Directus: срабатывает при publish/update, чтобы страницы с
`revalidate = 60` получали свежий контент сразу, а не ждали истечения TTL.

**Контракт с 2026-07-31** (обновлён — старая версия принимала токен в query,
это считалось скомпрометированным с первого же запроса, см. `docs/deployment.md`):

```
POST /api/revalidate?path=/collections/my-slug
X-Revalidate-Signature: <hex hmac_sha256(REVALIDATE_TOKEN, path)>
```

- Подпись считается по значению `path` из query-строки (то, что реально
  инвалидируется), а не по токену напрямую — это отдельно от передачи самого
  секрета и не даёт заменить `path` без пересчёта подписи.
- Сравнение — `crypto.timingSafeEqual`, не `!==`.
- Ответ: `{ revalidated: true, path, now }` / `401` при неверной подписи.
- **Directus нужно настроить** на отправку этого заголовка — вебхук в
  Directus должен считать HMAC перед запросом. Это задача на стороне
  конфигурации Directus-flow, не на стороне Next.js.

### `GET /api/health`

Без параметров, без обращения к Directus/Supabase — только подтверждает, что
процесс Next.js жив. Используется Coolify как health-check контейнера.
Ответ: `{ status: "ok" }`, код 200.

Осознанно не проверяет доступность Directus/Supabase: если упадёт CMS, это не
должно приводить к тому, что Coolify считает сайт мёртвым и убивает
контейнер, который сам по себе жив (см. `lib/api-client.ts` — сайт и так
fail-soft на недоступность бэкендов).

## Внутренние (server-side data access, `lib/api-client.ts` в каждом сайте)

Не HTTP-контракт, но общий паттерн между сайтами — при добавлении нового
сайта копировать сигнатуры, не изобретать заново:

| Функция | Источник | Возврат при ошибке |
|---|---|---|
| `getCollections()` | Directus `collections`, `status = published` | `[]` |
| `getCollection(slug)` | Directus `collections` | `null` |
| `getCharacters()` | Directus `characters`, `status = published` | `[]` |
| `getCharacter(slug)` | Directus `characters` | `null` |
| `getProducts(filters)` | Supabase `products`, `status = active` | `[]` |

`ProductFilters`: `category?`, `collection?`, `character?`,
`sort?: "newest" | "price_asc" | "price_desc"`.

## Внешние зависимости

- **Directus REST** через `@directus/sdk` (`createDirectusClient`,
  `readItems`) — см. `docs/directus-schema.md` для коллекций.
- **Supabase** через `@supabase/supabase-js` / `@supabase/ssr` — анонимный
  ключ для публичных каталожных чтений (`createSupabasePublicClient`),
  серверный клиент с сессией (`createSupabaseServerClient`) для всего, что
  требует `auth.uid()` (заказы, wishlist, digital access — см. RLS-политики
  в `apps/site01-path-marketplace/supabase/migrations/`).
- **R2** (`packages/lib/src/r2.ts`) — подписанные URL на скачивание
  (`generateSignedUrl`), для цифровых товаров за `digital_access`.

## Не реализовано

Страницы отдельного товара (`/shop/[category]/[slug]`) нет — только листинг
категории. Когда появится, обязательна к подключению JSON-LD
(`generateProductJsonLd` из `@repo/lib`, см. `docs/conventions.md`) и запись
в `app/sitemap.ts`.
