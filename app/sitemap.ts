import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tehgo.com' // Replace with your actual domain

  const locales = ['en', 'fa']
  const pages = ['', 'route', 'map']

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        url: `${baseUrl}/${locale}${page ? `/${page}` : ''}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1 : 0.8,
      })
    }
  }

  return entries
}
