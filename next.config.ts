/**
 * Next.js Configuration for TehGo PWA
 *
 * This configuration file sets up:
 * - Security headers for PWA compliance
 * - API proxy rewrites
 * - Environment variables
 * - Internationalization support
 *
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js
 */

import type { NextConfig } from 'next';
import { version } from './package.json';

// Backend API URL for proxy rewrites
const backendUrl = process.env.BASE_API || 'http://localhost:8000';

const nextConfig: NextConfig = {
  /**
   * Trailing slash configuration
   * Ensures URLs end with a slash for consistent routing
   */
  trailingSlash: true,

  /**
   * API route rewrites
   * Proxies requests to the backend API server
   */
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*/',
        destination: `${backendUrl}/api/:path*/`,
      },
    ];
  },

  /**
   * Security headers for PWA and general security
   *
   * These headers protect against common web vulnerabilities
   * and ensure proper PWA functionality.
   */
  async headers() {
    return [
      // Global security headers for all routes
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME type sniffing
          // Reduces risk of malicious file uploads
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Protect against clickjacking
          // Prevents site from being embedded in iframes
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Control referrer information sent with requests
          // Balances privacy with functionality
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // DNS prefetch control
          // Helps with performance while maintaining privacy
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Permissions policy (replaces Feature-Policy)
          // Controls access to browser features
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
        ],
      },
      // Service Worker specific headers
      // Ensures the service worker is always fresh
      {
        source: '/sw.js',
        headers: [
          // Correct MIME type for JavaScript
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          // Prevent caching of service worker
          // Users always get the latest version
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          // Service Worker allowed scope
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // Manifest file headers
      {
        source: '/manifest.webmanifest',
        headers: [
          // Cache manifest for 1 hour
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      // Static assets (icons, fonts, images)
      {
        source: '/:path*.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2)',
        headers: [
          // Cache static assets for 1 year (immutable)
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  /**
   * Environment variables exposed to the browser
   */
  env: {
    version,
  },

  /**
   * Experimental features
   */
  experimental: {
    // Enable server actions for push notifications
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },

  /**
   * Image optimization configuration
   */
  images: {
    // Formats for optimized images
    formats: ['image/avif', 'image/webp'],
    // Remote patterns for external images (add as needed)
    remotePatterns: [],
  },
};

export default nextConfig;
