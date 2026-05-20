package edu.cit.cabasag.barberconnect.model

data class AttendanceRecord(
    val userId: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val profileImageUrl: String? = null,
    val attendanceStatus: String? = null
) {
    fun displayName() = "${firstName ?: ""} ${lastName ?: ""}".trim()
}
