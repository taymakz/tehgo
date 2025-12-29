/**
 * Route Finder Page
 *
 * The main page of TehGo - Tehran Metro route planning.
 * Users can:
 * - Select origin and destination stations
 * - Find the best route between stations
 * - View recent route searches
 *
 * This is the default landing page when users visit the app.
 *
 * @module app/[lang]/(main)/route/page
 */

import ContentLayout from '@/components/app/content-layout';
import { getDictionary, type Locale } from '@/dictionaries';
import { RecentRoutes } from './_components/recent-routes';
import { Routing } from './_components/routing';

/**
 * Route Page Props Interface
 */
interface RoutePageProps {
  params: Promise<{ lang: Locale }>;
}

/**
 * Route Finder Page Component
 *
 * Server component that renders the route finder interface.
 * Consists of two main sections:
 * 1. Routing card - Station selection and route search
 * 2. Recent routes - Previously searched routes
 */
export default async function RoutePage({ params }: RoutePageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div>
      {/* Header section with station selection */}
      <div className="pt-8 pb-12 bg-secondary/50 dark:bg-card">
        <Routing dict={dict} />
      </div>

      {/* Content section with recent routes */}
      <ContentLayout>
        <RecentRoutes dict={dict} />
      </ContentLayout>
    </div>
  );
}
