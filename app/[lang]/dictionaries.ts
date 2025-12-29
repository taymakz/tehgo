/**
 * Route-specific Dictionary Module
 *
 * This file re-exports the main dictionaries module and provides
 * route-specific utilities for accessing translations within the [lang] route.
 *
 * Following Next.js best practices, this module uses 'server-only'
 * to ensure translations are only loaded on the server.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/internationalization
 */

import 'server-only'

// Re-export everything from the main dictionaries module
export * from '@/dictionaries'

// Re-export types for convenience
export type { Dictionary, Locale } from '@/dictionaries'
