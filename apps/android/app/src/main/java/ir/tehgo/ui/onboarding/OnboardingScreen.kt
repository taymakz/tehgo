package ir.tehgo.ui.onboarding

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BrightnessAuto
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Route
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import ir.tehgo.ui.theme.ThemeMode
import kotlinx.coroutines.launch

private const val PageCount = 5

@Composable
fun OnboardingScreen(
    language: AppLanguage,
    themeMode: ThemeMode,
    strings: AppStrings,
    onLanguageSelected: (AppLanguage) -> Unit,
    onThemeModeSelected: (ThemeMode) -> Unit,
    onFinish: () -> Unit,
) {
    val pagerState = rememberPagerState(pageCount = { PageCount })
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        Text(
            text = "TehGo",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier
                .padding(top = 32.dp, start = 24.dp, end = 24.dp)
                .fillMaxWidth(),
            textAlign = TextAlign.Center,
        )

        HorizontalPager(state = pagerState, modifier = Modifier.weight(1f).fillMaxWidth()) { page ->
            when (page) {
                0 -> LanguagePage(strings = strings, language = language, onSelect = onLanguageSelected)

                1 -> ThemePage(strings = strings, themeMode = themeMode, onSelect = onThemeModeSelected)

                2 -> FeaturePage(
                    icon = Icons.Filled.Route,
                    title = strings.onboardingFeature1Title,
                    body = strings.onboardingFeature1Body,
                )

                3 -> FeaturePage(
                    icon = Icons.Filled.Map,
                    title = strings.onboardingFeature2Title,
                    body = strings.onboardingFeature2Body,
                )

                else -> FeaturePage(
                    icon = Icons.Filled.CloudOff,
                    title = strings.onboardingFeature3Title,
                    body = strings.onboardingFeature3Body,
                )
            }
        }

        PageIndicator(
            total = PageCount,
            current = pagerState.currentPage,
            modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp),
        )

        val isLastPage = pagerState.currentPage == PageCount - 1
        Button(
            onClick = {
                if (isLastPage) {
                    onFinish()
                } else {
                    scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 24.dp),
        ) {
            Text(if (isLastPage) strings.onboardingGetStarted else strings.onboardingContinue)
        }
    }
}

@Composable
private fun PageIndicator(total: Int, current: Int, modifier: Modifier = Modifier) {
    Row(modifier = modifier, horizontalArrangement = Arrangement.Center) {
        repeat(total) { index ->
            val active = index == current
            Box(
                modifier = Modifier
                    .padding(horizontal = 4.dp)
                    .size(if (active) 10.dp else 8.dp)
                    .clip(CircleShape)
                    .background(
                        if (active) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                    ),
            )
        }
    }
}

@Composable
private fun LanguagePage(
    strings: AppStrings,
    language: AppLanguage,
    onSelect: (AppLanguage) -> Unit,
) {
    CenteredPage(title = strings.onboardingLanguageTitle) {
        ChoiceCard(
            label = strings.english,
            selected = language == AppLanguage.EN,
            onClick = { onSelect(AppLanguage.EN) },
        )
        ChoiceCard(
            label = strings.persian,
            selected = language == AppLanguage.FA,
            onClick = { onSelect(AppLanguage.FA) },
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}

@Composable
private fun ThemePage(
    strings: AppStrings,
    themeMode: ThemeMode,
    onSelect: (ThemeMode) -> Unit,
) {
    CenteredPage(title = strings.onboardingThemeTitle) {
        ChoiceCard(
            label = strings.themeSystem,
            icon = Icons.Filled.BrightnessAuto,
            selected = themeMode == ThemeMode.SYSTEM,
            onClick = { onSelect(ThemeMode.SYSTEM) },
        )
        ChoiceCard(
            label = strings.themeLight,
            icon = Icons.Filled.LightMode,
            selected = themeMode == ThemeMode.LIGHT,
            onClick = { onSelect(ThemeMode.LIGHT) },
            modifier = Modifier.padding(top = 12.dp),
        )
        ChoiceCard(
            label = strings.themeDark,
            icon = Icons.Filled.DarkMode,
            selected = themeMode == ThemeMode.DARK,
            onClick = { onSelect(ThemeMode.DARK) },
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}

@Composable
private fun CenteredPage(title: String, content: @Composable () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(bottom = 28.dp),
        )
        content()
    }
}

@Composable
private fun ChoiceCard(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .then(
                if (selected) {
                    Modifier.background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f))
                } else {
                    Modifier.border(BorderStroke(1.dp, MaterialTheme.colorScheme.outline), RoundedCornerShape(16.dp))
                },
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Icon(
                icon,
                contentDescription = null,
                tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(22.dp),
            )
            Spacer(modifier = Modifier.padding(start = 6.dp))
        }
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.weight(1f),
        )
        if (selected) {
            Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun FeaturePage(icon: ImageVector, title: String, body: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(88.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(40.dp))
        }
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(top = 24.dp),
        )
        Text(
            text = body,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        )
    }
}
