package ir.tehgo.data

import android.content.Context
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

/**
 * Reads the bundled Tehran metro station list (ported from
 * web-version/data/stations.json, see web-version/migrate.md) out of assets/data.
 */
object StationsRepository {

    suspend fun loadStations(context: Context): List<Station> = withContext(Dispatchers.IO) {
        val json = context.assets.open("data/stations.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        val root = JSONObject(json)
        val stations = ArrayList<Station>(root.length())

        root.keys().forEach { id ->
            val entry = root.getJSONObject(id)
            val translations = entry.optJSONObject("translations")
            val colorsArray = entry.optJSONArray("colors")
            val colors = buildList {
                if (colorsArray != null) {
                    for (i in 0 until colorsArray.length()) {
                        parseHexColor(colorsArray.optString(i))?.let(::add)
                    }
                }
            }
            val linesArray = entry.optJSONArray("lines")
            val lineIds = buildList {
                if (linesArray != null) {
                    for (i in 0 until linesArray.length()) {
                        add(linesArray.getString(i))
                    }
                }
            }

            stations += Station(
                id = id,
                nameEn = entry.optString("name", id),
                nameFa = translations?.optString("fa").orEmpty(),
                lineColors = colors,
                lineIds = lineIds,
                latitude = entry.optString("latitude").toDoubleOrNull() ?: 0.0,
                longitude = entry.optString("longitude").toDoubleOrNull() ?: 0.0,
                address = entry.optString("address").takeIf { it.isNotBlank() },
            )
        }

        stations.sortedBy { it.nameEn }
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
