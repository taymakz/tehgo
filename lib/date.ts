import dayjs from "dayjs";
import jalaliPlugin from "@zoomit/dayjs-jalali-plugin";
import jalaali from "jalaali-js";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import weekday from "dayjs/plugin/weekday";
import "dayjs/locale/fa";

// Extend dayjs with plugins
dayjs.extend(jalaliPlugin);
dayjs.extend(timezone);
dayjs.extend(utc);
dayjs.extend(weekday);

// Persian weekdays starting with Saturday (Shanbe) as day 0
export const PERSIAN_WEEKDAYS = [
  "شنبه", // Saturday
  "یکشنبه", // Sunday
  "دوشنبه", // Monday
  "سه شنبه", // Tuesday
  "چهارشنبه", // Wednesday
  "پنج شنبه", // Thursday
  "جمعه", // Friday
] as const;

// Union type of Persian weekday names
export type PersianWeekdayType = (typeof PERSIAN_WEEKDAYS)[number];

/**
 * Calculates the difference in days between two Persian dates.
 * @param currentDate - The starting Persian date in YYYY/MM/DD format.
 * @param targetDate - The ending Persian date in YYYY/MM/DD format.
 * @returns The number of days from currentDate to targetDate.
 * @example
 * calculatePersianDateDifference('1402/01/01', '1402/01/05') // Returns 4
 */
export function calculatePersianDateDifference(
  currentDate: string,
  targetDate: string,
): number {
  const persianDateRegex = /^\d{4}\/\d{2}\/\d{2}$/;

  // Input validation
  if (
    !persianDateRegex.test(currentDate) ||
    !persianDateRegex.test(targetDate)
  ) {
    throw new TypeError(
      "Invalid date format. Please provide valid Persian dates (YYYY/MM/DD).",
    );
  }

  // Helper function to convert Persian to Gregorian dates
  const convertToGregorian = (persianDate: string) => {
    const parts = persianDate.split("/").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      throw new Error("Invalid Persian date format. Expected YYYY/MM/DD.");
    }

    const [year, month, day] = parts as [number, number, number];
    return jalaali.toGregorian(year, month, day);
  };

  // Convert dates and calculate difference
  const currentGregorian = convertToGregorian(currentDate);
  const targetGregorian = convertToGregorian(targetDate);

  const currentDayjs = dayjs(
    `${currentGregorian.gy}-${currentGregorian.gm}-${currentGregorian.gd}`,
  );
  const targetDayjs = dayjs(
    `${targetGregorian.gy}-${targetGregorian.gm}-${targetGregorian.gd}`,
  );

  return targetDayjs.diff(currentDayjs, "day");
}

/**
 * Calculates remaining days for a cooldown period (e.g., course visibility change).
 * @param lastUpdateDate - The date when the action was last performed.
 * @param cooldownDays - Number of days for the cooldown period (default: 7).
 * @returns Object with remaining days and action availability status.
 * @example
 * calculateRemainingCooldownDays(new Date('2023-01-01'), 7) // Returns { remainingDays: 5, canPerformAction: false, isExpired: false } (assuming current date is 2023-01-06)
 */
export function calculateRemainingCooldownDays(
  lastUpdateDate: string | Date | null,
  cooldownDays: number = 7,
): {
  remainingDays: number;
  canPerformAction: boolean;
  isExpired: boolean;
} {
  if (!lastUpdateDate) {
    return {
      remainingDays: 0,
      canPerformAction: true,
      isExpired: true,
    };
  }

  const lastUpdate = new Date(lastUpdateDate);
  const now = new Date();
  const timeDiff = now.getTime() - lastUpdate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  const remainingDays = Math.max(0, cooldownDays - daysDiff);

  return {
    remainingDays,
    canPerformAction: remainingDays === 0,
    isExpired: daysDiff >= cooldownDays,
  };
}

/**
 * Calculates remaining time for a subscription expiration.
 * @param expireDate - The expiration date.
 * @param formatAsDayHour - If true, formats with days/hours/minutes/seconds; otherwise, uses larger units.
 * @returns Object with expiration status, remaining value, days, and suffix.
 * @example
 * calculateRemainingTimeForSubscription(new Date(Date.now() + 86400000), true) // Returns { isExpired: false, remainValue: 1, remainDays: 1, suffix: 'روز' }
 */
