import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Server-side Supabase client for use in Server Components, Server
 * Actions, and Route Handlers. Reads/writes the auth cookie via
 * next/headers so the session survives across requests.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component (not a Server Action / Route
            // Handler) — the middleware below already refreshes the
            // session cookie, so this can be safely ignored here.
          }
        },
      },
    }
  );
}

/**
 * Admin/service-role client — bypasses RLS entirely. Only ever import
 * this inside trusted server-only code (Edge Functions, cron jobs,
 * explicitly-audited Server Actions). NEVER import in a Client Component
 * or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createServiceRoleClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createServiceRoleClient() must never be called from the browser.');
  }
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
