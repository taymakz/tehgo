package ir.tehgo

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Route
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Train
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material.icons.outlined.Route
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Train
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import ir.tehgo.data.GraphRepository
import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroGraph
import ir.tehgo.data.MetroLine
import ir.tehgo.data.MetroLinesRepository
import ir.tehgo.data.NavigationStateRepository
import ir.tehgo.data.OnboardingRepository
import ir.tehgo.data.RecentRoute
import ir.tehgo.data.RecentRoutesRepository
import ir.tehgo.data.Station
import ir.tehgo.data.StationsRepository
import ir.tehgo.data.ThemeRepository
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import ir.tehgo.i18n.strings
import ir.tehgo.routing.RouteFinder
import ir.tehgo.routing.RouteResult
import ir.tehgo.ui.components.FloatingBottomNav
import ir.tehgo.ui.components.NavItem
import ir.tehgo.ui.components.ThemeRevealHost
import ir.tehgo.ui.components.rememberThemeRevealController
import ir.tehgo.ui.home.HomeScreen
import ir.tehgo.ui.lines.LineDetailScreen
import ir.tehgo.ui.lines.LinesScreen
import ir.tehgo.ui.map.ChooseOnMapScreen
import ir.tehgo.ui.map.MapScreen
import ir.tehgo.ui.onboarding.OnboardingScreen
import ir.tehgo.ui.onboarding.SplashScreen
import ir.tehgo.ui.routedetail.RouteDetailScreen
import ir.tehgo.ui.routedetail.RouteMapOverlay
import ir.tehgo.ui.settings.SettingsScreen
import ir.tehgo.ui.theme.TehgoTheme
import ir.tehgo.ui.theme.ThemeMode
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            TehgoApp()
        }
    }
}

private enum class TabDestination(val outlineIcon: ImageVector, val filledIcon: ImageVector) {
    HOME(Icons.Outlined.Route, Icons.Filled.Route),
    LINES(Icons.Outlined.Train, Icons.Filled.Train),
    MAP(Icons.Outlined.Map, Icons.Filled.Map),
    SETTINGS(Icons.Outlined.Settings, Icons.Filled.Settings),
    ;

    fun label(strings: AppStrings): String = when (this) {
        HOME -> strings.navRoute
        LINES -> strings.navLines
        MAP -> strings.map
        SETTINGS -> strings.settingsTitle
    }
}

/**
 * Forward = towards Start, backward = towards End. This reads correctly in both LTR and RTL
 * since Start/End are layout-direction-aware (Start=left/End=right in en, flipped in fa).
 */
private val ForwardSlideDirection = AnimatedContentTransitionScope.SlideDirection.Start
private val BackwardSlideDirection = AnimatedContentTransitionScope.SlideDirection.End

