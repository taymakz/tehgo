package ir.tehgo.ui.map

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Ported from web-version/app/[lang]/(main)/route/_components/station-selector.tsx's
 * fetchOsrmRoute: hits OSRM's free public demo server, driving profile (matches web parity).
 */
suspend fun fetchOsrmRoute(
    startLng: Double,
    startLat: Double,
    endLng: Double,
    endLat: Double,
): List<Pair<Double, Double>>? = withContext(Dispatchers.IO) {
    try {
        val url = "https://router.project-osrm.org/route/v1/driving/" +
            "$startLng,$startLat;$endLng,$endLat?overview=full&geometries=geojson"
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.connectTimeout = 8000
        connection.readTimeout = 8000
        connection.requestMethod = "GET"

        if (connection.responseCode != HttpURLConnection.HTTP_OK) return@withContext null

        val body = connection.inputStream.bufferedReader().use { it.readText() }
        val routes = JSONObject(body).optJSONArray("routes") ?: return@withContext null
        if (routes.length() == 0) return@withContext null

        val coordinates = routes.getJSONObject(0)
            .getJSONObject("geometry")
            .getJSONArray("coordinates")

        buildList {
            for (i in 0 until coordinates.length()) {
                val point = coordinates.getJSONArray(i)
                add(point.getDouble(0) to point.getDouble(1))
            }
        }
    } catch (_: Exception) {
        null
    }
}
