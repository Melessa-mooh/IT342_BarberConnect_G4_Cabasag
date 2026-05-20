package edu.cit.cabasag.barberconnect.model

data class LeaveRequest(
    val leaveRequestId: String? = null,
    val barberProfileId: String? = null,
    val requestedDate: String? = null,
    val reason: String? = null,
    val status: String? = null
)
