package ir.tehgo.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

/**
 * SharedPreferences-backed recent/favorite route history, mirroring
 * web-version/lib/stores/recent-routes.ts (Zustand + localStorage persist).
 */
object RecentRoutesRepository {
    private const val PREFS_NAME = "tehgo_recent_routes"
    private const val KEY_ROUTES = "routes"
    private const val MAX_ENTRIES = 20

    suspend fun load(context: Context): List<RecentRoute> = withContext(Dispatchers.IO) {
        val raw = prefs(context).getString(KEY_ROUTES, null) ?: return@withContext emptyList()
        try {
            val array = JSONArray(raw)
            buildList {
                for (i in 0 until array.length()) {
                    val entry = array.getJSONObject(i)
                    add(
                        RecentRoute(
                            id = entry.getString("id"),
                            fromStationId = entry.getString("from"),
                            toStationId = entry.getString("to"),
                            timestamp = entry.getLong("timestamp"),
                            useCount = entry.optInt("useCount", 1),
                            isFavorite = entry.optBoolean("isFavorite", false),
                        ),
                    )
                }
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    suspend fun recordUsage(context: Context, fromStationId: String, toStationId: String): List<RecentRoute> = withContext(Dispatchers.IO) {
        val id = "$fromStationId-$toStationId"
        val current = load(context).toMutableList()
        val existingIndex = current.indexOfFirst { it.id == id }
        if (existingIndex >= 0) {
            val existing = current.removeAt(existingIndex)
            current.add(0, existing.copy(timestamp = System.currentTimeMillis(), useCount = existing.useCount + 1))
        } else {
            current.add(0, RecentRoute(id, fromStationId, toStationId, System.currentTimeMillis(), 1, false))
        }
        val trimmed = current.take(MAX_ENTRIES)
        save(context, trimmed)
        trimmed
    }

    suspend fun toggleFavorite(context: Context, id: String): List<RecentRoute> = withContext(Dispatchers.IO) {
        val updated = load(context).map { if (it.id == id) it.copy(isFavorite = !it.isFavorite) else it }
        save(context, updated)
        updated
    }

    suspend fun delete(context: Context, id: String): List<RecentRoute> = withContext(Dispatchers.IO) {
        val updated = load(context).filterNot { it.id == id }
        save(context, updated)
        updated
    }

    private fun save(context: Context, routes: List<RecentRoute>) {
        val array = JSONArray()
        routes.forEach { route ->
            array.put(
                JSONObject().apply {
                    put("id", route.id)
                    put("from", route.fromStationId)
                    put("to", route.toStationId)
                    put("timestamp", route.timestamp)
                    put("useCount", route.useCount)
                    put("isFavorite", route.isFavorite)
                },
            )
        }
        prefs(context).edit().putString(KEY_ROUTES, array.toString()).apply()
    }

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
