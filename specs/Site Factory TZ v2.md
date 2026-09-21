---
tags: [project/task-4-site-factory, type/spec, status/draft]
project: "Task 4 - Site Factory"
status: draft
created: 2026-07-27
updated: 2026-07-29
aliases: [Site Factory TZ v2, TZ v2.0, PayMesh Gateway Integration, Dashboard Integration, Фабрика сайтов ТЗ v2]
---

# Фабрика сайтов + Маркетплейс Path Animation — ТЗ v2.0

Приоритетная задача №4. Ответственный за архитектуру и маркетплейс — Никита Клотсман.
Инфраструктура и деплой — Алексей (`Rubitco1`).
Платёжный Gateway — Алексей Астафьев (`paymesh-gateway`).
Дашборд/CRM — Алексей Ханипов (`NeuroAlex86`).
Дата: 2026-07-27.

Обновляет и уточняет [[Site Factory Architecture]], [[Path Animation Marketplace]] и [[Environment Setup]] в части платёжной интеграции и связи с дашбордом.

---

## Что изменилось в v2.0 относительно v1.0

| Тема | Было | Стало |
|---|---|---|
| Платёжная интеграция | Маркетплейс вызывает Hyperswitch/BTCPay напрямую | Маркетплейс вызывает только `POST /payments` PayMesh Gateway |
| Webhook от провайдеров | Маркетплейс обрабатывает webhook Hyperswitch и BTCPay | Gateway обрабатывает, отправляет подписанный webhook маркетплейсу |
| Formance | Маркетплейс пишет в Formance сам | Gateway пишет в Formance через `adapters/formance` |
| Dashboard | Маркетплейс пушит агрегаты в дашборд | `POST /orders` — маркетплейс; `POST /financial_transactions` — PayMesh через `adapters/crmreporting` |
| Dashboard стек | Vite + React (прототип HTML) | Vite + React + TypeScript + Tailwind + Supabase Realtime (уже реализован) |
| Подписки | Не реализованы, stub | AnyBill adapter stub в Gateway — ждёт данных по тарифам |
| Supabase маркетплейса | Self-hosted на DB VPS | Облачный Supabase Cloud Pro ($25/мес) — меньше ops-нагрузки, бэкапы из коробки |

---

## 1. Задача

Та же что в v1.0: Turborepo monorepo для 20 сайтов Path Animation, первый в продакшен — маркетплейс игрушек (`site01-path-marketplace`).

---

## 2. Архитектура — обновлённая

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare DNS / CDN                          │
│  path-animation.com  marketplace.path-animation.com  ...        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                  App VPS (Canada / France, 16GB)                 │
│  Coolify + Traefik                                               │
│  ┌──────────────────┐  ┌──────────┐  ┌──────────┐              │
│  │  20x Next.js     │  │ Directus │  │ Plausible│              │
│  │  контейнеры      │  │  (CMS)   │  │          │              │
│  └────────┬─────────┘  └────┬─────┘  └──────────┘              │
│           │ POST /payments   │ REST API                          │
│           │                 │                                    │
│  Uptime Kuma (мониторинг всех 20 доменов + инфра)               │
└───────────┼─────────────────┼──────────────────────────────────┘
            │                 │ port 5432 internal only
            │    ┌────────────▼────────────────────────────────┐
            │    │  DB VPS (Beget, 16GB)                        │
            │    │  PostgreSQL 16 + pgvector                    │
            │    │    directus_db, parser_db, mailer_db,        │
            │    │    dashboard_db                              │
            │    └─────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  Supabase Cloud Pro ($25/мес)                                 │
│    products, variants, orders, digital_access, wishlists,     │
│    subscription_plans, subscriptions                          │
│    Auth (email + Google OAuth)                                │
│    Realtime (product_variants → live stock counters)          │
│    Ежедневные бэкапы из коробки                               │
└───────────────────────────────────────────────────────────────┘
            │
            ▼ X-API-Key: pm_live_...
