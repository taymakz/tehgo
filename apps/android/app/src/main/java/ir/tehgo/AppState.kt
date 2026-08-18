package ir.tehgo

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroGraph
import ir.tehgo.data.MetroLine
import ir.tehgo.data.NavigationStateRepository
import ir.tehgo.data.RecentRoute
import ir.tehgo.data.Station
import ir.tehgo.data.ThemeRepository
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.ui.theme.ThemeMode

/**
 * Extracted app-level state holders for TehgoApp() (see plans/016-extract-mainactivity-state-holder.md).
 *
 * Each holder is a plain class wrapping the same `MutableState` instances that used to be
 * individual `var ... by remember { ... }` declarations directly inside TehgoApp() - grouping
 * them by concern without changing how, when, or in what order any of them is created, read, or
 * written. This deliberately does NOT introduce `androidx.lifecycle.ViewModel` or any DI
 * framework (see the plan's "Current state" section for why) - these are the standard Compose
 * "hoisted state class" pattern: a plain class holding `mutableStateOf` properties, created via
 * `remember { ... }`.
 *
 * Where the original declaration used `rememberSaveable`, the `rememberSaveable` call itself
 * stays in a `@Composable` `remember*State()` factory function below (so Compose's saved-instance
 * -state machinery keeps working exactly as before, including surviving process death/config
 * changes); the holder class just owns the resulting `MutableState` reference via Kotlin property
 * delegation (`by state`), so callers read/write `holder.property` instead of a bare local
 * variable. This is the "keep rememberSaveable at the call site, holder owns the MutableState
 * reference" approach the plan calls out as lower-risk than a custom `Saver`.
 *
 * The side-effecting code that reads/writes these holders (LaunchedEffect/DisposableEffect
 * bodies, the data-loading effect, the nav-state restoration listener) is deliberately NOT moved
 * here - it stays at its original call site in TehgoApp()/MainTabsScreen, unchanged apart from
 * now qualifying state with `holder.property` instead of a bare variable name. This keeps the
 * extraction to "where the state is declared", not "what touches it", which is the safest
 * approach for the nav-restoration logic in particular (see NavRestorationState below).
 */

/**
 * Language and theme-mode preference. Both are `rememberSaveable` (survive recomposition and
 * process death within the same task); `themeMode`'s initial value is additionally seeded from
 * [ThemeRepository] so it also survives a full app close/relaunch - callers still own the
 * `LaunchedEffect(prefs.themeMode) { ThemeRepository.setThemeMode(...) }` that writes changes
 * back, same as before.
 */
class AppPreferencesState(
    languageState: MutableState<AppLanguage>,
    themeModeState: MutableState<ThemeMode>,
) {
    var language: AppLanguage by languageState
    var themeMode: ThemeMode by themeModeState
}

@Composable
fun rememberAppPreferencesState(context: Context): AppPreferencesState {
    val languageState = rememberSaveable { mutableStateOf(AppLanguage.FA) }
    val themeModeState = rememberSaveable { mutableStateOf(ThemeRepository.getThemeMode(context)) }
    return remember { AppPreferencesState(languageState, themeModeState) }
}

/**
 * Bundled station/line/graph data, loaded once at startup (see the shared `LaunchedEffect(Unit)`
 * in TehgoApp) and effectively immutable afterward. Plain `remember`-lifetime, same as the
 * original individual `var ... by remember { mutableStateOf(...) }` declarations - does not
 * survive process death (nor did the original).
 *
 * `recentRoutes` lives here too, even though it does mutate after load (favorite/delete/record-
 * usage), specifically so it's loaded ONCE at this shared, above-the-pager level instead of inside
 * HomeScreen's own `remember`. HomeScreen used to own this state locally; the tap-driven tab
 * transition (MainTabsScreen's transient 2-page pager, see MainActivity.kt) mounts a second, fresh
 * HomeScreen instance for the duration of the slide, and that fresh instance's local `remember`
 * started back at an empty list before its own `LaunchedEffect(Unit)` reloaded it a moment later -
 * a visible "favorites/recent hide, then immediately reappear" flicker on every tap away from
 * Home. Hoisting the already-loaded list here means both the main pager's HomeScreen and the
 * transient pager's HomeScreen read the exact same state - nothing to reset, nothing to flicker.
 */
