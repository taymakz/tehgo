"use client";

import { useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { lines, stations } from "@workspace/metro-core/data";
import {
  dayTypeForDate,
  formatMinutes,
  getDirectionTimes,
  getFirstLast,
  getNextArrivals,
  getStationTimetable,
  tehranNowMinutes,
  type TimetableDayType,
} from "@workspace/metro-core/timetable";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import { useTehranNow } from "@/hooks/use-tehran-now";
import { toFaDigits } from "@/lib/station-visual";

const DAY_TYPES: TimetableDayType[] = ["weekday", "thursday", "friday"];

function stationName(id: string, locale: "fa" | "en"): string {
  const station = stations[id];
  if (!station) return id;
  return locale === "fa" ? station.translations.fa : station.name;
}

/** Approximate train arrival times for one station (official station timetables). */
export function StationTimetable({ stationId }: { stationId: string }) {
  const dict = useDictionary();
  const locale = useLocale();
  const entry = useMemo(() => getStationTimetable(stationId), [stationId]);
  const station = stations[stationId];

  const timetableLines = useMemo(
    () => (station ? station.lines.filter((l) => entry?.[l] !== undefined) : []),
    [station, entry]
  );
  // NOTE: parent mounts us with key={stationId}, so initial state below is
  // per-station and never needs effect-based resets.
  const [lineId, setLineId] = useState(timetableLines[0] ?? "");
  const directions = useMemo(
    () => (lineId && entry?.[lineId] ? Object.keys(entry[lineId]) : []),
    [entry, lineId]
  );
  const [directionId, setDirectionId] = useState(directions[0] ?? "");
  const now = useTehranNow();
  const todayType = useMemo(() => dayTypeForDate(now), [now]);
  const [dayType, setDayType] = useState<TimetableDayType>(todayType);

  function selectLine(id: string) {
    setLineId(id);
    const first = entry?.[id] ? Object.keys(entry[id])[0] : undefined;
    setDirectionId(first ?? "");
  }

  const times = useMemo(
    () =>
      lineId && directionId
        ? getDirectionTimes(stationId, lineId, directionId, dayType)
        : [],
    [stationId, lineId, directionId, dayType]
  );
  const isToday = dayType === todayType;
  const arrivals = useMemo(
    () =>
      isToday
        ? getNextArrivals(times, tehranNowMinutes(now), 3)
        : times.slice(0, 3).map((minutes) => ({ minutes, dayOffset: 0 as const })),
    [times, isToday, now]
  );
  const { first, last } = useMemo(() => getFirstLast(times), [times]);

  if (!entry || timetableLines.length === 0 || !lineId || !directionId) return null;

  const dayLabel: Record<TimetableDayType, string> = {
    weekday: dict.route.timetableWeekday,
    thursday: dict.route.timetableThursday,
    friday: dict.route.timetableFriday,
  };

  function relativeText(minutes: number, dayOffset: 0 | 1): string | null {
    if (!isToday) return null;
    if (dayOffset === 1) return dict.route.timetableTomorrow;
    const diff = minutes - tehranNowMinutes(now);
    if (diff <= 0) return dict.route.timetableNow;
    return locale === "fa" ? `تا ${toFaDigits(diff)} دقیقه دیگر` : `in ${diff} min`;
  }

  return (
    <section className="mt-4">
      <p
        className={cn(
          "mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
          locale === "fa" && "font-vazir"
        )}
      >
        <Clock className="size-3.5" />
        {dict.route.timetable}
      </p>

      {timetableLines.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {timetableLines.map((id) => {
            const line = lines[id];
            if (!line) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectLine(id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  id === lineId
                    ? "border-transparent text-white"
                    : "border-input bg-background text-muted-foreground hover:bg-accent"
                )}
                style={id === lineId ? { background: line.color } : undefined}
              >
                {line.name[locale]}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {directions.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setDirectionId(id)}
            className={cn(
              "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
              id === directionId
                ? "border-blue-600/40 bg-blue-600/10 font-medium"
                : "border-input bg-background hover:bg-accent dark:bg-input/20 dark:hover:bg-accent/40"
            )}
          >
            <span className={cn("truncate", locale === "fa" && "font-vazir")}>
              {dict.route.towards} {stationName(id, locale)}
            </span>
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: lines[lineId]?.color ?? "#888" }}
            />
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {DAY_TYPES.map((dt) => (
          <button
            key={dt}
            type="button"
            onClick={() => setDayType(dt)}
            className={cn(
              "relative rounded-lg border px-1 py-1.5 text-[11px] font-medium transition-colors",
              locale === "fa" && "font-vazir",
              dt === dayType
                ? "border-blue-600/40 bg-blue-600/10 text-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {dayLabel[dt]}
            {dt === todayType && (
              <span className="absolute -top-1.5 start-1 rounded-full bg-blue-600 px-1.5 text-[9px] font-bold text-white">
                {dict.route.timetableToday}
              </span>
            )}
          </button>
        ))}
      </div>

      <ul className="mt-2 flex flex-col gap-1.5">
        {arrivals.map((a, i) => {
          const label = relativeText(a.minutes, a.dayOffset);
          return (
            <li
              key={`${a.minutes}-${a.dayOffset}-${i}`}
              className="flex items-center justify-between rounded-xl bg-muted px-3 py-2"
            >
              <span className="text-base font-bold tabular-nums">
                {locale === "fa" ? toFaDigits(formatMinutes(a.minutes)) : formatMinutes(a.minutes)}
              </span>
              {label && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    a.dayOffset === 1
                      ? "bg-muted-foreground/15 text-muted-foreground"
                      : "bg-green-600/15 text-green-700 dark:text-green-400",
                    locale === "fa" && "font-vazir"
                  )}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {first !== null && last !== null && (
        <div
          className={cn(
            "mt-2 flex items-center justify-between rounded-xl border border-input px-3 py-2 text-xs text-muted-foreground",
            locale === "fa" && "font-vazir"
          )}
        >
          <span>
            {dict.route.timetableFirst}:{" "}
            <span className="font-bold text-foreground tabular-nums">
              {locale === "fa" ? toFaDigits(formatMinutes(first)) : formatMinutes(first)}
            </span>
          </span>
          <span>
            {dict.route.timetableLast}:{" "}
            <span className="font-bold text-foreground tabular-nums">
              {locale === "fa" ? toFaDigits(formatMinutes(last)) : formatMinutes(last)}
            </span>
          </span>
        </div>
      )}

      <p
        className={cn(
          "mt-2 text-center text-[11px] text-muted-foreground",
          locale === "fa" && "font-vazir"
        )}
      >
        {dict.route.timetableApprox}
      </p>
    </section>
  );
}
