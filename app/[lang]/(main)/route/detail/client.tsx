/**
 * Route Detail Client Component
 *
 * Client-side component for displaying detailed route information.
 * Features:
 * - Route visualization with step-by-step navigation
 * - Route type selection (fastest vs lowest transfers)
 * - Export route as image
 * - Share route via Web Share API
 * - Recalculate from missed stop
 *
 * @module app/[lang]/(main)/route/detail/client
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MapPin, Share2, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet';
import { StationSelector } from '../_components/station-selector';
import type { RouteResult, Graph, StationsMap, LinesMap } from '@/types/metro';
import stationsData from '@/data/stations.json';
import linesData from '@/data/lines.json';
import { findRoutes } from '@/lib/route-finder';
import { exportRouteImage } from '@/lib/route-export';
import { getDictionarySync } from '@/dictionaries/client';
import { getFirstStepGuide, getTransferGuide } from '@/lib/route-guides';
import { useRecentRoutesStore } from '@/lib/stores/recent-routes';
import en from '@/dictionaries/en.json';

// Type assertions for JSON data
const stations = stationsData as StationsMap;
const lines = linesData as LinesMap;

/**
 * Route option type for selection
 */
type RouteOption = {
  type: 'fastest' | 'lowest_transfers' | 'best';
  title: string;
  subtitle: string;
  route: RouteResult;
  index: number;
};

/**
 * Route Detail Client Props
 */
interface RouteDetailClientProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    index?: string;
  }>;
}

/**
 * Route Detail Client Component
 *
 * Main component for displaying route details with all interactive features.
 */
