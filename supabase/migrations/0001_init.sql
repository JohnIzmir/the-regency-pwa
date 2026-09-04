-- ============================================================================
-- THE REGENCY — ENTERTAINMENT PWA
-- Stage 1: Database schema (PostgreSQL 15, Supabase)
-- Run as sequential migrations in supabase/migrations/ in real project.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

create type user_role as enum ('user', 'editor', 'admin', 'super_admin');
create type event_status as enum ('draft', 'published', 'cancelled', 'archived');
create type moderation_status as enum ('pending', 'approved', 'rejected');
create type report_status as enum ('open', 'reviewed', 'dismissed');
create type comment_status as enum ('visible', 'hidden');
create type notify_frequency as enum ('immediate', 'daily', 'weekly', 'off');
create type notification_type as enum (
  'new_event', 'event_changed', 'event_cancelled', 'featured_event', 'weekly_reminder'
);
create type notification_channel as enum ('push', 'email');
create type notification_status as enum ('queued', 'sent', 'failed');
create type post_status as enum ('draft', 'published');

-- ============================================================================
-- 2. VENUE INFO (single-row config table — Contact page, Find Us, JSON-LD)
-- ============================================================================

create table venue_info (
  id            boolean primary key default true constraint single_row check (id),
  name          text not null default 'The Regency',
  address_line1 text not null default '22-24 Lower Church Road',
  address_line2 text,
  city          text not null default 'Weston-super-Mare',
  postcode      text not null default 'BS23 2AG',
  phone         text not null default '01934633406',
  email         text,
  latitude      numeric(9,6),
  longitude     numeric(9,6),
  -- {"mon":{"open":"11:00","close":"23:30"}, "tue": {...}, ... } — same hours every day currently
  opening_hours jsonb not null default
    '{"mon":{"open":"11:00","close":"23:00"},"tue":{"open":"11:00","close":"23:00"},
      "wed":{"open":"11:00","close":"23:00"},"thu":{"open":"11:00","close":"23:00"},
      "fri":{"open":"11:00","close":"00:00"},"sat":{"open":"11:00","close":"00:00"},
      "sun":{"open":"11:00","close":"23:00"}}'::jsonb,
  facebook_url  text,
  instagram_url text,
  updated_at    timestamptz not null default now()
);

insert into venue_info (id) values (true);

-- ============================================================================
-- 3. PROFILES (extends auth.users — one row per Supabase Auth user)
-- ============================================================================

create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         text not null,
  email             text not null,
  avatar_url        text,
  role              user_role not null default 'user',
  email_verified    boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_profiles_role on profiles(role);

-- Auto-create a profile row whenever someone signs up via Supabase Auth
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.email_confirmed_at is not null
  );
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- 4. ADMIN ACCOUNTS (grants elevated role; separate from profiles for a clear
--    audit trail of who granted admin access and when)
-- ============================================================================

create table admin_accounts (
  id           uuid primary key references profiles(id) on delete cascade,
  role         user_role not null default 'editor' check (role in ('editor','admin','super_admin')),
  granted_by   uuid references profiles(id),
  granted_at   timestamptz not null default now(),
  revoked_at   timestamptz
);

-- Helper functions used throughout RLS policies below
create or replace function is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_accounts
    where id = uid and revoked_at is null
  );
$$;

create or replace function is_super_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_accounts
    where id = uid and role = 'super_admin' and revoked_at is null
  );
$$;

-- ============================================================================
-- 5. EVENT CATEGORIES (fixed list, admin-editable)
-- ============================================================================

create table event_categories (
  id    uuid primary key default uuid_generate_v4(),
  name  text not null unique,
  slug  text not null unique,
  icon  text  -- lucide-react icon name
);

insert into event_categories (name, slug, icon) values
  ('Live Band',        'live-band',        'guitar'),
  ('Singer',           'singer',           'mic-2'),
  ('Karaoke',          'karaoke',          'mic'),
  ('Quiz Night',       'quiz-night',       'help-circle'),
  ('Theme Night',      'theme-night',      'party-popper'),
  ('Special Event',    'special-event',    'star'),
  ('Charity Event',    'charity-event',    'heart-handshake'),
  ('Sports Screening', 'sports-screening', 'tv');

