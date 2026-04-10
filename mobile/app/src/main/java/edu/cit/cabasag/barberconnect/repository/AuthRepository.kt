package edu.cit.cabasag.barberconnect.repository

import com.google.gson.Gson
import edu.cit.cabasag.barberconnect.model.ApiResponse
import edu.cit.cabasag.barberconnect.model.AuthResponse
import edu.cit.cabasag.barberconnect.model.LoginRequest
import edu.cit.cabasag.barberconnect.model.RegisterRequest
import edu.cit.cabasag.barberconnect.network.ApiService
import edu.cit.cabasag.barberconnect.util.TokenManager
import kotlinx.coroutines.flow.Flow
import retrofit2.Response
import java.io.IOException

class AuthRepository(
    private val api: ApiService,
    private val tokenManager: TokenManager
) {

    // ── Register ───────────────────────────────────────────────────────────

    suspend fun register(request: RegisterRequest): Result<AuthResponse> =
        safeCall { api.register(request) }

    // ── Login ──────────────────────────────────────────────────────────────

    suspend fun login(request: LoginRequest): Result<AuthResponse> =
        safeCall { api.login(request) }

    // ── Firebase / Google Sign-In ─────────────────────────────────────────

    suspend fun loginWithFirebase(idToken: String): Result<AuthResponse> =
        safeCall { api.firebaseLogin(mapOf("idToken" to idToken)) }

    // ── Token / User helpers ──────────────────────────────────────────────

    fun getToken(): Flow<String?> = tokenManager.getToken()
    fun getUser():  Flow<AuthResponse?> = tokenManager.getUser()

    suspend fun logout() = tokenManager.clearAll()

    // ── Internal helper ───────────────────────────────────────────────────

    private suspend fun safeCall(
        call: suspend () -> Response<ApiResponse<AuthResponse>>
    ): Result<AuthResponse> = try {
        val response = call()
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.data != null) {
                body.data.token?.let { tokenManager.saveToken(it) }
                tokenManager.saveUser(body.data)
                Result.success(body.data)
            } else {
                Result.failure(Exception(body?.error ?: "Unknown error"))
            }
        } else {
            val errorJson = response.errorBody()?.string()
            val msg = try {
                Gson().fromJson(errorJson, ApiResponse::class.java)?.error
            } catch (_: Exception) { null }
            Result.failure(Exception(msg ?: "Request failed (${response.code()})"))
        }
    } catch (e: IOException) {
        Result.failure(Exception("Network error. Check your connection."))
    } catch (e: Exception) {
        Result.failure(Exception(e.message ?: "Unexpected error."))
    }
}
