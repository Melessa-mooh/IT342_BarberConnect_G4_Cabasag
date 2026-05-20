package edu.cit.cabasag.barberconnect.model

import com.google.gson.annotations.SerializedName

data class HaircutStyle(
    @SerializedName("haircut_style_id") val haircutStyleId: String? = null,
    @SerializedName("barber_profile_id") val barberProfileId: String? = null,
    val name: String? = null,
    val description: String? = null,
    val basePrice: Double? = null,
    val durationMinutes: Int? = null,
    val imageUrl: String? = null,
    val isActive: Boolean? = null
)
