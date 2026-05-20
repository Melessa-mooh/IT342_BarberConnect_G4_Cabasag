package edu.cit.cabasag.barberconnect.network

import edu.cit.cabasag.barberconnect.model.*
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

    // ── Barber / Catalog ──────────────────────────────────────────────────────

    @GET("barbers/public/available")
    suspend fun getAvailableBarbers(): Response<ApiResponse<List<Barber>>>

    @GET("haircuts/barber/{barberProfileId}")
    suspend fun getHaircutStyles(
        @Path("barberProfileId") barberProfileId: String
    ): Response<ApiResponse<List<HaircutStyle>>>

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

    @POST("posts")
    suspend fun createPost(@Body body: Map<String, String>): Response<ApiResponse<Post>>

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