┌───────────────────────────────────────────────────────────────┐
│               Payments VPS (выделенный VPS)                    │
│                                                               │
│  PayMesh Gateway (Go) — единый фасад                          │
│    POST /payments       ← маркетплейс создаёт платёж          │
│    GET  /payments/{id}  ← маркетплейс проверяет статус        │
│    POST /payments/{id}/refund ← возврат                       │
│    POST /payments/{id}/cancel ← отмена                        │
│    GET  /dashboard/events (SSE) ← live события дашборду       │
│                                                               │
│  Hyperswitch (self-hosted) ← fiat: карты, банк. переводы      │
│  BTCPay Server 1.13.x    ← crypto: BTC, ETH, USDT, USDC      │
│  Formance Ledger         ← внутренняя бухгалтерия             │
│  PostgreSQL (Gateway БД) ← PaymentIntent, Payout, APIKey      │
│  Redis 7.x               ← кэш                               │
│                                                               │
│  Webhook IN:  POST /webhooks/hyperswitch  (HMAC-SHA512)       │
│               POST /webhooks/btcpay       (HMAC-SHA256)       │
│  Webhook OUT: POST {site_webhook_url}     (X-PayMesh-Sig)     │
│  CRM report:  POST /rest/v1/financial_transactions → Dashboard│
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  Dashboard (Модуль №19)                                       │
│  Vite + React + TypeScript + Tailwind                         │
│  Supabase Cloud Pro ($25/мес, Realtime + Auth из коробки)     │
│    leads, orders, financial_transactions,                     │
│    scenario_events, site_traffic_hourly, directory_stats      │
│                                                               │
│  Пишут:                                                       │
│    Маркетплейс → POST /rest/v1/orders                         │
│    PayMesh     → POST /rest/v1/financial_transactions         │
│    Плавебл скрипт → POST /rest/v1/site_traffic_hourly (5 мин)│
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│  Cloudflare R2                                                │
│    path-marketplace-digital  (цифровые товары, signed URL)   │
│    backups  (pg_dump, Coolify, Supabase)                      │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. PayMesh Gateway — особенности реализации

### Архитектура Gateway

Gateway написан на **Go** по принципам гексагональной / clean архитектуры:

```
domain/       — сущности и инварианты (PaymentIntent, Payout, Money, APIKey)
              — ZERO импортов из provider-кода
application/  — use cases (CreateInboundPayment, HandleProviderWebhook, CreatePayout)
              — не знает о конкретных провайдерах (Hyperswitch, BTCPay — не упоминаются)
ports/        — интерфейсы (PaymentGatewayPort, CryptoGatewayPort, LedgerPort, EventPublisherPort)
adapters/     — реализации портов:
                hyperswitch, btcpay, formance, postgres,
                dashboard (SSE), sitewebhook, crmreporting, anybill (stub), kyc (stub)
interfaces/   — HTTP API (X-API-Key auth), webhook receivers
```

Смена провайдера = смена адаптера + composition root. `domain/` и `application/` не трогаются.

### Что важно для интеграции с маркетплейсом

**Аутентификация маркетплейса в Gateway:**
```
X-API-Key: pm_live_a1b2c3...
```
Ключ выдаётся оператором через `cmd/keys`. Не самосервисный. Нужно получить у Алексея Астафьева.

**Суммы — ТОЛЬКО integer minor units:**
```
10.00 RUB  → amount: 1000    (копейки)
25.00 USD  → amount: 2500    (центы)
25.00 USDT → amount: 25000000 (USDT имеет 6 minor digits)
0.00015 BTC → amount: 15000  (satoshis, 8 minor digits)
```
Gateway эхует `amount_display` — проверять при интеграции.

**ETH ceiling:** `int64` переполняется выше ~9.2 ETH. Известное ограничение, зафиксировано в roadmap Gateway.

**Идемпотентность:**
```
Idempotency-Key: order_48213   (заголовок запроса)
```
Ретрай с тем же ключом возвращает оригинальный платёж, не создаёт дубль.

**Webhook от Gateway к маркетплейсу:**
```
POST {MARKETPLACE_WEBHOOK_URL}
X-PayMesh-Signature: sha256=<hex>    ← HMAC-SHA256(body, webhook_secret)
Content-Type: application/json

{
  "event": "payment.confirmed",
  "payment_intent_id": "9f8c...",
  "status": "confirmed",
  "amount": 1000,
  "currency": "USD",
  "amount_display": "10.00 USD"
}
```
Верификация: `HMAC-SHA256(rawBody, PAYMESH_WEBHOOK_SECRET)` constant-time сравнение.

**Known limitation Gateway:** No retry на outbound webhook. Держать polling `GET /payments/{id}` как fallback.

**Crypto refund:** BTCPay не поддерживает автоматический refund. `POST /payments/{id}/refund` на crypto вернёт 400. Ручной процесс.

**Payout approval threshold:** payouts ≥ $10,000 (или 1,000,000 minor units USD) паркуются как `pending_approval`. Оператор подтверждает через `cmd/payouts approve`.

---

