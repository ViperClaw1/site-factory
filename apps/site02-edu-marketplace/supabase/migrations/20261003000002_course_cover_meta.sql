-- Cover image metadata written by scripts/backfill-course-covers.mjs:
-- { blurhash?: string, variants?: ("thumb" | "gallery" | "hero")[], v?: string }
-- Variant files sit next to the cover in the `courses` bucket: python.webp → python_thumb.webp.
alter table courses add column if not exists cover_meta jsonb not null default '{}'::jsonb;
