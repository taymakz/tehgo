"use client";

import { useEffect, useMemo, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import type { StationsMap } from "@workspace/metro-core/types";
import { lines } from "@workspace/metro-core/data";

import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Spinner } from "@workspace/ui/components/spinner";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import { usePlaceSearch } from "@/hooks/use-place-search";
import { findNearestStation } from "@/lib/nearest-station";
import { isLightColor } from "@/lib/station-visual";
import { searchStations } from "@/lib/station-search";
import { useBrokenStationsStore } from "@/lib/stores/broken-stations";
import { PlaceResults } from "./place-results";

function stationLabel(
  stations: StationsMap,
  id: string,
  locale: "fa" | "en"
): string {
  const station = stations[id];
  if (!station) return id;
  return locale === "fa" ? station.translations.fa : station.name;
}

export function StationSearch({
  stations,
  onSelect,
  onLocationFound,
  excludeId,
}: {
  stations: StationsMap;
  onSelect: (stationId: string) => void;
  onLocationFound?: (stationId: string) => void;
  excludeId?: string | null;
}) {
  const dict = useDictionary();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const brokenIds = useBrokenStationsStore((s) => s.ids);

  // Our height-animated drawer wrapper fights vaul's own keyboard-avoidance
  // logic (both try to control the drawer's height), so the on-screen
  // keyboard can push the input out of view. Shrink the results list
  // ourselves whenever the visual viewport shrinks, so the drawer's total
  // measured height already accounts for the keyboard instead of relying
  // on vaul to correct it after the fact.
  const [keyboardShrinkPx, setKeyboardShrinkPx] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    function update() {
      const shrink = window.innerHeight - vv!.height;
      setKeyboardShrinkPx(shrink > 100 ? shrink : 0);
    }
    update();
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  const results = useMemo(() => {
    return searchStations(stations, query, excludeId).slice(0, 60);
  }, [stations, query, excludeId]);

  const { places, loading: placesLoading } = usePlaceSearch(query, locale);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const nearest = findNearestStation(
          stations,
          [pos.coords.longitude, pos.coords.latitude],
          { excludeId, excludeIds: brokenIds }
        );
        if (nearest) {
          onSelect(nearest.id);
          onLocationFound?.(nearest.id);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleSelectPlace(stationId: string) {
    onSelect(stationId);
    onLocationFound?.(stationId);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.route.searchPlaceholder}
          className="ps-9"
        />
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-start text-sm hover:bg-accent disabled:opacity-60"
      >
        {locating ? <Spinner className="size-4" /> : <LocateFixed className="size-4" />}
        {dict.route.useMyLocation}
      </button>

      <ScrollArea
        className="h-[55vh] min-h-[160px]"
        style={keyboardShrinkPx ? { height: `max(160px, 55vh - ${keyboardShrinkPx}px)` } : undefined}
      >
        {results.length === 0 && places.length === 0 && !placesLoading ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {dict.route.noResults}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5 px-1 py-2">
            {results.map((station) => (
              <button
                key={station.id}
                type="button"
                onClick={() => onSelect(station.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-sm hover:bg-accent"
                )}
              >
                <span className="min-w-0 flex-1 truncate">
                  {stationLabel(stations, station.id, locale)}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {station.lines.map((lineId) => {
                    const line = lines[lineId];
                    if (!line) return null;
                    return (
                      <span
                        key={lineId}
                        className={cn(
                          "whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                          isLightColor(line.color) ? "text-black" : "text-white"
                        )}
                        style={{ background: line.color }}
                      >
                        {line.name[locale]}
                      </span>
                    );
                  })}
                </span>
              </button>
            ))}
          </div>
        )}
        <PlaceResults
          places={places}
          loading={placesLoading}
          stations={stations}
          excludeId={excludeId}
          onSelectPlace={(_place, stationId) => handleSelectPlace(stationId)}
        />
      </ScrollArea>
    </div>
  );
}

export { stationLabel };