## 4. Dashboard — особенности реализации

Dashboard (Модуль №19, Алексей Ханипов) — самостоятельное React-приложение:
- **Стек:** Vite + React 18 + TypeScript + Tailwind CSS
- **БД:** Supabase (PostgreSQL 16) — отдельный инстанс, не маркетплейсовый
- **Realtime:** Supabase Realtime на таблицах `leads`, `scenario_events`, `orders`, `financial_transactions`
- **Auth:** Supabase Auth (`authenticated` role — RLS policy "Full access")
- **Компоненты:** KanbanBoard (воронка лидов), RealtimeFeed (события), StatsOverview (метрики)
- **Human-in-the-loop:** изменение статуса лида из UI → `UPDATE leads SET status = ? WHERE id = ? AND status_version = ?` (оптимистическая блокировка)

### Таблицы Dashboard Supabase (из `001_init_schema.sql`)

```sql
leads               (id, source, status, status_version, contact_info jsonb,
                     text, payload jsonb, created_at)
orders              (id TEXT PK, site_slug, status, customer_email,
                     amount_minor INT8, currency, items jsonb, created_at)
financial_transactions (id TEXT PK, transaction_type, provider, status,
                        counterparty_id, amount_minor INT8, currency,
                        reference_id, idempotency_key TEXT UNIQUE, created_at)
scenario_events     (event_id, event_type, project_id, job_id, stage,
                     status, data jsonb, occurred_at)
site_traffic_hourly (site_instance_id, period_start, period_end,
                     views_count, unique_visitors, published_articles_count,
                     errors_count) UNIQUE(site_instance_id, period_start)
directory_stats     (campaign_id, sent_count, bounce_count,
                     active_accounts_count, reported_at)
```

Все таблицы в `supabase_realtime` publication. RLS: только `authenticated` role имеет доступ.

---

## 5. Что маркетплейс отправляет и куда

```
Маркетплейс → PayMesh Gateway
  POST /payments                    создать платёж (fiat или crypto)
  GET  /payments/{id}               polling статуса (fallback)
  POST /payments/{id}/cancel        отмена pending платежа
  POST /payments/{id}/refund        возврат fiat платежа

Маркетплейс → Dashboard Supabase
  POST /rest/v1/orders              при payment.confirmed (один раз)
  POST /rest/v1/site_traffic_hourly cron каждые 5 минут ← Plausible Stats API

PayMesh Gateway → Dashboard Supabase (не маркетплейс)
  POST /rest/v1/financial_transactions   через adapters/crmreporting
                                         при каждом confirmed/failed/refunded

PayMesh Gateway → Маркетплейс
  POST {MARKETPLACE_WEBHOOK_URL}    payment.confirmed (X-PayMesh-Signature)
```

---

## 6. Обновлённая платёжная логика маркетплейса

### Создание платежа

```typescript
// lib/paymesh.ts — НОВЫЙ, заменяет lib/hyperswitch.ts и lib/btcpay.ts
export async function createPayMeshPayment(
  order: Order,
  paymentMethod: 'fiat' | 'crypto',
  counterpartyId: string
) {
  const res = await fetch(`${process.env.PAYMESH_GATEWAY_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.PAYMESH_API_KEY!,
      'Idempotency-Key': order.id,   // order.id как idempotency key
    },
    body: JSON.stringify({
      counterparty_id: counterpartyId,
      amount: toMinorUnits(order.total, order.currency),
      currency: order.currency,
      method: paymentMethod            // 'fiat' или 'crypto'
    })
  });

  if (!res.ok) throw new Error(`PayMesh: ${res.status} ${await res.text()}`);
  const payment = await res.json();

  // Проверить amount_display — защита от ошибки minor units
  console.log('[PayMesh] amount_display:', payment.amount_display);

  return {
    paymentIntentId: payment.payment_intent_id,
    checkoutUrl: payment.checkout_url,   // redirect покупателя сюда
    status: payment.status
  };
}

// Конвертация в minor units по правилам Gateway
function toMinorUnits(amount: number, currency: string): number {
  const minorDigits: Record<string, number> = {
    USD: 2, EUR: 2, GBP: 2, RUB: 2,
    JPY: 0,
    USDT: 6, USDC: 6,
    BTC: 8,
    ETH: 18  // осторожно: overflow выше ~9.2 ETH
  };
  const digits = minorDigits[currency] ?? 2;
  return Math.round(amount * Math.pow(10, digits));
}
```

### Webhook от Gateway

```typescript
// app/api/paymesh/webhook/route.ts — НОВЫЙ
// Заменяет app/api/hyperswitch/webhook и app/api/btcpay/webhook
import { createHmac, timingSafeEqual } from 'crypto';

