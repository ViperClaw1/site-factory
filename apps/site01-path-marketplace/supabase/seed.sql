-- Phase 0d seed: 15 test products for the marketplace catalog.
-- Run in the Supabase SQL editor AFTER the init migration. Idempotent by slug/sku.

-- Products ------------------------------------------------------------------

insert into products
  (slug, title, description, category, product_type, collection, character,
   is_collectible, edition_size, series, images, base_price, weight_grams,
   collectible_story, status)
values
  -- 3 physical toys (one limited to 100)
  ('plush-thor-classic', 'Thor Classic Plush', 'Soft plush Thor, 30 cm.', 'toys', 'physical', 'classics', 'thor',
   false, null, null, '["/seed/plush-thor-classic.jpg"]', 29.00, 400, null, 'active'),
  ('wooden-train-set', 'Wooden Train Set', 'Handmade wooden train with 24 track pieces.', 'toys', 'physical', 'classics', null,
   false, null, null, '["/seed/wooden-train-set.jpg"]', 49.00, 1200, null, 'active'),
  ('robot-buddy-limited', 'Robot Buddy (Limited 100)', 'Walking tin robot, numbered edition of 100.', 'toys', 'physical', 'retro', null,
   false, 100, 'retro-robots', '["/seed/robot-buddy-limited.jpg"]', 79.00, 600, null, 'active'),

  -- 2 collectibles (edition of 50, with story chapters)
  ('limited-bear', 'Limited Bear', 'Hand-numbered collectible bear.', 'collectible_toys', 'physical', 'limited', 'bear',
   true, 50, 'bears-2026', '["/seed/limited-bear.jpg"]', 120.00, 500,
   '[{"title":"The Forest","text":"Deep in the northern forest a bear cub woke early.","image":"/seed/bear-1.jpg"},
     {"title":"The Journey","text":"He followed the river toward the city lights.","image":"/seed/bear-2.jpg"},
     {"title":"The Workshop","text":"An old toymaker gave him a second life.","image":"/seed/bear-3.jpg"}]'::jsonb, 'active'),
  ('limited-fox', 'Limited Fox', 'Hand-numbered collectible fox.', 'collectible_toys', 'physical', 'limited', 'fox',
   true, 50, 'foxes-2026', '["/seed/limited-fox.jpg"]', 110.00, 450,
   '[{"title":"The Den","text":"A fox pup learned to listen before he spoke.","image":"/seed/fox-1.jpg"},
     {"title":"The Chase","text":"Every trick he knew was tested in one night.","image":"/seed/fox-2.jpg"},
     {"title":"The Return","text":"He came home carrying a lantern.","image":"/seed/fox-3.jpg"}]'::jsonb, 'active'),

  -- 2 physical books
  ('book-thor-origins', 'Thor: Origins', 'Illustrated hardcover, 96 pages.', 'books', 'physical', 'thor-saga', 'thor',
   false, null, null, '["/seed/book-thor-origins.jpg"]', 24.00, 550, null, 'active'),
  ('book-forest-tales', 'Forest Tales', 'Short stories for kids, softcover.', 'books', 'physical', 'forest', null,
   false, null, null, '["/seed/book-forest-tales.jpg"]', 18.00, 350, null, 'active'),

  -- 2 digital artbooks
  ('artbook-thor-sketches', 'Thor Sketchbook (PDF)', 'Concept art and sketches, 120 pages.', 'artbooks', 'digital', 'thor-saga', 'thor',
   false, null, null, '["/seed/artbook-thor-sketches.jpg"]', 15.00, null, null, 'active'),
  ('artbook-forest-worlds', 'Forest Worlds Artbook (PDF)', 'Environment paintings, 90 pages.', 'artbooks', 'digital', 'forest', null,
   false, null, null, '["/seed/artbook-forest-worlds.jpg"]', 15.00, null, null, 'active'),

  -- 2 digital designs
  ('design-thor-pack', 'Thor Character Design Pack', 'Vector character sheets and turnarounds.', 'designs', 'digital', 'thor-saga', 'thor',
   false, null, null, '["/seed/design-thor-pack.jpg"]', 25.00, null, null, 'active'),
  ('design-icon-set', 'Path Icon Set', '200 brand icons in SVG and PNG.', 'designs', 'digital', null, null,
   false, null, null, '["/seed/design-icon-set.jpg"]', 12.00, null, null, 'active'),

  -- 2 merch
  ('merch-tee-path', 'Path Animation T-Shirt', 'Organic cotton tee.', 'merch', 'physical', 'brand', null,
   false, null, null, '["/seed/merch-tee-path.jpg"]', 25.00, 220, null, 'active'),
  ('merch-mug-thor', 'Thor Mug', 'Ceramic mug, 330 ml.', 'merch', 'physical', 'brand', 'thor',
   false, null, null, '["/seed/merch-mug-thor.jpg"]', 14.00, 380, null, 'active'),

  -- 2 figures
  ('figure-thor-15cm', 'Thor Figure 15 cm', 'Articulated vinyl figure.', 'figures', 'physical', 'thor-saga', 'thor',
   false, null, null, '["/seed/figure-thor-15cm.jpg"]', 35.00, 300, null, 'active'),
  ('figure-bear-15cm', 'Bear Figure 15 cm', 'Articulated vinyl figure.', 'figures', 'physical', 'forest', 'bear',
   false, null, null, '["/seed/figure-bear-15cm.jpg"]', 35.00, 300, null, 'active')
on conflict (slug) do nothing;

-- Variants ------------------------------------------------------------------

-- One default variant per product with stock > 0. Digital goods get a large
-- stock so they never read as sold out; limited editions get stock = edition_size
-- so EditionCounter starts at "0 claimed".
insert into product_variants (product_id, sku, attributes, price, stock)
select
  p.id,
  upper(p.slug) || '-STD',
  '{"edition":"standard"}'::jsonb,
  null,
  case
    when p.product_type = 'digital' then 9999
    when p.edition_size is not null then p.edition_size
    else 25
  end
from products p
where p.slug in (
  'plush-thor-classic', 'wooden-train-set', 'robot-buddy-limited',
  'limited-bear', 'limited-fox',
  'book-thor-origins', 'book-forest-tales',
  'artbook-thor-sketches', 'artbook-forest-worlds',
  'design-thor-pack', 'design-icon-set',
  'merch-tee-path', 'merch-mug-thor',
  'figure-thor-15cm', 'figure-bear-15cm'
)
on conflict (sku) do nothing;
