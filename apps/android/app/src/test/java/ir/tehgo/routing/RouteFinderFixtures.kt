package ir.tehgo.routing

import androidx.compose.ui.graphics.Color
import ir.tehgo.data.GraphEdge
import ir.tehgo.data.MetroGraph
import ir.tehgo.data.Station

/**
 * Shared fixture builders for [RouteFinderTest]. These are small, hand-built graphs used to
 * characterize [RouteFinder.findRoutes] behavior — they are unrelated to the real bundled
 * assets/data/graph.json.
 */
object RouteFinderFixtures {

    fun station(id: String, line: String): Station = Station(
        id = id,
        nameEn = id,
        nameFa = id,
        lineColors = listOf(Color.Black),
        lineIds = listOf(line),
        latitude = 0.0,
        longitude = 0.0,
        address = null,
    )

    private fun edge(to: String, line: String) = GraphEdge(to = to, line = line, weight = 1)

    /**
     * Linear chain: A -L1-> B -L1-> C -L2-> D -L3-> E, plus an isolated "ISO" station with no
     * edges connecting it to the rest of the graph.
     *
     *   A -> B -> C: single line "L1" throughout (no transfer).
     *   C -> D: line changes L1 -> L2 (one transfer).
     *   D -> E: line changes L2 -> L3 (a second transfer).
     *
     * Covers: direct route, one-transfer route, two-transfer route, and an unreachable target.
     */
    fun linearFixture(): Pair<MetroGraph, Map<String, Station>> {
        val graph: MetroGraph = mapOf(
            "A" to listOf(edge("B", "L1")),
            "B" to listOf(edge("C", "L1")),
            "C" to listOf(edge("D", "L2")),
            "D" to listOf(edge("E", "L3")),
            "E" to emptyList(),
            "ISO" to emptyList(),
        )
        val stations = listOf(
            station("A", "L1"),
            station("B", "L1"),
            station("C", "L1"),
            station("D", "L2"),
            station("E", "L3"),
            station("ISO", "L9"),
        ).associateBy { it.id }
        return graph to stations
    }

    /**
     * Branching fixture: S has 5 outgoing branches to T, each a straight (non-branching) chain,
     * with deliberately distinct (transfers, totalStations) pairs so the globally-best 3 routes
     * ranked by (transfers asc, totalStations asc) are unambiguous:
     *
     *   M1 branch (S -L0-> M1 -L0-> T):                    0 transfers, 3 stations. (best)
     *   M2 branch (S -L2-> M2 -L2-> T):                     1 transfer,  3 stations.
     *   M3 branch (S -L3-> M3 -L3-> M3b -L3-> T):           1 transfer,  4 stations.
     *   M4 branch (S -L4-> M4 -> M4b -> M4c -L4-> T):       1 transfer,  5 stations.
     *   M5 branch (S -L5-> M5 -> M5b -> M5c -> M5d -L5-> T):1 transfer,  6 stations. (worst)
     *
     * S's own default line is "L0", matching only the M1 edge, so RouteFinder's
     * same-line-first edge ordering always visits the M1 branch first during DFS; the
     * remaining branches are listed in graph["S"] as M5, M4, M3, M2 — deliberately NOT in
     * best-to-worst order — so DFS *discovers* routes in the order M1, M5, M4, M3, M2. A
     * naive "keep the first N discovered" truncation would therefore produce a different,
     * wrong result from the correct "sort by (transfers, totalStations) then take N".
     */
    fun branchingFixture(): Pair<MetroGraph, Map<String, Station>> {
        val graph: MetroGraph = mapOf(
            "S" to listOf(
                edge("M1", "L0"),
                edge("M5", "L5"),
                edge("M4", "L4"),
                edge("M3", "L3"),
                edge("M2", "L2"),
            ),
            "M1" to listOf(edge("T", "L0")),
            "M2" to listOf(edge("T", "L2")),
            "M3" to listOf(edge("M3b", "L3")),
            "M3b" to listOf(edge("T", "L3")),
            "M4" to listOf(edge("M4b", "L4")),
            "M4b" to listOf(edge("M4c", "L4")),
            "M4c" to listOf(edge("T", "L4")),
            "M5" to listOf(edge("M5b", "L5")),
            "M5b" to listOf(edge("M5c", "L5")),
            "M5c" to listOf(edge("M5d", "L5")),
            "M5d" to listOf(edge("T", "L5")),
            "T" to emptyList(),
        )
        val stations = listOf(
            station("S", "L0"),
            station("M1", "L0"),
            station("M2", "L2"),
            station("M3", "L3"),
            station("M3b", "L3"),
            station("M4", "L4"),
            station("M4b", "L4"),
            station("M4c", "L4"),
            station("M5", "L5"),
            station("M5b", "L5"),
            station("M5c", "L5"),
            station("M5d", "L5"),
            station("T", "L0"),
        ).associateBy { it.id }
        return graph to stations
    }

    /**
     * Single-line chain of [count] stations (X1..X{count}), each connected to the next by an
     * edge on line "L1". Used to exercise the DFS's `path.size > 30` cap.
     */
    fun chainFixture(count: Int): Pair<MetroGraph, Map<String, Station>> {
        val ids = (1..count).map { "X$it" }
        val graph: MetroGraph = ids.mapIndexed { index, id ->
            val edges = if (index < ids.lastIndex) listOf(edge(ids[index + 1], "L1")) else emptyList()
            id to edges
        }.toMap()
        val stations = ids.map { station(it, "L1") }.associateBy { it.id }
        return graph to stations
    }
}
