"use client";

import { useEffect, useState } from "react";

/**
 * Current time, refreshed on an interval. Each mounted consumer owns its own
 * timer so map markers (150+ instances) never subscribe — only the few
 * visible timetable/guide components tick.
 */
export function useTehranNow(refreshMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), refreshMs);
    return () => clearInterval(t);
  }, [refreshMs]);
  return now;
}
