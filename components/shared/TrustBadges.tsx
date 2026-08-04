import Image from 'next/image';
import { ShieldCheck, Trophy, Beer } from 'lucide-react';

/**
 * "Why drink here" trust strip — CAMRA accreditation and the Timothy
 * Taylor's Champion Club badge are stable claims (photographed on-site,
 * not something that changes week to week) so they're stated as text.
 * The Food Hygiene Rating is NOT hard-coded as a number here: the two
 * exterior photos this was built from showed two different scores (a 5
 * and a 4) on different window panes, so rather than risk publishing a
 * stale or wrong official FSA rating, this links straight to the live
 * FSA lookup and shows the photographed sticker as-is as supporting
 * evidence. Update the FSA link's establishment ID once you've found
 * The Regency's listing at ratings.food.gov.uk, and swap in a specific
 * number here directly if you'd rather state it outright.
 */
export function TrustBadges() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h2 className="mb-6 font-display text-2xl font-bold text-pub-cream">Recognised for quality</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="flex gap-4 rounded-lg border border-pub-wood-light/30 bg-pub-surface p-5">
          <Beer className="h-8 w-8 shrink-0 text-pub-gold" />
          <div>
            <p className="font-medium text-pub-cream">CAMRA Accredited</p>
            <p className="text-sm text-pub-muted">
              Recognised by the Campaign for Real Ale for consistently well-kept real ales.
            </p>
          </div>
        </div>

        <div className="flex gap-4 rounded-lg border border-pub-wood-light/30 bg-pub-surface p-5">
          <Trophy className="h-8 w-8 shrink-0 text-pub-gold" />
          <div>
            <p className="font-medium text-pub-cream">Timothy Taylor&apos;s Champion Club</p>
            <p className="text-sm text-pub-muted">
              An established Championship Beers venue, home to Landlord on cask.
            </p>
          </div>
        </div>

        <div className="flex gap-4 rounded-lg border border-pub-wood-light/30 bg-pub-surface p-5">
          <ShieldCheck className="h-8 w-8 shrink-0 text-pub-gold" />
          <div>
            <p className="font-medium text-pub-cream">Food Hygiene Rated</p>
            <p className="text-sm text-pub-muted">
              See our current rating on the{' '}
              <a
                href="https://ratings.food.gov.uk/search/UK/weston-super-mare"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pub-gold hover:underline"
              >
                Food Standards Agency site
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-pub-wood-light/30">
        <Image
          src="/images/accreditation-window.jpg"
          alt="Accreditation stickers in The Regency's front window: Food Hygiene Rating, CAMRA, Timothy Taylor's Champion Club, and Good Beer Guide entries"
          width={1200}
          height={2133}
          className="h-auto w-full object-cover"
          sizes="(max-width: 768px) 100vw, 600px"
        />
      </div>
    </section>
  );
}
