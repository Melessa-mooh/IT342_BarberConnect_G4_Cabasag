package edu.cit.cabasag.barberconnect.repository

import com.google.android.gms.tasks.Task
import com.google.firebase.auth.FirebaseAuth
import com.google.gson.Gson
import edu.cit.cabasag.barberconnect.model.ApiResponse
import edu.cit.cabasag.barberconnect.model.AuthResponse
import edu.cit.cabasag.barberconnect.model.LoginRequest
import edu.cit.cabasag.barberconnect.model.RegisterRequest
import edu.cit.cabasag.barberconnect.model.UpdateProfileRequest
import edu.cit.cabasag.barberconnect.network.ApiService
import edu.cit.cabasag.barberconnect.util.TokenManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.MultipartBody
import retrofit2.Response
import java.io.IOException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class AuthRepository(
    private val api: ApiService,
    private val tokenManager: TokenManager
) {

    // ── Register ───────────────────────────────────────────────────────────

    suspend fun register(request: RegisterRequest): Result<AuthResponse> =
        authenticate { api.register(request) }

    // ── Login ──────────────────────────────────────────────────────────────

    suspend fun login(request: LoginRequest): Result<AuthResponse> {
        val normalizedRequest = request.copy(email = request.email.trim().lowercase())
        val backendResult = authenticate { api.login(normalizedRequest) }
        if (backendResult.isSuccess) return backendResult

        return loginWithFirebaseEmailFallback(
            email = normalizedRequest.email,
            password = normalizedRequest.password,
            originalError = backendResult.exceptionOrNull()
        )
    }

    // ── Firebase / Google Sign-In ─────────────────────────────────────────

    suspend fun loginWithFirebase(idToken: String): Result<AuthResponse> =
        authenticate { api.firebaseLogin(mapOf("idToken" to idToken)) }

    private suspend fun loginWithFirebaseEmailFallback(
        email: String,
        password: String,
        originalError: Throwable?
    ): Result<AuthResponse> {
        return try {
            val authResult = FirebaseAuth.getInstance()
                .signInWithEmailAndPassword(email, password)
                .awaitTask()
            val idToken = authResult.user
                ?.getIdToken(true)
                ?.awaitTask()
                ?.token
                .orEmpty()

            if (idToken.isBlank()) {
                Result.failure(Exception(originalError?.message ?: "Login failed"))
            } else {
                loginWithFirebase(idToken).recoverCatching {
                    throw Exception(it.message ?: originalError?.message ?: "User profile was not found.")
                }
            }
        } catch (_: Exception) {
            Result.failure(Exception(originalError?.message ?: "Invalid email or password"))
        }
    }

    suspend fun refreshCurrentUser(): Result<AuthResponse> {
        val token = tokenManager.getToken().firstOrNull()
            ?: return Result.failure(Exception("No saved token. Please sign in again."))
        return safeCall(saveTokenFromBody = false) { api.getCurrentUser("Bearer $token") }
    }

    suspend fun updateProfile(request: UpdateProfileRequest): Result<AuthResponse> =
        safeCall(saveTokenFromBody = false) { api.updateProfile(request) }

    suspend fun uploadProfileImage(file: MultipartBody.Part): Result<String> =
        safeGenericCall { api.uploadProfileImage(file) }

    // ── Token / User helpers ──────────────────────────────────────────────

    fun getToken(): Flow<String?> = tokenManager.getToken()
    fun getUser():  Flow<AuthResponse?> = tokenManager.getUser()

    suspend fun logout() = tokenManager.clearAll()

    // ── Internal helper ───────────────────────────────────────────────────

    private suspend fun authenticate(
        call: suspend () -> Response<ApiResponse<AuthResponse>>
    ): Result<AuthResponse> {
        val auth = safeCall(saveTokenFromBody = true, call = call)
        return auth.fold(
            onSuccess = { authUser ->
                Result.success(refreshCurrentUser().getOrElse { authUser })
            },
            onFailure = { Result.failure(it) }
        )
    }

    private suspend fun safeCall(
        saveTokenFromBody: Boolean = true,
        call: suspend () -> Response<ApiResponse<AuthResponse>>
    ): Result<AuthResponse> = try {
        val response = call()
        if (response.isSuccessful) {
            val body = response.body()
            if (body?.data != null) {
                if (saveTokenFromBody) body.data.token?.let { tokenManager.saveToken(it) }
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

    private suspend fun <T> safeGenericCall(call: suspend () -> Response<ApiResponse<T>>): Result<T> =
        try {
            val response = call()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.data != null) Result.success(body.data)
                else Result.failure(Exception(body?.error ?: "Empty response"))
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

    private suspend fun <T> Task<T>.awaitTask(): T =
        suspendCancellableCoroutine { continuation ->
            addOnSuccessListener { result -> continuation.resume(result) }
            addOnFailureListener { exception -> continuation.resumeWithException(exception) }
            addOnCanceledListener { continuation.cancel() }
        }
}
