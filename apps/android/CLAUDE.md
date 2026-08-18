# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

TehGo (تهگو) is a native Android application written in Kotlin using Jetpack Compose. It's a
feature-complete v1.0 Tehran + Karaj metro route planner: bilingual (Persian/English) DFS-based
route finding between stations, an interactive MapLibre map with offline tile caching, line/station
browsing, recent and favorite routes, handoff to external navigation apps, and route-detail image
sharing. There is no backend — station/line/graph data ships bundled as JSON assets, and user state
(recent routes, onboarding, last-viewed tab/screen, offline map cache manifest) persists locally via
SharedPreferences.

- Package / namespace: `ir.tehgo`
- Min SDK: 30, Target/Compile SDK: 36
- Kotlin: 2.2.10, AGP: 9.3.0, Compose BOM: 2025.12.00
- Single Gradle module: `app`

## Common commands

Run these from the repository root. On Windows use `gradlew.bat`; the examples below use the
Unix wrapper (`./gradlew`) — swap in `gradlew.bat` when running from PowerShell/cmd.

```
# Build the debug APK
./gradlew assembleDebug

# Run unit tests (JVM, app/src/test)
./gradlew test

# Run a single unit test class (the plain `test` task is a lifecycle aggregate and doesn't
# accept --tests; target a build-variant task instead)
./gradlew testDebugUnitTest --tests "ir.tehgo.ExampleUnitTest"

# Run instrumented tests (app/src/androidTest, requires a connected device/emulator)
./gradlew connectedAndroidTest

# Lint
./gradlew lint

# Install debug build on a connected device/emulator
./gradlew installDebug
```

## Release builds

`assembleRelease` / `bundleRelease` require a local, untracked `keystore.properties` at the repo
root (see `keystore/README.md` for how to generate one). `app/build.gradle.kts` only wires up the
`release` `signingConfig` when that file exists; without it, `assembleRelease`/`bundleRelease`
still succeed but produce an unsigned build. `keystore.properties` and `keystore/*.keystore` are
gitignored — never commit them.

## Versioning

`versionName`/`versionCode` live in `app/build.gradle.kts` (`defaultConfig`). After finishing a
round of changes to the app (not for unrelated docs/tooling edits), ask the user what the new
`versionName` should be before bumping it — don't pick it yourself. Always increment `versionCode`
by 1 alongside it.

## Git workflow

Always work directly on `main` — never create or switch to a feature/topic branch for regular
edits, and never leave the repo checked out on something other than `main` at the end of a task.
Commit straight to `main`. (This doesn't apply to isolated `/improve execute` executor worktrees,
which are disposable-by-design and get merged back into `main` after review — that mechanism is
exempt, not this rule.)

## Architecture

All source lives under `app/src/main/java/ir/tehgo/`.

- `MainActivity.kt` — app entry point (`ComponentActivity`). Hosts the `TehgoApp()` composable,
  which loads bundled station/line/graph data, holds language/theme state, and wraps everything in
  a Compose `NavHost` (`androidx.navigation:navigation-compose`) with 5 destinations: `tabs`,
  `lineDetail/{lineId}`, `routeDetail/{fromId}/{toId}`, `routeMap/{fromId}/{toId}`, and
  `chooseOnMap`. The `tabs` destination renders `MainTabsScreen`, which drives 4 bottom-nav tabs
  (`TabDestination`: HOME, LINES, MAP, SETTINGS) through `FloatingBottomNav`.
- `data/` — repositories reading bundled JSON assets (`StationsRepository`, `MetroLinesRepository`,
  `GraphRepository.loadGraph` parsing `assets/data/graph.json` into a `MetroGraph` adjacency map)
  and SharedPreferences-backed local state (`RecentRoutesRepository` for recent/favorite routes,
  `NavigationStateRepository` for last screen/tab across process death and OEM task-wipes,
  `OnboardingRepository`). Also `LocationHelper` and data model files `Station`, `MetroLine`,
  `RecentRoute`.
- `routing/` — `RouteFinder` (DFS multi-route search over the metro graph — the app's core
  feature), `RouteModels`, `RouteSummary`, `RouteGuides` (human-readable transfer/first-step
  instructions).
- `ui/map/` — MapLibre-based rendering: `MetroMapView` (lifecycle-aware `MapView` wrapper),
  `MapScreen`, `MapLayers` (station/line GeoJSON layers, custom marker bitmaps),
  `ChooseOnMapScreen` (tap-to-pick-a-station full-screen map), `OfflineMapCache` (pre-downloads
  tiles for offline use; also SharedPreferences-backed, for its cache manifest), `OsrmRouting`
  (OSRM HTTP routing client — currently unused/dead code, no call sites).
- `ui/routedetail/` — `RouteDetailScreen`, `RouteDetailSheets`, `RouteMapOverlay` (fullscreen map
  view of a selected route), `RouteImageExporter` (renders route details to a shareable PNG).
- `ui/home/HomeScreen.kt` — the Home tab: from/to station pickers, recent/favorite routes.
- `ui/lines/` — `LinesScreen`, `LineDetailScreen`.
- `ui/onboarding/` — `OnboardingScreen` (first-launch flow, `HorizontalPager`), `SplashScreen`.
- `ui/settings/SettingsScreen.kt` — language/theme pickers.
- `ui/components/` — `FloatingBottomNav`, `OptionPickerSheet`, `ThemeRevealOverlay` (circular
  reveal theme-switch animation), `StationSelectorSheet`.
- `ui/theme/` — standard Material 3 theming (`Color`, `Theme`, `Type`, `ThemeMode`).
- `i18n/` — `AppLanguage` (FA/EN string tables + layout direction), `DateFormatting` (Jalali
  calendar for Persian via Android ICU, Gregorian for English).
- `util/ExternalMaps.kt` — opens a station's location in the user's preferred navigation app via a
  `geo:` intent chooser.
- `app/src/test/` — local JUnit4 unit tests (run on JVM via `./gradlew test`), e.g.
  `ExampleUnitTest`.
- `app/src/androidTest/` — instrumented tests (run on device/emulator via
  `./gradlew connectedAndroidTest`).
- Dependency versions are centralized in `gradle/libs.versions.toml` (Gradle version catalog) and
  referenced from `app/build.gradle.kts` via `libs.*` aliases — add new dependencies there rather
  than hardcoding coordinates in the module build file.

Architectural facts worth knowing before adding features:

- No ViewModel anywhere in the codebase — state is `remember`/`rememberSaveable { mutableStateOf(...) }`
  throughout, including in `MainActivity.kt`'s `TehgoApp()`, which is the app's de facto single
  state holder for cross-cutting concerns (language, theme, loaded data, nav-state persistence).
- Compose Navigation (`androidx.navigation:navigation-compose`) drives screen-to-screen navigation;
  bottom-tab switching within `tabs` is separate, local `AnimatedContent` state.
- MapLibre (`org.maplibre.gl:android-sdk`) is the map rendering library — free/open-source, not
  Google Maps. Map tiles are styled via the free CARTO basemap style URLs in `MetroMapView.kt`.
- Networking: the CARTO basemap style URLs are the only live network call point in the app.
  `OsrmRouting.kt` exists but has no call sites (dead code as of this writing).
- Persistence: SharedPreferences-backed local state only, no database/Room.
- i18n: bilingual FA/EN with full RTL support via
  `CompositionLocalProvider(LocalLayoutDirection provides language.layoutDirection)`.
