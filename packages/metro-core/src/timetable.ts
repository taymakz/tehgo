import { paths, timetables } from "./data";
import type { RouteResult, TimetableDayType, TimetableDirectionTimes } from "./types";

export type { TimetableDayType };

const TEHRAN_TZ = "Asia/Tehran";

/** Day bucket for a given moment, using Tehran calendar (Fri weekend). */
export function dayTypeForDate(date: Date = new Date()): TimetableDayType {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TZ,
    weekday: "short",
  }).format(date);
  if (weekday === "Fri") return "friday";
  if (weekday === "Thu") return "thursday";
  return "weekday";
}

/** Minutes since midnight in Tehran for a given moment. */
export function tehranNowMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TZ,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export interface StationLineTimetable {
  [directionId: string]: TimetableDirectionTimes;
}

/** Full timetable entry for a station, keyed by line then direction (destination). */
export function getStationTimetable(
  stationId: string
): Record<string, StationLineTimetable> | null {
  return timetables.stations[stationId] ?? null;
}

/** Line ids of a station that have timetable data (in station.lines order). */
export function getTimetableLines(stationId: string, lineOrder: string[]): string[] {
  const entry = getStationTimetable(stationId);
  if (!entry) return [];
  return lineOrder.filter((lineId) => entry[lineId] !== undefined);
}

/** Direction (destination station) ids for a station+line pair. */
export function getTimetableDirections(stationId: string, lineId: string): string[] {
  return Object.keys(getStationTimetable(stationId)?.[lineId] ?? {});
}

export function getDirectionTimes(
  stationId: string,
  lineId: string,
  directionId: string,
  dayType: TimetableDayType
): number[] {
  return (
    getStationTimetable(stationId)?.[lineId]?.[directionId]?.[dayType] ?? []
  );
}

export function getFirstLast(times: number[]): {
  first: number | null;
  last: number | null;
} {
  if (times.length === 0) return { first: null, last: null };
  return { first: times[0]!, last: times[times.length - 1]! };
}

export interface NextArrival {
  /** Departure minutes since midnight */
  minutes: number;
  /** 0 = today, 1 = tomorrow (service for today has ended) */
  dayOffset: 0 | 1;
}

/** Departed trains stay visible with an "الان" badge this long before rolling over. */
export const DEPARTED_GRACE_MINUTES = 1;

/** Next `count` departures at/after `nowMinutes`, wrapping to tomorrow's first trains. */
export function getNextArrivals(
  times: number[],
  nowMinutes: number,
  count = 3
): NextArrival[] {
  if (times.length === 0 || count <= 0) return [];
  const upcoming = times
    .filter((t) => t >= nowMinutes - DEPARTED_GRACE_MINUTES)
    .map((minutes) => ({ minutes, dayOffset: 0 as const }));
  if (upcoming.length >= count) return upcoming.slice(0, count);
  const needed = count - upcoming.length;
  const tomorrow = times.slice(0, needed).map((minutes) => ({ minutes, dayOffset: 1 as const }));
  return [...upcoming, ...tomorrow];
}

/** "05:30" for 330. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface StationDeparture extends NextArrival {
  lineId: string;
  directionId: string;
}

/**
 * Earliest upcoming departure across all lines/directions of a station.
 * Pure scan over a handful of sorted arrays — cheap enough to run per render.
 */
export function getNextStationDeparture(
  stationId: string,
  dayType: TimetableDayType,
  nowMinutes: number
): StationDeparture | null {
  const entry = getStationTimetable(stationId);
  if (!entry) return null;
  let best: StationDeparture | null = null;
  for (const [lineId, dirs] of Object.entries(entry)) {
    for (const [directionId, days] of Object.entries(dirs)) {
      const times = days[dayType];
      if (!times || times.length === 0) continue;
      const [next] = getNextArrivals(times, nowMinutes, 1);
      if (!next) continue;
      if (
        !best ||
        next.dayOffset < best.dayOffset ||
        (next.dayOffset === best.dayOffset && next.minutes < best.minutes)
      ) {
        best = { ...next, lineId, directionId };
      }
    }
  }
  return best;
}

