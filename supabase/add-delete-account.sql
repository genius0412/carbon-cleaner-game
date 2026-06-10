-- Enables the "Delete account" button on the account page. Run once in the
-- Supabase SQL editor.
--
-- Deleting an auth user needs elevated rights, so this runs as the definer and
-- only ever deletes the caller's own account. Cascading foreign keys remove
-- their profile and game saves (run fix-user-delete.sql first if your database
-- predates the cascades); classrooms they taught survive with teacher_id
-- cleared.
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
