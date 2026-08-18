package ir.tehgo.ui.routedetail

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import ir.tehgo.routing.RouteResult

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RouteOptionsSheet(
    strings: AppStrings,
    fastestRoute: RouteResult,
    lowestTransfersRoute: RouteResult,
    sheetState: SheetState,
    onSelectFastest: () -> Unit,
    onSelectLowestTransfers: () -> Unit,
    onDismiss: () -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp)) {
            Text(text = strings.chooseRouteType, style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(bottom = 16.dp))

            RouteOptionCard(
                title = strings.fastestRoute,
                subtitle = "${fastestRoute.totalStations} ${strings.totalStations.lowercase()}, ${fastestRoute.totalTransfers} ${strings.totalTransfers.lowercase()}",
                onClick = onSelectFastest,
            )
            RouteOptionCard(
                title = strings.lowestTransfersRoute,
                subtitle = "${lowestTransfersRoute.totalStations} ${strings.totalStations.lowercase()}, ${lowestTransfersRoute.totalTransfers} ${strings.totalTransfers.lowercase()}",
                onClick = onSelectLowestTransfers,
                modifier = Modifier.padding(top = 12.dp, bottom = 20.dp),
            )
        }
    }
}

@Composable
private fun RouteOptionCard(
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.secondary)
            .clickable(onClick = onClick)
            .padding(16.dp),
    ) {
        Text(text = title, style = MaterialTheme.typography.titleMedium)
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExportImageSheet(
    strings: AppStrings,
    sheetState: SheetState,
    hasRouteChoice: Boolean,
    initialUseFastest: Boolean,
    initialLanguage: AppLanguage,
    onDismiss: () -> Unit,
    onExport: (dark: Boolean, detailed: Boolean, useFastest: Boolean, language: AppLanguage) -> Unit,
) {
    var dark by remember { mutableStateOf(false) }
    var detailed by remember { mutableStateOf(true) }
    var useFastest by remember { mutableStateOf(initialUseFastest) }
    var exportLanguage by remember { mutableStateOf(initialLanguage) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp)) {
            Text(text = strings.exportSettings, style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(bottom = 16.dp))

            if (hasRouteChoice) {
                Text(text = strings.chooseRouteType, style = MaterialTheme.typography.labelLarge)
                Row(modifier = Modifier.padding(top = 8.dp, bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    ToggleCard(label = strings.fastestRoute, selected = useFastest, onClick = { useFastest = true }, modifier = Modifier.weight(1f))
                    ToggleCard(label = strings.lowestTransfersRoute, selected = !useFastest, onClick = { useFastest = false }, modifier = Modifier.weight(1f))
                }
            }

            Text(text = strings.languageTitle, style = MaterialTheme.typography.labelLarge)
            Row(modifier = Modifier.padding(top = 8.dp, bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ToggleCard(
                    label = strings.english,
                    selected = exportLanguage == AppLanguage.EN,
                    onClick = { exportLanguage = AppLanguage.EN },
                    modifier = Modifier.weight(1f),
                )
                ToggleCard(
                    label = strings.persian,
                    selected = exportLanguage == AppLanguage.FA,
                    onClick = { exportLanguage = AppLanguage.FA },
                    modifier = Modifier.weight(1f),
                )
            }

            Text(text = strings.themeTitle, style = MaterialTheme.typography.labelLarge)
            Row(modifier = Modifier.padding(top = 8.dp, bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ToggleCard(label = strings.themeLight, selected = !dark, onClick = { dark = false }, modifier = Modifier.weight(1f))
                ToggleCard(label = strings.themeDark, selected = dark, onClick = { dark = true }, modifier = Modifier.weight(1f))
            }

            Text(text = strings.detailLevel, style = MaterialTheme.typography.labelLarge)
            Row(modifier = Modifier.padding(top = 8.dp, bottom = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ToggleCard(label = strings.summaryLabel, selected = !detailed, onClick = { detailed = false }, modifier = Modifier.weight(1f))
                ToggleCard(label = strings.detailedLabel, selected = detailed, onClick = { detailed = true }, modifier = Modifier.weight(1f))
            }

            Button(
                onClick = { onExport(dark, detailed, useFastest, exportLanguage) },
                modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp),
            ) {
                Text(strings.downloadImage)
            }
        }
    }
}

@Composable
private fun ToggleCard(label: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.14f) else MaterialTheme.colorScheme.secondary)
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
        )
    }
}
