package ir.tehgo.ui.settings

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.BrightnessAuto
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.LightMode
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import ir.tehgo.ui.components.OptionPickerSheet
import ir.tehgo.ui.components.PickerOption
import ir.tehgo.ui.theme.ThemeMode
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    language: AppLanguage,
    themeMode: ThemeMode,
    strings: AppStrings,
    onLanguageSelected: (AppLanguage, Offset) -> Unit,
    onThemeModeSelected: (ThemeMode, Offset) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val versionName = remember {
        runCatching { context.packageManager.getPackageInfo(context.packageName, 0).versionName }
            .getOrNull() ?: "-"
    }

    var showLanguageSheet by remember { mutableStateOf(false) }
    var showThemeSheet by remember { mutableStateOf(false) }
    val languageSheetState = rememberModalBottomSheetState()
    val themeSheetState = rememberModalBottomSheetState()

    Column(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
            SettingsRow(
                icon = Icons.Filled.Language,
                title = strings.languageTitle,
                value = if (language == AppLanguage.FA) strings.persian else strings.english,
                onClick = { showLanguageSheet = true },
            )
            HorizontalDivider()
            SettingsRow(
                icon = when (themeMode) {
                    ThemeMode.SYSTEM -> Icons.Filled.BrightnessAuto
                    ThemeMode.LIGHT -> Icons.Filled.LightMode
                    ThemeMode.DARK -> Icons.Filled.DarkMode
                },
                title = strings.themeTitle,
                value = when (themeMode) {
                    ThemeMode.SYSTEM -> strings.themeSystem
                    ThemeMode.LIGHT -> strings.themeLight
                    ThemeMode.DARK -> strings.themeDark
                },
                onClick = { showThemeSheet = true },
            )
            HorizontalDivider()
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.Bottom,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "${strings.appVersion}: $versionName",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth(),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
            Text(
                text = strings.footerCredit,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp)
                    .clickable {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://taymakz.ir")))
                    },
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )
        }
    }

    if (showLanguageSheet) {
        OptionPickerSheet(
            title = strings.languageTitle,
            options = listOf(
                PickerOption(AppLanguage.EN, strings.english),
                PickerOption(AppLanguage.FA, strings.persian),
            ),
            selected = language,
            sheetState = languageSheetState,
            onSelect = { value, offset ->
                showLanguageSheet = false
                onLanguageSelected(value, offset)
            },
            onDismiss = { showLanguageSheet = false },
        )
    }

    if (showThemeSheet) {
        OptionPickerSheet(
            title = strings.themeTitle,
            options = listOf(
                PickerOption(ThemeMode.SYSTEM, strings.themeSystem),
                PickerOption(ThemeMode.LIGHT, strings.themeLight),
                PickerOption(ThemeMode.DARK, strings.themeDark),
            ),
            selected = themeMode,
            sheetState = themeSheetState,
            onSelect = { value, offset ->
                // Close the sheet first (awaiting its own hide animation via SheetState.hide(), the
                // documented way to dismiss a ModalBottomSheet with its exit animation playing - simply
                // flipping showThemeSheet to false would cut the sheet away instantly instead), then
                // start the circular reveal animation once it's actually gone.
                scope.launch {
                    themeSheetState.hide()
                    showThemeSheet = false
                    onThemeModeSelected(value, offset)
                }
            },
            onDismiss = { showThemeSheet = false },
        )
    }
}

@Composable
private fun SettingsRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    value: String,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(22.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier
                .padding(start = 16.dp)
                .weight(1f),
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Icon(
            Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            modifier = Modifier.padding(start = 4.dp).size(20.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
