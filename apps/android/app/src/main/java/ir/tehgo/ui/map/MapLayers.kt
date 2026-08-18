package ir.tehgo.ui.map

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroLine
import ir.tehgo.data.Station
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.routing.RouteResult
import org.maplibre.android.maps.Style
import org.maplibre.android.style.expressions.Expression
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.layers.Property
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.layers.SymbolLayer
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.geojson.Feature
import org.maplibre.geojson.FeatureCollection
import org.maplibre.geojson.LineString
import org.maplibre.geojson.Point

fun Color.toHex(): String {
    val argb = this.toArgb()
    return String.format("#%06X", 0xFFFFFF and argb)
}

const val NetworkLinesSourceId = "tehgo-network-lines"
const val NetworkLinesLayerId = "tehgo-network-lines-layer"
const val StationsSourceId = "tehgo-stations"
const val StationsLayerId = "tehgo-stations-layer"
const val StationMarkersLayerId = "tehgo-station-markers-layer"
const val StationLabelsLayerId = "tehgo-station-labels-layer"
const val StationLabelMinZoom = 12f
private const val PopoverBubbleImageId = "tehgo-popover-bubble"

// Bitmap markers are rendered at this many native px per "design px" of the plain circle marker,
// so the split-color wedges stay smooth/anti-aliased rather than blocky.
private const val StationMarkerScale = 4f

/**
 * Split-color marker for an interchange station (2+ distinct line colors) - half/half for two
 * lines, equal pie wedges for three or more, matching the website's linear-gradient/conic-gradient
 * station dots. Plain single-line stations keep using the flat-colored CircleLayer instead.
 */
private fun buildSplitStationMarkerBitmap(colors: List<Color>): android.graphics.Bitmap {
    val size = (16 * StationMarkerScale).toInt()
    val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    val center = size / 2f
    val strokeWidth = 1.5f * StationMarkerScale
    val radius = size / 2f - strokeWidth / 2f

    val sweep = 360f / colors.size
    val bounds = android.graphics.RectF(center - radius, center - radius, center + radius, center + radius)
    colors.forEachIndexed { index, color ->
        val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
            this.color = color.toArgb()
            style = android.graphics.Paint.Style.FILL
        }
        canvas.drawArc(bounds, -90f + index * sweep, sweep, true, paint)
    }

    val strokePaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
        this.color = android.graphics.Color.WHITE
        style = android.graphics.Paint.Style.STROKE
        this.strokeWidth = strokeWidth
    }
    canvas.drawCircle(center, center, radius, strokePaint)
    return bitmap
}

/**
 * Shared popover background for every map label (station names + guide callouts): a plain
 * inverted "bg-foreground/text-background" rounded rectangle with generous padding, matching the
 * website's Tooltip bubble. Stretched to fit each label's own text via icon-text-fit, so this one
 * small base tile covers every label regardless of text length.
 */
// MapLibre's icon-text-fit stretches this bitmap up to fit each label's own text box, and a
// too-small source looks pixelated/blurry once magnified - draw it at a generous native
// resolution (design size x this factor) so the rounded corners stay smooth after scaling,
// regardless of exactly how much the renderer ends up stretching it.
private const val PopoverBubbleScale = 8f

private fun buildPopoverBubbleBitmap(darkTheme: Boolean): android.graphics.Bitmap {
    val width = (32 * PopoverBubbleScale).toInt()
    val height = (20 * PopoverBubbleScale).toInt()
    val bitmap = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
        color = if (darkTheme) 0xF2F5F5F5.toInt() else 0xF2262626.toInt()
    }
    canvas.drawRoundRect(
        android.graphics.RectF(0f, 0f, width.toFloat(), height.toFloat()),
        4f * PopoverBubbleScale,
        4f * PopoverBubbleScale,
        paint,
    )
    return bitmap
}

/**
 * CARTO's glyph server doesn't have Persian/Arabic coverage for the style's unset default font
 * stack (Open Sans Regular -> Arial Unicode MS Regular, the latter 404s outright) - Farsi text
 * silently fails to render with no error. "Noto Sans Regular" (one of the style's own declared
 * font stacks) does serve the Arabic Unicode block, so every custom text symbol layer needs to
 * request it explicitly rather than relying on the unset default.
 */
private val LabelFontStack = arrayOf("Noto Sans Regular")

