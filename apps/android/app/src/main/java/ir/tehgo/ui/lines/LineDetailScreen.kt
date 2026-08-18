package ir.tehgo.ui.lines

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroLine
import ir.tehgo.data.Station
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings

@Composable
fun LineDetailScreen(
    line: MetroLine,
    paths: List<LinePath>,
    stationsById: Map<String, Station>,
    language: AppLanguage,
    strings: AppStrings,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
    ) {
        items(paths, key = { it.id }) { path ->
            val fromName = stationsById[path.fromStationId]?.localizedName(language) ?: path.fromStationId
            val toName = stationsById[path.toStationId]?.localizedName(language) ?: path.toStationId

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(bottom = 16.dp),
            ) {
                Text(text = "${strings.fromLabel} $fromName", style = MaterialTheme.typography.titleMedium)
                Icon(
                    Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    modifier = Modifier.padding(horizontal = 8.dp).size(18.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(text = "${strings.toLabel} $toName", style = MaterialTheme.typography.titleMedium)
            }

            path.stationIds.forEachIndexed { index, stationId ->
                val station = stationsById[stationId]
                val isLast = index == path.stationIds.lastIndex

                Row(modifier = Modifier.fillMaxWidth()) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(24.dp)) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(line.color),
                        )
                        if (!isLast) {
                            Box(
                                modifier = Modifier
                                    .width(2.dp)
                                    .height(28.dp)
                                    .background(line.color.copy(alpha = 0.4f)),
                            )
                        }
                    }
                    Text(
                        text = station?.localizedName(language) ?: stationId,
                        style = MaterialTheme.typography.bodyLarge,
                        modifier = Modifier.padding(start = 12.dp, bottom = if (isLast) 0.dp else 18.dp),
                    )
                }
            }

            Box(modifier = Modifier.fillMaxWidth().height(28.dp))
        }
    }
}
