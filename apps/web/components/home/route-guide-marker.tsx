"use client";

import { MapMarker, MarkerContent } from "@workspace/ui/components/map";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary } from "@/i18n/dictionary-provider";
import type { Locale } from "@/i18n/config";

export function RouteGuideMarker({
  longitude,
  latitude,
  lineColor,
  lineNumber,
  lineName,
  stationName,
  address,
  text,
  locale,
}: {
  longitude: number;
  latitude: number;
  lineColor: string;
  lineNumber: string;
  lineName: string;
  stationName: string;
  address?: string;
  text: string | null;
  locale: Locale;
}) {
  const dict = useDictionary();

  return (
    <MapMarker longitude={longitude} latitude={latitude}>
      <MarkerContent>
        <div className="relative">
          <div
            className="size-3.5 rounded-full border-2 border-white shadow-sm"
            style={{ background: lineColor }}
          />
          <div
            className={cn(
              "absolute top-full start-1/2 mt-2 w-60 -translate-x-1/2 rounded-xl border border-border bg-popover p-2.5 text-xs text-popover-foreground shadow-lg rtl:translate-x-1/2",
              locale === "fa" && "font-vazir"
            )}
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: lineColor }}
              >
                {lineNumber}
              </span>
              <span className="font-medium">{lineName}</span>
            </div>

            <p className="mb-1 text-sm font-semibold">{stationName}</p>

            {text && <p className="mb-1 leading-5">{text}</p>}

            {address && (
              <p className="text-muted-foreground">
                <span className="font-medium">{dict.route.address}:</span>{" "}
                <span className="font-vazir">{address}</span>
              </p>
            )}
          </div>
        </div>
      </MarkerContent>
    </MapMarker>
  );
}
