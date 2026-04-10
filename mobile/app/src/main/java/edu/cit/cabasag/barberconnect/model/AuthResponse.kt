package edu.cit.cabasag.barberconnect.model

data class AuthResponse(
    val firebaseUid: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val phoneNumber: String? = null,
    val role: String? = null,
    val isActive: Boolean? = null,
    val token: String? = null,
    val barberProfile: BarberProfileResponse? = null
) {
    data class BarberProfileResponse(
        val id: String? = null,
        val bio: String? = null,
        val yearsExperience: Int? = null,
        val rating: String? = null,
        val totalReviews: Int? = null,
        val profileImageUrl: String? = null,
        val isAvailable: Boolean? = null
    )

    /** Convenience: "John D." display name */
    fun displayName(): String {
        val first = firstName?.trim() ?: ""
        val last = lastName?.trim()?.firstOrNull()?.let { "$it." } ?: ""
        return "$first $last".trim()
    }

    /** Initials for the avatar circle (e.g. "JD") */
    fun initials(): String {
        val f = firstName?.firstOrNull()?.uppercaseChar() ?: '?'
        val l = lastName?.firstOrNull()?.uppercaseChar() ?: '?'
        return "$f$l"
    }
}
