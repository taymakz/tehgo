import type { Station, StationsMap } from "@workspace/metro-core/types";

function normalizeWords(text: string): string[] {
  return text.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

/**
 * Matches regardless of UI locale (searching "Karaj" finds "کرج" and vice
 * versa) and word-by-word, so each query word only needs to prefix-match
 * some word in the name — "sa khu" matches "Salam Khubi".
 */
export function stationMatchesQuery(station: Station, query: string): boolean {
  const queryWords = normalizeWords(query);
  if (queryWords.length === 0) return true;
  const nameWords = [...normalizeWords(station.name), ...normalizeWords(station.translations.fa)];
  return queryWords.every((qw) => nameWords.some((nw) => nw.startsWith(qw)));
}

export function searchStations(
  stations: StationsMap,
  query: string,
  excludeId?: string | null
): Station[] {
  const all = Object.values(stations).filter((s) => s.id !== excludeId);
  const q = query.trim();
  if (!q) return all;
  return all.filter((s) => stationMatchesQuery(s, q));
}
