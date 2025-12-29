/**
 * Utility Functions for TehGo PWA
 *
 * This module contains commonly used utility functions across the application.
 *
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and merges Tailwind classes
 *
 * This function is the foundation for conditional class name handling.
 * It combines clsx's conditional class name capabilities with
 * tailwind-merge's intelligent Tailwind class merging.
 *
 * @param inputs - Class values to combine (strings, objects, arrays)
 * @returns Merged class string
 *
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-4', 'py-2') // 'px-4 py-2'
 *
 * // Conditional classes
 * cn('btn', isActive && 'btn-active') // 'btn btn-active' or 'btn'
 *
 * // Tailwind class merging (later values override earlier)
 * cn('px-4', 'px-8') // 'px-8'
 * cn('text-red-500', 'text-blue-500') // 'text-blue-500'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a number to Persian/Farsi digits
 *
 * @param num - Number or string to convert
 * @returns String with Persian digits
 *
 * @example
 * ```tsx
 * toPersianDigits(123) // '۱۲۳'
 * toPersianDigits('456') // '۴۵۶'
 * ```
 */
export function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Converts Persian/Farsi digits to English digits
 *
 * @param str - String with Persian digits
 * @returns String with English digits
 *
 * @example
 * ```tsx
 * toEnglishDigits('۱۲۳') // '123'
 * ```
 */
export function toEnglishDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
}

/**
 * Formats a number with locale-aware separators
 *
 * @param num - Number to format
 * @param locale - Locale for formatting ('fa' or 'en')
 * @returns Formatted number string
 *
 * @example
 * ```tsx
 * formatNumber(1234567, 'en') // '1,234,567'
 * formatNumber(1234567, 'fa') // '۱,۲۳۴,۵۶۷'
 * ```
 */
export function formatNumber(num: number, locale: 'fa' | 'en' = 'en'): string {
  const formatted = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US').format(num);
  return formatted;
}

/**
 * Delays execution for a specified duration
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 *
 * @example
 * ```tsx
 * await sleep(1000) // Wait 1 second
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a unique ID
 *
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Checks if code is running on the server
 *
 * @returns True if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Checks if code is running in a browser
 *
 * @returns True if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely parses JSON with error handling
 *
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

