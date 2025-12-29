/**
 * Progressive Web App (PWA) Manifest Configuration
 *
 * This file generates the web app manifest used by browsers to enable PWA features:
 * - Home screen installation
 * - Standalone app experience (no browser UI)
 * - Custom icons and splash screens
 * - Theme and background colors
 *
 * The manifest is automatically served at /manifest.webmanifest by Next.js.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */

import type { MetadataRoute } from 'next';

/**
 * Generates the PWA manifest configuration
 *
 * This function returns the manifest object that defines how the app appears
 * when installed on a user's device.
 *
 * @returns MetadataRoute.Manifest - The web app manifest configuration
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Full name displayed in app launcher and splash screens
    name: 'TehGo - Tehran Metro Guide',

    // Short name displayed when space is limited (e.g., home screen icon label)
    short_name: 'TehGo',

    // Description shown in app stores and during installation
    description:
      'راهنمای مسیریابی مترو تهران - Tehran Metro Route Planner. Find the best metro routes, station information, and real-time updates.',

    // URL that opens when the app is launched from home screen
    start_url: '/',

    // Display mode determines how much browser UI is shown
    // 'standalone' - Looks like a native app (no browser chrome)
    // Other options: 'fullscreen', 'minimal-ui', 'browser'
    display: 'standalone',

    // Background color for splash screen and loading states
    background_color: '#09090b',

    // Theme color for the browser's toolbar and task switcher
    theme_color: '#09090b',

    // Preferred orientation for the app
    orientation: 'portrait-primary',

    // Scope of URLs that the PWA can navigate to while staying in standalone mode
    scope: '/',

    // Language of the manifest file
    lang: 'fa',

    // Primary text direction (RTL for Persian/Farsi)
    dir: 'auto',

    // Categories for app store classification
    categories: ['navigation', 'travel', 'utilities'],

    // Icons array with multiple sizes for different contexts
    // Browsers choose the most appropriate size for each use case
    // Note: Place your icon files in /public/icons/ or update paths below
    icons: [
      {
        // Standard PWA icon (required for installation)
        // Using existing web-app-manifest icons
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        // Large icon for high-resolution displays and splash screens
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        // Apple touch icon for iOS
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],

    // Shortcuts provide quick access to key features from the home screen
    // Long press on app icon to see these options
    shortcuts: [
      {
        name: 'Route Planning',
        short_name: 'Routes',
        description: 'Plan your metro route',
        url: '/fa/',
        icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Stations',
        short_name: 'Stations',
        description: 'View all metro stations',
        url: '/fa/stations',
        icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }],
      },
    ],

    // Related applications (native app links)
    // prefer_related_applications: false indicates users should prefer the PWA
    prefer_related_applications: false,
    related_applications: [],
  };
}
