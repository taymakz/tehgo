"use client";

import { useRef, useState } from "react";
import {
  Accessibility,
  Armchair,
  ArrowLeft,
  ArrowLeftRight,
  Ban,
  Bath,
  Bike,
  Camera,
  ChevronsUpDown,
  Cigarette,
  Coffee,
  CreditCard,
  CupSoda,
  FireExtinguisher,
  ImageIcon,
  Info,
  Leaf,
  Link2,
  MapPinOff,
  PawPrint,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBasket,
  Trash2,
  UtensilsCrossed,
  Wifi,
  X,
} from "lucide-react";
import type { FacilityKey, RouteResult, StationsMap } from "@workspace/metro-core/types";
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
import { Forbidden2 } from "reicon";
import { ReiconIcon } from "@/components/icons/reicon-icon";
import { useDictionary, useLocale } from "@/i18n/dictionary-provider";
import type { Locale } from "@/i18n/config";
import { useRecentRoutesStore } from "@/lib/stores/recent-routes";
import { useBrokenStationsStore } from "@/lib/stores/broken-stations";
import { exportRouteImage } from "@/lib/export-route-image";
import { isLightColor, stationMarkerBackground, toFaDigits } from "@/lib/station-visual";
import { StationSearch, stationLabel } from "./station-search";

export type DrawerView =
  | "search"
  | "pick"
  | "station-details"
  | "recents"
  | "options"
  | "outages"
  | "export"
  | "share"
  | "share-copy";
export type RouteType = "fastest" | "fewest";

