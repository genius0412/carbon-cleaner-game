-- Fix for "Database error deleting user" when removing a user in the
-- Supabase dashboard (Authentication -> Users). Run once in the SQL editor.
--
-- schema.sql uses `create table if not exists`, so databases created from an
-- older schema version keep their original foreign keys to auth.users, which
-- may lack an ON DELETE action. Postgres then blocks the user delete. This
-- recreates the constraints with the intended behavior:
--   - profiles / game_saves rows are removed with the user
--   - classrooms survive with teacher_id cleared
-- (classroom_members and civic_uploads already cascade from game_saves.)

alter table public.profiles
  drop constraint if exists profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;

alter table public.game_saves
  drop constraint if exists game_saves_user_id_fkey;
alter table public.game_saves
  add constraint game_saves_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.classrooms
  drop constraint if exists classrooms_teacher_id_fkey;
alter table public.classrooms
  add constraint classrooms_teacher_id_fkey
  foreign key (teacher_id) references auth.users (id) on delete set null;
