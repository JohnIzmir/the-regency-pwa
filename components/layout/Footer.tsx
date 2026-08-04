import Link from 'next/link';
import { Facebook, Instagram, Phone, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export async function Footer() {
  const supabase = createClient();
  const { data: venue } = await supabase.from('venue_info').select('*').single();

  return (
    <footer className="mt-16 border-t border-pub-wood-light/30 bg-pub-surface pb-24 pt-12 sm:pb-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-pub-gold-light">The Regency</h3>
          <p className="mt-2 flex items-start gap-2 text-sm text-pub-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            {venue?.address_line1 ?? '22-24 Lower Church Road'}, {venue?.city ?? 'Weston-super-Mare'},{' '}
            {venue?.postcode ?? 'BS23 2AG'}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-pub-muted">
            <Phone className="h-4 w-4 shrink-0" />
            <a href={`tel:${venue?.phone ?? '01934633406'}`} className="hover:text-pub-gold">
              {venue?.phone ?? '01934 633406'}
            </a>
          </p>
        </div>

        <div>
          <h3 className="font-display text-lg font-semibold text-pub-gold-light">Opening hours</h3>
          <dl className="mt-2 space-y-1 text-sm text-pub-muted">
            {Object.entries(venue?.opening_hours ?? {}).map(([day, hours]) => (
              <div key={day} className="flex justify-between gap-4">
                <dt>{DAY_LABELS[day] ?? day}</dt>
                <dd>
                  {(hours as { open: string; close: string }).open} – {(hours as { open: string; close: string }).close}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h3 className="font-display text-lg font-semibold text-pub-gold-light">Follow us</h3>
          <div className="mt-2 flex gap-3">
            {venue?.facebook_url && (
              <a href={venue.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-pub-muted hover:text-pub-gold">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {venue?.instagram_url && (
              <a href={venue.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-pub-muted hover:text-pub-gold">
                <Instagram className="h-5 w-5" />
              </a>
            )}
          </div>
          <nav className="mt-4 flex flex-col gap-1 text-sm" aria-label="Footer">
            <Link href="/entertainment" className="text-pub-muted hover:text-pub-gold">What&apos;s On</Link>
            <Link href="/gallery" className="text-pub-muted hover:text-pub-gold">Gallery</Link>
            <Link href="/contact" className="text-pub-muted hover:text-pub-gold">Contact</Link>
          </nav>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-pub-muted">
        © {new Date().getFullYear()} The Regency, Weston-super-Mare.
      </p>
    </footer>
  );
}
