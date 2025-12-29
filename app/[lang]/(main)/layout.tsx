/**
 * Main Layout for TehGo PWA
 *
 * This layout wraps all pages in the (main) route group.
 * It includes:
 * - App header with theme/locale toggles
 * - Main content area
 * - Toast notifications (Sonner)
 * - Bottom navigation
 *
 * The (main) route group organizes the primary app pages:
 * - /route - Route finder
 * - /map - Metro map
 * - /stations - Station list
 * - /lines - Line information
 *
 * @module app/[lang]/(main)/layout
 */

import { Suspense } from 'react';
import { AppHeader } from '@/components/app/header';
import { AppNavigation } from '@/components/app/navigation';
import { getDictionary, type Locale } from '../dictionaries';
import { Toaster } from '@/components/ui/sonner';
import { InstallBanner } from '@/components/pwa/install-banner';

/**
 * Layout Props Interface
 */
interface MainLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

/**
 * Main Layout Component
 *
 * Server component that provides the app shell for all main pages.
 * Includes header, navigation, and toast notifications.
 */
export default async function MainLayout({
  children,
  params,
}: MainLayoutProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <>
      {/* Header with logo, theme toggle, and locale switcher */}
      <Suspense fallback={<div className="h-14 border-b bg-card" />}>
        <AppHeader dict={dict} />
      </Suspense>
      {/* Main content area - centered with max width for mobile-first design */}
      <main className="relative grow max-w-[640px] mx-auto">
        {/* PWA install */}
        <InstallBanner dict={dict.pwa} />

        {children}
      </main>

      {/* Toast notifications (Sonner library) */}
      <Toaster />

      {/* Bottom navigation for mobile */}
      <AppNavigation />
    </>
  );
}
