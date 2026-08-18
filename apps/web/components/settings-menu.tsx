"use client";

import { useTheme } from "next-themes";
import {
  ArrowLeft,
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
  Settings,
  Sun,
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
import { useDictionary, useLocale, useSetLocale } from "@/i18n/dictionary-provider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { GITHUB_URL, MYKET_URL, WEBSITE_URL } from "@/lib/links";
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

  const views: ViewsRegistry = {
    default: MenuView,
    theme: ThemeView,
    language: LanguageView,
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