export async function POST(req: Request) {
  const sig = req.headers.get('x-paymesh-signature');  // "sha256=<hex>"
  const rawBody = await req.text();

  // Верификация подписи
  const expected = 'sha256=' + createHmac('sha256', process.env.PAYMESH_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  if (!timingSafeEqual(Buffer.from(sig ?? ''), Buffer.from(expected))) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === 'payment.confirmed') {
    // Найти order по payment_intent_id
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('payment_id', event.payment_intent_id)
      .single();

    if (order) {
      const hasDigital = order.items.some(i => i.product_type === 'digital');
      await handlePaymentSuccess(
        order.id,
        event.payment_intent_id,
        hasDigital
      );
    }
  }

  return Response.json({ received: true });
}
```

### handlePaymentSuccess — обновлённый

```typescript
// lib/payment-handlers.ts
export async function handlePaymentSuccess(
  orderId: string,
  paymentId: string,
  hasDigital: boolean
) {
  // 1. Обновить order в Supabase маркетплейса
  const { data: order } = await supabaseAdmin
    .from('orders')
    .update({ status: 'paid', payment_id: paymentId })
    .eq('id', orderId)
    .select('items, user_id, total, currency, customer_email')
    .single();

  // 2. Decrement stock физических товаров (атомарно через RPC)
  for (const item of order.items) {
    if (item.product_type === 'physical') {
      await supabaseAdmin.rpc('decrement_stock', {
        variant_id: item.variant_id,
        qty: item.qty
      });
    }
  }

  // 3. Digital access
  if (hasDigital) {
    const digitalItems = order.items.filter(i => i.product_type === 'digital');
    await supabaseAdmin.from('digital_access').insert(
      digitalItems.map(item => ({
        user_id: order.user_id,
        product_id: item.product_id,
        order_id: orderId,
        expires_at: null,
        max_downloads: 5
      }))
    );
  }

  // 4. POST /orders в Dashboard
  // financial_transactions пишет PayMesh Gateway через adapters/crmreporting — НЕ мы
  await postOrderToDashboard(order, orderId);
}
```

### Dashboard — POST /orders

```typescript
// lib/dashboard.ts
export async function postOrderToDashboard(order: any, orderId: string) {
  try {
    const res = await fetch(
      `${process.env.DASHBOARD_SUPABASE_URL}/rest/v1/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DASHBOARD_SUPABASE_ANON_KEY}`,
          'apikey': process.env.DASHBOARD_SUPABASE_ANON_KEY!,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id: orderId,
          site_slug: 'path-marketplace',
          status: 'paid',
          customer_email: order.customer_email,
          amount_minor: toMinorUnits(order.total, order.currency),
          currency: order.currency,
          items: order.items.map(i => ({
            product_id: i.product_id,
            title: i.title,
            quantity: i.qty,
            unit_amount_minor: toMinorUnits(i.price_at_purchase, order.currency)
          })),
          created_at: new Date().toISOString()
        })
      }
    );
    // 409 = already exists = ok (idempotent)
    if (!res.ok && res.status !== 409) {
      throw new Error(`Dashboard: ${res.status}`);
    }
  } catch (err) {
    // Best-effort — не блокировать основной flow
    console.error('[Dashboard] POST /orders failed:', err);
  }
}
```

---

## 7. Новые файлы в `apps/site01-path-marketplace/`

```
lib/
  paymesh.ts              # createPayMeshPayment(), toMinorUnits(), pollPaymentStatus()
  dashboard.ts            # postOrderToDashboard(), updateOrderStatusInDashboard()
  payment-handlers.ts     # handlePaymentSuccess() — обновлённый

app/api/
  paymesh/
    webhook/route.ts      # X-PayMesh-Signature верификация + routing

tools/scripts/
  sync-traffic.ts         # cron 5 мин → Plausible API → /rest/v1/site_traffic_hourly
```

**Удаляются (больше не нужны):**
```
lib/hyperswitch.ts        # заменён paymesh.ts
lib/btcpay.ts             # заменён paymesh.ts
lib/formance.ts           # Gateway пишет сам
app/api/hyperswitch/      # заменён paymesh/webhook
app/api/btcpay/           # заменён paymesh/webhook
```

---

## 8. Обновлённые env variables

```env
# Site
NEXT_PUBLIC_SITE_SLUG=path-marketplace
NEXT_PUBLIC_SITE_DOMAIN=marketplace.path-animation.com
BASE_URL=https://marketplace.path-animation.com

