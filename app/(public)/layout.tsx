import { SkipToContent } from '@/components/layout/SkipToContent';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipToContent />
      <Header />
      <div id="main-content" tabIndex={-1}>{children}</div>
      <Footer />
      <BottomNav />
    </>
  );
}
