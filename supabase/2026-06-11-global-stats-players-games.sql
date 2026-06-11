-- Run once against the live DB to add player and game counts to the Home page
-- counters. Safe to re-run (create or replace). Already folded into schema.sql.
create or replace view public.global_stats
  with (security_invoker = on) as
  select
    (select count(*)::int from public.game_saves
       where state->>'status' = 'won') as total_finished,
    (select count(*)::int from public.profiles) as total_players,
    (select count(*)::int from public.game_saves) as total_games;

grant select on public.global_stats to anon, authenticated;
