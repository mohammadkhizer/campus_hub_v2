import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://campushub.edu';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/privacy', '/terms', '/security', '/help', '/login', '/signup'],
      disallow: ['/admin/', '/superadmin/', '/student/', '/teacher/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
