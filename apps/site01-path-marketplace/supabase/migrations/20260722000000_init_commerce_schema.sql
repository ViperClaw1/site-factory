-- PHASE 1: Commerce schema (products, orders, digital access, wishlists, subscriptions)
-- Mirrors packages/types/src/{commerce,payments,subscriptions}.ts

create extension if not exists pgcrypto;

create type product_type as enum ('physical', 'digital');
create type product_status as enum ('active', 'draft', 'archived');
create type order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');
create type subscription_status as enum ('active', 'past_due', 'cancelled', 'expired');
create type billing_cycle as enum ('monthly', 'yearly');

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- products ------------------------------------------------------------

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category text not null,
  product_type product_type not null,
  collection text,
  character text,
  is_collectible boolean not null default false,
  edition_size integer,
  series text,
  images jsonb not null default '[]'::jsonb,
  base_price numeric(12, 2) not null,
  currency text not null default 'USD',
  weight_grams integer,
  collectible_story jsonb,
  status product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on products (category);
create index products_status_idx on products (status);

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- product_variants ------------------------------------------------------

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  sku text not null unique,
  attributes jsonb,
  price numeric(12, 2),
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_variants_product_id_idx on product_variants (product_id);

-- orders ------------------------------------------------------------

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status order_status not null default 'pending',
  payment_provider text,
  payment_method text,
  payment_id text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null,
  shipping_cost numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  currency text not null default 'USD',
  shipping_address jsonb,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on orders (user_id);
create index orders_status_idx on orders (status);

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- digital_access ------------------------------------------------------

create table digital_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  order_id uuid not null references orders (id) on delete cascade,
  expires_at timestamptz,
  download_count integer not null default 0,
  max_downloads integer not null,
  created_at timestamptz not null default now()
);

create index digital_access_user_id_idx on digital_access (user_id);
create unique index digital_access_user_product_order_idx
  on digital_access (user_id, product_id, order_id);

-- wishlists ------------------------------------------------------------

create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index wishlists_user_id_idx on wishlists (user_id);

-- subscription_plans ------------------------------------------------------

create table subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null,
  price_monthly numeric(12, 2),
  price_yearly numeric(12, 2),
  currency text not null default 'USD',
  features jsonb,
  -- Plans stay hidden until Phase 5 seeds them and flips this on explicitly.
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- subscriptions ------------------------------------------------------

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references subscription_plans (id) on delete restrict,
  status subscription_status not null default 'active',
  payment_provider text,
  provider_sub_id text,
  billing_cycle billing_cycle,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on subscriptions (user_id);

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- Row Level Security ------------------------------------------------------

alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table digital_access enable row level security;
alter table wishlists enable row level security;
alter table subscription_plans enable row level security;
alter table subscriptions enable row level security;

-- Public catalog: readable by anyone, writes only via service_role (bypasses RLS).
create policy "products are publicly readable"
  on products for select
  using (status = 'active');

create policy "product variants are publicly readable"
  on product_variants for select
  using (true);

create policy "active subscription plans are publicly readable"
  on subscription_plans for select
  using (is_active = true);

-- Orders: owner can read and create their own orders. Status transitions
-- (paid/shipped/refunded) happen server-side via service_role, not RLS.
create policy "users can view their own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "users can create their own orders"
  on orders for insert
  with check (auth.uid() = user_id);

-- Digital access: read-only for the owner. Grants/download counters are
-- written server-side via service_role after payment confirmation.
create policy "users can view their own digital access"
  on digital_access for select
  using (auth.uid() = user_id);

-- Wishlists: fully owned by the user.
create policy "users can view their own wishlist"
  on wishlists for select
  using (auth.uid() = user_id);

create policy "users can add to their own wishlist"
  on wishlists for insert
  with check (auth.uid() = user_id);

create policy "users can remove from their own wishlist"
  on wishlists for delete
  using (auth.uid() = user_id);

-- Subscriptions: read-only for the owner. Created/updated server-side via
-- service_role in response to billing provider webhooks.
create policy "users can view their own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Realtime ------------------------------------------------------------------

-- Required by StockCounter / EditionCounter: without this publication the
-- product_variants channel never emits stock changes.
alter publication supabase_realtime add table product_variants;
