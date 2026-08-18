package ir.tehgo.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroLine
import ir.tehgo.data.RecentRoute
import ir.tehgo.data.RecentRoutesRepository
import ir.tehgo.data.Station
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import ir.tehgo.i18n.formatRouteTimestamp
import ir.tehgo.ui.components.StationSelectorSheet
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

private const val RecentRoutesDisplayLimit = 10
private const val RouteDeleteAnimationMillis = 280L

private fun routeDeleteExitTransition(): ExitTransition = shrinkVertically(animationSpec = tween(RouteDeleteAnimationMillis.toInt())) +
    fadeOut(animationSpec = tween((RouteDeleteAnimationMillis / 2).toInt()))

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    language: AppLanguage,
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
    onOpenChooseOnMap: (String) -> Unit,
    onFindRoute: (fromId: String, toId: String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val stationsById = remember(stations) { stations.associateBy { it.id } }
    val fromStation = fromStationId?.let { stationsById[it] }
    val toStation = toStationId?.let { stationsById[it] }

    // Swap animation: the real state flips instantly (as it always did), but for the duration of
    // the animation the rail's static dots are hidden and two "ghost" dots - holding the colors
    // from just before the swap - animate from their old slot to their new one, so it reads as
    // the two dots crossing rather than an instant color flip.
    var railHeightPx by remember { mutableStateOf(0) }
    val swapAnim = remember { Animatable(0f) }
    var swapGhostColors by remember { mutableStateOf<Pair<Color?, Color?>?>(null) }

    fun swapStations() {
        val oldFromColor = fromStation?.lineColors?.firstOrNull()
        val oldToColor = toStation?.lineColors?.firstOrNull()
        val temp = fromStationId
        onFromStationIdChange(toStationId)
        onToStationIdChange(temp)
        swapGhostColors = oldFromColor to oldToColor
        scope.launch {
            swapAnim.snapTo(0f)
            swapAnim.animateTo(1f, animationSpec = tween(350))
            swapGhostColors = null
        }
    }

    var showOriginSheet by remember { mutableStateOf(false) }
    var showDestinationSheet by remember { mutableStateOf(false) }
    var actionsRoute by remember { mutableStateOf<RecentRoute?>(null) }
    var pendingDeleteIds by remember { mutableStateOf(setOf<String>()) }

    // Two-phase delete: let the row's own shrink/fade-out exit animation play before it actually
    // disappears from the underlying list, instead of the list just instantly jumping.
    fun deleteRouteAnimated(routeId: String) {
        pendingDeleteIds = pendingDeleteIds + routeId
        scope.launch {
            delay(RouteDeleteAnimationMillis)
            onRecentRoutesChange(RecentRoutesRepository.delete(context, routeId))
            pendingDeleteIds = pendingDeleteIds - routeId
        }
    }

    val originSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val destinationSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val actionsSheetState = rememberModalBottomSheetState()

    Column(
        modifier = modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(text = strings.routingTitle, style = MaterialTheme.typography.titleLarge)
                Text(
                    text = strings.homeNetworkStatsTemplate
                        .replace("{lines}", lines.size.toString())
                        .replace("{stations}", stations.size.toString()),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 2.dp, bottom = 18.dp),
                )

                // The dot-thread-dot rail on the leading edge is the metro-line diagram motif
                // this app already uses everywhere else (line badges, map lines) - carrying it
                // into the journey picker itself, colored by whichever line each pick belongs to.
                Row(modifier = Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    val density = LocalDensity.current
                    val isSwapAnimating = swapGhostColors != null
                    Box(modifier = Modifier.width(20.dp).fillMaxHeight()) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .onSizeChanged { railHeightPx = it.height },
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            RailDot(color = fromStation?.lineColors?.firstOrNull(), alpha = if (isSwapAnimating) 0f else 1f)
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .width(2.dp)
                                    .background(MaterialTheme.colorScheme.outline),
                            )
                            RailDot(color = toStation?.lineColors?.firstOrNull(), alpha = if (isSwapAnimating) 0f else 1f)
                        }

                        val ghostColors = swapGhostColors
                        if (ghostColors != null) {
                            val dotSizePx = with(density) { 12.dp.toPx() }
                            val travelPx = (railHeightPx - dotSizePx).coerceAtLeast(0f)
                            val progress = swapAnim.value
                            // Old "from" color travels top -> bottom, old "to" color travels bottom -> top.
                            RailDot(
                                color = ghostColors.first,
                                modifier = Modifier
                                    .align(Alignment.TopCenter)
                                    .offset { IntOffset(0, (progress * travelPx).roundToInt()) },
                            )
                            RailDot(
                                color = ghostColors.second,
                                modifier = Modifier
                                    .align(Alignment.TopCenter)
                                    .offset { IntOffset(0, ((1f - progress) * travelPx).roundToInt()) },
                            )
                        }
                    }

                    Column(
                        modifier = Modifier.weight(1f).padding(horizontal = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        StationField(
                            label = fromStation?.localizedName(language) ?: strings.selectOrigin,
                            onClick = { showOriginSheet = true },
                        )
                        StationField(
                            label = toStation?.localizedName(language) ?: strings.selectDestination,
                            onClick = { showDestinationSheet = true },
                        )
                    }

                    IconButton(
                        onClick = { swapStations() },
                        modifier = Modifier.align(Alignment.CenterVertically),
                    ) {
                        Icon(Icons.Filled.SwapVert, contentDescription = strings.swap)
                    }
                }

                Button(
                    onClick = {
                        val from = fromStationId
                        val to = toStationId
                        if (from != null && to != null) onFindRoute(from, to)
                    },
                    enabled = fromStationId != null && toStationId != null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                ) {
                    Text(strings.findRoute)
                }
            }
        }

        val favorites = recentRoutes.filter { it.isFavorite }
        if (favorites.isNotEmpty()) {
            RouteHistorySection(
                title = strings.favoriteRoutes,
                routes = favorites,
                stationsById = stationsById,
                language = language,
                pendingDeleteIds = pendingDeleteIds,
                onRowClick = { route -> onFindRoute(route.fromStationId, route.toStationId) },
                onOpenActions = { actionsRoute = it },
            )
        }

        Column {
            SectionEyebrow(text = strings.recentRoutes, modifier = Modifier.padding(bottom = 12.dp))
            if (recentRoutes.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .border(
                            BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                            RoundedCornerShape(16.dp),
                        )
                        .padding(vertical = 32.dp, horizontal = 16.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = strings.noRecentRoutes,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }
            } else {
                val displayed = recentRoutes.take(RecentRoutesDisplayLimit)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .border(
                            BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                            RoundedCornerShape(16.dp),
                        )
                        .animateContentSize(),
                ) {
                    displayed.forEachIndexed { index, route ->
                        key(route.id) {
                            AnimatedVisibility(
                                visible = route.id !in pendingDeleteIds,
                                exit = routeDeleteExitTransition(),
                            ) {
                                Column {
                                    RecentRouteRow(
                                        route = route,
                                        stationsById = stationsById,
                                        language = language,
                                        onClick = { onFindRoute(route.fromStationId, route.toStationId) },
                                        onOpenActions = { actionsRoute = route },
                                    )
                                    if (index != displayed.lastIndex) HorizontalDivider()
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showOriginSheet) {
        StationSelectorSheet(
            title = strings.selectOrigin,
            description = strings.searchOriginDescription,
            stations = remember(stations, toStationId) { stations.filter { it.id != toStationId } },
            lines = lines,
            language = language,
            strings = strings,
            sheetState = originSheetState,
            onSelect = { station ->
                onFromStationIdChange(station.id)
                scope.launch { originSheetState.hide() }.invokeOnCompletion {
                    if (!originSheetState.isVisible) showOriginSheet = false
                }
            },
            onDismiss = { showOriginSheet = false },
            onChooseOnMap = {
                showOriginSheet = false
                onOpenChooseOnMap("origin")
            },
        )
    }

    if (showDestinationSheet) {
        StationSelectorSheet(
            title = strings.selectDestination,
            description = strings.searchDestinationDescription,
            stations = remember(stations, fromStationId) { stations.filter { it.id != fromStationId } },
            lines = lines,
            language = language,
            strings = strings,
            sheetState = destinationSheetState,
            onSelect = { station ->
                onToStationIdChange(station.id)
                scope.launch { destinationSheetState.hide() }.invokeOnCompletion {
                    if (!destinationSheetState.isVisible) showDestinationSheet = false
                }
            },
            onDismiss = { showDestinationSheet = false },
            onChooseOnMap = {
                showDestinationSheet = false
                onOpenChooseOnMap("destination")
            },
        )
    }

    val routeForActions = actionsRoute
    if (routeForActions != null) {
        RouteActionsSheet(
            route = routeForActions,
            strings = strings,
            sheetState = actionsSheetState,
            onToggleFavorite = {
                scope.launch {
                    onRecentRoutesChange(RecentRoutesRepository.toggleFavorite(context, routeForActions.id))
                }
            },
            onDelete = { deleteRouteAnimated(routeForActions.id) },
            onDismiss = { actionsRoute = null },
        )
    }
}

@Composable
private fun StationField(
    label: String,
    onClick: () -> Unit,
) {
    OutlinedButton(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.onSurface),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Start,
        )
    }
}

/** A single stop on the rail: filled if it belongs to a known line, hollow otherwise. */
@Composable
private fun RailDot(color: Color?, modifier: Modifier = Modifier, alpha: Float = 1f) {
    val resolved = color ?: MaterialTheme.colorScheme.outline
    Box(
        modifier = modifier
            .size(12.dp)
            .graphicsLayer { this.alpha = alpha }
            .clip(CircleShape)
            .then(
                if (color != null) {
                    Modifier.background(resolved)
                } else {
                    Modifier.border(BorderStroke(2.dp, resolved), CircleShape)
                },
            ),
    )
}

/**
 * A small labeled marker for a list section - a colored rule plus letter-spaced label, standing
 * in for the case-transformed all-caps eyebrow this would be in English-only UI (which doesn't
 * carry over to Persian, so it's expressed through weight/spacing/color instead).
 */
@Composable
private fun SectionEyebrow(text: String, modifier: Modifier = Modifier) {
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .width(3.dp)
                .height(14.dp)
                .clip(RoundedCornerShape(2.dp))
                .background(MaterialTheme.colorScheme.primary),
        )
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.4.sp,
            modifier = Modifier.padding(start = 8.dp),
        )
    }
}

