-- Fix for the home-page net-zero counter counting LOST games. The old view
-- counted any finished game with carbon_gain <= 0, but a game can end in a
-- loss (voted out, or the deadline hits mid net-zero-hold) while its gain sits
-- at or below zero. Count actual wins instead. Run once in the SQL editor.
-- (Also sets security_invoker, in case fix-global-stats-security.sql wasn't run.)
create or replace view public.global_stats
  with (security_invoker = on) as
  select count(*)::int as total_finished
  from public.game_saves
  where state->>'status' = 'won';
