/**
 * Station Selector Component
 *
 * A bottom sheet component for searching and selecting metro stations.
 * Features:
 * - Full-text search across station names
 * - Shows station lines with colored badges
 * - RTL support for Persian interface
 * - Choose on map with all stations displayed
 *
 * @module app/[lang]/(main)/route/_components/station-selector
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from '@/components/ui/bottom-sheet';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MarkerLabel,
  MapPopup,
  MapControls,
  MapRoute,
  useMap,
} from '@/components/ui/map';
import { Search, X, MapPin, LocateFixed, Route } from 'lucide-react';
import { toast } from 'sonner';
import stationsData from '@/data/stations.json';
import linesData from '@/data/lines.json';
import pathsData from '@/data/paths.json';
import type { StationsMap, LinesMap, PathsMap, Station } from '@/types/metro';

// Type assertions for JSON data
const stations = stationsData as StationsMap;
const lines = linesData as LinesMap;
const paths = pathsData as PathsMap;

/**
 * Station Selector Props
 */
interface StationSelectorProps {
  /** Trigger element that opens the bottom sheet */
  trigger: React.ReactNode;
  /** Title shown in the bottom sheet header */
  title: string;
  /** Description text below the title */
  description: string;
  /** Placeholder text for search input */
  placeholder: string;
  /** Callback when a station is selected */
  onSelect: (stationId: string) => void;
  /** Translation dictionary */
  dict: {
    no_stations_found: string;
    closest_to_my_location: string;
    location_permission_denied: string;
    geolocation_not_supported: string;
    choose_on_map?: string;
  };
  /** Controlled open state (optional) */
  open?: boolean;
  /** Controlled open state change handler (optional) */
  onOpenChange?: (open: boolean) => void;
}

// Tehran center coordinates
const TEHRAN_CENTER: [number, number] = [51.3890, 35.6892];

// Zoom threshold for showing station labels
const LABEL_ZOOM_THRESHOLD = 11.5;

type LngLat = { longitude: number; latitude: number };

async function fetchOsrmRoute(options: {
  start: { lng: number; lat: number };
  end: { lng: number; lat: number };
}): Promise<[number, number][]> {
  const { start, end } = options;
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
  );

  if (!response.ok) {
    throw new Error(`OSRM request failed: ${response.status}`);
  }

  const data = await response.json();
  const coordinates = data?.routes?.[0]?.geometry?.coordinates;
  if (!coordinates || !Array.isArray(coordinates)) {
    throw new Error('OSRM response did not include route geometry');
  }

  return coordinates as [number, number][];
}

/**
 * Station Markers Component
 * Renders all station markers with labels that appear at higher zoom levels
 */
function StationMarkers({
  lang,
  onStationClick,
}: {
  lang: 'en' | 'fa';
  onStationClick: (station: Station) => void;
}) {
  const { map, isLoaded } = useMap();
  const [zoom, setZoom] = useState(() => map?.getZoom() ?? 11);

  // Track zoom level changes
  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleZoom = () => {
      setZoom(map.getZoom());
    };

    map.on('zoom', handleZoom);

    return () => {
      map.off('zoom', handleZoom);
    };
  }, [map, isLoaded]);

  const showLabels = zoom >= LABEL_ZOOM_THRESHOLD;

  /**
   * Get station marker background based on its lines.
   * - 1 line: solid color
   * - 2 lines: half/half split
   * - 3+ lines: conic slices
   */
  const getStationMarkerBackground = (station: Station): string => {
    const colors = station.lines
      .map((lineId) => lines[lineId]?.color)
      .filter((color): color is string => Boolean(color));

    if (colors.length === 0) return '#3b82f6';
    if (colors.length === 1) return colors[0];

    if (colors.length === 2) {
      return `linear-gradient(90deg, ${colors[0]} 0 50%, ${colors[1]} 50% 100%)`;
    }

    const step = 100 / colors.length;
    const stops = colors
      .map((color, index) => {
        const start = (index * step).toFixed(4);
        const end = ((index + 1) * step).toFixed(4);
        return `${color} ${start}% ${end}%`;
      })
      .join(', ');

    return `conic-gradient(${stops})`;
  };

  return (
    <>
      {Object.values(stations).map((station) => (
        <MapMarker
          key={station.id}
          longitude={parseFloat(station.longitude)}
          latitude={parseFloat(station.latitude)}
          onClick={() => onStationClick(station)}
        >
          <MarkerContent>
            <div
              className="size-4 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
              style={{ background: getStationMarkerBackground(station) }}
            />
            {/* Show label when zoomed in */}
            {showLabels && (
              <MarkerLabel
                position="bottom"
                className={`font-vazir! text-xs font-medium whitespace-nowrap ${lang === 'fa' ? 'rtl text-right' : 'ltr text-left'}`}
              >
                {lang === 'fa' ? station.translations.fa : station.name}
              </MarkerLabel>
            )}
          </MarkerContent>
          <MarkerTooltip>
            <div className={`font-vazir! font-medium text-lg ${lang === 'fa' ? 'rtl text-right' : ''}`}>
              {lang === 'fa' ? station.translations.fa : station.name}
            </div>
            <div className="flex gap-1 mt-1">
              {station.lines.map((lineId) => {
                const line = lines[lineId];
                return line ? (
                  <span
                    key={lineId}
                    className={`px-1 py-0.5  font-medium rounded text-base font-vazir ${['line_3', 'line_4'].includes(lineId) ? 'text-black' : 'text-white'}`}
                    style={{ backgroundColor: line.color }}
                  >
                    {line.name[lang]}
                  </span>
                ) : null;
              })}
            </div>
          </MarkerTooltip>
        </MapMarker>
      ))}
      {/* Render routes for each line */}
      {Object.entries(paths).map(([lineId, { paths: linePaths }]) =>
        linePaths.map((path) => {
          const coordinates = path.stations
            .map((stationId) => stations[stationId])
            .filter((station): station is Station => station !== undefined)
            .map((station) => [parseFloat(station.longitude), parseFloat(station.latitude)] as [number, number]);
          const line = lines[lineId];
          return (
            <MapRoute
              key={path.id}
              coordinates={coordinates}
              color={line.color}
              width={3}
              opacity={0.7}
            />
          );
        })
      )}
    </>
  );
}

