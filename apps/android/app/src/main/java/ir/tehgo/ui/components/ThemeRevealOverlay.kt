package ir.tehgo.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.ClipOp
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.unit.IntSize
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlin.math.hypot
import kotlin.math.max

/**
 * Telegram-style "circular reveal" transition for theme switching: freezes the current
 * frame as a bitmap, flips the real theme state underneath, then animates an expanding
 * circular hole (centered on the tapped control) through the frozen bitmap to reveal it.
 */
class ThemeRevealController internal constructor(
    private val scope: CoroutineScope,
) {
    var overlay by mutableStateOf<ImageBitmap?>(null)
        private set
    var center by mutableStateOf(Offset.Zero)
        private set
    var radius by mutableStateOf(0f)
        private set

    internal var captureRequest: (suspend () -> ImageBitmap)? = null
    internal var containerSize: IntSize = IntSize.Zero

    fun reveal(origin: Offset, onSwap: () -> Unit) {
        val capture = captureRequest ?: return
        scope.launch {
            overlay = capture()
            center = origin
            radius = 0f
            onSwap()

            val maxRadius = maxDistanceToCorners(origin, containerSize)
            Animatable(0f).animateTo(
                targetValue = maxRadius,
                animationSpec = tween(durationMillis = 550, easing = FastOutSlowInEasing),
            ) {
                radius = value
            }
            overlay = null
        }
    }

    private fun maxDistanceToCorners(origin: Offset, size: IntSize): Float {
        val corners = listOf(
            Offset(0f, 0f),
            Offset(size.width.toFloat(), 0f),
            Offset(0f, size.height.toFloat()),
            Offset(size.width.toFloat(), size.height.toFloat()),
        )
        return corners.maxOf { hypot((it.x - origin.x).toDouble(), (it.y - origin.y).toDouble()) }.toFloat()
    }
}

@Composable
fun rememberThemeRevealController(): ThemeRevealController {
    val scope = rememberCoroutineScope()
    return remember { ThemeRevealController(scope) }
}

@Composable
fun ThemeRevealHost(
    controller: ThemeRevealController,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val graphicsLayer = rememberGraphicsLayer()
    controller.captureRequest = { graphicsLayer.toImageBitmap() }

    Box(
        modifier = modifier
            .fillMaxSize()
            .onSizeChanged { controller.containerSize = it }
            .drawWithContent {
                graphicsLayer.record { this@drawWithContent.drawContent() }
                drawContent()
            },
    ) {
        content()

        val bitmap = controller.overlay
        if (bitmap != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .drawWithContent {
                        val path = Path().apply {
                            addOval(
                                androidx.compose.ui.geometry.Rect(
                                    center = controller.center,
                                    radius = max(controller.radius, 0.1f),
                                ),
                            )
                        }
                        clipPath(path, clipOp = ClipOp.Difference) {
                            drawImage(bitmap, dstSize = IntSize(size.width.toInt(), size.height.toInt()))
                        }
                    },
            )
        }
    }
}
