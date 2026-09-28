---
tags: [site02, edu-marketplace, plan, payments]
aliases: [E3 Payment Flow, site02 checkout plan]
---

# site02 — Phase E3: course page → cart → checkout → access

Scope: the purchase half of E3 in [[Implementation_Plan_v2]] (auth is already done).
Milestone (unchanged from the spec): **pay → webhook → enrollment → course shows in `/account/courses`; Dashboard sees the order.**

## 0. Where we start

| Piece | State today |
|---|---|
| `/courses/[slug]` | Reads Supabase, renders curriculum. Old styling, hardcoded Russian, **disabled** "В корзину — E3" button. |
| `/cart`, `/checkout`, `/checkout/confirmation`, `/account/courses` | `ComingSoon` placeholders. |
| `features/cart`, `features/checkout`, `features/course` | Empty `export {}` stubs. |
| `api/checkout/create-order`, `api/paymesh/webhook` | Return 501. |
| PayMesh / Dashboard client code | **Doesn't exist anywhere yet** (site01 checkout is still a mock). site02 writes it first. |
| DB schema | `orders`, `enrollments` exist. RLS lets a signed-in user `INSERT` their own order with **any** total/status → must be closed (see 1.1). |
| Auth | Supabase email + Google done; no middleware yet. |
| Seed data | 5 courses, all `RUB`. |

**External blockers** (same as spec table): `PAYMESH_GATEWAY_URL` / `PAYMESH_API_KEY` / `PAYMESH_WEBHOOK_SECRET` (Alexey Astafyev), `DASHBOARD_SUPABASE_URL` / `_ANON_KEY` (Alexey Khanipov), public webhook URL. Step 4 introduces a mock gateway so steps 1–6 don't wait on them.

## 1. Data & security (0.5 day)

1.1 Migration `…_e3_orders_hardening.sql`:
- `drop policy "users can create their own orders"` — orders are created only by the server (service role), with prices read from `courses`, never from the client.
- `orders.payment_id` → `unique` index (webhook looks orders up by `payment_intent_id`).
- `enrollments`: no insert/update policy for users (service role only) — verify, add a comment.

1.2 `lib/supabase-admin.ts` (`server-only`): service-role client from `SUPABASE_SERVICE_ROLE_KEY`. Used only by `create-order` and the webhook.

1.3 `middleware.ts`: `@supabase/ssr` session refresh + redirect guests from `/checkout`, `/account/*`, `/learn/*` to `/login?next=…`. Replaces the client-side guard in `Profile.tsx`.

## 2. Course page (1 day) — `features/course`

- Restyle `/courses/[slug]` to the new dark UI kit; strings into the i18n dictionaries (8 languages).
- Curriculum accordion: module → lessons, video/audio/text icon, "preview" badge.
- Sticky price card with a single CTA whose state depends on the visitor:
  - **enrolled** → "Go to course" (`/learn/[slug]`)
  - **in cart** → "In cart — checkout" (`/cart`)
  - otherwise → "Add to cart" + secondary "Buy now" (add + go to `/checkout`)
- Enrolled check: client hook `useEnrollments()` (RLS select on own `enrollments`), so the page stays ISR/public.
- Landing `CoursesShowcase` cards link to real `/courses/[slug]` where a seed course exists.

## 3. Cart (1 day) — `features/cart`

- Zustand + `persist`, key `edu-marketplace-cart`, stores **course ids only** (qty is always 1, duplicates ignored). Works for guests.
- Header cart icon gets a count badge (visible for guests too, not only signed-in users).
- `/cart` page: fetches current title/price/cover for the ids (public read), drops ids that are no longer `active`, shows total, "Checkout" CTA. Empty state → `/courses`.
- On sign-in: remove courses the user is already enrolled in.
- Single currency per cart (all seed data is RUB); mixed currency is rejected server-side anyway.

## 4. PayMesh + Dashboard clients (1 day) — `packages/lib`

Shared, because site01 needs the same code for its Phase 3. Server-only entry points, not re-exported from the barrel:

- `@repo/lib/paymesh`: `createPayment({ orderId, amountMinor, currency, method, counterpartyId })` (sends `Idempotency-Key: orderId`), `getPayment(id)`, `verifyWebhookSignature(rawBody, header)` (HMAC-SHA256, `timingSafeEqual`), `toMinorUnits()`.
- `@repo/lib/dashboard`: `postOrderToDashboard(order, siteSlug)` — best-effort, 409 = ok, never throws.
- **Mock mode**: when `PAYMESH_GATEWAY_URL` is unset, `createPayment` returns `checkoutUrl = /checkout/mock?order=…`. That dev-only page posts a correctly signed fake `payment.confirmed` to our own webhook. It's disabled in production builds. This lets us build and test the whole flow before we get credentials.
- Unit check for `toMinorUnits` + signature verify (known vector).

