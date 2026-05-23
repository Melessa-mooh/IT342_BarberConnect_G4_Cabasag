package edu.cit.cabasag.barberconnect.model

data class Barber(
    val id: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val bio: String? = null,
    val yearsExperience: Int? = null,
    val rating: String? = null,
    val totalReviews: Int? = null,
    val profileImageUrl: String? = null,
    val gcashNumber: String? = null,
    val isAvailable: Boolean? = null
) {
    fun displayName() = "${firstName ?: ""} ${lastName ?: ""}".trim()
}
