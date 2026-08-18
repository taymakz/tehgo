package ir.tehgo.routing

/**
 * Indices (into route.steps) to show in "summary" mode: the first step, the last step, and any
 * step immediately before a line change (i.e. a transfer point) — collapses runs of same-line
 * stations down to just origin + each transfer + destination.
 */
fun summaryStepIndices(route: RouteResult): List<Int> {
    if (route.steps.isEmpty()) return emptyList()
    val indices = mutableSetOf(0, route.steps.lastIndex)
    for (i in 0 until route.steps.lastIndex) {
        if (route.steps[i + 1].line != route.steps[i].line) indices += i
    }
    return indices.sorted()
}
