-- Catalog admin: one public storage bucket per shop category, plus an
-- atomic product+variant insert that only the service role can call.
--
-- Bucket ids match bucketForCategory() in lib/catalog-taxonomy.mjs (identity).
-- file_size_limit is 200 MiB, the admin video cap. The hosted project's
-- Storage API currently rejects bucket limits above 50 MiB
-- ("The object exceeded the maximum allowed size", checked 2026-10-03),
-- so uploads larger than the project-wide FILE_SIZE_LIMIT still fail until
-- that cap is raised. See specs/Environment Setup.md.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('toys', 'toys', true, 209715200, array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('collectible_toys', 'collectible_toys', true, 209715200, array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('books', 'books', true, 209715200, array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('artbooks', 'artbooks', true, 209715200, array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('designs', 'designs', true, 209715200, array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('merch', 'merch', true, 209715200, array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']),
  ('figures', 'figures', true, 209715200, array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No new storage.objects policies: the browser uploads only with a signed URL
-- minted by the service role.

create or replace function public.admin_create_product(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  edition integer;
begin
  if p ? 'edition_size' and jsonb_typeof(p->'edition_size') = 'number' then
    edition := (p->>'edition_size')::integer;
  else
    edition := null;
  end if;

  insert into public.products (
    slug, title, description, category, product_type,
    character, is_collectible, edition_size, series,
    images, base_price, currency, status
  ) values (
    p->>'slug',
    p->>'title',
    nullif(p->>'description', ''),
    p->>'category',
    (p->>'product_type')::public.product_type,
    nullif(p->>'character', ''),
    coalesce((p->>'is_collectible')::boolean, false),
    edition,
    nullif(p->>'series', ''),
    coalesce(p->'images', '[]'::jsonb),
    (p->>'base_price')::numeric,
    coalesce(nullif(p->>'currency', ''), 'USD'),
    coalesce((p->>'status')::public.product_status, 'active')
  )
  returning id into new_id;

  insert into public.product_variants (product_id, sku, attributes, stock)
  values (
    new_id,
    upper(p->>'slug') || '-STD',
    '{"edition":"standard"}'::jsonb,
    coalesce((p->>'stock')::integer, 0)
  );

  return new_id;
end;
$$;

revoke all on function public.admin_create_product(jsonb) from public;
revoke all on function public.admin_create_product(jsonb) from anon;
revoke all on function public.admin_create_product(jsonb) from authenticated;
grant execute on function public.admin_create_product(jsonb) to service_role;