/**
 * Station Selector Component
 *
 * Renders a button that opens a bottom sheet with searchable station list.
 * Supports both controlled and uncontrolled usage.
 *
 * @example
 * <StationSelector
 *   trigger={<Button>Select Station</Button>}
 *   title="Select Origin"
 *   description="Search for your starting station"
 *   placeholder="Search stations..."
 *   onSelect={(id) => setFromStation(id)}
 *   dict={{ no_stations_found: "No stations found" }}
 * />
 */
export function StationSelector({
  trigger,
  title,
  description,
  placeholder,
  onSelect,
  dict,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: StationSelectorProps) {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] as 'en' | 'fa';

  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  const [selectedStationOnMap, setSelectedStationOnMap] = useState<Station | null>(null);
  const [osrmRoute, setOsrmRoute] = useState<[number, number][] | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange || setInternalOpen;

  /**
   * Filter stations based on search query
   * Searches in both English and Persian names
   */
  const filteredStations = Object.values(stations).filter((station) => {
    const displayName = lang === 'fa' ? station.translations.fa : station.name;
    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  /**
   * Calculate distance between two points using Haversine formula
   */
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Get user's location and find closest station
   */
  const getClosestStation = () => {
    setGeoLoading(true);
    if (!navigator.geolocation) {
      toast.error(dict.geolocation_not_supported);
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let closest: Station | undefined = undefined;
        let minDist = Infinity;
        Object.values(stations).forEach((station) => {
          const dist = haversine(latitude, longitude, parseFloat(station.latitude), parseFloat(station.longitude));
          if (dist < minDist) {
            minDist = dist;
            closest = station;
          }
        });
        if (closest) {
          handleSelect((closest as Station).id);
        }
        setGeoLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error(dict.location_permission_denied);
        setGeoLoading(false);
      }
    );
  };

  /**
   * Handles station selection
   * Closes sheet and clears search
   */
  const handleSelect = (stationId: string) => {
    onSelect(stationId);
    setIsOpen(false);
    setShowMap(false);
    setSelectedStationOnMap(null);
    setOsrmRoute(null);
    setSearch('');
  };

  /**
   * Handle locate callback from map controls
   */
  const handleLocate = useCallback((coords: LngLat) => {
    setUserLocation(coords);
  }, []);

  const handleStationClickOnMap = useCallback((station: Station) => {
    setSelectedStationOnMap(station);
  }, []);

  const handleGuideToStation = useCallback(async () => {
    if (!selectedStationOnMap) return;
    if (!userLocation) {
      toast.error(lang === 'fa' ? 'اول مکان خود را پیدا کنید' : 'Please find your location first');
      return;
    }

    try {
      setRouteLoading(true);
      const route = await fetchOsrmRoute({
        start: { lng: userLocation.longitude, lat: userLocation.latitude },
        end: {
          lng: parseFloat(selectedStationOnMap.longitude),
          lat: parseFloat(selectedStationOnMap.latitude),
        },
      });
      setOsrmRoute(route);
    } catch (error) {
      console.error('Failed to fetch OSRM route:', error);
      toast.error(lang === 'fa' ? 'دریافت مسیر ناموفق بود' : 'Failed to fetch route');
    } finally {
      setRouteLoading(false);
    }
  }, [lang, selectedStationOnMap, userLocation]);

  // Full screen map view
  if (showMap) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        {/* Close button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 z-10 shadow-lg"
          onClick={() => {
            setShowMap(false);
            setSelectedStationOnMap(null);
            setOsrmRoute(null);
          }}
        >
          <X className="size-5" />
        </Button>

        {/* Full screen map */}
        <Map center={TEHRAN_CENTER} zoom={11}>
          {/* OSRM route (user -> selected station) */}
          {osrmRoute && (
            <MapRoute coordinates={osrmRoute} color="#6366f1" width={5} opacity={0.85} />
          )}

          {/* User location marker */}
          {userLocation && (
            <MapMarker longitude={userLocation.longitude} latitude={userLocation.latitude}>
              <MarkerContent>
                <div className="size-6 rounded-full bg-primary border-2 border-white shadow-lg flex items-center justify-center">
                  <LocateFixed className="size-4 text-primary-foreground" />
                </div>
                <MarkerLabel
                  position="bottom"
                  className={`font-vazir! text-xs font-medium whitespace-nowrap ${lang === 'fa' ? 'rtl text-right' : 'ltr text-left'}`}
                >
                  {lang === 'fa' ? 'موقعیت من' : 'My location'}
                </MarkerLabel>
              </MarkerContent>
            </MapMarker>
          )}

          {/* Station markers with zoom-dependent labels */}
          <StationMarkers lang={lang} onStationClick={handleStationClickOnMap} />

          {/* Station action popup */}
          {selectedStationOnMap && (
            <MapPopup
              longitude={parseFloat(selectedStationOnMap.longitude)}
              latitude={parseFloat(selectedStationOnMap.latitude)}
              onClose={() => setSelectedStationOnMap(null)}
              closeButton
              focusAfterOpen={false}
              closeOnClick={false}
            >
              <div className={`min-w-[220px] rounded-md border bg-background p-3 shadow-sm ${lang === 'fa' ? 'rtl text-right' : ''}`}>
                <div className={`font-vazir! font-semibold text-foreground ${lang === 'fa' ? 'text-right' : ''}`}>
                  {lang === 'fa' ? selectedStationOnMap.translations.fa : selectedStationOnMap.name}
                </div>
                <div className="mt-2 flex gap-2 font-vazir!">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSelect(selectedStationOnMap.id)}
                  >
                    {lang === 'fa' ? 'انتخاب' : 'Select'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleGuideToStation}
                    loading={routeLoading}
                  >
                    <Route className="size-4 me-2" />
                    {lang === 'fa' ? 'راهنما' : 'Guide'}
                  </Button>
                </div>
              </div>
            </MapPopup>
          )}

          {/* Map controls with locate button */}
          <MapControls
            position="bottom-right"
            showZoom
            showLocate
            onLocate={handleLocate}
          />
        </Map>
      </div>
    );
  }

  return (
    <BottomSheet open={isOpen} onOpenChange={setIsOpen}>
      <BottomSheetTrigger asChild>{trigger}</BottomSheetTrigger>

      <BottomSheetContent
        header={
          <BottomSheetHeader>
            <BottomSheetTitle>{title}</BottomSheetTitle>
            <BottomSheetDescription>{description}</BottomSheetDescription>

            {/* Search Input */}
            <div className="container">
              <InputGroup>
                <InputGroupInput
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
              </InputGroup>
            </div>

            {/* Closest Location Button */}
            <div className="container flex gap-2">
              <Button
                onClick={getClosestStation}
                variant="outline"
                className="flex-1"
                loading={geoLoading}
              >
                {dict.closest_to_my_location}
              </Button>
              <Button
                onClick={() => setShowMap(true)}
                variant="outline"
                className="flex-1"
              >
                <MapPin className="size-4 me-2" />
                {dict.choose_on_map || (lang === 'fa' ? 'انتخاب از نقشه' : 'Choose on Map')}
              </Button>
            </div>
          </BottomSheetHeader>
        }
      >
        {/* Station List */}
        <div className="max-h-full overflow-y-auto">
          {filteredStations.length === 0 ? (
            // Empty state
            <div className="p-4 text-center text-sm text-muted-foreground">
              {dict.no_stations_found}
            </div>
          ) : (
            // Station items
            <div>
              {filteredStations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => handleSelect(station.id)}
                  className="w-full px-3 py-2 text-start hover:bg-accent hover:text-accent-foreground rounded-sm text-sm"
                >
                  <div className="flex items-center gap-2">
                    {/* Station name */}
                    <span>
                      {lang === 'fa' ? station.translations.fa : station.name}
                    </span>

                    {/* Line badges */}
                    <div className="flex gap-1">
                      {station.lines.map((lineId) => {
                        const line = lines[lineId];
                        return line ? (
                          <span
                            key={lineId}
                            className={`px-1.5 py-0.5 text-xs font-medium rounded ${['line_3', 'line_4'].includes(lineId)
                              ? 'text-black'
                              : 'text-white'
                              }`}
                            style={{ backgroundColor: line.color }}
                          >
                            {line.name[lang]}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}
