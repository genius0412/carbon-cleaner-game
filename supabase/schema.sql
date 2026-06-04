-- ============================================================================
-- Carbon Cleaner — Supabase schema + Row Level Security
-- Run this in the Supabase SQL editor (or via the CLI) on a fresh project.
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ============================================================================
-- profiles
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  role text default 'player',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_modify_own" on public.profiles;
create policy "profiles_modify_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================================
-- game_saves
-- A save belongs to a logged-in user (user_id) OR to a guest (guest_code).
-- The full simulation state is stored as JSON; the denormalized columns make
-- leaderboards & the global counter cheap to query.
-- ============================================================================
create table if not exists public.game_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  guest_code text,
  mode text not null,
  character_type text not null,
  city_name text not null,
  state jsonb not null,
  carbon_gain double precision,
  carbon_amount double precision,
  support double precision,
  budget double precision,
  year_month text,
  finished_at timestamptz,
  updated_at timestamptz default now()
);

create index if not exists game_saves_guest_code_idx on public.game_saves (guest_code);
create index if not exists game_saves_user_id_idx on public.game_saves (user_id);
create index if not exists game_saves_finished_idx on public.game_saves (finished_at);

alter table public.game_saves enable row level security;

-- Anyone can read saves (needed for guest resume, classroom scoreboard,
-- and the global finished counter). Tighten if you prefer.
drop policy if exists "game_saves_select_all" on public.game_saves;
create policy "game_saves_select_all" on public.game_saves
  for select using (true);

-- Logged-in users can write their own rows; guests (anon) can write rows that
-- have no user_id (they are identified only by their opaque guest_code).
drop policy if exists "game_saves_insert" on public.game_saves;
create policy "game_saves_insert" on public.game_saves
  for insert with check (
    (auth.uid() is not null and auth.uid() = user_id)
    or (user_id is null)
  );

drop policy if exists "game_saves_update" on public.game_saves;
create policy "game_saves_update" on public.game_saves
  for update using (
    (auth.uid() is not null and auth.uid() = user_id)
    or (user_id is null)
  );

-- ============================================================================
-- classrooms + classroom_members
-- ============================================================================
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  join_code text unique not null,
  name text,
  teacher_id uuid references auth.users (id) on delete set null,
  created_at timestamptz default now()
);

alter table public.classrooms enable row level security;

drop policy if exists "classrooms_select_all" on public.classrooms;
create policy "classrooms_select_all" on public.classrooms
  for select using (true);

drop policy if exists "classrooms_teacher_manage" on public.classrooms;
create policy "classrooms_teacher_manage" on public.classrooms
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create table if not exists public.classroom_members (
  classroom_id uuid references public.classrooms (id) on delete cascade,
  game_save_id uuid references public.game_saves (id) on delete cascade,
  city_name text,
  joined_at timestamptz default now(),
  primary key (classroom_id, game_save_id)
);

alter table public.classroom_members enable row level security;

drop policy if exists "classroom_members_select_all" on public.classroom_members;
create policy "classroom_members_select_all" on public.classroom_members
  for select using (true);

-- Anyone with a save may join a class (insert their membership).
drop policy if exists "classroom_members_insert" on public.classroom_members;
create policy "classroom_members_insert" on public.classroom_members
  for insert with check (true);

-- ============================================================================
-- civic_uploads
-- ============================================================================
create table if not exists public.civic_uploads (
  id uuid primary key default gen_random_uuid(),
  game_save_id uuid references public.game_saves (id) on delete cascade,
  image_path text,
  passed_check boolean default false,
  created_at timestamptz default now()
);

alter table public.civic_uploads enable row level security;

drop policy if exists "civic_uploads_select_all" on public.civic_uploads;
create policy "civic_uploads_select_all" on public.civic_uploads
  for select using (true);

drop policy if exists "civic_uploads_insert" on public.civic_uploads;
create policy "civic_uploads_insert" on public.civic_uploads
  for insert with check (true);

-- ============================================================================
-- global_stats — a view exposing the "reached net-zero" count for the Home page
-- ============================================================================
create or replace view public.global_stats as
  select count(*)::int as total_finished
  from public.game_saves
  where finished_at is not null;

-- ============================================================================
-- Storage bucket for civic-action proof screenshots
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('civic-proof', 'civic-proof', false)
on conflict (id) do nothing;

-- Allow anyone to upload to and read the civic-proof bucket (loose, for the
-- school project). Tighten for production.
drop policy if exists "civic_proof_insert" on storage.objects;
create policy "civic_proof_insert" on storage.objects
  for insert with check (bucket_id = 'civic-proof');

drop policy if exists "civic_proof_select" on storage.objects;
create policy "civic_proof_select" on storage.objects
  for select using (bucket_id = 'civic-proof');

-- ============================================================================
-- Realtime (optional): add tables to the realtime publication for live updates.
-- The app polls by default, so this is optional.
-- ============================================================================
-- alter publication supabase_realtime add table public.game_saves;
-- alter publication supabase_realtime add table public.classroom_members;
