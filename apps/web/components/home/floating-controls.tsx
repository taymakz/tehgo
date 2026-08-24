"use client";

import {
  ArrowLeftRight,
  ArrowRight,
  History,
  MapPin,
  MoreVertical,
  RotateCcw,
  X,
} from "lucide-react";
import type { RouteResult, StationsMap } from "@workspace/metro-core/types";

import { cn } from "@workspace/ui/lib/utils";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import { FLOATING_SURFACE, FLOATING_SURFACE_HOVER } from "@/lib/floating-control";
import { stationMarkerBackground, toFaDigits } from "@/lib/station-visual";
import { SettingsMenu } from "@/components/settings-menu";
import { stationLabel } from "./station-search";
import type { RouteType } from "./app-drawer";

export function FloatingRouteControls({
  stations,
  from,
  to,
  onOpenFrom,
  onOpenTo,
  onSwap,
  onDeleteFrom,
  onDeleteTo,
  onOpenRecents,
  onReset,
  routeType,
  onRouteTypeChange,
  showRouteTypeToggle,
  route,
  onOpenOptions,
}: {
  stations: StationsMap;
  from: string | null;
  to: string | null;
  onOpenFrom: () => void;
  onOpenTo: () => void;
  onSwap: () => void;
  onDeleteFrom: () => void;
  onDeleteTo: () => void;
  onOpenRecents: () => void;
  onReset: () => void;
  routeType: RouteType;
  onRouteTypeChange: (type: RouteType) => void;
  showRouteTypeToggle: boolean;
  route: RouteResult | null;
  onOpenOptions: () => void;
}) {
  const dict = useDictionary();
  const locale = useLocale();

  const bothSelected = !!from && !!to;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex flex-col items-center gap-2">
      <div className="pointer-events-auto flex w-[min(78vw,20rem)] flex-col gap-2">
        {bothSelected ? (
          <div className={cn("flex flex-col gap-2 rounded-2xl p-3 shadow-lg", FLOATING_SURFACE)}>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenFrom}
                className="flex min-w-0 flex-1 items-center gap-2 text-start text-sm font-medium"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: stationMarkerBackground(stations[from]?.colors ?? []) }}
                />
                <span className="truncate">{stationLabel(stations, from, locale)}</span>
                <ArrowRight className="size-3.5 shrink-0 opacity-60 rtl:rotate-180" />
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: stationMarkerBackground(stations[to]?.colors ?? []) }}
                />
                <span className="truncate">{stationLabel(stations, to, locale)}</span>
              </button>
              <button
                type="button"
                onClick={onSwap}
                aria-label={dict.route.swap}
                className="flex size-9 shrink-0 items-center justify-center rounded-full opacity-80 hover:bg-white/10 hover:opacity-100 dark:hover:bg-black/5"
              >
                <ArrowLeftRight className="size-4 rotate-90" />
              </button>
              <button
                type="button"
                onClick={onReset}
                aria-label={dict.route.reset}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10 dark:text-red-400"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-xs opacity-70">
                {route
                  ? locale === "fa"
                    ? toFaDigits(
                        `${route.totalStations} ${dict.route.stations} · ${route.totalTransfers} ${dict.route.transfers}`
                      )
                    : `${route.totalStations} ${dict.route.stations} · ${route.totalTransfers} ${dict.route.transfers}`
                  : dict.route.noRoute}
              </p>
              <div className="ms-auto flex shrink-0 items-center gap-1.5">
                {showRouteTypeToggle && (
                  <button
                    type="button"
                    onClick={() => onRouteTypeChange(routeType === "fastest" ? "fewest" : "fastest")}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    {routeType === "fastest" ? dict.route.fastest : dict.route.fewestTransfers}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenOptions}
                  aria-label={dict.route.options}
                  className="flex size-9 items-center justify-center rounded-full opacity-80 hover:bg-white/10 hover:opacity-100 dark:hover:bg-black/5"
                >
                  <MoreVertical className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <StationPill
                icon={<span className="size-2.5 shrink-0 rounded-full bg-current" />}
                label={dict.route.from}
                value={from ? stationLabel(stations, from, locale) : dict.route.fromPlaceholder}
                dotColor={from ? stationMarkerBackground(stations[from]?.colors ?? []) : undefined}
                filled={!!from}
                onClick={onOpenFrom}
                className="flex-1"
              />
              {from ? (
                <IconButton onClick={onDeleteFrom} label={dict.common.remove} destructive>
                  <X className="size-4" />
                </IconButton>
              ) : (
                <>
                  <IconButton onClick={onOpenRecents} label={dict.route.recentRoutes}>
                    <History className="size-5" />
                  </IconButton>
                  <SettingsMenu
                    triggerClassName={cn(
                      "flex size-[52px] shrink-0 items-center justify-center rounded-full shadow-lg transition-colors",
                      FLOATING_SURFACE,
                      FLOATING_SURFACE_HOVER
                    )}
                    iconClassName="size-5"
                  />
                </>
              )}
            </div>

            {from && (
              <div className="flex items-center gap-2">
                <StationPill
                  icon={<MapPin className="size-3.5 shrink-0" />}
                  label={dict.route.to}
                  value={to ? stationLabel(stations, to, locale) : dict.route.toPlaceholder}
                  dotColor={to ? stationMarkerBackground(stations[to]?.colors ?? []) : undefined}
                  filled={!!to}
                  onClick={onOpenTo}
                  className="flex-1"
                />
                {to && (
                  <IconButton onClick={onDeleteTo} label={dict.common.remove} destructive>
                    <X className="size-4" />
                  </IconButton>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  label,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-[52px] shrink-0 items-center justify-center rounded-full shadow-lg transition-colors",
        destructive
          ? "border border-red-800 bg-red-950 text-red-400 hover:bg-red-900 dark:border-red-200 dark:bg-red-50 dark:text-red-600 dark:hover:bg-red-100"
          : cn(FLOATING_SURFACE, FLOATING_SURFACE_HOVER)
      )}
    >
      {children}
    </button>
  );
}

function StationPill({
  icon,
  label,
  value,
  dotColor,
  filled,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dotColor?: string;
  filled: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[52px] items-center gap-2.5 rounded-full px-3.5 py-2 text-start text-sm shadow-lg transition-colors",
        FLOATING_SURFACE,
        FLOATING_SURFACE_HOVER,
        className
      )}
    >
      <span
        className="flex size-4 shrink-0 items-center justify-center"
        style={dotColor ? { color: dotColor } : undefined}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] opacity-70">{label}</span>
        <span className={cn("truncate text-sm font-medium", !filled && "font-normal opacity-70")}>
          {value}
        </span>
      </span>
    </button>
  );
}
