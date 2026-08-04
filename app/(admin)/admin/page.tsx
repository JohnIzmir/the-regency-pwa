import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

export const metadata = { title: 'Admin dashboard | The Regency' };

async function getStats() {
  const supabase = createClient();

  const [
    { count: upcomingCount },
    { count: pendingPhotosCount },
    { count: userCount },
    { count: featuredCount },
  ] = await Promise.all([
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString()),
    supabase.from('photos').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('is_featured', true)
      .eq('status', 'published'),
  ]);

  return {
    upcomingCount: upcomingCount ?? 0,
    pendingPhotosCount: pendingPhotosCount ?? 0,
    userCount: userCount ?? 0,
    featuredCount: featuredCount ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: 'Upcoming published events', value: stats.upcomingCount, href: '/admin/events' },
    { label: 'Photos awaiting moderation', value: stats.pendingPhotosCount, href: '/admin/gallery', urgent: stats.pendingPhotosCount > 0 },
    { label: 'Registered users', value: stats.userCount, href: '/admin/users' },
    { label: 'Featured events live now', value: stats.featuredCount, href: '/admin/events' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-pub-cream">Dashboard</h1>
        <Link href="/admin/events/new" className={buttonVariants()}>
          + Add event
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className={card.urgent ? 'border-pub-gold' : undefined}>
              <CardHeader>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
                <p className="text-sm text-pub-muted">{card.label}</p>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin/events/new" className={buttonVariants({ variant: 'outline' })}>
            Add a one-off event
          </Link>
          <Link href="/admin/events?tab=recurring" className={buttonVariants({ variant: 'outline' })}>
            Set up a recurring weekly night
          </Link>
          <Link href="/admin/gallery" className={buttonVariants({ variant: 'outline' })}>
            Review pending photos
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
