import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth/session';
import { buttonVariants } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '/entertainment', label: "What's On" },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

export async function Header() {
  const profile = await getSessionProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-pub-wood-light/30 bg-pub-bg/95 backdrop-blur supports-[backdrop-filter]:bg-pub-bg/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-display text-lg font-bold text-pub-gold-light">
          The Regency
        </Link>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-pub-cream hover:text-pub-gold">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {profile ? (
            <Link href="/profile" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              {profile.full_name.split(' ')[0]}
            </Link>
          ) : (
            <Link href="/login" className={buttonVariants({ size: 'sm' })}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
