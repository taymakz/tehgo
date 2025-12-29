/**
 * Metro Map Page
 *
 * Displays the Tehran Metro map with download option.
 * Features:
 * - Full-size metro map image
 * - Download button for offline use
 *
 * @module app/[lang]/(main)/map/page
 */

import { getDictionary, type Locale } from '../../dictionaries';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

/**
 * Map Page Props
 */
interface MapPageProps {
  params: Promise<{ lang: Locale }>;
}

/**
 * Map Page Component
 *
 * Server component that displays the metro map.
 */
export default async function MapPage({ params }: MapPageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen p-4 pb-26">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{dict.metro.map}</h1>
          <p className="text-muted-foreground">
            {lang === 'fa' ? 'نقشه مترو تهران' : 'Tehran Metro Map'}
          </p>
        </div>

        {/* Map Card */}
        <div className="bg-card rounded-lg border p-6 shadow-lg">
          <div className="space-y-4">
            {/* Map Image */}
            <div className="flex justify-center">
              <img
                src="/map.jpg"
                alt={lang === 'fa' ? 'نقشه مترو تهران' : 'Tehran Metro Map'}
                className="max-w-full h-auto rounded-lg shadow-md"
                style={{ maxHeight: '70vh' }}
              />
            </div>

            {/* Download Button */}
            <div className="flex justify-center pt-4">
              <a href="/map.jpg">
                <Button size="lg" className="flex items-center gap-2">
                  <Download className="size-5" />
                  {dict.metro.download_map}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
