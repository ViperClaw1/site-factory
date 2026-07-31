# Схема Directus

## Как выгружать снапшот (обязательно после любого изменения структуры)

```bash
docker exec sitefactory-infra-directus npx directus schema snapshot \
  --yes /directus/uploads/snapshot.yaml
```

Скопировать файл из контейнера в `docs/directus-snapshot.yaml` и закоммитить.
Цель — чтобы изменения коллекций были видны в diff PR, а не только в админке
Directus задним числом.

**Статус на 2026-07-31: снапшот ещё не выгружался** — в этой сессии нет
доступа к работающему инстансу Directus, поэтому файл `directus-snapshot.yaml`
в репозитории отсутствует. Это нужно сделать вручную после того, как Directus
поднимется на `cms.vcpath.us` (см. письмо от инфраструктуры, п. 6), и повторять
при каждом изменении структуры коллекций.

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

В `packages/types/src/cms.ts` эти поля типизированы как `string | null` и в
`components/CharacterCard.tsx` / `CollectionCard.tsx` используются напрямую
как `src`. Directus SDK по умолчанию возвращает для файловых полей UUID файла,
а не готовый URL — если в реальной схеме `image` действительно file-relation,
эти компоненты нужно обновить на `getDirectusAssetUrl(character.image)`
(добавлен в `@repo/lib`, см. `docs/env-template.md`). Если поле в Directus —
текстовое с уже готовым URL, менять ничего не нужно. Уточнить при первой
выгрузке снапшота.

## CORS

Пока список публичных доменов сайтов не передан инфраструктуре,
`CORS_ORIGIN` у Directus сконфигурирован только на собственный домен — браузер
не сможет забрать контент напрямую. Список нужно отправить (см. письмо от
инфраструктуры, п. 5.1) до того, как второй сайт пойдёт в прод.