-- ============================================================================
-- 6. EVENT SERIES (the recurrence template) + EVENTS (materialized occurrences)
--    Pattern mirrors Google Calendar: a series generates occurrence rows,
--    any occurrence can be edited/cancelled independently without touching
--    the rest of the series.
-- ============================================================================

create table event_series (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  category_id      uuid not null references event_categories(id),
  -- {"freq":"weekly","interval":1,"byweekday":["thu"],"until":"2026-12-31"}
  recurrence_rule  jsonb not null,
  default_start_time time not null,
  default_end_time    time,
  active           boolean not null default true,
  created_by       uuid not null references profiles(id),
  created_at       timestamptz not null default now()
);

create table events (
  id               uuid primary key default uuid_generate_v4(),
  series_id        uuid references event_series(id) on delete set null,
  title            text not null,
  slug             text not null unique,
  description      text not null default '',
  category_id      uuid not null references event_categories(id),
  genre            text,                              -- free text, e.g. "Classic Rock", "80s"
  image_url        text,
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  ticket_price     numeric(6,2),                       -- null = not ticketed
  is_free_entry    boolean not null default true,
  is_featured      boolean not null default false,
  status           event_status not null default 'draft',
  notify_subscribers boolean not null default true,
  view_count       integer not null default 0,
  created_by       uuid not null references profiles(id),
  updated_by       uuid references profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_price_positive check (ticket_price is null or ticket_price >= 0),
  constraint chk_end_after_start check (ends_at is null or ends_at > starts_at)
);

create index idx_events_starts_at on events(starts_at);
create index idx_events_status on events(status);
create index idx_events_category on events(category_id);
create index idx_events_series on events(series_id);
create index idx_events_featured on events(is_featured) where is_featured = true;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_events_updated_at before update on events
  for each row execute function set_updated_at();

-- Auto-archive: runs nightly via pg_cron -> flips expired published events
create or replace function archive_expired_events()
returns void language sql as $$
  update events
  set status = 'archived'
  where status = 'published'
    and coalesce(ends_at, starts_at + interval '4 hours') < now() - interval '1 day';
$$;

-- ============================================================================
-- 7. NEWS POSTS (Latest News section)
-- ============================================================================