const FACILITIES: {
  key: FacilityKey;
  icon: typeof Coffee;
  label: { fa: string; en: string };
}[] = [
  { key: "wc", icon: Bath, label: { fa: "سرویس بهداشتی", en: "Restroom" } },
  { key: "elevator", icon: ChevronsUpDown, label: { fa: "آسانسور", en: "Elevator" } },
  { key: "coffeeShop", icon: Coffee, label: { fa: "کافی‌شاپ", en: "Coffee shop" } },
  { key: "groceryStore", icon: ShoppingBasket, label: { fa: "سوپرمارکت", en: "Grocery store" } },
  { key: "fastFood", icon: UtensilsCrossed, label: { fa: "فست‌فود", en: "Fast food" } },
  { key: "atm", icon: CreditCard, label: { fa: "عابربانک", en: "ATM" } },
  { key: "bicycleParking", icon: Bike, label: { fa: "پارک دوچرخه", en: "Bicycle parking" } },
  { key: "waterCooler", icon: CupSoda, label: { fa: "آب‌سردکن", en: "Water cooler" } },
  { key: "cleanFood", icon: Leaf, label: { fa: "غذای سالم", en: "Healthy food" } },
  { key: "blindPath", icon: Accessibility, label: { fa: "مسیر نابینایان", en: "Blind path" } },
  { key: "fireSuppressionSystem", icon: FireExtinguisher, label: { fa: "سیستم اطفاء حریق", en: "Fire suppression" } },
  { key: "fireExtinguisher", icon: FireExtinguisher, label: { fa: "کپسول آتش‌نشانی", en: "Fire extinguisher" } },
  { key: "metroPolice", icon: ShieldCheck, label: { fa: "پلیس مترو", en: "Metro police" } },
  { key: "creditTicketSales", icon: CreditCard, label: { fa: "فروش بلیت اعتباری", en: "Ticket sales" } },
  { key: "waitingChair", icon: Armchair, label: { fa: "صندلی انتظار", en: "Waiting chairs" } },
  { key: "camera", icon: Camera, label: { fa: "دوربین مداربسته", en: "CCTV" } },
  { key: "trashCan", icon: Trash2, label: { fa: "سطل زباله", en: "Trash can" } },
  { key: "smoking", icon: Cigarette, label: { fa: "محل سیگار", en: "Smoking area" } },
  { key: "petsAllowed", icon: PawPrint, label: { fa: "حیوانات خانگی", en: "Pets allowed" } },
  { key: "freeWifi", icon: Wifi, label: { fa: "وای‌فای رایگان", en: "Free Wi-Fi" } },
  { key: "prayerRoom", icon: Info, label: { fa: "نمازخانه", en: "Prayer room" } },
];

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
    const { setView } = useFamilyDrawer();
    const brokenIds = useBrokenStationsStore((s) => s.ids);
    const toggleBroken = useBrokenStationsStore((s) => s.toggle);
    const id = lastPickStationId;
    if (!id) return null;
    const isMarked = brokenIds.includes(id);
    const station = stations[id]!;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: stationMarkerBackground(station.colors ?? []) }}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {stationLabel(stations, id, locale)}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {(station.lines ?? []).map((lineId) => {
              const line = lines[lineId];
              if (!line) return null;
              return (
                <span
                  key={lineId}
                  className={cn(
                    "whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    isLightColor(line.color) ? "text-black" : "text-white"
                  )}
                  style={{ background: line.color }}
                >
                  {line.name[locale]}
                </span>
              );
            })}
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
        <FamilyDrawerButton onClick={() => setView("station-details")}>
          <Info className="size-4" />
          {dict.route.stationDetails}
        </FamilyDrawerButton>
        <button
          type="button"
          onClick={() => toggleBroken(id)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
            isMarked
              ? "border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400"
              : "border-input bg-background hover:bg-accent dark:bg-input/20 dark:hover:bg-accent/40"
          )}
        >
          <Ban className="size-4" />
          {isMarked ? dict.route.outagesUnmark : dict.route.outagesMark}
        </button>
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
                {locale === "fa"
                  ? toFaDigits(
                      `${entry.route.totalStations} ${dict.route.stations} · ${entry.route.totalTransfers} ${dict.route.transfers}`
                    )
                  : `${entry.route.totalStations} ${dict.route.stations} · ${entry.route.totalTransfers} ${dict.route.transfers}`}
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
    const brokenCount = useBrokenStationsStore((s) => s.ids.length);
    return (
      <>
        <header className="mb-4 flex h-[52px] items-center">
          <h2 className={cn("text-[19px] font-semibold text-foreground", locale === "fa" && "font-vazir")}>
            {dict.route.options}
          </h2>
        </header>
        <div className="space-y-2">
          <FamilyDrawerButton
            onClick={() => setView("outages")}
            className={cn(
              "bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400",
              locale === "fa" && "font-vazir"
            )}
          >
            <ReiconIcon icon={Forbidden2} size={16} />
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate">{dict.route.outages}</span>
              {brokenCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {brokenCount}
                </span>
              )}
            </span>
          </FamilyDrawerButton>
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

  function OutagesView() {
    const { setView } = useFamilyDrawer();
    const brokenIds = useBrokenStationsStore((s) => s.ids);
    const toggleBroken = useBrokenStationsStore((s) => s.toggle);
    const clearBroken = useBrokenStationsStore((s) => s.clear);
    const [query, setQuery] = useState("");

    const markedSet = new Set(brokenIds);
    const stationName = (id: string) => stationLabel(stations, id, locale);
    const sorted = [...Object.keys(stations)].sort((a, b) => {
      const aMarked = markedSet.has(a) ? 0 : 1;
      const bMarked = markedSet.has(b) ? 0 : 1;
      if (aMarked !== bMarked) return aMarked - bMarked;
      return stationName(a).localeCompare(stationName(b));
    });
    const q = query.trim().toLowerCase();
    const filtered = q
      ? sorted.filter((id) =>
          stations[id]!.name.toLowerCase().includes(q) ||
          stations[id]!.translations.fa.includes(query.trim())
        )
      : sorted;

    return (
      <div>
        <FamilyDrawerHeader
          icon={<ReiconIcon icon={Forbidden2} size={34} />}
          title={dict.route.outages}
          description={dict.route.outagesDescription}
          className={cn(locale === "fa" && "font-vazir")}
        />
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-input bg-background px-3 dark:bg-input/20">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.route.searchPlaceholder}
            className={cn(
              "w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground",
              locale === "fa" && "font-vazir"
            )}
          />
        </div>
        <div className="mt-3 flex max-h-[42vh] flex-col gap-1 overflow-y-auto pe-1">
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {dict.route.outagesEmpty}
            </p>
          )}
          {filtered.map((id) => {
            const marked = markedSet.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleBroken(id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-start transition-colors",
                  marked
                    ? "bg-red-500/10 hover:bg-red-500/15"
                    : "bg-muted hover:bg-accent"
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: stationMarkerBackground(stations[id]?.colors ?? []) }}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm font-medium",
                    marked && "text-red-600 line-through dark:text-red-400",
                    locale === "fa" && "font-vazir"
                  )}
                >
                  {stationName(id)}
                </span>
                {marked && <Ban className="size-4 shrink-0 text-red-500" />}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex gap-3">
          {brokenIds.length > 0 && (
            <FamilyDrawerSecondaryButton
              onClick={clearBroken}
              className="flex-1 bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400"
            >
              <Ban className="size-4" />
              {dict.route.clearOutages} ({brokenIds.length})
            </FamilyDrawerSecondaryButton>
          )}
          <FamilyDrawerSecondaryButton
            onClick={() => setView("options")}
            className={cn("bg-muted text-foreground", brokenIds.length === 0 && "flex-1")}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  function StationDetailsView() {
    const { setView } = useFamilyDrawer();
    const id = lastPickStationId;
    if (!id) return null;
    const station = stations[id]!;
    const primaryName = locale === "fa" ? station.translations.fa : station.name;
    const secondaryName = locale === "fa" ? station.name : station.translations.fa;

    const available = FACILITIES.filter(
      (f) => (station as unknown as Record<string, unknown>)[f.key] === true
    );

    return (
      <div>
        <FamilyDrawerHeader
          icon={<Info className="size-9" />}
          title={primaryName}
          description={secondaryName !== primaryName ? secondaryName : undefined}
          className={cn(locale === "fa" && "font-vazir")}
        />
        <div className="mt-4 flex flex-wrap items-center gap-1">
          {(station.lines ?? []).map((lineId) => {
            const line = lines[lineId];
            if (!line) return null;
            return (
              <span
                key={lineId}
                className={cn(
                  "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
                  isLightColor(line.color) ? "text-black" : "text-white"
                )}
                style={{ background: line.color }}
              >
                {line.name[locale]}
              </span>
            );
          })}
        </div>
        <div className="mt-5 max-h-[52vh] overflow-y-auto pe-1">
          {station.address && (
            <section className="rounded-xl bg-muted p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {dict.route.address}
              </p>
              <p className={cn("text-sm leading-6", locale === "fa" && "font-vazir")}>
                {station.address}
              </p>
            </section>
          )}
          <section className="mt-4">
            <p className={cn("mb-2 text-xs font-medium text-muted-foreground", locale === "fa" && "font-vazir")}>
              {dict.route.facilities}
            </p>
            {available.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="grid grid-cols-2 gap-1.5">
                {available.map(({ key, icon: Icon, label }) => (
                  <li
                    key={key}
                    className={cn(
                      "flex items-center gap-2 rounded-lg bg-muted px-2.5 py-2 text-xs font-medium",
                      locale === "fa" && "font-vazir"
                    )}
                  >
                    <Icon className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="truncate">{label[locale]}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="mt-5">
          <FamilyDrawerSecondaryButton
            onClick={() => setView("pick")}
            className="w-full bg-muted text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  const views: ViewsRegistry = {
    search: SearchView,
    pick: PickView,
    "station-details": StationDetailsView,
    recents: RecentsView,
    options: OptionsView,
    outages: OutagesView,
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
