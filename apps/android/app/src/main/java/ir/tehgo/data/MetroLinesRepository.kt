package ir.tehgo.data

import android.content.Context
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

/**
 * Reads the bundled Tehran metro line + path data (ported from
 * web-version/data/{lines,paths}.json, see web-version/migrate.md) out of assets/data.
 */
object MetroLinesRepository {

    suspend fun loadLines(context: Context): List<MetroLine> = withContext(Dispatchers.IO) {
        val json = context.assets.open("data/lines.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        val root = JSONObject(json)
        val lines = ArrayList<MetroLine>(root.length())

        root.keys().forEach { id ->
            val entry = root.getJSONObject(id)
            val name = entry.optJSONObject("name")
            lines += MetroLine(
                id = id,
                nameEn = name?.optString("en").orEmpty(),
                nameFa = name?.optString("fa").orEmpty(),
                color = parseHexColor(entry.optString("color")) ?: Color.Gray,
            )
        }

        lines.sortedBy { it.id.substringAfterLast('_').toIntOrNull() ?: Int.MAX_VALUE }
    }

    suspend fun loadPaths(context: Context): Map<String, List<LinePath>> = withContext(Dispatchers.IO) {
        val json = context.assets.open("data/paths.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        val root = JSONObject(json)
        val result = LinkedHashMap<String, List<LinePath>>()

        root.keys().forEach { lineId ->
            val pathsArray = root.getJSONObject(lineId).optJSONArray("paths")
            val paths = buildList {
                if (pathsArray != null) {
                    for (i in 0 until pathsArray.length()) {
                        val entry = pathsArray.getJSONObject(i)
                        val stationsArray = entry.optJSONArray("stations")
                        val stationIds = buildList {
                            if (stationsArray != null) {
                                for (j in 0 until stationsArray.length()) {
                                    add(stationsArray.getString(j))
                                }
                            }
                        }
                        add(
                            LinePath(
                                id = entry.optString("id"),
                                fromStationId = entry.optString("from"),
                                toStationId = entry.optString("to"),
                                stationIds = stationIds,
                            ),
                        )
                    }
                }
            }
            result[lineId] = paths
        }

        result
    }

    private fun parseHexColor(hex: String?): Color? {
        if (hex.isNullOrBlank()) return null
        return try {
            Color(android.graphics.Color.parseColor(hex))
        } catch (_: IllegalArgumentException) {
            null
        }
    }
}
