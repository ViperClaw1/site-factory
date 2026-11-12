# Схема Directus

## Как выгружать снапшот (обязательно после любого изменения структуры)

```bash
docker exec sitefactory-infra-directus npx directus schema snapshot \
  --yes /directus/uploads/snapshot.yaml
```

Скопировать файл из контейнера в `docs/directus-snapshot.yaml` и закоммитить.
Цель — чтобы изменения коллекций были видны в diff PR, а не только в админке
Directus задним числом.

**Статус на 2026-11-12:** снапшот выгружен с рабочего инстанса `cms.vcpath.us`
(Directus 12.2.0) и лежит рядом — `docs/directus-snapshot.yaml`. В нём 6 коллекций
(`sites`, `pages`, `blocks`, `collections`, `characters`, `instructors`), UUID
первичные ключи, связи `pages.site → sites`, `blocks.page → pages` (каскадное
удаление), файловые поля → `directus_files`.

## Известные коллекции (по `packages/types/src/cms.ts`)

Типы в `DirectusSchema` (`packages/lib/src/directus.ts`) — единственный
источник правды на стороне кода до появления снапшота:

| Коллекция | Назначение | Ключевые поля |
|---|---|---|
| `sites` | Реестр сайтов фабрики | `slug`, `domain`, `theme`, `name` |
| `pages` | Страницы конкретного сайта | `site`, `slug`, `seo_title/description/image`, `blocks[]`, `status` |
| `blocks` | Блочный конструктор страницы | `page`, `type`, `sort`, `data` (произвольный JSON) |
| `collections` | Редакторские коллекции для каталога (`/collections`) | `slug`, `name`, `hero_image`, `series`, `status` |
| `characters` | Персонажи для каталога (`/characters`) | `slug`, `name`, `image`, `status` |

`collections`/`characters` — это **не** каталог товаров. Товары живут в
Supabase (`products`); Directus здесь отвечает только за историю/визуал,
который редактирует контент-менеджер. См. `docs/architecture.md`.

## Открытый вопрос: формат поля `image` / `hero_image`

**Решено 2026-11-12 (по снапшоту):** поля `image` / `hero_image` / `seo_image` —
это file-relation на `directus_files` (тип `uuid`, special `file`), то есть
Directus возвращает UUID файла, а не URL. Значит `components/CharacterCard.tsx`
и `CollectionCard.tsx` нужно перевести на `getDirectusAssetUrl(character.image)`
из `@repo/lib`. Если файл не задан — `null`, компонент должен показать плейсхолдер.

## CORS

С 12.11.2026 `CORS_ORIGIN` включает домены площадок: `https://cms.vcpath.us`,
`https://vcpath.us`, `https://path.vcpath.us`, `https://anima.vcpath.us`,
`https://news.vcpath.us`, `https://crm.vcpath.us`, `https://vibe.vcpath.us`.
Новый домен добавляется в `.env` (`DIRECTUS_CORS_ORIGIN`) и пересозданием контейнера.
Проверка: `curl -sI -H 'Origin: https://<домен>' https://cms.vcpath.us/server/ping`
— в ответе должен быть `access-control-allow-origin`.
