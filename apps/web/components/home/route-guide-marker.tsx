"use client";

import { MapMarker, MarkerContent } from "@workspace/ui/components/map";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary } from "@/i18n/dictionary-provider";
import type { Locale } from "@/i18n/config";
import { isLightColor, toFaDigits } from "@/lib/station-visual";

export function RouteGuideMarker({
  longitude,
  latitude,
  lineColor,
  lineName,
  stationName,
  text,
  locale,
}: {
  longitude: number;
  latitude: number;
  lineColor: string;
  lineName: string;
  stationName: string;
  text: string | null;
  locale: Locale;
}) {
  const dict = useDictionary();
  const light = isLightColor(lineColor);
  const displayText = text && locale === "fa" ? toFaDigits(text) : text;

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
                className={cn(
                  "whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  light ? "text-black" : "text-white"
                )}
                style={{ background: lineColor }}
              >
                {lineName}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {stationName}
              </span>
            </div>

            {displayText && <p className="leading-5">{displayText}</p>}
            {!displayText && (
              <p className="text-muted-foreground">
                {locale === "fa" ? "مقصد" : dict.route.to}
              </p>
            )}
          </div>
        </div>
      </MarkerContent>
    </MapMarker>
  );
}
