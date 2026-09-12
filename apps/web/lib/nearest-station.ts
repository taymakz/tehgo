import type { Station, StationsMap } from "@workspace/metro-core/types";
import { haversineDistance } from "./geo";

/** Nearest station to a coordinate, skipping closed/excluded stops. */
export function findNearestStation(
  stations: StationsMap,
  coords: [number, number],
  opts: { excludeId?: string | null; excludeIds?: string[] } = {}
): Station | null {
  const excluded = new Set(opts.excludeIds ?? []);
  if (opts.excludeId) excluded.add(opts.excludeId);
  let best: Station | null = null;
  let bestDist = Infinity;
  for (const station of Object.values(stations)) {
    if (station.disabled || excluded.has(station.id)) continue;
    const dist = haversineDistance(coords, [
      parseFloat(station.longitude),
      parseFloat(station.latitude),
    ]);
    if (dist < bestDist) {
      bestDist = dist;
      best = station;
    }
  }
  return best;
}
