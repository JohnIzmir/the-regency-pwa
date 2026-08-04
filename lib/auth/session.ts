import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database, UserRole } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

/** Returns the current session's user + profile, or null if signed out. */
export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return profile ?? null;
}

/** Throws if not signed in. Use in Server Actions. */
export async function requireUser(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) throw new AuthError('You must be signed in to do that.', 401);
  return profile;
}

const ADMIN_ROLES: UserRole[] = ['editor', 'admin', 'super_admin'];

/**
 * Throws if not an admin/editor. This is a convenience early-exit for
 * Server Actions — the real enforcement is the RLS policy `is_admin()`
 * on every table, which fires regardless of whether this check ran.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (!ADMIN_ROLES.includes(profile.role)) {
    throw new AuthError('Admin access required.', 403);
  }
  return profile;
}

/** Throws unless the caller is a super_admin (role management, etc). */
export async function requireSuperAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== 'super_admin') {
    throw new AuthError('Super admin access required.', 403);
  }
  return profile;
}

/**
 * Server Component guard — redirects instead of throwing, since a page
 * render can't be caught by a form's error state the way a Server
 * Action's throw can.
 */
export async function requireAdminOrRedirect(): Promise<Profile> {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login?next=/admin');
  if (!ADMIN_ROLES.includes(profile.role)) redirect('/');
  return profile;
}
