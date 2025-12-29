/**
 * Internationalization (i18n) Proxy Middleware
 *
 * This file handles locale detection and routing using Next.js middleware.
 * It detects user's preferred language from Accept-Language header and redirects
 * to the appropriate locale prefix.
 *
 * Supported locales: English (en), Farsi/Persian (fa)
 * Default locale: Farsi (fa)
 * Default page: /route (Tehran Metro route finder)
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define all supported locales in the application
const SUPPORTED_LOCALES = ['fa', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Default locale used when user preference cannot be determined
const DEFAULT_LOCALE: SupportedLocale = 'fa';

// Default page to redirect to (route finder is the main feature)
const DEFAULT_PAGE = '/route';

/**
 * Detects user's preferred locale from the incoming request
 *
 * Priority:
 * 1. If locale is already in pathname, use it
 * 2. If "en" is in URL params/path, prefer English
 * 3. Check Accept-Language header (browser preference)
 * 4. Fall back to DEFAULT_LOCALE
 *
 * @param request - Next.js NextRequest object containing headers and URL
 * @returns The detected locale code
 */
function getLocale(request: NextRequest): SupportedLocale {
  const pathname = request.nextUrl.pathname;

  // Always force root '/' to default locale
  if (pathname === '/') return DEFAULT_LOCALE;

  // Check if English is explicitly in the pathname
  if (pathname.startsWith('/en')) return 'en';
  if (pathname.startsWith('/fa')) return 'fa';

  // Check the Accept-Language header sent by the browser
  const acceptLanguage = request.headers.get('accept-language') || '';

  // Prioritize language detection: if 'en' appears before 'fa' in Accept-Language, use English
  const enIndex = acceptLanguage.indexOf('en');
  const faIndex = acceptLanguage.indexOf('fa');

  if (enIndex !== -1 && (faIndex === -1 || enIndex < faIndex)) {
    return 'en';
  }

  return DEFAULT_LOCALE;
}

/**
 * Main proxy function that handles locale routing
 *
 * This function:
 * - Preserves internal routes (_next, api, static assets)
 * - Adds locale prefix to requests that don't have one
 * - Redirects users to their preferred locale
 * - Redirects /[lang] to /[lang]/route (default page)
 *
 * @param request - Next.js NextRequest object
 * @returns NextResponse with redirect if needed
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip locale routing for these paths
  const skipPrefixes = [
    '/_next', // Next.js internal routes
    '/api', // API routes
    '/fonts/', // Font files
    '/icons/', // Icon assets
    '/images/', // Image assets
    '/opengraph-image/', // OG image generation
  ];

  // Skip locale routing for files with these extensions
  const skipExtensions = [
    '.json',
    '.xml',
    '.txt',
    '.js',
    '.png',
    '.ico',
    '.svg',
    '.jpg',
    '.jpeg',
    '.webp',
    '.webmanifest',
  ];

  // Check if the request should skip locale prefix
  const shouldSkipByPrefix = skipPrefixes.some((path) =>
    pathname.startsWith(path)
  );
  const shouldSkipByExtension = skipExtensions.some((ext) =>
    pathname.endsWith(ext)
  );

  if (shouldSkipByPrefix || shouldSkipByExtension) return;

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If user visits /fa or /en directly, redirect to /fa/route or /en/route
  if (pathname === '/fa' || pathname === '/en') {
    request.nextUrl.pathname = `${pathname}${DEFAULT_PAGE}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // If pathname already has locale, don't modify it
  if (pathnameHasLocale) return;

  // Detect user's preferred locale and redirect to default page
  const locale = getLocale(request);

  // If visiting root, go directly to /[locale]/route
  if (pathname === '/') {
    request.nextUrl.pathname = `/${locale}${DEFAULT_PAGE}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // Add locale prefix to other paths
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

/**
 * Matcher configuration for the proxy middleware
 *
 * Specifies which routes should be processed by the proxy function.
 * Excludes Next.js internal routes (_next) for performance.
 */
export const config = {
  matcher: [
    // Process all routes except Next.js internal paths
    '/((?!_next).*)',
  ],
};
