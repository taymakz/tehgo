package ir.tehgo.ui.routedetail

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.text.Layout
import android.text.StaticLayout
import android.text.TextDirectionHeuristics
import android.text.TextPaint
import androidx.compose.ui.graphics.toArgb
import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroLine
import ir.tehgo.data.Station
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import ir.tehgo.routing.RouteGuides
import ir.tehgo.routing.RouteResult
import ir.tehgo.routing.summaryStepIndices
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Native equivalent of web-version/lib/route-export.ts: renders the route timeline to a Bitmap
 * via android.graphics.Canvas (not a pixel-identical port, same information layout as the app's
 * own Route Detail screen - header card, colored line-badge chips per step, connector lines
 * sized to whatever the badge/guide text actually wraps to), then saves it to the gallery.
 */
object RouteImageExporter {

    private const val Width = 760
    private const val OuterPadding = 28
    private const val CardPadding = 26
    private const val CardGap = 20
    private const val CardCorner = 24f
    private const val CircleRadius = 11f
    private const val StepGap = 22f

    // The whole layout below is designed in these "design pixels"; the final bitmap is rendered
    // at RenderScale x that so shared/zoomed-into images stay crisp instead of looking like a
    // small phone screenshot. Canvas.scale() rasterizes text at the scaled-up size directly
    // (not a blurry bitmap upscale), so nothing else in the drawing code needs to change.
    private const val RenderScale = 3f

    suspend fun render(
        context: Context,
        result: RouteResult,
        fromStation: Station,
        toStation: Station,
        lines: List<MetroLine>,
        paths: Map<String, List<LinePath>>,
        stationsById: Map<String, Station>,
        language: AppLanguage,
        strings: AppStrings,
        darkTheme: Boolean,
        detailed: Boolean,
    ): Bitmap = withContext(Dispatchers.Default) {
        val visibleIndices = if (detailed) result.steps.indices.toList() else summaryStepIndices(result)
        val linesById = lines.associateBy { it.id }
        val isRtl = language == AppLanguage.FA
        val textDirection = if (isRtl) TextDirectionHeuristics.RTL else TextDirectionHeuristics.LTR
        val align = Layout.Alignment.ALIGN_NORMAL

        val bgColor = if (darkTheme) Color.parseColor("#141414") else Color.WHITE
        val fgColor = if (darkTheme) Color.parseColor("#E8E4DC") else Color.parseColor("#262626")
        val mutedColor = if (darkTheme) Color.parseColor("#818181") else Color.parseColor("#686868")
        val cardColor = if (darkTheme) Color.parseColor("#1C1C1C") else Color.parseColor("#F7F7F7")
        val infoColor = if (darkTheme) Color.parseColor("#60A5FA") else Color.parseColor("#3B82F6")
        val destructiveColor = if (darkTheme) Color.parseColor("#F15757") else Color.parseColor("#EF4444")

        fun textPaint(size: Float, color: Int, bold: Boolean = false) = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            textSize = size
            this.color = color
            isFakeBoldText = bold
        }

        val titlePaint = textPaint(30f, fgColor, bold = true)
        val routeTitlePaint = textPaint(26f, fgColor, bold = true)
        val statValuePaint = textPaint(24f, fgColor, bold = true)
        val statLabelPaint = textPaint(15f, mutedColor)
        val badgeLinePaint = textPaint(16f, Color.WHITE, bold = true)
        val badgeGuidePaint = textPaint(14f, Color.WHITE)
        val stationNamePaint = textPaint(21f, fgColor, bold = true)
        val addressPaint = textPaint(15f, mutedColor)
        val footerPaint = textPaint(15f, mutedColor).apply { textAlign = Paint.Align.CENTER }

        val contentWidth = Width - OuterPadding * 2 - CardPadding * 2

        // StaticLayout.getWidth() returns the constructor's max-width, not the actual rendered
        // line width - measure lines directly so badges/pills can hug their text snugly.
        fun StaticLayout.maxLineWidth(): Float {
            var max = 0f
            for (i in 0 until lineCount) max = maxOf(max, getLineWidth(i))
            return max
        }