# Directus CMS
DIRECTUS_URL=https://cms.yourdomain.com
REVALIDATE_TOKEN=

# Supabase Cloud (маркетплейс — commerce данные, supabase.com Pro)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# PayMesh Gateway (НОВЫЙ — заменяет HYPERSWITCH_*, BTCPAY_*, FORMANCE_*)
PAYMESH_GATEWAY_URL=https://gateway.yourdomain.com
PAYMESH_API_KEY=pm_live_...                # выдаёт Алексей Астафьев через cmd/keys
PAYMESH_WEBHOOK_SECRET=                    # выдаёт Алексей Астафьев через cmd/keys set-webhook

# Dashboard Supabase (НОВЫЙ — отдельный инстанс дашборда)
DASHBOARD_SUPABASE_URL=https://crm.vibecodepath.io (или self-hosted)
DASHBOARD_SUPABASE_ANON_KEY=               # выдаёт Алексей Ханипов

# Plausible (для sync-traffic cron)
PLAUSIBLE_API_KEY=

# Admin (human-in-the-loop из дашборда)
ADMIN_WEBHOOK_KEY=

# Cloudflare R2 (цифровые товары)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=path-marketplace-digital
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Analytics
NEXT_PUBLIC_PLAUSIBLE_URL=https://analytics.yourdomain.com
```

**Убраны:**
```
HYPERSWITCH_URL, HYPERSWITCH_API_KEY, HYPERSWITCH_WEBHOOK_SECRET
BTCPAY_URL, BTCPAY_STORE_ID, BTCPAY_API_KEY, BTCPAY_WEBHOOK_SECRET
FORMANCE_URL, FORMANCE_LEDGER, FORMANCE_API_KEY
```

---

## 9. Обновлённые зависимости

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3",
    "framer-motion": "^11",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.4",
    "zustand": "^4",
    "@tanstack/react-query": "^5",
    "embla-carousel-react": "^8",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-progress": "latest",
    "next-plausible": "^3",
    "@directus/sdk": "^17",
    "@aws-sdk/client-s3": "^3",
    "@aws-sdk/s3-request-presigner": "^3"
  }
}
```

**Убраны:** `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js` (не нужны — Gateway абстрагирует).

---

## 10. Обновлённые фазы имплементации

