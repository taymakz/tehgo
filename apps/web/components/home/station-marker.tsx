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
  showTooltip,
  dimmed,
  related,
  outaged,
  onClick,
}: {
  station: Station;
  label: string;
  roleLabel?: string;
  locale: Locale;
  role: "from" | "to" | null;
  showLabel: boolean;
  showTooltip: boolean;
  dimmed: boolean;
  related: boolean;
  outaged?: boolean;
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
              "relative size-3.5 rounded-full border border-white/80 shadow-sm transition-all",
              role && "size-5 border-2 ring-2 ring-offset-1",
              role === "from" && "ring-foreground",
              role === "to" && "ring-primary",
              dimmed && !related && "size-2"
            )}
            style={{
              background: stationMarkerBackground(station.colors),
              opacity: dimmed && !related ? 0.1 : 1,
            }}
          >
            {outaged && (
              <>
                <span className="absolute inset-[-3px] rounded-full border-2 border-red-500 bg-background/70" />
                <span className="absolute top-1/2 start-1/2 h-0 w-[130%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-red-500 rtl:rotate-45" />
              </>
            )}
          </div>
        </Hitbox>
        {showLabel && (
          <MarkerLabel
            className={cn(
              "rounded px-1 py-0.5 shadow-sm",
              outaged
                ? "bg-red-600 font-medium text-white"
                : role
                  ? "z-20 bg-blue-600 font-medium text-white"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-50 dark:border-zinc-200 dark:bg-white dark:text-zinc-900",
              locale === "fa" && "font-vazir"
            )}
          >
            {role ? roleLabel : label}
          </MarkerLabel>
        )}
      </MarkerContent>
      {!showLabel && showTooltip && (
        <MarkerTooltip className={cn("px-3 py-1.5 text-lg", locale === "fa" && "font-vazir")}>
          {label}
        </MarkerTooltip>
      )}
    </MapMarker>
  );
}
