/**
 * Recent Routes Component
 *
 * Displays a list of recently searched metro routes.
 * Features:
 * - View and navigate to previous routes
 * - Delete routes from history
 * - Track usage count per route
 * - Bottom sheet for route details
 *
 * @module app/[lang]/(main)/route/_components/recent-routes
 */

'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Trash2, Search } from 'lucide-react';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet';
import { useRecentRoutesStore } from '@/lib/stores/recent-routes';
import { findRoutes } from '@/lib/route-finder';
import stationsData from '@/data/stations.json';
import linesData from '@/data/lines.json';
import graphData from '@/data/graph.json';
import type { StationsMap, LinesMap, Graph } from '@/types/metro';

// Type assertions for JSON data
const stations = stationsData as StationsMap;
const lines = linesData as LinesMap;
const graph = graphData as Graph;

/**
 * Recent Routes Props
 */
interface RecentRoutesProps {
  dict: {
    page_route: {
      recent_routes: string;
      no_recent_routes: string;
      view_route: string;
      delete: string;
      total_stations: string;
      total_transfers: string;
      transfer: string;
      route_details: string;
      detailed_route_steps: string;
      missed_stop: string;
      recalculate_from: string;
      select_current_station: string;
      new_route_to_destination: string;
      used_count: string;
      no_stations_found: string;
    };
  };
}

/**
 * Recent Routes Component
 *
 * Shows user's route search history with ability to view, reuse, or delete routes.
 */
