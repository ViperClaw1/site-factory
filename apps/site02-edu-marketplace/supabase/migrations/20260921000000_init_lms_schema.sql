-- LMS + commerce schema for site02-edu-marketplace.
-- Legacy per-site schema: conflicts with the toys schema (orders, order_status),
-- so it can't share a database with it. Superseded by the shared baseline in
-- packages/db (ADR-008).
-- Idempotent: safe to re-run on the same database.

create extension if not exists pgcrypto;

do $$ begin
  create type course_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type lesson_type as enum ('video', 'audio', 'text');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type enrollment_status as enum ('active', 'revoked');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type order_status as enum ('pending', 'paid', 'cancelled', 'refunded');
exception when duplicate_object then null;
end $$;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  level text check (level is null or level in ('beginner', 'intermediate', 'advanced')),
  language text not null default 'ru',
  category text,
  tags text[] not null default '{}',
  cover_image text,
  promo_video_url text,
  price numeric(12, 2) not null,
  currency text not null default 'RUB',
  instructor_id uuid,
  status course_status not null default 'draft',
  duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_status_idx on courses (status);
create index if not exists courses_category_idx on courses (category);

create or replace trigger courses_set_updated_at
  before update on courses
  for each row execute function set_updated_at();

create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  title text not null,
  description text,
  sort integer not null default 0,
  is_preview boolean not null default false
);

create index if not exists course_modules_course_id_idx on course_modules (course_id);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references course_modules (id) on delete cascade,
  slug text not null,
  title text not null,
  type lesson_type not null,
  duration_seconds integer,
  sort integer not null default 0,
  is_preview boolean not null default false,
  content_md text,
  media_storage_path text,
  unique (module_id, slug)
);

create index if not exists lessons_module_id_idx on lessons (module_id);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status order_status not null default 'pending',
  payment_provider text,
  payment_method text,
  payment_id text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null,
  total numeric(12, 2) not null,
  currency text not null default 'RUB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_status_idx on orders (status);

create or replace trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  order_id uuid not null references orders (id) on delete cascade,
  status enrollment_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists enrollments_user_id_idx on enrollments (user_id);

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  position_seconds integer not null default 0,
  completed_at timestamptz,
  unique (user_id, lesson_id)
);

create index if not exists lesson_progress_user_id_idx on lesson_progress (user_id);

-- Row Level Security

alter table courses enable row level security;
alter table course_modules enable row level security;
alter table lessons enable row level security;
alter table orders enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;

drop policy if exists "active courses are publicly readable" on courses;
create policy "active courses are publicly readable"
  on courses for select
  using (status = 'active');

drop policy if exists "modules of active courses are publicly readable" on course_modules;
create policy "modules of active courses are publicly readable"
  on course_modules for select
  using (
    exists (
      select 1 from courses
      where courses.id = course_modules.course_id
        and courses.status = 'active'
    )
  );

-- E0: catalog needs lesson titles for every lesson. Body/path stay unused
-- in public UI; signed-URL route will still gate media in E4.
drop policy if exists "lessons of active courses are publicly readable" on lessons;
create policy "lessons of active courses are publicly readable"
  on lessons for select
  using (
    exists (
      select 1 from course_modules
      join courses on courses.id = course_modules.course_id
      where course_modules.id = lessons.module_id
        and courses.status = 'active'
    )
  );

drop policy if exists "users can view their own orders" on orders;
create policy "users can view their own orders"
  on orders for select
  using (auth.uid() = user_id);

drop policy if exists "users can create their own orders" on orders;
create policy "users can create their own orders"
  on orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can view their own enrollments" on enrollments;
create policy "users can view their own enrollments"
  on enrollments for select
  using (auth.uid() = user_id);

drop policy if exists "users can view their own progress" on lesson_progress;
create policy "users can view their own progress"
  on lesson_progress for select
  using (auth.uid() = user_id);

drop policy if exists "users can upsert their own progress" on lesson_progress;
create policy "users can upsert their own progress"
  on lesson_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "users can update their own progress" on lesson_progress;
create policy "users can update their own progress"
  on lesson_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
