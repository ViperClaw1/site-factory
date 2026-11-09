# Конвенции разработки

## Именование

- Приложения: `apps/siteNN-slug`, package name `@repo/siteNN-slug` (см.
  `apps/site01-path-marketplace/package.json`).
- Общие пакеты: `@repo/ui`, `@repo/lib`, `@repo/types`, `@repo/config`,
  подключаются как `workspace:*`.
- Серверные модули `@repo/lib` (Directus, R2, серверный Supabase-клиент) не
  экспортируются из барреля `@repo/lib` — импортируются напрямую
  (`@repo/lib/directus`, `@repo/lib/supabase-server`, `@repo/lib/r2`), чтобы
  секреты и server-only код не попадали в клиентский бандл случайным `import`.
  Не добавляйте их в `src/index.ts`.

## Переменные окружения

- `NEXT_PUBLIC_*` — единственное, что может попасть в клиентский бандл.
  Всё остальное (`DIRECTUS_URL`, `R2_*`, `REVALIDATE_TOKEN`) — server-only.
- URL контента и URL медиа Directus — **разные переменные**
  (`NEXT_PUBLIC_DIRECTUS_URL` / `NEXT_PUBLIC_DIRECTUS_ASSETS_URL`), даже если
  сейчас указывают на один хост. Используйте `getDirectusAssetUrl()` из
  `@repo/lib` вместо ручной конкатенации строк — см. `docs/env-template.md`.
- Полный список переменных — `docs/env-template.md`.

## Работа с внешними сервисами (Directus/Supabase)

Паттерн, принятый в `lib/api-client.ts` — повторяйте его в новых сайтах:

```ts
export async function getX(): Promise<X[]> {
  try {
    return await withTimeout(directus.request(readItems(...)));
  } catch (error) {
    console.error("getX failed", error);
    return [];
  }
}
```

- Всегда таймаут (`FETCH_TIMEOUT_MS`, сейчас 5с) — недоступный Directus/Supabase
  не должен вешать рендер страницы.
- Всегда fail-soft на чтении публичного контента: пустой массив/`null`, а не
  проброшенное исключение — страница должна отрендерить пустое состояние, а
  не отдать 500.
- Это правило для **чтения публичного контента**. Для мутаций (заказы,
  оплата) fail-soft неприемлем — ошибка должна долетать до пользователя.

## SEO

- Метаданные страницы — через `generateMetadata()` из `@repo/lib`, не руками.
- JSON-LD — через `generateProductJsonLd` / `generateBreadcrumbJsonLd` из
  `@repo/lib` (добавлены 2026-07-31, пока не подключены ни к одной странице —
  индивидуальной страницы товара ещё нет).
- `app/sitemap.ts` — обязателен в каждом сайте, требует `BASE_URL`.

## Локализация

Язык определяется адресом: `/en/…`, `/de/…`. Маршруты, реестр языков и меню
живут в общем пакете `packages/i18n`, словари — в `lib/i18n/` каждого приложения:

```
packages/i18n/src/locales.ts        реестр: порядок, код в адресе, тег hreflang
packages/i18n/src/routing.ts        withLocale, stripLocale, localeOf, pickLocale
packages/i18n/src/metadata.ts       alternates, localeMetadata, sitemapEntries, localizedPaths
packages/i18n/src/middleware.ts     редиректы адресов без языка
packages/i18n/src/client.tsx        Link, useLocalizedRouter, useLocale, LanguageLink, LanguageMenu, Flag
lib/i18n/dictionaries/en.ts         английский — источник ключей (`export type Dict`)
lib/i18n/dictionaries/<code>.ts     остальные языки: `const xx: Dict = { ... }`
lib/i18n/dictionaries/index.ts      `dictionaries: Record<Lang, Dict>`
```

- Страницы лежат в `app/[locale]/`. Вне префикса остаются `/api`, `/auth/callback`,
  `/admin` (свой корневой layout), `/stats` (прокси Plausible) и файлы. Добавляя
  такой адрес, обновите `LOCALE_FREE` в `routing.ts` и `matcher` в `middleware.ts`.
- Ссылки — только `Link` из `@repo/i18n/client`, переходы — `useLocalizedRouter`,
  серверный редирект — `redirect(withLocale(path, lang))`. Прямой импорт из `next/link`
  вне `app/admin` запрещён правилом ESLint. Параметр `next` передаётся с языком.
- У каждой страницы есть `generateMetadata` с `alternates(path, lang)` или
  `localeMetadata(path)`. У клиентской страницы он лежит в соседнем `layout.tsx`.
- Не читайте `cookies()` и `headers()` в корневых layout: это отключает ISR на всём
  сайте. Cookie `lang` нужна только для выбора языка на адресах без префикса.
- Сброс кэша страницы: `localizedPaths(path)` и `revalidatePath` на каждый адрес.
- Английский (`en`) — язык по умолчанию и единственный источник ключей. Остальные
  словари типизированы как `Dict`, поэтому пропущенный перевод — ошибка компиляции.
- 19 языков и их теги живут в `locales.ts`. Арабский включает `dir="rtl"` на `<html>`.
  Новые локали добавляются строкой в `LOCALES` и файлом в `dictionaries/` каждого сайта.
- Переводы контента из БД (курсы, товары) — отдельно от UI-словаря: колонка
  `i18n` jsonb и `localize()` (site02). Не смешивать их со словарём интерфейса.

## Аналитика

Обёртка над Plausible (`packages/lib/src/analytics.ts`) должна оставаться
опциональной: если `NEXT_PUBLIC_PLAUSIBLE_URL` не задан, сайт обязан
собираться и работать без аналитики (см. условный rewrite в
`next.config.js` — до 2026-07-31 при пустой переменной получался битый путь
`undefined/js/script.js`).

## CI

ESLint запускается в каждом пакете (`eslint .`) с общим конфигом
`packages/config/eslint.config.js`. Новому приложению или пакету нужны скрипт `lint`,
зависимость `eslint` и файл `eslint.config.js` из одной строки: `require` общего конфига.
Границы между пакетами проверяет `boundaries/element-types`: новый пакет добавьте в его
`elements` и `rules`, иначе его импорты не проверяются.

`pnpm exec turbo run <task> --filter='...[origin/main]'` — turbo сам по графу
зависимостей определяет, какие пакеты и приложения задел diff, включая
изменения в `packages/*`. Отдельный `dorny/paths-filter` не нужен: он решает
ту же задачу хуже (без учёта графа зависимостей монорепо) и добавляет ещё один
источник расхождений между «что перезапустилось в CI» и «что turbo считает
затронутым».
