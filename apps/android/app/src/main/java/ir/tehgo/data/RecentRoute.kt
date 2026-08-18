package ir.tehgo.data

data class RecentRoute(
    val id: String,
    val fromStationId: String,
    val toStationId: String,
    val timestamp: Long,
    val useCount: Int,
    val isFavorite: Boolean,
)
