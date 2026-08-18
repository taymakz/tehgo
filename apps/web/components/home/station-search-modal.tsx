"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, LocateFixed, Search } from "lucide-react";
import type { StationsMap } from "@workspace/metro-core/types";
import { lines } from "@workspace/metro-core/data";

import { Input } from "@workspace/ui/components/input";
import { Spinner } from "@workspace/ui/components/spinner";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import { haversineDistance } from "@/lib/geo";
import { isLightColor } from "@/lib/station-visual";
import { searchStations } from "@/lib/station-search";
import { stationLabel } from "./station-search";

// Mobile-only replacement for the family-drawer search view. That drawer's
// height-animated wrapper fights vaul's own on-screen-keyboard avoidance
// (both try to control the drawer's height), so on small screens the search
// input can end up hidden behind the keyboard. This is a plain full-screen
// portal instead: no drawer height math, no vaul, just a fixed-height flex
// column that the keyboard resizes the normal way.
export function StationSearchModal({
  open,
  stations,
  onSelect,
  onLocationFound,
  excludeId,
  onClose,
}: {
  open: boolean;
  stations: StationsMap;
  onSelect: (stationId: string) => void;
  onLocationFound?: (stationId: string) => void;
  excludeId?: string | null;
  onClose: () => void;
}) {
  const dict = useDictionary();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the search box each time the modal reopens
    setQuery("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const results = useMemo(() => {
    return searchStations(stations, query, excludeId).slice(0, 60);
  }, [stations, query, excludeId]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here: [number, number] = [pos.coords.longitude, pos.coords.latitude];
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
        if (nearestId) {
          onSelect(nearestId);
          onLocationFound?.(nearestId);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex h-dvh flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2 border-b border-border p-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-accent"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.route.searchPlaceholder}
            className="ps-9"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="mx-3 mt-3 flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-start text-sm hover:bg-accent disabled:opacity-60"
      >
        {locating ? <Spinner className="size-4" /> : <LocateFixed className="size-4" />}
        {dict.route.useMyLocation}
      </button>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {results.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {dict.route.noResults}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5 py-2">
            {results.map((station) => (
              <button
                key={station.id}
                type="button"
                onClick={() => onSelect(station.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-sm hover:bg-accent"
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
      </div>
    </div>,
    document.body
  );
}