        fun layoutOf(text: String, paint: TextPaint, maxWidth: Int): StaticLayout {
            val builder = StaticLayout.Builder
                .obtain(text, 0, text.length, paint, maxWidth)
                .setAlignment(align)
                .setTextDirection(textDirection)
                .setLineSpacing(0f, 1.05f)
                .setIncludePad(false)
            return builder.build()
        }

        // --- Pass 1: measure everything up front so we know the final bitmap height. ---

        // RTL reading order puts "from" on the right and "to" on the left, so the connecting
        // arrow needs to point left for Farsi instead of the LTR default.
        val routeArrow = if (isRtl) "←" else "→"
        val headerRouteLayout = layoutOf(
            "${fromStation.localizedName(language)}  $routeArrow  ${toStation.localizedName(language)}",
            routeTitlePaint,
            contentWidth,
        )
        val brandLineHeight = 40f
        val brandToRouteGap = 14f
        val routeToChipsGap = 22f
        val chipHeight = 64f
        val headerBottomPadding = CardPadding + 12f
        val headerHeight =
            brandLineHeight + brandToRouteGap + headerRouteLayout.height + routeToChipsGap + chipHeight + headerBottomPadding

        data class StepBlock(
            val badgeLineLayout: StaticLayout,
            val badgeGuideLayout: StaticLayout?,
            val badgeWidth: Float,
            val nameLayout: StaticLayout,
            val addressLayout: StaticLayout?,
            val color: Int,
            val height: Float,
        )

        val textStartX = CircleRadius * 2 + 18f
        val badgeTextWidth = (contentWidth - textStartX - 20f).toInt().coerceAtLeast(80)

        val stepBlocks = visibleIndices.map { stepIndex ->
            val step = result.steps[stepIndex]
            val station = stationsById[step.stationId]
            val line = linesById[step.line]
            val lineColor = line?.color?.toArgb() ?: Color.GRAY
            val lineName = line?.localizedName(language) ?: step.line

            val firstGuide = if (stepIndex == 0) {
                RouteGuides.firstStepGuide(result, lines, paths, language) {
                    stationsById[it]?.localizedName(language) ?: it
                }
            } else {
                ""
            }
            val transferGuide = if (step.transferTo != null) {
                RouteGuides.transferGuide(result, stepIndex, lines, paths, language) {
                    stationsById[it]?.localizedName(language) ?: it
                }
            } else {
                ""
            }
            val guideText = listOf(firstGuide, transferGuide).map { it.trim() }.filter { it.isNotBlank() }.joinToString("\n")

            // Measure with a generous width first, then rebuild each badge layout pinned to its
            // own snug content width - otherwise ALIGN_NORMAL's RTL right-alignment anchors to
            // the far edge of the wide measuring box instead of the pill's actual right edge.
            val wideLine = layoutOf(lineName, badgeLinePaint, badgeTextWidth)
            val wideGuide = if (guideText.isNotBlank()) layoutOf(guideText, badgeGuidePaint, badgeTextWidth) else null
            val badgeContentWidth = maxOf(wideLine.maxLineWidth(), wideGuide?.maxLineWidth() ?: 0f)
                .let { kotlin.math.ceil(it).toInt() + 2 }
                .coerceAtLeast(20)
            val badgeLineLayout = layoutOf(lineName, badgeLinePaint, badgeContentWidth)
            val badgeGuideLayout = wideGuide?.let { layoutOf(guideText, badgeGuidePaint, badgeContentWidth) }
            val badgeWidth = badgeContentWidth + 20f

            val nameLayout = layoutOf(station?.localizedName(language) ?: step.stationId, stationNamePaint, badgeTextWidth)
            val addressLayout = station?.address?.let { layoutOf(it, addressPaint, badgeTextWidth) }

            val badgeHeight = 12f + badgeLineLayout.height + (badgeGuideLayout?.let { 2f + it.height } ?: 0f)
            val contentHeight = badgeHeight + 8f + nameLayout.height + (addressLayout?.let { 4f + it.height } ?: 0f)
            val rowHeight = maxOf(contentHeight, CircleRadius * 2)

            StepBlock(badgeLineLayout, badgeGuideLayout, badgeWidth, nameLayout, addressLayout, lineColor, rowHeight)
        }