/** All metro line polylines, from every branch path, colored per line. */
fun addNetworkLinesLayer(
    style: Style,
    lines: List<MetroLine>,
    paths: Map<String, List<LinePath>>,
    stationsById: Map<String, Station>,
    opacity: Float = 0.7f,
    width: Float = 3f,
) {
    val linesById = lines.associateBy { it.id }
    val features = mutableListOf<Feature>()
    paths.forEach { (lineId, linePaths) ->
        val color = linesById[lineId]?.color?.toHex() ?: "#888888"
        linePaths.forEach { path ->
            val points = path.stationIds.mapNotNull { sid ->
                stationsById[sid]?.let { Point.fromLngLat(it.longitude, it.latitude) }
            }
            if (points.size >= 2) {
                val feature = Feature.fromGeometry(LineString.fromLngLats(points))
                feature.addStringProperty("color", color)
                features += feature
            }
        }
    }

    style.addSource(GeoJsonSource(NetworkLinesSourceId, FeatureCollection.fromFeatures(features)))
    style.addLayer(
        LineLayer(NetworkLinesLayerId, NetworkLinesSourceId).withProperties(
            PropertyFactory.lineColor(Expression.get("color")),
            PropertyFactory.lineWidth(width),
            PropertyFactory.lineOpacity(opacity),
            PropertyFactory.lineCap(Property.LINE_CAP_ROUND),
            PropertyFactory.lineJoin(Property.LINE_JOIN_ROUND),
        ),
    )
}

/**
 * Station points, colored by their first line, plus a zoom-gated name label per station. Updates
 * the existing source in place when called again (e.g. with a different, route-scoped station
 * list) instead of throwing on a duplicate source id.
 */
fun addStationsLayer(
    style: Style,
    stations: List<Station>,
    language: AppLanguage,
    darkTheme: Boolean,
    excludeLabelStationIds: Set<String> = emptySet(),
) {
    val features = stations.map { station ->
        val distinctColors = station.lineColors.distinct()
        val isInterchange = distinctColors.size > 1
        Feature.fromGeometry(Point.fromLngLat(station.longitude, station.latitude)).apply {
            addStringProperty("id", station.id)
            addStringProperty("nameEn", station.nameEn)
            addStringProperty("nameFa", station.nameFa)
            addStringProperty("color", distinctColors.firstOrNull()?.toHex() ?: "#888888")
            addBooleanProperty("multiLine", isInterchange)
            addStringProperty("markerIcon", if (isInterchange) "tehgo-station-marker-${station.id}" else "")
            // A guide callout (setGuideCallouts) already draws its own popover - with the
            // station's name as its own title line - at this exact point. Suppressing the plain
            // name label here too avoids two overlapping bubbles stacked on the same station.
            addBooleanProperty("hasCallout", station.id in excludeLabelStationIds)
        }
    }
    val collection = FeatureCollection.fromFeatures(features)

    // Still runs every call (a screen can call this again with a different, route-scoped station
    // subset), but skips re-building/re-uploading a bitmap for any station whose marker image is
    // already registered under this style - switching between route variants on the same screen
    // (RouteMapOverlay) re-calls this with overlapping station sets, and this avoids redundant
    // Bitmap/Canvas work and GPU texture re-uploads for markers that didn't change.
    stations.forEach { station ->
        val distinctColors = station.lineColors.distinct()
        val imageId = "tehgo-station-marker-${station.id}"
        if (distinctColors.size > 1 && style.getImage(imageId) == null) {
            style.addImage(imageId, buildSplitStationMarkerBitmap(distinctColors))
        }
    }

    val existingSource = style.getSourceAs<GeoJsonSource>(StationsSourceId)
    if (existingSource != null) {
        existingSource.setGeoJson(collection)
        return
    }

    style.addSource(GeoJsonSource(StationsSourceId, collection))
    style.addLayer(
        CircleLayer(StationsLayerId, StationsSourceId).withProperties(
            PropertyFactory.circleRadius(6f),
            PropertyFactory.circleColor(Expression.get("color")),
            PropertyFactory.circleStrokeWidth(1.5f),
            PropertyFactory.circleStrokeColor("#ffffff"),
        ).apply { setFilter(Expression.neq(Expression.get("multiLine"), Expression.literal(true))) },
    )
    style.addLayer(
        SymbolLayer(StationMarkersLayerId, StationsSourceId).withProperties(
            PropertyFactory.iconImage(Expression.get("markerIcon")),
            PropertyFactory.iconSize(0.8f),
            PropertyFactory.iconAllowOverlap(true),
            PropertyFactory.iconIgnorePlacement(true),
        ).apply { setFilter(Expression.eq(Expression.get("multiLine"), Expression.literal(true))) },
    )
    style.addImage(PopoverBubbleImageId, buildPopoverBubbleBitmap(darkTheme))
    style.addLayer(
        SymbolLayer(StationLabelsLayerId, StationsSourceId).withProperties(
            *stationLabelProperties(language, darkTheme),
        ).apply {
            minZoom = StationLabelMinZoom
            setFilter(Expression.neq(Expression.get("hasCallout"), Expression.literal(true)))
        },
    )
}

