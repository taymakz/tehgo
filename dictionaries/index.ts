/**
 * Internationalization (i18n) Dictionaries Module
 *
 * This module provides type-safe access to localized strings across the application.
 * It uses Next.js Server Components pattern for optimal performance.
 *
 * Usage in Server Components:
 * ```tsx
 * import { getDictionary, type Locale } from '@/dictionaries'
 *
 * export default async function Page({ params }: { params: { lang: Locale } }) {
 *   const dict = await getDictionary(params.lang)
 *   return <h1>{dict.common.home}</h1>
 * }
 * ```
 *
 * Usage in Client Components (pass dictionary as props):
 * ```tsx
 * 'use client'
 * import type { Dictionary } from '@/dictionaries'
 *
 * export function ClientComponent({ dict }: { dict: Dictionary }) {
 *   return <button>{dict.common.save}</button>
 * }
 * ```
 */

import 'server-only';
import en from './en.json';
import fa from './fa.json';

/**
 * Dictionary configuration object
 *
 * Maps locale codes to their respective translation files.
 * Uses dynamic imports for code splitting and lazy loading.
 */
const dictionaries = {
  en: () => import('./en.json').then((module) => module.default),
  fa: () => import('./fa.json').then((module) => module.default),
};

/**
 * Supported locale type derived from dictionary keys
 * This ensures type safety when working with locale strings
 */
export type Locale = keyof typeof dictionaries;

/**
 * Dictionary type derived from English dictionary structure
 * All dictionaries must conform to this structure
 */
export type Dictionary = typeof en;

/**
 * List of all supported locales for iteration and validation
 */
export const SUPPORTED_LOCALES: Locale[] = ['fa', 'en'];

/**
 * Default locale used when user preference cannot be determined
 */
export const DEFAULT_LOCALE: Locale = 'fa';

/**
 * Type guard to check if a string is a valid locale
 *
 * @param locale - String to check
 * @returns Boolean indicating if locale is supported
 *
 * @example
 * ```tsx
 * if (hasLocale(params.lang)) {
 *   const dict = await getDictionary(params.lang)
 * }
 * ```
 */
export const hasLocale = (locale: string): locale is Locale => {
  return locale in dictionaries;
};

/**
 * Retrieves the dictionary for a given locale
 *
 * Uses dynamic imports for optimal code splitting.
 * Dictionary files are only loaded when needed.
 *
 * @param locale - The locale code to get dictionary for
 * @returns Promise resolving to the dictionary object
 *
 * @example
 * ```tsx
 * const dict = await getDictionary('fa')
 * console.log(dict.common.home) // 'خانه'
 * ```
 */
export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]();
};
