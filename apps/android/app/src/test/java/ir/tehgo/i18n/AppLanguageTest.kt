package ir.tehgo.i18n

import androidx.compose.ui.unit.LayoutDirection
import ir.tehgo.ui.theme.GeistFontFamily
import ir.tehgo.ui.theme.VazirmatnFontFamily
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertSame
import org.junit.Test

/**
 * Tests for the pure, non-`android.icu`-dependent parts of [AppLanguage.kt][AppLanguage] —
 * `layoutDirection`, `fontFamily`, `tag`, `other()`, and the [AppStrings] tables reached via
 * `AppLanguage.strings()`. See `DateFormattingTest` (app/src/androidTest) for
 * `formatRouteTimestamp`, which depends on `android.icu.*` and therefore cannot run as a plain
 * JVM unit test in this repo (no Robolectric dependency).
 *
 * Note on "key parity" between [EnglishStrings] and [PersianStrings]: [AppStrings] is a Kotlin
 * `data class` with named, non-nullable `String` constructor parameters — every key that exists
 * in one table is compile-time *required* to exist in the other (the module would not compile
 * otherwise). A runtime "does every EN key exist in FA" test would therefore be redundant with
 * the type system itself, so it is intentionally omitted here (per plan 019's STOP condition).
 * What the type system does *not* guarantee is that a value isn't accidentally left blank/empty
 * — [stringTablesHaveNoBlankValues] covers that instead.
 */
class AppLanguageTest {

    @Test
    fun tag_matchesExpectedLanguageCode() {
        assertEquals("en", AppLanguage.EN.tag)
        assertEquals("fa", AppLanguage.FA.tag)
    }

    @Test
    fun other_togglesBetweenLanguages() {
        assertEquals(AppLanguage.FA, AppLanguage.EN.other())
        assertEquals(AppLanguage.EN, AppLanguage.FA.other())
    }

    @Test
    fun layoutDirection_isRtlForPersianAndLtrForEnglish() {
        assertEquals(LayoutDirection.Rtl, AppLanguage.FA.layoutDirection)
        assertEquals(LayoutDirection.Ltr, AppLanguage.EN.layoutDirection)
    }

    @Test
    fun fontFamily_isVazirmatnForPersianAndGeistForEnglish() {
        assertSame(VazirmatnFontFamily, AppLanguage.FA.fontFamily)
        assertSame(GeistFontFamily, AppLanguage.EN.fontFamily)
        assertNotEquals(AppLanguage.FA.fontFamily, AppLanguage.EN.fontFamily)
    }

    @Test
    fun strings_returnsPersianTableForFaAndEnglishTableForEn() {
        assertSame(PersianStrings, AppLanguage.FA.strings())
        assertSame(EnglishStrings, AppLanguage.EN.strings())
    }

    @Test
    fun stringTablesHaveNoBlankValues() {
        // Reflect over AppStrings' declared String fields (data class constructor properties)
        // rather than hand-listing all ~120 keys, so this stays correct as fields are added.
        val stringFields = AppStrings::class.java.declaredFields.filter { it.type == String::class.java }
        assertFalse("expected AppStrings to declare at least one String field", stringFields.isEmpty())

        val blankInEnglish = stringFields.filter { field ->
            field.isAccessible = true
            (field.get(EnglishStrings) as String).isBlank()
        }.map { it.name }
        val blankInPersian = stringFields.filter { field ->
            field.isAccessible = true
            (field.get(PersianStrings) as String).isBlank()
        }.map { it.name }

        assertEquals("blank value(s) found in EnglishStrings: $blankInEnglish", emptyList<String>(), blankInEnglish)
        assertEquals("blank value(s) found in PersianStrings: $blankInPersian", emptyList<String>(), blankInPersian)
    }
}
