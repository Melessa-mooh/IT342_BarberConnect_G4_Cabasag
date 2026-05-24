package edu.cit.cabasag.barberconnect.repository

import com.google.gson.Gson
import edu.cit.cabasag.barberconnect.model.*
import edu.cit.cabasag.barberconnect.network.ApiService
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import retrofit2.Response
import java.io.IOException

class BarberRepository(private val api: ApiService) {

    suspend fun getBarberAppointments(barberProfileId: String): Result<List<Appointment>> =
        safeCall { api.getBarberAppointments(barberProfileId) }

    suspend fun completeAppointment(appointmentId: String): Result<Appointment> =
        safeCall { api.completeAppointment(appointmentId) }

    suspend fun getLeaveRequests(barberProfileId: String): Result<List<LeaveRequest>> =
        safeCall { api.getLeaveRequests(barberProfileId) }

    suspend fun submitLeaveRequest(
        barberProfileId: String,
        request: LeaveSubmitRequest
    ): Result<LeaveRequest> =
        safeCall { api.submitLeaveRequest(barberProfileId, request) }

    suspend fun getIncomeRecords(barberProfileId: String): Result<List<IncomeRecord>> =
        safeCall { api.getBarberIncome(barberProfileId) }

    suspend fun getHaircutStyles(barberProfileId: String): Result<List<HaircutStyle>> =
        safeCall { api.getHaircutStyles(barberProfileId) }

    suspend fun createHaircutStyle(
        barberProfileId: String,
        name: String,
        description: String,
        basePrice: Double,
        durationMinutes: Int
    ): Result<HaircutStyle> {
        val text = "text/plain".toMediaType()
        return safeCall {
            api.createHaircutStyle(
                barberProfileId.toRequestBody(text),
                name.toRequestBody(text),
                description.toRequestBody(text),
                basePrice.toString().toRequestBody(text),
                durationMinutes.toString().toRequestBody(text)
            )
        }
    }

    suspend fun updateHaircutStyle(
        haircutStyleId: String,
        request: HaircutStyleUpdateRequest
    ): Result<HaircutStyle> =
        safeCall { api.updateHaircutStyle(haircutStyleId, request) }

    suspend fun deleteHaircutStyle(haircutStyleId: String): Result<String> =
        safeCall { api.deleteHaircutStyle(haircutStyleId) }

    suspend fun getAllPosts(): Result<List<Post>> =
        safeCall { api.getAllPosts() }

    suspend fun getBarberById(id: String): Result<Barber> =
        safeCall { api.getBarberById(id) }

    suspend fun updateBarberProfile(userId: String, request: UpdateBarberProfileRequest): Result<Barber> =
        safeCall { api.updateBarberProfile(userId, request) }

    suspend fun uploadBarberProfilePicture(userId: String, file: MultipartBody.Part): Result<String> =
        safeCall { api.uploadBarberProfilePicture(userId, file) }

    suspend fun createPost(barberProfileId: String, content: String): Result<Post> {
        val text = "text/plain".toMediaType()
        return safeCall {
            api.createPost(
                barberProfileId.toRequestBody(text),
                content.toRequestBody(text)
            )
        }
    }

    suspend fun getComments(postId: String): Result<List<Comment>> =
        safeCall { api.getComments(postId) }

    suspend fun addComment(postId: String, userId: String, content: String): Result<Comment> =
        safeCall { api.addComment(postId, mapOf("userId" to userId, "content" to content)) }

    suspend fun addReaction(postId: String, userId: String, type: String = "LIKE"): Result<Reaction> =
        safeCall { api.addReaction(postId, mapOf("userId" to userId, "type" to type)) }

    suspend fun getUserDisplayName(userId: String): Result<String> =
        safeCall { api.getUserName(userId) }.map {
            "${it.firstName.orEmpty()} ${it.lastName.orEmpty()}".trim().ifBlank { "User" }
        }

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
