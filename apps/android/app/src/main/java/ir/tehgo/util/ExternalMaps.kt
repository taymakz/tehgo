package ir.tehgo.util

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri

/**
 * Lets the user open a station location in whichever navigation app they prefer (Neshan, Snapp
 * Maps/Balad, Google Maps, Waze, ...). geo: is the standard Android URI scheme every general
 * purpose map app registers an intent-filter for, so wrapping it in a chooser surfaces all of
 * them without hardcoding per-app URI schemes we can't verify. Falls back to Google Maps' web
 * directions URL (always openable via a browser) if nothing on the device handles geo:.
 */
object ExternalMaps {
    fun openNavigation(context: Context, latitude: Double, longitude: Double, label: String) {
        val geoUri = Uri.parse("geo:$latitude,$longitude?q=$latitude,$longitude(${Uri.encode(label)})")
        val geoIntent = Intent(Intent.ACTION_VIEW, geoUri)
        val chooser = Intent.createChooser(geoIntent, label)
        try {
            context.startActivity(chooser)
        } catch (_: ActivityNotFoundException) {
            val webUri = Uri.parse(
                "https://www.google.com/maps/dir/?api=1&destination=$latitude,$longitude&travelmode=walking",
            )
            try {
                context.startActivity(Intent(Intent.ACTION_VIEW, webUri))
            } catch (_: ActivityNotFoundException) {
                // No app and no browser can handle it - nothing more we can do.
            }
        }
    }
}
