"use client";

import { useEffect } from "react";
import { useMap } from "@workspace/ui/components/map";

export function MapReadyWatcher({ onReady }: { onReady: () => void }) {
  const { isLoaded } = useMap();

  useEffect(() => {
    if (isLoaded) onReady();
  }, [isLoaded, onReady]);

  return null;
}
