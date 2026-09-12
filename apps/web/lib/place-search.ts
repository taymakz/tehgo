// Open + free place search via Photon (Komoot) on OpenStreetMap data.
// No API key, CORS-enabled public instance, generous rate limits.
// Docs: https://photon.komoot.io — © OpenStreetMap contributors.

export interface PlaceResult {
  id: string;
  name: string;
  detail: string | null;
  latitude: number;
  longitude: number;
}

// Tehran metro service area (Tehran + Karaj + Parand + Hashtgerd).
const BBOX = "50.6,35.3,52.0,36.0";
const TEHRAN_CENTER = { lat: 35.6892, lon: 51.389 };

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type: string;
    osm_id: number;
    name?: string;
    district?: string;
    city?: string;
    locality?: string;
  };
}

export async function searchPlaces(
  query: string,
  locale: "fa" | "en",
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({
    q,
    limit: "6",
    bbox: BBOX,
    lat: String(TEHRAN_CENTER.lat),
    lon: String(TEHRAN_CENTER.lon),
  });
  // Photon has no Persian localization; default returns local OSM names
  // (Persian script in Tehran), English for the en locale.
  if (locale === "en") params.set("lang", "en");
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, { signal });
  if (!res.ok) throw new Error(`place search failed: ${res.status}`);
  const data: { features?: PhotonFeature[] } = await res.json();
  const seen = new Set<string>();
  const out: PlaceResult[] = [];
  for (const f of data.features ?? []) {
    const name = f.properties.name?.trim();
    const [longitude, latitude] = f.geometry.coordinates ?? [];
    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    const key = `${name}|${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const detail = [f.properties.district, f.properties.city ?? f.properties.locality]
      .filter(Boolean)
      .join(locale === "fa" ? "، " : ", ");
    out.push({
      id: `${f.properties.osm_type}/${f.properties.osm_id}`,
      name,
      detail: detail || null,
      latitude,
      longitude,
    });
  }
  return out;
}
