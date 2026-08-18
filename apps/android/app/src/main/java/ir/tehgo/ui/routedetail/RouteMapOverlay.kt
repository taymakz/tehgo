package ir.tehgo.ui.routedetail

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroLine
import ir.tehgo.data.Station
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import ir.tehgo.routing.RouteGuides
import ir.tehgo.routing.RouteResult
import ir.tehgo.ui.map.MetroMapView
import ir.tehgo.ui.map.addStationsLayer
import ir.tehgo.ui.map.setGuideCallouts
import ir.tehgo.ui.map.setRouteEndpoints
import ir.tehgo.ui.map.setRouteHighlight
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.geometry.LatLngBounds
import org.maplibre.android.maps.MapLibreMap

@Composable
fun RouteMapOverlay(
    result: RouteResult,
    fromStation: Station,
    toStation: Station,
    lines: List<MetroLine>,
    paths: Map<String, List<LinePath>>,
    stationsById: Map<String, Station>,
    language: AppLanguage,
    darkTheme: Boolean,
    strings: AppStrings,
    hasRouteChoice: Boolean,
    isFastestSelected: Boolean,
    onSwitchRouteType: () -> Unit,
    onClose: () -> Unit,
) {
    // Registered/unregistered along with this composable's own lifecycle (it only exists in the
    // tree while the overlay is showing), rather than a permanently-registered-but-toggled
    // handler in the parent - the more robust of the two documented BackHandler patterns.
    BackHandler(onBack = onClose)

    val callouts = remember(result, language) {
        buildList {
            val firstStep = result.steps.firstOrNull()
            if (firstStep != null) {
                val guide = RouteGuides.firstStepGuide(result, lines, paths, language) {
                    stationsById[it]?.localizedName(language) ?: it
                }
                val station = stationsById[firstStep.stationId]
                if (guide.isNotBlank() && station != null) {
                    add(Triple(station, station.localizedName(language), guide))
                }
            }
            result.steps.forEachIndexed { index, step ->
                if (step.transferTo != null) {
                    val guide = RouteGuides.transferGuide(result, index, lines, paths, language) {
                        stationsById[it]?.localizedName(language) ?: it
                    }
                    val station = stationsById[step.stationId]
                    if (guide.isNotBlank() && station != null) {
                        add(Triple(station, station.localizedName(language), guide))
                    }
                }
            }
        }
    }

    var mapRef by remember { mutableStateOf<MapLibreMap?>(null) }

    // Stations actually on this route, not the whole system - and drawn after the route line/
    // endpoints (but before the guide callouts, see below) so their markers/popovers render on
    // top of the route highlight instead of underneath it.
    val routeStations = remember(result, stationsById) {
        result.steps.mapNotNull { stationsById[it.stationId] }
    }

    // Re-runs whenever the selected route changes (e.g. switching fastest <-> lowest-transfers),
    // not just once on first load - every one of these update their existing map sources in
    // place, so this safely redraws on every change.
    LaunchedEffect(mapRef, result, callouts, routeStations) {
        val map = mapRef ?: return@LaunchedEffect
        val style = map.style ?: return@LaunchedEffect
        setRouteHighlight(style, result, lines, stationsById)
        setRouteEndpoints(style, fromStation, toStation, strings.origin, strings.destination)
        val calloutStationIds = callouts.map { it.first.id }.toSet()
        addStationsLayer(style, routeStations, language, darkTheme, excludeLabelStationIds = calloutStationIds)
        // Added last (MapLibre layers paint in add-order, so "last" = top-most) so a guide
        // callout's tooltip bubble is never clipped/covered by a nearby station's circle marker.
        if (callouts.isNotEmpty()) setGuideCallouts(style, callouts, language, darkTheme)

        val boundsBuilder = LatLngBounds.Builder()
        result.steps.forEach { step ->
            stationsById[step.stationId]?.let { boundsBuilder.include(LatLng(it.latitude, it.longitude)) }
        }
        try {
            map.easeCamera(CameraUpdateFactory.newLatLngBounds(boundsBuilder.build(), 80))
        } catch (_: Exception) {
            // fewer than 2 distinct points — ignore, default camera stands.
        }
    }

    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        MetroMapView(
            darkTheme = darkTheme,
            modifier = Modifier.fillMaxSize(),
            initialCenter = LatLng(fromStation.latitude, fromStation.longitude),
            onMapReady = { map -> mapRef = map },
        )

        // Inverted against the map on purpose: white on dark map styles, black on light ones,
        // so it always stays visible regardless of what's under it.
        val chromeBackground = if (darkTheme) androidx.compose.ui.graphics.Color.White else androidx.compose.ui.graphics.Color.Black
        val chromeContent = if (darkTheme) androidx.compose.ui.graphics.Color.Black else androidx.compose.ui.graphics.Color.White

        IconButton(
            onClick = onClose,
            modifier = Modifier
                .align(Alignment.TopStart)
                .windowInsetsPadding(WindowInsets.statusBars)
                .padding(16.dp)
                .clip(CircleShape)
                .background(chromeBackground),
        ) {
            Icon(Icons.Filled.Close, contentDescription = strings.close, tint = chromeContent)
        }

        if (hasRouteChoice) {
            Surface(
                onClick = onSwitchRouteType,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(24.dp),
                shape = RoundedCornerShape(50),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 8.dp,
            ) {
                Text(
                    text = if (isFastestSelected) strings.switchToLowestTransfers else strings.switchToFastest,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 14.dp),
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }
    }
}
