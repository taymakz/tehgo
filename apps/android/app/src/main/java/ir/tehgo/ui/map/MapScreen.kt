package ir.tehgo.ui.map

import android.content.ContentValues
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import ir.tehgo.R
import ir.tehgo.data.LinePath
import ir.tehgo.data.MetroLine
import ir.tehgo.data.Station
import ir.tehgo.i18n.AppLanguage
import ir.tehgo.i18n.AppStrings

@Composable
fun MapScreen(
    stations: List<Station>,
    lines: List<MetroLine>,
    paths: Map<String, List<LinePath>>,
    language: AppLanguage,
    darkTheme: Boolean,
    strings: AppStrings,
    navBarHeight: Dp = 0.dp,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val stationsById = remember(stations) { stations.associateBy { it.id } }

    LaunchedEffect(Unit) {
        ensureOfflineMapCache(context)
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        MetroMapView(
            darkTheme = darkTheme,
            modifier = Modifier.fillMaxSize(),
            onMapReady = { map ->
                val style = map.style ?: return@MetroMapView
                if (style.getSource(NetworkLinesSourceId) == null) {
                    addNetworkLinesLayer(style, lines, paths, stationsById)
                }
                if (style.getSource(StationsSourceId) == null) {
                    addStationsLayer(style, stations, language, darkTheme)
                } else {
                    updateStationLabelLanguage(style, language, darkTheme)
                }
            },
        )

        // Deliberately a plain white/bordered chip rather than the default M3 FloatingActionButton
        // (a tonal primaryContainer fill) - that default reads muddy floating over the light map
        // style, whereas a crisp white surface with its own border and shadow stays legible over
        // both the light and dark map styles.
        Surface(
            onClick = {
                val existingUri = getSavedMapImageUri(context)
                if (existingUri != null) {
                    openImage(context, existingUri, strings)
                } else {
                    val savedUri = saveMapImageToGallery(context)
                    if (savedUri != null) {
                        setSavedMapImageUri(context, savedUri)
                        Toast.makeText(context, strings.savedToGallery, Toast.LENGTH_SHORT).show()
                        openImage(context, savedUri, strings)
                    } else {
                        Toast.makeText(context, strings.saveFailed, Toast.LENGTH_SHORT).show()
                    }
                }
            },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = 24.dp + navBarHeight, end = 24.dp)
                .size(56.dp),
            shape = CircleShape,
            color = Color.White,
            border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.1f)),
            shadowElevation = 6.dp,
        ) {
            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                Icon(Icons.Filled.Download, contentDescription = strings.downloadMap, tint = Color.Black)
            }
        }
    }
}

private fun saveMapImageToGallery(context: android.content.Context): Uri? {
    return try {
        val bitmap: Bitmap = BitmapFactory.decodeResource(context.resources, R.drawable.map)
        val resolver = context.contentResolver
        val contentValues = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, "tehgo_metro_map.jpg")
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Tehgo")
        }
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues) ?: return null
        resolver.openOutputStream(uri)?.use { out ->
            bitmap.compress(Bitmap.CompressFormat.JPEG, 95, out)
        }
        uri
    } catch (_: Exception) {
        null
    }
}

private const val MapImagePrefsName = "tehgo_map_image"
private const val KeySavedUri = "saved_uri"

// Note: if R.drawable.map is ever replaced/updated in a future release, a URI persisted here from
// a previous save would still point at the OLD image. Low-stakes for a static reference map, but
// worth knowing if this is ever revisited.
private fun getSavedMapImageUri(context: android.content.Context): Uri? {
    val stored = context.getSharedPreferences(MapImagePrefsName, android.content.Context.MODE_PRIVATE)
        .getString(KeySavedUri, null) ?: return null
    val uri = Uri.parse(stored)
    // The user could have deleted the image from their gallery after we saved it - confirm the
    // URI still resolves before trusting it, so we don't try to "open" something that's gone.
    return try {
        context.contentResolver.openInputStream(uri)?.close()
        uri
    } catch (_: Exception) {
        null
    }
}

private fun setSavedMapImageUri(context: android.content.Context, uri: Uri) {
    context.getSharedPreferences(MapImagePrefsName, android.content.Context.MODE_PRIVATE)
        .edit().putString(KeySavedUri, uri.toString()).apply()
}

private fun openImage(context: android.content.Context, uri: Uri, strings: AppStrings) {
    try {
        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "image/*")
            addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    } catch (_: android.content.ActivityNotFoundException) {
        Toast.makeText(context, strings.openImageFailed, Toast.LENGTH_SHORT).show()
    }
}
