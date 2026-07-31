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

## Локализация (заложить в `apps/site-template`, не в отдельные сайты)

ТЗ требует `next-intl`, 16 локалей, поддержку RTL для арабского. На момент
написания этого документа в репозитории нет ни одного сайта с i18n — это
архитектурное решение, которое нужно принять один раз в шаблоне. Добавлять
i18n в `site01` отдельно, а потом переносить в шаблон — гарантированная
переделка (то же соображение, что и в письме от инфраструктуры про сам шаблон).

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
