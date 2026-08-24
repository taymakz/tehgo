"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryState } from "nuqs";
import { AnimatePresence, motion } from "motion/react";

import { graph, lines, paths, stations } from "@workspace/metro-core/data";
import {
  fastestRoute,
  fewestTransfersRoute,
  findRoutesWithWalkBridge,
} from "@workspace/metro-core/route-finder";
import { getFirstStepGuide, getTransferGuide } from "@workspace/metro-core/route-guides";

import { Map, MapControls, MapRoute } from "@workspace/ui/components/map";
import { SettingsMenu } from "@/components/settings-menu";
import { Splash } from "@/components/splash";
import { StationMarker } from "./station-marker";
import { StationSearchModal } from "./station-search-modal";
import { RouteGuideMarker } from "./route-guide-marker";
import { MapReadyWatcher } from "./map-ready-watcher";
import { MapZoomWatcher } from "./map-zoom-watcher";
import { AppDrawer, type DrawerView, type RouteType } from "./app-drawer";
import { FloatingRouteControls } from "./floating-controls";
import { MapFlyTo } from "./map-fly-to";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRecentRoutesStore } from "@/lib/stores/recent-routes";
import { useBrokenStationsStore } from "@/lib/stores/broken-stations";

const TEHRAN_CENTER: [number, number] = [51.389, 35.6892];
// Zoom level at which station names become readable enough to show by
// default above every station, not just the selected/related ones. Small
// screens are more cramped, so they need to be zoomed in further first.
const LABEL_VISIBLE_ZOOM_DESKTOP = 12;
const LABEL_VISIBLE_ZOOM_MOBILE = 14;

function stationCoords(id: string): [number, number] | null {
  const station = stations[id];
  if (!station) return null;
  return [parseFloat(station.longitude), parseFloat(station.latitude)];
}

