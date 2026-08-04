import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theregencyws.co.uk'),
  title: { default: 'The Regency | Live Entertainment, Weston-super-Mare', template: '%s | The Regency' },
  description:
    'Live bands, singers, karaoke, quiz nights and sports screenings every week at The Regency, 22-24 Lower Church Road, Weston-super-Mare.',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'The Regency',
    locale: 'en_GB',
  },
};

export const viewport: Viewport = {
  themeColor: '#14100d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-pub-bg font-sans antialiased">
        {children}
        <Toaster theme="dark" richColors position="top-center" />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
