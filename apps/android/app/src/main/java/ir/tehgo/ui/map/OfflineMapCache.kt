package ir.tehgo.ui.map

import android.content.Context
import android.net.ConnectivityManager
import android.util.Log
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.geometry.LatLngBounds
import org.maplibre.android.offline.OfflineManager
import org.maplibre.android.offline.OfflineRegion
import org.maplibre.android.offline.OfflineRegionError
import org.maplibre.android.offline.OfflineRegionStatus
import org.maplibre.android.offline.OfflineTilePyramidRegionDefinition

private const val PrefsName = "tehgo_map_cache"
private const val KeyCached = "cached_v2"

// Covers the full extent of stations.json (lat 35.416111..35.8261, lng 50.8881..51.546757 as of
// this writing, incl. the Karaj-line stations west of central Tehran) plus a ~0.02deg (~2km)
// safety margin so edge stations aren't clipped mid-tile. This is ~2.33x the area of the old
// Tehran-only box. If new stations/lines are added outside this range in the future, re-derive
// these bounds from stations.json (or compute them dynamically at cache-time instead).
private val CachedNetworkBounds = LatLngBounds.Builder()
    .include(LatLng(35.85, 51.57))
    .include(LatLng(35.40, 50.87))
    .build()

private const val LogTag = "OfflineMapCache"

/**
 * Returns true only when the active network is unmetered (e.g. Wi-Fi), so we avoid triggering a
 * multi-region, multi-zoom-level tile download on a user's cellular data without their awareness.
 */
private fun isOnUnmeteredNetwork(context: Context): Boolean {
    val connectivityManager = context.getSystemService(ConnectivityManager::class.java) ?: return false
    return !connectivityManager.isActiveNetworkMetered
}

/**
 * Downloads the Tehran metro area's map tiles (both light and dark styles) once, so the map
 * still renders next time the app is opened without an internet connection. Idempotent across
 * app runs via a SharedPreferences flag. Skipped entirely on metered connections (retried the
 * next time this is called, e.g. the next Map-tab visit, once the device is on an unmetered
 * network). The "cached" flag is only set once both style regions report download completion.
 */
fun ensureOfflineMapCache(context: Context) {
    val prefs = context.getSharedPreferences(PrefsName, Context.MODE_PRIVATE)
    if (prefs.getBoolean(KeyCached, false)) return
    if (!isOnUnmeteredNetwork(context)) return

    val offlineManager = OfflineManager.getInstance(context)
    val pixelRatio = context.resources.displayMetrics.density
    val styles = listOf(LightMapStyleUrl, DarkMapStyleUrl)
    var completedCount = 0

    fun markCompleteIfAllDone() {
        completedCount++
        if (completedCount >= styles.size) {
            prefs.edit().putBoolean(KeyCached, true).apply()
        }
    }

    styles.forEach { styleUrl ->
        val definition = OfflineTilePyramidRegionDefinition(styleUrl, CachedNetworkBounds, 9.0, 14.0, pixelRatio)
        val metadata = styleUrl.toByteArray()
        // Guards against onStatusChanged delivering isComplete=true more than once for the same
        // region (observed as possible depending on SDK message delivery timing), which would
        // otherwise double-count towards completedCount and mark the cache "done" before the
        // other style's region has actually finished.
        var thisRegionCounted = false
        offlineManager.createOfflineRegion(
            definition,
            metadata,
            object : OfflineManager.CreateOfflineRegionCallback {
                override fun onCreate(offlineRegion: OfflineRegion) {
                    offlineRegion.setDownloadState(OfflineRegion.STATE_ACTIVE)
                    offlineRegion.setObserver(object : OfflineRegion.OfflineRegionObserver {
                        override fun onStatusChanged(status: OfflineRegionStatus) {
                            if (status.isComplete && !thisRegionCounted) {
                                thisRegionCounted = true
                                markCompleteIfAllDone()
                            }
                        }

                        override fun onError(error: OfflineRegionError) {
                            Log.w(LogTag, "Offline region download failed for $styleUrl: ${error.reason} - ${error.message}")
                        }

                        override fun mapboxTileCountLimitExceeded(limit: Long) {
                            Log.w(LogTag, "Tile count limit exceeded for $styleUrl: $limit")
                        }
                    })
                }

                override fun onError(error: String) {
                    Log.w(LogTag, "Failed to create offline region for $styleUrl: $error")
                }
            },
        )
    }
}