export function calculateRemainingTimeForSubscription(
  expireDate: Date,
  formatAsDayHour: boolean = false,
): {
  isExpired: boolean;
  remainValue: number | null;
  remainDays: number | null;
  suffix: string;
} {
  const now = new Date();
  const expires = new Date(expireDate);

  if (now > expires) {
    return {
      isExpired: true,
      remainValue: null,
      remainDays: null,
      suffix: "منقضی شده",
    };
  }

  const diffTime = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const remainDays = diffDays;

  if (formatAsDayHour) {
    if (diffDays >= 1) {
      return {
        isExpired: false,
        remainValue: diffDays,
        remainDays,
        suffix: "روز",
      };
    }

    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    if (diffHours >= 1) {
      return {
        isExpired: false,
        remainValue: diffHours,
        remainDays: 1,
        suffix: "ساعت",
      };
    }

    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    if (diffMinutes >= 1) {
      return {
        isExpired: false,
        remainValue: diffMinutes,
        remainDays: 1,
        suffix: "دقیقه",
      };
    }

    const diffSeconds = Math.ceil(diffTime / 1000);
    return {
      isExpired: false,
      remainValue: diffSeconds,
      remainDays: 1,
      suffix: "ثانیه",
    };
  }

  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365);
    return { isExpired: false, remainValue: years, remainDays, suffix: "سال" };
  }

  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    if (diffDays > 29 && diffDays < 31) {
      return { isExpired: false, remainValue: 30, remainDays, suffix: "روز" };
    }
    return { isExpired: false, remainValue: months, remainDays, suffix: "ماه" };
  }

  if (diffDays > 1) {
    return {
      isExpired: false,
      remainValue: diffDays,
      remainDays,
      suffix: "روز",
    };
  }

  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  return {
    isExpired: false,
    remainValue: diffHours,
    remainDays: 1,
    suffix: "ساعت",
  };
}

/**
 * Formats a date into Persian date and time string.
 * @param date - The date to format.
 * @returns Formatted Persian date and time string.
 * @example
 * formatPersianDateTime(new Date('2023-01-01T12:00:00')) // Returns 'شنبه ۱۰ دی ۱۴۰۱ ۱۲:۰۰'
 */
export function formatPersianDateTime(date: Date): string {
  const day = dayjs(date).locale("fa").calendar("jalali");
  const weekDay = PERSIAN_WEEKDAYS[day.weekday()];
  const formattedDate = day.format("DD MMMM YYYY");
  const time = day.format("HH:mm");

  return `${weekDay} ${formattedDate} ${time}`;
}

/**
 * Gets the current Persian date in YYYY/MM/DD format.
 * @returns Current Persian date string.
 * @example
 * getCurrentPersianDate() // Returns '۱۴۰۲/۱۰/۱۵' (depending on current date)
 */
export function getCurrentPersianDate(): string {
  return dayjs().calendar("jalali").format("YYYY/MM/DD");
}

/**
 * Gets the current time in Tehran timezone in HH:mm format.
 * @returns Current time string.
 * @example
 * getCurrentTimeInTehran() // Returns '۱۴:۳۰' (depending on current time)
 */
export function getCurrentTimeInTehran(): string {
  return dayjs().tz("Asia/Tehran").format("HH:mm");
}

/**
 * Gets the Persian weekday name for the current date.
 * @returns Persian weekday name.
 * @example
 * getCurrentPersianWeekday() // Returns 'شنبه' (if today is Saturday)
 */
export function getCurrentPersianWeekday(): PersianWeekdayType {
  const dayIndex = dayjs().locale("fa").weekday() % 7;
  return PERSIAN_WEEKDAYS[dayIndex];
}

/**
 * Gets the Persian weekday name for a date offset by given days from today.
 * @param days - Number of days to offset (positive for future, negative for past).
 * @returns Persian weekday name.
 * @example
 * getPersianWeekdayAfterDays(1) // Returns 'یکشنبه' (if today is Saturday)
 */
export function getPersianWeekdayAfterDays(days: number): PersianWeekdayType {
  const currentDate = dayjs();
  const targetDate = currentDate.add(days, "day");
  const targetDayIndex = targetDate.locale("fa").weekday() % 7;
  return PERSIAN_WEEKDAYS[targetDayIndex];
}

/**
 * Converts a Gregorian date to Persian date.
 * @param gregorianDate - The Gregorian date.
 * @returns Persian date in YYYY/MM/DD format.
 * @example
 * gregorianToPersian(new Date('2023-03-21')) // Returns '۱۴۰۲/۰۱/۰۱'
 */
export function gregorianToPersian(gregorianDate: Date): string {
  const { jy, jm, jd } = jalaali.toJalaali(
    gregorianDate.getFullYear(),
    gregorianDate.getMonth() + 1,
    gregorianDate.getDate(),
  );
  return `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`;
}

/**
 * Converts a Persian date to Gregorian date.
 * @param persianDate - Persian date in YYYY/MM/DD format.
 * @returns Gregorian Date object.
 * @example
 * persianToGregorian('۱۴۰۲/۰۱/۰۱') // Returns Date object for 2023-03-21
 */
export function persianToGregorian(persianDate: string): Date {
  const parts = persianDate.split("/").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error("Invalid Persian date format. Expected YYYY/MM/DD.");
  }
  const [year, month, day] = parts;
  const { gy, gm, gd } = jalaali.toGregorian(year, month, day);
  return new Date(gy, gm - 1, gd);
}
