import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://theregencyws.co.uk';
  const supabase = createClient();

  const [{ data: events }, { data: news }] = await Promise.all([
    supabase.from('events').select('slug, updated_at').eq('status', 'published'),
    supabase.from('news_posts').select('slug, updated_at').eq('status', 'published'),
  ]);

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/entertainment`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...(events ?? []).map((e) => ({
      url: `${base}/entertainment/${e.slug}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...(news ?? []).map((n) => ({
      url: `${base}/news/${n.slug}`,
      lastModified: new Date(n.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ];
}