class LoadedDataState {
    var stations: List<Station> by mutableStateOf(emptyList())
    var lines: List<MetroLine> by mutableStateOf(emptyList())
    var paths: Map<String, List<LinePath>> by mutableStateOf(emptyMap())
    var graph: MetroGraph by mutableStateOf(emptyMap())
    var recentRoutes: List<RecentRoute> by mutableStateOf(emptyList())
}

@Composable
fun rememberLoadedDataState(): LoadedDataState = remember { LoadedDataState() }

/**
 * Cross-screen "choose on map" handoff (`chooseOnMapTarget`/`chooseOnMapResult`) plus the from/to
 * station selection hoisted above the NavHost. `fromStationId`/`toStationId` are `rememberSaveable`
 * (hoisted specifically because navigating to "chooseOnMap" and back disposes the "tabs"
 * composable's own remembered state); `chooseOnMapTarget`/`chooseOnMapResult` are plain `remember`,
 * matching the originals.
 */
class ChooseOnMapNavState(
    fromStationIdState: MutableState<String?>,
    toStationIdState: MutableState<String?>,
) {
    var chooseOnMapTarget: String by mutableStateOf("origin")
    var chooseOnMapResult: Pair<String, String>? by mutableStateOf(null)
    var fromStationId: String? by fromStationIdState
    var toStationId: String? by toStationIdState
}

@Composable
fun rememberChooseOnMapNavState(): ChooseOnMapNavState {
    val fromStationIdState = rememberSaveable { mutableStateOf<String?>(null) }
    val toStationIdState = rememberSaveable { mutableStateOf<String?>(null) }
    return remember { ChooseOnMapNavState(fromStationIdState, toStationIdState) }
}

/**
 * First-launch onboarding completion. Both fields start at their "not ready yet" defaults and are
 * filled in by TehgoApp's shared `LaunchedEffect(Unit)` (alongside the loaded data above) once
 * `OnboardingRepository.isCompleted` resolves - `onboardingStateLoaded` is folded into
 * `isDataLoaded` so the splash screen keeps covering this load exactly as before.
 */
class OnboardingState {
    var onboardingCompleted: Boolean by mutableStateOf(false)
    var onboardingStateLoaded: Boolean by mutableStateOf(false)
}

@Composable
fun rememberOnboardingState(): OnboardingState = remember { OnboardingState() }

/**
 * One-shot pending route-restoration target - see the DisposableEffect/LaunchedEffect pair in
 * TehgoApp that reads and writes `pendingRestoreRoute`. This is the highest-risk piece of state in
 * this file (MIUI-task-wipe restoration, already needed a real on-device bugfix once - see commit
 * 4a0fb5a and plans/025-fix-nav-restore-flash-through-tabs.md), so ONLY the state declaration
 * moved here, verbatim in behavior: the initial-value expression
 * (`NavigationStateRepository.getLastRoute(context)?.takeIf { it != "tabs" }`) is still evaluated
 * synchronously inside a `remember { ... }` block on first composition, exactly as before, and the
 * DisposableEffect/LaunchedEffect bodies that read/write it are left completely untouched at their
 * original call site in TehgoApp (only the bare `pendingRestoreRoute` references there become
 * `navRestoration.pendingRestoreRoute`).
 */
class NavRestorationState(initialPendingRoute: String?) {
    var pendingRestoreRoute: String? by mutableStateOf(initialPendingRoute)
}

@Composable
fun rememberNavRestorationState(context: Context): NavRestorationState = remember {
    NavRestorationState(NavigationStateRepository.getLastRoute(context)?.takeIf { it != "tabs" })
}
