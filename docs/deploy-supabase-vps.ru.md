# Деплой site01 + site02 на self-hosted Supabase VPS (GitHub Actions)

English version: [`deploy-supabase-vps.en.md`](./deploy-supabase-vps.en.md)

Для кого: DevOps-инженер, который отвечает за VPS. Документ описывает два
приложения: `apps/site01-path-marketplace` (магазин игрушек) и
`apps/site02-edu-marketplace` (маркетплейс курсов). Для этих двух сайтов он
заменяет схему с Coolify из [`deployment.md`](./deployment.md). Существующий
`ci.yml` (lint, type-check, build, gitleaks) остаётся как есть.

Все хосты, порты и пути ниже (`site01.example.com`, `/opt/site-factory`,
`5432`…) приведены для примера. Подставьте свои значения.

---

## 1. Что каждому приложению нужно от Supabase

| Возможность | site01 (игрушки) | site02 (курсы) |
|---|---|---|
| Регистрация / вход по email + пароль | ✅ | ✅ |
| Подтверждение email через `/auth/callback` | ✅ | ✅ |
| Google OAuth | — | ✅ |
| Восстановление / сброс пароля | — | ✅ (`/forgot-password` → `/reset-password`) |
| Смена email в профиле | ✅ | — |
| Защита маршрутов (на сервере) | ✅ `middleware.ts`: `/account/*`, `/favorites/*` | только на клиенте |
| Роли | `app_metadata.role` (`admin` / покупатель) | — |
| Бакеты Storage | `avatars` (создаёт миграция), `characters`, `toys` | пока нет |
| Предгенерированные варианты картинок + blurhash | ✅ товары + аватары | — |
| Realtime | `product_variants` (счётчики остатков) | — |
| Миграции БД | `apps/site01-path-marketplace/supabase/migrations/` | `apps/site02-edu-marketplace/supabase/migrations/` |

В site02 пока не реализованы `/api/checkout/create-order`,
`/api/paymesh/webhook` и `/api/media/[lessonId]`: все три отвечают `501`.
Настраивать платежи и медиа для site02 не нужно.

**Приложениям нужны два отдельных инстанса Supabase.** Обе схемы определяют
`orders`, `order_status` и `set_updated_at()`, а в миграции site02 это сказано
прямо («Dedicated Supabase project — do not apply on the toys marketplace
database»).

---

## 2. Целевая схема

```
                        GitHub Actions
   ┌───────────────────────────────────────────────────────────┐
   │ build (Dockerfile) → ghcr.io/<owner>/<app>:<sha>          │
   │ migrate: SSH-туннель → supabase db push (БД своего сайта)  │
   │ deploy: SSH → docker compose pull/up --wait                │
   │ images (site01, вручную): pregen / thumbs / blurhash       │
   └───────────────────────────┬───────────────────────────────┘
                               │ SSH
 VPS ──────────────────────────▼────────────────────────────────
  reverse proxy (Traefik / nginx, TLS)
    site01.example.com      → контейнер site01 :3000
    api.site01.example.com  → Kong стека supabase-site01 :8000
    site02.example.com      → контейнер site02 :3000
    api.site02.example.com  → Kong стека supabase-site02 :8000

  /opt/supabase-site01   (стек supabase/docker №1: db, auth, rest, storage, realtime, kong…)
  /opt/supabase-site02   (стек supabase/docker №2)
  /opt/site-factory      (docker-compose.yml + site01.env + site02.env для двух Next.js-приложений)
```

Нужны четыре DNS-записи: два домена сайтов и два API-домена Supabase.

---

## 3. Стеки Supabase (по одному на сайт)

Пройдите официальную инструкцию по self-hosting (`supabase/docker` в
репозитории `supabase/supabase`) **дважды**: в `/opt/supabase-site01` и в
`/opt/supabase-site02`. Каждый стек запускайте со своим именем проекта
(`docker compose -p supabase-site01 …`).

### 3.1 Два стека на одном хосте

В upstream-файле `docker-compose.yml` жёстко заданы `container_name: supabase-*`
и порты хоста. Для второго стека:

