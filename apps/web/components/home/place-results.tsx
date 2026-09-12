"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import type { StationsMap } from "@workspace/metro-core/types";
import { cn } from "@workspace/ui/lib/utils";
import { Spinner } from "@workspace/ui/components/spinner";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import { useBrokenStationsStore } from "@/lib/stores/broken-stations";
import { findNearestStation } from "@/lib/nearest-station";
import type { PlaceResult } from "@/lib/place-search";
import { stationLabel } from "./station-search";

/**
 * OpenStreetMap place results under the station list. Selecting a place
 * picks its nearest open (not marked-outage) station as the route endpoint.
 */
export function PlaceResults({
  places,
  loading,
  stations,
  excludeId,
  onSelectPlace,
}: {
  places: PlaceResult[];
  loading: boolean;
  stations: StationsMap;
  excludeId?: string | null;
  onSelectPlace: (place: PlaceResult, stationId: string) => void;
}) {
  const dict = useDictionary();
  const locale = useLocale();
  const brokenIds = useBrokenStationsStore((s) => s.ids);

  const rows = useMemo(
    () =>
      places.map((place) => ({
        place,
        nearest: findNearestStation(
          stations,
          [place.longitude, place.latitude],
          { excludeId, excludeIds: brokenIds }
        ),
      })),
    [places, stations, excludeId, brokenIds]
  );

  if (!loading && rows.length === 0) return null;

  return (
    <div className="mt-3">
      <p
        className={cn(
          "mb-1 flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground",
          locale === "fa" && "font-vazir"
        )}
      >
        {dict.route.places}
        {loading && <Spinner className="size-3" />}
      </p>
      <div className="flex flex-col gap-0.5 px-1">
        {rows.map(({ place, nearest }) => (
          <button
            key={place.id}
            type="button"
            disabled={!nearest}
            onClick={() => nearest && onSelectPlace(place, nearest.id)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-sm hover:bg-accent disabled:opacity-50"
          >
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate font-medium", locale === "fa" && "font-vazir")}>
                {place.name}
              </span>
              <span className={cn("block truncate text-xs text-muted-foreground", locale === "fa" && "font-vazir")}>
                {[place.detail, nearest && `${dict.route.nearestStation}: ${stationLabel(stations, nearest.id, locale)}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </button>
        ))}
      </div>
      {rows.length > 0 && (
        <p className="mt-1 px-2 text-center text-[10px] text-muted-foreground/70" dir="ltr">
          © OpenStreetMap contributors
        </p>
      )}
    </div>
  );
}
