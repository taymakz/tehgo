package ir.tehgo.ui.components

import android.Manifest
import android.content.pm.PackageManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import ir.tehgo.data.LocationHelper
import ir.tehgo.data.MetroLine
import ir.tehgo.data.Station
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StationSelectorSheet(
    title: String,
    description: String,
    stations: List<Station>,
    lines: List<MetroLine>,
    language: AppLanguage,
    strings: AppStrings,
    sheetState: SheetState,
    onSelect: (Station) -> Unit,
    onDismiss: () -> Unit,
    onChooseOnMap: (() -> Unit)? = null,
) {
    var query by remember { mutableStateOf("") }
    val filtered = remember(query, stations) { stations.filter { it.matches(query) } }
    // Resolved once for every station up front (O(1) per lookup via linesById) instead of each
    // row doing an O(n) lines.find() per line id on every composition - with ~150 stations this
    // was very likely why the list felt laggy while scrolling/flinging.
    val stationLinesById = remember(stations, lines) {
        val linesById = lines.associateBy { it.id }
        stations.associate { station -> station.id to station.lineIds.mapNotNull { linesById[it] } }
    }

    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var locating by remember { mutableStateOf(false) }

    fun locateClosest() {
        scope.launch {
            locating = true
            val location = LocationHelper.getCurrentLocation(context)
            locating = false
            if (location == null) {
                Toast.makeText(context, strings.locationPermissionDenied, Toast.LENGTH_SHORT).show()
                return@launch
            }
            val closest = stations.minByOrNull {
                LocationHelper.haversineDistanceMeters(location.latitude, location.longitude, it.latitude, it.longitude)
            }
            if (closest != null) onSelect(closest)
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) locateClosest() else Toast.makeText(context, strings.locationPermissionDenied, Toast.LENGTH_SHORT).show()
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
    ) {
        // ModalBottomSheet hosts its content in a separate Popup subtree; re-asserting the
        // layout direction here mitigates a first-frame LTR flash before it settles to RTL.
        androidx.compose.runtime.CompositionLocalProvider(
            androidx.compose.ui.platform.LocalLayoutDirection provides language.layoutDirection,
        ) {
            Column(modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp)) {
                Text(text = title, style = MaterialTheme.typography.titleLarge)
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp, bottom = 16.dp),
                )

                TextField(
                    value = query,
                    onValueChange = { query = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(28.dp)),
                    shape = RoundedCornerShape(28.dp),
                    placeholder = { Text(strings.search) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                    leadingIcon = {
                        Icon(
                            Icons.Filled.Search,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    },
                    trailingIcon = {
                        if (query.isNotEmpty()) {
                            IconButton(onClick = { query = "" }) {
                                Icon(
                                    Icons.Filled.Close,
                                    contentDescription = strings.close,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    },
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.secondary,
                        unfocusedContainerColor = MaterialTheme.colorScheme.secondary,
                        disabledContainerColor = MaterialTheme.colorScheme.secondary,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        disabledIndicatorColor = Color.Transparent,
                    ),
                )

                Row(modifier = Modifier.padding(top = 12.dp)) {
                    QuickActionChip(
                        icon = Icons.Filled.MyLocation,
                        label = strings.closestToMyLocation,
                        loading = locating,
                        onClick = {
                            val granted = ContextCompat.checkSelfPermission(
                                context,
                                Manifest.permission.ACCESS_FINE_LOCATION,
                            ) == PackageManager.PERMISSION_GRANTED
                            if (granted) locateClosest() else permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
                        },
                        modifier = Modifier.weight(1f),
                    )
                    if (onChooseOnMap != null) {
                        Box(modifier = Modifier.padding(start = 8.dp).weight(1f)) {
                            QuickActionChip(
                                icon = Icons.Filled.Map,
                                label = strings.chooseOnMap,
                                loading = false,
                                onClick = onChooseOnMap,
                            )
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                if (filtered.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().padding(top = 32.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = strings.noStationsFound,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                        )
                    }
                } else {
                    LazyColumn(modifier = Modifier.fillMaxWidth()) {
                        items(filtered, key = { it.id }) { station ->
                            StationRow(
                                station = station,
                                stationLines = stationLinesById[station.id].orEmpty(),
                                language = language,
                                onClick = { onSelect(station) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickActionChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    loading: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(50))
            .background(MaterialTheme.colorScheme.secondary)
            .clickable(enabled = !loading, onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
        } else {
            Icon(icon, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurface)
        }
        Text(text = label, style = MaterialTheme.typography.labelMedium, maxLines = 1)
    }
}

@Composable
private fun StationRow(
    station: Station,
    stationLines: List<MetroLine>,
    language: AppLanguage,
    onClick: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(MaterialTheme.shapes.medium)
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            text = station.localizedName(language),
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.fillMaxWidth(),
        )
        if (stationLines.isNotEmpty()) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                stationLines.forEach { line -> LineBadge(line = line, language = language) }
            }
        }
    }
}

@Composable
private fun LineBadge(line: MetroLine, language: AppLanguage) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(line.color.copy(alpha = 0.16f))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(line.color))
        Text(
            text = line.localizedName(language),
            style = MaterialTheme.typography.labelSmall,
            color = line.color,
        )
    }
}