- Переименуйте контейнеры, например `sed -i 's/container_name: supabase-/container_name: s02-supabase-/' docker-compose.yml`.
  То же переименование сделайте в `volumes/logs/vector.yml` (он
  маршрутизирует логи по имени контейнера) или отключите сервисы
  analytics/vector.
- Задайте каждому стеку свои `POSTGRES_PORT`, `POOLER_PROXY_PORT_TRANSACTION`,
  `KONG_HTTP_PORT` и `KONG_HTTPS_PORT`.
- **Публикуйте порты только на 127.0.0.1**, например `"127.0.0.1:${POSTGRES_PORT}:5432"`.
  Docker пишет правила iptables в обход ufw (см. `deployment.md`), поэтому
  Postgres никогда не должен быть доступен из интернета. CI подключается к
  нему через SSH-туннель (§6).
- Задайте каждому стеку свой `POOLER_TENANT_ID`.

### 3.2 `.env` стека: значения, от которых зависят приложения

Сгенерируйте **для каждого стека свои** `JWT_SECRET`, `ANON_KEY`,
`SERVICE_ROLE_KEY`, `POSTGRES_PASSWORD`, `SECRET_KEY_BASE`, `VAULT_ENC_KEY` и
учётные данные дашборда. Приложения используют классическую пару JWT-ключей:
`anon` для сайтов, `service_role` для скриптов в CI.

| Переменная | стек site01 | стек site02 | Зачем |
|---|---|---|---|
| `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL` | `https://api.site01.example.com` | `https://api.site02.example.com` | Публичный адрес API. Это же значение становится `NEXT_PUBLIC_SUPABASE_URL` в приложении |
| `SITE_URL` | `https://site01.example.com` | `https://site02.example.com` | Редирект по умолчанию для писем auth |
| `ADDITIONAL_REDIRECT_URLS` | `https://site01.example.com/auth/callback**` | `https://site02.example.com/auth/callback**` | Все auth-сценарии возвращают на `<origin>/auth/callback?next=…`. Адреса не из списка GoTrue отклоняет |
| `ENABLE_EMAIL_SIGNUP` | `true` | `true` | |
| `ENABLE_EMAIL_AUTOCONFIRM` | `false` | `false` | Приложения рассчитаны на подтверждение по ссылке |
| `DISABLE_SIGNUP` | `false` | `false` | |
| `SMTP_HOST/PORT/USER/PASS/ADMIN_EMAIL/SENDER_NAME` | обязательно | обязательно | Письма подтверждения, смены email (site01) и восстановления пароля (site02) |
| Google (§3.3) | — | обязательно | |

Стандартные шаблоны писем подходят без изменений. Ссылки ведут через
`/auth/v1/verify` на `/auth/callback?code=…`, где вызывается
`exchangeCodeForSession`. PKCE-поток `@supabase/ssr` включён по умолчанию.

**Supabase Studio** открывается через Kong с basic auth
(`DASHBOARD_USERNAME/PASSWORD`). Поставьте надёжные учётные данные или
ограничьте доступ по IP на прокси.

### 3.3 Google OAuth (только стек site02)

Google Cloud Console → APIs & Services → Credentials → OAuth client ID (тип *Web application*):

- Authorized JavaScript origins: `https://site02.example.com`
- Authorized redirect URIs: `https://api.site02.example.com/auth/v1/callback` (домен **API Supabase**, не сайта)
- OAuth consent screen: scopes `openid`, `email`, `profile`; статус *In production*. В режиме *Testing* войти смогут только добавленные тестовые пользователи.

Upstream-compose не передаёт настройки Google в GoTrue. Добавьте их в
`environment:` сервиса `auth`, а значения пропишите в `.env` стека:

```yaml
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: ${GOOGLE_ENABLED}          # true
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_SECRET}
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${API_EXTERNAL_URL}/auth/v1/callback
```

Поток: кнопка «Продолжить с Google» ведёт на
`api.site02…/auth/v1/authorize`, дальше Google, потом
`api.site02…/auth/v1/callback`, потом `site02…/auth/callback?code=…&next=…`,
где ставится cookie сессии. При ошибке пользователь попадает на
`/login?error=oauth`, а в логе контейнера появляется
`[auth/callback] provider error` или `code exchange failed`.

### 3.4 Storage (стек site01)

