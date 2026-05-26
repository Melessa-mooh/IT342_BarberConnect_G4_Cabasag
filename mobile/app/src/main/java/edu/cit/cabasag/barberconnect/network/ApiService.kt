package edu.cit.cabasag.barberconnect.network

import edu.cit.cabasag.barberconnect.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ── Auth ──────────────────────────────────────────────────────────────────

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

    @PUT("auth/profile")
    suspend fun updateProfile(
        @Body request: UpdateProfileRequest
    ): Response<ApiResponse<AuthResponse>>

    @Multipart
    @POST("auth/profile/image")
    suspend fun uploadProfileImage(
        @Part file: MultipartBody.Part
    ): Response<ApiResponse<String>>

    @GET("auth/user/{uid}")
    suspend fun getUserName(
        @Path("uid") uid: String
    ): Response<ApiResponse<UserNameResponse>>

    // ── Barber / Catalog ──────────────────────────────────────────────────────

    @GET("barbers/public/available")
    suspend fun getAvailableBarbers(): Response<ApiResponse<List<Barber>>>

    @GET("barbers/public/{id}")
    suspend fun getBarberById(
        @Path("id") id: String
    ): Response<ApiResponse<Barber>>

    @PUT("barbers/{userId}/profile")
    suspend fun updateBarberProfile(
        @Path("userId") userId: String,
        @Body request: UpdateBarberProfileRequest
    ): Response<ApiResponse<AuthResponse.BarberProfileResponse>>

    @Multipart
    @POST("barbers/{userId}/profile-picture")
    suspend fun uploadBarberProfilePicture(
        @Path("userId") userId: String,
        @Part file: MultipartBody.Part
    ): Response<ApiResponse<String>>

    @GET("haircuts/barber/{barberProfileId}")
    suspend fun getHaircutStyles(
        @Path("barberProfileId") barberProfileId: String
    ): Response<ApiResponse<List<HaircutStyle>>>

    @Multipart
    @POST("haircuts")
    suspend fun createHaircutStyle(
        @Part("barberProfileId") barberProfileId: RequestBody,
        @Part("name") name: RequestBody,
        @Part("description") description: RequestBody,
        @Part("basePrice") basePrice: RequestBody,
        @Part("durationMinutes") durationMinutes: RequestBody,
        @Part file: MultipartBody.Part? = null
    ): Response<ApiResponse<HaircutStyle>>

    @PUT("haircuts/{haircutStyleId}")
    suspend fun updateHaircutStyle(
        @Path("haircutStyleId") haircutStyleId: String,
        @Body request: HaircutStyleUpdateRequest
    ): Response<ApiResponse<HaircutStyle>>

    @DELETE("haircuts/{haircutStyleId}")
    suspend fun deleteHaircutStyle(
        @Path("haircutStyleId") haircutStyleId: String
    ): Response<ApiResponse<String>>

    @GET("barbers/{barberProfileId}/leave-dates")
    suspend fun getApprovedLeaveDates(
        @Path("barberProfileId") barberProfileId: String
    ): Response<ApiResponse<List<String>>>

    @GET("barbers/{barberProfileId}/income")
    suspend fun getBarberIncome(
        @Path("barberProfileId") barberProfileId: String
    ): Response<ApiResponse<List<IncomeRecord>>>

    @GET("barbers/{barberProfileId}/leave-requests")
    suspend fun getLeaveRequests(
        @Path("barberProfileId") barberProfileId: String
    ): Response<ApiResponse<List<LeaveRequest>>>

    @POST("barbers/{barberProfileId}/leave-request")
    suspend fun submitLeaveRequest(
        @Path("barberProfileId") barberProfileId: String,
        @Body request: LeaveSubmitRequest
    ): Response<ApiResponse<LeaveRequest>>

    // ── Appointments ──────────────────────────────────────────────────────────

    @POST("appointments/book")
    suspend fun bookAppointment(
        @Body request: BookingRequest
    ): Response<ApiResponse<Appointment>>

    @GET("appointments/customer/{customerId}")
    suspend fun getCustomerAppointments(
        @Path("customerId") customerId: String
    ): Response<ApiResponse<List<Appointment>>>

    @PUT("appointments/{appointmentId}/complete")
    suspend fun completeAppointment(
        @Path("appointmentId") appointmentId: String
    ): Response<ApiResponse<Appointment>>

    @GET("appointments/barber/{barberProfileId}")
    suspend fun getBarberAppointments(
        @Path("barberProfileId") barberProfileId: String
    ): Response<ApiResponse<List<Appointment>>>

    // ── Feedback ──────────────────────────────────────────────────────────────

    @POST("feedback")
    suspend fun submitFeedback(
        @Body request: FeedbackRequest
    ): Response<ApiResponse<Any>>

    // ── Social Feed ───────────────────────────────────────────────────────────

    @GET("posts")
    suspend fun getAllPosts(): Response<ApiResponse<List<Post>>>

    @GET("posts/barber/{barberProfileId}")
    suspend fun getPostsByBarber(
        @Path("barberProfileId") barberProfileId: String
    ): Response<ApiResponse<List<Post>>>

    @Multipart
    @POST("posts")
    suspend fun createPost(
        @Part("barberProfileId") barberProfileId: RequestBody,
        @Part("content") content: RequestBody,
        @Part file: MultipartBody.Part? = null
    ): Response<ApiResponse<Post>>

    @GET("posts/{postId}/comments")
    suspend fun getComments(
        @Path("postId") postId: String
    ): Response<ApiResponse<List<Comment>>>

    @POST("posts/{postId}/comments")
    suspend fun addComment(
        @Path("postId") postId: String,
        @Body body: Map<String, String>
    ): Response<ApiResponse<Comment>>

    @POST("posts/{postId}/reactions")
    suspend fun addReaction(
        @Path("postId") postId: String,
        @Body body: Map<String, String>
    ): Response<ApiResponse<Reaction>>

    // ── Admin (optional — not implemented in UI yet) ──────────────────────────

    @GET("admin/dashboard-stats")
    suspend fun getAdminStats(): Response<ApiResponse<AdminStats>>

    @GET("admin/attendance/today")
    suspend fun getAttendanceToday(): Response<ApiResponse<List<AttendanceRecord>>>

    @GET("admin/leave-requests")
    suspend fun getPendingLeaveRequests(): Response<ApiResponse<List<LeaveRequest>>>

    @PUT("admin/leave-requests/{id}/approve")
    suspend fun approveLeaveRequest(@Path("id") id: String): Response<ApiResponse<Any>>

    @PUT("admin/leave-requests/{id}/decline")
    suspend fun declineLeaveRequest(@Path("id") id: String): Response<ApiResponse<Any>>
}
