package edu.cit.cabasag.barberconnect.util

import edu.cit.cabasag.barberconnect.R
import edu.cit.cabasag.barberconnect.model.HaircutStyle

object HaircutImageFallback {
    fun defaultDrawable(styleName: String?): Int {
        val name = styleName.orEmpty().lowercase()
        return when {
            name.contains("premium") -> R.drawable.default_haircut_premium
            name.contains("trend") || name.contains("modern") -> R.drawable.default_haircut_trend
            name.contains("barber") -> R.drawable.default_haircut_barber
            else -> R.drawable.default_haircut_classic
        }
    }

    fun usableRemoteUrl(style: HaircutStyle): String? {
        val url = style.imageUrl?.trim().orEmpty()
        if (url.isBlank()) return null
        if (!url.startsWith("http://", ignoreCase = true) &&
            !url.startsWith("https://", ignoreCase = true)) {
            return null
        }
        val lowered = url.lowercase()
        if (lowered.contains("placeholder") || lowered.contains("undefined") || lowered.contains("null")) {
            return null
        }
        return url
    }
}
