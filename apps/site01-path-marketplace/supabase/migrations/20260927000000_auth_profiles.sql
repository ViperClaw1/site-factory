-- PHASE 2: Auth profiles + avatar storage
-- Roles live in auth.users.raw_app_meta_data->>'role' (JWT app_metadata),
-- which users cannot edit themselves. No role = 'customer'; promote with
-- the service role: auth.admin.updateUserById(id, { app_metadata: { role: 'admin' } }).
-- See lib/rbac.ts for the permission map.

-- profiles ------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  -- E.164, as produced by react-phone-number-input.
  phone text check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;

create policy "users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users can create their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- avatars bucket ------------------------------------------------------------

-- Public read (avatars render via next/image); size + type enforced by
-- Storage itself, not just the client form.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Each user writes only under their own "<uid>/" folder.
create policy "users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can replace their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
