package ir.tehgo.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Durably tracks the last real screen the user was on (as a literal NavHost route string, e.g.
 * "routeMap/12/45"), independent of Android's own savedInstanceState/task-recents restoration.
 * MIUI (and other aggressive-battery-management OEM skins) can drop a backgrounded app's task
 * entirely rather than just killing the process, in which case no savedInstanceState Bundle is
 * ever delivered and NavController has nothing to restore from - reopening the app then always
 * lands back on the start destination. Reading this back on cold start lets MainActivity restore
 * the last screen regardless of which kind of restart actually happened.
 */
object NavigationStateRepository {
    private const val PREFS_NAME = "tehgo_navigation_state"
    private const val KEY_LAST_ROUTE = "last_route"
    private const val KEY_LAST_TAB = "last_tab"

    /** Destinations that aren't a meaningful place to reopen into (mid-flow pickers, etc.). */
    private val NonRestorableRoutes = setOf("chooseOnMap")

    // Deliberately NOT suspend, unlike the rest of this repository (see Plan 013): this is read
    // synchronously inside a `remember { mutableStateOf(...) } ` initializer in TehgoApp() so the
    // pending-restoration target is already known on the very first frame "tabs" composes.
    // Plan 025 fixed a visible "flash through the full tabs UI before landing on the real last
    // screen" bug that this exact synchronous read prevents from reoccurring - making this async
    // would reintroduce that regression (MainTabsScreen, including a possible live MapView, would
    // render for a frame before the restoration target resolved). The SharedPreferences read
    // itself is cheap (small string, OS-cached after first access), so the main-thread cost here
    // is negligible in practice.
    fun getLastRoute(context: Context): String? = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(KEY_LAST_ROUTE, null)

    suspend fun setLastRoute(context: Context, route: String) = withContext(Dispatchers.IO) {
        if (route in NonRestorableRoutes) return@withContext
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().putString(KEY_LAST_ROUTE, route).apply()
    }

    // Deliberately NOT suspend, same reasoning as getLastRoute above: read synchronously inside a
    // `rememberSaveable { ... }` initializer in MainTabsScreen to seed both `currentTab` and the
    // pager's `initialPage` on first composition - an async load would make the pager start on
    // HOME and visibly jump to the restored tab a moment later.

    /** Which bottom-nav tab (HOME/LINES/MAP/SETTINGS) was showing inside the "tabs" route. */
    fun getLastTab(context: Context): String? = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(KEY_LAST_TAB, null)

    suspend fun setLastTab(context: Context, tab: String) = withContext(Dispatchers.IO) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().putString(KEY_LAST_TAB, tab).apply()
    }
}
