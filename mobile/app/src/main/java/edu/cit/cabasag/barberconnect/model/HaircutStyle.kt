package edu.cit.cabasag.barberconnect.model

import com.google.gson.annotations.SerializedName

data class HaircutStyle(
    @SerializedName("haircut_style_id") val haircutStyleId: String? = null,
    @SerializedName("barber_profile_id") val barberProfileId: String? = null,
    @SerializedName(value = "name", alternate = ["styleName", "serviceName"]) val name: String? = null,
    val description: String? = null,
    @SerializedName(value = "basePrice", alternate = ["base_price", "price"]) val basePrice: Double? = null,
    @SerializedName(value = "durationMinutes", alternate = ["duration_minutes", "duration"]) val durationMinutes: Int? = null,
    @SerializedName(value = "imageUrl", alternate = ["image_url"]) val imageUrl: String? = null,
    @SerializedName(value = "isActive", alternate = ["is_active"]) val isActive: Boolean? = null
)
