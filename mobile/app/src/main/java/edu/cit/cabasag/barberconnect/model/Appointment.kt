package edu.cit.cabasag.barberconnect.model

import com.google.gson.annotations.SerializedName

data class Appointment(
    @SerializedName("appointment_id")    val appointmentId: String? = null,
    @SerializedName("customer_id")       val customerId: String? = null,
    @SerializedName("barber_profile_id") val barberProfileId: String? = null,
    @SerializedName("haircut_style_id")  val haircutStyleId: String? = null,
    val appointmentDateTime: String? = null,
    val totalPrice: Double? = null,
    val status: String? = null,
    val paymentMethod: String? = null,
    val paymentStatus: String? = null,
    val notes: String? = null
)