@Composable
fun TehgoApp() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    // Read the persisted theme mode on init - otherwise the user's choice would silently revert
    // to SYSTEM on a full app close/relaunch (rememberSaveable alone only survives configuration
    // changes and process death within the same task, not a fresh task/process). Every change is
    // written back below via the LaunchedEffect(prefs.themeMode) effect.
    val prefs = rememberAppPreferencesState(context)
    LaunchedEffect(prefs.themeMode) {
        ThemeRepository.setThemeMode(context, prefs.themeMode)
    }
    val strings = prefs.language.strings()
    val systemDark = isSystemInDarkTheme()
    val darkTheme = when (prefs.themeMode) {
        ThemeMode.SYSTEM -> systemDark
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }

    // The Activity window's own background (Theme.Tehgo, a light base theme with no dark
    // variant) shows through as a white flash whenever a native Android View - like MapLibre's
    // MapView - is attached and needs a moment to paint its own first frame, since that gap
    // isn't covered by Compose content. Keep the window background itself in sync with the
    // app's current theme so there's nothing white left to flash through in dark mode.
    SideEffect {
        (context as? android.app.Activity)?.window?.setBackgroundDrawable(
            android.graphics.drawable.ColorDrawable(if (darkTheme) 0xFF141414.toInt() else 0xFFFFFFFF.toInt()),
        )
    }
    // Status/nav bar icons need to follow the APP's own resolved theme (darkTheme), not just
    // the OS's - the in-app Light/Dark/System picker can diverge from the OS setting, and
    // enableEdgeToEdge()'s default auto-detection (evaluated once in onCreate) only tracks the
    // OS. isAppearanceLight*Bars = true means DARK icons (for a light background behind them);
    // false means LIGHT icons (for a dark background) - so this is the inverse of darkTheme,
    // matching the same "light background needs dark icons" logic used for the window-background
    // ColorDrawable above.
    SideEffect {
        (context as? android.app.Activity)?.window?.let { window ->
            val insetsController = androidx.core.view.WindowCompat.getInsetsController(window, window.decorView)
            insetsController.isAppearanceLightStatusBars = !darkTheme
            insetsController.isAppearanceLightNavigationBars = !darkTheme
        }
    }
    // Both start at their "not ready yet" defaults and are filled in by the LaunchedEffect below,
    // now that OnboardingRepository.isCompleted is suspend (Plan 013). onboardingStateLoaded is
    // folded into isDataLoaded below so the splash screen keeps covering this load the same way
    // it already covers stations/lines/graph - onboardingCompleted's real value is guaranteed to
    // be in place before gating ever inspects it, so there's no flash of onboarding-then-skip (or
    // vice versa).
    val onboarding = rememberOnboardingState()
    val data = rememberLoadedDataState()
    LaunchedEffect(Unit) {
        data.stations = StationsRepository.loadStations(context)
        data.lines = MetroLinesRepository.loadLines(context)
        data.paths = MetroLinesRepository.loadPaths(context)
        data.graph = GraphRepository.loadGraph(context)
        data.recentRoutes = RecentRoutesRepository.load(context)
        onboarding.onboardingCompleted = OnboardingRepository.isCompleted(context)
        onboarding.onboardingStateLoaded = true
    }
    val stationsById = remember(data.stations) { data.stations.associateBy { it.id } }
    val linesById = remember(data.lines) { data.lines.associateBy { it.id } }

    // "Choose on map" is a full-screen destination pushed from Home's station selector; its
    // result is handed back via this shared state rather than SavedStateHandle plumbing.
    // fromStationId/toStationId are hoisted above the NavHost (rather than living inside
    // HomeScreen) because navigating to "chooseOnMap" and back disposes the "tabs" composable's
    // own remembered state - anything that needs to survive that round trip has to live above
    // the NavHost instead.
    val chooseOnMapNav = rememberChooseOnMapNavState()

    LaunchedEffect(chooseOnMapNav.chooseOnMapResult) {
        val (target, stationId) = chooseOnMapNav.chooseOnMapResult ?: return@LaunchedEffect
        if (target == "origin") chooseOnMapNav.fromStationId = stationId else chooseOnMapNav.toStationId = stationId
        chooseOnMapNav.chooseOnMapResult = null
    }

    val revealController = rememberThemeRevealController()

    val isDataLoaded = data.stations.isNotEmpty() && data.lines.isNotEmpty() && data.graph.isNotEmpty() && onboarding.onboardingStateLoaded
    // Data loading (bundled JSON, near-instant) routinely finishes well under the splash's own
    // minimum display time; gating on this too avoids an unreadably fast flash of the logo.
    var splashMinDurationElapsed by remember { mutableStateOf(false) }

    CompositionLocalProvider(LocalLayoutDirection provides prefs.language.layoutDirection) {
        TehgoTheme(darkTheme = darkTheme, fontFamily = prefs.language.fontFamily) {
            if (!isDataLoaded || !splashMinDurationElapsed) {
                SplashScreen(onMinDurationElapsed = { splashMinDurationElapsed = true })
                return@TehgoTheme
            }

            if (!onboarding.onboardingCompleted) {
                OnboardingScreen(
                    language = prefs.language,
                    themeMode = prefs.themeMode,
                    strings = strings,
                    onLanguageSelected = { prefs.language = it },
                    onThemeModeSelected = { prefs.themeMode = it },
                    onFinish = {
                        coroutineScope.launch {
                            OnboardingRepository.setCompleted(context)
                            onboarding.onboardingCompleted = true
                        }
                    },
                )
                return@TehgoTheme
            }

            ThemeRevealHost(controller = revealController) {
                val navController = rememberNavController()

                // One-shot: non-null only for the initial frame(s) between app launch and the
                // restoration navigate() below actually landing - see the composable("tabs")
                // block, which uses this to avoid mounting MainTabsScreen's full pager (including
                // a possible live MapView) just to immediately discard it when the real last
                // screen was something else. Computed synchronously (not inside a LaunchedEffect)
                // so it's already available the first time "tabs" composes. Cleared after the
                // one-time restoration attempt (success or failure) so any LATER visit to "tabs"
                // (e.g. via the back button) renders normally.
                val navRestoration = rememberNavRestorationState(context)

                // Mirrors the current destination into durable storage on every navigation, and
                // restores it below - a second, app-owned layer on top of Navigation-Compose's
                // own savedInstanceState-based restoration. Some OEM battery managers (MIUI in
                // particular) drop a backgrounded app's whole task rather than just killing the
                // process; when that happens there's no savedInstanceState Bundle at all, so
                // NavController has nothing to restore from and always starts fresh at "tabs".
                DisposableEffect(navController) {
                    val listener = NavController.OnDestinationChangedListener { _, destination, arguments ->
                        val routePattern = destination.route ?: return@OnDestinationChangedListener
                        val resolvedRoute = arguments?.keySet().orEmpty().fold(routePattern) { route, key ->
                            arguments?.getString(key)?.let { route.replace("{$key}", it) } ?: route
                        }
                        coroutineScope.launch {
                            NavigationStateRepository.setLastRoute(context, resolvedRoute)
                        }
                    }
                    navController.addOnDestinationChangedListener(listener)
                    onDispose { navController.removeOnDestinationChangedListener(listener) }
                }
                LaunchedEffect(navController) {
                    val target = navRestoration.pendingRestoreRoute
                    if (target != null) {
                        try {
                            navController.navigate(target)
                        } catch (_: IllegalArgumentException) {
                            // Stale/unrecognized route (e.g. after an app update) - just stay on tabs.
                        }
                        navRestoration.pendingRestoreRoute = null
                    }
                }

                NavHost(
                    navController = navController,
                    startDestination = "tabs",
                    enterTransition = { slideIntoContainer(ForwardSlideDirection) },
                    exitTransition = { slideOutOfContainer(ForwardSlideDirection) },
                    popEnterTransition = { slideIntoContainer(BackwardSlideDirection) },
                    popExitTransition = { slideOutOfContainer(BackwardSlideDirection) },
                ) {
                    composable("tabs") {
                        // While a restoration navigate() is pending, render the cheap SplashScreen
                        // instead of the full pager so nothing expensive (station/line rendering,
                        // and critically no MapView mounting) happens just to be immediately
                        // discarded once the real last screen takes over. See pendingRestoreRoute
                        // above.
                        if (navRestoration.pendingRestoreRoute != null) {
                            SplashScreen()
                        } else {
                            MainTabsScreen(
                                language = prefs.language,
                                themeMode = prefs.themeMode,
                                darkTheme = darkTheme,
                                strings = strings,
                                stations = data.stations,
                                lines = data.lines,
                                paths = data.paths,
                                graph = data.graph,
                                recentRoutes = data.recentRoutes,
                                onRecentRoutesChange = { data.recentRoutes = it },
                                fromStationId = chooseOnMapNav.fromStationId,
                                toStationId = chooseOnMapNav.toStationId,
                                onFromStationIdChange = { chooseOnMapNav.fromStationId = it },
                                onToStationIdChange = { chooseOnMapNav.toStationId = it },
                                onOpenLine = { line -> navController.navigate("lineDetail/${line.id}") },
                                onOpenChooseOnMap = { target ->
                                    chooseOnMapNav.chooseOnMapTarget = target
                                    navController.navigate("chooseOnMap")
                                },
                                onFindRoute = { fromId, toId -> navController.navigate("routeDetail/$fromId/$toId") },
                                onLanguageSelected = { newLanguage, _ -> prefs.language = newLanguage },
                                onThemeModeSelected = { newMode, offset ->
                                    revealController.reveal(offset) { prefs.themeMode = newMode }
                                },
                            )
                        }
                    }
                    composable(
                        route = "lineDetail/{lineId}",
                        arguments = listOf(navArgument("lineId") { type = NavType.StringType }),
                    ) { entry ->
                        val lineId = entry.arguments?.getString("lineId")
                        val line = linesById[lineId]
                        if (line != null) {
                            Scaffold(
                                topBar = {
                                    AppTopBar(
                                        title = line.localizedName(prefs.language),
                                        strings = strings,
                                        onBack = { navController.popBackStack() },
                                    )
                                },
                            ) { padding ->
                                LineDetailScreen(
                                    line = line,
                                    paths = data.paths[lineId].orEmpty(),
                                    stationsById = stationsById,
                                    language = prefs.language,
                                    strings = strings,
                                    modifier = Modifier.padding(padding),
                                )
                            }
                        }
                    }
                    composable(
                        route = "routeDetail/{fromId}/{toId}",
                        arguments = listOf(
                            navArgument("fromId") { type = NavType.StringType },
                            navArgument("toId") { type = NavType.StringType },
                        ),
                        deepLinks = listOf(
                            navDeepLink { uriPattern = "tehgo://route/{fromId}/{toId}" },
                        ),
                    ) { entry ->
                        val fromId = entry.arguments?.getString("fromId")
                        val toId = entry.arguments?.getString("toId")
                        if (fromId != null && toId != null) {
                            RouteDetailScreen(
                                fromStationId = fromId,
                                toStationId = toId,
                                stations = data.stations,
                                lines = data.lines,
                                paths = data.paths,
                                graph = data.graph,
                                language = prefs.language,
                                darkTheme = darkTheme,
                                strings = strings,
                                onRecentRoutesChange = { data.recentRoutes = it },
                                onBack = { navController.popBackStack() },
                                onMissedStop = { newFromId, toStationId ->
                                    navController.navigate("routeDetail/$newFromId/$toStationId")
                                },
                                onViewOnMap = { routeType ->
                                    navController.navigate("routeMap/$fromId/$toId/$routeType")
                                },
                            )
                        }
                    }
                    composable(
                        route = "routeMap/{fromId}/{toId}/{routeType}",
                        arguments = listOf(
                            navArgument("fromId") { type = NavType.StringType },
                            navArgument("toId") { type = NavType.StringType },
                            navArgument("routeType") { type = NavType.StringType },
                        ),
                    ) { entry ->
                        val fromId = entry.arguments?.getString("fromId")
                        val toId = entry.arguments?.getString("toId")
                        val routeType = entry.arguments?.getString("routeType")
                        val fromStation = fromId?.let { stationsById[it] }
                        val toStation = toId?.let { stationsById[it] }
                        // Fullscreen, no header underneath - a real nav destination (like
                        // "chooseOnMap") rather than local overlay state inside RouteDetailScreen,
                        // so system/gesture back naturally pops just this one screen instead of
                        // Route Detail's own always-present TopAppBar back button being what's
                        // left reachable underneath it.
                        if (fromId != null && toId != null && fromStation != null && toStation != null) {
                            // Computed off the UI thread since DFS route search is pure CPU work
                            // with no I/O - see RouteFinder.findRoutes. allRoutes starts empty and
                            // is filled in once the effect below completes, rather than being
                            // available synchronously on first composition.
                            var allRoutes by remember(fromId, toId, data.graph) {
                                mutableStateOf<List<RouteResult>>(emptyList())
                            }
                            LaunchedEffect(fromId, toId, data.graph) {
                                allRoutes = withContext(Dispatchers.Default) {
                                    RouteFinder.findRoutes(data.graph, stationsById, fromId, toId)
                                }
                            }
                            val fastestIndex = remember(allRoutes) {
                                allRoutes.indices.minByOrNull { allRoutes[it].totalStations } ?: 0
                            }
                            val lowestTransfersIndex = remember(allRoutes) {
                                allRoutes.indices.minByOrNull { allRoutes[it].totalTransfers } ?: 0
                            }
                            val hasRouteChoice = allRoutes.size > 1 && fastestIndex != lowestTransfersIndex
                            // Seeded from the route variant already selected on RouteDetailScreen
                            // (threaded through the nav route as routeType) rather than always
                            // defaulting to fastestIndex, so "view on map" doesn't silently revert
                            // a "lowest transfers" choice back to fastest. Keyed on allRoutes (as
                            // before), so this recomputes correctly once the async search above
                            // populates it from its initial empty list.
                            var selectedIndex by remember(allRoutes) {
                                mutableStateOf(if (routeType == "lowestTransfers") lowestTransfersIndex else fastestIndex)
                            }
                            val result = allRoutes.getOrNull(selectedIndex)
                            if (result != null) {
                                RouteMapOverlay(
                                    result = result,
                                    fromStation = fromStation,
                                    toStation = toStation,
                                    lines = data.lines,
                                    paths = data.paths,
                                    stationsById = stationsById,
                                    language = prefs.language,
                                    darkTheme = darkTheme,
                                    strings = strings,
                                    hasRouteChoice = hasRouteChoice,
                                    isFastestSelected = selectedIndex == fastestIndex,
                                    onSwitchRouteType = {
                                        selectedIndex = if (selectedIndex == fastestIndex) lowestTransfersIndex else fastestIndex
                                    },
                                    onClose = { navController.popBackStack() },
                                )
                            } else {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator()
                                }
                            }
                        }
                    }
                    composable("chooseOnMap") {
                        ChooseOnMapScreen(
                            stations = data.stations,
                            lines = data.lines,
                            paths = data.paths,
                            language = prefs.language,
                            darkTheme = darkTheme,
                            strings = strings,
                            onSelect = { station ->
                                chooseOnMapNav.chooseOnMapResult = chooseOnMapNav.chooseOnMapTarget to station.id
                                navController.popBackStack()
                            },
                            onBack = { navController.popBackStack() },
                        )
                    }
                }
            }
        }
    }
}