create table news_posts (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  slug          text not null unique,
  body          text not null,
  cover_image_url text,
  status        post_status not null default 'draft',
  published_at  timestamptz,
  created_by    uuid not null references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_news_updated_at before update on news_posts
  for each row execute function set_updated_at();

-- ============================================================================
-- 8. PHOTOS (gallery, moderation queue)
-- ============================================================================

create table photos (
  id              uuid primary key default uuid_generate_v4(),
  uploader_id     uuid not null references profiles(id) on delete cascade,
  event_id        uuid references events(id) on delete set null,
  storage_path    text not null,       -- Supabase Storage object path (original, compressed)
  thumbnail_path  text not null,       -- generated on upload
  caption         text,
  width           integer,
  height          integer,
  file_size_bytes integer,
  status          moderation_status not null default 'pending',
  moderated_by    uuid references profiles(id),
  moderated_at    timestamptz,
  rejection_reason text,
  uploaded_at     timestamptz not null default now()
);

create index idx_photos_status on photos(status);
create index idx_photos_uploader on photos(uploader_id);
create index idx_photos_event on photos(event_id);

create table photo_likes (
  id         uuid primary key default uuid_generate_v4(),
  photo_id   uuid not null references photos(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (photo_id, user_id)
);

create index idx_photo_likes_photo on photo_likes(photo_id);

create table photo_reports (
  id           uuid primary key default uuid_generate_v4(),
  photo_id     uuid not null references photos(id) on delete cascade,
  reporter_id  uuid not null references profiles(id),
  reason       text not null,
  status       report_status not null default 'open',
  reviewed_by  uuid references profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- 9. COMMENTS (on events or photos — exactly one target per comment)
-- ============================================================================

create table comments (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  event_id   uuid references events(id) on delete cascade,
  photo_id   uuid references photos(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  status     comment_status not null default 'visible',
  created_at timestamptz not null default now(),
  constraint chk_one_target check (
    (event_id is not null and photo_id is null) or
    (event_id is null and photo_id is not null)
  )
);

create index idx_comments_event on comments(event_id);
create index idx_comments_photo on comments(photo_id);

-- ============================================================================
-- 10. FAVOURITES (saved events per user)
-- ============================================================================

create table favourites (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  event_id   uuid not null references events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

-- ============================================================================
-- 11. NOTIFICATION PREFERENCES + PUSH SUBSCRIPTIONS + LOG
-- ============================================================================

create table notification_preferences (
  user_id             uuid primary key references profiles(id) on delete cascade,
  push_enabled        boolean not null default false,
  email_enabled       boolean not null default false,
  frequency           notify_frequency not null default 'immediate',
  notify_new_event    boolean not null default true,
  notify_event_changed boolean not null default true,
  notify_cancelled    boolean not null default true,
  notify_featured     boolean not null default true,
  notify_weekly_reminder boolean not null default true,
  updated_at          timestamptz not null default now()
);

create table push_subscriptions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references profiles(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth_key     text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index idx_push_subs_user on push_subscriptions(user_id);

create table notifications_log (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references profiles(id) on delete cascade,  -- null = broadcast/batch job row
  type             notification_type not null,
  channel          notification_channel not null,
  title            text not null,
  body             text not null,
  related_event_id uuid references events(id) on delete set null,
  status           notification_status not null default 'queued',
  created_at       timestamptz not null default now(),
  sent_at          timestamptz
);

create index idx_notifications_user on notifications_log(user_id);
create index idx_notifications_status on notifications_log(status);

-- ============================================================================
-- 12. AUDIT LOGS (every admin mutation, written by trigger — not by app code)
-- ============================================================================

create table audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references profiles(id),
  action      text not null,          -- 'INSERT' | 'UPDATE' | 'DELETE'
  entity_type text not null,          -- 'events' | 'photos' | 'admin_accounts' ...
  entity_id   uuid,
  before      jsonb,
  after       jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);

create index idx_audit_entity on audit_logs(entity_type, entity_id);
create index idx_audit_actor on audit_logs(actor_id);

create or replace function log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs (actor_id, action, entity_type, entity_id, before, after)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_events
  after insert or update or delete on events
  for each row execute function log_audit();

create trigger trg_audit_photos
  after update or delete on photos
  for each row execute function log_audit();

create trigger trg_audit_admin_accounts
  after insert or update or delete on admin_accounts
  for each row execute function log_audit();

create trigger trg_audit_news
  after insert or update or delete on news_posts
  for each row execute function log_audit();

-- ============================================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================================

alter table venue_info               enable row level security;
alter table profiles                 enable row level security;
alter table admin_accounts           enable row level security;
alter table event_categories         enable row level security;
alter table event_series             enable row level security;
alter table events                   enable row level security;
alter table news_posts               enable row level security;
alter table photos                   enable row level security;
alter table photo_likes              enable row level security;
alter table photo_reports            enable row level security;
alter table comments                 enable row level security;
alter table favourites               enable row level security;
alter table notification_preferences enable row level security;
alter table push_subscriptions       enable row level security;
alter table notifications_log        enable row level security;
alter table audit_logs               enable row level security;

-- venue_info: public read, admin write
create policy "venue_info_select_all" on venue_info for select using (true);
create policy "venue_info_update_admin" on venue_info for update using (is_admin(auth.uid()));

-- profiles
create policy "profiles_select_own_or_admin" on profiles for select
  using (auth.uid() = id or is_admin(auth.uid()));
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- admin_accounts: only super_admin can manage; admins can view
create policy "admin_accounts_select" on admin_accounts for select using (is_admin(auth.uid()));
create policy "admin_accounts_write" on admin_accounts for all
  using (is_super_admin(auth.uid())) with check (is_super_admin(auth.uid()));

-- event_categories: public read, admin write
create policy "categories_select_all" on event_categories for select using (true);
create policy "categories_write_admin" on event_categories for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- event_series: admin only
create policy "series_admin_all" on event_series for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- events: public sees published only; admins see/manage everything
create policy "events_select_published" on events for select
  using (status = 'published' or is_admin(auth.uid()));
create policy "events_write_admin" on events for insert
  with check (is_admin(auth.uid()));
create policy "events_update_admin" on events for update
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "events_delete_admin" on events for delete
  using (is_admin(auth.uid()));

-- news_posts: public sees published; admin manages
create policy "news_select_published" on news_posts for select
  using (status = 'published' or is_admin(auth.uid()));
create policy "news_write_admin" on news_posts for all
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- photos: public sees approved; uploader sees own regardless; admin sees/manages all
create policy "photos_select" on photos for select
  using (status = 'approved' or uploader_id = auth.uid() or is_admin(auth.uid()));
create policy "photos_insert_own" on photos for insert
  with check (uploader_id = auth.uid());
-- users cannot update/delete their own photos once uploaded (spec: "cannot delete approved images")
create policy "photos_update_admin" on photos for update
  using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "photos_delete_admin" on photos for delete
  using (is_admin(auth.uid()));

-- photo_likes: any authenticated user manages their own like
create policy "likes_select_all" on photo_likes for select using (true);
create policy "likes_insert_own" on photo_likes for insert with check (user_id = auth.uid());
create policy "likes_delete_own" on photo_likes for delete using (user_id = auth.uid());

-- photo_reports: reporter creates, admin reviews
create policy "reports_insert_own" on photo_reports for insert with check (reporter_id = auth.uid());
create policy "reports_select_admin" on photo_reports for select using (is_admin(auth.uid()));
create policy "reports_update_admin" on photo_reports for update using (is_admin(auth.uid()));

-- comments: visible ones public; author can insert; admin moderates
create policy "comments_select_visible" on comments for select
  using (status = 'visible' or user_id = auth.uid() or is_admin(auth.uid()));
create policy "comments_insert_own" on comments for insert with check (user_id = auth.uid());
create policy "comments_update_admin" on comments for update using (is_admin(auth.uid()));
create policy "comments_delete_own_or_admin" on comments for delete
  using (user_id = auth.uid() or is_admin(auth.uid()));

-- favourites: strictly own
create policy "favourites_all_own" on favourites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notification_preferences: strictly own
create policy "notif_prefs_all_own" on notification_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- push_subscriptions: strictly own (Edge Functions use service_role key, bypasses RLS)
create policy "push_subs_all_own" on push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notifications_log: user reads own; admin reads all; only service role inserts
create policy "notif_log_select" on notifications_log for select
  using (user_id = auth.uid() or is_admin(auth.uid()));

-- audit_logs: admin read-only, no client writes (trigger uses security definer)
create policy "audit_select_admin" on audit_logs for select using (is_admin(auth.uid()));

-- ============================================================================
-- 14. USEFUL VIEWS
-- ============================================================================

create or replace view v_upcoming_events as
select e.*, c.name as category_name, c.slug as category_slug
from events e
join event_categories c on c.id = e.category_id
where e.status = 'published' and e.starts_at >= now()
order by e.starts_at asc;

create or replace view v_gallery_public as
select p.*, pr.full_name as uploader_name,
       (select count(*) from photo_likes l where l.photo_id = p.id) as like_count
from photos p
join profiles pr on pr.id = p.uploader_id
where p.status = 'approved';

-- ============================================================================
-- 15. SCHEDULED JOBS (pg_cron — configured after enabling the extension
--     in Supabase dashboard: Database > Extensions > pg_cron)
-- ============================================================================
-- select cron.schedule('archive-expired-events', '0 3 * * *', $$select archive_expired_events()$$);
-- select cron.schedule('weekly-monday-digest',   '0 8 * * 1', $$select net.http_post(
--   url := 'https://<project-ref>.functions.supabase.co/weekly-digest',
--   headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
-- )$$);