| Бакет | Публичный | Кто создаёт | Содержимое |
|---|---|---|---|
| `avatars` | да, лимит 2 МБ, jpeg/png/webp | миграция `20260927000000_auth_profiles.sql` | `<uid>/<ts>.<ext>` + `_thumb.webp` (160²) + `_hero.webp` (512²) |
| `characters` | да | `scripts/seed-showcase-catalog.mjs` или SQL ниже | картинки товаров + `_thumb/_gallery/_hero.webp` |
| `toys` | да | то же | то же |

Если seed-скрипт не запускается, создайте бакеты товаров один раз в SQL-редакторе Supabase:

```sql
insert into storage.buckets (id, name, public)
values ('characters', 'characters', true), ('toys', 'toys', true)
on conflict (id) do nothing;
```

В бакеты товаров пишет только service role. Политики `avatars` разрешают
каждому пользователю писать только в свою папку `<uid>/`. Публичные URL
выглядят так:
`https://api.site01.example.com/storage/v1/object/public/<bucket>/<path>`.
Варианты загружаются с `Cache-Control: max-age=31536000`, кэш сбрасывается
параметром `?v=`.

- С файловым бэкендом по умолчанию объекты лежат в `volumes/storage` стека.
  Включите этот каталог в бэкапы вместе с томом Postgres. S3-бэкенд тоже
  подходит.
- imgproxy (преобразования на лету) не используется. Все варианты
  генерируются заранее.
- **Требование hairpin:** контейнер site01 сам обращается к
  `https://api.site01.example.com`. `/api/avatar` скачивает загруженный
  оригинал, `middleware.ts` проверяет сессию. Поэтому публичный API-домен
  должен резолвиться и быть доступен **изнутри контейнера приложения**.

---

## 4. Переменные окружения приложений

Значения `NEXT_PUBLIC_*`, а также всё, что читает `next.config.js` или
статическая генерация, **зашиваются в образ при `docker build`**. После их
изменения нужна пересборка (перезапустить deploy-workflow), простого
рестарта контейнера мало.

Dockerfile для этого не меняется. `.dockerignore` исключает `.env` и
`.env.local`, но **не** `.env.production`. CI пишет
`apps/<app>/.env.production` перед `docker build` (проверено: файл переживает
`turbo prune`), и `next build` его подхватывает. Туда кладутся только
несекретные значения, потому что файл может оказаться внутри образа.

### site01-path-marketplace

| Переменная | Сборка | Рантайм | Секрет | Примечание |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | нет | `https://api.site01.example.com`. Заодно разрешает этот хост для `next/image` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | нет (защищён RLS) | `ANON_KEY` стека site01 |
| `BASE_URL` | ✅ | ✅ | нет | `https://site01.example.com`. Канонические URL, `sitemap.xml` |
| `NEXT_PUBLIC_SITE_DOMAIN` | ✅ | — | нет | Домен для Plausible |
| `NEXT_PUBLIC_PLAUSIBLE_URL` | ✅ | — | нет | опционально. Если не задан, прокси `/stats/*` отключается |
| `NEXT_PUBLIC_DIRECTUS_ASSETS_URL` | ✅ | — | нет | опционально (медиа Directus) |
| `DIRECTUS_URL` | — | ✅ | нет | опционально (Directus CMS) |
| `REVALIDATE_TOKEN` | — | ✅ | **да** | HMAC-ключ для `POST /api/revalidate` |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | — | ✅ | **да** | опционально (подписанные ссылки на цифровые товары) |
| `SUPABASE_SERVICE_ROLE_KEY` | — | **никогда** | **да** | Используется **только** скриптами картинок в CI (§7). Самому приложению не нужен |

### site02-edu-marketplace

| Переменная | Сборка | Рантайм | Секрет | Примечание |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | нет | `https://api.site02.example.com` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | нет | `ANON_KEY` стека site02 |
| `BASE_URL` | ✅ | ✅ | нет | `https://site02.example.com` |
| `NEXT_PUBLIC_SITE_DOMAIN` | ✅ | — | нет | |
| `NEXT_PUBLIC_PLAUSIBLE_URL` | ✅ | — | нет | опционально |
| `REVALIDATE_TOKEN` | — | ✅ | **да** | |

