export type Locale = "fa" | "en"

export type EnumTranslationMap = Record<
  string,
  {
    fa: string
    en: string
  }
>

export function translateEnumValue(
  translations: EnumTranslationMap,
  value: string,
  locale: Locale = "fa"
): string {
  return translations[value]?.[locale] ?? value
}