private fun stationLabelProperties(language: AppLanguage, darkTheme: Boolean): Array<org.maplibre.android.style.layers.PropertyValue<*>> = arrayOf(
    PropertyFactory.textField(Expression.get(if (language == AppLanguage.FA) "nameFa" else "nameEn")),
    PropertyFactory.textFont(LabelFontStack),
    PropertyFactory.textSize(11.5f),
    // Station names are meant to stay a single line inside their chip - without this,
    // MapLibre's default 10-em wrap width kicks in for longer names, which then don't match
    // what icon-text-fit sized the bubble for and end up looking broken/non-rectangular.
    PropertyFactory.textMaxWidth(40f),
    PropertyFactory.textOffset(arrayOf(0f, 1.2f)),
    PropertyFactory.textAnchor("top"),
    // Inverted "bg-foreground/text-background" tone, matching the website Tooltip's bubble.
    PropertyFactory.textColor(if (darkTheme) "#262626" else "#F5F5F5"),
    PropertyFactory.iconImage(PopoverBubbleImageId),
    PropertyFactory.iconTextFit(Property.ICON_TEXT_FIT_BOTH),
    // Padding is [top, right, bottom, left] around the text box. Slightly more at the bottom
    // than the top so the text optically centers in the bubble - Persian/Arabic script's
    // descenders otherwise eat into a symmetric bottom margin and the text reads as sitting
    // too low/off-center.
    PropertyFactory.iconTextFitPadding(arrayOf(6f, 10f, 9f, 10f)),
    // Real collision detection (not forced overlap): labels that would crowd each other are
    // hidden rather than drawn on top of one another, and textPadding keeps a visible gap
    // between the ones that do show - more become visible as you zoom in and stations spread
    // out on screen.
    PropertyFactory.iconAllowOverlap(false),
    PropertyFactory.iconIgnorePlacement(false),
    PropertyFactory.textAllowOverlap(false),
    PropertyFactory.textIgnorePlacement(false),
    PropertyFactory.textPadding(10f),
    PropertyFactory.textOptional(true),
)

/** Call when the app language changes so already-added station labels switch text immediately. */
fun updateStationLabelLanguage(style: Style, language: AppLanguage, darkTheme: Boolean) {
    val layer = style.getLayerAs<SymbolLayer>(StationLabelsLayerId) ?: return
    layer.setProperties(*stationLabelProperties(language, darkTheme))
}

const val GuideRouteSourceId = "tehgo-guide-route"
const val GuideRouteLayerId = "tehgo-guide-route-layer"
const val UserLocationSourceId = "tehgo-user-location"
const val UserLocationLayerId = "tehgo-user-location-layer"

/** Draws (or replaces) a single walking/driving guide route line, e.g. the OSRM preview. */
fun setGuideRoute(style: Style, coordinates: List<Pair<Double, Double>>, color: Color) {
    val points = coordinates.map { (lng, lat) -> Point.fromLngLat(lng, lat) }
    val source = style.getSourceAs<GeoJsonSource>(GuideRouteSourceId)
    if (source != null) {
        source.setGeoJson(LineString.fromLngLats(points))
    } else {
        style.addSource(GeoJsonSource(GuideRouteSourceId, LineString.fromLngLats(points)))
        style.addLayer(
            LineLayer(GuideRouteLayerId, GuideRouteSourceId).withProperties(
                PropertyFactory.lineColor(color.toHex()),
                PropertyFactory.lineWidth(5f),
                PropertyFactory.lineOpacity(0.85f),
            ),
        )
    }
}

fun clearGuideRoute(style: Style) {
    style.getLayer(GuideRouteLayerId)?.let { style.removeLayer(it) }
    style.getSource(GuideRouteSourceId)?.let { style.removeSource(it) }
}

