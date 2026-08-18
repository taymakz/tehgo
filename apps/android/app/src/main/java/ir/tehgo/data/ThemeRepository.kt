package ir.tehgo.data

import android.content.Context
import ir.tehgo.ui.theme.ThemeMode

/** Persists the user's chosen theme mode (System/Light/Dark) across app restarts. */
object ThemeRepository {
    private const val PREFS_NAME = "tehgo_theme"
    private const val KEY_THEME_MODE = "theme_mode"

    fun getThemeMode(context: Context): ThemeMode {
        val stored = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_THEME_MODE, null)
        return ThemeMode.entries.find { it.name == stored } ?: ThemeMode.SYSTEM
    }

    fun setThemeMode(context: Context, mode: ThemeMode) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString(KEY_THEME_MODE, mode.name).apply()
    }
}
