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

Общий каркас — каталог `lib/i18n/` в каждом приложении (так сделано в
`site02-edu-marketplace` и `site01-path-marketplace`):

```
lib/i18n/locales.ts                 список локалей: { code, label, native } + BCP 47
lib/i18n/dictionaries/en.ts         английский — источник ключей (`export type Dict`)
lib/i18n/dictionaries/<code>.ts     остальные языки: `const xx: Dict = { ... }`
lib/i18n/dictionaries/index.ts      `dictionaries: Record<Lang, Dict>`
```

- Английский (`en`, тег `en-US`) — язык по умолчанию и единственный источник
  ключей. Остальные словари типизированы как `Dict`, поэтому пропущенный
  перевод — ошибка компиляции.
- Набор из 16 локалей и их теги живут в `locales.ts`. Японский — `ja-JP`
  (`ja-SP` невалидный регион). Арабский включает `dir="rtl"` на `<html>`.
- Как приложение хранит выбор языка (cookie + `LanguageProvider` в site02,
  zustand в site01) и форму ключей (вложенные объекты или плоские строки с
  `{placeholder}`) остаётся за приложением. Новые локали добавляются файлом
  в `dictionaries/` и строкой в `LOCALES`, а не свалкой в один `messages.ts`.
- Переводы контента из БД (курсы, товары) — отдельно от UI-словаря: колонка
  `i18n` jsonb и `localize()` (site02). Не смешивать их со словарём интерфейса.

## Аналитика

Обёртка над Plausible (`packages/lib/src/analytics.ts`) должна оставаться
опциональной: если `NEXT_PUBLIC_PLAUSIBLE_URL` не задан, сайт обязан
собираться и работать без аналитики (см. условный rewrite в
`next.config.js` — до 2026-07-31 при пустой переменной получался битый путь
`undefined/js/script.js`).

## CI

`pnpm exec turbo run <task> --filter='...[origin/main]'` — turbo сам по графу
зависимостей определяет, какие пакеты и приложения задел diff, включая
изменения в `packages/*`. Отдельный `dorny/paths-filter` не нужен: он решает
ту же задачу хуже (без учёта графа зависимостей монорепо) и добавляет ещё один
источник расхождений между «что перезапустилось в CI» и «что turbo считает
затронутым».
