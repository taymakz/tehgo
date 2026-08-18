package ir.tehgo.i18n

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.time.DayOfWeek
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.TimeZone

/**
 * Instrumented tests for [formatRouteTimestamp] — this depends on `android.icu.text.SimpleDateFormat`
 * / `android.icu.util.ULocale`, which are Android-framework classes not available in a plain JVM
 * unit test (this repo has no Robolectric dependency to shadow them), so this lives in
 * app/src/androidTest and requires a device/emulator to run. See plan 019 for the reasoning.
 *
 * [formatRouteTimestamp] formats using the JVM's *default* [TimeZone] (it never sets one
 * explicitly on the `SimpleDateFormat` it builds), so these tests pin the default timezone to
 * "Asia/Tehran" (the app's whole domain is the Tehran/Karaj metro, and Iran has used a fixed
 * UTC+03:30 offset with no DST since 2022, which keeps the arithmetic here unambiguous) before
 * each test and restore the original default afterwards, so results don't depend on the
 * test device's configured timezone.
 *
 * Expected values are derived two ways, deliberately kept independent of `android.icu`:
 *  - English (Gregorian) output: computed via `java.time`/`DateTimeFormatter` — a completely
 *    separate JDK date/calendar implementation from `android.icu`, so if both agree the
 *    Gregorian-side formatting is very unlikely to be coincidentally wrong.
 *  - Persian (Jalali) output: `java.time` has no Jalali/Solar-Hijri calendar support, and this
 *    environment has no independent Jalali-conversion tool available to hand-verify an exact
 *    day/month, so per plan 019's guidance ("skip rather than guess"), the Jalali day-of-month
 *    and month name are only checked *structurally* (regex over the known 12 Jalali month
 *    names). The Jalali *year* is asserted exactly: for any Gregorian date safely after Nowruz
 *    (the Persian new year, always in the March 20-21 window), Jalali year = Gregorian year -
 *    621 — a well-established, unambiguous mapping once the date is not near that boundary. The
 *    weekday name and HH:mm are also asserted exactly, since those come from the shared
 *    `ZonedDateTime` fixture (day-of-week and time-of-day are calendar-system-independent) and
 *    are translated to their standard Persian names in-test, not sourced from ICU.
 *
 * A Nowruz/new-year-boundary case (the trickiest case for a Gregorian-to-Jalali conversion) is
 * intentionally NOT included: computing its correct expected output independently isn't possible
 * in this environment, and a wrong guessed expected value would be worse than no test.
 */
@RunWith(AndroidJUnit4::class)
class DateFormattingTest {

    private lateinit var originalDefaultTimeZone: TimeZone
    private val tehranZone: ZoneId = ZoneId.of("Asia/Tehran")

    @Before
    fun setUp() {
        originalDefaultTimeZone = TimeZone.getDefault()
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Tehran"))
    }

    @After
    fun tearDown() {
        TimeZone.setDefault(originalDefaultTimeZone)
    }

    @Test
    fun formatRouteTimestamp_english_matchesIndependentJavaTimeFormatting() {
        // 2024-06-15 12:34 in Asia/Tehran - comfortably after Nowruz, no calendar-boundary risk.
        val fixture = ZonedDateTime.of(2024, 6, 15, 12, 34, 0, 0, tehranZone)
        val timestampMillis = fixture.toInstant().toEpochMilli()

        val expected = fixture.format(
            DateTimeFormatter.ofPattern("EEEE, MMM d, yyyy · HH:mm", Locale.US),
        )

        val actual = formatRouteTimestamp(timestampMillis, AppLanguage.EN)

        assertEquals(expected, actual)
    }

    @Test
    fun formatRouteTimestamp_persian_matchesExpectedYearWeekdayAndTimeStructurally() {
        // Same fixture instant as the English test, so weekday/time are directly comparable.
        val fixture = ZonedDateTime.of(2024, 6, 15, 12, 34, 0, 0, tehranZone)
        val timestampMillis = fixture.toInstant().toEpochMilli()

        val expectedWeekday = persianWeekdayName(fixture.dayOfWeek)
        // Well past Nowruz 1403 (~2024-03-20), so Jalali year = Gregorian year - 621.
        val expectedYear = "1403"
        val expectedTime = "12:34"

        val actual = formatRouteTimestamp(timestampMillis, AppLanguage.FA)

        assertTrue(
            "expected output to start with weekday '$expectedWeekday', was: $actual",
            actual.startsWith(expectedWeekday),
        )
        assertTrue("expected output to contain year '$expectedYear', was: $actual", actual.contains(expectedYear))
        assertTrue("expected output to end with time '$expectedTime', was: $actual", actual.endsWith(expectedTime))
        assertTrue("expected '، ساعت ' separator in output, was: $actual", actual.contains("، ساعت "))

        val jalaliMonthNames =
            listOf(
                "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
                "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
            )
        assertTrue(
            "expected output to contain one of the 12 Jalali month names, was: $actual",
            jalaliMonthNames.any { actual.contains(it) },
        )

        val structuralPattern =
            Regex("^$expectedWeekday \\d{1,2} (${jalaliMonthNames.joinToString("|")}) $expectedYear، ساعت $expectedTime$")
        assertTrue(
            "expected output to match structural Jalali format, was: $actual",
            structuralPattern.matches(actual),
        )
    }

    @Test
    fun formatRouteTimestamp_sameInstant_differsBetweenLanguages() {
        val fixture = ZonedDateTime.of(2024, 6, 15, 12, 34, 0, 0, tehranZone)
        val timestampMillis = fixture.toInstant().toEpochMilli()

        val english = formatRouteTimestamp(timestampMillis, AppLanguage.EN)
        val persian = formatRouteTimestamp(timestampMillis, AppLanguage.FA)

        assertNotEquals(english, persian)
        assertTrue(english.isNotBlank())
        assertTrue(persian.isNotBlank())
    }

    private fun persianWeekdayName(dayOfWeek: DayOfWeek): String = when (dayOfWeek) {
        DayOfWeek.SATURDAY -> "شنبه"
        DayOfWeek.SUNDAY -> "یکشنبه"
        DayOfWeek.MONDAY -> "دوشنبه"
        DayOfWeek.TUESDAY -> "سه‌شنبه"
        DayOfWeek.WEDNESDAY -> "چهارشنبه"
        DayOfWeek.THURSDAY -> "پنجشنبه"
        DayOfWeek.FRIDAY -> "جمعه"
    }
}
