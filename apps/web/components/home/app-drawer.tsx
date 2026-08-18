"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ImageIcon,
  Link2,
  MapPinOff,
  Share2,
  X,
} from "lucide-react";
import type { RouteResult, StationsMap } from "@workspace/metro-core/types";
import { lines, paths } from "@workspace/metro-core/data";

import {
  FamilyDrawerAnimatedContent,
  FamilyDrawerAnimatedWrapper,
  FamilyDrawerButton,
  FamilyDrawerContent,
  FamilyDrawerHeader,
  FamilyDrawerOverlay,
  FamilyDrawerPortal,
  FamilyDrawerRoot,
  FamilyDrawerSecondaryButton,
  FamilyDrawerViewContent,
  useFamilyDrawer,
  type ViewsRegistry,
} from "@workspace/ui/components/family-drawer";
import { Spinner } from "@workspace/ui/components/spinner";
import { cn } from "@workspace/ui/lib/utils";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import type { Locale } from "@/i18n/config";
import { useRecentRoutesStore } from "@/lib/stores/recent-routes";
import { exportRouteImage } from "@/lib/export-route-image";
import { stationMarkerBackground } from "@/lib/station-visual";
import { StationSearch, stationLabel } from "./station-search";

export type DrawerView =
  | "search"
  | "pick"
  | "recents"
  | "options"
  | "export"
  | "share"
  | "share-copy";
export type RouteType = "fastest" | "fewest";

