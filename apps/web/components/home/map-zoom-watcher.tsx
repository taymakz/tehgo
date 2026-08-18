"use client";

import { useEffect } from "react";
import { useMap } from "@workspace/ui/components/map";

export function MapZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) return;
    onZoomChange(map.getZoom());
    const handleZoom = () => onZoomChange(map.getZoom());
    map.on("zoom", handleZoom);
    return () => {
      map.off("zoom", handleZoom);
    };
  }, [isLoaded, map, onZoomChange]);

  return null;
}
