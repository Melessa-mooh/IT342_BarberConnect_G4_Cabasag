package edu.cit.cabasag.barberconnect.model

data class FeedbackRequest(
    val appointmentId: String,
    val customerId: String,
    val barberProfileId: String,
    val rating: Int,
    val comment: String
)
