# site01 — Admin: загрузка контента каталога

Веб-админка `/admin` вместо CLI-скриптов `scripts/*`: дашборд, создание одного товара и bulk-импорт CSV. После записи файлы лежат в Storage-бакете категории, строка — в `products` и `product_variants`, преген и blurhash идут тем же пайплайном, что `images:optimize`, витрина ревалидируется.

Вне MVP: редактор `collectible_story`, Directus, заказы, i18n админки, правка/архив/удаление (P1), XLSX, галерея видео на PDP.

## Доступ

`/admin/**` и `/api/admin/**` только для `roleOf(user) === "admin"`. Гость → `/login?next=/admin`. Залогиненный не-admin на `/admin` → rewrite на 404. Каждый route handler вызывает `requireAdmin()` (`getUser()`, не `getSession()`). `SUPABASE_SERVICE_ROLE_KEY` только в `import "server-only"` модулях.

Роль выдаётся скриптом `node scripts/grant-admin.mjs --email …` (`app_metadata.role = "admin"`).

## Поток загрузки

1. `POST /api/admin/uploads/sign` — проверка mime/size, `ensureBucket`, `createSignedUploadUrl`. Путь объекта: `<slug>/<nanoid(10)>.<ext>`.
2. Браузер грузит файл напрямую (`uploadToSignedUrl`), для видео ещё poster (кадр с `<video>` → canvas).
3. `POST /api/admin/products` — объекты существуют и лежат в префиксе slug, sharp проверяет картинку, pregen `thumb/gallery/hero` + blurhash. Сбой pregen не валит товар (warning). Видео без транскода. Запись через RPC `admin_create_product`. При ошибке загруженные объекты этого slug удаляются, если на них не ссылается товар.
4. `revalidatePath` для `/`, `/shop`, `/shop/<category>`, `/p/<slug>`.

Bulk — тот же цикл на клиенте, concurrency 3. CSV: `title,category,price,media` обязательны, `media` через `;`, цена `16.99` / `$16.99` / `16,99`. Без CSV: строка на файл, title из имени, группировка по префиксу `name-1` / `name-2` опциональна.

## Бакеты

`bucketForCategory` — identity. На целевом Supabase бакет `collectible_toys` создаётся. Глобальный лимит Storage проекта сейчас 50 МБ: API отклоняет `file_size_limit` 200 МБ. Миграция всё равно пишет 209715200; runtime `ensureBucket` откатывается на 50 МБ. Подробности в `specs/Environment Setup.md`.

Legacy `characters` и `toys` остаются в `PRODUCT_IMAGE_BUCKETS`. Пайплайн вынесен в `lib/media/pipeline.mjs`, скрипты реэкспортируют его.

## Фазы

0. Зависимости `zod`, `papaparse`, `nanoid`; `lib/catalog-taxonomy.mjs`.
1. Общий media pipeline, регрессия `images:pregen` / `images:blurhash`.
2. Тип `ProductImage` с video, миграция бакетов и RPC, `coverImage` на витрине.
3. RBAC `admin`, middleware, service-role client, `grant-admin`.
4. Zod-схема и API sign / list / create.
5. Дашборд и модалка одного товара.
6. Bulk CSV / quick mode.
7. P1 (не в этом заходе): edit, archive, delete, XLSX, галерея на PDP.
8. `tests/admin.spec.ts`, Environment Setup, README.
