import { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/seller/',
          '/delivery-partner/',
          '/account/',
          '/checkout/',
          '/cart',
          '/auth/',
          '/api/',
          '/*.json$',
          '/*?*utm_*',
          '/*?*fbclid*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/seller/',
          '/delivery-partner/',
          '/account/',
          '/checkout/',
          '/cart',
          '/auth/',
          '/api/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/seller/',
          '/delivery-partner/',
          '/account/',
          '/checkout/',
          '/cart',
          '/auth/',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
