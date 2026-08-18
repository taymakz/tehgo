package ir.tehgo.data

import androidx.compose.ui.graphics.Color
import ir.tehgo.i18n.AppLanguage

data class Station(
    val id: String,
    val nameEn: String,
    val nameFa: String,
    val lineColors: List<Color>,
    val lineIds: List<String>,
    val latitude: Double,
    val longitude: Double,
    val address: String?,
) {
    fun localizedName(language: AppLanguage): String = if (language == AppLanguage.FA) nameFa else nameEn

    fun matches(query: String): Boolean {
        if (query.isBlank()) return true
        return nameEn.contains(query, ignoreCase = true) || nameFa.contains(query, ignoreCase = true)
    }
}
