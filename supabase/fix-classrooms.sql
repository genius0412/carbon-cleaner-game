-- ============================================================================
-- Fix: "permission denied" when creating a classroom.
-- Run this in the Supabase Dashboard → SQL Editor. It is idempotent (safe to
-- run more than once). It ensures the classrooms table, its row-level-security
-- policies, AND the table-level GRANTs all exist — schema drift in any of these
-- causes a 42501 "permission denied" on insert.
-- ============================================================================

-- 1) Table
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  join_code text unique not null,
  name text,
  teacher_id uuid references auth.users (id) on delete set null,
  allowed_roles text[],
  created_at timestamptz default now()
);

-- Roles students may pick (NULL = no restriction). Added for older databases.
alter table public.classrooms add column if not exists allowed_roles text[];

alter table public.classrooms enable row level security;

-- 2) Row-level security policies
drop policy if exists "classrooms_select_all" on public.classrooms;
create policy "classrooms_select_all" on public.classrooms
  for select using (true);

drop policy if exists "classrooms_teacher_manage" on public.classrooms;
create policy "classrooms_teacher_manage" on public.classrooms
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- 3) Table-level GRANTs (RLS still enforces the row rules above; without these
--    grants the role can't even attempt the operation -> "permission denied").
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.classrooms to anon, authenticated;

-- Also (re)grant the rest of the app's tables, in case they drifted too. This
-- is why logged-in cloud saves may have been silently failing.
grant select, insert, update, delete on
  public.profiles,
  public.game_saves,
  public.classroom_members,
  public.civic_uploads
to anon, authenticated;

-- ============================================================================
-- Anti-cheat: a game can only join a class that existed when the game was made.
-- ============================================================================
-- 4) Track when each game was created.
alter table public.game_saves add column if not exists created_at timestamptz default now();

-- 5) Block joins where the game predates the class (legacy nulls are allowed).
create or replace function public.enforce_class_join_time()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  game_created timestamptz;
  class_created timestamptz;
begin
  select created_at into game_created from public.game_saves where id = new.game_save_id;
  select created_at into class_created from public.classrooms where id = new.classroom_id;
  if game_created is not null and class_created is not null and game_created < class_created then
    raise exception 'This game was created before the class; it cannot join (anti-cheat).'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_class_join_time on public.classroom_members;
create trigger trg_enforce_class_join_time
  before insert on public.classroom_members
  for each row execute function public.enforce_class_join_time();
