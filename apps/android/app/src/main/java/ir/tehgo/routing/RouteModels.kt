package ir.tehgo.routing

data class RouteStep(
    val stationId: String,
    val line: String,
    val isTransfer: Boolean,
    val transferTo: String? = null,
)

data class RouteResult(
    val steps: List<RouteStep>,
    val totalStations: Int,
    val totalTransfers: Int,
    val lines: List<String>,
)
