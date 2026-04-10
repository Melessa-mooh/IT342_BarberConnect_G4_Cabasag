package edu.cit.cabasag.barberconnect.model

data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val role: String = "CUSTOMER"
)
