-- Bulk JSON import: atomic product insert that also writes collection, weight,
-- collectible story, and every variant in p->'variants'.
--
-- This is a new function name on purpose. Replacing admin_create_product in place
-- would make code running against an unmigrated database lose the new fields
-- silently. A missing v2 instead sends insertProduct to its direct-insert fallback.

create or replace function public.admin_create_product_v2(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.products (
    slug, title, description, category, product_type,
    collection, character, is_collectible, edition_size, series,
    images, base_price, currency, weight_grams, collectible_story, status
  ) values (
    p->>'slug',
    p->>'title',
    nullif(p->>'description', ''),
    p->>'category',
    (p->>'product_type')::public.product_type,
    nullif(p->>'collection', ''),
    nullif(p->>'character', ''),
    coalesce((p->>'is_collectible')::boolean, false),
    (p->>'edition_size')::integer,
    nullif(p->>'series', ''),
    coalesce(p->'images', '[]'::jsonb),
    (p->>'base_price')::numeric,
    coalesce(nullif(p->>'currency', ''), 'USD'),
    (p->>'weight_grams')::integer,
    nullif(p->'collectible_story', 'null'::jsonb),
    coalesce((p->>'status')::public.product_status, 'active')
  )
  returning id into new_id;

  insert into public.product_variants (product_id, sku, attributes, price, stock)
  select
    new_id,
    v->>'sku',
    nullif(v->'attributes', 'null'::jsonb),
    (v->>'price')::numeric,
    coalesce((v->>'stock')::integer, 0)
  from jsonb_array_elements(p->'variants') as v;

  return new_id;
end;
$$;

revoke all on function public.admin_create_product_v2(jsonb) from public;
revoke all on function public.admin_create_product_v2(jsonb) from anon;
revoke all on function public.admin_create_product_v2(jsonb) from authenticated;
grant execute on function public.admin_create_product_v2(jsonb) to service_role;

drop function if exists public.admin_create_product(jsonb);
