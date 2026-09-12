"use client";

import { useEffect, useState } from "react";
import { searchPlaces, type PlaceResult } from "@/lib/place-search";
import type { Locale } from "@/i18n/config";

const DEBOUNCE_MS = 350;

/** Debounced OpenStreetMap place search (Photon). Empty until 3+ chars. */
export function usePlaceSearch(query: string, locale: Locale) {
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const active = query.trim().length >= 3;

  useEffect(() => {
    if (!active) return;
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      searchPlaces(q, locale, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setPlaces(results);
          setLoading(false);
        })
        .catch(() => {
          // offline / rate-limited: station results still work
          if (controller.signal.aborted) return;
          setPlaces([]);
          setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale, active]);

  return { places: active ? places : [], loading: active && loading };
}
