package ir.tehgo.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Tracks whether the first-launch onboarding flow has been completed. */
object OnboardingRepository {
    private const val PREFS_NAME = "tehgo_onboarding"
    private const val KEY_COMPLETED = "completed"

    suspend fun isCompleted(context: Context): Boolean = withContext(Dispatchers.IO) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getBoolean(KEY_COMPLETED, false)
    }

    suspend fun setCompleted(context: Context) = withContext(Dispatchers.IO) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().putBoolean(KEY_COMPLETED, true).apply()
    }
}
