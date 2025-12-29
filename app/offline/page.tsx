/**
 * Offline Fallback Page
 *
 * This page is displayed when the user is offline and the requested
 * resource is not available in the cache. It provides a user-friendly
 * message and encourages the user to reconnect.
 *
 * This page is pre-cached by the service worker during installation.
 */

import type { Metadata } from 'next'
import { RetryButton } from './retry-button'

export const metadata: Metadata = {
  metadataBase: new URL('https://tehgo.ir'),
  title: 'Offline - TehGo',
  description: 'You are currently offline',
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      {/* Offline Icon */}
      <div className="mb-6 text-muted-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto"
        >
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <path d="M12 20h.01" />
          <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
      </div>

      {/* Main Message */}
      <h1 className="mb-4 text-2xl font-bold text-foreground">
        شما آفلاین هستید
      </h1>
      <p className="mb-2 text-lg text-muted-foreground">
        You are currently offline
      </p>

      {/* Description */}
      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        به نظر می‌رسد اتصال اینترنت شما قطع شده است.
        لطفاً اتصال خود را بررسی کرده و دوباره تلاش کنید.
        <br />
        <span className="mt-2 block">
          It looks like you&apos;ve lost your internet connection.
          Please check your connection and try again.
        </span>
      </p>

      {/* Retry Button */}
      <RetryButton />

      {/* Cached Content Notice */}
      <p className="mt-8 text-xs text-muted-foreground">
        برخی از محتوای قبلاً مشاهده شده ممکن است هنوز در دسترس باشد.
        <br />
        Some previously viewed content may still be available.
      </p>
    </div>
  )
}
