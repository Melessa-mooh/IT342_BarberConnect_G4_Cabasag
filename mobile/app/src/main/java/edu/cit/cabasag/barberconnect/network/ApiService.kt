package edu.cit.cabasag.barberconnect.network

import edu.cit.cabasag.barberconnect.model.ApiResponse
import edu.cit.cabasag.barberconnect.model.AuthResponse
import edu.cit.cabasag.barberconnect.model.LoginRequest
import edu.cit.cabasag.barberconnect.model.RegisterRequest
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<ApiResponse<AuthResponse>>

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>

    /** Firebase / Google Sign-In: send idToken → get back JWT */
    @POST("auth/firebase-login")
    suspend fun firebaseLogin(@Body body: Map<String, String>): Response<ApiResponse<AuthResponse>>

    @GET("auth/me")
    suspend fun getCurrentUser(
        @Header("Authorization") bearerToken: String
    ): Response<ApiResponse<AuthResponse>>
}
