import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Regency — Live Entertainment',
    short_name: 'The Regency',
    description: 'Live bands, singers, karaoke, quiz nights and sports screenings at The Regency, Weston-super-Mare.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1c130d',
    theme_color: '#1c130d',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