Рантайм-значения хранятся на VPS в `/opt/site-factory/site01.env` и
`site02.env` (права `600`, владелец — deploy-пользователь). Секреты через
GitHub не проходят. Значения `NEXT_PUBLIC_*`/`BASE_URL` в этих файлах должны
совпадать с переменными в GitHub.

---

## 5. Настройка GitHub

Создайте два **Environments** (Settings → Environments): `site01` и `site02`.
Workflow-файлы используют в обоих одинаковые имена переменных, а значения
выбираются по окружению.

**Секреты репозитория** (общие):

| Секрет | Значение |
|---|---|
| `VPS_HOST` | хост/IP VPS |
| `VPS_USER` | deploy-пользователь (в группе `docker`) |
| `VPS_SSH_KEY` | приватный ключ (ed25519) этого пользователя |
| `VPS_KNOWN_HOSTS` | вывод `ssh-keyscan <VPS_HOST>` |

**Переменные окружения** (в каждом Environment, вкладка *Variables*):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `BASE_URL`,
`NEXT_PUBLIC_SITE_DOMAIN`, `NEXT_PUBLIC_PLAUSIBLE_URL` (опционально),
`NEXT_PUBLIC_DIRECTUS_ASSETS_URL` (site01, опционально) и `DB_PORT` — порт
пулера этого стека на VPS (`POSTGRES_PORT` из §3.1).

**Секреты окружений:**

| Секрет | Env | Значение |
|---|---|---|
| `SUPABASE_DB_URL` | оба | `postgresql://postgres.<POOLER_TENANT_ID>:<POSTGRES_PASSWORD>@127.0.0.1:15432/postgres`. Порт `15432` — локальный конец CI-туннеля. Спецсимволы в пароле экранируйте (URL-encode) |
| `SUPABASE_SERVICE_ROLE_KEY` | site01 | `SERVICE_ROLE_KEY` стека site01 |

При желании добавьте в окружения *required reviewers*, чтобы прод-деплой
требовал подтверждения.

---

## 6. Deploy workflow

Три файла: один переиспользуемый workflow и по маленькому триггеру на сайт,
чтобы коммит только в site02 не перезапускал site01.

### `.github/workflows/_deploy-site.yml`

```yaml
name: Deploy site (reusable)

on:
  workflow_call:
    inputs:
      site: { type: string, required: true } # site01 | site02 — also the GitHub Environment name
      app: { type: string, required: true }  # folder under apps/

jobs:
  build:
    runs-on: ubuntu-latest
    environment: ${{ inputs.site }}
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4

      # Build-time values: inlined by `next build`. Non-secret only.
      - name: Write .env.production
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ vars.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          BASE_URL: ${{ vars.BASE_URL }}
          NEXT_PUBLIC_SITE_DOMAIN: ${{ vars.NEXT_PUBLIC_SITE_DOMAIN }}
          NEXT_PUBLIC_PLAUSIBLE_URL: ${{ vars.NEXT_PUBLIC_PLAUSIBLE_URL }}
          NEXT_PUBLIC_DIRECTUS_ASSETS_URL: ${{ vars.NEXT_PUBLIC_DIRECTUS_ASSETS_URL }}
        run: |
          f=apps/${{ inputs.app }}/.env.production
          : > "$f"
          for k in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY BASE_URL \
                   NEXT_PUBLIC_SITE_DOMAIN NEXT_PUBLIC_PLAUSIBLE_URL NEXT_PUBLIC_DIRECTUS_ASSETS_URL; do
            if [ -n "${!k}" ]; then echo "$k=${!k}" >> "$f"; fi
          done
          test -s "$f" || { echo "no build vars for ${{ inputs.site }}"; exit 1; }

      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Image name (GHCR needs lowercase)
        id: img
        run: echo "name=ghcr.io/${GITHUB_REPOSITORY_OWNER,,}/${{ inputs.app }}" >> "$GITHUB_OUTPUT"

      - uses: docker/build-push-action@v6
        with:
          context: .                       # monorepo root, as the Dockerfile expects
          file: apps/${{ inputs.app }}/Dockerfile
          push: true
          tags: |
            ${{ steps.img.outputs.name }}:${{ github.sha }}
            ${{ steps.img.outputs.name }}:latest
          cache-from: type=gha,scope=${{ inputs.app }}
          cache-to: type=gha,mode=max,scope=${{ inputs.app }}

  migrate:
    runs-on: ubuntu-latest
    environment: ${{ inputs.site }}
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }

      - name: SSH key
        env:
          SSH_KEY: ${{ secrets.VPS_SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.VPS_KNOWN_HOSTS }}
        run: |
          install -m 700 -d ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519 && chmod 600 ~/.ssh/id_ed25519
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts

      # Postgres is bound to 127.0.0.1 on the VPS — reach it through a tunnel.
      - name: Tunnel to this site's Postgres
        run: ssh -fN -o ExitOnForwardFailure=yes -L 15432:127.0.0.1:${{ vars.DB_PORT }} "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}"

      # Applies only migrations not yet recorded in supabase_migrations.schema_migrations.
      - name: supabase db push
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          app=apps/${{ inputs.app }}
          test -f "$app/supabase/config.toml" || supabase init --workdir "$app"
          supabase db push --workdir "$app" --db-url "$SUPABASE_DB_URL"

  deploy:
    needs: [build, migrate]
    runs-on: ubuntu-latest
    environment: ${{ inputs.site }}
    steps:
      - name: SSH key
        env:
          SSH_KEY: ${{ secrets.VPS_SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.VPS_KNOWN_HOSTS }}
        run: |
          install -m 700 -d ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519 && chmod 600 ~/.ssh/id_ed25519
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts

      # Token goes over stdin, never on the remote command line.
      - name: Pull + restart (waits for the healthcheck)
        env:
          GHCR_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          tag_var="$(echo '${{ inputs.site }}' | tr a-z A-Z)_TAG"
          printf '%s' "$GHCR_TOKEN" | ssh "${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}" "
            set -e
            docker login ghcr.io -u '${{ github.actor }}' --password-stdin
            cd /opt/site-factory
            export $tag_var=${{ github.sha }}
            docker compose pull ${{ inputs.site }}
            docker compose up -d --wait --wait-timeout 120 ${{ inputs.site }}
            docker image prune -f
          "
```

