package ir.tehgo.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.font.FontFamily

private val LightColorScheme = lightColorScheme(
    background = LightBackground,
    onBackground = LightForeground,
    surface = LightCard,
    onSurface = LightForeground,
    surfaceVariant = LightSecondary,
    onSurfaceVariant = LightMutedForeground,
    surfaceContainer = LightPopover,
    surfaceContainerLow = LightPopover,
    surfaceContainerHigh = LightSecondary,
    surfaceContainerHighest = LightSecondary,
    surfaceContainerLowest = LightBackground,
    primary = LightPrimary,
    onPrimary = LightPrimaryForeground,
    primaryContainer = LightSecondary,
    onPrimaryContainer = LightForeground,
    secondary = LightSecondary,
    onSecondary = LightForeground,
    secondaryContainer = LightSecondary,
    onSecondaryContainer = LightForeground,
    tertiary = LightAccent,
    onTertiary = LightForeground,
    error = LightDestructive,
    onError = LightDestructiveForeground,
    outline = LightBorder,
    outlineVariant = LightRing,
)

private val DarkColorScheme = darkColorScheme(
    background = DarkBackground,
    onBackground = DarkForeground,
    surface = DarkCard,
    onSurface = DarkForeground,
    surfaceVariant = DarkSecondary,
    onSurfaceVariant = DarkMutedForeground,
    surfaceContainer = DarkPopover,
    surfaceContainerLow = DarkPopover,
    surfaceContainerHigh = DarkSecondary,
    surfaceContainerHighest = DarkSecondary,
    surfaceContainerLowest = DarkBackground,
    primary = DarkPrimary,
    onPrimary = DarkPrimaryForeground,
    primaryContainer = DarkSecondary,
    onPrimaryContainer = DarkForeground,
    secondary = DarkSecondary,
    onSecondary = DarkForeground,
    secondaryContainer = DarkSecondary,
    onSecondaryContainer = DarkForeground,
    tertiary = DarkAccent,
    onTertiary = DarkForeground,
    error = DarkDestructive,
    onError = DarkDestructiveForeground,
    outline = DarkBorder,
    outlineVariant = DarkRing,
)

@Composable
fun TehgoTheme(
    darkTheme: Boolean,
    fontFamily: FontFamily,
    content: @Composable () -> Unit,
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = appTypography(fontFamily),
        content = content,
    )
}
