import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

const ADMIN_PREFIX = '/admin';
const AUTH_PAGES = ['/login', '/register', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Signed-in users shouldn't see login/register again.
  if (user && AUTH_PAGES.includes(path)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (path.startsWith(ADMIN_PREFIX)) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', path);
      return NextResponse.redirect(loginUrl);
    }

    // Lightweight role check here for a fast redirect on obvious cases.
    // This is a UX shortcut only — app/(admin)/admin/layout.tsx re-checks
    // via requireAdminOrRedirect(), and Postgres RLS is the actual gate
    // no matter what this middleware decides.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    );
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['editor', 'admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, images, and the Next.js
     * internals — those never need a session check.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|images/).*)',
  ],
};
