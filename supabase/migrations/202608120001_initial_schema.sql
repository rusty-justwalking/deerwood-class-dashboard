create extension if not exists pgcrypto;

create table public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_default boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.schedule_imports (
  id uuid primary key default gen_random_uuid(),
  term_id uuid not null references public.academic_terms(id) on delete cascade,
  source_filename text not null,
  source_sheet text,
  row_count integer not null default 0,
  warning_count integer not null default 0,
  status text not null check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table public.schedule_classes (
  id text primary key,
  term_id uuid not null references public.academic_terms(id) on delete cascade,
  import_id uuid references public.schedule_imports(id) on delete set null,
  session_raw text not null,
  session_group text not null,
  subject text not null,
  catalog text not null,
  course_code text not null,
  title text not null,
  class_number text not null,
  enrollment integer,
  location_raw text,
  start_date date not null,
  end_date date not null,
  room_raw text,
  room_display text not null,
  start_time_raw text not null,
  end_time_raw text not null,
  start_minutes integer not null,
  end_minutes integer not null,
  start_time_display text not null,
  end_time_display text not null,
  meeting_pattern_raw text not null,
  weekdays text[] not null,
  instructor_first text,
  instructor_last text,
  instructor_display text not null,
  source_row integer not null,
  created_at timestamptz not null default now()
);

create table public.import_warnings (
  id bigint generated always as identity primary key,
  import_id uuid not null references public.schedule_imports(id) on delete cascade,
  source_row integer not null,
  code text not null,
  message text not null
);

create index schedule_classes_term_idx on public.schedule_classes(term_id);
create index schedule_classes_start_idx on public.schedule_classes(term_id, start_minutes);
create index schedule_classes_days_idx on public.schedule_classes using gin(weekdays);
create index schedule_classes_session_idx on public.schedule_classes(term_id, session_group);
create index schedule_classes_room_idx on public.schedule_classes(term_id, room_display);

alter table public.academic_terms enable row level security;
alter table public.schedule_imports enable row level security;
alter table public.schedule_classes enable row level security;
alter table public.import_warnings enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.academic_terms, public.schedule_classes to anon, authenticated;

create policy "Published terms are public" on public.academic_terms for select to anon, authenticated using (is_published = true);
create policy "Published schedules are public" on public.schedule_classes for select to anon, authenticated using (
  exists (select 1 from public.academic_terms term where term.id = term_id and term.is_published = true)
);
