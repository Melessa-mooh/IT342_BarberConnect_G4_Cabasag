package edu.cit.cabasag.barberconnect.repository

import com.google.gson.Gson
import edu.cit.cabasag.barberconnect.model.*
import edu.cit.cabasag.barberconnect.network.ApiService
import retrofit2.Response
import java.io.IOException

class BarberRepository(private val api: ApiService) {

    suspend fun getBarberAppointments(barberProfileId: String): Result<List<Appointment>> =
        safeCall { api.getBarberAppointments(barberProfileId) }

    suspend fun getLeaveRequests(barberProfileId: String): Result<List<LeaveRequest>> =
        safeCall { api.getLeaveRequests(barberProfileId) }

    suspend fun submitLeaveRequest(
        barberProfileId: String,
        request: LeaveSubmitRequest
    ): Result<LeaveRequest> =
        safeCall { api.submitLeaveRequest(barberProfileId, request) }

    suspend fun getIncomeRecords(barberProfileId: String): Result<List<IncomeRecord>> =
        safeCall { api.getBarberIncome(barberProfileId) }

    suspend fun getAllPosts(): Result<List<Post>> =
        safeCall { api.getAllPosts() }

    suspend fun createPost(barberProfileId: String, content: String): Result<Post> =
        safeCall { api.createPost(mapOf("barberProfileId" to barberProfileId, "content" to content)) }

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