export function RouteDetailClient({ searchParams }: RouteDetailClientProps) {
  // Unwrap search params
  const params = use(searchParams);
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] as 'en' | 'fa';

  // State management
  const [allRoutes, setAllRoutes] = useState<RouteResult[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showRouteSelection, setShowRouteSelection] = useState(false);
  const [dict, setDict] = useState<typeof en | null>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [showDetailedSteps, setShowDetailedSteps] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTheme, setExportTheme] = useState<'light' | 'dark'>('light');
  const [exportDetailLevel, setExportDetailLevel] = useState<
    'summary' | 'detailed'
  >('detailed');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [missedStopOpen, setMissedStopOpen] = useState(false);

  // Store action
  const addRoute = useRecentRoutesStore((state) => state.addRoute);

  // Load dictionary
  useEffect(() => {
    const dictionary = getDictionarySync(lang);
    setDict(dictionary);
  }, [lang]);

  // Load graph data
  useEffect(() => {
    import('@/data/graph.json').then((data) => setGraph(data.default as Graph));
  }, []);

  // Calculate routes when params change
  useEffect(() => {
    if (!graph) return;

    const from = params.from;
    const to = params.to;
    const index = parseInt(params.index || '0');

    if (from && to) {
      const routes = findRoutes(graph, stations, from, to);
      setAllRoutes(routes);

      if (routes.length > 0) {
        // Find fastest and lowest transfers routes
        const fastestRoute = routes.reduce(
          (fastest, current, currentIndex) =>
            current.totalStations < fastest.route.totalStations
              ? { route: current, index: currentIndex }
              : fastest,
          { route: routes[0], index: 0 }
        );

        const lowestTransfersRoute = routes.reduce(
          (lowest, current, currentIndex) =>
            current.totalTransfers < lowest.route.totalTransfers
              ? { route: current, index: currentIndex }
              : lowest,
          { route: routes[0], index: 0 }
        );

        // Show route selection if different options available
        if (
          fastestRoute.index !== lowestTransfersRoute.index &&
          !params.index
        ) {
          setShowRouteSelection(true);
          setSelectedRouteIndex(fastestRoute.index);
        } else {
          const initialIndex = index < routes.length ? index : 0;
          setSelectedRouteIndex(initialIndex);
          setShowRouteSelection(false);
        }
      }
    }
  }, [params, graph]);

  // Current selected route
  const route = allRoutes[selectedRouteIndex] || null;

  /**
   * Gets display name for a station based on current language
   */
  const getStationDisplay = (id: string) => {
    const station = stations[id];
    return station
      ? lang === 'fa'
        ? station.translations.fa
        : station.name
      : id;
  };

  /**
   * Get route options for selection
   */
  const getRouteOptions = (): RouteOption[] => {
    if (allRoutes.length === 0) return [];

    const fastestRoute = allRoutes.reduce(
      (fastest, current, currentIndex) =>
        current.totalStations < fastest.route.totalStations
          ? { route: current, index: currentIndex }
          : fastest,
      { route: allRoutes[0], index: 0 }
    );

    const lowestTransfersRoute = allRoutes.reduce(
      (lowest, current, currentIndex) =>
        current.totalTransfers < lowest.route.totalTransfers
          ? { route: current, index: currentIndex }
          : lowest,
      { route: allRoutes[0], index: 0 }
    );

    const options: RouteOption[] = [];

    options.push({
      type: 'fastest',
      title: lang === 'fa' ? 'سریع‌ترین مسیر' : 'Fastest Route',
      subtitle:
        lang === 'fa'
          ? `${fastestRoute.route.totalStations} ایستگاه، ${fastestRoute.route.totalTransfers} تعویض`
          : `${fastestRoute.route.totalStations} stations, ${fastestRoute.route.totalTransfers} transfers`,
      route: fastestRoute.route,
      index: fastestRoute.index,
    });

    if (lowestTransfersRoute.index !== fastestRoute.index) {
      options.push({
        type: 'lowest_transfers',
        title: lang === 'fa' ? 'کمترین تعویض' : 'Lowest Transfers',
        subtitle:
          lang === 'fa'
            ? `${lowestTransfersRoute.route.totalStations} ایستگاه، ${lowestTransfersRoute.route.totalTransfers} تعویض`
            : `${lowestTransfersRoute.route.totalStations} stations, ${lowestTransfersRoute.route.totalTransfers} transfers`,
        route: lowestTransfersRoute.route,
        index: lowestTransfersRoute.index,
      });
    }

    return options;
  };

  const routeOptions = getRouteOptions();

  /**
   * Select a route option
   */
  const selectRoute = (index: number) => {
    setSelectedRouteIndex(index);
    setShowRouteSelection(false);

    // Add to recent routes
    addRoute(params.from!, params.to!, allRoutes[index]);

    // Update URL
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('index', index.toString());
    router.replace(`${pathname}?${currentParams.toString()}`, {
      scroll: false,
    });
  };

  /**
   * Export route as image
   */
  const handleExportImage = async () => {
    setIsGeneratingImage(true);
    try {
      await exportRouteImage({
        route,
        fromStation: params.from!,
        toStation: params.to!,
        theme: exportTheme,
        detailLevel: exportDetailLevel,
        lang,
        getStationDisplay,
        lines,
      });
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGeneratingImage(false);
      setExportOpen(false);
    }
  };

  /**
   * Share route
   */
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: dict?.page_route.route_details,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // Loading state
  if (!route || !dict || !graph) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Route Selection Bottom Sheet */}
      <BottomSheet
        open={showRouteSelection}
        onOpenChange={setShowRouteSelection}
      >
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>
              {lang === 'fa' ? 'نوع مسیر را انتخاب کنید' : 'Choose Route Type'}
            </BottomSheetTitle>
          </BottomSheetHeader>
          <div className="grid grid-cols-1 gap-4">
            {routeOptions.map((option) => (
              <Card
                key={`${option.type}-${option.index}`}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedRouteIndex === option.index
                  ? 'ring-2 ring-primary bg-primary/5'
                  : 'hover:bg-muted/50'
                  }`}
                onClick={() => selectRoute(option.index)}
              >
                <div className="text-center">
                  <h3 className="font-semibold text-foreground mb-1">
                    {option.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {option.subtitle}
                  </p>
                  <div className="flex justify-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="size-4 text-blue-600" />
                      <span>
                        {option.route.totalStations}{' '}
                        {lang === 'fa' ? 'ایستگاه' : 'stations'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </BottomSheetContent>
      </BottomSheet>

      {/* Export Settings Bottom Sheet */}
      <BottomSheet open={exportOpen} onOpenChange={setExportOpen}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>
              {lang === 'fa' ? 'تنظیمات خروجی' : 'Export Settings'}
            </BottomSheetTitle>
          </BottomSheetHeader>
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <h3 className="font-medium mb-3 text-sm">
                {lang === 'fa' ? 'تم' : 'Theme'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setExportTheme('light')}
                  className={`relative rounded-lg border-2 p-4 transition-all hover:border-primary ${exportTheme === 'light'
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                    }`}
                >
                  <p className="text-center text-sm font-medium">
                    {lang === 'fa' ? 'روشن' : 'Light'}
                  </p>
                </button>
                <button
                  onClick={() => setExportTheme('dark')}
                  className={`relative rounded-lg border-2 p-4 transition-all hover:border-primary ${exportTheme === 'dark'
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                    }`}
                >
                  <p className="text-center text-sm font-medium">
                    {lang === 'fa' ? 'تیره' : 'Dark'}
                  </p>
                </button>
              </div>
            </div>

            {/* Detail Level */}
            <div>
              <h3 className="font-medium mb-3 text-sm">
                {lang === 'fa' ? 'سطح جزئیات' : 'Detail Level'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setExportDetailLevel('summary')}
                  className={`relative rounded-lg border-2 p-4 transition-all hover:border-primary ${exportDetailLevel === 'summary'
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                    }`}
                >
                  <p className="text-center text-sm font-medium">
                    {lang === 'fa' ? 'خلاصه' : 'Summary'}
                  </p>
                </button>
                <button
                  onClick={() => setExportDetailLevel('detailed')}
                  className={`relative rounded-lg border-2 p-4 transition-all hover:border-primary ${exportDetailLevel === 'detailed'
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                    }`}
                >
                  <p className="text-center text-sm font-medium">
                    {lang === 'fa' ? 'با جزئیات' : 'Detailed'}
                  </p>
                </button>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExportImage}
              className="w-full"
              disabled={isGeneratingImage}
            >
              {isGeneratingImage
                ? lang === 'fa'
                  ? 'در حال ایجاد...'
                  : 'Generating...'
                : lang === 'fa'
                  ? 'دانلود تصویر'
                  : 'Download Image'}
            </Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="px-4 py-4 space-y-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${lang}/route/`)}
              className="shrink-0 hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="size-5 rtl:rotate-180" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate text-foreground">
                {dict.page_route.route_details}
              </h1>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {getStationDisplay(route.steps[0].station.id)}
                <span className="rtl:rotate-180">→</span>
                {getStationDisplay(
                  route.steps[route.steps.length - 1].station.id
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-10 bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:text-red-800 transition-colors dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                onClick={() => setMissedStopOpen(true)}
              >
                {dict.page_route.missed_stop}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          {/* Route Switch Button */}
          {routeOptions.length > 1 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowRouteSelection(true)}
              >
                {(() => {
                  const isFastestSelected =
                    selectedRouteIndex === routeOptions[0].index;
                  if (lang === 'fa') {
                    return isFastestSelected
                      ? 'تغییر مسیر به کم تعویض ترین'
                      : 'تغییر مسیر به سریعترین';
                  } else {
                    return isFastestSelected
                      ? 'Switch to Lowest Transfers'
                      : 'Switch to Fastest';
                  }
                })()}
              </Button>
            </div>
          )}

          {/* Export and Share Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setExportOpen(true)}
              disabled={isGeneratingImage}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {lang === 'fa' ? 'خروجی‌عکس' : 'Export Image'}
            </Button>
            <Button variant="default" className="flex-1" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              {dict.page_route.share}
            </Button>
          </div>
        </div>

        {/* Route Summary Card */}
        <Card className="p-2 bg-linear-to-r from-primary/5 to-secondary/5 border-primary/10 shadow-lg">
          <div className="grid min-[380px]:grid-cols-2 gap-2">
            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-border/50">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-full">
                <MapPin className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {route.totalStations}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {dict.page_route.total_stations}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-background/50 rounded-xl border border-border/50">
              <div className="p-2 bg-red-100 dark:bg-red-950 rounded-full">
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {route.totalTransfers}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {dict.page_route.total_transfers}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Route Steps */}
        <Card className="p-6">
          <div className="flex xs:items-center justify-between flex-col xs:flex-row gap-4 mb-6">
            <h2 className="font-semibold text-lg">
              {dict.page_route.detailed_route_steps}
            </h2>
            <Button
              variant="outline"
              onClick={() => setShowDetailedSteps(!showDetailedSteps)}
            >
              {showDetailedSteps
                ? lang === 'fa'
                  ? 'خلاصه نشون بده'
                  : 'Show Summary'
                : lang === 'fa'
                  ? 'جزئیات رو نشون بده'
                  : 'Show Details'}
            </Button>
          </div>

          <div className="relative">
            {(showDetailedSteps
              ? route.steps
              : route.steps.filter((step, index) => {
                if (index === 0 || index === route.steps.length - 1)
                  return true;
                const nextStep = route.steps[index + 1];
                return nextStep && nextStep.line !== step.line;
              })
            ).map((step, index, filteredSteps) => {
              const originalIndex = route.steps.findIndex((s) => s === step);
              const lineKey = step.line;
              const lineColor = lines[lineKey]?.color || '#6b7280';
              const isLast = index === filteredSteps.length - 1;
              const nextStep = !isLast ? filteredSteps[index + 1] : null;
              const isLineChange = nextStep && nextStep.line !== step.line;

              return (
                <div
                  key={index}
                  className="relative flex items-start gap-4 pb-8 last:pb-0"
                >
                  {/* Timeline line */}
                  {!isLast && (
                    <div
                      className="absolute start-4 w-0.5 h-full -mb-8"
                      style={{ backgroundColor: lineColor }}
                    />
                  )}

                  {/* Step number with line color */}
                  <div
                    className={`flex shrink-0 items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-md relative z-10 ${['line_3', 'line_4'].includes(lineKey)
                      ? 'text-black'
                      : 'text-white'
                      }`}
                    style={{ backgroundColor: lineColor }}
                  >
                    {originalIndex + 1}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Line badge */}
                      <Badge
                        className={`flex flex-col items-start py-1.5 px-2 corner-squircle ${['line_3', 'line_4'].includes(lineKey)
                          ? 'text-black'
                          : 'text-white'
                          }`}
                        style={{ backgroundColor: lineColor }}
                      >
                        {lines[lineKey]?.name[lang] ||
                          step.line ||
                          'Unknown Line'}

                        <span className='text-xs'>
                          {/* Guide text */}
                          {originalIndex === 0 && (
                            <p >
                              {getFirstStepGuide(
                                route,
                                lines,
                                lang,
                                getStationDisplay
                              )}
                            </p>
                          )}

                          <p >
                            {getTransferGuide(
                              route,
                              originalIndex,
                              lines,
                              lang,
                              getStationDisplay
                            )}
                          </p>

                        </span>
                      </Badge>

                    </div>


                    {/* Station name */}
                    <h3 className="font-semibold text-base text-foreground mb-1">
                      {lang === 'fa'
                        ? step.station.translations.fa
                        : step.station.name}
                    </h3>

                    {/* Station address */}
                    {step.station.address && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {step.station.address}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Missed Stop Bottom Sheet */}
      <StationSelector
        trigger={<div />}
        title={dict.page_route.recalculate_from}
        description={dict.page_route.select_current_station}
        placeholder={dict.page_route.search_origin_description}
        onSelect={(stationId) => {
          const currentTo = params.to;
          if (currentTo) {
            router.push(
              `/${lang}/route/detail?from=${stationId}&to=${currentTo}`
            );
          }
          setMissedStopOpen(false);
        }}
        dict={{
          no_stations_found: dict.page_route.no_stations_found,
          closest_to_my_location: dict.page_route.closest_to_my_location,
          location_permission_denied: dict.page_route.location_permission_denied,
          geolocation_not_supported: dict.page_route.geolocation_not_supported,
        }}
        open={missedStopOpen}
        onOpenChange={setMissedStopOpen}
      />
    </div>
  );
}
