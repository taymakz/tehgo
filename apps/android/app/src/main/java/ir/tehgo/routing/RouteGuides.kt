package ir.tehgo.routing

import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroLine
import ir.tehgo.i18n.AppLanguage

/**
 * Ported from web-version/lib/route-guides.ts: builds "board X towards Y" / "transfer to X
 * towards Y" guidance strings from a computed route.
 */
object RouteGuides {

    private fun lineTerminal(
        paths: Map<String, List<LinePath>>,
        line: String,
        startStationId: String,
        nextStationId: String,
    ): String {
        val linePaths = paths[line] ?: return ""
        for (path in linePaths) {
            val startIndex = path.stationIds.indexOf(startStationId)
            val nextIndex = path.stationIds.indexOf(nextStationId)
            if (startIndex != -1 && nextIndex != -1) {
                return if (nextIndex > startIndex) path.toStationId else path.fromStationId
            }
        }
        return ""
    }

    fun firstStepGuide(
        route: RouteResult,
        lines: List<MetroLine>,
        paths: Map<String, List<LinePath>>,
        language: AppLanguage,
        stationName: (String) -> String,
    ): String {
        val firstStep = route.steps.firstOrNull() ?: return ""
        val lineId = firstStep.line
        val linesById = lines.associateBy { it.id }
        val lineName = linesById[lineId]?.localizedName(language) ?: lineId

        var lastStationOnLine = firstStep.stationId
        for (step in route.steps) {
            if (step.line != lineId) break
            lastStationOnLine = step.stationId
        }

        val terminal = lineTerminal(paths, lineId, firstStep.stationId, lastStationOnLine)
        val stationDisplay = stationName(firstStep.stationId)
        val terminalDisplay = stationName(terminal)

        return if (language == AppLanguage.FA) {
            "از ایستگاه $stationDisplay سوار $lineName به سمت $terminalDisplay شوید"
        } else {
            "Board $lineName at $stationDisplay station towards $terminalDisplay"
        }
    }

    fun transferGuide(
        route: RouteResult,
        transferIndex: Int,
        lines: List<MetroLine>,
        paths: Map<String, List<LinePath>>,
        language: AppLanguage,
        stationName: (String) -> String,
    ): String {
        if (transferIndex >= route.steps.size - 1) return ""
        val currentStep = route.steps[transferIndex]
        val nextStep = route.steps[transferIndex + 1]
        val transferTo = currentStep.transferTo ?: return ""

        val linesById = lines.associateBy { it.id }
        val toLineName = linesById[transferTo]?.localizedName(language) ?: transferTo
        val stationDisplay = stationName(currentStep.stationId)
        val terminal = lineTerminal(paths, transferTo, currentStep.stationId, nextStep.stationId)
        val terminalDisplay = stationName(terminal)

        val base = if (language == AppLanguage.FA) {
            "در ایستگاه $stationDisplay پیاده شوید و به سمت $toLineName $terminalDisplay بروید"
        } else {
            "At $stationDisplay station, transfer to $toLineName towards $terminalDisplay"
        }

        // The last transfer in the route - tell the rider this is the final line change so they
        // know to stop watching for further transfers and just ride it out to the destination.
        val isLastTransfer = route.steps.drop(transferIndex + 1).none { it.transferTo != null }
        if (!isLastTransfer) return base

        val noMoreTransfers = if (language == AppLanguage.FA) {
            "دیگر نیازی به تعویض نیست و تا مقصد میروید."
        } else {
            "No further transfers needed - ride this line to your destination."
        }
        return "$base. $noMoreTransfers"
    }
}