### `.github/workflows/deploy-site01.yml`

```yaml
name: Deploy site01
on:
  push:
    branches: [main]
    paths: ["apps/site01-path-marketplace/**", "packages/**", "pnpm-lock.yaml"]
  workflow_dispatch:
concurrency: { group: deploy-site01, cancel-in-progress: false }
jobs:
  deploy:
    uses: ./.github/workflows/_deploy-site.yml
    with: { site: site01, app: site01-path-marketplace }
    secrets: inherit
    permissions: { contents: read, packages: write }
```

`deploy-site02.yml` такой же, только с `site02` / `site02-edu-marketplace` и
путями `apps/site02-edu-marketplace/**`.

Примечания:

- **Миграции выполняются до старта нового контейнера.** Миграции аддитивные,
  так что старый контейнер в промежутке продолжает работать.
- `supabase db push` записывает применённые версии в
  `supabase_migrations.schema_migrations`. Если какую-то БД раньше
  мигрировали руками (через SQL-редактор), один раз пометьте эти версии,
  чтобы они не применились повторно:
  `supabase migration repair --db-url "$SUPABASE_DB_URL" --status applied <version>`.
  Проверить можно командой `supabase migration list --db-url …`.
- `20260921000001_seed_courses.sql` в site02 — это миграция. При первом
  пуше она добавит в прод 5 демо-курсов. Если это не нужно, удалите её до
  первого деплоя.
- Для шага миграций стек уже должен работать. Миграция site01 пишет в
  `storage.buckets`, а эту таблицу storage-сервис создаёт при первом старте.
- `docker compose up --wait` роняет job, если контейнер не стал healthy за
  120 с.

---

## 7. Картинки: pregen, thumbs, blurhash (site01)

Витрина ничего не ресайзит на лету. `lib/image-variants.ts` направляет
`next/image` на заранее сгенерированные файлы, а blurhash декодируется на
сервере в инлайн-плейсхолдер. Эти файлы создают скрипты из
`apps/site01-path-marketplace/scripts/`. Они работают под **service role**,
читают **только** `.env.local` в папке приложения и идемпотентны: уже
существующие файлы пропускаются, если не передан `--force`.

