"use client";

import { createContext, useEffect, useState, use } from "react";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { dirOf, type Locale } from "./config";
import type { Dictionary } from "./get-dictionary";
import en from "./dictionaries/en.json";
import fa from "./dictionaries/fa.json";

const dictionaries: Record<Locale, Dictionary> = { en, fa };

function setLocaleCookie(next: Locale) {
  document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
}

const DictionaryContext = createContext<{
  dict: Dictionary;
  locale: Locale;
  setLocale: (next: Locale) => void;
} | null>(null);

export function DictionaryProvider({
  dict: initialDict,
  locale: initialLocale,
  children,
}: {
  dict: Dictionary;
  locale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale);
  const dict = dictionaries[locale] ?? initialDict;
  const dir = dirOf(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  function setLocale(next: Locale) {
    if (next === locale) return;
    setLocaleCookie(next);
    setLocaleState(next);
    const segments = window.location.pathname.split("/");
    segments[1] = next;
    window.history.replaceState(null, "", segments.join("/") + window.location.search);
  }

  return (
    <DirectionProvider direction={dir}>
      <DictionaryContext value={{ dict, locale, setLocale }}>{children}</DictionaryContext>
    </DirectionProvider>
  );
}

export function useDictionary(): Dictionary {
  const ctx = use(DictionaryContext);
  if (!ctx) throw new Error("useDictionary must be used within DictionaryProvider");
  return ctx.dict;
}

export function useLocale(): Locale {
  const ctx = use(DictionaryContext);
  if (!ctx) throw new Error("useLocale must be used within DictionaryProvider");
  return ctx.locale;
}

export function useSetLocale(): (next: Locale) => void {
  const ctx = use(DictionaryContext);
  if (!ctx) throw new Error("useSetLocale must be used within DictionaryProvider");
  return ctx.setLocale;
}
