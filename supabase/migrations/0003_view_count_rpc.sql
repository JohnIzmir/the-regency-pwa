-- ============================================================================
-- View-count increment as a SECURITY DEFINER function. Anonymous/public
-- visitors have no UPDATE grant on `events` (events_update_admin is
-- admin-only), so a public event-detail page can't just run
-- `update events set view_count = view_count + 1` directly. This function
-- is the single, narrow exception: it can only ever increment exactly
-- one counter on exactly one row, nothing else.
-- ============================================================================

create or replace function increment_event_view_count(target_event_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update events set view_count = view_count + 1
  where id = target_event_id and status = 'published';
$$;

grant execute on function increment_event_view_count(uuid) to anon, authenticated;
