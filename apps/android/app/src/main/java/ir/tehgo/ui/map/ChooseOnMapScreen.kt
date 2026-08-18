package ir.tehgo.ui.map

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import ir.tehgo.data.LinePath
import ir.tehgo.data.LocationHelper
import ir.tehgo.data.MetroLine
import ir.tehgo.data.Station
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import ir.tehgo.util.ExternalMaps
import kotlinx.coroutines.launch
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap

// A generous invisible tap-tolerance around each station dot, well beyond the ~48dp minimum
// recommended touch target - converted from dp to px at use so it's consistent across screen
// densities instead of being a fixed raw-pixel number.
private val StationHitTestPadding = 40.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChooseOnMapScreen(
    stations: List<Station>,
    lines: List<MetroLine>,
    paths: Map<String, List<LinePath>>,
    language: AppLanguage,
    darkTheme: Boolean,
    strings: AppStrings,
    onSelect: (Station) -> Unit,
    onBack: () -> Unit,
) {
    val stationsById = remember(stations) { stations.associateBy { it.id } }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val density = LocalDensity.current
    val hitTestPaddingPx = with(density) { StationHitTestPadding.toPx() }

    var mapRef by remember { mutableStateOf<MapLibreMap?>(null) }
    var selectedStation by remember { mutableStateOf<Station?>(null) }
    var locatingUser by remember { mutableStateOf(false) }
    var clickListenerRegistered by remember { mutableStateOf(false) }
    // Held as a single named instance (rather than an inline lambda passed straight to
    // addOnMapClickListener) so the same instance can later be passed to
    // removeOnMapClickListener - reads mapRef/stationsById/hitTestPaddingPx at call time so it
    // stays correct even though it's only constructed once per screen instance.
    val clickListener = remember {
        MapLibreMap.OnMapClickListener { latLng ->
            val map = mapRef ?: return@OnMapClickListener false
            val screenPoint = map.projection.toScreenLocation(latLng)
            val hitBox = android.graphics.RectF(
                screenPoint.x - hitTestPaddingPx,
                screenPoint.y - hitTestPaddingPx,
                screenPoint.x + hitTestPaddingPx,
                screenPoint.y + hitTestPaddingPx,
            )
            val id = map.queryRenderedFeatures(hitBox, StationsLayerId).firstOrNull()?.getStringProperty("id")
            selectedStation = id?.let { stationsById[it] }
            id != null
        }
    }
    val stationSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Defense in depth alongside the clickListenerRegistered guard below: make sure the
    // listener never outlives this screen (or the map instance it was registered on) even if
    // mapRef ever changes to a new MapLibreMap.
    DisposableEffect(mapRef) {
        val currentMap = mapRef
        onDispose {
            currentMap?.removeOnMapClickListener(clickListener)
        }
    }

    fun locateMe() {
        scope.launch {
            locatingUser = true
            val location = LocationHelper.getCurrentLocation(context)
            locatingUser = false
            if (location == null) {
                Toast.makeText(context, strings.locationPermissionDenied, Toast.LENGTH_SHORT).show()
                return@launch
            }
            mapRef?.style?.let { setUserLocationMarker(it, location.latitude, location.longitude) }
            mapRef?.easeCamera(CameraUpdateFactory.newLatLng(LatLng(location.latitude, location.longitude)))
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) locateMe() else Toast.makeText(context, strings.locationPermissionDenied, Toast.LENGTH_SHORT).show()
    }

    Box(Modifier.fillMaxSize()) {
        MetroMapView(
            darkTheme = darkTheme,
            modifier = Modifier.fillMaxSize(),
            onMapReady = { map ->
                mapRef = map
                val style = map.style ?: return@MetroMapView
                if (style.getSource(NetworkLinesSourceId) == null) {
                    addNetworkLinesLayer(style, lines, paths, stationsById)
                }
                if (style.getSource(StationsSourceId) == null) {
                    addStationsLayer(style, stations, language, darkTheme)
                } else {
                    updateStationLabelLanguage(style, language, darkTheme)
                }
                if (!clickListenerRegistered) {
                    clickListenerRegistered = true
                    map.addOnMapClickListener(clickListener)
                }
            },
        )

        // Inverted against the map on purpose: white on dark map styles, black on light ones,
        // so it always stays visible regardless of what's under it.
        val chromeBackground = if (darkTheme) Color.White else Color.Black
        val chromeContent = if (darkTheme) Color.Black else Color.White

        IconButton(
            onClick = onBack,
            modifier = Modifier
                .align(Alignment.TopStart)
                .windowInsetsPadding(WindowInsets.statusBars)
                .padding(16.dp)
                .clip(CircleShape)
                .background(chromeBackground),
        ) {
            Icon(Icons.Filled.Close, contentDescription = strings.close, tint = chromeContent)
        }

        FloatingActionButton(
            onClick = {
                val granted = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                ) == PackageManager.PERMISSION_GRANTED
                if (granted) locateMe() else permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
            },
            containerColor = Color.White,
            contentColor = Color.Black,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp),
        ) {
            if (locatingUser) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.Black)
            } else {
                Icon(Icons.Filled.MyLocation, contentDescription = strings.myLocation)
            }
        }

        val station = selectedStation
        if (station != null) {
            ModalBottomSheet(
                onDismissRequest = { selectedStation = null },
                sheetState = stationSheetState,
                containerColor = MaterialTheme.colorScheme.surface,
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = station.localizedName(language),
                            style = MaterialTheme.typography.titleMedium,
                            modifier = Modifier.weight(1f),
                        )
                        IconButton(
                            onClick = {
                                ExternalMaps.openNavigation(
                                    context,
                                    station.latitude,
                                    station.longitude,
                                    station.localizedName(language),
                                )
                            },
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.OpenInNew,
                                contentDescription = strings.openInMapsApp,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    Row(
                        modifier = Modifier.padding(top = 12.dp, bottom = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Button(
                            onClick = { onSelect(station) },
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(strings.selectAction)
                        }
                        OutlinedButton(
                            onClick = {
                                // Hand off to whichever navigation app the user has - we don't
                                // draw in-app turn-by-turn directions (for now); the target app
                                // uses the device's current location as the starting point.
                                ExternalMaps.openNavigation(
                                    context,
                                    station.latitude,
                                    station.longitude,
                                    station.localizedName(language),
                                )
                            },
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(strings.guideAction)
                        }
                    }
                }
            }
        }
    }
}
