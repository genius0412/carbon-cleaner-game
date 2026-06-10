-- Fix for the in-game "delete saved game" button not working: databases set up
-- before the delete feature existed are missing the RLS delete policy, so
-- Postgres silently deletes 0 rows and the save reappears after a refresh.
-- Run once in the Supabase SQL editor.

drop policy if exists "game_saves_delete" on public.game_saves;
create policy "game_saves_delete" on public.game_saves
  for delete using (
    (auth.uid() is not null and auth.uid() = user_id)
    or (user_id is null)
  );

-- Older databases may also be missing the table-level delete grant.
grant delete on public.game_saves to anon, authenticated;
