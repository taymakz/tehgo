"use client";

import { useMemo } from "react";
import {
  dayTypeForDate,
  formatMinutes,
  getDirectionTimes,
  getNextArrivals,
  getNextStationDeparture,
  tehranNowMinutes,
} from "@workspace/metro-core/timetable";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import { useTehranNow } from "@/hooks/use-tehran-now";
import { toFaDigits } from "@/lib/station-visual";

/**
 * One-line "next train" summary. Scoped to a single line+direction when both
 * are given, otherwise the earliest departure across the whole station.
 * Renders nothing when the station/direction has no timetable data.
 *
 * Perf: pure memoized scan over a few sorted arrays (microseconds) + one
 * 30s timer per mounted instance. Map station markers must NOT mount this
 * directly — gate it behind hover (see StationMarker) so 150+ markers stay
 * timer-free.
 */
export function NextArrivalLabel({
  stationId,
  lineId,
  directionId,
  badgeOnly = false,
  className,
}: {
  stationId: string;
  lineId?: string;
  directionId?: string | null;
  /** Render only the green time badge (for tight spaces like list rows). */
  badgeOnly?: boolean;
  className?: string;
}) {
  const dict = useDictionary();
  const locale = useLocale();
  const now = useTehranNow();

  const item = useMemo(() => {
    const dayType = dayTypeForDate(now);
    const nowMinutes = tehranNowMinutes(now);
    if (lineId && directionId) {
      const times = getDirectionTimes(stationId, lineId, directionId, dayType);
      const [next] = getNextArrivals(times, nowMinutes, 1);
      return next ? { ...next, lineId, directionId } : null;
    }
    return getNextStationDeparture(stationId, dayType, nowMinutes);
  }, [stationId, lineId, directionId, now]);

  const badge = useMemo(() => {
    if (!item) return null;
    const time =
      locale === "fa" ? toFaDigits(formatMinutes(item.minutes)) : formatMinutes(item.minutes);
    if (item.dayOffset === 1) return `${dict.route.timetableTomorrow} ${time}`;
    const diff = item.minutes - tehranNowMinutes(now);
    if (diff <= 0) return `${dict.route.timetableNow} · ${time}`;
    return locale === "fa"
      ? `${toFaDigits(diff)} دقیقه دیگر · ${time}`
      : `in ${diff} min · ${time}`;
  }, [item, now, locale, dict]);

  if (!badge) return null;
  const badgeClassName = cn(
    "rounded-full bg-green-600/15 px-2 py-0.5 text-[11px] font-bold text-green-700 tabular-nums dark:text-green-400",
    locale === "fa" && "font-vazir"
  );
  if (badgeOnly) {
    return (
      <span className={cn(badgeClassName, "shrink-0 whitespace-nowrap", className)}>
        {badge}
      </span>
    );
  }
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <span className={cn("text-[11px] text-muted-foreground", locale === "fa" && "font-vazir")}>
        {dict.route.timetableNext}
      </span>
      <span className={badgeClassName}>{badge}</span>
    </div>
  );
}
