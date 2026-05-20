package edu.cit.cabasag.barberconnect.model

data class BookingRequest(
    val customerId: String,
    val barberProfileId: String,
    val haircutStyleId: String,
    val appointmentDateTime: String,
    val totalPrice: Double,
    val paymentMethod: String,
    val selectedOptionIds: List<String> = emptyList(),
    val notes: String = ""
)
