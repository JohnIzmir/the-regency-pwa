-- ============================================================================
-- SEED DATA — real example events, transcribed from The Regency's own
-- "What's On" chalkboard (photographed 3 Aug 2026). Dates below are
-- computed relative to CURRENT_DATE so this file stays useful whenever
-- it's actually run, rather than seeding rows that are already in the
-- past. Swap the placeholder admin account for a real one before running
-- in production — this is intended for local dev / staging only.
-- ============================================================================

do $$
declare
  v_admin_id uuid;
  v_live_band uuid;
  v_special uuid;
  v_quiz uuid;
begin
  select id into v_admin_id from profiles where role in ('admin', 'super_admin') limit 1;
  if v_admin_id is null then
    raise notice 'No admin account found — run this after creating and promoting your first user.';
    return;
  end if;

  select id into v_live_band from event_categories where slug = 'live-band';
  select id into v_special   from event_categories where slug = 'special-event';
  select id into v_quiz      from event_categories where slug = 'quiz-night';

  insert into events (title, slug, description, category_id, genre, starts_at, ends_at, is_free_entry, status, created_by)
  values
    (
      'Backburners',
      'backburners-' || to_char(current_date, 'yyyy-mm-dd'),
      'Live band night at The Regency — doors from 4pm.',
      v_live_band, 'Live Band',
      (date_trunc('week', current_date) + interval '6 days' + interval '16 hours'),
      (date_trunc('week', current_date) + interval '6 days' + interval '19 hours'),
      true, 'published', v_admin_id
    ),
    (
      'Sea Shanty! Folk Music Festival',
      'sea-shanty-folk-festival-' || to_char(current_date, 'yyyy-mm-dd'),
      'A weekend of folk music and sea shanties — three days of live entertainment.',
      v_special, 'Folk',
      (date_trunc('week', current_date) + interval '11 days' + interval '18 hours'),
      (date_trunc('week', current_date) + interval '13 days' + interval '23 hours'),
      true, 'published', v_admin_id
    ),
    (
      'Woodchuck',
      'woodchuck-' || to_char(current_date, 'yyyy-mm-dd'),
      'Live band night — doors from 5pm.',
      v_live_band, 'Live Band',
      (date_trunc('week', current_date) + interval '13 days' + interval '17 hours'),
      (date_trunc('week', current_date) + interval '13 days' + interval '20 hours'),
      true, 'published', v_admin_id
    ),
    (
      'Dan''s Quiz',
      'dans-quiz-' || to_char(current_date, 'yyyy-mm-dd'),
      'Weekly quiz night hosted by Dan — teams of up to 6, £1 entry per person.',
      v_quiz, null,
      (date_trunc('week', current_date) + interval '13 days' + interval '20 hours'),
      (date_trunc('week', current_date) + interval '13 days' + interval '22 hours'),
      true, 'published', v_admin_id
    )
  on conflict (slug) do nothing;
end $$;
