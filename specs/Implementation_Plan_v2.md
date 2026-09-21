---
tags: [project/task-4-site-factory, type/spec, status/draft]
project: "Task 4 - Site Factory"
status: draft
created: 2026-07-27
updated: 2026-09-21
aliases: [Implementation Plan, Timeline, Roadmap, Фазы реализации, Educational Marketplace, Edu Marketplace]
---

# Implementation Plan v2.1 — Site Factory + Маркетплейс игрушек + Образовательная платформа

Обновляет [[Implementation Plan]] с учётом:
- PayMesh Gateway как единого фасада платёжной интеграции
- API контракта Dashboard v2.0 (`dashboard/docs/API_CONTRACT_v2.0.md`)
- Supabase Cloud Pro для коммерческих сайтов и дашборда (не self-hosted)
- Ревью кода `site01-path-marketplace` (состояние на 2026-07-29)
- Архитектуры `site02-edu-marketplace` — маркетплейс курсов (SKU + LMS-плеер), UI-референс [irreplaceable-ai.ru](https://irreplaceable-ai.ru/)

Два продуктовых трека делят инфраструктуру фабрики (Directus, Coolify, PayMesh, Dashboard, R2) и **не блокируют друг друга** после общих блокеров. Фазы 0–5 игрушек не переписываются. Трек B (курсы) не ждёт PDP/collectibles site01.

| Трек | Приложение | `NEXT_PUBLIC_SITE_SLUG` | Модель |
|---|---|---|---|
| A | `apps/site01-path-marketplace` | `path-marketplace` | Физические + цифровые товары, collectibles |
| B | `apps/site02-edu-marketplace` | `edu-marketplace` | Курсы как SKU (видео / аудио / текст), одноразовая покупка, плеер после оплаты |

Подписки на обоих треках — отдельный спринт (блокер AnyBill).

---

## Блокеры — нужно до старта разработки

Общая инфра **блокирует деплой обоих треков**. Локальный scaffold (Фаза 0 / E0) идёт параллельно на `.env.local`.

### Общие (инфра + платежи + дашборд)

| Что нужно | От кого | Статус |
|---|---|---|
| `PAYMESH_GATEWAY_URL` + `PAYMESH_API_KEY` (pm_test_...) + `PAYMESH_WEBHOOK_SECRET` | Алексей Астафьев (`cmd/keys`) | ⏳ ожидает |
| `DASHBOARD_SUPABASE_URL` + `DASHBOARD_SUPABASE_ANON_KEY` | Алексей Ханипов | ⏳ ожидает |
| Подтверждение что `POST /rest/v1/orders` доступен без `authenticated` сессии (или нужен `service_role_key`) | Алексей Ханипов | ⏳ ожидает |
| App VPS готов, Coolify установлен, домены в Cloudflare | Алексей Rubitco1 | ⏳ ожидает |
| DB VPS готов, PostgreSQL 16 + pgvector | Алексей Rubitco1 | ⏳ ожидает |
| Directus задеплоен, API токен выдан | Никита (после VPS) | ⏳ ожидает |

### Только site01

| Что нужно | От кого | Статус |
|---|---|---|
| Webhook URL маркетплейса (`https://marketplace.path-animation.com/api/paymesh/webhook`) зарегистрирован через `cmd/keys set-webhook` | Алексей Астафьев | ⏳ после деплоя |

### Только site02

| Что нужно | От кого | Статус |
|---|---|---|
| Домен site02 + DNS в Cloudflare | Алексей Rubitco1 | ⏳ TBD |
| Отдельный проект Supabase Cloud Pro для LMS/коммерции курсов (не схема игрушек) | Никита | ⏳ ожидает |
| Приватный R2 bucket `path-edu-videos` + API-токен Read & Write только на этот bucket | Никита | ⏳ ожидает |
| Directus `CORS_ORIGIN`: добавить домен site02 | Инфра | ⏳ после домена |
| `site_slug='edu-marketplace'` + `site_instance_id` в Dashboard | Алексей Ханипов | ⏳ ожидает |
| Webhook URL курсов (`https://{site02-domain}/api/paymesh/webhook`) через `cmd/keys set-webhook` | Алексей Астафьев | ⏳ после деплоя |

---

# Трек A — site01-path-marketplace

Маркетплейс коллекционных игрушек. Визуальный референс: popmart.com. Спека: [[Path Animation Marketplace]].

---

## Фаза 0 — Setup (2-3 дня)

Выполняется параллельно пока ждём VPS от Rubitco1. Всё делается на локальной машине с `.env.local`.

### 0a. Supabase Cloud

- Создать проект на supabase.com, тариф **Pro** ($25/мес)
- В SQL editor выполнить `supabase/migrations/20260722000000_init_commerce_schema.sql`
- Исправить в схеме: `subscription_plans.is_active DEFAULT false` (сейчас `true` — ошибка)
- Добавить Realtime publication (критично — без этого StockCounter не работает):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;
```
- Получить и сохранить: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 0b. Обновить `.env.example`

Убрать устаревший платёжный стек, добавить актуальный:

```env
# УБРАТЬ:
# HYPERSWITCH_URL, HYPERSWITCH_API_KEY, HYPERSWITCH_WEBHOOK_SECRET
# BTCPAY_URL, BTCPAY_STORE_ID, BTCPAY_API_KEY, BTCPAY_WEBHOOK_SECRET
# FORMANCE_URL, FORMANCE_LEDGER, FORMANCE_API_KEY

# ДОБАВИТЬ:
PAYMESH_GATEWAY_URL=https://gateway.yourdomain.com
PAYMESH_API_KEY=pm_test_...
PAYMESH_WEBHOOK_SECRET=

DASHBOARD_SUPABASE_URL=
DASHBOARD_SUPABASE_ANON_KEY=

PLAUSIBLE_API_KEY=
ADMIN_WEBHOOK_KEY=
```

### 0c. Cloudflare R2

- Создать приватный bucket `path-marketplace-digital`
- Создать API токен с `Object Read & Write` только для этого bucket
- Проверить `rclone ls r2:path-marketplace-digital` работает

### 0d. Seed данные

15 тестовых продуктов через Supabase SQL editor:
- 3 физических игрушки (одна с `edition_size = 100`)
- 2 коллекционных (`is_collectible = true`, `collectible_story` заполнен, `edition_size = 50`)
- 2 книги (`product_type = 'physical'`)
- 2 артбука (`product_type = 'digital'`)
- 2 дизайна (`product_type = 'digital'`)
- 2 мерча
- 2 фигурки
- Для каждого продукта: минимум один `product_variant` с `stock > 0`

**Milestone Фазы 0:** `.env.local` заполнен, `pnpm dev` запускается без ошибок, данные видны в каталоге.

---

## Фаза 1 — Каталог (1 неделя)

**Статус:** частично выполнена. Реализованы: homepage, `/collections`, `/collections/[slug]`, `/shop`, `/characters`. Компоненты: ProductCard, CollectionCard, HorizontalScroll, FilterBar, ProductGrid, StockCounter, CollectibleBadge.

### Что дополнить в Фазе 1

**`/characters/[slug]`** — отсутствует. Создать:
```
app/(catalog)/characters/[slug]/page.tsx   ISR — персонаж + его товары
```
Данные: из Directus (hero image, описание персонажа) + из Supabase (`getProducts({ character: slug })`).

**Directus webhook → ISR** — проверить что `/api/revalidate` вызывается при изменении коллекции или персонажа в Directus. Добавить webhook в Directus Settings → Webhooks.

**StockCounter Realtime** — убедиться что после шага 0a (`ALTER PUBLICATION`) подписка работает. Проверить: изменить `stock` в Supabase Studio → счётчик обновился в браузере без перезагрузки.

**Milestone Фазы 1:** все страницы каталога открываются, фильтры работают, stock counter live, `/characters/thor` → страница персонажа с его товарами.

---

## Фаза 2 — PDP + Collectible UI (1.5 недели)

### 2a. Стандартный PDP `/p/[slug]`

Создать `app/(catalog)/p/[slug]/page.tsx` — ISR, `generateMetadata`.

Компоненты (создать):
```
components/pdp/
  PDPHero.tsx          useScroll + useTransform: gallery parallax, title fade-in
  PDPDetails.tsx       whileInView reveal секций (описание, характеристики)
  PDPPurchase.tsx      position: sticky, bottom-0: цена + варианты + add to cart
  PDPRelated.tsx       Embla horizontal scroll похожих товаров

components/product/
  ProductViewer.tsx    image gallery, click → fullscreen lightbox + pinch zoom
  ProductGallery.tsx   thumbnail strip под viewer
  ProductVariantSelector.tsx  выбор варианта (size, color, edition)
  DigitalDownloadButton.tsx   показывается если product_type=digital И есть digital_access
```

JSON-LD schema на каждом PDP:
```typescript
// Schema: Product → Offer → availability, price, priceCurrency
// Schema: Organization → name, url, logo
```

### 2b. Коллекционный PDP `/collectibles/[slug]`

Только для `is_collectible = true`. Читает `product.collectible_story` (JSONB array из Supabase).

Компоненты (создать):
```
components/collectible/
  CollectibleScene.tsx     sticky scroll container
                           outer div: height = (story.length + 2) * 100vh
                           inner div: position sticky, height 100vh, overflow hidden
                           useScroll на outer ref

  CollectibleChapter.tsx   position absolute, inset 0
                           useScroll offset ['start end', 'end start']
                           opacity: [0, 0.3, 0.7, 1] → [0, 1, 1, 0]
                           y: [80, 0, 0, -80]px
                           grid: visual left, text right (reverse mobile)

  CollectibleReveal.tsx    scrollYProgress 0.85→1.0
                           opacity: [0, 1], scale: [0.7, 1], rotate: [-15°, 0°]
                           показывает hero image + EditionCounter

  BlindBoxReveal.tsx       только для category=collectible_toys
                           AnimatePresence: box → reveal
                           exit rotateY: 90, opacity: 0 (0.4s)
                           enter rotateY: -90→0, opacity: 0→1 (0.4s)

  EditionCounter.tsx       initial fetch: sum(stock) → sold = edition_size - totalStock
                           Supabase Realtime channel на product_variants
                           Radix Progress bar
                           "{sold} claimed · {remaining} remaining · Edition of {edition_size}"

  CollectibleCTA.tsx       position fixed, bottom-6, z-50
                           glassmorphism: bg-white/10 backdrop-blur-md border-white/20 rounded-full
                           opacity + y появляются при scrollYProgress > 0.15
                           показывает: title, edition info, price, "Add to Cart"
                           onClick: useCartStore().addItem(product)
```

Добавить маршрут в `app/(catalog)/p/[slug]/page.tsx`:
```typescript
// Редирект на /collectibles/[slug] если is_collectible = true
if (product.is_collectible) redirect(`/collectibles/${params.slug}`);
```

**Milestone Фазы 2:** `/p/toy-slug` открывает PDP с gallery + sticky purchase panel. `/collectibles/limited-bear` открывает scroll storytelling с EditionCounter и sticky CTA. JSON-LD в head.

---

## Фаза 3 — Commerce (1 неделя)

### 3a. Cart

```
lib/cart.ts    Zustand store:
               items: CartItem[]
               addItem(product, variant)
               removeItem(variantId)
               updateQty(variantId, qty)
               clearCart()
               total: computed

components/cart/
  CartDrawer.tsx    Radix Dialog, slide from right
                    AnimatePresence
  CartItem.tsx      image, title, variant attrs, qty stepper, remove
  CartSummary.tsx   subtotal, shipping estimate (0 для digital-only), total
```

### 3b. Checkout flow

`app/(commerce)/checkout/page.tsx` — CSR:
1. Если cart пуст → redirect `/shop`
2. Если `hasPhysical` → показать `ShippingForm`
3. `PaymentMethodSelector` — две опции: **Fiat** (карта / банк. перевод) и **Crypto** (BTC, ETH, USDT, USDC)
4. Submit → `POST /api/checkout/create-order`
5. Response:
   - `provider: 'paymesh'` + `checkoutUrl` → `window.location.href = checkoutUrl`
   - Gateway сам рендерит форму Hyperswitch или BTCPay страницу

### 3c. API routes

**`app/api/checkout/create-order/route.ts`:**
```typescript
// 1. getUser(req) — 401 если не авторизован
// 2. validateStock(items) — проверить наличие в Supabase перед созданием
// 3. calculateSubtotal(items)
// 4. calculateShipping(address) — 0 для digital-only корзины
// 5. INSERT order status='pending' в Supabase маркетплейса
// 6. POST PAYMESH_GATEWAY_URL/payments
//    X-API-Key: PAYMESH_API_KEY
//    Idempotency-Key: order.id
//    body: { counterparty_id, amount: toMinorUnits(total, currency), currency, method }
// 7. Вернуть { checkoutUrl: payment.checkout_url, orderId }
```

**`app/api/paymesh/webhook/route.ts`:**
```typescript
// 1. Прочитать rawBody = await req.text()
// 2. sig = req.headers.get('x-paymesh-signature')  // "sha256=<hex>"
// 3. expected = 'sha256=' + HMAC-SHA256(rawBody, PAYMESH_WEBHOOK_SECRET)
// 4. timingSafeEqual(sig, expected) — иначе 401
// 5. event = JSON.parse(rawBody)
// 6. switch(event.event):
//    'payment.confirmed' → handlePaymentSuccess(orderId, paymentIntentId, hasDigital)
//    'payment.failed'    → order.status = 'cancelled'
// 7. Polling fallback: GET PAYMESH_GATEWAY_URL/payments/{id} если webhook не пришёл
```

**`lib/payment-handlers.ts` — `handlePaymentSuccess()`:**
```typescript
// 1. UPDATE orders SET status='paid', payment_id=paymentId
// 2. FOR each physical item: RPC decrement_stock(variant_id, qty)
// 3. IF hasDigital: INSERT digital_access (expires_at=null, max_downloads=5)
// 4. postOrderToDashboard(order, orderId)
//    — POST DASHBOARD_SUPABASE_URL/rest/v1/orders
//    — Authorization: Bearer DASHBOARD_SUPABASE_ANON_KEY
//    — apikey: DASHBOARD_SUPABASE_ANON_KEY
//    — 409 Conflict = already exists = ok (идемпотентно)
//    — catch ALL errors: логировать, не бросать (best-effort)
// financial_transactions пишет PayMesh Gateway через adapters/crmreporting — НЕ маркетплейс
```

**`app/api/download/[assetId]/route.ts`:**
```typescript
// 1. getUser(req) — 401 если не авторизован
// 2. SELECT digital_assets WHERE id = assetId
// 3. SELECT digital_access WHERE user_id = user.id AND product_id = asset.product_id
// 4. Проверить expires_at (если null — вечный)
// 5. Проверить download_count < max_downloads
// 6. generateSignedUrl(asset.storage_path, expiresIn: 900) через @aws-sdk/s3-request-presigner
// 7. UPDATE digital_access SET download_count = download_count + 1
// 8. Response.redirect(signedUrl)
```

### 3d. Dashboard API integration

**`lib/dashboard.ts`:**
```typescript
// postOrderToDashboard(order, orderId)
// Контракт: POST /orders (API_CONTRACT_v2.0.md раздел 2, пункт 2)
// Поля: id (TEXT), site_slug='path-marketplace', status, customer_email,
//       amount_minor (INT8, minor units), currency (ISO 4217),
//       items: [{product_id, title, quantity, unit_amount_minor}],
//       created_at (UTC ISO 8601)
// SLA: поштучно и мгновенно (контракт раздел 4)

// updateOrderStatusInDashboard(orderId, status: 'cancelled' | 'fulfilled')
// PATCH /orders?id=eq.{orderId}
// При: payment.failed → 'cancelled', ручная отгрузка → 'fulfilled'
```

### 3e. Traffic sync

**`tools/scripts/sync-traffic.ts`** — cron каждые 5 минут:
```typescript
// 1. GET PLAUSIBLE_URL/api/v1/stats/aggregate
//    ?site_id=marketplace.path-animation.com
//    &metrics=visitors,pageviews
//    &period=custom&from=...&to=...
//    Authorization: Bearer PLAUSIBLE_API_KEY
// 2. POST DASHBOARD_SUPABASE_URL/rest/v1/site_traffic_hourly
//    {
//      site_instance_id: 'site_marketplace_01',
//      period_start, period_end,
//      views_count: pageviews.value,
//      unique_visitors: visitors.value,
//      published_articles_count: 0,
//      errors_count: 0
//    }
// Контракт: раздел 4 — батч раз в 5 минут (не поштучно)
// UNIQUE(site_instance_id, period_start) → 409 при дубле = ok
```

**Milestone Фазы 3:** покупатель добавляет товар → открывает CartDrawer → checkout → redirect на PayMesh → платит → webhook → order.status='paid' → дашборд получает запись в `/orders` → покупатель видит заказ в `/account/orders`.

---

## Фаза 4 — Account + SEO + Deploy (3-4 дня)

### 4a. Account pages (все CSR, Supabase Auth required)

```
app/(account)/account/
  orders/page.tsx           список заказов: статус, дата, сумма, items
  orders/[id]/page.tsx      детали: items, метод оплаты, адрес доставки, tracking
  wishlist/page.tsx         grid из wishlists JOIN products
  downloads/page.tsx        digital_access JOIN products, DigitalDownloadButton per item
```

### 4b. SEO

На всех ISR страницах добавить `generateMetadata`:
```typescript
// /p/[slug]:        title=product.title, description=product.description[:160], og:image=images[0]
// /collectibles/:   title=product.title + " — Limited Edition", og:image=images[0]
// /collections/:    title=collection.name, description=collection.description
// /characters/:     title=character.name + " | Path Animation"
// homepage:         title='Path Animation Marketplace', og:image=brand hero
```

### 4c. Plausible events

```typescript
usePlausibleEvent()('add_to_cart',       { props: { product_id, category, is_collectible } })
usePlausibleEvent()('begin_checkout',    { props: { item_count: String(n), total: String(t) } })
usePlausibleEvent()('purchase',          { props: { order_id, method, total: String(t) } })
usePlausibleEvent()('collectible_view',  { props: { product_id, chapters: String(n) } })
usePlausibleEvent()('blind_box_reveal',  { props: { product_id } })
```

### 4d. Performance

- `next build` — ноль TypeScript ошибок
- Lighthouse mobile: Performance 90+ на homepage, `/shop`, `/p/[slug]`, `/collectibles/[slug]`, checkout
- Если `/collectibles/[slug]` ниже 90 → `dynamic(() => import('./CollectibleScene'), { ssr: false })`

### 4e. Deploy

```bash
# В Coolify UI:
# 1. New Project → site01-path-marketplace
# 2. GitHub: Path-animation/site-factory
# 3. Root directory: apps/site01-path-marketplace
# 4. Build pack: Nixpacks
# 5. Все env vars из .env.example
# 6. Domain: marketplace.path-animation.com
# 7. SSL: auto (Traefik + Let's Encrypt)
# 8. Uptime Kuma: добавить монитор https://marketplace.path-animation.com
# 9. Plausible: Settings → Sites → Add → marketplace.path-animation.com
# 10. Directus: добавить webhook → POST https://marketplace.path-animation.com/api/revalidate
#     событие: items.create, items.update, items.delete на коллекциях sites, pages, blocks
```

**Milestone Фазы 4:** `marketplace.path-animation.com` открывается, Lighthouse 90+, заказы видны в дашборде, Uptime Kuma зелёный.

---

## Фаза 5 — Подписки (отдельный спринт, блокер: данные по тарифам)

Разблокируется когда:
1. AnyBill adapter в PayMesh Gateway выходит из stub
2. Продукт определил тарифные планы и их содержимое

Когда разблокируется:
- Seed `subscription_plans` (установить `is_active = true`)
- `app/(subscriptions)/plans/page.tsx` — ISR, PlanCard компоненты
- `app/api/checkout/create-subscription/route.ts` → PayMesh recurring payment
- Webhook: subscription lifecycle events
- `app/(account)/account/subscriptions/page.tsx` — управление (пауза, отмена, смена плана)
- Если цифровая подписка → `digital_access` с `expires_at = current_period_end`

---

# Трек B — site02-edu-marketplace

Образовательная платформа: витрина курсов одного бренда (не Udemy-продавцы). Каждый курс — отдельный SKU, одноразовая покупка, доступ в плеер после `payment.confirmed`. Три формата урока: **видео, аудио, текст**.

Package: `@repo/site02-edu-marketplace`. Домен TBD. UI-референс: [Клуб Незаменимых](https://irreplaceable-ai.ru/) — тёмный editorial-лендинг; **не** клон клуба (сообщество, дайджест, matching-бот, сезонная программа — вне MVP).

Источник правды по разработке site02 на старте — этот документ (отдельный spec не заводим).

---

## B. Архитектура

Два бэкенда — как в `docs/architecture.md`. Коммерцию игрушек и LMS курсов **не смешивать**: у site01 нет `site_id` в `products`, `docs/env-template.md` требует отдельную БД на сайт.

```mermaid
flowchart TB
  subgraph publicPages [Публичные страницы ISR]
    Landing[Landing Directus blocks]
    Catalog[Каталог курсов]
    CoursePDP[PDP курса]
  end
  subgraph privatePages [CSR плюс Auth]
    Cart[Корзина]
    Checkout[Checkout]
    Player[Плеер уроков]
    Account[Мои курсы]
  end
  Directus[Directus CMS]
  Supabase[Supabase Cloud site02]
  R2[R2 path-edu-videos]
  PayMesh[PayMesh Gateway]
  Dashboard[Dashboard orders]
  Landing --> Directus
  Catalog --> Supabase
  CoursePDP --> Supabase
  CoursePDP --> Directus
  Checkout --> PayMesh
  PayMesh -->|webhook| Enroll[enrollments]
  Enroll --> Supabase
  Checkout --> Dashboard
  Player --> R2
  Player --> Supabase
```

| Слой | Назначение |
|---|---|
| **Directus** | Маркетинг: `sites`, `pages`, `blocks` (hero, for-whom, cases, path-preview, faq, founder, cta). Коллекция `instructors` с `site_id`. |
| **Supabase Cloud (отдельный проект)** | Курсы, модули, уроки, заказы, enrollments, progress, Auth (email + Google). |
| **R2** `path-edu-videos` | Приватные видео/аудио. Signed URL через `@repo/lib/r2`. Mux / Cloudflare Stream — не MVP. |
| **PayMesh** | Тот же контракт, что Фаза 3 site01: `POST /payments`, HMAC webhook. Digital-only, `shipping = 0`. |
| **Dashboard** | `POST /orders`, `site_slug='edu-marketplace'`. `financial_transactions` пишет Gateway, не сайт. |
| **Auth** | Checkout и плеер требуют сессию. Preview-уроки (`is_preview`) — нет. |

Рендеринг по [[Site Template Spec]] и [[adr-004-rendering-strategy]]: лендинг / каталог / PDP — ISR `revalidate = 0` + `POST /api/revalidate` (HMAC, см. `docs/api-contracts.md`); cart / checkout / account / learn — CSR.

Локаль MVP: `lang="ru"`. `next-intl` на 16 языков в site02 не тащить — долг `apps/site-template`, см. `docs/conventions.md`.

---

## B. Feature-based структура

site01 плоский (`components/` + один `lib/api-client.ts`). site02 — фичи: UI / state / API / types внутри фичи. Маршруты тонкие. Общий хром (`SiteHeader`, `SiteFooter`) не класть в фичи.

```
apps/site02-edu-marketplace/
  app/                                      # только маршруты
    layout.tsx
    template.tsx                            # Framer page transitions, не layout
    globals.css
    sitemap.ts
    (marketing)/page.tsx                    # /
    (catalog)/courses/page.tsx              # /courses
    (catalog)/courses/[slug]/page.tsx       # /courses/[slug]
    (catalog)/instructors/[slug]/page.tsx   # /instructors/[slug]
    (commerce)/cart/page.tsx
    (commerce)/checkout/page.tsx
    (commerce)/checkout/confirmation/page.tsx
    (learn)/learn/[courseSlug]/[[...lesson]]/page.tsx
    (account)/account/courses/page.tsx
    (account)/account/orders/page.tsx
    (account)/account/orders/[id]/page.tsx
    (auth)/login/page.tsx
    (auth)/signup/page.tsx
    (legal)/legal/[slug]/page.tsx
    api/
      health/route.ts
      revalidate/route.ts
      checkout/create-order/route.ts
      paymesh/webhook/route.ts
      media/[lessonId]/route.ts             # signed URL video|audio
  features/
    landing/      components, hooks, api, types
    catalog/
    course/
    cart/
    checkout/
    auth/
    account/
    player/
    instructors/
  components/                               # SiteHeader, SiteFooter
  lib/
    api-client.ts                           # fail-soft + timeout, как site01
  supabase/migrations/
  .env.example
  package.json                              # name: "@repo/site02-edu-marketplace"
```

### Общие пакеты

- `@repo/types` — новый `packages/types/src/education.ts`: `Course`, `CourseModule`, `Lesson`, `Enrollment`, `LessonProgress`. Toy-поля в `commerce.ts` не раздувать. `Order` / `OrderItem` переиспользовать, если контракт совпадает; иначе education-specific order item (`course_id` вместо `variant_id`).
- `@repo/lib` — `generateCourseJsonLd` (schema.org `Course` + `Offer`). Directus / R2 / seo / format — без копипасты. Серверные модули импортировать напрямую (`@repo/lib/directus`, `@repo/lib/supabase-server`, `@repo/lib/r2`), не из барреля.
- `@repo/ui` — только примитивы (`Button`, `Card`, `Section`, `Container`, …). Секции лендинга живут в `features/landing`.
- `@repo/config` — ESLint, tsconfig, Tailwind preset. Тема site02 — CSS-переменные в `app/globals.css` ([[adr-007-styling-approach]]).

`lib/api-client.ts`: таймаут `FETCH_TIMEOUT_MS`, fail-soft на публичном чтении (`[]` / `null`). Мутации (заказ, оплата, progress) — ошибка до пользователя, не глотать.

---

## B. Модель данных Supabase (MVP)

Отдельный проект Cloud Pro. Миграции в `apps/site02-edu-marketplace/supabase/migrations/`.

```sql
-- enums
CREATE TYPE course_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE lesson_type AS ENUM ('video', 'audio', 'text');
CREATE TYPE enrollment_status AS ENUM ('active', 'revoked');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');

CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  level text,                    -- beginner | intermediate | advanced
  language text NOT NULL DEFAULT 'ru',
  category text,
  tags text[] DEFAULT '{}',
  cover_image text,
  promo_video_url text,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'RUB',
  instructor_id uuid,            -- FK на instructors в Supabase или slug Directus
  status course_status NOT NULL DEFAULT 'draft',
  duration_minutes int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort int NOT NULL DEFAULT 0,
  is_preview boolean NOT NULL DEFAULT false
);

CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  type lesson_type NOT NULL,     -- video | audio | text
  duration_seconds int,
  sort int NOT NULL DEFAULT 0,
  is_preview boolean NOT NULL DEFAULT false,
  content_md text,               -- текстовый урок и/или конспект
  media_storage_path text,       -- R2 path для video|audio; null у text
  UNIQUE (module_id, slug)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status order_status NOT NULL DEFAULT 'pending',
  payment_provider text,
  payment_method text,
  payment_id text,
  items jsonb NOT NULL,          -- [{ course_id, title, unit_price, quantity: 1 }]
  subtotal numeric NOT NULL,
  total numeric NOT NULL,
  currency text NOT NULL DEFAULT 'RUB',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  status enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE TABLE lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position_seconds int NOT NULL DEFAULT 0,  -- resume video|audio
  completed_at timestamptz,
  UNIQUE (user_id, lesson_id)
);
```

### RLS

- Публичное чтение: `courses` / `course_modules` / метаданные `lessons` где `courses.status = 'active'`.
- Тело медиа (`media_storage_path` через signed URL): только enrollment `active` **или** `lessons.is_preview`.
- `content_md` полного урока: то же правило (preview можно отдать публично).
- `orders`, `enrollments`, `lesson_progress`: только свои строки (`auth.uid()`).
- Stock / Realtime не нужны. Лимита мест нет.

### Оплата → доступ

```
payment.confirmed
  → orders.status = 'paid'
  → INSERT enrollments (по каждому course_id в items), конфликт UNIQUE = ok
  → postOrderToDashboard(..., site_slug='edu-marketplace')  -- best-effort, 409 = ok