export function AppDrawer({
  stations,
  view,
  onViewChange,
  pickStationId,
  searchField,
  from,
  to,
  route,
  onSelectStation,
  onLocationFound,
  onSelectPick,
  onSelectRecent,
  onLostStation,
}: {
  stations: StationsMap;
  view: DrawerView | null;
  onViewChange: (view: DrawerView | null) => void;
  pickStationId: string | null;
  searchField: "from" | "to";
  from: string | null;
  to: string | null;
  route: RouteResult | null;
  onSelectStation: (id: string) => void;
  onLocationFound?: (id: string) => void;
  onSelectPick: (field: "from" | "to") => void;
  onSelectRecent: (from: string, to: string) => void;
  onLostStation: () => void;
}) {
  const dict = useDictionary();
  const locale = useLocale();
  const removeRecent = useRecentRoutesStore((s) => s.removeRoute);
  const recentRoutes = useRecentRoutesStore((s) => s.routes);

  const [exportTheme, setExportTheme] = useState<"light" | "dark">("dark");
  const [detailed, setDetailed] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedLocale, setCopiedLocale] = useState<Locale | null>(null);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep showing the last active view while the drawer's close animation
  // plays: the `view` prop goes null the instant we close, and swapping
  // FamilyDrawer's content to a different view mid-close (its height-measure
  // wrapper reacting to a content change) fights vaul's own slide-down
  // transition and makes the close look instant instead of animated.
  const [lastView, setLastView] = useState<DrawerView>("search");
  if (view && view !== lastView) setLastView(view);
  const [lastPickStationId, setLastPickStationId] = useState<string | null>(null);
  if (pickStationId && pickStationId !== lastPickStationId) setLastPickStationId(pickStationId);

  function buildShareUrl(targetLocale: Locale) {
    const url = new URL(window.location.href);
    const segments = url.pathname.split("/");
    segments[1] = targetLocale;
    url.pathname = segments.join("/");
    return url.toString();
  }

  async function handleCopyLink(targetLocale: Locale) {
    try {
      await navigator.clipboard.writeText(buildShareUrl(targetLocale));
      setCopiedLocale(targetLocale);
      if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current);
      copyResetTimeoutRef.current = setTimeout(() => setCopiedLocale(null), 1500);
    } catch {
      // clipboard permission denied or unavailable — nothing more we can do
    }
  }

  async function handleNativeShare() {
    const url = buildShareUrl(locale);
    const text =
      from && to
        ? `${stationLabel(stations, from, locale)} → ${stationLabel(stations, to, locale)}`
        : dict.common.appName;
    if (navigator.share) {
      try {
        await navigator.share({ title: dict.common.appName, text, url });
      } catch {
        // user cancelled, ignore
      }
    } else {
      await handleCopyLink(locale);
    }
  }

  async function handleGenerateImage() {
    if (!route || !from || !to) return;
    setGenerating(true);
    const getDisplay = (id: string) =>
      locale === "fa" ? (stations[id]?.translations.fa ?? id) : (stations[id]?.name ?? id);
    try {
      await exportRouteImage({
        route,
        fromStation: from,
        toStation: to,
        theme: exportTheme,
        detailLevel: detailed ? "detailed" : "summary",
        lang: locale,
        getStationDisplay: getDisplay,
        lines,
        paths,
      });
    } finally {
      setGenerating(false);
    }
  }

  function SearchView() {
    const excludeId = searchField === "from" ? to : from;
    return (
      <StationSearch
        stations={stations}
        onSelect={onSelectStation}
        onLocationFound={onLocationFound}
        excludeId={excludeId}
      />
    );
  }

  function PickView() {
    const id = lastPickStationId;
    if (!id) return null;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: stationMarkerBackground(stations[id]?.colors ?? []) }}
          />
          <span className="truncate text-sm font-medium">
            {stationLabel(stations, id, locale)}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelectPick("from")}
            className="rounded-xl border border-input bg-background px-3 py-3 text-sm font-medium hover:bg-accent dark:bg-input/20 dark:hover:bg-accent/40"
          >
            {dict.route.selectAsFrom}
          </button>
          <button
            type="button"
            onClick={() => onSelectPick("to")}
            className="rounded-xl border border-input bg-background px-3 py-3 text-sm font-medium hover:bg-accent dark:bg-input/20 dark:hover:bg-accent/40"
          >
            {dict.route.selectAsTo}
          </button>
        </div>
      </div>
    );
  }

  function RecentsView() {
    return (
      <div className="flex flex-col gap-1">
        <h2 className={cn("mb-1 text-[19px] font-semibold text-foreground", locale === "fa" && "font-vazir")}>
          {dict.route.recentRoutes}
        </h2>
        {recentRoutes.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {dict.route.recentRoutesEmpty}
          </p>
        )}
        {recentRoutes.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2 rounded-lg hover:bg-accent">
            <button
              type="button"
              onClick={() => onSelectRecent(entry.from, entry.to)}
              className="flex min-w-0 flex-1 flex-col gap-0.5 px-2 py-2 text-start"
            >
              <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium">
                <span className="truncate">{stationLabel(stations, entry.from, locale)}</span>
                <ArrowLeftRight className="size-3 shrink-0 opacity-60 rtl:-scale-x-100" />
                <span className="truncate">{stationLabel(stations, entry.to, locale)}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {entry.route.totalStations} {dict.route.stations} · {entry.route.totalTransfers}{" "}
                {dict.route.transfers}
              </span>
            </button>
            <button
              type="button"
              onClick={() => removeRecent(entry.id)}
              aria-label={dict.common.remove}
              className="me-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    );
  }

  function OptionsView() {
    const { setView } = useFamilyDrawer();
    return (
      <>
        <header className="mb-4 flex h-[52px] items-center">
          <h2 className={cn("text-[19px] font-semibold text-foreground", locale === "fa" && "font-vazir")}>
            {dict.route.options}
          </h2>
        </header>
        <div className="space-y-2">
          <FamilyDrawerButton
            onClick={onLostStation}
            className="bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400"
          >
            <MapPinOff className="size-4" />
            {dict.route.lostStation}
          </FamilyDrawerButton>
          <FamilyDrawerButton onClick={() => setView("share")}>
            <Share2 className="size-4" />
            {dict.route.share}
          </FamilyDrawerButton>
          <FamilyDrawerButton onClick={() => setView("export")}>
            <ImageIcon className="size-4" />
            {dict.route.exportImage}
          </FamilyDrawerButton>
        </div>
      </>
    );
  }

  function ShareView() {
    const { setView } = useFamilyDrawer();
    return (
      <div>
        <FamilyDrawerHeader
          icon={<Share2 className="size-9" />}
          title={dict.route.share}
          className={cn(locale === "fa" && "font-vazir")}
        />
        <div className="mt-6 flex flex-col gap-2">
          <FamilyDrawerButton onClick={() => setView("share-copy")}>
            <Link2 className="size-4" />
            {dict.route.copyLink}
          </FamilyDrawerButton>
          <FamilyDrawerButton onClick={handleNativeShare}>
            <Share2 className="size-4" />
            {dict.route.shareVia}
          </FamilyDrawerButton>
        </div>
        <div className="mt-7">
          <FamilyDrawerSecondaryButton
            onClick={() => setView("options")}
            className="bg-muted text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  function ShareCopyView() {
    const { setView } = useFamilyDrawer();
    return (
      <div>
        <FamilyDrawerHeader
          icon={<Link2 className="size-9" />}
          title={dict.route.copyLink}
          className={cn(locale === "fa" && "font-vazir")}
        />
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleCopyLink("fa")}
            className="rounded-xl border border-input bg-background px-3 py-3 text-sm font-medium hover:bg-accent dark:bg-input/20 dark:hover:bg-accent/40"
          >
            <span className="font-vazir">{copiedLocale === "fa" ? "کپی شد!" : "فارسی"}</span>
          </button>
          <button
            type="button"
            onClick={() => handleCopyLink("en")}
            className="rounded-xl border border-input bg-background px-3 py-3 text-sm font-medium hover:bg-accent dark:bg-input/20 dark:hover:bg-accent/40"
          >
            {copiedLocale === "en" ? <span className="font-vazir">کپی شد!</span> : "English"}
          </button>
        </div>
        <div className="mt-7">
          <FamilyDrawerSecondaryButton
            onClick={() => setView("share")}
            className="bg-muted text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  function ExportView() {
    const { setView } = useFamilyDrawer();
    return (
      <div>
        <FamilyDrawerHeader
          icon={<ImageIcon className="size-9" />}
          title={dict.route.exportImage}
          className={cn(locale === "fa" && "font-vazir")}
        />
        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">{dict.route.exportImageTheme}</p>
            <div className="flex gap-2">
              <SegButton active={exportTheme === "light"} onClick={() => setExportTheme("light")}>
                {dict.settings.themeLight}
              </SegButton>
              <SegButton active={exportTheme === "dark"} onClick={() => setExportTheme("dark")}>
                {dict.settings.themeDark}
              </SegButton>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">{dict.route.detailLevel}</p>
            <div className="flex gap-2">
              <SegButton active={!detailed} onClick={() => setDetailed(false)}>
                {dict.route.detailSimple}
              </SegButton>
              <SegButton active={detailed} onClick={() => setDetailed(true)}>
                {dict.route.detailDetailed}
              </SegButton>
            </div>
          </div>
        </div>
        <div className="mt-7 flex gap-3">
          <FamilyDrawerSecondaryButton
            onClick={() => setView("options")}
            className="bg-muted text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
          <FamilyDrawerSecondaryButton
            onClick={handleGenerateImage}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            {generating ? <Spinner className="size-4" /> : <ImageIcon className="size-4" />}
            {dict.route.download}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  const views: ViewsRegistry = {
    search: SearchView,
    pick: PickView,
    recents: RecentsView,
    options: OptionsView,
    export: ExportView,
    share: ShareView,
    "share-copy": ShareCopyView,
  };

  return (
    <FamilyDrawerRoot
      open={view !== null}
      onOpenChange={(open) => {
        if (!open) onViewChange(null);
      }}
      view={lastView}
      onViewChange={(v) => onViewChange(v as DrawerView)}
      views={views}
    >
      <FamilyDrawerPortal>
        <FamilyDrawerOverlay onClick={() => onViewChange(null)} />
        <FamilyDrawerContent>
          <FamilyDrawerAnimatedWrapper>
            <FamilyDrawerAnimatedContent>
              <FamilyDrawerViewContent />
            </FamilyDrawerAnimatedContent>
          </FamilyDrawerAnimatedWrapper>
        </FamilyDrawerContent>
      </FamilyDrawerPortal>
    </FamilyDrawerRoot>
  );
}

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-input bg-background text-muted-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
