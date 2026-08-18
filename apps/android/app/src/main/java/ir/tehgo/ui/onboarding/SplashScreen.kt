package ir.tehgo.ui.onboarding

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import ir.tehgo.R
import kotlinx.coroutines.delay

/** Minimum time the splash screen stays up, so it never flashes by unreadably fast. */
private const val MIN_SPLASH_DURATION_MS = 300L

/**
 * Shown while initial station/line/graph data loads (and while the app's language/RTL settles),
 * before either the onboarding flow or the main app appears. Big, logo-only: the static TehGo
 * mark (ic_tehgo_logo.xml, converted from _icons/logo.svg - a single compass/navigation-arrow
 * path), tinted to the current theme's onBackground color so it reads correctly in both light and
 * dark mode.
 *
 * [onMinDurationElapsed] fires once after [MIN_SPLASH_DURATION_MS], letting the caller hold off
 * swapping away from the splash screen until it's been visible long enough to read, rather than a
 * flash cut short the instant data finishes loading.
 */
@Composable
fun SplashScreen(onMinDurationElapsed: () -> Unit = {}) {
    LaunchedEffect(Unit) {
        delay(MIN_SPLASH_DURATION_MS)
        onMinDurationElapsed()
    }

    Box(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(R.drawable.ic_tehgo_logo),
            contentDescription = null,
            colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onBackground),
            modifier = Modifier.size(220.dp),
        )
    }
}
