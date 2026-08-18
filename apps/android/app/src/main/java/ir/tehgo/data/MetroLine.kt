package ir.tehgo.data

import androidx.compose.ui.graphics.Color
import ir.tehgo.i18n.AppLanguage

data class MetroLine(
    val id: String,
    val nameEn: String,
    val nameFa: String,
    val color: Color,
) {
    fun localizedName(language: AppLanguage): String = if (language == AppLanguage.FA) nameFa else nameEn
}

data class LinePath(
    val id: String,
    val fromStationId: String,
    val toStationId: String,
    val stationIds: List<String>,
)
