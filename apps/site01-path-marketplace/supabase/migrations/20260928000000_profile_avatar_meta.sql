-- Avatar processing metadata, written after upload by app/api/avatar:
-- { blurhash, variants: ["thumb", "hero"], v } — variants are square WebP
-- files stored next to the original (<uid>/<ts>_thumb.webp, _hero.webp).
alter table profiles add column if not exists avatar_meta jsonb;
