package ir.tehgo.ui.routedetail

import android.content.Intent
import android.widget.Toast
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroGraph
import ir.tehgo.data.MetroLine
import ir.tehgo.data.RecentRoute
import ir.tehgo.data.RecentRoutesRepository
import ir.tehgo.data.Station
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import ir.tehgo.i18n.strings
import ir.tehgo.routing.RouteFinder
import ir.tehgo.routing.RouteGuides
import ir.tehgo.routing.RouteResult
import ir.tehgo.routing.summaryStepIndices
import ir.tehgo.ui.components.StationSelectorSheet
import ir.tehgo.util.ExternalMaps
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RouteDetailScreen(
    fromStationId: String,
    toStationId: String,
    stations: List<Station>,
    lines: List<MetroLine>,
    paths: Map<String, List<LinePath>>,
    graph: MetroGraph,
    language: AppLanguage,
    darkTheme: Boolean,
    strings: AppStrings,
    onRecentRoutesChange: (List<RecentRoute>) -> Unit,
    onBack: () -> Unit,
    onMissedStop: (newFromId: String, toId: String) -> Unit,
    onViewOnMap: (routeType: String) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val stationsById = remember(stations) { stations.associateBy { it.id } }
    val linesById = remember(lines) { lines.associateBy { it.id } }
    val fromStation = stationsById[fromStationId]
    val toStation = stationsById[toStationId]

    // Computed off the UI thread since DFS route search is pure CPU work with no I/O - see
    // RouteFinder.findRoutes. allRoutes starts empty and is filled in once the effect below
    // completes, rather than being available synchronously on first composition.
    var allRoutes by remember(fromStationId, toStationId, graph) { mutableStateOf<List<RouteResult>>(emptyList()) }
    var routesLoading by remember(fromStationId, toStationId, graph) { mutableStateOf(true) }
    LaunchedEffect(fromStationId, toStationId, graph) {
        allRoutes = withContext(Dispatchers.Default) {
            RouteFinder.findRoutes(graph, stationsById, fromStationId, toStationId)
        }
        routesLoading = false
    }

    // The DFS above finishes fast (it's already off the main thread and bounded - see
    // RouteFinder.findRoutes), often well before the NavHost's slide-in transition (a spring,
    // ~300ms) settles. Without this gate, the heavy detailed-steps Column composes and swaps in
    // the instant allRoutes arrives - which lands mid-slide and is what actually caused the
    // visible jank, not the search itself. Holding the skeleton up for a fixed 350ms (a small
    // margin over the 320ms tween already used for the visually similar tab-tap slide in
    // MainActivity) keeps that heavy swap-in off the animating frames entirely.
    var hasSettled by remember(fromStationId, toStationId) { mutableStateOf(false) }
    LaunchedEffect(fromStationId, toStationId) {
        delay(350)
        hasSettled = true
    }
    val showSkeleton = (!hasSettled || routesLoading) && fromStation != null && toStation != null
    val fastestIndex = remember(allRoutes) { allRoutes.indices.minByOrNull { allRoutes[it].totalStations } ?: 0 }
    val lowestTransfersIndex = remember(allRoutes) { allRoutes.indices.minByOrNull { allRoutes[it].totalTransfers } ?: 0 }
    val hasRouteChoice = allRoutes.size > 1 && fastestIndex != lowestTransfersIndex

    // Saveable (not plain remember) and keyed on the stable from/to ids rather than the
    // recomputed allRoutes list - "show on map" is a real nav destination now, and navigating to
    // it disposes this screen's composition; plain remember would reset both of these (re-picking
    // fastestIndex and popping the route-choice sheet back open) every time you return from it.
    var selectedRouteIndex by rememberSaveable(fromStationId, toStationId) { mutableStateOf(fastestIndex) }
    var showRouteSelection by rememberSaveable(fromStationId, toStationId) { mutableStateOf(hasRouteChoice) }
    // Tracks whether the fastest/lowest-transfers defaults above have been applied yet for this
    // from/to pair. allRoutes (and therefore fastestIndex/hasRouteChoice) is empty on the first
    // composition now that the search runs asynchronously, so selectedRouteIndex/showRouteSelection
    // can't take their defaults from it directly the way they could when the search was
    // synchronous - that would permanently lock in the "empty list" defaults (index 0, no choice)
    // the moment rememberSaveable's initializer runs. Instead, apply the real defaults once, the
    // first time allRoutes becomes non-empty for this key; this flag (also rememberSaveable, same
    // key) prevents re-applying them and clobbering a user's manual selection when they return
    // from "view on map" navigation.
    var hasAppliedRouteDefaults by rememberSaveable(fromStationId, toStationId) { mutableStateOf(false) }
    var showDetailedSteps by remember { mutableStateOf(true) }
    var showMissedStopSheet by remember { mutableStateOf(false) }
    var showExportSheet by remember { mutableStateOf(false) }

    val result = allRoutes.getOrNull(selectedRouteIndex)

    LaunchedEffect(allRoutes) {
        if (allRoutes.isNotEmpty()) {
            onRecentRoutesChange(RecentRoutesRepository.recordUsage(context, fromStationId, toStationId))
            if (!hasAppliedRouteDefaults) {
                selectedRouteIndex = fastestIndex
                showRouteSelection = hasRouteChoice
                hasAppliedRouteDefaults = true
            }
        }
    }

    val missedStopSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val routeOptionsSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val exportSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text(strings.routeDetails) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = strings.back)
                    }
                },
                actions = {
                    if (toStation != null) {
                        IconButton(
                            onClick = {
                                ExternalMaps.openNavigation(
                                    context,
                                    toStation.latitude,
                                    toStation.longitude,
                                    toStation.localizedName(language),
                                )
                            },
                        ) {
                            Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = strings.openInMapsApp)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
    ) { padding ->
        if (showSkeleton) {
            RouteDetailSkeleton(padding)
        } else if (result == null || fromStation == null || toStation == null) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = strings.noRouteFound,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(24.dp),
                )
            }
        } else {
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = fromStation.localizedName(language), style = MaterialTheme.typography.titleMedium)
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        modifier = Modifier.padding(horizontal = 8.dp).size(16.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(text = toStation.localizedName(language), style = MaterialTheme.typography.titleMedium)
                }

                Button(
                    onClick = { showMissedStopSheet = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                ) {
                    Text(strings.missedStop)
                }

                if (hasRouteChoice) {
                    OutlinedButton(
                        onClick = {
                            selectedRouteIndex = if (selectedRouteIndex == fastestIndex) lowestTransfersIndex else fastestIndex
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (selectedRouteIndex == fastestIndex) strings.switchToLowestTransfers else strings.switchToFastest)
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(
                        onClick = { showExportSheet = true },
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 10.dp),
                    ) {
                        Text(strings.exportImage, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                    Button(
                        onClick = {
                            shareRouteSummary(context, strings, fromStation, toStation, result, language)
                        },
                        modifier = Modifier.weight(1f),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 10.dp),
                    ) {
                        Icon(Icons.Filled.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                        Text(
                            text = strings.share,
                            modifier = Modifier.padding(start = 6.dp),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(
                        modifier = Modifier.padding(20.dp),
                        horizontalArrangement = Arrangement.spacedBy(32.dp),
                    ) {
                        StatBlock(strings.totalStations, result.totalStations.toString())
                        StatBlock(strings.totalTransfers, result.totalTransfers.toString())
                    }
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = strings.detailedRouteSteps,
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.weight(1f),
                            )
                        }
                        Row(
                            modifier = Modifier.padding(top = 4.dp, bottom = 16.dp).fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            OutlinedButton(
                                onClick = { showDetailedSteps = !showDetailedSteps },
                                modifier = Modifier.weight(1f),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 10.dp),
                            ) {
                                Text(
                                    text = if (showDetailedSteps) strings.showSummary else strings.showDetails,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                            Button(
                                onClick = {
                                    onViewOnMap(if (selectedRouteIndex == lowestTransfersIndex) "lowestTransfers" else "fastest")
                                },
                                modifier = Modifier.weight(1f),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 10.dp),
                            ) {
                                Icon(Icons.Filled.Map, contentDescription = null, modifier = Modifier.size(16.dp))
                                Text(
                                    text = strings.viewOnMap,
                                    modifier = Modifier.padding(start = 6.dp),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }

                        val visibleIndices = remember(result, showDetailedSteps) {
                            if (showDetailedSteps) result.steps.indices.toList() else summaryStepIndices(result)
                        }

                        visibleIndices.forEachIndexed { position, stepIndex ->
                            val step = result.steps[stepIndex]
                            val isLastVisible = position == visibleIndices.lastIndex
                            val color = linesById[step.line]?.color ?: MaterialTheme.colorScheme.primary
                            val onColor = if (step.line == "line_3" || step.line == "line_4") {
                                androidx.compose.ui.graphics.Color.Black
                            } else {
                                androidx.compose.ui.graphics.Color.White
                            }
                            val station = stationsById[step.stationId]
                            val lineName = linesById[step.line]?.localizedName(language) ?: step.line

                            val firstStepGuide = if (stepIndex == 0) {
                                remember(result, language) {
                                    RouteGuides.firstStepGuide(result, lines, paths, language) {
                                        stationsById[it]?.localizedName(language) ?: it
                                    }
                                }
                            } else {
                                null
                            }
                            val transferGuide = if (step.transferTo != null) {
                                remember(result, stepIndex, language) {
                                    RouteGuides.transferGuide(result, stepIndex, lines, paths, language) {
                                        stationsById[it]?.localizedName(language) ?: it
                                    }
                                }
                            } else {
                                null
                            }
                            val guideText = listOfNotNull(firstStepGuide, transferGuide)
                                .filter { it.isNotBlank() }
                                .joinToString("\n")

                            // Row height must track the (possibly multi-line) content column so the
                            // connector line below the circle can stretch to actually reach the next
                            // circle - a fixed-height line here is what caused it to visibly "cut out"
                            // whenever a guide popover wrapped to more than one line.
                            Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.width(24.dp).fillMaxHeight(),
                                ) {
                                    Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(color))
                                    if (!isLastVisible) {
                                        Box(
                                            modifier = Modifier
                                                .width(2.dp)
                                                .weight(1f)
                                                .background(color.copy(alpha = 0.4f)),
                                        )
                                    }
                                }
                                Column(
                                    modifier = Modifier
                                        .padding(start = 12.dp, bottom = if (isLastVisible) 0.dp else 18.dp)
                                        .weight(1f),
                                ) {
                                    // Line + guide popover, matching the website's colored badge chip.
                                    Column(
                                        modifier = Modifier
                                            .clip(MaterialTheme.shapes.small)
                                            .background(color)
                                            .padding(horizontal = 10.dp, vertical = 6.dp),
                                    ) {
                                        Text(
                                            text = lineName,
                                            style = MaterialTheme.typography.labelMedium,
                                            color = onColor,
                                        )
                                        if (guideText.isNotBlank()) {
                                            Text(
                                                text = guideText,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = onColor.copy(alpha = 0.9f),
                                                modifier = Modifier.padding(top = 2.dp),
                                            )
                                        }
                                    }
                                    Text(
                                        text = station?.localizedName(language) ?: step.stationId,
                                        style = MaterialTheme.typography.bodyLarge,
                                        modifier = Modifier.padding(top = 6.dp),
                                    )
                                    if (station?.address != null) {
                                        Text(
                                            text = station.address,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (showRouteSelection) {
                RouteOptionsSheet(
                    strings = strings,
                    fastestRoute = allRoutes[fastestIndex],
                    lowestTransfersRoute = allRoutes[lowestTransfersIndex],
                    sheetState = routeOptionsSheetState,
                    onSelectFastest = {
                        selectedRouteIndex = fastestIndex
                        showRouteSelection = false
                    },
                    onSelectLowestTransfers = {
                        selectedRouteIndex = lowestTransfersIndex
                        showRouteSelection = false
                    },
                    onDismiss = { showRouteSelection = false },
                )
            }

            if (showExportSheet) {
                ExportImageSheet(
                    strings = strings,
                    sheetState = exportSheetState,
                    hasRouteChoice = hasRouteChoice,
                    initialUseFastest = selectedRouteIndex == fastestIndex,
                    initialLanguage = language,
                    onDismiss = { showExportSheet = false },
                    onExport = { exportDark, exportDetailed, exportUseFastest, exportLanguage ->
                        showExportSheet = false
                        val exportResult = if (hasRouteChoice) {
                            allRoutes[if (exportUseFastest) fastestIndex else lowestTransfersIndex]
                        } else {
                            result
                        }
                        scope.launch {
                            val bitmap = RouteImageExporter.render(
                                context = context,
                                result = exportResult,
                                fromStation = fromStation,
                                toStation = toStation,
                                lines = lines,
                                paths = paths,
                                stationsById = stationsById,
                                language = exportLanguage,
                                strings = exportLanguage.strings(),
                                darkTheme = exportDark,
                                detailed = exportDetailed,
                            )
                            val uri = RouteImageExporter.saveToGallery(context, bitmap)
                            if (uri != null) {
                                Toast.makeText(context, strings.savedToGallery, Toast.LENGTH_SHORT).show()
                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "image/png"
                                    putExtra(Intent.EXTRA_STREAM, uri)
                                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                }
                                context.startActivity(Intent.createChooser(shareIntent, strings.share))
                            } else {
                                Toast.makeText(context, strings.saveFailed, Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                )
            }

            if (showMissedStopSheet) {
                StationSelectorSheet(
                    title = strings.recalculateFrom,
                    description = strings.selectCurrentStation,
                    stations = stations,
                    lines = lines,
                    language = language,
                    strings = strings,
                    sheetState = missedStopSheetState,
                    onSelect = { station ->
                        showMissedStopSheet = false
                        onMissedStop(station.id, toStationId)
                    },
                    onDismiss = { showMissedStopSheet = false },
                )
            }
        }
    }
}

/**
 * Placeholder layout mirroring RouteDetailScreen's real content shape (header, missed-stop
 * button, export/share row, stat card, steps card) so the eventual swap to real data doesn't
 * visibly jump around - only the block colors pulse, sizes/positions already match.
 */
@Composable
private fun RouteDetailSkeleton(padding: PaddingValues) {
    val infiniteTransition = rememberInfiniteTransition(label = "routeDetailSkeleton")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.06f,
        targetValue = 0.16f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 700, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "routeDetailSkeletonAlpha",
    )
    val placeholderColor = MaterialTheme.colorScheme.onSurface.copy(alpha = pulseAlpha)

    Column(
        modifier = Modifier
            .padding(padding)
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            SkeletonBar(Modifier.width(90.dp).height(22.dp), placeholderColor)
            Box(Modifier.padding(horizontal = 8.dp).size(16.dp))
            SkeletonBar(Modifier.width(90.dp).height(22.dp), placeholderColor)
        }

        SkeletonBar(Modifier.fillMaxWidth().height(48.dp), placeholderColor)

        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            SkeletonBar(Modifier.weight(1f).height(40.dp), placeholderColor)
            SkeletonBar(Modifier.weight(1f).height(40.dp), placeholderColor)
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        ) {
            Row(
                modifier = Modifier.padding(20.dp),
                horizontalArrangement = Arrangement.spacedBy(32.dp),
            ) {
                repeat(2) {
                    Column {
                        SkeletonBar(Modifier.width(32.dp).height(24.dp), placeholderColor)
                        SkeletonBar(Modifier.padding(top = 6.dp).width(64.dp).height(14.dp), placeholderColor)
                    }
                }
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                SkeletonBar(Modifier.width(140.dp).height(20.dp), placeholderColor)
                Row(
                    modifier = Modifier.padding(top = 16.dp, bottom = 16.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    SkeletonBar(Modifier.weight(1f).height(40.dp), placeholderColor)
                    SkeletonBar(Modifier.weight(1f).height(40.dp), placeholderColor)
                }
                repeat(4) { index ->
                    val isLast = index == 3
                    Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.width(24.dp).fillMaxHeight(),
                        ) {
                            Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(placeholderColor))
                            if (!isLast) {
                                Box(modifier = Modifier.width(2.dp).weight(1f).background(placeholderColor))
                            }
                        }
                        Column(
                            modifier = Modifier
                                .padding(start = 12.dp, bottom = if (isLast) 0.dp else 18.dp)
                                .weight(1f),
                        ) {
                            SkeletonBar(Modifier.width(72.dp).height(26.dp), placeholderColor)
                            SkeletonBar(Modifier.padding(top = 8.dp).width(120.dp).height(16.dp), placeholderColor)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SkeletonBar(modifier: Modifier, color: Color) {
    Box(modifier = modifier.clip(MaterialTheme.shapes.small).background(color))
}

@Composable
private fun StatBlock(label: String, value: String) {
    Column {
        Text(text = value, style = MaterialTheme.typography.titleLarge)
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

private fun shareRouteSummary(
    context: android.content.Context,
    strings: AppStrings,
    from: Station,
    to: Station,
    result: RouteResult,
    language: AppLanguage,
) {
    val text = buildString {
        append(from.localizedName(language))
        append(" -> ")
        append(to.localizedName(language))
        append("\n")
        append("${strings.totalStations}: ${result.totalStations}")
        append(" | ")
        append("${strings.totalTransfers}: ${result.totalTransfers}")
    }
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, text)
    }
    context.startActivity(Intent.createChooser(intent, strings.share))
}
