---
tags: [project/task-4-site-factory, type/spec, status/draft]
project: "Task 4 - Site Factory"
status: draft
created: 2026-07-27
updated: 2026-07-29
aliases: [Implementation Plan, Timeline, Roadmap, Фазы реализации]
---

# Implementation Plan v2.0 — Site Factory + Маркетплейс игрушек

Обновляет [[Implementation Plan]] с учётом:
- PayMesh Gateway как единого фасада платёжной интеграции
- API контракта Dashboard v2.0 (`dashboard/docs/API_CONTRACT_v2.0.md`)
- Supabase Cloud Pro для маркетплейса и дашборда (не self-hosted)
- Ревью кода `site01-path-marketplace` (состояние на 2026-07-29)

---

## Блокеры — нужно до старта разработки

Следующие шаги **блокируют все фазы**. Без них работа не начинается.

| Что нужно | От кого | Статус |
|---|---|---|
| `PAYMESH_GATEWAY_URL` + `PAYMESH_API_KEY` (pm_test_...) + `PAYMESH_WEBHOOK_SECRET` | Алексей Астафьев (`cmd/keys`) | ⏳ ожидает |
| `DASHBOARD_SUPABASE_URL` + `DASHBOARD_SUPABASE_ANON_KEY` | Алексей Ханипов | ⏳ ожидает |
| Подтверждение что `POST /rest/v1/orders` доступен без `authenticated` сессии (или нужен `service_role_key`) | Алексей Ханипов | ⏳ ожидает |
| App VPS готов, Coolify установлен, домены в Cloudflare | Алексей Rubitco1 | ⏳ ожидает |
| DB VPS готов, PostgreSQL 16 + pgvector | Алексей Rubitco1 | ⏳ ожидает |
| Directus задеплоен, API токен выдан | Никита (после VPS) | ⏳ ожидает |
| Webhook URL маркетплейса (`https://marketplace.path-animation.com/api/paymesh/webhook`) зарегистрирован через `cmd/keys set-webhook` | Алексей Астафьев | ⏳ после деплоя |

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

## Фаза 6 — Сайты 2-20 (после готовности шаблона)

Повторяемый процесс для каждого следующего сайта:

```bash
# 1. Скопировать шаблон
cp -r apps/site01-path-marketplace apps/siteNN-name

# 2. package.json: name → "@repo/siteNN-name"

# 3. globals.css: обновить CSS переменные под тему сайта

# 4. Directus: INSERT INTO sites (slug, domain, name, primary_color, font)

# 5. Coolify: новый Resource, root=apps/siteNN-name
#    env: NEXT_PUBLIC_SITE_SLUG=siteNN-name, NEXT_PUBLIC_SITE_DOMAIN=siteNN.com

# 6. Cloudflare: A-запись siteNN.com → IP App VPS

# 7. Coolify: привязать домен → SSL автоматически

# 8. Uptime Kuma: добавить монитор

# 9. Plausible: добавить сайт

# 10. Smoke test + Lighthouse
```

Время на лендинг: **1 день**.
Время на e-commerce платформу: **2-3 дня** (нужна Supabase схема и PayMesh интеграция).

---

## Сводная таблица фаз

| Фаза | Что | Срок | Статус |
|---|---|---|---|
| 0 | Setup: Supabase Cloud, R2, seed, .env | 2-3 дня | 🔲 не начата |
| 1 | Каталог: homepage, collections, shop, characters | 1 неделя | 🟡 частично (нет /characters/[slug]) |
| 2 | PDP + Collectible UI | 1.5 недели | 🔲 не начата |
| 3 | Commerce: cart, checkout, PayMesh, dashboard API | 1 неделя | 🔲 не начата |
| 4 | Account, SEO, deploy | 3-4 дня | 🔲 не начата |
| 5 | Подписки | TBD | ⏳ ждёт тарифов |
| 6 | Сайты 2-20 | ~1 день/сайт | ⏳ ждёт шаблона |

**Критический путь:** Блокеры → Фаза 0 → Фазы 1+2 параллельно → Фаза 3 → Фаза 4 → деплой.

---

## Открытые вопросы

- `counterparty_id` в `POST /payments`: передавать `user_id` из Supabase Auth или отдельная сущность Counterparty в Gateway? *(Алексей Астафьев)*
- RLS Dashboard Supabase: `anon_key` достаточно для `POST /rest/v1/orders` из маркетплейса или нужен `service_role_key`? *(Алексей Ханипов)*
- ETH ceiling: int64 overflow выше ~9.2 ETH — зафиксировать как known limitation в Gateway
- `RECONCILE_INTERVAL=1h` в Gateway — подходит для маркетплейса? *(Алексей Астафьев)*
- Список 20 доменов и slugs — блокирует Cloudflare + Coolify для Фазы 6
- Физическая логистика: самофулфилмент или 3PL партнёр?
- Локализация: RU + EN на старте или только RU?
- Blind box механика в полном объёме (popmart.com "mystery box") — в Фазе 2 или отдельный спринт?

## Связанные документы

- [[Site Factory TZ v2]]
- [[Site Factory Architecture]]
- [[Path Animation Marketplace]]
- [[Environment Setup]]
- `dashboard/docs/API_CONTRACT_v2.0.md`
