package ir.tehgo.i18n

import android.icu.text.SimpleDateFormat
import android.icu.util.ULocale
import java.util.Date

private val PersianDateLocale: ULocale =
    ULocale.Builder()
        .setLanguage("fa")
        .setRegion("IR")
        .setUnicodeLocaleKeyword("ca", "persian")
        .setUnicodeLocaleKeyword("nu", "latn")
        .build()

private val EnglishDateLocale: ULocale = ULocale.forLanguageTag("en-US")

/**
 * "شنبه 24 خرداد 1405، ساعت 00:00" (fa, Jalali calendar via Android's ICU) or
 * "Saturday, Jun 14, 2026 · 00:00" (en, Gregorian).
 */
fun formatRouteTimestamp(timestampMillis: Long, language: AppLanguage): String {
    val date = Date(timestampMillis)
    return if (language == AppLanguage.FA) {
        SimpleDateFormat("EEEE d MMMM yyyy، ساعت HH:mm", PersianDateLocale).format(date)
    } else {
        SimpleDateFormat("EEEE, MMM d, yyyy · HH:mm", EnglishDateLocale).format(date)
    }
}
