-- ============================================================================
-- Carbon Cleaner, Supabase schema + Row Level Security
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
  -- Friendly, editable display name (non-unique). Shown on leaderboards and to
  -- teachers. Distinct from `username`, which stays the unique login handle.
  display_name text,
  -- False until the user has chosen/confirmed a display name. Drives the
  -- one-time prompt for OAuth users (who arrive with no username).
  display_name_confirmed boolean default false,
  role text default 'player',
  created_at timestamptz default now()
);

-- Add the columns to databases created before this feature existed.
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists display_name_confirmed boolean default false;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_modify_own" on public.profiles;
create policy "profiles_modify_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Usernames must be unique, case-insensitively.
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- Auto-create a profile row whenever a new auth user signs up. Runs as the
-- definer so it works even before email confirmation (when there is no session
-- yet), which reserves the username at signup time. The username comes from the
-- signUp metadata ({ data: { username } }); the display name defaults to it (or,
-- for OAuth users with no username, to the provider's name). Only password
-- signups (which send a username) are pre-confirmed, OAuth users get prompted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
  uname text := nullif(meta->>'username', '');
begin
  insert into public.profiles (id, username, display_name, display_name_confirmed, role)
  values (
    new.id,
    uname,
    coalesce(
      nullif(meta->>'display_name', ''),
      uname,
      nullif(meta->>'full_name', ''),
      nullif(meta->>'name', '')
    ),
    uname is not null,
    'player'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Is a username free? (callable by anon, before signup)
create or replace function public.username_available(uname text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(uname)
  );
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- Resolve a login identifier (username OR email) to an email address so the
-- app can let people log in with either. Reads auth.users via definer rights;
-- emails are never exposed in bulk.
create or replace function public.email_for_identifier(identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare result text;
begin
  if position('@' in identifier) > 0 then
    return identifier;
  end if;
  select u.email into result
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(identifier)
  limit 1;
  return result;
end;
$$;
grant execute on function public.email_for_identifier(text) to anon, authenticated;

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
  -- Denormalized player display name for cheap leaderboard/roster reads.
  player_name text,
  state jsonb not null,
  carbon_gain double precision,
  carbon_amount double precision,
  support double precision,
  budget double precision,
  year_month text,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add the column to databases created before this feature existed.
alter table public.game_saves add column if not exists player_name text;

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

-- Players can delete their own saves (logged-in own rows, or guest rows with
-- no user_id). Needed for the "delete past game" action in the play menu.
drop policy if exists "game_saves_delete" on public.game_saves;
create policy "game_saves_delete" on public.game_saves
  for delete using (
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
  -- Roles students in this class may pick. NULL = no restriction (any role).
  allowed_roles text[],
  created_at timestamptz default now()
);

-- Add the column to databases created before this feature existed.
alter table public.classrooms add column if not exists allowed_roles text[];

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

-- The class's teacher may remove (kick) members from their own classes.
drop policy if exists "classroom_members_teacher_delete" on public.classroom_members;
create policy "classroom_members_teacher_delete" on public.classroom_members
  for delete using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_members.classroom_id
        and c.teacher_id = auth.uid()
    )
  );

-- Anti-cheat: a game may only join a class that already existed when the game
-- was created. Blocks entering an old, already-progressed game into a new class.
-- (Legacy saves with a null created_at are grandfathered in.)
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
-- global_stats, a view exposing the "reached net-zero" count for the Home page
-- ============================================================================
-- Counts games that actually reached net-zero (a win): finished, with carbon
-- gain at or below zero. (carbon_gain stores effectiveCarbonGain at save time.)
create or replace view public.global_stats as
  select count(*)::int as total_finished
  from public.game_saves
  where finished_at is not null
    and carbon_gain <= 0;

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
-- GRANTS, the Supabase API roles (anon / authenticated) need base table
-- privileges in addition to the RLS policies above. Without these you'll get
-- "permission denied for table ...". RLS still enforces the row-level rules;
-- these grants just let the roles attempt the operations at all.
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.game_saves,
  public.classrooms,
  public.classroom_members,
  public.civic_uploads
to anon, authenticated;

grant select on public.global_stats to anon, authenticated;

-- Keep future tables/sequences working too.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- ============================================================================
-- Realtime (optional): add tables to the realtime publication for live updates.
-- The app polls by default, so this is optional.
-- ============================================================================
-- alter publication supabase_realtime add table public.game_saves;
-- alter publication supabase_realtime add table public.classroom_members;
