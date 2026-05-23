package edu.cit.cabasag.barberconnect.model

data class UpdateProfileRequest(
    val firstName: String,
    val lastName: String,
    val phoneNumber: String? = null,
    val bio: String? = null,
    val yearsExperience: Int? = null,
    val isAvailable: Boolean? = null
)

data class UpdateBarberProfileRequest(
    val phone: String? = null,
    val bio: String? = null,
    val experience: Int? = null,
    val gcash: String? = null,
    val isAvailable: Boolean? = null
)

data class UserNameResponse(
    val firstName: String? = null,
    val lastName: String? = null
)
