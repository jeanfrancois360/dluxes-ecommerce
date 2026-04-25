import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const privateRoutes = [
    '/admin/',
    '/seller/',
    '/delivery-partner/',
    '/delivery-company/',
    '/account/',
    '/checkout/',
    '/cart',
    '/auth/',
    '/api/',
    '/dashboard/',
    '/search',
    '/hot-deals/my-deals',
    '/hot-deals/new',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...privateRoutes, '/*.json$', '/*?*utm_*', '/*?*fbclid*', '/*?*ref=*'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: privateRoutes,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: privateRoutes,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