| Задача | Скрипт | Результат |
|---|---|---|
| `pregen` | `backfill-product-image-pregen.mjs` | `<img>_thumb.webp` (400w), `_gallery.webp` (960w), `_hero.webp` (1600w) рядом с оригиналом в `characters`/`toys`; `products.images[i].variants` + `v` |
| `thumbs` | `backfill-product-image-thumbs.mjs` | только `_thumb.webp` (быстрый проход для карточек в сетке) |
| `blurhash` | `backfill-product-image-blurhashes.mjs` | `products.images[i].blurhash` (берёт `_thumb`, если он есть, поэтому запускать после pregen) |
| `avatars` | `backfill-avatar-thumbs.mjs` | `avatars/<uid>/<ts>_thumb.webp` (160²) + `profiles.avatar_meta.blurhash` |
| `optimize` | pregen → blurhash | обычный полный проход |

Флаги: `--dry-run`, `--force`, `--limit N`, `--slug <slug-товара>` (только
товары), `--variants thumb,hero` (только pregen).

Когда запускать:

- После добавления или замены товаров или их картинок запускайте
  `optimize`. Товары без `variants` всё равно отображаются, но в полном
  размере и без blur-плейсхолдера.
- Новые аватары обрабатываются при загрузке через `POST /api/avatar`.
  `avatars` нужен только для аватаров, загруженных до миграции
  `20260928000000`, или после импорта данных.
- После изменения параметров рендера в `scripts/lib/product-images.mjs`
  запустите `pregen --force`. Новая версия `v` сбрасывает кэш CDN и браузеров.

### `.github/workflows/images-site01.yml`

```yaml
name: site01 images (pregen / thumbs / blurhash)
on:
  workflow_dispatch:
    inputs:
      task:
        type: choice
        options: [optimize, pregen, thumbs, blurhash, avatars]
        default: optimize
      args:
        description: "Flags: --dry-run --force --limit N --slug x --variants thumb,hero"
        default: "--dry-run"
  # schedule: [{ cron: "30 3 * * *" }]   # optional nightly `optimize` (uses defaults below)

jobs:
  run:
    runs-on: ubuntu-latest
    environment: site01
    defaults: { run: { working-directory: apps/site01-path-marketplace } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.12.3 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile --filter "@repo/site01-path-marketplace..."

      # The scripts read .env.local only (no dotenv). Never commit or print it.
      - name: Write .env.local
        env:
          URL: ${{ vars.NEXT_PUBLIC_SUPABASE_URL }}
          KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: printf 'NEXT_PUBLIC_SUPABASE_URL=%s\nSUPABASE_SERVICE_ROLE_KEY=%s\n' "$URL" "$KEY" > .env.local

      - name: Run
        env:
          TASK: ${{ inputs.task || 'optimize' }}
          ARGS: ${{ inputs.args }} # empty on schedule → real run
        run: |
          case "$TASK" in
            optimize) node scripts/backfill-product-image-pregen.mjs $ARGS && node scripts/backfill-product-image-blurhashes.mjs $ARGS ;;
            pregen)   node scripts/backfill-product-image-pregen.mjs $ARGS ;;
            thumbs)   node scripts/backfill-product-image-thumbs.mjs $ARGS ;;
            blurhash) node scripts/backfill-product-image-blurhashes.mjs $ARGS ;;
            avatars)  node scripts/backfill-avatar-thumbs.mjs $ARGS ;;
          esac
```

По умолчанию во входных параметрах стоит `--dry-run`. Сначала посмотрите
лог, потом перезапустите с пустым полем. Скрипт пишет
`done: N file(s) created, M already present`. Ошибки на отдельных картинках
логируются как `skip …` и не прерывают прогон.

**Наполнение витрины** (`scripts/seed-showcase-catalog.mjs`) требует папку
`temp_assets/`. Она в `.gitignore` и есть только на машине разработчика.
Это разовый шаг: разработчик запускает скрипт с новыми URL/ключом, после
чего запускается задача `optimize`. В `supabase/seed.sql` лежат тестовые
товары с несуществующими путями картинок (`/seed/*.jpg`). На проде его не
запускать.

---

## 8. Compose-файл приложений на VPS

