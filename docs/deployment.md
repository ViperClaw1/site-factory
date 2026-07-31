# Деплой

## Пайплайн

```
push в ветку
      ↓
GitHub Actions: lint / typecheck / build / gitleaks   (.github/workflows/ci.yml)
      ↓
Pull Request → апрув владельца → merge в main
      ↓
Actions дёргает webhook Coolify
      ↓
Coolify сам клонирует репозиторий, собирает образ, разворачивает
```

Вручную на сервер никто не заливает. Доступ в панель Coolify большинству
разработчиков не нужен — работа идёт через git.

- `Auto Deploy` для боевых веток выключен намеренно: выкатка идёт по вебхуку
  после апрува PR, а не по факту push. Для черновых веток — включён.
- CI (`.github/workflows/ci.yml`) использует
  `turbo run <task> --filter='...[origin/main]'` — turbo сам ограничивает
  работу пакетами, затронутыми диффом, включая зависимость от `packages/*`.
  Отдельный `dorny/paths-filter` не заводили — см. `docs/conventions.md` про
  почему.

## Coolify: одно приложение на сайт

Для монорепо в Coolify на каждый сайт — отдельное приложение с указанием
`Base Directory`, например `apps/site01-path-marketplace`. Собирается из
`apps/site01-path-marketplace/Dockerfile` (build context — корень репозитория,
см. комментарий в файле): `turbo prune` перед `pnpm install` — без этого любая
правка тянет пересборку всего монорепозитория, и на двадцати сайтах сборки
встанут.

Health-check — `GET /api/health`, без него Coolify не отличит поднявшийся
контейнер от упавшего.

## Сеть и порты

| Что | Значение |
|---|---|
| Сети Docker | `traefik-public` (наружу), `shared-data` (до Postgres/Redis) |
| Postgres | `shared-infra-postgres:5432`, своя БД и роль на проект |
| Redis | `shared-infra-redis:6379`, **db 3** для site-factory (0 — общий, уже был инцидент из-за пересечения ключей) |
| TLS | Traefik, сертификаты автоматически |

**Порты наружу не публикуются.** В compose/Coolify — только `expose` либо
`127.0.0.1:порт`. Docker пишет правила в iptables в обход ufw: публикация
порта откроет сервис в интернет несмотря на `default deny` на уровне ufw.

## Что должна прислать команда разработки инфраструктуре

1. Список доменов всех сайтов — нужен для `CORS_ORIGIN` Directus (см.
   `docs/directus-schema.md`). Без него CMS отвечает только на свой домен.
2. Подтверждение, что `NEXT_PUBLIC_DIRECTUS_ASSETS_URL` заведена как отдельная
   переменная (см. `docs/env-template.md`) — до начала наполнения контента,
   после наполнения переделка дороже.

## Секреты в CI/CD

`REVALIDATE_TOKEN` и ключи Supabase/R2 — только в GitHub Actions secrets и
переменных окружения Coolify per-app, никогда в репозитории. `gitleaks` в CI
(`.github/workflows/ci.yml`) — последняя линия защиты, не единственная.
