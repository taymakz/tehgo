package ir.tehgo.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class NavItem(
    val key: String,
    val outlineIcon: ImageVector,
    val filledIcon: ImageVector,
    val label: String,
)

private val NavPillShape = RoundedCornerShape(50)

@Composable
fun FloatingBottomNav(
    items: List<NavItem>,
    activePosition: Float,
    onSelect: (String) -> Unit,
    darkTheme: Boolean,
    modifier: Modifier = Modifier,
) {
    // Deliberately inverted against the page's own theme, using the app's own fixed dark/light
    // colors (same values as the window-background SideEffect in MainActivity.kt's TehgoApp())
    // rather than MaterialTheme.colorScheme.surface, so the floating pill always reads as a
    // distinct, high-contrast element regardless of theme: dark pill + white content in light
    // mode, white pill + dark content in dark mode. This is a fixed contrast choice, not
    // theme-driven - if the app's palette changes later, update both places together.
    val pillColor = if (darkTheme) Color(0xFFFFFFFF) else Color(0xFF141414)
    val contentColorFull = if (darkTheme) Color(0xFF141414) else Color(0xFFFFFFFF)
    val highlightColor = contentColorFull.copy(alpha = 0.12f)
    val layoutDirection = LocalLayoutDirection.current
    val density = LocalDensity.current
    val highlightInset = with(density) { 4.dp.toPx() }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 8.dp, vertical = 8.dp),
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = NavPillShape,
            color = pillColor,
            tonalElevation = 2.dp,
            shadowElevation = 8.dp,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 6.dp)
                    // A single highlight capsule that slides continuously along with
                    // activePosition, instead of each item drawing its own growing/shrinking
                    // circle (that read as an ugly "blob" pulsing during a swipe since two
                    // items' circles animate independently at once). visualIndex flips for RTL
                    // since Canvas drawing coordinates are always left-to-right pixel space,
                    // while Row itself places index 0 on the right in RTL.
                    .drawBehind {
                        if (items.isEmpty()) return@drawBehind
                        val itemWidth = size.width / items.size
                        val visualPosition = if (layoutDirection == LayoutDirection.Rtl) {
                            items.size - 1 - activePosition
                        } else {
                            activePosition
                        }
                        val centerX = itemWidth * (visualPosition + 0.5f)
                        val pillWidth = (itemWidth - highlightInset * 2).coerceAtLeast(0f)
                        drawRoundRect(
                            color = highlightColor,
                            topLeft = Offset(centerX - pillWidth / 2f, 0f),
                            size = Size(pillWidth, size.height),
                            cornerRadius = CornerRadius(size.height / 2f),
                        )
                    },
                verticalAlignment = Alignment.CenterVertically,
            ) {
                items.forEachIndexed { index, item ->
                    val progress = (1f - kotlin.math.abs(activePosition - index)).coerceIn(0f, 1f)
                    NavColumnItem(
                        item = item,
                        progress = progress,
                        onClick = { onSelect(item.key) },
                        contentColor = contentColorFull,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}

@Composable
private fun NavColumnItem(
    item: NavItem,
    progress: Float,
    onClick: () -> Unit,
    contentColor: Color,
    modifier: Modifier = Modifier,
) {
    // progress is already a continuous, externally-driven value (from the pager's own live
    // position) - no separate Animatable/LaunchedEffect needed here; adding one would just
    // introduce a second, redundant animation chasing the first and risk visible lag/mismatch.
    val itemContentColor = contentColor.copy(alpha = 0.55f + 0.45f * progress)
    val selected = progress > 0.5f // discrete choice (filled vs outline icon) - flips at the halfway point

    Column(
        modifier = modifier
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick,
            )
            .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Icon(
            imageVector = if (selected) item.filledIcon else item.outlineIcon,
            contentDescription = null,
            tint = itemContentColor,
            modifier = Modifier.size(22.dp),
        )
        Text(
            text = item.label,
            color = itemContentColor,
            fontSize = 11.sp,
            lineHeight = 11.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
        )
    }
}