/**
 * Destination station id of the continuous run on `lineId` boarded at
 * `stationId` within an already-computed route (transfer-aware).
 * Walk legs resolve too: boarding happens at the walk's destination on the
 * walk step's own line. Returns null when no boarding run can be determined.
 */
export function getRouteBoardingDirection(
  route: RouteResult,
  stationId: string,
  lineId: string
): string | null {
  const steps = route.steps;
  // Pass 1 — walk departures win: the guide text at a walk origin describes
  // boarding AFTER the walk, while the ride that got us there sits at the
  // same station on (usually) another line.
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    // Boarding after a walk leg: the walk step already carries the
    // boarded line, and the run continues on the following steps.
    if (step.walk && step.walkFrom === stationId && step.line === lineId) {
      return timetableDirection(lineId, step.stationId, runEnd(steps, i, lineId));
    }
  }
  // Pass 2 — regular boardings and transfers onto the line.
  let start = -1;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    if (step.walk || step.stationId !== stationId) continue;
    if (step.line === lineId) {
      start = i;
      break;
    }
    if (step.transferTo === lineId) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return null;
  return timetableDirection(lineId, stationId, runEnd(steps, start, lineId));
}

/**
 * Pick the timetable direction key for a boarding: the run's end station
 * when it is one (e.g. riding to the terminus), otherwise the line terminal
 * beyond it (e.g. alighting mid-line at a transfer). Falls back to the run
 * end itself (renders nothing downstream) when neither resolves.
 */
function timetableDirection(
  lineId: string,
  boardStationId: string,
  endStationId: string | null
): string | null {
  if (!endStationId) return null;
  if (timetables.stations[boardStationId]?.[lineId]?.[endStationId] !== undefined) {
    return endStationId;
  }
  const terminal = resolveLineTerminal(lineId, boardStationId, endStationId);
  if (
    terminal &&
    timetables.stations[boardStationId]?.[lineId]?.[terminal] !== undefined
  ) {
    return terminal;
  }
  return endStationId;
}

/**
 * Terminal station id of `lineId` when traveling from `fromId` toward
 * `towardId`. Path branches are joined end-to-start into full chains first,
 * so trunk+branch lines (1, 4) resolve correctly.
 */
export function resolveLineTerminal(
  lineId: string,
  fromId: string,
  towardId: string
): string | null {
  const linePaths = paths[lineId]?.paths;
  if (!linePaths || fromId === towardId) return null;
  const chains: string[][] = linePaths.map((p) => [...p.stations]);
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < chains.length && !merged; i++) {
      for (let j = 0; j < chains.length && !merged; j++) {
        if (i === j) continue;
        const a = chains[i]!;
        const b = chains[j]!;
        if (a[a.length - 1] === b[0]) {
          chains[i] = [...a, ...b.slice(1)];
          chains.splice(j, 1);
          merged = true;
        } else if (b[b.length - 1] === a[0]) {
          chains[i] = [...b, ...a.slice(1)];
          chains.splice(j, 1);
          merged = true;
        }
      }
    }
  }
  for (const chain of chains) {
    const fromIdx = chain.indexOf(fromId);
    const towardIdx = chain.indexOf(towardId);
    if (fromIdx < 0 || towardIdx < 0) continue;
    return towardIdx > fromIdx ? chain[chain.length - 1]! : chain[0]!;
  }
  return null;
}

/** Last station of the continuous non-walk run on `lineId` from `start`. */
function runEnd(steps: RouteResult["steps"], start: number, lineId: string): string | null {
  if (start < 0 || start >= steps.length) return null;
  let end = start;
  while (
    end + 1 < steps.length &&
    steps[end + 1]!.line === lineId &&
    !steps[end + 1]!.walk
  ) {
    end++;
  }
  const last = steps[end]!;
  if (last.line !== lineId) return null;
  if (last.walk && end !== start) return null;
  return last.stationId;
}