@Composable
private fun RouteHistorySection(
    title: String,
    routes: List<RecentRoute>,
    stationsById: Map<String, Station>,
    language: AppLanguage,
    pendingDeleteIds: Set<String>,
    onRowClick: (RecentRoute) -> Unit,
    onOpenActions: (RecentRoute) -> Unit,
) {
    Column {
        SectionEyebrow(text = title, modifier = Modifier.padding(bottom = 12.dp))
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .border(BorderStroke(1.dp, MaterialTheme.colorScheme.outline), RoundedCornerShape(16.dp))
                .animateContentSize(),
        ) {
            routes.forEachIndexed { index, route ->
                key(route.id) {
                    AnimatedVisibility(
                        visible = route.id !in pendingDeleteIds,
                        exit = routeDeleteExitTransition(),
                    ) {
                        Column {
                            RecentRouteRow(
                                route = route,
                                stationsById = stationsById,
                                language = language,
                                onClick = { onRowClick(route) },
                                onOpenActions = { onOpenActions(route) },
                            )
                            if (index != routes.lastIndex) HorizontalDivider()
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RecentRouteRow(
    route: RecentRoute,
    stationsById: Map<String, Station>,
    language: AppLanguage,
    onClick: () -> Unit,
    onOpenActions: () -> Unit,
) {
    val fromStation = stationsById[route.fromStationId]
    val toStation = stationsById[route.toStationId]
    val fromName = fromStation?.localizedName(language) ?: route.fromStationId
    val toName = toStation?.localizedName(language) ?: route.toStationId
    val dateText = remember(route.timestamp, language) { formatRouteTimestamp(route.timestamp, language) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp)
            .height(IntrinsicSize.Min),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.width(10.dp).fillMaxHeight(), horizontalAlignment = Alignment.CenterHorizontally) {
            RailDot(color = fromStation?.lineColors?.firstOrNull())
            Box(
                modifier = Modifier
                    .weight(1f)
                    .width(2.dp)
                    .background(MaterialTheme.colorScheme.outline),
            )
            RailDot(color = toStation?.lineColors?.firstOrNull())
        }
        Column(modifier = Modifier.weight(1f).padding(start = 14.dp)) {
            Text(text = fromName, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
            Text(
                text = toName,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(top = 6.dp),
            )
            Text(
                text = dateText,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 6.dp),
            )
        }
        if (route.isFavorite) {
            Icon(
                Icons.Filled.Star,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(18.dp).padding(end = 8.dp),
            )
        }
        IconButton(onClick = onOpenActions) {
            Icon(Icons.Filled.MoreVert, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RouteActionsSheet(
    route: RecentRoute,
    strings: AppStrings,
    sheetState: SheetState,
    onToggleFavorite: () -> Unit,
    onDelete: () -> Unit,
    onDismiss: () -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp)) {
            Text(text = strings.actions, style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(bottom = 8.dp))

            ActionRow(
                icon = if (route.isFavorite) Icons.Filled.StarBorder else Icons.Filled.Star,
                label = if (route.isFavorite) strings.removeFromFavorites else strings.addToFavorites,
                onClick = {
                    onToggleFavorite()
                    onDismiss()
                },
            )
            ActionRow(
                icon = Icons.Filled.Delete,
                label = strings.delete,
                tint = MaterialTheme.colorScheme.error,
                onClick = {
                    onDelete()
                    onDismiss()
                },
            )
            Box(modifier = Modifier.padding(bottom = 12.dp))
        }
    }
}

@Composable
private fun ActionRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit,
    tint: androidx.compose.ui.graphics.Color = MaterialTheme.colorScheme.onSurface,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = tint)
        Text(text = label, style = MaterialTheme.typography.bodyLarge, color = tint, modifier = Modifier.padding(start = 16.dp))
    }
}