```

`SUPABASE_SERVICE_ROLE_KEY` — только server-only (webhook). В клиентский бандл не попадает.

---

## B. UI-система (референс irreplaceable-ai.ru)

Визуал с [irreplaceable-ai.ru](https://irreplaceable-ai.ru/). Контент и CTA — про курсы, не про клуб. Тексты референса не копировать. Токены уточнить с живого сайта на E1.

`app/globals.css` (ADR-007):

```css
:root {
  --color-bg: #0a0a0a;
  --color-text: #f5f0e8;
  --color-primary: /* акцент с референса */;
  --font-heading: /* serif italic, next/font: Newsreader или Fraunces */;
  --font-body: /* sans, next/font */;
}
```

Паттерны:

- фон почти чёрный, текст кремовый
- акценты заголовков — курсив serif (две гарнитуры через `next/font`)
- нумерованные кикеры секций `01 / …`
- sticky header: лого + якоря + CTA («Каталог» / «Войти»)
- glass CTA (`bg-white/10 backdrop-blur-md border-white/20`)
- секции на весь вьюпорт, щедрые отступы
- карточки кейсов с метрикой «было → стало»
- путь модулей — горизонтальный / табовый превью треков курсов
- FAQ-аккордеон, блок преподавателя, финальный CTA

Лендинг `/` (ISR, блоки Directus), порядок секций:

1. Hero — H1 + подзаголовок + dual CTA (каталог / скролл)
2. Позиционирование
3. Для кого
4. Как устроено (купил курс → учишься в плеере)
5. Кейсы
6. Образовательный путь — тизеры курсов / треков
7. Каталог (горизонтальный срез)
8. Преподаватели
9. FAQ
10. Финальный CTA

Framer Motion: только `'use client'`, `useReducedMotion()`, variants из `@repo/lib/animations`, `viewport={{ once: true }}`.

---

## Фаза E0 — Scaffold (2-3 дня)

Параллельно общим блокерам, на `.env.local`. `apps/site-template` в E0 **не** выносим: копируем шелл с site01 (health, HMAC revalidate, plausible rewrites), вырезаем toy-специфику. Вынос шаблона — follow-up Фазы 6, иначе E0 раздувается.

### E0a. Приложение

- `apps/site02-edu-marketplace/` по дереву выше, `package.json` name `@repo/site02-edu-marketplace`
- Feature-папки-заготовки (`features/*/components|hooks|api|types`)
- Тёмная тема в `globals.css` + `tailwind.config.js` extends `@repo/config/tailwind.preset`
- `.env.example`: Directus, отдельный Supabase site02, PayMesh, Dashboard, R2 `path-edu-videos`, `BASE_URL`, `NEXT_PUBLIC_SITE_SLUG=edu-marketplace`, `NEXT_PUBLIC_SITE_DOMAIN`, Plausible, `REVALIDATE_TOKEN`
- `app/api/health` и `app/api/revalidate` (контракт HMAC из `docs/api-contracts.md`)
- `packages/types/src/education.ts` + реэкспорт из `packages/types/src/index.ts`

### E0b. Supabase + R2 + Directus

- Проект Cloud Pro, миграции LMS + RLS
- Seed 4–6 курсов: модули, уроки всех трёх типов, минимум один `is_preview` на курс
- R2 bucket `path-edu-videos`, проверка `rclone ls`
- Directus: `INSERT sites` (slug `edu-marketplace`), блок-типы лендинга, коллекция `instructors` с `site_id`

**Milestone E0:** `pnpm --filter @repo/site02-edu-marketplace dev` без ошибок, seed-курсы читаются из Supabase.

---

## Фаза E1 — Лендинг (1 неделя)

- Секции 1–10 из UI-системы, данные из Directus `pages` + `blocks`
- `features/landing`: компоненты секций, api-клиент блоков, типы блоков
- Sticky header / footer в `components/`
- Framer + `useReducedMotion`

**Milestone E1:** `/` собирается из блоков Directus. Цель Lighthouse 90+ фиксируется в E5, не блокирует E1.

---

## Фаза E2 — Каталог + PDP (1 неделя)

### `/courses` — ISR

- `features/catalog`: сетка, фильтры (level, category, sort: newest | price_asc | price_desc), карточка курса (обложка, уровень, длительность, цена, типы уроков)
- Fail-soft пустой каталог

### `/courses/[slug]` — ISR, `generateMetadata`

- `features/course`: hero, описание, программа-аккордеон (модули → уроки + иконка video/audio/text), преподаватель из Directus, sticky цена + «В корзину»
- Preview-уроки доступны без покупки
- JSON-LD: `generateCourseJsonLd` — schema.org `Course` + `Offer`

Покупка в E2 — mock (как текущий checkout site01), PayMesh в E3.

**Milestone E2:** структура курса видна, preview открывается, в корзину кладётся SKU.

---

## Фаза E3 — Auth + Cart + PayMesh + enrollments (1 неделя)

### Auth

- `features/auth`: `/login`, `/signup`, Supabase Auth email + Google
- Checkout и `/learn` без сессии → редирект на логин с `redirect`

### Cart

- Zustand + persist (`edu-marketplace-cart`), только `course_id` (qty всегда 1, дубль SKU игнорировать)
- Drawer / страница `/cart`

### Checkout — CSR, digital-only

1. Пустая корзина → `/courses`
2. Shipping нет
3. Fiat / Crypto → `POST /api/checkout/create-order`
4. Redirect на `checkoutUrl` PayMesh

### API

**`app/api/checkout/create-order/route.ts`:**
```typescript
// 1. getUser — 401
// 2. курсы status=active, посчитать total (без shipping)
// 3. INSERT orders status='pending', items = курсы
// 4. POST PAYMESH_GATEWAY_URL/payments
//    X-API-Key, Idempotency-Key: order.id
// 5. { checkoutUrl, orderId }
```

**`app/api/paymesh/webhook/route.ts`:** тот же HMAC, что Фаза 3 site01.

**`handlePaymentSuccess()`:**
```typescript
// 1. orders.status='paid'
// 2. INSERT enrollments на каждый course_id (UNIQUE user+course = ok)
// 3. postOrderToDashboard(..., site_slug='edu-marketplace') — best-effort
```

Traffic sync: тот же `sync-traffic.ts`, `site_instance_id` site02, Plausible site_id = домен курсов.

**Milestone E3:** оплата → webhook → enrollment → курс в `/account/courses`. Дашборд видит заказ.

---

## Фаза E4 — Плеер (1 неделя)

`/learn/[courseSlug]/[[...lesson]]` — CSR, сессия обязательна (кроме preview).

`features/player`:

- Curriculum sidebar: модули, уроки, галочки progress, иконка типа
- Видео-плеер / аудио-плеер / рендер `content_md` в зависимости от `lesson.type`
- `GET /api/media/[lessonId]`:
  1. getUser (preview может быть анонимным)
  2. урок `video|audio`, путь в R2
  3. enrollment active **или** `is_preview`
  4. `generateSignedUrl(path, expiresIn: 900)`
  5. redirect на signed URL
- Progress: debounce записи `position_seconds`; `completed_at` на пороге (например 90% длительности или явное «завершить» у текста)
- Гейт: нет enrollment и не preview → CTA на `/courses/[slug]`

**Milestone E4:** досмотр урока пишет progress; после refresh позиция video/audio восстановлена; text-урок отмечается пройденным.

---

## Фаза E5 — SEO + analytics + deploy (3-4 дня)

### SEO

```typescript
// /:                 title бренда, og:image hero
// /courses:          «Курсы», description каталога
// /courses/[slug]:   course.title, description[:160], og:image=cover
// /instructors/:     instructor.name
```

`app/sitemap.ts` — обязателен, `BASE_URL`. JSON-LD Course на PDP.

### Plausible

```typescript
usePlausibleEvent()('view_course',      { props: { course_id, category } })
usePlausibleEvent()('add_to_cart',      { props: { course_id } })
usePlausibleEvent()('begin_checkout',   { props: { item_count: String(n), total: String(t) } })
usePlausibleEvent()('purchase',         { props: { order_id, method, total: String(t) } })
usePlausibleEvent()('lesson_complete',  { props: { course_id, lesson_id, type } })
```

Обёртка опциональна: без `NEXT_PUBLIC_PLAUSIBLE_URL` сборка не падает (`docs/conventions.md`).

### Performance

- `next build` — ноль TypeScript ошибок
- Lighthouse mobile 90+ на `/`, `/courses`, `/courses/[slug]`

### Deploy

```bash
# Coolify:
# 1. New Resource → site02-edu-marketplace
# 2. GitHub: Path-animation/site-factory
# 3. Root directory: apps/site02-edu-marketplace
# 4. Nixpacks, env из .env.example (свой Supabase, свой R2 bucket)
# 5. Domain TBD → SSL auto
# 6. Uptime Kuma + Plausible site
# 7. Directus webhook → POST https://{domain}/api/revalidate (HMAC)
#    events: items.create/update/delete на sites, pages, blocks, instructors
```

**Milestone E5:** прод-домен открывается, Lighthouse 90+, заказы в дашборде, Uptime Kuma зелёный.

---

## Фаза E6 — Подписки (не стартуем)

Тот же блокер, что Фаза 5 site01: AnyBill adapter + продуктовые тарифы. До разблокировки курсы продаются только как разовые SKU.

---

## Вне MVP (Трек B)

Явно не делаем в E0–E5:

- сообщество, чаты, matching-бот, живые встречи
- ежедневный дайджест
- квесты / библиотека шаблонов как у референса
- квизы, сертификаты, дрип-доступ по расписанию
- кабинеты авторов / мультипродавцы (это витрина одного бренда)
- Mux / Cloudflare Stream
- next-intl / 16 локалей

---

## Фаза 6 — Сайты 3–20 (после готовности шаблона)

site02 — первый не-toy сайт: шелл копируется в E0. Когда оба прод-сайта стабильны — вынести общее в `apps/site-template` (layout-обвязка, health, HMAC revalidate, plausible rewrites, `sitemap` stub). Не копировать из site01 toy-категории, collectibles, characters.

Повторяемый процесс:

```bash
# 1. Скопировать шаблон (после выноса), не site01
cp -r apps/site-template apps/siteNN-name

# 2. package.json: name → "@repo/siteNN-name"

# 3. globals.css: CSS-переменные темы

# 4. Directus: INSERT INTO sites (slug, domain, name, theme)

# 5. Coolify: Resource, root=apps/siteNN-name
#    env: NEXT_PUBLIC_SITE_SLUG, NEXT_PUBLIC_SITE_DOMAIN
#    e-commerce/LMS: отдельный Supabase + свой R2 bucket (docs/env-template.md)

# 6. Cloudflare A-запись → App VPS

# 7. Coolify: домен → SSL

# 8. Uptime Kuma

# 9. Plausible

# 10. Directus CORS_ORIGIN += новый домен

# 11. Smoke test + Lighthouse
```

Время на лендинг: **1 день**.
Время на e-commerce: **2–3 дня** (своя Supabase-схема + PayMesh).
Время на LMS-витрину (как site02): **ориентир Трека B**, не 2–3 дня.

---

## Сводная таблица фаз

### Трек A — игрушки

| Фаза | Что | Срок | Статус |
|---|---|---|---|
| 0 | Setup: Supabase Cloud, R2, seed, .env | 2-3 дня | 🔲 не начата |
| 1 | Каталог: homepage, collections, shop, characters | 1 неделя | 🟡 частично (нет /characters/[slug]) |
| 2 | PDP + Collectible UI | 1.5 недели | 🔲 не начата |
| 3 | Commerce: cart, checkout, PayMesh, dashboard API | 1 неделя | 🔲 не начата |
| 4 | Account, SEO, deploy | 3-4 дня | 🔲 не начата |
| 5 | Подписки | TBD | ⏳ ждёт тарифов |

**Критический путь A:** Общие блокеры → Фаза 0 → Фазы 1+2 параллельно → Фаза 3 → Фаза 4 → деплой.

### Трек B — курсы

| Фаза | Что | Срок | Статус |
|---|---|---|---|
| E0 | Scaffold: app, LMS-схема, seed, Directus, R2 | 2-3 дня | 🔲 не начата |
| E1 | Editorial-лендинг (референс irreplaceable-ai.ru) | 1 неделя | 🔲 не начата |
| E2 | Каталог `/courses` + PDP | 1 неделя | 🔲 не начата |
| E3 | Auth, cart, PayMesh, enrollments, dashboard | 1 неделя | 🔲 не начата |
| E4 | Плеер video/audio/text + progress | 1 неделя | 🔲 не начата |
| E5 | SEO, Plausible, Coolify | 3-4 дня | 🔲 не начата |
| E6 | Подписки | TBD | ⏳ ждёт AnyBill |

**Критический путь B:** Общие блокеры + блокеры site02 → E0 → E1 и E2 параллельно → E3 → E4 → E5. Не зависит от Фаз 1–2 игрушек.

### Фабрика

| Фаза | Что | Срок | Статус |
|---|---|---|---|
| 6 | `apps/site-template` + сайты 3–20 | ~1 день/лендинг | ⏳ после site01 и site02 |

---

## Открытые вопросы

### Общие / site01

- `counterparty_id` в `POST /payments`: передавать `user_id` из Supabase Auth или отдельная сущность Counterparty в Gateway? *(Алексей Астафьев)*
- RLS Dashboard Supabase: `anon_key` достаточно для `POST /rest/v1/orders` из сайтов или нужен `service_role_key`? *(Алексей Ханипов)*
- ETH ceiling: int64 overflow выше ~9.2 ETH — зафиксировать как known limitation в Gateway
- `RECONCILE_INTERVAL=1h` в Gateway — подходит для маркетплейсов? *(Алексей Астафьев)*
- Список 20 доменов и slugs — блокирует Cloudflare + Coolify для Фазы 6
- Физическая логистика site01: самофулфилмент или 3PL партнёр?
- Локализация site01: RU + EN на старте или только RU?
- Blind box механика в полном объёме (popmart.com "mystery box") — в Фазе 2 или отдельный спринт?

### site02

- Домен `site02-edu-marketplace` — блокирует CORS Directus, Plausible, Coolify, webhook PayMesh
- Отдельный PayMesh `API_KEY` на сайт или один ключ + разные webhook URL? *(Алексей Астафьев)*
- TTL signed URL медиа: в плане 900 с, как digital download site01 — достаточно ли для длинного видео/аудио?
- `instructor_id`: таблица в Supabase или только Directus `instructors` + slug на `courses`?
- Порог `completed_at` для video/audio (90% длительности?) и для text (кнопка vs scroll)
- `site_instance_id` для `site_traffic_hourly` *(Алексей Ханипов)*

## Связанные документы

- [[Site Factory TZ v2]]
- [[Site Factory Architecture]]
- [[Site Template Spec]]
- [[Path Animation Marketplace]]
- [[Environment Setup]]
- [[adr-004-rendering-strategy]]
- [[adr-007-styling-approach]]
- `docs/architecture.md`
- `docs/conventions.md`
- `docs/env-template.md`
- `docs/api-contracts.md`
- `docs/directus-schema.md`
- `dashboard/docs/API_CONTRACT_v2.0.md`