## 5. Checkout (1 day) — `features/checkout`

`/checkout` (CSR, signed-in only via middleware):
1. Empty cart → `/courses`.
2. Order summary (no shipping; digital only).
3. Payment method: **Fiat** / **Crypto**.
4. Submit → `POST /api/checkout/create-order` → `window.location.href = checkoutUrl`.

`POST /api/checkout/create-order`:
1. `getUser()` from cookies → 401.
2. Validate body (`courseIds: uuid[]`, 1..20, `method: 'fiat'|'crypto'`).
3. Load courses `status='active'`; reject unknown ids; drop ones the user is already enrolled in; 400 if nothing is left or currencies are mixed.
4. Total computed **server-side** from DB prices.
5. Insert `orders` (`pending`, `items = [{course_id, title, unit_price, quantity: 1}]`) with the admin client.
6. `createPayment` → save `payment_id` on the order.
7. Return `{ orderId, checkoutUrl }`. Errors surface to the user (no swallowing, per spec).

Return URL from PayMesh → `/checkout/confirmation?order=<id>`.

## 6. Webhook → enrollment (1 day)

`POST /api/paymesh/webhook`:
1. `rawBody = await req.text()`; verify `X-PayMesh-Signature`, otherwise 401.
2. Find the order by `payment_id = payment_intent_id`; if it's unknown, return 200 and log it (don't make the gateway retry forever).
3. Check the event amount and currency against `order.total`; if they don't match, log it and don't grant access.
4. `payment.confirmed` → `handlePaymentSuccess(order)`:
   - `update orders set status='paid' where id=… and status='pending'` — the status condition makes it idempotent, and a duplicate event does nothing.
   - `upsert enrollments (user_id, course_id, order_id)` with `on conflict do nothing`.
   - `postOrderToDashboard(…, 'edu-marketplace')`, best-effort.
5. `payment.failed` → `status='cancelled'`.
6. Always 200 once the signature is valid.

`/checkout/confirmation`:
- Polls its own order (RLS select) every 2s for up to about 60s.
- `paid` → clear the cart, show "Start learning" → `/learn/[slug]` (or `/account/courses` if there are several courses).
- Still `pending` after polling → call `GET /api/checkout/status?order=…`. This route uses `getPayment()` (the **fallback for PayMesh not retrying webhooks**) and runs the same `handlePaymentSuccess`.
- `cancelled` → show a message and a "Try again" button back to `/checkout`.

## 7. Account (0.5 day)

- `/account/courses`: the user's active enrollments as cards → `/learn/[slug]`.
- `/account/orders` + `/account/orders/[id]`: order list with status, total and items.
- Profile page links to both.

## 8. Verification (0.5 day)

- Playwright happy path in mock mode: add to cart → login → checkout → mock pay → confirmation → course listed in `/account/courses`.
- Negative checks:
  - A tampered price in the request body is ignored.
  - A bad signature gets 401.
  - A duplicate webhook doesn't create a second enrollment.
  - A guest opening `/checkout` is redirected to login.
- With real credentials: run once against `pm_test_…`, with the webhook going through a tunnel (`cloudflared`/`ngrok`), then confirm the order appears in the Dashboard.

## Order & estimate

1 → 4 → 3 → 2 → 5 → 6 → 7 → 8. The data layer and gateway client come first so the UI steps have real endpoints to use. Estimate: **~6–7 dev days**, which matches the spec's "1 week". Once the credentials arrive, the real-PayMesh switch is just env vars plus one test run.

## Out of scope (spec: later phases)

- Refunds and cancelling a pending payment from the UI.
- Coupons.
- Subscriptions (E6).
- Player and signed media URLs (E4).
- Cart drawer: we're building the `/cart` page only; add the drawer later if UX asks for it.

## Open questions

1. **Guest cart:** can a guest add courses to the cart and only log in at checkout (this plan), or must they log in first?
2. **"Buy now":** keep the button, or offer only "Add to cart"?
3. **Crypto:** offer it at launch for RUB-priced courses, or fiat only until the gateway confirms how RUB and crypto conversion works?
4. **Shared code:** confirm that the PayMesh and Dashboard clients go into `packages/lib` (shared with site01) rather than `apps/site02/lib`.
