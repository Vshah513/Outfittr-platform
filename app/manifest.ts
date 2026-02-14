import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://outfittr-platform.vercel.app';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Outfittr - Buy & Sell Unique Fashion',
    short_name: 'Outfittr',
    description: "Kenya's leading marketplace for secondhand fashion, vintage finds, and unique styles",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0f1419',
    theme_color: '#000000',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/collections/Outfittr Logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/collections/Outfittr Logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/collections/Outfittr Logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
