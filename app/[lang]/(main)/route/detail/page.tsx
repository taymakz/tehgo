/**
 * Route Detail Page
 *
 * Displays detailed route information between two stations.
 * Server component that wraps the client-side route detail UI.
 *
 * @module app/[lang]/(main)/route/detail/page
 */

import { Suspense } from 'react';
import { RouteDetailClient } from './client';

// Force dynamic rendering for search params
export const dynamic = 'force-dynamic';

/**
 * Route Detail Page Props
 */
interface RouteDetailPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    index?: string;
  }>;
}

/**
 * Route Detail Page Component
 *
 * Wraps the client component with Suspense for loading state.
 */
export default function RouteDetailPage({
  searchParams,
}: RouteDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <RouteDetailClient searchParams={searchParams} />
    </Suspense>
  );
}
