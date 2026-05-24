package edu.cit.cabasag.barberconnect.model

data class HaircutStyleUpdateRequest(
    val name: String,
    val description: String,
    val basePrice: Double,
    val durationMinutes: Int
)
