"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
  Ban,
  Check,
  ChevronRight,
  Download,
  Globe,
  Info,
  Languages,
  Map,
  Monitor,
  Moon,
  Palette,
  Search,
  Settings,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { GithubIcon } from "@/components/icons/github-icon";

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
  FamilyDrawerTrigger,
  FamilyDrawerViewContent,
  useFamilyDrawer,
  type ViewsRegistry,
} from "@workspace/ui/components/family-drawer";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { stations } from "@workspace/metro-core/data";
import type { Station } from "@workspace/metro-core/types";
import { useDictionary, useLocale, useSetLocale } from "@/i18n/dictionary-provider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { GITHUB_URL, MYKET_URL, WEBSITE_URL } from "@/lib/links";
import { useBrokenStationsStore } from "@/lib/stores/broken-stations";
import { stationMarkerBackground } from "@/lib/station-visual";
import { MyketIcon } from "@/components/icons/myket-icon";
import { TehGoIcon } from "@/components/icons/tehgo-icon";

const themeOptions = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

const localeLabels: Record<Locale, string> = {
  fa: "فارسی",
  en: "English",
};

export function SettingsMenu({
  triggerClassName,
  iconClassName,
}: {
  triggerClassName?: string;
  iconClassName?: string;
} = {}) {
  const dict = useDictionary();
  const locale = useLocale();
  const setLocale = useSetLocale();
  const { theme, setTheme } = useTheme();
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const brokenIds = useBrokenStationsStore((s) => s.ids);

  function switchLocale(next: Locale) {
    setLocale(next);
  }

  function MenuView() {
    const { setView } = useFamilyDrawer();
    return (
      <div>
        <h2
          className={cn(
            "mb-3 text-[19px] font-semibold text-foreground",
            locale === "fa" && "font-vazir"
          )}
        >
          {dict.settings.title}
        </h2>
        <div className="flex flex-col gap-2">
          <FamilyDrawerButton onClick={() => setView("theme")} className="justify-between">
            <span className="flex items-center gap-[15px]">
              <Palette className="size-4" />
              {dict.settings.theme}
            </span>
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
          </FamilyDrawerButton>
          <FamilyDrawerButton onClick={() => setView("language")} className="justify-between">
            <span className="flex items-center gap-[15px]">
              <Languages className="size-4" />
              {dict.settings.language}
            </span>
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
          </FamilyDrawerButton>
          <FamilyDrawerButton onClick={() => setView("outages")} className="justify-between">
            <span className="flex items-center gap-[15px]">
              <TriangleAlert className="size-4" />
              {dict.route.outages}
              {brokenIds.length > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {brokenIds.length}
                </span>
              )}
            </span>
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
          </FamilyDrawerButton>
          <FamilyDrawerButton onClick={() => setView("install")} className="justify-between">
            <span className="flex items-center gap-[15px]">
              <Download className="size-4" />
              {dict.pwa.installTitle}
            </span>
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
          </FamilyDrawerButton>
          <FamilyDrawerButton onClick={() => setView("about")} className="justify-between">
            <span className="flex items-center gap-[15px]">
              <Info className="size-4" />
              {dict.settings.about}
            </span>
            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
          </FamilyDrawerButton>
          <a
            href="/map.jpg"
            download="tehgo-metro-map.jpg"
            data-vaul-no-drag=""
            className="flex h-12 w-full items-center gap-[15px] rounded-[16px] bg-muted px-4 text-[17px] font-semibold text-foreground transition-transform focus:scale-95 focus-visible:ring-2 focus-visible:ring-ring active:scale-95 md:font-medium"
          >
            <Map className="size-4" />
            {dict.settings.downloadMap}
          </a>
        </div>
      </div>
    );
  }

  function ThemeView() {
    const { setView } = useFamilyDrawer();
    return (
      <div>
        <FamilyDrawerHeader
          icon={<Palette className="size-9" />}
          title={dict.settings.theme}
          className={cn(locale === "fa" && "font-vazir")}
        />
        <div className="mt-6 flex gap-2">
          {themeOptions.map(({ value, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 text-xs font-medium transition-colors",
                  active ? "bg-blue-600 text-white" : "bg-muted text-foreground hover:bg-accent"
                )}
              >
                <Icon className="size-5" />
                {dict.settings[
                  `theme${value[0]!.toUpperCase()}${value.slice(1)}` as
                    | "themeLight"
                    | "themeDark"
                    | "themeSystem"
                ]}
              </button>
            );
          })}
        </div>
        <div className="mt-7">
          <FamilyDrawerSecondaryButton
            onClick={() => setView("default")}
            className="bg-muted text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  function LanguageView() {
    const { setView } = useFamilyDrawer();
    return (
      <div>
        <FamilyDrawerHeader
          icon={<Languages className="size-9" />}
          title={dict.settings.language}
          className={cn(locale === "fa" && "font-vazir")}
        />
        <div className="mt-6 flex flex-col gap-1.5">
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => switchLocale(l)}
              className="flex items-center justify-between rounded-2xl bg-muted px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              <span className={cn(l === "fa" && "font-vazir")}>{localeLabels[l]}</span>
              {locale === l && <Check className="size-4 text-blue-500" />}
            </button>
          ))}
        </div>
        <div className="mt-7">
          <FamilyDrawerSecondaryButton
            onClick={() => setView("default")}
            className="bg-muted text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  function InstallView() {
    const { setView } = useFamilyDrawer();
    return (
      <div>
        <FamilyDrawerHeader
          icon={<Download className="size-9" />}
          title={dict.pwa.installTitle}
          className={cn(locale === "fa" && "font-vazir")}
        />
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void promptInstall()}
            disabled={isInstalled || !isInstallable}
            className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 text-start transition-colors hover:bg-accent disabled:opacity-50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <TehGoIcon className="size-full object-cover" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">{dict.pwa.installTitle}</span>
              <span className="truncate text-xs text-muted-foreground">
                {dict.pwa.installDescription}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => window.open(MYKET_URL, "_blank")}
            className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 text-start transition-colors hover:bg-accent"
          >
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <MyketIcon className="size-full" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">
                {dict.pwa.installAndroidTitle}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {dict.pwa.installAndroidDescription}
              </span>
            </span>
          </button>
        </div>
        <div className="mt-7">
          <FamilyDrawerSecondaryButton
            onClick={() => setView("default")}
            className="bg-muted text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  function AboutView() {
    const { setView } = useFamilyDrawer();
    return (
      <div>
        <FamilyDrawerHeader
          icon={<Info className="size-9" />}
          title={dict.settings.about}
          className={cn(locale === "fa" && "font-vazir")}
        />
        <div className="mt-6 flex flex-col gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 text-start transition-colors hover:bg-accent"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
              <GithubIcon className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">GitHub</span>
              <span className="truncate text-xs text-muted-foreground">
                github.com/taymakz/tehgo
              </span>
            </span>
          </a>
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3 text-start transition-colors hover:bg-accent"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <Globe className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold">
                {dict.settings.creatorWebsite}
              </span>
              <span className="truncate text-xs text-muted-foreground">taymakz.ir</span>
            </span>
          </a>
        </div>
        <div className="mt-7">
          <FamilyDrawerSecondaryButton
            onClick={() => setView("default")}
            className="bg-muted text-foreground"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  function OutagesView() {
    const { setView } = useFamilyDrawer();
    const brokenIds = useBrokenStationsStore((s) => s.ids);
    const toggle = useBrokenStationsStore((s) => s.toggle);
    const clear = useBrokenStationsStore((s) => s.clear);
    const [query, setQuery] = useState("");

    const allStations = Object.values(stations);
    const markedSet = new Set(brokenIds);
    const sorted = [...allStations].sort((a, b) => {
      const aMarked = markedSet.has(a.id) ? 0 : 1;
      const bMarked = markedSet.has(b.id) ? 0 : 1;
      if (aMarked !== bMarked) return aMarked - bMarked;
      return stationName(a).localeCompare(stationName(b));
    });
    const q = query.trim().toLowerCase();
    const filtered = q
      ? sorted.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.translations.fa.includes(query.trim())
        )
      : sorted;

    function stationName(s: Station) {
      return locale === "fa" ? s.translations.fa : s.name;
    }

    return (
      <div>
        <FamilyDrawerHeader
          icon={<TriangleAlert className="size-9" />}
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
        <div className="mt-3 flex max-h-[46vh] flex-col gap-1 overflow-y-auto pe-1">
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {dict.route.outagesEmpty}
            </p>
          )}
          {filtered.map((station) => {
            const marked = markedSet.has(station.id);
            return (
              <button
                key={station.id}
                type="button"
                onClick={() => toggle(station.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-start transition-colors",
                  marked
                    ? "bg-red-500/10 hover:bg-red-500/15"
                    : "bg-muted hover:bg-accent"
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: stationMarkerBackground(station.colors) }}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm font-medium",
                    marked && "text-red-600 line-through dark:text-red-400",
                    locale === "fa" && "font-vazir"
                  )}
                >
                  {stationName(station)}
                </span>
                {marked && <Ban className="size-4 shrink-0 text-red-500" />}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex gap-3">
          {brokenIds.length > 0 && (
            <FamilyDrawerSecondaryButton
              onClick={clear}
              className="flex-1 bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400"
            >
              <Ban className="size-4" />
              {dict.route.clearOutages} ({brokenIds.length})
            </FamilyDrawerSecondaryButton>
          )}
          <FamilyDrawerSecondaryButton
            onClick={() => setView("default")}
            className={cn("bg-muted text-foreground", brokenIds.length === 0 && "flex-1")}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {dict.common.back}
          </FamilyDrawerSecondaryButton>
        </div>
      </div>
    );
  }

  const views: ViewsRegistry = {
    default: MenuView,
    theme: ThemeView,
    language: LanguageView,
    outages: OutagesView,
    install: InstallView,
    about: AboutView,
  };

  return (
    <FamilyDrawerRoot views={views}>
      <FamilyDrawerTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className={cn("shadow-sm", triggerClassName)}
          aria-label={dict.settings.title}
        >
          <Settings className={cn("size-4", iconClassName)} />
        </Button>
      </FamilyDrawerTrigger>
      <FamilyDrawerPortal>
        <FamilyDrawerOverlay />
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
