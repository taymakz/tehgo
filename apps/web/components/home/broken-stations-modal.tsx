"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Ban, Search } from "lucide-react";
import type { StationsMap } from "@workspace/metro-core/types";
import { lines } from "@workspace/metro-core/data";

import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import { isLightColor, toFaDigits } from "@/lib/station-visual";
import { useBrokenStationsStore } from "@/lib/stores/broken-stations";
import { stationMarkerBackground } from "@/lib/station-visual";
import { stationLabel } from "./station-search";

// Mobile-only replacement for the family-drawer outages view, mirroring
// the station picker: a plain full-screen portal with a search header,
// the marked stations pinned first, and a full-width clear-all action.
export function BrokenStationsModal({
  open,
  stations,
  onClose,
}: {
  open: boolean;
  stations: StationsMap;
  onClose: () => void;
}) {
  const dict = useDictionary();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const brokenIds = useBrokenStationsStore((s) => s.ids);
  const toggleBroken = useBrokenStationsStore((s) => s.toggle);
  const clearBroken = useBrokenStationsStore((s) => s.clear);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the search box each time the modal reopens
    setQuery("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const markedSet = useMemo(() => new Set(brokenIds), [brokenIds]);
  const sorted = useMemo(() => {
    const name = (id: string) => stationLabel(stations, id, locale);
    return [...Object.keys(stations)].sort((a, b) => {
      const aMarked = markedSet.has(a) ? 0 : 1;
      const bMarked = markedSet.has(b) ? 0 : 1;
      if (aMarked !== bMarked) return aMarked - bMarked;
      return name(a).localeCompare(name(b));
    });
  }, [stations, markedSet, locale]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sorted.filter(
        (id) =>
          stations[id]!.name.toLowerCase().includes(q) ||
          stations[id]!.translations.fa.includes(query.trim())
      )
    : sorted;

  if (!open) return null;

  const countLabel =
    locale === "fa" ? toFaDigits(`(${brokenIds.length})`) : `(${brokenIds.length})`;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex h-dvh flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2 border-b border-border p-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-accent"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.route.searchPlaceholder}
            className="ps-9"
          />
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {dict.route.outagesEmpty}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5 py-2">
            {filtered.map((id) => {
              const marked = markedSet.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleBroken(id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-sm",
                    marked
                      ? "bg-red-500/10 hover:bg-red-500/15"
                      : "hover:bg-accent"
                  )}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: stationMarkerBackground(stations[id]?.colors ?? []) }}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate font-medium",
                      marked && "text-red-600 line-through dark:text-red-400",
                      locale === "fa" && "font-vazir"
                    )}
                  >
                    {stationLabel(stations, id, locale)}
                  </span>
                  {marked && <Ban className="size-4 shrink-0 text-red-500" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {brokenIds.length > 0 && (
        <div className="shrink-0 border-t border-border p-3">
          <button
            type="button"
            onClick={clearBroken}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-red-500/10 text-base font-semibold text-red-600 transition-transform hover:bg-red-500/15 active:scale-95 dark:text-red-400",
              locale === "fa" && "font-vazir"
            )}
          >
            <Ban className="size-4 shrink-0" />
            {dict.route.clearOutages} {countLabel}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
