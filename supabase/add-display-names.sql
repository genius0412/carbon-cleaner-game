-- ============================================================================
-- Display names + classroom kick
-- Run this in the Supabase Dashboard → SQL Editor. Idempotent (safe to re-run).
--
-- Adds a friendly, editable display name (separate from the unique login
-- username), a denormalized player_name on game_saves for the leaderboard, and
-- a teacher DELETE policy so teachers can remove members from their classes.
-- ============================================================================

-- ---------- profiles: display name + one-time-confirm flag ----------
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists display_name_confirmed boolean default false;

-- Backfill: give existing accounts a display name (their username) and treat
-- them as already confirmed so they aren't prompted.
update public.profiles
  set display_name = coalesce(display_name, username)
  where display_name is null and username is not null;
update public.profiles
  set display_name_confirmed = true
  where display_name_confirmed is distinct from true and username is not null;

-- Recreate the new-user trigger so it also seeds the display name. OAuth users
-- (Google) arrive with no username but a name/full_name in metadata; password
-- signups send a username (and we default their display name to it). Only
-- password signups are pre-confirmed, OAuth users get the one-time prompt.
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
    uname is not null, -- password signups are pre-confirmed; OAuth users aren't
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

-- ---------- game_saves: denormalized player name for the leaderboard ----------
alter table public.game_saves add column if not exists player_name text;

-- ---------- classroom_members: let the class teacher remove members ----------
drop policy if exists "classroom_members_teacher_delete" on public.classroom_members;
create policy "classroom_members_teacher_delete" on public.classroom_members
  for delete using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_members.classroom_id
        and c.teacher_id = auth.uid()
    )
  );