/**
 * The per-tab content block (top bar + the tab's own screen), shared between the main 4-tab
 * pager and the transient 2-tab pager used for tap-driven transitions (see MainTabsScreen) - this
 * is not just deduplication, it's what keeps the two pagers' rendering from drifting out of sync
 * as either one is edited in the future.
 */
@Composable
private fun TabPageContent(
    tab: TabDestination,
    language: AppLanguage,
    themeMode: ThemeMode,
    darkTheme: Boolean,
    strings: AppStrings,
    stations: List<Station>,
    lines: List<MetroLine>,
    paths: Map<String, List<LinePath>>,
    recentRoutes: List<RecentRoute>,
    onRecentRoutesChange: (List<RecentRoute>) -> Unit,
    fromStationId: String?,
    toStationId: String?,
    onFromStationIdChange: (String?) -> Unit,
    onToStationIdChange: (String?) -> Unit,
    onOpenLine: (MetroLine) -> Unit,
    onOpenChooseOnMap: (String) -> Unit,
    onFindRoute: (String, String) -> Unit,
    onLanguageSelected: (AppLanguage, Offset) -> Unit,
    onThemeModeSelected: (ThemeMode, Offset) -> Unit,
    navHeight: Dp,
) {
    Column(modifier = Modifier.fillMaxSize()) {
        if (tab != TabDestination.MAP) {
            AppTopBar(
                title = when (tab) {
                    TabDestination.HOME -> strings.routingTitle
                    TabDestination.LINES -> strings.navLines
                    TabDestination.MAP -> strings.map
                    TabDestination.SETTINGS -> strings.settingsTitle
                },
                strings = strings,
                onBack = null,
            )
        }
        Box(
            modifier = Modifier
                .weight(1f)
                .then(if (tab != TabDestination.MAP) Modifier.padding(bottom = navHeight) else Modifier),
        ) {
            when (tab) {
                TabDestination.HOME -> HomeScreen(
                    language = language,
                    strings = strings,
                    stations = stations,
                    lines = lines,
                    paths = paths,
                    recentRoutes = recentRoutes,
                    onRecentRoutesChange = onRecentRoutesChange,
                    fromStationId = fromStationId,
                    toStationId = toStationId,
                    onFromStationIdChange = onFromStationIdChange,
                    onToStationIdChange = onToStationIdChange,
                    onOpenChooseOnMap = onOpenChooseOnMap,
                    onFindRoute = onFindRoute,
                )

                TabDestination.LINES -> LinesScreen(lines = lines, language = language, onLineClick = onOpenLine)

                TabDestination.MAP -> MapScreen(
                    stations = stations,
                    lines = lines,
                    paths = paths,
                    language = language,
                    darkTheme = darkTheme,
                    strings = strings,
                    navBarHeight = navHeight,
                )

                TabDestination.SETTINGS -> SettingsScreen(
                    language = language,
                    themeMode = themeMode,
                    strings = strings,
                    onLanguageSelected = onLanguageSelected,
                    onThemeModeSelected = onThemeModeSelected,
                )
            }
        }
    }
}

