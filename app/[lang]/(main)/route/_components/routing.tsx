/**
 * Routing Component
 *
 * Main routing interface for selecting origin and destination stations.
 * Features:
 * - Station search and selection via bottom sheet
 * - Swap origin/destination stations
 * - Find route button that navigates to detail page
 *
 * @module app/[lang]/(main)/route/_components/routing
 */

'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LucideRoute, ArrowLeftRight } from 'lucide-react';
import { findRoutes } from '@/lib/route-finder';
import { useRecentRoutesStore } from '@/lib/stores/recent-routes';
import graphData from '@/data/graph.json';
import stationsData from '@/data/stations.json';
import type { Graph, StationsMap } from '@/types/metro';
import { StationSelector } from './station-selector';

// Type assertions for JSON data
const graph = graphData as Graph;
const stations = stationsData as StationsMap;

/**
 * Routing component props
 */
interface RoutingProps {
  dict: {
    page_route: {
      routing_title: string;
      select_origin: string;
      select_destination: string;
      find_route: string;
      swap: string;
      route_found: string;
      total_stations: string;
      total_transfers: string;
      lines_used: string;
      transfer: string;
      search_origin_description: string;
      search_destination_description: string;
      no_stations_found: string;
      route_details: string;
      detailed_route_steps: string;
      recommended: string;
      select_route: string;
      missed_stop: string;
      recalculate_from: string;
      select_current_station: string;
      closest_to_my_location: string
      location_permission_denied: string
      geolocation_not_supported: string
    };
  };
}

/**
 * Routing Component
 *
 * Allows users to select origin and destination stations
 * and find the best metro route between them.
 */
export function Routing({ dict }: RoutingProps) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split('/')[1] as 'en' | 'fa';

  // State for selected stations
  const [fromStation, setFromStation] = useState<string>('');
  const [toStation, setToStation] = useState<string>('');
  const [findRouteLoading, setFindRouteLoading] = useState(false);

  // Get store actions
  const setSelectedRoute = useRecentRoutesStore(
    (state) => state.setSelectedRoute
  );

  /**
   * Handles finding route between selected stations
   * Navigates to detail page with route parameters
   */
  const handleFindRoute = () => {
    if (!fromStation || !toStation) return;

    setFindRouteLoading(true);
    const results = findRoutes(graph, stations, fromStation, toStation);

    if (results.length > 0) {
      // Navigate to detail page with query params
      router.push(`/${lang}/route/detail?from=${fromStation}&to=${toStation}`);
    }
    setFindRouteLoading(false);
  };

  /**
   * Swaps origin and destination stations
   */
  const handleSwap = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

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

  return (
    <div className="container space-y-6">
      <Card className="p-6">
        {/* Card title */}
        <h2 className="text-xl font-semibold mb-4">
          {dict.page_route.routing_title}
        </h2>

        <div className="space-y-4">
          {/* Origin Station Selector */}
          <StationSelector
            trigger={
              <Button variant="outline" className="w-full justify-start">
                <LucideRoute className="size-4 mr-2" />
                {fromStation
                  ? getStationDisplay(fromStation)
                  : dict.page_route.select_origin}
              </Button>
            }
            title={dict.page_route.select_origin}
            description={dict.page_route.search_origin_description}
            placeholder={dict.page_route.select_origin}
            onSelect={setFromStation}
            dict={{
              no_stations_found: dict.page_route.no_stations_found,
              closest_to_my_location: dict.page_route.closest_to_my_location,
              location_permission_denied: dict.page_route.location_permission_denied,
              geolocation_not_supported: dict.page_route.geolocation_not_supported
            }}
          />

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwap}
              aria-label={dict.page_route.swap}
            >
              <ArrowLeftRight className="size-4" />
            </Button>
          </div>

          {/* Destination Station Selector */}
          <StationSelector
            trigger={
              <Button variant="outline" className="w-full justify-start">
                <LucideRoute className="size-4 mr-2" />
                {toStation
                  ? getStationDisplay(toStation)
                  : dict.page_route.select_destination}
              </Button>
            }
            title={dict.page_route.select_destination}
            description={dict.page_route.search_destination_description}
            placeholder={dict.page_route.select_destination}
            onSelect={setToStation}
            dict={{
              no_stations_found: dict.page_route.no_stations_found,
              closest_to_my_location: dict.page_route.closest_to_my_location,
              location_permission_denied: dict.page_route.location_permission_denied,
              geolocation_not_supported: dict.page_route.geolocation_not_supported
            }}
          />

          {/* Find Route Button */}
          <Button
            onClick={handleFindRoute}
            className="w-full"
            disabled={!fromStation || !toStation}
            loading={findRouteLoading}
          >
            {dict.page_route.find_route}
          </Button>
        </div>
      </Card>
    </div>
  );
}