`/opt/site-factory/docker-compose.yml`. Метки Traefik приведены для примера;
при другом прокси перенесите их в его конфиг.

```yaml
services:
  site01:
    image: ghcr.io/path-animation/site01-path-marketplace:${SITE01_TAG:-latest}
    env_file: site01.env
    restart: unless-stopped
    expose: ["3000"]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks: [proxy]
    labels:
      - traefik.enable=true
      - traefik.http.routers.site01.rule=Host(`site01.example.com`)
      - traefik.http.routers.site01.tls.certresolver=letsencrypt
      - traefik.http.services.site01.loadbalancer.server.port=3000

  site02:
    image: ghcr.io/path-animation/site02-edu-marketplace:${SITE02_TAG:-latest}
    env_file: site02.env
    restart: unless-stopped
    expose: ["3000"]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks: [proxy]
    labels:
      - traefik.enable=true
      - traefik.http.routers.site02.rule=Host(`site02.example.com`)
      - traefik.http.routers.site02.tls.certresolver=letsencrypt
      - traefik.http.services.site02.loadbalancer.server.port=3000

networks:
  proxy:
    external: true
    name: traefik-public
```

- `GET /api/health` отвечает `{"status":"ok"}` и не обращается к Supabase,
  поэтому сбой Supabase не отправляет контейнер в цикл перезапусков.
- `ports:` не публикуются. Трафик доходит до приложений только через прокси.
- Kong каждого стека Supabase (`:8000`) маршрутизируется так же, на
  `api.siteXX.example.com`.

**Откат:** `cd /opt/site-factory && SITE01_TAG=<старый-git-sha> docker compose up -d --wait site01`.
Образ `:<sha>` каждого деплоя остаётся в GHCR. Миграции идут только вперёд,
поэтому откат изменения схемы — это новая миграция.

---

## 9. Порядок первого деплоя

1. DNS: заведите четыре записи (§2) и дождитесь, пока они начнут резолвиться.
2. Поднимите стеки `supabase-site01` и `supabase-site02` (§3). Откройте Studio
   в каждом и убедитесь, что Auth и Storage работают.
3. Настройте SMTP, для site02 ещё и Google. Отправьте из каждого стека
   тестовое письмо (регистрация на шаге 9 это сделает).
4. Создайте в GitHub окружения, переменные и секреты (§5).
5. На VPS создайте `/opt/site-factory/{docker-compose.yml,site01.env,site02.env}` (§4, §8).
6. Закоммитьте в `main` три deploy-workflow и workflow картинок (§6, §7) или
   запустите *Deploy site01* / *Deploy site02* вручную.
7. Только site01: создайте бакеты `characters`/`toys` (§3.4), пусть
   разработчик наполнит или загрузит товары, затем запустите *site01 images*
   с задачей `optimize`.
8. Если переносите существующие данные, сначала прочитайте §11.
9. Проверьте пользовательские сценарии (§10).

---

## 10. Пользовательские сценарии для проверки после деплоя

### site01

| # | Сценарий | Ожидаемо |
|---|---|---|
| 1 | `/signup`: имя, email, пароль | Приходит письмо подтверждения. Ссылка открывает `…/auth/callback?code=…`, затем пользователь оказывается залогинен (по умолчанию `/account`). `full_name` сохраняется в user metadata |
| 2 | `/login` подтверждённым аккаунтом | Вход выполнен. В шапке иконки аккаунта |
| 3 | Открыть `/account` или `/favorites` без входа | Редирект на `/login?next=/account` (middleware) |
| 4 | `/account`: сохранить имя и телефон (E.164) | Строка в `public.profiles` |
| 5 | `/account`: загрузить фото (≤ 2 МБ, jpeg/png/webp) | Появляются `avatars/<uid>/<ts>.<ext>` + `_thumb.webp` + `_hero.webp`, в `profiles.avatar_meta` есть `blurhash`/`variants`, старое фото удалено. 5xx от `/api/avatar` обычно значит, что контейнер не достаёт до API-домена (§3.4) |
| 6 | `/account`: сменить email | Ссылка(и) подтверждения ведут на `/auth/callback?next=/account` |
| 7 | Поставить «сердечко» товару | Строка в `wishlists`. Сохраняется после перезагрузки |
| 8 | Каталог / страница товара | Картинки грузятся с `api.site01…/storage/v1/object/public/…_thumb.webp?v=…`, сначала показывается blur-плейсхолдер |
| 9 | Счётчик остатка у лимитированного товара | Обновляется вживую при изменении `product_variants.stock` (Realtime) |
| 10 | Корзина и checkout | Работают для гостей, хранятся локально (mock checkout) |

