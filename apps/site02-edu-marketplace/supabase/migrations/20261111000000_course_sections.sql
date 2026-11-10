-- Course sections: education level (pre school → PhD …), independent of the tech `category`.
-- Ids must match SECTIONS in features/landing/data.ts. Existing courses fall into 'additional'.

alter table courses add column if not exists section text not null default 'additional';

alter table courses drop constraint if exists courses_section_check;
alter table courses add constraint courses_section_check check (
  section in ('preschool', 'school', 'exam-prep', 'bachelor-master', 'phd', 'mba-dba', 'special-education', 'additional')
);

create index if not exists courses_section_idx on courses (section);
