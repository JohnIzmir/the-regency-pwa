import type { Metadata } from 'next';
import { Phone, MapPin, Clock, Facebook, Instagram, Navigation } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { GoogleMap } from '@/components/shared/GoogleMap';
import { TrustBadges } from '@/components/shared/TrustBadges';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { orderedHours } from '@/lib/openingHours';

export const metadata: Metadata = {
  title: 'Contact & Opening Hours | The Regency',
  description: 'Find The Regency at 22-24 Lower Church Road, Weston-super-Mare. Opening hours, phone number, and directions.',
};

export const revalidate = 3600;

export default async function ContactPage() {
  const supabase = createClient();
  const { data: venue } = await supabase.from('venue_info').select('*').single();

  const fullAddress = `${venue?.address_line1 ?? '22-24 Lower Church Road'}, ${venue?.city ?? 'Weston-super-Mare'}, ${venue?.postcode ?? 'BS23 2AG'}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm uppercase tracking-[0.3em] text-pub-gold">Find Us</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-pub-cream">Get in touch</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-pub-gold" />
              <div>
                <p className="font-medium text-pub-cream">{venue?.name ?? 'The Regency'}</p>
                <p className="text-sm text-pub-muted">{fullAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 shrink-0 text-pub-gold" />
              <a href={`tel:${venue?.phone ?? '01934633406'}`} className="text-sm text-pub-cream hover:text-pub-gold">
                {venue?.phone ?? '01934 633406'}
              </a>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-pub-gold" />
              <dl className="space-y-0.5 text-sm text-pub-muted">
                {orderedHours(venue?.opening_hours).map(({ day, label, hours }) => (
                  <div key={day} className="flex justify-between gap-6">
                    <dt>{label}</dt>
                    <dd>
                      {hours.open} – {hours.close}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex gap-3 pt-2">
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <Navigation className="h-4 w-4" /> Directions
              </a>
              {venue?.facebook_url && (
                <a href={venue.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {venue?.instagram_url && (
                <a href={venue.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                  <Instagram className="h-4 w-4" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        <GoogleMap query={fullAddress} className="h-full min-h-[280px] w-full rounded-lg border border-pub-wood-light/30" />
      </div>

      <TrustBadges />
    </main>
  );
}