export function RecentRoutes({ dict }: RecentRoutesProps) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split('/')[1] as 'en' | 'fa';

  // Get state and actions from store
  const {
    routes,
    removeRoute,
    selectedRoute,
    setSelectedRoute,
    detailOpen,
    setDetailOpen,
    incrementCount,
  } = useRecentRoutesStore();

  // Local state for recalculate sheet
  const [recalculateOpen, setRecalculateOpen] = useState(false);
  const [recalculateSearch, setRecalculateSearch] = useState('');

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
   * Handles recalculating route from a new starting station
   * Used when user missed their stop
   */
  const handleRecalculate = (stationId: string) => {
    if (!selectedRoute) return;

    const destination =
      selectedRoute.steps[selectedRoute.steps.length - 1].station.id;
    const newRoutes = findRoutes(graph, stations, stationId, destination);

    if (newRoutes.length > 0) {
      setSelectedRoute(newRoutes[0]); // Take the first (recommended) route
    }

    setRecalculateOpen(false);
    setRecalculateSearch('');
  };

  /**
   * Filter stations for recalculate search
   */
  const filteredStations = Object.values(stations).filter((station) => {
    const displayName = lang === 'fa' ? station.translations.fa : station.name;
    return displayName.toLowerCase().includes(recalculateSearch.toLowerCase());
  });

  // Show empty state if no routes
  if (routes.length === 0) {
    return (
      <>
        <div className="text-center text-muted-foreground">
          {dict.page_route.no_recent_routes}
        </div>

        {/* Detail Bottom Sheet (for viewing route details) */}
        <BottomSheet open={detailOpen} onOpenChange={setDetailOpen}>
          <BottomSheetContent
            className="flex flex-col overflow-hidden h-full"
            header={
              <BottomSheetHeader>
                <BottomSheetTitle>
                  {dict.page_route.route_details}
                </BottomSheetTitle>
                <BottomSheetDescription>
                  {dict.page_route.detailed_route_steps}
                </BottomSheetDescription>
              </BottomSheetHeader>
            }
          >
            <div className="flex-1 overflow-y-auto">
              {selectedRoute && (
                <div className="space-y-4">
                  {/* Route summary */}
                  <div className="text-sm">
                    <p>
                      {dict.page_route.total_stations}:{' '}
                      {selectedRoute.totalStations}
                    </p>
                    <p>
                      {dict.page_route.total_transfers}:{' '}
                      {selectedRoute.totalTransfers}
                    </p>
                  </div>

                  {/* Route steps */}
                  <div className="space-y-3">
                    {selectedRoute.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        {/* Step number */}
                        <div className="shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>

                        {/* Step details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: lines[step.line]?.color,
                              }}
                            >
                              {lines[step.line]?.name[lang] || step.line}
                            </Badge>
                            {step.isTransfer && (
                              <Badge variant="secondary">
                                {dict.page_route.transfer}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">
                            {lang === 'fa'
                              ? step.station.translations.fa
                              : step.station.name}
                          </p>
                          {step.station.address && (
                            <p className="text-xs text-muted-foreground">
                              {step.station.address}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 container">
        {/* Section title */}
        <h2 className="font-semibold text-lg">
          {dict.page_route.recent_routes}
        </h2>

        {/* Route cards */}
        {routes.map((route) => (
          <Card key={route.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              {/* Route info */}
              <div>
                <p className="font-medium">
                  {getStationDisplay(route.from)} <span className="rtl:rotate-180">→</span>{' '}
                  {getStationDisplay(route.to)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dict.page_route.total_stations}: {route.route.totalStations},{' '}
                  {dict.page_route.total_transfers}:{' '}
                  {route.route.totalTransfers}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dict.page_route.used_count.replace(
                    '{count}',
                    route.count.toString()
                  )}
                </p>
              </div>

              {/* Delete button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRoute(route.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {/* View route button */}
            <Link
              href={`/${lang}/route/detail?from=${route.from}&to=${route.to}`}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  incrementCount(route.from, route.to);
                  setSelectedRoute(route.route);
                }}
              >
                {dict.page_route.view_route}
              </Button>
            </Link>
          </Card>
        ))}
      </div>

      {/* Detail Bottom Sheet */}
      <BottomSheet open={detailOpen} onOpenChange={setDetailOpen}>
        <BottomSheetContent
          className="flex flex-col overflow-hidden h-full"
          header={
            <BottomSheetHeader>
              <BottomSheetTitle>
                {dict.page_route.route_details}
              </BottomSheetTitle>
              <BottomSheetDescription>
                {dict.page_route.detailed_route_steps}
              </BottomSheetDescription>
            </BottomSheetHeader>
          }
        >
          <div className="flex-1 overflow-y-auto">
            {selectedRoute && (
              <div className="space-y-4">
                {/* Route summary */}
                <div className="text-sm">
                  <p>
                    {dict.page_route.total_stations}:{' '}
                    {selectedRoute.totalStations}
                  </p>
                  <p>
                    {dict.page_route.total_transfers}:{' '}
                    {selectedRoute.totalTransfers}
                  </p>
                </div>

                {/* Route steps */}
                <div className="space-y-3">
                  {selectedRoute.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            style={{ backgroundColor: lines[step.line]?.color }}
                          >
                            {lines[step.line]?.name[lang] || step.line}
                          </Badge>
                          {step.isTransfer && (
                            <Badge variant="secondary">
                              {dict.page_route.transfer}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">
                          {lang === 'fa'
                            ? step.station.translations.fa
                            : step.station.name}
                        </p>
                        {step.station.address && (
                          <p className="text-xs text-muted-foreground">
                            {step.station.address}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Missed stop button */}
                <Button
                  variant="destructive"
                  onClick={() => setRecalculateOpen(true)}
                  className="w-full"
                >
                  {dict.page_route.missed_stop}
                </Button>
              </div>
            )}
          </div>
        </BottomSheetContent>
      </BottomSheet>

      {/* Recalculate Bottom Sheet */}
      <BottomSheet open={recalculateOpen} onOpenChange={setRecalculateOpen}>
        <BottomSheetContent
          className="flex flex-col overflow-hidden h-full"
          header={
            <BottomSheetHeader>
              <BottomSheetTitle>
                {dict.page_route.recalculate_from}
              </BottomSheetTitle>
              <BottomSheetDescription>
                {dict.page_route.select_current_station}
              </BottomSheetDescription>
              <InputGroup>
                <InputGroupInput
                  placeholder={dict.page_route.select_current_station}
                  value={recalculateSearch}
                  onChange={(e) => setRecalculateSearch(e.target.value)}
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
            </BottomSheetHeader>
          }
        >
          <div className="flex-1 overflow-y-auto">
            {filteredStations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {dict.page_route.no_stations_found}
              </div>
            ) : (
              <div>
                {filteredStations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => handleRecalculate(station.id)}
                    className="w-full px-3 py-2 text-start hover:bg-accent hover:text-accent-foreground rounded-sm text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {lang === 'fa' ? station.translations.fa : station.name}
                      </p>
                      {station.address && (
                        <p className="text-xs text-muted-foreground">
                          {station.address}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