const val RouteHighlightSourceId = "tehgo-route-highlight"
const val RouteHighlightLayerId = "tehgo-route-highlight-layer"
const val RouteEndpointsSourceId = "tehgo-route-endpoints"
const val RouteEndpointsLayerId = "tehgo-route-endpoints-layer"
const val RouteEndpointLabelsLayerId = "tehgo-route-endpoints-labels-layer"
const val GuideCalloutsSourceId = "tehgo-guide-callouts"
const val GuideCalloutsLayerId = "tehgo-guide-callouts-layer"
const val GuideCalloutLabelsLayerId = "tehgo-guide-callouts-labels-layer"

private fun buildRouteSegments(
    route: RouteResult,
    stationsById: Map<String, Station>,
): List<Pair<String, List<Point>>> {
    val segments = mutableListOf<Pair<String, MutableList<Point>>>()
    route.steps.forEach { step ->
        val station = stationsById[step.stationId] ?: return@forEach
        val point = Point.fromLngLat(station.longitude, station.latitude)
        if (segments.isEmpty() || segments.last().first != step.line) {
            val newSegment = mutableListOf<Point>()
            if (segments.isNotEmpty()) newSegment += segments.last().second.last()
            newSegment += point
            segments += step.line to newSegment
        } else {
            segments.last().second += point
        }
    }
    return segments.filter { it.second.size >= 2 }.map { it.first to it.second.toList() }
}

/**
 * Draws the selected route on top of the network, split into per-line-color segments. Updates
 * the existing source in place when called again (e.g. after switching fastest/lowest-transfers)
 * instead of throwing on a duplicate source id.
 */
fun setRouteHighlight(style: Style, route: RouteResult, lines: List<MetroLine>, stationsById: Map<String, Station>) {
    val segments = buildRouteSegments(route, stationsById)
    val linesById = lines.associateBy { it.id }
    val features = segments.map { (lineId, points) ->
        Feature.fromGeometry(LineString.fromLngLats(points)).apply {
            addStringProperty("color", linesById[lineId]?.color?.toHex() ?: "#6b7280")
        }
    }
    val collection = FeatureCollection.fromFeatures(features)
    val existing = style.getSourceAs<GeoJsonSource>(RouteHighlightSourceId)
    if (existing != null) {
        existing.setGeoJson(collection)
        return
    }
    style.addSource(GeoJsonSource(RouteHighlightSourceId, collection))
    style.addLayer(
        LineLayer(RouteHighlightLayerId, RouteHighlightSourceId).withProperties(
            PropertyFactory.lineColor(Expression.get("color")),
            PropertyFactory.lineWidth(6f),
            PropertyFactory.lineOpacity(0.9f),
            PropertyFactory.lineCap(Property.LINE_CAP_ROUND),
            PropertyFactory.lineJoin(Property.LINE_JOIN_ROUND),
        ),
    )
}

/**
 * Origin (green) / destination (red) markers with always-visible labels. Updates the existing
 * source in place when called again instead of throwing on a duplicate source id.
 */
fun setRouteEndpoints(style: Style, origin: Station, destination: Station, originLabel: String, destinationLabel: String) {
    val features = listOf(
        Feature.fromGeometry(Point.fromLngLat(origin.longitude, origin.latitude)).apply {
            addStringProperty("color", "#22c55e")
            addStringProperty("label", originLabel)
        },
        Feature.fromGeometry(Point.fromLngLat(destination.longitude, destination.latitude)).apply {
            addStringProperty("color", "#ef4444")
            addStringProperty("label", destinationLabel)
        },
    )
    val collection = FeatureCollection.fromFeatures(features)
    val existing = style.getSourceAs<GeoJsonSource>(RouteEndpointsSourceId)
    if (existing != null) {
        existing.setGeoJson(collection)
        return
    }
    style.addSource(GeoJsonSource(RouteEndpointsSourceId, collection))
    style.addLayer(
        CircleLayer(RouteEndpointsLayerId, RouteEndpointsSourceId).withProperties(
            PropertyFactory.circleRadius(7f),
            PropertyFactory.circleColor(Expression.get("color")),
            PropertyFactory.circleStrokeWidth(2f),
            PropertyFactory.circleStrokeColor("#ffffff"),
        ),
    )
    style.addLayer(
        SymbolLayer(RouteEndpointLabelsLayerId, RouteEndpointsSourceId).withProperties(
            PropertyFactory.textField(Expression.get("label")),
            PropertyFactory.textFont(LabelFontStack),
            PropertyFactory.textSize(13f),
            // Above the marker (not below, like the plain/guide-callout station labels) - origin
            // and destination sit at the very first/last point of the route line, where a
            // below-anchored label is the one most likely to be covered by the route highlight
            // line itself or the bottom-of-screen chrome (route type switch pill), so they need
            // to stay clear of that instead of following the other labels' placement.
            PropertyFactory.textOffset(arrayOf(0f, -1.3f)),
            PropertyFactory.textAnchor("bottom"),
            PropertyFactory.textColor("#1a1a1a"),
            PropertyFactory.textHaloColor("#ffffff"),
            PropertyFactory.textHaloWidth(1.6f),
        ),
    )
}

