'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, Images, Users, ScrollText, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/actions/auth';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/gallery', label: 'Photo moderation', icon: Images },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/audit-log', label: 'Audit log', icon: ScrollText },
];

export function AdminNav({ userRole }: { userRole: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col justify-between border-r border-pub-wood-light/30 bg-pub-surface p-4">
      <div>
        <Link href="/admin" className="mb-8 block font-display text-lg font-bold text-pub-gold-light">
          The Regency <span className="block text-xs font-normal text-pub-muted">Admin</span>
        </Link>
        <ul className="space-y-1">
          {LINKS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-pub-gold text-pub-bg'
                      : 'text-pub-cream hover:bg-pub-surface2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="space-y-2">
        <p className="px-3 text-xs uppercase tracking-wide text-pub-muted">Signed in as {userRole}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-pub-cream hover:bg-pub-surface2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
