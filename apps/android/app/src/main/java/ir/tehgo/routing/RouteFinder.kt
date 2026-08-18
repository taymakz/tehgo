package ir.tehgo.routing

import ir.tehgo.data.MetroGraph
import ir.tehgo.data.Station

/**
 * Ported from web-version/lib/route-finder.ts: DFS multi-route search over the metro graph,
 * capped at 30 stations / 4 transfers per path, sorted by transfers then station count.
 */
object RouteFinder {

    fun findRoutes(
        graph: MetroGraph,
        stationsById: Map<String, Station>,
        from: String,
        to: String,
        maxRoutes: Int = 5,
    ): List<RouteResult> {
        if (from == to) return emptyList()

        val allRoutes = mutableListOf<RouteResult>()

        fun buildRoute(path: List<String>): RouteResult {
            val steps = mutableListOf<RouteStep>()
            var prevLine = ""

            for (i in path.indices) {
                val stationId = path[i]
                if (stationsById[stationId] == null) continue

                val edge = if (i > 0) graph[path[i - 1]]?.find { it.to == stationId } else null
                val line = edge?.line ?: stationsById[stationId]?.lineIds?.firstOrNull().orEmpty()
                val isTransfer = line != prevLine && prevLine.isNotEmpty()

                if (isTransfer && steps.isNotEmpty()) {
                    steps[steps.size - 1] = steps.last().copy(transferTo = line)
                }

                steps += RouteStep(stationId = stationId, line = line, isTransfer = isTransfer)
                prevLine = line
            }

            val uniqueLines = steps.map { it.line }.filter { it.isNotEmpty() }.distinct()
            return RouteResult(
                steps = steps,
                totalStations = path.size,
                totalTransfers = uniqueLines.size - 1,
                lines = uniqueLines,
            )
        }

        val visited = HashSet<String>().apply { add(from) }
        val path = ArrayList<String>().apply { add(from) }

        fun dfs(current: String, currentLine: String, transfers: Int) {
            // Bounded early exit: once we've collected a generous oversample of candidates
            // (maxRoutes * 6), stop exploring further. Routes are sorted by
            // (totalTransfers, totalStations) and truncated to maxRoutes after the search
            // completes, so oversampling well past maxRoutes before stopping keeps the final
            // top-maxRoutes result essentially certain to match an exhaustive search - this
            // only bounds worst-case work on pathological/future-larger graphs, it isn't an
            // exact top-K algorithm.
            if (allRoutes.size >= maxRoutes * 6) return
            if (current == to) {
                allRoutes += buildRoute(path)
                return
            }
            if (path.size > 30 || transfers > 4) return

            val edges = (graph[current] ?: emptyList()).sortedBy { if (it.line == currentLine) 0 else 1 }
            for (edge in edges) {
                if (edge.to !in visited && stationsById.containsKey(edge.to)) {
                    val newTransfers = if (currentLine.isNotEmpty() && edge.line != currentLine) transfers + 1 else transfers
                    visited += edge.to
                    path += edge.to
                    dfs(edge.to, edge.line, newTransfers)
                    path.removeAt(path.size - 1)
                    visited -= edge.to
                }
            }
        }

        val initialLine = stationsById[from]?.lineIds?.firstOrNull().orEmpty()
        dfs(from, initialLine, 0)

        val uniqueRoutes = allRoutes.distinctBy { route -> route.steps.joinToString("-") { it.stationId } }
        return uniqueRoutes
            .sortedWith(compareBy({ it.totalTransfers }, { it.totalStations }))
            .take(maxRoutes)
    }
}
