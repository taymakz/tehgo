/**
 * Root Layout for Internationalized Routes
 *
 * This layout wraps all pages under the [lang] route segment.
 * It handles:
 * - Dynamic locale parameter from URL
 * - RTL/LTR direction based on locale
 * - Font configuration for multi-language support
 * - Provider setup (theme, query client, direction)
 * - PWA metadata and viewport configuration
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/layouts
 */

import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import '../../styles/globals.css'
import { fontVariables } from '@/lib/fonts'
import Providers from '@/providers'
import { hasLocale, getDictionary, type Locale, SUPPORTED_LOCALES } from '@/dictionaries'

/**
 * Generate static params for all supported locales
 *
 * This enables static generation of pages for each locale,
 * improving performance and SEO.
 */
export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }))
}

/**
 * Generate dynamic metadata based on locale
 *
 * Provides localized SEO metadata including title, description,
 * Open Graph tags, and PWA-related meta tags.
 */
export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params

  // Validate locale
  if (!hasLocale(lang)) {
    return {}
  }
  const siteName = 'TehGo'
  const appUrl = 'https://tehgo.ir'
  const title = lang === 'fa'
    ? 'تهگو - راهنمای مترو تهران'
    : 'TehGo - Tehran Metro Guide'
  const description = lang === 'fa'
    ? 'بهترین مسیریاب مترو تهران. مسیریابی آسان، اطلاعات ایستگاه‌ها و خطوط مترو.'
    : 'The best Tehran Metro route planner. Easy routing, station info, and metro lines.'
  const keywords = lang === 'fa'
    ? ['تهران', 'مترو', 'مسیریاب', 'حمل و نقل', 'ایران', 'تهگو']
    : ['Tehran', 'Metro', 'Route Planner', 'Transportation', 'Iran', 'TehGo']

  return {
    // Basic metadata
    metadataBase: new URL(appUrl),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords,
    authors: [{ name: 'TehGo Contributors' }],
    generator: 'Next.js',

    // Application name for PWA
    applicationName: siteName,

    // PWA manifest link
    manifest: '/manifest.webmanifest',

    // Apple touch icon for iOS
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteName,
    },

    // Format detection (disable auto-linking)
    formatDetection: {
      telephone: false,
    },

    // Open Graph metadata for social sharing
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      locale: lang === 'fa' ? 'fa_IR' : 'en_US',
      alternateLocale: lang === 'fa' ? 'en_US' : 'fa_IR',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'TehGo - Tehran Metro Guide | راهنمای مترو تهران',
        },
      ],
    },

    // Twitter card metadata
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@tehgo',
      creator: '@taymakz',
      images: ['/opengraph-image'],
    },

    // Robots configuration
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Alternate language links for SEO
    alternates: {
      canonical: `/${lang}`,
      languages: {
        fa: '/fa',
        en: '/en',
        'x-default': '/fa',
      },
    },

    // Icons configuration
    icons: {
      icon: [
        { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
  }
}

/**
 * Viewport configuration for PWA
 *
 * Sets up viewport meta tags for optimal mobile experience
 * and PWA color theming.
 */
export const viewport: Viewport = {
  // Responsive viewport
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,

  // PWA theme colors (supports light/dark mode)
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],

  // Color scheme support
  colorScheme: 'dark light',
}

/**
 * Props interface for the Root Layout
 */
interface RootLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

/**
 * Root Layout Component
 *
 * Renders the HTML document with proper language, direction,
 * and provider configuration based on the current locale.
 */
export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { lang } = await params

  // Validate locale and return 404 for invalid locales
  if (!hasLocale(lang)) {
    notFound()
  }

  // Determine text direction based on locale
  const isRTL = lang === 'fa'
  const dir = isRTL ? 'rtl' : 'ltr'

  // Get HTML lang attribute (with region for better SEO)
  const htmlLang = lang === 'fa' ? 'fa-IR' : 'en'

  return (
    <html
      lang={htmlLang}
      dir={dir}
      suppressHydrationWarning
      className={isRTL ? 'rtl' : 'ltr'}
    >
      <head>
        {/* PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#09090b" />
        {/* Permissions policy for geolocation */}
        <meta httpEquiv="Permissions-Policy" content="geolocation=*" />
      </head>
      <body className={`${fontVariables} antialiased`}>
        <Providers lang={lang}>
          {children}
        </Providers>

        {/*
          Service Worker registration script
          Registers the service worker for PWA functionality
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful');
                    })
                    .catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
