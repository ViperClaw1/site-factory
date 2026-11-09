# site01 — Admin: загрузка контента каталога

Веб-админка `/admin` вместо CLI-скриптов `scripts/*`: дашборд, создание одного товара, bulk-импорт и экспорт JSON. После записи файлы лежат в Storage-бакете категории, строка — в `products` и `product_variants`, преген и blurhash идут тем же пайплайном, что `images:optimize`, витрина ревалидируется.

Вне MVP: редактор `collectible_story`, Directus, заказы, i18n админки, правка/архив/удаление (P1), XLSX, галерея видео на PDP.

## Доступ

`/admin/**` и `/api/admin/**` только для `roleOf(user) === "admin"`. Гость → `/login?next=/admin`. Залогиненный не-admin на `/admin` → rewrite на 404. Каждый route handler вызывает `requireAdmin()` (`getUser()`, не `getSession()`). `SUPABASE_SERVICE_ROLE_KEY` только в `import "server-only"` модулях.

Роль выдаётся скриптом `node scripts/grant-admin.mjs --email …` (`app_metadata.role = "admin"`).

## Поток загрузки

1. `POST /api/admin/uploads/sign` — проверка mime/size, `ensureBucket`, `createSignedUploadUrl`. Путь объекта: `<slug>/<nanoid(10)>.<ext>`.
2. Браузер грузит файл напрямую (`uploadToSignedUrl`), для видео ещё poster (кадр с `<video>` → canvas).
3. `POST /api/admin/products` — объекты существуют и лежат в префиксе slug, sharp проверяет картинку, pregen `thumb/gallery/hero` + blurhash. Сбой pregen не валит товар (warning). Видео без транскода. Запись через RPC `admin_create_product_v2`. При ошибке загруженные объекты этого slug удаляются, если на них не ссылается товар.
4. `revalidatePath` для `/`, `/shop`, `/shop/<category>`, `/p/<slug>`.

Bulk — тот же цикл на клиенте, concurrency 3. Без JSON: строка на файл, title из имени, группировка по префиксу `name-1` / `name-2` опциональна.

## Формат JSON для импорта и экспорта

Одна структура для всех категорий. Экспорт (`POST /api/admin/products/export`) и шаблон из модалки используют её же, поэтому экспорт можно загрузить обратно.

```json
{
  "version": 1,
  "products": [
    {
      "title": "Fantasia Blind Box",
      "category": "collectible_toys",
      "price": 16.99,
      "media": [
        { "file": "molly-1.webp", "alt": "Front" },
        { "url": "https://example.com/molly-2.webp" }
      ],
      "slug": "molly-fantasia-blind-box",
      "description": "Vol.8 blind box",
      "type": "physical",
      "status": "active",
      "weightGrams": 180,
      "character": "Molly",
      "series": "Vol.8",
      "collection": "fantasia",
      "collectible": {
        "editionSize": 500,
        "story": [{ "title": "The Den", "body": "…", "image": "https://example.com/den.webp" }]
      },
      "variants": [
        { "sku": "MOLLY-BOX-STD", "attributes": { "edition": "standard" }, "stock": 25 },
        { "sku": "MOLLY-BOX-GOLD", "attributes": { "edition": "gold" }, "price": 29.99, "stock": 5 }
      ]
    }
  ]
}
```

| Поле | Обязательно | Правила |
| --- | --- | --- |
| `version` | да | Сейчас `1`. |
| `exportedAt` | нет | Пишет экспорт, импорт не использует. |
| `title` | да | 2–120 символов. |
| `category` | да | `toys`, `collectible_toys`, `books`, `artbooks`, `designs`, `merch`, `figures`. |
| `price` | да | USD, больше 0, до 2 знаков. Строки `$16.99` и `16,99` тоже принимаются. |
| `media[]` | да, 1–20 | Ровно одно из `file` (имя файла, загруженного рядом с JSON) или `url` (http/https либо путь от корня сайта, `/seed/x.jpg`), плюс необязательный `alt`. |
| `slug` | нет | По умолчанию из `character` и `title`. |
| `type` | нет | `physical` (по умолчанию) или `digital`. |
| `status` | нет | `active` (по умолчанию), `draft`, `archived`. |
| `weightGrams`, `character`, `series`, `collection`, `description` | нет | Колонки `products`. |
| `collectible` | нет | Если поле есть, товар коллекционный. `editionSize`, `story[]` (`title`, `body`, `image`). `isCollectible: false` пишет только экспорт, для товаров с тиражом без этого флага. |
| `variants[]` | нет | `stock` обязателен. `attributes` — строки (`size`, `color`, `format`). Без `price` действует цена товара. Без `sku` код генерируется как `<SLUG>-<n>`. Без `variants` создаётся один вариант `<SLUG>-STD` со стоком по умолчанию (25 или 9999 для digital). |

- Характеристики категории без отдельной колонки (автор, материал) пишутся в `description` или в `variants[].attributes`.
- Неизвестные ключи и неверные типы — ошибка в файле с указанием товара (`products[3].media[0]: …`). Такой товар не попадает в превью, остальные загружаются. Повторы slug и SKU внутри файла обрабатываются так же.
- Ошибки в значениях `title`, `category`, `price`, `type`, `status` показываются в ячейках превью, их можно поправить там.
- `story[].image` хранится как строка и в Storage не загружается.
- `media[].url` скачивает браузер, поэтому хост должен разрешать CORS. Иначе строка падает с ошибкой, и файл нужно приложить. Постер видео снимается в браузере и в файл не экспортируется.

**Существующий slug.** Перед превью идёт `POST /api/admin/products/slugs`. Строка с занятым slug помечается и по умолчанию снята. Если поставить галочку, создаётся копия с новым slug и новыми SKU. Существующие товары импорт не меняет.

**Экспорт.** `Export selected (N)` выгружает отмеченные товары (выбор сохраняется между страницами). `Export all` выгружает весь каталог, а при активных фильтрах (`Export filtered`) — только совпадения.

Витрина пока не показывает выбор варианта и `collectible_story`: данные сохраняются, `StockCounter` показывает сумму по вариантам.

## Бакеты

`bucketForCategory` — identity. На целевом Supabase бакет `collectible_toys` создаётся. Глобальный лимит Storage проекта сейчас 50 МБ: API отклоняет `file_size_limit` 200 МБ. Миграция всё равно пишет 209715200; runtime `ensureBucket` откатывается на 50 МБ. Подробности в `specs/Environment Setup.md`.

Legacy `characters` и `toys` остаются в `PRODUCT_IMAGE_BUCKETS`. Пайплайн вынесен в `lib/media/pipeline.mjs`, скрипты реэкспортируют его.

## Фазы

0. Зависимости `zod`, `nanoid`; `lib/catalog-taxonomy.mjs`.
1. Общий media pipeline, регрессия `images:pregen` / `images:blurhash`.
2. Тип `ProductImage` с video, миграция бакетов и RPC, `coverImage` на витрине.
3. RBAC `admin`, middleware, service-role client, `grant-admin`.
4. Zod-схема и API sign / list / create.
5. Дашборд и модалка одного товара.
6. Bulk JSON / quick mode, экспорт JSON.
7. P1 (не в этом заходе): edit, archive, delete, XLSX, галерея на PDP.
8. `tests/admin.spec.ts`, Environment Setup, README.
