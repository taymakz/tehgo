package ir.tehgo.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

data class GraphEdge(val to: String, val line: String, val weight: Int)

typealias MetroGraph = Map<String, List<GraphEdge>>

/**
 * Reads the bundled Tehran metro adjacency graph (ported from
 * web-version/data/graph.json, see web-version/migrate.md) out of assets/data.
 */
object GraphRepository {

    suspend fun loadGraph(context: Context): MetroGraph = withContext(Dispatchers.IO) {
        val json = context.assets.open("data/graph.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        val root = JSONObject(json)
        val graph = LinkedHashMap<String, List<GraphEdge>>(root.length())

        root.keys().forEach { stationId ->
            val edgesArray = root.getJSONArray(stationId)
            val edges = buildList {
                for (i in 0 until edgesArray.length()) {
                    val entry = edgesArray.getJSONObject(i)
                    add(
                        GraphEdge(
                            to = entry.optString("to"),
                            line = entry.optString("line"),
                            weight = entry.optInt("weight", 1),
                        ),
                    )
                }
            }
            graph[stationId] = edges
        }

        graph
    }
}
