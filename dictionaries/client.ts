/**
 * Client-safe Dictionary Access
 *
 * This module provides synchronous dictionary access for client components.
 * Does NOT use 'server-only' so it can be imported in client components.
 *
 * Usage in Client Components:
 * ```tsx
 * 'use client'
 * import { getDictionarySync, type Dictionary } from '@/dictionaries/client'
 *
 * export function ClientComponent({ lang }: { lang: Locale }) {
 *   const dict = getDictionarySync(lang)
 *   return <button>{dict.common.save}</button>
 * }
 * ```
 */

import en from './en.json';
import fa from './fa.json';

/**
 * Supported locale type
 */
export type Locale = 'en' | 'fa';

/**
 * Dictionary type derived from English dictionary structure
 */
export type Dictionary = typeof en;

/**
 * List of all supported locales
 */
export const SUPPORTED_LOCALES: Locale[] = ['fa', 'en'];

/**
 * Default locale
 */
export const DEFAULT_LOCALE: Locale = 'fa';

/**
 * Type guard to check if a string is a valid locale
 */
export const hasLocale = (locale: string): locale is Locale => {
  return locale === 'en' || locale === 'fa';
};

/**
 * Synchronous dictionary access for client components
 */
const dictionariesSync = {
  en,
  fa,
} as const;

/**
 * Get dictionary synchronously (safe for client components)
 */
export const getDictionarySync = (locale: Locale): Dictionary => {
  return dictionariesSync[locale];
};
