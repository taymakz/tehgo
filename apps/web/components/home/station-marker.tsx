"use client";

import { memo, useMemo, useState } from "react";
import type { Station } from "@workspace/metro-core/types";
import type { Locale } from "@/i18n/config";

import {
  dayTypeForDate,
  formatMinutes,
  getNextStationDeparture,
  tehranNowMinutes,
} from "@workspace/metro-core/timetable";
import { MapMarker, MarkerContent, MarkerLabel, MarkerTooltip } from "@workspace/ui/components/map";
import { Hitbox } from "@workspace/ui/components/hitbox";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary } from "@/i18n/dictionary-provider";
import { stationMarkerBackground, toFaDigits } from "@/lib/station-visual";
import { NEXT_BADGE_BASE_CLASS, NextArrivalLabel } from "./next-arrival-label";

// Memoized: HomeMap renders 150+ of these, so stable props (plus a single
// shared 30s clock from the parent) keep unrelated state changes — drawer
// toggles, zoom watcher — from re-rendering every marker.
export const StationMarker = memo(function StationMarker({
  station,
  label,
  roleLabel,
  locale,
  role,
  showLabel,
  showTooltip,
  showNextTime = true,
  showTimeBadge = false,
  dimmed,
  related,
  outaged,
  now,
  onSelect,
}: {
  station: Station;
  label: string;
  roleLabel?: string;
  locale: Locale;
  role: "from" | "to" | null;
  showLabel: boolean;
  showTooltip: boolean;
  /** Show the live next-train line in the tooltip (gated by parent). */
  showNextTime?: boolean;
  /** Show the time badge under the always-visible name label (zoom-gated). */
  showTimeBadge?: boolean;
  dimmed: boolean;
  related: boolean;
  outaged?: boolean;
  /** Shared clock tick — the only prop that changes on a timer. */
  now: Date;
  onSelect: (id: string) => void;
}) {
  const dict = useDictionary();
  // Hover-gated tooltip countdown: the timetable lookup mounts only while
  // this marker's tooltip is open (one instance at a time).
  const [hovered, setHovered] = useState(false);

  // Static per-render snapshot for the always-visible name label: a pure
  // memoized scan (microseconds), refreshed by the parent's shared clock.
  const labelBadge = useMemo(() => {
    if (!showLabel || !showTimeBadge) return null;
    const dayType = dayTypeForDate(now);
    const minutes = tehranNowMinutes(now);
    const dep = getNextStationDeparture(station.id, dayType, minutes);
    if (!dep) return null;
    if (dep.dayOffset === 1) {
      const time =
        locale === "fa" ? toFaDigits(formatMinutes(dep.minutes)) : formatMinutes(dep.minutes);
      return `${dict.route.timetableTomorrow} ${time}`;
    }
    const diff = dep.minutes - minutes;
    if (diff <= 0) return dict.route.timetableNow;
    return locale === "fa" ? `${toFaDigits(diff)} دقیقه دیگر` : `in ${diff} min`;
  }, [station.id, now, showLabel, showTimeBadge, locale, dict]);

  return (
    <MapMarker
      longitude={parseFloat(station.longitude)}
      latitude={parseFloat(station.latitude)}
      onClick={() => onSelect(station.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MarkerContent>
        <Hitbox size="lg" radius="full" className="max-sm:after:!inset-[-24px]">
          <div
            className={cn(
              "relative size-3.5 rounded-full border border-white/80 shadow-sm transition-all",
              role && "size-5 border-2 ring-2 ring-offset-1",
              role === "from" && "ring-foreground",
              role === "to" && "ring-primary",
              dimmed && !related && "size-2"
            )}
            style={{
              background: stationMarkerBackground(station.colors),
              opacity: dimmed && !related ? 0.1 : 1,
            }}
          >
            {outaged && (
              <>
                <span className="absolute inset-[-3px] rounded-full border-2 border-red-500 bg-background/70" />
                <span className="absolute top-1/2 start-1/2 h-0 w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-red-500 rtl:rotate-45" />
              </>
            )}
          </div>
        </Hitbox>
        {showLabel && (
          <MarkerLabel
            className={cn("flex flex-col items-center gap-0.5", locale === "fa" && "font-vazir")}
          >
            <span
              className={cn(
                "rounded px-1 py-0.5 text-[10px] font-medium whitespace-nowrap shadow-sm",
                outaged
                  ? "bg-red-600 text-white"
                  : role
                    ? "z-20 bg-blue-600 text-white"
                    : "border border-zinc-800 bg-zinc-900 text-zinc-50 dark:border-zinc-200 dark:bg-white dark:text-zinc-900"
              )}
            >
              {role ? roleLabel : label}
            </span>
            {labelBadge && (
              <span
                className={cn(
                  NEXT_BADGE_BASE_CLASS,
                  "text-[9px]",
                  locale === "fa" && "font-vazir"
                )}
              >
                {labelBadge}
              </span>
            )}
          </MarkerLabel>
        )}
      </MarkerContent>
      {!showLabel && showTooltip && (
        <MarkerTooltip className={cn("px-3 py-1.5 text-lg", locale === "fa" && "font-vazir")}>
          <div>{label}</div>
          {hovered && showNextTime && (
            <NextArrivalLabel stationId={station.id} className="mt-1 min-w-44" />
          )}
        </MarkerTooltip>
      )}
    </MapMarker>
  );
});
