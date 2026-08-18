package ir.tehgo.ui.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import kotlinx.coroutines.delay
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapLibreMapOptions
import org.maplibre.android.maps.MapView

val TehranCenter = LatLng(35.6892, 51.3890)

const val LightMapStyleUrl = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
const val DarkMapStyleUrl = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"

@Composable
private fun rememberMapViewWithLifecycle(): MapView {
    val context = LocalContext.current
    val mapView = remember {
        MapLibre.getInstance(context)
        // TextureView (not the default SurfaceView) rendering: the map lives inside Compose's
        // AnimatedContent tab-switch slide transition, which translates/resizes the view while
        // it's still attached. SurfaceView's GL render thread can't handle that - it deadlocks
        // in MapLibreSurfaceView$RenderThread.onWindowResize waiting on the main thread, which
        // then ANRs (confirmed via an on-device ANR trace blocked in exactly that method) whenever
        // the map is on screen during a tab change. TextureView composites through the normal
        // View hierarchy instead of a separate synced surface, so it isn't affected.
        val options = MapLibreMapOptions.createFromAttributes(context, null).textureMode(true)
        MapView(context, options)
    }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, mapView) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_CREATE -> mapView.onCreate(null)
                Lifecycle.Event.ON_START -> mapView.onStart()
                Lifecycle.Event.ON_RESUME -> mapView.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView.onPause()
                Lifecycle.Event.ON_STOP -> mapView.onStop()
                Lifecycle.Event.ON_DESTROY -> mapView.onDestroy()
                else -> {}
            }
        }
        lifecycle.addObserver(observer)
        onDispose {
            lifecycle.removeObserver(observer)
            mapView.onDestroy()
        }
    }
    return mapView
}

/**
 * Thin Compose wrapper around a MapLibre [MapView], styled with the free CARTO
 * Positron/Dark-Matter styles (same ones web-version/components/ui/map.tsx uses), swapped
 * automatically when [darkTheme] changes. Screens add their own sources/layers/markers onto
 * the [MapLibreMap] handed back via [onMapReady] — this wrapper only owns the view lifecycle,
 * style loading, and initial camera position.
 */
@Composable
fun MetroMapView(
    darkTheme: Boolean,
    modifier: Modifier = Modifier,
    initialCenter: LatLng = TehranCenter,
    initialZoom: Double = 11.0,
    onMapReady: (MapLibreMap) -> Unit = {},
) {
    val mapView = rememberMapViewWithLifecycle()
    val onMapReadyState = rememberUpdatedState(onMapReady)
    val styleUrl = if (darkTheme) DarkMapStyleUrl else LightMapStyleUrl

    // Setting the MapView's own background color isn't enough to stop the white-flash-in-dark-
    // theme: the GL/texture surface underneath still paints its own default before the style is
    // ready, and that surface draws on top regardless of the parent view's background. Cover it
    // with a real Compose box painted in the app's background color instead, and only drop it
    // once the style has actually finished loading. onMapReady firing isn't a reliable enough
    // signal on its own (the surface can still be warming up for a beat after), so also hold the
    // skeleton up for a fixed minimum duration - a dark loading skeleton for a moment is better
    // than a white flash.
    var isStyleReady by remember { mutableStateOf(false) }
    var minDurationElapsed by remember { mutableStateOf(false) }
    LaunchedEffect(styleUrl) {
        isStyleReady = false
        minDurationElapsed = false
        delay(500)
        minDurationElapsed = true
    }
    val showSkeleton = !isStyleReady || !minDurationElapsed

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            factory = { mapView },
            modifier = Modifier.fillMaxSize(),
            update = { view ->
                view.setBackgroundColor(if (darkTheme) 0xFF141414.toInt() else 0xFFFFFFFF.toInt())
                view.getMapAsync { map ->
                    // MapLibre's built-in compass defaults to sitting right under the status bar
                    // (unreachable/not clickable there) - push it down and clear our own top-corner
                    // Compose overlays (close button etc).
                    val density = view.resources.displayMetrics.density
                    val topMarginPx = (72 * density).toInt()
                    val sideMarginPx = (16 * density).toInt()
                    map.uiSettings.setCompassMargins(sideMarginPx, topMarginPx, sideMarginPx, sideMarginPx)

                    if (map.style?.uri != styleUrl) {
                        map.setStyle(styleUrl) {
                            map.cameraPosition = CameraPosition.Builder()
                                .target(initialCenter)
                                .zoom(initialZoom)
                                .build()
                            onMapReadyState.value(map)
                            isStyleReady = true
                        }
                    } else {
                        onMapReadyState.value(map)
                        isStyleReady = true
                    }
                }
            },
        )
        if (showSkeleton) {
            Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background))
        }
    }
}