        val stepsInnerHeight = stepBlocks.sumOf { (it.height + StepGap).toInt() }.toFloat() - StepGap
        val stepsCardHeight = 20f + 44f + stepsInnerHeight + 8f

        val height = (OuterPadding * 2 + headerHeight + CardGap + stepsCardHeight + CardGap + 40f).toInt()

        val bitmap = Bitmap.createBitmap(
            (Width * RenderScale).toInt(),
            (height * RenderScale).toInt(),
            Bitmap.Config.ARGB_8888,
        )
        val canvas = Canvas(bitmap)
        canvas.scale(RenderScale, RenderScale)
        canvas.drawColor(bgColor)

        fun roundedCard(top: Float, cardHeight: Float): RectF {
            val rect = RectF(OuterPadding.toFloat(), top, (Width - OuterPadding).toFloat(), top + cardHeight)
            canvas.drawRoundRect(rect, CardCorner, CardCorner, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = cardColor })
            return rect
        }

        // --- Pass 2: draw. ---

        var top = OuterPadding.toFloat()
        val headerRect = roundedCard(top, headerHeight)
        run {
            var y = headerRect.top + CardPadding
            val brandX = if (isRtl) headerRect.right - CardPadding else headerRect.left + CardPadding
            val brandPaint = Paint(titlePaint).apply { textAlign = if (isRtl) Paint.Align.RIGHT else Paint.Align.LEFT }
            canvas.drawText("TehGo", brandX, y + 22f, brandPaint)
            y += brandLineHeight + brandToRouteGap

            canvas.save()
            canvas.translate(if (isRtl) headerRect.right - CardPadding - contentWidth else headerRect.left + CardPadding, y)
            headerRouteLayout.draw(canvas)
            canvas.restore()
            y += headerRouteLayout.height + routeToChipsGap

            // Stat chips: stations (info tint) + transfers (destructive tint), each with a
            // colored accent dot so they read clearly instead of a flat muddy tint block.
            val chipY = y
            val chipGap = 14f
            val chipWidth = (contentWidth - chipGap) / 2f
            val chipLeftX = headerRect.left + CardPadding

            fun drawStatChip(index: Int, value: String, label: String, tint: Int) {
                val x = chipLeftX + index * (chipWidth + chipGap)
                val rect = RectF(x, chipY, x + chipWidth, chipY + chipHeight)
                canvas.drawRoundRect(
                    rect,
                    16f,
                    16f,
                    Paint(Paint.ANTI_ALIAS_FLAG).apply {
                        color = tint
                        alpha = 40
                    },
                )

                val dotRadius = 7f
                val isChipRtl = isRtl
                val dotCx = if (isChipRtl) rect.right - 20f else rect.left + 20f
                val dotCy = rect.centerY()
                canvas.drawCircle(dotCx, dotCy, dotRadius, Paint(Paint.ANTI_ALIAS_FLAG).apply { color = tint })

                val textX = if (isChipRtl) dotCx - dotRadius - 12f else dotCx + dotRadius + 12f
                val valuePaint = Paint(statValuePaint).apply { textAlign = if (isChipRtl) Paint.Align.RIGHT else Paint.Align.LEFT }
                val labelPaint = Paint(statLabelPaint).apply { textAlign = if (isChipRtl) Paint.Align.RIGHT else Paint.Align.LEFT }
                canvas.drawText(value, textX, dotCy - 3f, valuePaint)
                canvas.drawText(label, textX, dotCy + 20f, labelPaint)
            }

            drawStatChip(if (isRtl) 1 else 0, result.totalStations.toString(), strings.totalStations, infoColor)
            drawStatChip(if (isRtl) 0 else 1, result.totalTransfers.toString(), strings.totalTransfers, destructiveColor)
        }
        top += headerHeight + CardGap

        val stepsRect = roundedCard(top, stepsCardHeight)
        run {
            var y = stepsRect.top + 20f
            val titlePaint2 = Paint(routeTitlePaint).apply {
                textSize = 20f
                textAlign = if (isRtl) Paint.Align.RIGHT else Paint.Align.LEFT
            }
            val titleX = if (isRtl) stepsRect.right - CardPadding else stepsRect.left + CardPadding
            canvas.drawText(strings.detailedRouteSteps, titleX, y + 18f, titlePaint2)
            y += 44f

            val circleX = if (isRtl) stepsRect.right - CardPadding - CircleRadius else stepsRect.left + CardPadding + CircleRadius
            val textLeft = if (isRtl) stepsRect.right - CardPadding - textStartX else stepsRect.left + CardPadding + textStartX

            stepBlocks.forEachIndexed { index, block ->
                val rowTop = y
                val circlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = block.color }
                if (index < stepBlocks.lastIndex) {
                    val linePaint = Paint().apply {
                        color = block.color
                        alpha = 110
                        strokeWidth = 3f
                    }
                    canvas.drawLine(
                        circleX,
                        rowTop + CircleRadius * 2,
                        circleX,
                        rowTop + block.height + StepGap,
                        linePaint,
                    )
                }
                canvas.drawCircle(circleX, rowTop + CircleRadius, CircleRadius, circlePaint)

                var textY = rowTop
                val badgeWidth = block.badgeWidth
                val badgeHeight = 12f + block.badgeLineLayout.height + (block.badgeGuideLayout?.let { 2f + it.height } ?: 0f)
                val badgeLeft = if (isRtl) textLeft - badgeWidth else textLeft
                canvas.drawRoundRect(
                    RectF(badgeLeft, textY, badgeLeft + badgeWidth, textY + badgeHeight),
                    10f,
                    10f,
                    Paint(Paint.ANTI_ALIAS_FLAG).apply { color = block.color },
                )
                canvas.save()
                canvas.translate(badgeLeft + 10f, textY + 6f)
                block.badgeLineLayout.draw(canvas)
                canvas.restore()
                block.badgeGuideLayout?.let { guideLayout ->
                    canvas.save()
                    canvas.translate(badgeLeft + 10f, textY + 6f + block.badgeLineLayout.height + 2f)
                    guideLayout.draw(canvas)
                    canvas.restore()
                }
                textY += badgeHeight + 8f

                canvas.save()
                canvas.translate(if (isRtl) textLeft - block.nameLayout.width else textLeft, textY)
                block.nameLayout.draw(canvas)
                canvas.restore()
                textY += block.nameLayout.height

                block.addressLayout?.let { addrLayout ->
                    textY += 4f
                    canvas.save()
                    canvas.translate(if (isRtl) textLeft - addrLayout.width else textLeft, textY)
                    addrLayout.draw(canvas)
                    canvas.restore()
                }

                y += block.height + StepGap
            }
        }
        top += stepsCardHeight + CardGap

        canvas.drawText(
            if (isRtl) "ساخته شده با ❤ توسط TehGo" else "Made with love by TehGo",
            Width / 2f,
            top + 22f,
            footerPaint,
        )

        bitmap
    }

    fun saveToGallery(context: Context, bitmap: Bitmap): Uri? {
        return try {
            val resolver = context.contentResolver
            val contentValues = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, "tehgo_route_${System.currentTimeMillis()}.png")
                put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Tehgo")
            }
            val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues) ?: return null
            resolver.openOutputStream(uri)?.use { out -> bitmap.compress(Bitmap.CompressFormat.PNG, 100, out) }
            uri
        } catch (_: Exception) {
            null
        }
    }
}
