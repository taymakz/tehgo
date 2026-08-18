"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@workspace/ui/components/map";

export function MapFlyTo({
  center,
  routeKey,
}: {
  center: [number, number] | null;
  routeKey: string | null;
}) {
  const { map, isLoaded } = useMap();
  const lastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !isLoaded || !center || !routeKey) return;
    if (lastKeyRef.current === routeKey) return;
    lastKeyRef.current = routeKey;
    map.flyTo({ center, zoom: Math.max(map.getZoom(), 14), duration: 1000 });
  }, [map, isLoaded, center, routeKey]);

  return null;
}
