package edu.cit.cabasag.barberconnect.model

/** Wraps every backend response: { data, error, success } */
data class ApiResponse<T>(
    val data: T?,
    val error: String?,
    val success: Boolean?
)