Роль администратора (JWT `app_metadata`, пользователь сам её менять не может):

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
where email = 'someone@example.com';
```

Пользователю нужно войти заново, чтобы получить новый JWT. Сейчас у `admin`
в UI те же права, что у покупателя (`lib/rbac.ts`).

### site02

| # | Сценарий | Ожидаемо |
|---|---|---|
| 1 | `/signup` email + пароль | Письмо подтверждения, затем `/auth/callback`, затем вход выполнен |
| 2 | `/login` email + пароль | Вход выполнен |
| 3 | `/login` → «Продолжить с Google» | Согласие в Google, затем возврат на сайт с выполненным входом. `/account` показывает имя и аватар из Google |
| 4 | Google с неверным client secret или redirect URI | Попадаем на `/login?error=oauth` с сообщением об ошибке |
| 5 | `/forgot-password` | Письмо восстановления. Ссылка логинит пользователя и открывает `/reset-password`; новый пароль работает |
| 6 | Просроченная или повторно использованная ссылка восстановления | `/reset-password` показывает «ссылка устарела» |
| 7 | `/courses`, `/courses/<slug>` | Видны курсы из seed (если seed-миграцию оставили) |

---

## 11. Перенос существующих данных (только при переезде с Supabase Cloud)

- Следуйте официальной инструкции Supabase по backup/restore (`pg_dump`
  ролей, схемы и данных, включая `auth`) в соответствующий стек. Затем
  пометьте все миграции как применённые (`supabase migration repair … --status applied`),
  чтобы CI не запускал их повторно.
- **Файлов** Storage в дампе БД нет. Скопируйте объекты по бакетам
  (`characters`, `toys`, `avatars`) через Storage API или S3.
- `JWT_SECRET` другой, поэтому всем пользователям придётся войти заново.
  Хэши паролей и Google-идентичности переносятся вместе с `auth.users` /
  `auth.identities`.
- **В сохранённых URL остался старый хост.** Перепишите их:

```sql
update products set images = replace(images::text, 'https://<old-ref>.supabase.co', 'https://api.site01.example.com')::jsonb;
update profiles set avatar_url = replace(avatar_url, 'https://<old-ref>.supabase.co', 'https://api.site01.example.com');
```

---

## 12. Диагностика

| Симптом | Вероятная причина |
|---|---|
| В консоли браузера запросы уходят на `undefined/auth/v1/…` | `NEXT_PUBLIC_*` не было при сборке. Проверьте переменные окружения и пересоберите |
| `next/image`: «hostname … is not configured» | Образ собран с другим `NEXT_PUBLIC_SUPABASE_URL`. Пересоберите |
| Ссылка из письма уводит на домен Supabase или «redirect not allowed» | `ADDITIONAL_REDIRECT_URLS` / `SITE_URL` в `.env` стека |
| Google: `redirect_uri_mismatch` | В Google Console redirect URI должен быть `https://api.site02…/auth/v1/callback` |
| Google: «provider is not enabled» | `GOTRUE_EXTERNAL_GOOGLE_*` не переданы в контейнер `auth` (§3.3) |
| Письма не приходят | Настройки SMTP. Смотрите логи контейнера `auth` |
| Job миграций: connection refused | Неверная переменная `DB_PORT` или пулер не опубликован на `127.0.0.1:<port>` |
| Job миграций: «relation already exists» | БД мигрировали руками. Используйте `supabase migration repair` (§6) |
| `/api/avatar` 404/500 | Контейнер приложения не достаёт до `api.site01…` (DNS или hairpin NAT) |
| Залогиненного пользователя выкидывает на `/login` с `/account` | Контейнер не достаёт до Supabase Auth или anon-ключ от другого стека |
| Workflow картинок: «Missing … in .env.local» | Нет секрета `SUPABASE_SERVICE_ROLE_KEY` в окружении `site01` |
