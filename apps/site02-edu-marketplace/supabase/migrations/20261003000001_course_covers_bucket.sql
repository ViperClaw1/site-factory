-- Public `courses` bucket for cover images. Files (<slug>.jpg) were uploaded
-- from the original Unsplash photos; this records the matching row changes.

insert into storage.buckets (id, name, public)
values ('courses', 'courses', true)
on conflict (id) do nothing;

update courses
set cover_image = 'https://ovnjeddxqxqqgygljbcf.supabase.co/storage/v1/object/public/courses/' || slug || '.jpg'
where slug in ('python', 'frontend', 'analyst', 'uxui', 'devops', 'mobile', 'ml', 'security');

-- Retire the original animation seed courses (20260921000001_seed_courses.sql).
update courses
set status = 'archived'
where slug in ('osnovy-puti', 'storitelling', 'production-pipeline', 'sound-edit', 'release-short');
