import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth/session';
import { SkipToContent } from '@/components/layout/SkipToContent';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect('/login');

  return (
    <>
      <SkipToContent />
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 pb-28 sm:pb-12">
        <nav className="mb-8 flex gap-6 border-b border-pub-wood-light/30 pb-4 text-sm" aria-label="Account">
          <Link href="/profile" className="text-pub-cream hover:text-pub-gold">Profile</Link>
          <Link href="/favourites" className="text-pub-cream hover:text-pub-gold">Favourites</Link>
          <Link href="/notifications" className="text-pub-cream hover:text-pub-gold">Notifications</Link>
        </nav>
        {children}
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