**Фаза 0 — Setup (2-3 дня)**
- Создать проект в Supabase Cloud (supabase.com), тариф Pro ($25/мес)
- Выполнить `supabase/migrations/20260722000000_init_commerce_schema.sql` через Supabase SQL editor
- Включить Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE product_variants;`
- R2 bucket
- Seed данные
- Получить от Алексея Астафьева: `PAYMESH_GATEWAY_URL`, `PAYMESH_API_KEY` (test: `pm_test_...`), `PAYMESH_WEBHOOK_SECRET`
- Получить от Алексея Ханипова: `DASHBOARD_SUPABASE_URL`, `DASHBOARD_SUPABASE_ANON_KEY`
- Убедиться что `POST /rest/v1/orders` доступен (RLS: authenticated или service_role)

**Фаза 1 — Каталог (1 неделя)** — без изменений

**Фаза 2 — PDP + Collectible UI (1.5 недели)** — без изменений

**Фаза 3 — Commerce (1 неделя)**
- Zustand cart + CartDrawer
- `PaymentMethodSelector` (fiat / crypto — два варианта вместо трёх)
- `POST /api/checkout/create-order` → `createPayMeshPayment()` → `payment.checkout_url`
- Redirect покупателя на `checkout_url` (Gateway сам отрендерит форму Hyperswitch или BTCPay страницу)
- `POST /api/paymesh/webhook` — верификация `X-PayMesh-Signature` → `handlePaymentSuccess()`
- `GET /payments/{id}` polling как fallback (если webhook не пришёл)
- `postOrderToDashboard()` в `handlePaymentSuccess()`
- `sync-traffic.ts` cron → `site_traffic_hourly`
- `/api/download/[assetId]` → R2 signed URL

**Фаза 4 — Account + SEO + Deploy (3-4 дня)** — без изменений

**Фаза 5 — Подписки** — ждём AnyBill adapter в Gateway + данные по тарифам от продукта

---

## 11. Требуемые программные средства — обновление

### Payments VPS (выделенный, новый)

| ПО | Версия | Назначение |
|---|---|---|
| Ubuntu Server | 22.04 LTS | ОС |
| Docker Engine | 25.x | контейнеризация |
| Docker Compose | v2.x | оркестрация |
| Go | 1.22+ | рантайм Gateway (или бинарник в Docker) |
| PayMesh Gateway | latest | `paymesh-gateway` репо |
| Hyperswitch | v1.125.0 | fiat payments (pin версия из deploy/hyperswitch/README.md) |
| BTCPay Server | 1.13.x | crypto payments |
| Formance Ledger | latest | только `ledger` сервис из Formance стека |
| PostgreSQL | 15.x | Gateway собственная БД (PaymentIntent, APIKey) |
| Redis | 7.x | кэш |
| ufw | — | firewall (443 открыт, 5432 только internal) |
| rclone | 1.66.x | бэкапы платёжного контура → R2 отдельный bucket |

### Dashboard (Модуль №19 — Алексей Ханипов)

| ПО | Версия | Назначение |
|---|---|---|
| Node.js | 20.x LTS | рантайм сборки |
| Vite | 5.x | сборщик |
| React | 18.x | UI |
| TypeScript | 5.x strict | типы |
| Tailwind CSS | 3.x | стили |
| @supabase/supabase-js | 2.x | Realtime + PostgREST клиент |
| Supabase Cloud Pro | $25/мес, PostgreSQL + Realtime + Auth | хранилище дашборда — облачный, без ops |

---

## 12. Порядок запуска — обновлённый

1. **Инфраструктура** — App VPS + DB VPS: Ubuntu, Docker, ufw, Coolify *(Алексей `Rubitco1`)*
2. **Payments VPS** — Ubuntu, Docker, Hyperswitch v1.125.0, BTCPay 1.13.x, Formance, Gateway *(Алексей Астафьев)*
3. **Gateway ключи** — `cmd/keys` → `pm_test_...` для маркетплейса, webhook secret *(Алексей Астафьев)*
4. **Dashboard** — Supabase schema `001_init_schema.sql`, deploy Vite app *(Алексей Ханипов)*
5. **Dashboard ключи** — `DASHBOARD_SUPABASE_URL`, `DASHBOARD_SUPABASE_ANON_KEY` → Никите *(Алексей Ханипов)*
6. **GitHub** — репо `site-factory`, branch protection *(владелец)*
7. **DB VPS** — PostgreSQL 16 + pgvector *(Алексей `Rubitco1`)*
7a. **Supabase Cloud** — создать проект на supabase.com, выполнить `supabase/migrations/20260722000000_init_commerce_schema.sql`, получить `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` *(Никита)*
8. **Directus** — Coolify деплой, коллекции, API токен *(Никита)*
9. **Monorepo bootstrap** — packages/ui, lib, types, config, шаблон site01 *(Никита)*
10. **site01 Фаза 0** — Supabase schema, R2 bucket, seed данные *(Никита)*
11. **Интеграция Gateway** — `lib/paymesh.ts`, тест с `pm_test_...` ключом, проверить `amount_display` *(Никита)*
12. **Интеграция Dashboard** — `lib/dashboard.ts`, `POST /rest/v1/orders`, `sync-traffic.ts` *(Никита)*
13. **Фазы 1-4** — каталог, PDP, checkout, account, SEO, деплой *(Никита)*

Шаги 1-5 блокируют всё остальное. Шаг 10 можно начинать параллельно с 7-9 на локальной машине.

---

## 13. Открытые вопросы

- Gateway webhook URL: маркетплейс должен сообщить Алексею Астафьеву свой `{MARKETPLACE_WEBHOOK_URL}` для конфигурации через `cmd/keys set-webhook`
- RLS Dashboard Supabase: `authenticated` role достаточно для POST из маркетплейса или нужен `service_role_key`? Уточнить у Алексея Ханипова
- `counterparty_id` в `POST /payments`: что передавать — `user_id` из Supabase Auth или отдельная сущность Counterparty в Gateway? Уточнить у Алексея Астафьева
- AnyBill / подписки: adapter stub в Gateway, ждём данных по тарифам
- ETH ceiling: amounts > 9.2 ETH не поддерживаются (int64 overflow). Зафиксировать как known limitation
- Reconcile interval: `RECONCILE_INTERVAL=1h` по умолчанию в Gateway — подходит ли для маркетплейса?
- Список всех 20 доменов и slugs — не готов, блокирует Cloudflare + Coolify
- Физическая логистика: самофулфилмент или 3PL?
- Локализация: RU + EN на старте или только RU?
