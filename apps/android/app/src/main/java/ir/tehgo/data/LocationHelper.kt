package ir.tehgo.data

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.os.CancellationSignal
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

object LocationHelper {

    private const val EarthRadiusMeters = 6371000.0
    private const val FreshFixTimeoutMillis = 12_000L

    fun haversineDistanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) +
            cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) * sin(dLon / 2).pow(2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return EarthRadiusMeters * c
    }

    /**
     * Tries for a fresh fix for up to [FreshFixTimeoutMillis]; if that never resolves (blocked
     * indoors, throttled by the OEM, etc.) falls back to whatever last-known location either
     * provider has cached, so the caller always gets an answer instead of spinning forever.
     */
    suspend fun getCurrentLocation(context: Context): Location? {
        val fresh = try {
            withTimeoutOrNull(FreshFixTimeoutMillis) { requestFreshLocation(context) }
        } catch (_: TimeoutCancellationException) {
            null
        }
        return fresh ?: lastKnownLocation(context)
    }

    @SuppressLint("MissingPermission")
    private suspend fun requestFreshLocation(context: Context): Location? = suspendCancellableCoroutine { cont ->
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        val provider = preferredProvider(locationManager)

        if (locationManager == null || provider == null) {
            cont.resumeIfActive(null)
            return@suspendCancellableCoroutine
        }

        val cancellationSignal = CancellationSignal()
        cont.invokeOnCancellation { cancellationSignal.cancel() }

        try {
            locationManager.getCurrentLocation(provider, cancellationSignal, context.mainExecutor) { location ->
                cont.resumeIfActive(location)
            }
        } catch (_: SecurityException) {
            cont.resumeIfActive(null)
        }
    }

    @SuppressLint("MissingPermission")
    private fun lastKnownLocation(context: Context): Location? {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
        return try {
            listOfNotNull(
                locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER),
                locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER),
            ).maxByOrNull { it.time }
        } catch (_: SecurityException) {
            null
        }
    }

    private fun preferredProvider(locationManager: LocationManager?): String? = when {
        locationManager == null -> null
        locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
        locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
        else -> null
    }

    private fun kotlinx.coroutines.CancellableContinuation<Location?>.resumeIfActive(location: Location?) {
        if (isActive) resume(location) {}
    }
}
