package edu.cit.cabasag.barberconnect.model

import com.google.gson.annotations.SerializedName

data class IncomeRecord(
    @SerializedName("income_record_id")  val incomeRecordId: String? = null,
    @SerializedName("barber_profile_id") val barberProfileId: String? = null,
    @SerializedName("appointment_id")    val appointmentId: String? = null,
    val amount: Double? = null,
    val platformFee: Double? = null,
    val netAmount: Double? = null,
    val paymentMethod: String? = null,
    val recordedAt: String? = null
)
