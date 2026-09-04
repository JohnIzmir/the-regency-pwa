# Deployment Guide — The Regency PWA

## 1. Supabase project

1. Create a free project at supabase.com (region: London/EU for UK latency).
2. In the SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init.sql` (schema, RLS, triggers)
   - `supabase/migrations/0002_storage_policies.sql` (buckets + storage RLS)
   - `supabase/migrations/0003_view_count_rpc.sql`
   Or via CLI: `supabase link --project-ref <ref>` then `supabase db push`.
3. Enable `pg_cron` and `pg_net`: Database → Extensions → enable both.
4. Schedule the two cron jobs (SQL editor), replacing `<project-ref>`, `<anon-key>` and `<FUNCTION_SECRET>`.
   Note the `apikey`/`Authorization` headers below are required — Supabase's own gateway rejects any
   Edge Function call that's missing them (401 "Missing authorization header") before the function's
   own `x-webhook-secret` check ever runs. The anon key is safe to use here; it's already public.
   ```sql
   select cron.schedule('archive-expired-events', '0 3 * * *', $$select archive_expired_events()$$);
   select cron.schedule('weekly-monday-digest', '0 8 * * 1', $$
     select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/weekly-digest',
       headers := jsonb_build_object(
         'x-webhook-secret', '<FUNCTION_SECRET>',
         'apikey', '<anon-key>',
         'Authorization', 'Bearer <anon-key>'
       )
     )$$);
   select cron.schedule('daily-digest', '0 8 * * *', $$
     select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/daily-digest',
       headers := jsonb_build_object(
         'x-webhook-secret', '<FUNCTION_SECRET>',
         'apikey', '<anon-key>',
         'Authorization', 'Bearer <anon-key>'
       )
     )$$);
   ```
5. Note down: Project URL, `anon` public key, `service_role` key (Settings → API).

## 2. Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref <project-ref>
supabase secrets set FUNCTION_SECRET=<generate-a-random-string>
supabase secrets set VAPID_PRIVATE_KEY=<from step 3>
supabase secrets set NEXT_PUBLIC_VAPID_PUBLIC_KEY=<from step 3>
supabase secrets set VAPID_SUBJECT=mailto:admin@theregencyws.co.uk
supabase secrets set RESEND_API_KEY=<from step 4>
supabase secrets set SITE_URL=https://theregencyws.co.uk
supabase functions deploy send-push
supabase functions deploy weekly-digest
supabase functions deploy daily-digest
```

## 3. VAPID keys (Web Push)

```bash
npx web-push generate-vapid-keys
```
Copy the public key into `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (both Vercel and Supabase secrets) and the
private key into `VAPID_PRIVATE_KEY` (Supabase secrets only — never expose it to the client).

## 4. Email (Resend)

1. Create a free Resend account, verify the sending domain (`theregencyws.co.uk`) via DNS records.
2. Generate an API key, set it as `RESEND_API_KEY` in Supabase Edge Function secrets.

## 5. Vercel (frontend + API routes)

1. Push this repository to GitHub.
2. Import it in Vercel, framework preset auto-detects Next.js.
3. Set environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark sensitive)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY` (mark sensitive — only used if you later add a server-triggered push path in Next.js itself; currently push is sent from the Edge Function, so this is optional here)
   - `NEXT_PUBLIC_SITE_URL` (your real domain)
4. Deploy. Add the custom domain under Project Settings → Domains, point your registrar's DNS
   (CNAME/A record per Vercel's instructions).

## 6. First admin account

There's no bootstrap script — register a normal account through `/register`, verify the email,
then promote it directly in Supabase's SQL editor:

```sql
update profiles set role = 'super_admin' where email = 'you@theregencyws.co.uk';
insert into admin_accounts (id, role, granted_at)
select id, 'super_admin', now() from profiles where email = 'you@theregencyws.co.um';
```

Every admin promoted after that can be managed from `/admin/users` — no more manual SQL needed.

## 7. Replace placeholder assets

- `public/icons/*.png` are auto-generated placeholders (a gold "R" monogram) so the PWA manifest
  is valid out of the box. Swap in real branded icons before launch — 192×192, 512×512, and a
  512×512 "maskable" variant (safe-zone padding for Android adaptive icons).
- Event images and gallery photos come from Supabase Storage once the admin panel is in use.

## 8. Performance notes

- Entertainment, gallery, home, and contact pages use Next.js ISR (`revalidate` set per page,
  60s–3600s) — first visitor after the window triggers a background regeneration, everyone else
  gets a cached response. Admin pages are fully dynamic (`force-dynamic` behaviour via cookies),
  which is correct since they must always reflect the latest data for the person managing it.
- Images go through `next/image` (automatic AVIF/WebP, responsive `sizes`, lazy loading below the
  fold) — no manual optimisation needed as new photos/event images are uploaded.
- Gallery photo uploads are compressed and resized client-side (via `<canvas>`) before upload, so
  large phone-camera photos never hit the server or Supabase Storage at full size.

## 9. Testing

```bash
npm run test        # Vitest unit tests (validation schemas, utils)
npm run test:e2e     # Playwright — builds, starts the app, runs browser tests
```

## 10. Local development

```bash
cp .env.example .env.local   # fill in Supabase keys
npm install
npm run dev
```


## 11. Real photos included

`public/images/` now has real photos of The Regency (bar, hand pumps, the "Free Beer Tomorrow"
sign, games area, pool table, skittle alley) used for the homepage hero and the "Inside The
Regency" strip — resized and compressed from the originals, EXIF-orientation-corrected. Add more
over time via the admin panel's event-image upload rather than committing new files here; these
are just the initial site-chrome assets.

`supabase/seed.sql` has four example events transcribed from the pub's own chalkboard (Backburners,
Sea Shanty Folk Music Festival, Woodchuck, Dan's Quiz), with dates computed relative to whenever
the script runs so they're never seeded in the past. Run it after creating your first admin
account: `psql <connection-string> -f supabase/seed.sql`, or paste it into the Supabase SQL editor.
