package edu.cit.cabasag.barberconnect.repository

import com.google.gson.Gson
import edu.cit.cabasag.barberconnect.model.*
import edu.cit.cabasag.barberconnect.network.ApiService
import retrofit2.Response
import java.io.IOException

class CustomerRepository(private val api: ApiService) {

    suspend fun getAvailableBarbers(): Result<List<Barber>> =
        safeCall { api.getAvailableBarbers() }

    suspend fun getHaircutStyles(barberProfileId: String): Result<List<HaircutStyle>> =
        safeCall { api.getHaircutStyles(barberProfileId) }

    suspend fun getApprovedLeaveDates(barberProfileId: String): Result<List<String>> =
        safeCall { api.getApprovedLeaveDates(barberProfileId) }

    suspend fun getBarberAppointments(barberProfileId: String): Result<List<Appointment>> =
        safeCall { api.getBarberAppointments(barberProfileId) }

    suspend fun bookAppointment(request: BookingRequest): Result<Appointment> =
        safeCall { api.bookAppointment(request) }

    suspend fun getCustomerAppointments(customerId: String): Result<List<Appointment>> =
        safeCall { api.getCustomerAppointments(customerId) }

    suspend fun submitFeedback(request: FeedbackRequest): Result<Any> =
        safeCall { api.submitFeedback(request) }

    suspend fun getAllPosts(): Result<List<Post>> =
        safeCall { api.getAllPosts() }

    // ── Internal helper ───────────────────────────────────────────────────────

    private suspend fun <T> safeCall(call: suspend () -> Response<ApiResponse<T>>): Result<T> =
        try {
            val response = call()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.error ?: "Empty response"))
                }
            } else {
                val msg = try {
                    Gson().fromJson(response.errorBody()?.string(), ApiResponse::class.java)?.error
                } catch (_: Exception) { null }
                Result.failure(Exception(msg ?: "Request failed (${response.code()})"))
            }
        } catch (e: IOException) {
            Result.failure(Exception("Network error. Check your connection."))
        } catch (e: Exception) {
            Result.failure(Exception(e.message ?: "Unexpected error."))
        }
}
