"use client";

import { useMemo, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import type { StationsMap } from "@workspace/metro-core/types";
import { lines } from "@workspace/metro-core/data";

import { Input } from "@workspace/ui/components/input";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Spinner } from "@workspace/ui/components/spinner";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import { haversineDistance } from "@/lib/geo";
import { isLightColor } from "@/lib/station-visual";

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
  excludeId,
}: {
  stations: StationsMap;
  onSelect: (stationId: string) => void;
  excludeId?: string | null;
}) {
  const dict = useDictionary();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = Object.values(stations).filter((s) => s.id !== excludeId);
    const filtered = q
      ? all.filter((s) =>
          (locale === "fa" ? s.translations.fa : s.name).toLowerCase().includes(q)
        )
      : all;
    return filtered.slice(0, 60);
  }, [stations, query, locale, excludeId]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        let nearestId: string | null = null;
        let nearestDist = Infinity;
        for (const station of Object.values(stations)) {
          if (station.id === excludeId) continue;
          const dist = haversineDistance(here, [
            parseFloat(station.longitude),
            parseFloat(station.latitude),
          ]);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestId = station.id;
          }
        }
        if (nearestId) onSelect(nearestId);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
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

      <ScrollArea className="h-[55vh] min-h-[280px]">
        {results.length === 0 ? (
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
      </ScrollArea>
    </div>
  );
}

export { stationLabel };
