-- Named instructors for the catalog admin dropdown.
-- Ids match INSTRUCTORS in lib/admin/catalog.ts.

create table if not exists instructors (
  id uuid primary key,
  name text not null,
  company text
);

insert into instructors (id, name, company) values
  ('b1000000-0000-4000-8000-000000000001', 'Alex Carter', 'Google'),
  ('b1000000-0000-4000-8000-000000000002', 'Dmitry Sokolov', 'Yandex'),
  ('b1000000-0000-4000-8000-000000000003', 'Priya Nair', 'DeepMind'),
  ('b1000000-0000-4000-8000-000000000004', 'Lena Brandt', 'Figma')
on conflict (id) do update set
  name = excluded.name,
  company = excluded.company;