export function HomeMap() {
  const locale = useLocale();
  const dict = useDictionary();
  const addRecentRoute = useRecentRoutesStore((s) => s.addRoute);
  const brokenIds = useBrokenStationsStore((s) => s.ids);

  const [from, setFrom] = useQueryState("from");
  const [to, setTo] = useQueryState("to");
  const [routeType, setRouteType] = useState<RouteType>("fastest");
  const [drawerView, setDrawerView] = useState<DrawerView | null>(null);
  const [searchField, setSearchField] = useState<"from" | "to">("from");
  const [pickStationId, setPickStationId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const handleMapReady = useCallback(() => setMapReady(true), []);
  const [zoom, setZoom] = useState(12);
  const isSmallScreen = useMediaQuery("(max-width: 639px)");
  const labelVisibleZoom = isSmallScreen ? LABEL_VISIBLE_ZOOM_MOBILE : LABEL_VISIBLE_ZOOM_DESKTOP;

  const blockedSet = useMemo(() => new Set(brokenIds), [brokenIds]);

  const routes = useMemo(() => {
    if (!from || !to || from === to) return [];
    return findRoutesWithWalkBridge(graph, stations, from, to, {
      blocked: blockedSet,
    });
  }, [from, to, blockedSet]);

  const fastestRouteResult = useMemo(() => fastestRoute(routes) ?? routes[0] ?? null, [routes]);
  const fewestRouteResult = useMemo(
    () => fewestTransfersRoute(routes) ?? routes[0] ?? null,
    [routes]
  );
  const showRouteTypeToggle = fastestRouteResult !== fewestRouteResult;

  const selectedRoute = useMemo(() => {
    if (routes.length === 0) return null;
    return routeType === "fastest" ? fastestRouteResult : fewestRouteResult;
  }, [routes, routeType, fastestRouteResult, fewestRouteResult]);

  const routeSegments = useMemo(() => {
    if (!selectedRoute) return [];
    const segments: {
      coordinates: [number, number][];
      color: string;
      dash?: boolean;
      walk?: boolean;
    }[] = [];
    let current: [number, number][] = [];
    let currentLine = "";
    let prev: [number, number] | null = null;

    for (const step of selectedRoute.steps) {
      const coords = stationCoords(step.stationId);
      if (!coords) continue;

      if (prev && step.walk) {
        if (current.length > 1) {
          segments.push({
            coordinates: current,
            color: lines[currentLine]?.color ?? "#888",
          });
        }
        segments.push({
          coordinates: [prev, coords],
          color: "#111827",
          dash: true,
          walk: true,
        });
        current = [];
      } else if (step.line !== currentLine && current.length > 0) {
        segments.push({
          coordinates: current,
          color: lines[currentLine]?.color ?? "#888",
        });
        const transferPoint = current[current.length - 1]!;
        current = [transferPoint];
      }

      current.push(coords);
      currentLine = step.line;
      prev = coords;
    }
    if (current.length > 1) {
      segments.push({
        coordinates: current,
        color: lines[currentLine]?.color ?? "#888",
      });
    }
    return segments;
  }, [selectedRoute]);

  const getStationDisplay = useCallback(
    (id: string) =>
      locale === "fa" ? (stations[id]?.translations.fa ?? id) : (stations[id]?.name ?? id),
    [locale]
  );

  const guidePoints = useMemo(() => {
    if (!selectedRoute || selectedRoute.steps.length === 0) return [];

    type GuidePoint = { stationId: string; lineId: string; text: string | null };
    const points: GuidePoint[] = [];

    const firstStep = selectedRoute.steps[0]!;
    points.push({
      stationId: firstStep.stationId,
      lineId: firstStep.line,
      text: getFirstStepGuide(selectedRoute, lines, paths, locale, getStationDisplay),
    });

    selectedRoute.steps.forEach((step, i) => {
      if (step.transferTo) {
        points.push({
          stationId: step.stationId,
          lineId: step.transferTo,
          text: getTransferGuide(selectedRoute, i, lines, paths, locale, getStationDisplay),
        });
      }
    });

    const lastStep = selectedRoute.steps[selectedRoute.steps.length - 1]!;
    if (lastStep.stationId !== firstStep.stationId) {
      points.push({ stationId: lastStep.stationId, lineId: lastStep.line, text: null });
    }

    // One tooltip per station: merge duplicate points (e.g. a walk guide
    // plus the destination flag landing on the same stop)
    const merged: GuidePoint[] = [];
    for (const point of points) {
      const existing = merged.find((m) => m.stationId === point.stationId);
      if (existing) {
        const texts = [existing.text, point.text].filter(Boolean);
        existing.text = texts.length > 0 ? texts.join(" ") : null;
      } else {
        merged.push({ ...point });
      }
    }

    return merged;
  }, [selectedRoute, locale, getStationDisplay]);

  const routeStationIds = useMemo(
    () => new Set(selectedRoute?.steps.map((s) => s.stationId) ?? []),
    [selectedRoute]
  );

  // MapLibre stacks marker DOM nodes by insertion order, so render the
  // from/to markers last to guarantee their "مبدا"/"مقصد" label always
  // paints above any neighboring station marker instead of being clipped.
  const stationsRenderOrder = useMemo(() => {
    const all = Object.values(stations);
    return [...all].sort((a, b) => {
      const aRole = a.id === from || a.id === to ? 1 : 0;
      const bRole = b.id === from || b.id === to ? 1 : 0;
      return aRole - bRole;
    });
  }, [from, to]);

  const addedRecentKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!from || !to || !selectedRoute) return;
    const key = `${from}-${to}`;
    if (addedRecentKeyRef.current === key) return;
    addedRecentKeyRef.current = key;
    addRecentRoute(from, to, selectedRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  function assignField(field: "from" | "to", id: string) {
    if (field === "from") setFrom(id);
    else setTo(id);
    setDrawerView(null);
  }

  function openSearch(field: "from" | "to") {
    setSearchField(field);
    setDrawerView("search");
  }

  function handleMarkerClick(id: string) {
    if (drawerView === "search") {
      assignField(searchField, id);
    } else {
      setPickStationId(id);
      setDrawerView("pick");
    }
  }

  function handlePickAs(field: "from" | "to") {
    if (pickStationId) assignField(field, pickStationId);
    setPickStationId(null);
  }

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  function handleReset() {
    setFrom(null);
    setTo(null);
    setRouteType("fastest");
    addedRecentKeyRef.current = null;
  }

  function handleSelectRecent(recentFrom: string, recentTo: string) {
    setFrom(recentFrom);
    setTo(recentTo);
    setDrawerView(null);
  }

  function handleLostStation() {
    openSearch("from");
  }

  const [flyOverride, setFlyOverride] = useState<{
    center: [number, number];
    key: string;
  } | null>(null);

  function handleLocationFound(id: string) {
    const coords = stationCoords(id);
    if (coords) setFlyOverride({ center: coords, key: `nearest-${id}-${Date.now()}` });
  }

  const bothSelected = !!from && !!to;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <Map center={TEHRAN_CENTER} zoom={12} className="h-dvh w-full">
        <MapReadyWatcher onReady={handleMapReady} />
        <MapZoomWatcher onZoomChange={setZoom} />
        <MapControls position="top-right" />
        <MapFlyTo
          center={flyOverride ? flyOverride.center : from ? stationCoords(from) : null}
          routeKey={flyOverride ? flyOverride.key : from && to ? `${from}-${to}` : null}
        />

        {Object.entries(paths).flatMap(([lineId, entry]) =>
          entry.paths.map((path) => {
            const coordinates = path.stations
              .map(stationCoords)
              .filter((c): c is [number, number] => !!c);
            if (coordinates.length < 2) return null;
            return (
              <MapRoute
                key={path.id}
                coordinates={coordinates}
                color={lines[lineId]?.color ?? "#9ca3af"}
                width={4}
                opacity={bothSelected ? 0.1 : 1}
                interactive={false}
              />
            );
          })
        )}

        {routeSegments.flatMap((segment, i) => {
          if (!segment.walk) {
            return [
              <MapRoute
                key={`route-${i}`}
                coordinates={segment.coordinates}
                color={segment.color}
                width={8}
                opacity={1}
                interactive={false}
              />,
            ];
          }
          // Walk leg: light casing under a dark dash so it reads on any map
          return [
            <MapRoute
              key={`route-${i}-casing`}
              coordinates={segment.coordinates}
              color="#f8fafc"
              width={9}
              opacity={0.95}
              interactive={false}
            />,
            <MapRoute
              key={`route-${i}`}
              coordinates={segment.coordinates}
              color="#111827"
              width={4.5}
              opacity={1}
              dashArray={[1.3, 1.5]}
              interactive={false}
            />,
          ];
        })}

        {stationsRenderOrder.map((station) => {
          const isRelated =
            station.id === from || station.id === to || routeStationIds.has(station.id);
          const showLabel =
            isRelated || (zoom >= labelVisibleZoom && !bothSelected);
          return (
          <StationMarker
            key={station.id}
            station={station}
            label={locale === "fa" ? station.translations.fa : station.name}
            roleLabel={
              station.id === from ? dict.route.from : station.id === to ? dict.route.to : undefined
            }
            locale={locale}
            dimmed={bothSelected}
            related={isRelated}
            showLabel={showLabel}
            showTooltip={!isSmallScreen}
            role={station.id === from ? "from" : station.id === to ? "to" : null}
            outaged={blockedSet.has(station.id)}
            onClick={() => handleMarkerClick(station.id)}
          />
          );
        })}

        {guidePoints.map((point, gi) => {
          const coords = stationCoords(point.stationId);
          const station = stations[point.stationId];
          const line = lines[point.lineId];
          if (!coords || !station || !line) return null;
          return (
            <RouteGuideMarker
              key={`guide-${gi}-${point.stationId}-${point.lineId}`}
              longitude={coords[0]}
              latitude={coords[1]}
              lineColor={line.color}
              lineNumber={point.lineId.replace("line_", "")}
              lineName={line.name[locale]}
              stationName={getStationDisplay(point.stationId)}
              address={station.address}
              text={point.text}
              locale={locale}
            />
          );
        })}
      </Map>

      <div className="pointer-events-none fixed inset-0 z-30">
        <AnimatePresence>
          {from && (
            <motion.div
              key="settings-top-left"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="pointer-events-auto absolute left-2 top-2"
            >
              <SettingsMenu triggerClassName="size-[42px]" iconClassName="size-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FloatingRouteControls
        stations={stations}
        from={from}
        to={to}
        onOpenFrom={() => openSearch("from")}
        onOpenTo={() => openSearch("to")}
        onSwap={handleSwap}
        onDeleteFrom={() => setFrom(null)}
        onDeleteTo={() => setTo(null)}
        onOpenRecents={() => setDrawerView("recents")}
        onReset={handleReset}
        routeType={routeType}
        onRouteTypeChange={setRouteType}
        showRouteTypeToggle={showRouteTypeToggle}
        route={selectedRoute}
        onOpenOptions={() => setDrawerView("options")}
      />

      <AppDrawer
        stations={stations}
        view={isSmallScreen && drawerView === "search" ? null : drawerView}
        onViewChange={setDrawerView}
        pickStationId={pickStationId}
        searchField={searchField}
        from={from}
        to={to}
        route={selectedRoute}
        onSelectStation={(id) => assignField(searchField, id)}
        onLocationFound={handleLocationFound}
        onSelectPick={handlePickAs}
        onSelectRecent={handleSelectRecent}
        onLostStation={handleLostStation}
      />

      <StationSearchModal
        open={isSmallScreen && drawerView === "search"}
        stations={stations}
        onSelect={(id) => assignField(searchField, id)}
        onLocationFound={handleLocationFound}
        excludeId={searchField === "from" ? to : from}
        onClose={() => setDrawerView(null)}
      />

      <Splash show={!mapReady} />
    </div>
  );
}
