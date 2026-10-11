import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/sign-in', '/sign-up'],
    },
    sitemap: 'https://quiet-phd-tracker.online/sitemap.xml',
  };
}
