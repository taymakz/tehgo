@file:OptIn(ExperimentalTextApi::class)

package ir.tehgo.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import ir.tehgo.R

private fun variableFont(resId: Int, weight: FontWeight) = Font(
    resId = resId,
    weight = weight,
    variationSettings = FontVariation.Settings(FontVariation.weight(weight.weight)),
)

val GeistFontFamily = FontFamily(
    variableFont(R.font.geist, FontWeight.Normal),
    variableFont(R.font.geist, FontWeight.Medium),
    variableFont(R.font.geist, FontWeight.SemiBold),
    variableFont(R.font.geist, FontWeight.Bold),
)

val VazirmatnFontFamily = FontFamily(
    variableFont(R.font.vazirmatn, FontWeight.Normal),
    variableFont(R.font.vazirmatn, FontWeight.Medium),
    variableFont(R.font.vazirmatn, FontWeight.SemiBold),
    variableFont(R.font.vazirmatn, FontWeight.Bold),
)

fun appTypography(fontFamily: FontFamily): Typography {
    val base = TextStyle(fontFamily = fontFamily)
    return Typography(
        displayLarge = base.copy(fontWeight = FontWeight.Bold, fontSize = 57.sp, lineHeight = 64.sp),
        displayMedium = base.copy(fontWeight = FontWeight.Bold, fontSize = 45.sp, lineHeight = 52.sp),
        displaySmall = base.copy(fontWeight = FontWeight.SemiBold, fontSize = 36.sp, lineHeight = 44.sp),
        headlineLarge = base.copy(fontWeight = FontWeight.SemiBold, fontSize = 32.sp, lineHeight = 40.sp),
        headlineMedium = base.copy(fontWeight = FontWeight.SemiBold, fontSize = 28.sp, lineHeight = 36.sp),
        headlineSmall = base.copy(fontWeight = FontWeight.SemiBold, fontSize = 24.sp, lineHeight = 32.sp),
        titleLarge = base.copy(fontWeight = FontWeight.SemiBold, fontSize = 22.sp, lineHeight = 28.sp),
        titleMedium = base.copy(fontWeight = FontWeight.Medium, fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.15.sp),
        titleSmall = base.copy(fontWeight = FontWeight.Medium, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
        bodyLarge = base.copy(fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp, letterSpacing = 0.5.sp),
        bodyMedium = base.copy(fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.25.sp),
        bodySmall = base.copy(fontWeight = FontWeight.Normal, fontSize = 12.sp, lineHeight = 16.sp, letterSpacing = 0.4.sp),
        labelLarge = base.copy(fontWeight = FontWeight.Medium, fontSize = 14.sp, lineHeight = 20.sp, letterSpacing = 0.1.sp),
        labelMedium = base.copy(fontWeight = FontWeight.Medium, fontSize = 12.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
        labelSmall = base.copy(fontWeight = FontWeight.Medium, fontSize = 11.sp, lineHeight = 16.sp, letterSpacing = 0.5.sp),
    )
}
