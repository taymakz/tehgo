package ir.tehgo.routing

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Characterization tests for [RouteFinder.findRoutes] — the DFS multi-route search that
 * produces every route the app shows a user. These tests pin down the *current* behavior
 * against small, hand-built fixture graphs (see [RouteFinderFixtures]); they intentionally do
 * not touch the real bundled assets/data/graph.json.
 */
class RouteFinderTest {

    @Test
    fun fromEqualsTo_returnsEmptyList() {
        val (graph, stations) = RouteFinderFixtures.linearFixture()

        val result = RouteFinder.findRoutes(graph, stations, from = "A", to = "A")

        assertTrue(result.isEmpty())
    }

    @Test
    fun directRoute_noTransfer_returnsSingleRouteWithZeroTransfers() {
        val (graph, stations) = RouteFinderFixtures.linearFixture()

        val result = RouteFinder.findRoutes(graph, stations, from = "A", to = "C")

        assertEquals(1, result.size)
        val route = result[0]
        assertEquals(listOf("A", "B", "C"), route.steps.map { it.stationId })
        assertEquals(0, route.totalTransfers)
        assertEquals(3, route.totalStations)
        assertEquals(listOf("L1"), route.lines)
        assertTrue(route.steps.none { it.isTransfer })
        assertTrue(route.steps.all { it.transferTo == null })
    }

    @Test
    fun oneTransferRoute_marksTransferOnCorrectSteps() {
        val (graph, stations) = RouteFinderFixtures.linearFixture()

        val result = RouteFinder.findRoutes(graph, stations, from = "A", to = "D")

        assertEquals(1, result.size)
        val route = result[0]
        assertEquals(listOf("A", "B", "C", "D"), route.steps.map { it.stationId })
        assertEquals(1, route.totalTransfers)
        assertEquals(4, route.totalStations)
        assertEquals(listOf("L1", "L2"), route.lines)

        // transferTo is set on the step immediately BEFORE the line change (C, still on L1),
        // while isTransfer is set on the step where the new line begins (D).
        val (stepA, stepB, stepC, stepD) = route.steps
        assertTrue(!stepA.isTransfer && stepA.transferTo == null)
        assertTrue(!stepB.isTransfer && stepB.transferTo == null)
        assertTrue(!stepC.isTransfer)
        assertEquals("L2", stepC.transferTo)
        assertTrue(stepD.isTransfer)
        assertNull(stepD.transferTo)
    }

    @Test
    fun twoTransferRoute_countsBothTransfersAndAllowsOverlappingFlags() {
        val (graph, stations) = RouteFinderFixtures.linearFixture()

        val result = RouteFinder.findRoutes(graph, stations, from = "A", to = "E")

        assertEquals(1, result.size)
        val route = result[0]
        assertEquals(listOf("A", "B", "C", "D", "E"), route.steps.map { it.stationId })
        assertEquals(2, route.totalTransfers)
        assertEquals(5, route.totalStations)
        assertEquals(listOf("L1", "L2", "L3"), route.lines)

        val (stepA, stepB, stepC, stepD, stepE) = route.steps
        assertTrue(!stepA.isTransfer && stepA.transferTo == null)
        assertTrue(!stepB.isTransfer && stepB.transferTo == null)
        assertTrue(!stepC.isTransfer)
        assertEquals("L2", stepC.transferTo)
        // D sits at the boundary of both transfers: it arrives on the new line (isTransfer
        // true, from the C->D transfer) AND is itself the step immediately before the next
        // line change (transferTo "L3", for the D->E transfer). Both flags are true at once.
        assertTrue(stepD.isTransfer)
        assertEquals("L3", stepD.transferTo)
        assertTrue(stepE.isTransfer)
        assertNull(stepE.transferTo)
    }

    @Test
    fun unreachableTarget_returnsEmptyList() {
        val (graph, stations) = RouteFinderFixtures.linearFixture()

        val result = RouteFinder.findRoutes(graph, stations, from = "A", to = "ISO")

        assertTrue(result.isEmpty())
    }

    @Test
    fun maxRoutesTruncation_keepsGloballyBestRoutesNotFirstFound() {
        val (graph, stations) = RouteFinderFixtures.branchingFixture()

        val result = RouteFinder.findRoutes(graph, stations, from = "S", to = "T", maxRoutes = 3)

        assertEquals(3, result.size)

        // DFS discovers branches in order M1, M5, M4, M3, M2 (see fixture doc comment). A
        // naive "first 3 discovered" truncation would keep M1, M5, M4 — this asserts the
        // actual, correct behavior: sort by (transfers, totalStations) ascending, THEN take 3,
        // which keeps M1, M2, M3 and drops the two worse branches (M4, M5).
        val secondStationIds = result.map { it.steps[1].stationId }
        assertEquals(listOf("M1", "M2", "M3"), secondStationIds)

        assertEquals(0, result[0].totalTransfers)
        assertEquals(3, result[0].totalStations)
        assertEquals(1, result[1].totalTransfers)
        assertEquals(3, result[1].totalStations)
        assertEquals(1, result[2].totalTransfers)
        assertEquals(4, result[2].totalStations)
    }

    @Test
    fun dfsCap_chainExceedingCap_returnsEmptyPromptly() {
        // A single-line chain of 40 stations: reaching X40 requires path.size to exceed 30
        // (the DFS cap) while still short of the target, so the search must abandon this
        // branch before ever reaching X40.
        val (graph, stations) = RouteFinderFixtures.chainFixture(40)

        val startNanos = System.nanoTime()
        val result = RouteFinder.findRoutes(graph, stations, from = "X1", to = "X40")
        val elapsedMs = (System.nanoTime() - startNanos) / 1_000_000

        assertTrue(result.isEmpty())
        assertTrue("expected DFS to terminate quickly, took ${elapsedMs}ms", elapsedMs < 2000)
    }

    @Test
    fun dfsCap_chainAtCapBoundary_findsRoute() {
        // A chain of exactly 31 stations: the target is reached exactly when path.size == 31,
        // and the `current == to` check runs before the `path.size > 30` cap check, so the
        // route at this boundary is still found (the cap only blocks further expansion past
        // non-target nodes).
        val (graph, stations) = RouteFinderFixtures.chainFixture(31)

        val result = RouteFinder.findRoutes(graph, stations, from = "X1", to = "X31")

        assertEquals(1, result.size)
        assertEquals(31, result[0].totalStations)
        assertEquals(0, result[0].totalTransfers)
    }
}