/**
 * Tap-driven tab switches (see FloatingBottomNav's onSelect below) play a real slide animation,
 * but only across a throwaway 2-page pager containing exactly [fromTab, toTab] - never the full
 * 4-tab list - so there is nothing "in between" to visually pass through or incidentally mount
 * (animateScrollToPage on the MAIN 4-tab pager would scroll through every intermediate page,
 * mounting Map's MapView as a side effect - the problem plan 028 fixed). Once the transient
 * pager's own animation completes, the main pager is instantly synced to the destination and the
 * transient overlay is torn down.
 *
 * The overlay MUST be opaque (see the background() on the transient pager below). The first
 * version of this mechanism (plans 030/031, reverted in 18a3bfa) drew the transient pager's
 * pages - which are plain transparent Columns - directly over the still-composed main pager, so
 * both pagers rendered blended together into a garbled double-exposure on every tap. That
 * missing background, not the slide mechanism itself, was the visual glitch that got the whole
 * feature reverted.
 */
private data class TabTapTransition(val fromTab: TabDestination, val toTab: TabDestination)

@Composable
private fun MainTabsScreen(
    language: AppLanguage,
    themeMode: ThemeMode,
    darkTheme: Boolean,
    strings: AppStrings,
    stations: List<Station>,
    lines: List<MetroLine>,
    paths: Map<String, List<LinePath>>,
    graph: MetroGraph,
    recentRoutes: List<RecentRoute>,
    onRecentRoutesChange: (List<RecentRoute>) -> Unit,
    fromStationId: String?,
    toStationId: String?,
    onFromStationIdChange: (String?) -> Unit,
    onToStationIdChange: (String?) -> Unit,
    onOpenLine: (MetroLine) -> Unit,
    onOpenChooseOnMap: (String) -> Unit,
    onFindRoute: (String, String) -> Unit,
    onLanguageSelected: (AppLanguage, Offset) -> Unit,
    onThemeModeSelected: (ThemeMode, Offset) -> Unit,
) {
    val context = LocalContext.current
    // Falls back to the last tab persisted in NavigationStateRepository (not just Compose's own
    // rememberSaveable) so the choice survives a full task wipe, not only a plain process death -
    // see the comment on the route-restoration effect in TehgoApp for why that distinction matters.
    var currentTab by rememberSaveable {
        val restored = NavigationStateRepository.getLastTab(context)?.let { name ->
            TabDestination.entries.find { it.name == name }
        }
        mutableStateOf(restored ?: TabDestination.HOME)
    }
    LaunchedEffect(currentTab) {
        NavigationStateRepository.setLastTab(context, currentTab.name)
    }
    val tabOrder = TabDestination.entries

    val pagerState = rememberPagerState(
        initialPage = tabOrder.indexOf(currentTab).coerceAtLeast(0),
    ) { tabOrder.size }

    // Keeps currentTab in sync with the pager unconditionally - including while settled on Map,
    // since Map is just another page in this single unified pager now (see plans/022 v3).
    LaunchedEffect(pagerState.currentPage) {
        currentTab = tabOrder[pagerState.currentPage]
    }

    // Non-null only for the duration of a tap-driven transition between two nav-bar tabs - see
    // TabTapTransition and the transient HorizontalPager below.
    var tapTransition by remember { mutableStateOf<TabTapTransition?>(null) }

    // No Scaffold here: the floating nav is meant to overlay page content directly (fullscreen,
    // edge-to-edge pages) rather than reserve its own background strip via Scaffold's bottomBar
    // slot. Root layout is a plain Box instead, with HorizontalPager filling it and
    // FloatingBottomNav aligned on top at the bottom. Scaffold's implicit top-inset handling
    // (it never used a topBar slot, so its own innerPadding.calculateTopPadding() was quietly
    // doing this job) is replaced explicitly below via Modifier.statusBarsPadding() on the
    // pager - the Activity already has enableEdgeToEdge() active, so without this every non-Map
    // tab's AppTopBar would render underneath the status bar.
    //
    // navHeight is measured from FloatingBottomNav's actual rendered size (once composed) and
    // applied as bottom content padding on non-Map pages only, so their last scrollable item
    // isn't hidden underneath the opaque floating pill. Map is excluded on purpose - it's meant
    // to extend fully behind the nav like a typical fullscreen-map-with-floating-controls layout.
    var navHeight by remember { mutableStateOf(0.dp) }
    val density = LocalDensity.current

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background,
    ) {
        val activeTransition = tapTransition

        // Computed once here (not inside a rendering branch) so both the transient overlay below
        // and the nav-highlight position calculation can share the same instances.
        //
        // Order the 2 transient pages, and pick which one is index 0 vs 1, so animating from
        // this transient pager's own initial page to its own target page always plays in the
        // semantically-correct direction: "forward" (destination index >= source index) plays
        // [fromTab, toTab] animating 0->1; "backward" plays [toTab, fromTab] animating 1->0 -
        // either way the pager's own native Start/End layout (already RTL-aware, same as the
        // main pager) handles the actual visual direction correctly with no manual sign math.
        val transientPages: List<TabDestination>?
        val transientPagerState: PagerState?
        if (activeTransition != null) {
            val fromIndex = tabOrder.indexOf(activeTransition.fromTab)
            val toIndex = tabOrder.indexOf(activeTransition.toTab)
            val forward = toIndex >= fromIndex
            val pages = if (forward) {
                listOf(activeTransition.fromTab, activeTransition.toTab)
            } else {
                listOf(activeTransition.toTab, activeTransition.fromTab)
            }
            val initialPage = if (forward) 0 else 1
            val targetPage = if (forward) 1 else 0
            val state = rememberPagerState(initialPage = initialPage) { pages.size }

            LaunchedEffect(activeTransition) {
                state.animateScrollToPage(targetPage, animationSpec = tween(durationMillis = 320))
                // Silently sync the main pager underneath before tearing the overlay down, so
                // removing the overlay reveals the destination page already in place - no flash.
                pagerState.scrollToPage(toIndex)
                tapTransition = null
            }

            transientPages = pages
            transientPagerState = state
        } else {
            transientPages = null
            transientPagerState = null
        }

        // Continuous "which tab, and how far towards a neighbor" position driving the nav's
        // active highlight in real time - during live drag OR a tap-driven transition.
        val navActivePosition = if (transientPagerState != null && transientPages != null) {
            val realFrom = tabOrder.indexOf(transientPages[0])
            val realTo = tabOrder.indexOf(transientPages[1])
            val localPosition = transientPagerState.currentPage + transientPagerState.currentPageOffsetFraction
            realFrom + (realTo - realFrom) * localPosition
        } else {
            pagerState.currentPage + pagerState.currentPageOffsetFraction
        }

        Box(modifier = Modifier.fillMaxSize()) {
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding(),
                // Once the user is actually settled on Map, the pager stops handling touch-driven
                // scroll entirely so MapLibre's own pan/zoom gestures aren't contended for - this is
                // the actual reason Map needs different treatment, not the live-drag transition
                // itself (see plans/022-swipe-to-change-tab.md "Why this is safe"). Programmatic
                // navigation (scrollToPage, e.g. a nav-bar tap) is NOT affected by
                // userScrollEnabled - only touch-driven drag/fling is.
                //
                // Gated on settledPage, NOT currentPage: currentPage is the page closest to the
                // current scroll position and updates continuously mid-drag, flipping to the
                // neighboring page's index as soon as the drag crosses ~50% of the distance between
                // pages - well before the user releases. Reading userScrollEnabled reactively off
                // currentPage would disable scrolling *during* an in-progress drag towards Map,
                // forcing it to auto-complete right around the halfway point instead of letting the
                // user keep dragging/hover/reverse/release normally. settledPage only updates once
                // the pager has actually come to rest on a new page, so it stays "not Map" for the
                // entire drag gesture away from a non-Map tab, and only flips (disabling touch
                // scroll) after the pager has fully settled on Map.
                //
                // Also disabled while a tap-driven transition's transient overlay is showing on
                // top of this pager - it should not also respond to touch input underneath it.
                userScrollEnabled = activeTransition == null && tabOrder[pagerState.settledPage] != TabDestination.MAP,
            ) { page ->
                TabPageContent(
                    tab = tabOrder[page],
                    language = language,
                    themeMode = themeMode,
                    darkTheme = darkTheme,
                    strings = strings,
                    stations = stations,
                    lines = lines,
                    paths = paths,
                    recentRoutes = recentRoutes,
                    onRecentRoutesChange = onRecentRoutesChange,
                    fromStationId = fromStationId,
                    toStationId = toStationId,
                    onFromStationIdChange = onFromStationIdChange,
                    onToStationIdChange = onToStationIdChange,
                    onOpenLine = onOpenLine,
                    onOpenChooseOnMap = onOpenChooseOnMap,
                    onFindRoute = onFindRoute,
                    onLanguageSelected = onLanguageSelected,
                    onThemeModeSelected = onThemeModeSelected,
                    navHeight = navHeight,
                )
            }

            // Transient overlay, only present while a tap-driven transition is animating - drawn
            // on top of (not instead of) the main pager, which stays composed underneath (so its
            // state stays warm) and gets silently jumped to the destination right before this
            // overlay is removed. The background() is load-bearing: TabPageContent's pages are
            // transparent Columns, and without an opaque backdrop the main pager underneath
            // bleeds through as a garbled double-exposure (the bug that got plans 030/031
            // reverted). It sits before statusBarsPadding so the status-bar strip is covered too.
            if (transientPagerState != null && transientPages != null) {
                HorizontalPager(
                    state = transientPagerState,
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background)
                        .statusBarsPadding(),
                    userScrollEnabled = false,
                ) { page ->
                    TabPageContent(
                        tab = transientPages[page],
                        language = language,
                        themeMode = themeMode,
                        darkTheme = darkTheme,
                        strings = strings,
                        stations = stations,
                        lines = lines,
                        paths = paths,
                        recentRoutes = recentRoutes,
                        onRecentRoutesChange = onRecentRoutesChange,
                        fromStationId = fromStationId,
                        toStationId = toStationId,
                        onFromStationIdChange = onFromStationIdChange,
                        onToStationIdChange = onToStationIdChange,
                        onOpenLine = onOpenLine,
                        onOpenChooseOnMap = onOpenChooseOnMap,
                        onFindRoute = onFindRoute,
                        onLanguageSelected = onLanguageSelected,
                        onThemeModeSelected = onThemeModeSelected,
                        navHeight = navHeight,
                    )
                }
            }

            FloatingBottomNav(
                items = tabOrder.map { tab ->
                    NavItem(
                        key = tab.name,
                        outlineIcon = tab.outlineIcon,
                        filledIcon = tab.filledIcon,
                        label = tab.label(strings),
                    )
                },
                activePosition = navActivePosition,
                onSelect = { key ->
                    val targetTab = tabOrder.first { it.name == key }
                    // The tapTransition == null guard ignores taps while a transition is already
                    // animating (320ms) rather than trying to interrupt/redirect a running one.
                    if (targetTab != currentTab && tapTransition == null) {
                        tapTransition = TabTapTransition(fromTab = currentTab, toTab = targetTab)
                    }
                },
                darkTheme = darkTheme,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .onGloballyPositioned { coordinates ->
                        navHeight = with(density) { coordinates.size.height.toDp() }
                    },
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppTopBar(
    title: String,
    strings: AppStrings,
    onBack: (() -> Unit)?,
) {
    CenterAlignedTopAppBar(
        title = { Text(title) },
        navigationIcon = {
            if (onBack != null) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = strings.back)
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.background,
        ),
    )
}
