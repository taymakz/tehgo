package ir.tehgo.ui.theme

import androidx.compose.ui.graphics.Color

// Ported from the web app's shadcn-style monochrome ("neutral") theme tokens.
// Source uses oklch()/color-mix()/--alpha() against Tailwind's neutral/red/blue/emerald/amber
// scales; values below are the equivalent sRGB hex for each token.

val LightBackground = Color(0xFFFFFFFF)
val LightForeground = Color(0xFF262626)
val LightCard = Color(0xFFFFFFFF)
val LightPopover = Color(0xFFFFFFFF)
val LightPrimary = Color(0xFF262626)
val LightPrimaryForeground = Color(0xFFFAFAFA)
val LightSecondary = Color(0x0A000000)
val LightMutedForeground = Color(0xFF686868)
val LightAccent = Color(0x0A000000)
val LightBorder = Color(0x14000000)
val LightInput = Color(0x1A000000)
val LightRing = Color(0xFFA3A3A3)
val LightDestructive = Color(0xFFEF4444)
val LightDestructiveForeground = Color(0xFFB91C1C)
val LightInfo = Color(0xFF3B82F6)
val LightSuccess = Color(0xFF10B981)
val LightWarning = Color(0xFFF59E0B)

val DarkBackground = Color(0xFF141414)
val DarkForeground = Color(0xFFE8E4DC)
val DarkCard = Color(0xFF1C1C1C)
val DarkPopover = Color(0xFF191919)
val DarkPrimary = Color(0xFFF5F5F5)
val DarkPrimaryForeground = Color(0xFF262626)
val DarkSecondary = Color(0x0AFFFFFF)
val DarkMutedForeground = Color(0xFF818181)
val DarkAccent = Color(0x0AFFFFFF)
val DarkBorder = Color(0x0FFFFFFF)
val DarkInput = Color(0x14FFFFFF)
val DarkRing = Color(0xFF737373)
val DarkDestructive = Color(0xFFF15757)
val DarkDestructiveForeground = Color(0xFFF87171)
val DarkInfo = Color(0xFF60A5FA)
val DarkSuccess = Color(0xFF34D399)
val DarkWarning = Color(0xFFFBBF24)
