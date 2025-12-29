import { useEffect, useState } from "react";

export type UseTimeAgoFormatter<T = number> = (
  value: T,
  isPast: boolean,
) => string;

export type UseTimeAgoUnitNamesDefault =
  | "second"
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

export interface UseTimeAgoMessagesBuiltIn {
  justNow: string;
  past: string | UseTimeAgoFormatter<string>;
  future: string | UseTimeAgoFormatter<string>;
  invalid: string;
}

export type UseTimeAgoMessages<
  UnitNames extends string = UseTimeAgoUnitNamesDefault,
> = UseTimeAgoMessagesBuiltIn &
  Record<UnitNames, string | UseTimeAgoFormatter<number>>;

export interface FormatTimeAgoOptions<
  UnitNames extends string = UseTimeAgoUnitNamesDefault,
> {
  max?: UnitNames | number;
  fullDateFormatter?: (date: Date) => string;
  messages?: UseTimeAgoMessages<UnitNames>;
  showSecond?: boolean;
  rounding?: "round" | "ceil" | "floor" | number;
  units?: UseTimeAgoUnit<UnitNames>[];
}

export interface UseTimeAgoOptions<
  UnitNames extends string = UseTimeAgoUnitNamesDefault,
> extends FormatTimeAgoOptions<UnitNames> {
  updateInterval?: number;
}

export interface UseTimeAgoUnit<
  Unit extends string = UseTimeAgoUnitNamesDefault,
> {
  max: number;
  value: number;
  name: Unit;
}

const DEFAULT_UNITS: UseTimeAgoUnit<UseTimeAgoUnitNamesDefault>[] = [
  { max: 60000, value: 1000, name: "second" },
  { max: 2760000, value: 60000, name: "minute" },
  { max: 72000000, value: 3600000, name: "hour" },
  { max: 518400000, value: 86400000, name: "day" },
  { max: 2419200000, value: 604800000, name: "week" },
  { max: 28512000000, value: 2592000000, name: "month" },
  { max: Number.POSITIVE_INFINITY, value: 31536000000, name: "year" },
];

const DEFAULT_MESSAGES: UseTimeAgoMessages<UseTimeAgoUnitNamesDefault> = {
  justNow: "just now",
  past: (n) => (n.match(/\d/) ? `${n} ago` : n),
  future: (n) => (n.match(/\d/) ? `in ${n}` : n),
  month: (n, past) =>
    n === 1
      ? past
        ? "last month"
        : "next month"
      : `${n} month${n > 1 ? "s" : ""}`,
  year: (n, past) =>
    n === 1
      ? past
        ? "last year"
        : "next year"
      : `${n} year${n > 1 ? "s" : ""}`,
  day: (n, past) =>
    n === 1 ? (past ? "yesterday" : "tomorrow") : `${n} day${n > 1 ? "s" : ""}`,
  week: (n, past) =>
    n === 1
      ? past
        ? "last week"
        : "next week"
      : `${n} week${n > 1 ? "s" : ""}`,
  hour: (n) => `${n} hour${n > 1 ? "s" : ""}`,
  minute: (n) => `${n} minute${n > 1 ? "s" : ""}`,
  second: (n) => `${n} second${n > 1 ? "s" : ""}`,
  invalid: "",
};

const FA_MESSAGES: UseTimeAgoMessages = {
  justNow: "همین حالا",
  past: (n) => (n.match(/\d/) ? `${n} قبل` : n),
  future: (n) => (n.match(/\d/) ? `در ${n}` : n),
  month: (n, past) => (n === 1 ? (past ? "ماه قبل" : "ماه بعد") : `${n} ماه`),
  year: (n, past) => (n === 1 ? (past ? "سال قبل" : "سال بعد") : `${n} سال`),
  day: (n, past) => (n === 1 ? (past ? "دیروز" : "فردا") : `${n} روز`),
  week: (n, past) => (n === 1 ? (past ? "هفته قبل" : "هفته بعد") : `${n} هفته`),
  hour: (n) => `${n} ساعت`,
  minute: (n) => `${n} دقیقه`,
  second: (n) => `${n} ثانیه`,
  invalid: "نامعتبر",
};

function DEFAULT_FORMATTER(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatTimeAgo<
  UnitNames extends string = UseTimeAgoUnitNamesDefault,
>(
  from: Date,
  options: FormatTimeAgoOptions<UnitNames> = {},
  now: Date | number = Date.now(),
): string {
  const {
    max,
    messages = DEFAULT_MESSAGES as UseTimeAgoMessages<UnitNames>,
    fullDateFormatter = DEFAULT_FORMATTER,
    units = DEFAULT_UNITS as UseTimeAgoUnit<UnitNames>[],
    showSecond = false,
    rounding = "round",
  } = options;

  const roundFn =
    typeof rounding === "number"
      ? (n: number) => +n.toFixed(rounding)
      : Math[rounding];

  const diff = +now - +from;
  const absDiff = Math.abs(diff);

  function getValue(diff: number, unit: UseTimeAgoUnit<UnitNames>) {
    return roundFn(Math.abs(diff) / unit.value);
  }

  function format(diff: number, unit: UseTimeAgoUnit<UnitNames>) {
    const val = getValue(diff, unit);
    const past = diff > 0;

    const str = applyFormat(unit.name as UnitNames, val, past);
    return applyFormat((past ? "past" : "future") as UnitNames, str, past);
  }

  function applyFormat(
    name: UnitNames | keyof UseTimeAgoMessagesBuiltIn,
    val: number | string,
    isPast: boolean,
  ) {
    const formatter = messages[name];
    if (typeof formatter === "function") return formatter(val as never, isPast);
    return formatter.replace("{0}", val.toString());
  }

  if (absDiff < 60000 && !showSecond) return messages.justNow;

  if (typeof max === "number" && absDiff > max)
    return fullDateFormatter(new Date(from));

  if (typeof max === "string") {
    const unitMax = units.find((i) => i.name === max)?.max;
    if (unitMax && absDiff > unitMax) return fullDateFormatter(new Date(from));
  }

  for (const [idx, unit] of units.entries()) {
    const val = getValue(diff, unit);
    if (val <= 0 && units[idx - 1]) return format(diff, units[idx - 1]);
    if (absDiff < unit.max) return format(diff, unit);
  }

  return messages.invalid;
}

export function useTimeAgo<
  UnitNames extends string = UseTimeAgoUnitNamesDefault,
>(
  time: Date | number | string,
  options: UseTimeAgoOptions<UnitNames> = {},
): string {
  const { updateInterval = 30_000 } = options;

  const [timeAgo, setTimeAgo] = useState(() =>
    formatTimeAgo(new Date(time), options, Date.now()),
  );

  useEffect(() => {
    const updateTimeAgo = () => {
      setTimeAgo(formatTimeAgo(new Date(time), options, Date.now()));
    };

    if (updateInterval > 0) {
      const interval = setInterval(updateTimeAgo, updateInterval);
      return () => clearInterval(interval);
    }
  }, [time, updateInterval, options]);

  return timeAgo;
}

export function useFaTimeAgo(time: Date | number | string): string {
  return useTimeAgo(time, {
    messages: FA_MESSAGES,
  });
}
