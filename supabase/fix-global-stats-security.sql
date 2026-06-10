-- Fix for the Supabase linter warning "Security Definer View" on
-- public.global_stats. Run this once in the Supabase SQL editor.
--
-- Views default to running with the owner's permissions (definer semantics),
-- which bypasses RLS. security_invoker makes the view run as the caller.
-- game_saves is world-readable via RLS, so the counter result is unchanged.
alter view public.global_stats set (security_invoker = on);
