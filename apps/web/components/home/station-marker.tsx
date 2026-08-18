"use client";

import type { Station } from "@workspace/metro-core/types";
import type { Locale } from "@/i18n/config";

import { MapMarker, MarkerContent, MarkerLabel, MarkerTooltip } from "@workspace/ui/components/map";
import { Hitbox } from "@workspace/ui/components/hitbox";
import { cn } from "@workspace/ui/lib/utils";
import { stationMarkerBackground } from "@/lib/station-visual";

export function StationMarker({
  station,
  label,
  roleLabel,
  locale,
  role,
  showLabel,
  dimmed,
  related,
  onClick,
}: {
  station: Station;
  label: string;
  roleLabel?: string;
  locale: Locale;
  role: "from" | "to" | null;
  showLabel: boolean;
  dimmed: boolean;
  related: boolean;
  onClick: () => void;
}) {
  return (
    <MapMarker
      longitude={parseFloat(station.longitude)}
      latitude={parseFloat(station.latitude)}
      onClick={onClick}
    >
      <MarkerContent>
        <Hitbox size="lg" radius="full" className="max-sm:after:!inset-[-24px]">
          <div
            className={cn(
              "size-3.5 rounded-full border border-white/80 shadow-sm transition-all",
              role && "size-5 border-2 ring-2 ring-offset-1",
              role === "from" && "ring-foreground",
              role === "to" && "ring-primary",
              dimmed && !related && "size-2"
            )}
            style={{
              background: stationMarkerBackground(station.colors),
              opacity: dimmed && !related ? 0.1 : 1,
            }}
          />
        </Hitbox>
        {showLabel && (
          <MarkerLabel
            className={cn(
              "rounded px-1 py-0.5 shadow-sm backdrop-blur",
              role
                ? "z-20 bg-blue-600 font-medium text-white"
                : "bg-background/85 text-foreground",
              locale === "fa" && "font-vazir"
            )}
          >
            {role ? roleLabel : label}
          </MarkerLabel>
        )}
      </MarkerContent>
      {!showLabel && (
        <MarkerTooltip className={cn(locale === "fa" && "font-vazir")}>{label}</MarkerTooltip>
      )}
    </MapMarker>
  );
}