/**
 * Always-visible guide callouts (board/transfer instructions) at their station point. Updates
 * the existing source in place when called again instead of throwing on a duplicate source id.
 */
fun setGuideCallouts(style: Style, callouts: List<Triple<Station, String, String>>, language: AppLanguage, darkTheme: Boolean) {
    // Triple(station, title, guideText)
    val features = callouts.map { (station, title, text) ->
        Feature.fromGeometry(Point.fromLngLat(station.longitude, station.latitude)).apply {
            addStringProperty("label", "$title\n$text")
        }
    }
    val collection = FeatureCollection.fromFeatures(features)
    val existingSource = style.getSourceAs<GeoJsonSource>(GuideCalloutsSourceId)
    if (existingSource != null) {
        existingSource.setGeoJson(collection)
        return
    }
    style.addSource(GeoJsonSource(GuideCalloutsSourceId, collection))
    style.addLayer(
        CircleLayer(GuideCalloutsLayerId, GuideCalloutsSourceId).withProperties(
            PropertyFactory.circleRadius(5f),
            PropertyFactory.circleColor("#3B82F6"),
            PropertyFactory.circleStrokeWidth(1.5f),
            PropertyFactory.circleStrokeColor("#ffffff"),
        ),
    )
    style.addImage(PopoverBubbleImageId, buildPopoverBubbleBitmap(darkTheme))
    val isRtl = language == AppLanguage.FA
    style.addLayer(
        SymbolLayer(GuideCalloutLabelsLayerId, GuideCalloutsSourceId).withProperties(
            PropertyFactory.textField(Expression.get("label")),
            PropertyFactory.textFont(LabelFontStack),
            PropertyFactory.textSize(11.5f),
            PropertyFactory.textOffset(arrayOf(0f, 1.3f)),
            PropertyFactory.textAnchor("top"),
            PropertyFactory.textColor(if (darkTheme) "#262626" else "#F5F5F5"),
            // Popover bubble instead of a bare text-halo, and justified to match reading
            // direction - it was previously hardcoded left-justified even for Farsi text.
            PropertyFactory.iconImage(PopoverBubbleImageId),
            PropertyFactory.iconTextFit(Property.ICON_TEXT_FIT_BOTH),
            // See stationLabelProperties() - extra bottom padding to optically center the text.
            PropertyFactory.iconTextFitPadding(arrayOf(6f, 10f, 9f, 10f)),
            PropertyFactory.iconAllowOverlap(true),
            PropertyFactory.iconIgnorePlacement(true),
            PropertyFactory.textAllowOverlap(true),
            PropertyFactory.textIgnorePlacement(true),
            PropertyFactory.textJustify(if (isRtl) Property.TEXT_JUSTIFY_RIGHT else Property.TEXT_JUSTIFY_LEFT),
        ),
    )
}

/** Draws (or moves) a small marker at the user's current location. */
fun setUserLocationMarker(style: Style, latitude: Double, longitude: Double) {
    val point = Point.fromLngLat(longitude, latitude)
    val source = style.getSourceAs<GeoJsonSource>(UserLocationSourceId)
    if (source != null) {
        source.setGeoJson(point)
    } else {
        style.addSource(GeoJsonSource(UserLocationSourceId, point))
        style.addLayer(
            CircleLayer(UserLocationLayerId, UserLocationSourceId).withProperties(
                PropertyFactory.circleRadius(7f),
                PropertyFactory.circleColor("#3B82F6"),
                PropertyFactory.circleStrokeWidth(2f),
                PropertyFactory.circleStrokeColor("#ffffff"),
            ),
        )
    }
}
