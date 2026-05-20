package edu.cit.cabasag.barberconnect.repository

import edu.cit.cabasag.barberconnect.model.*
import edu.cit.cabasag.barberconnect.network.ApiService
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.*
import retrofit2.Response

/**
 * TC-MOB-REPO-07 through TC-MOB-REPO-12
 * Unit tests for BarberRepository — all network calls are mocked.
 */
class BarberRepositoryTest {

    private lateinit var apiService: ApiService
    private lateinit var repository: BarberRepository

    @Before
    fun setUp() {
        apiService = mock()
        repository = BarberRepository(apiService)
    }

    // ── TC-MOB-REPO-07 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-07 getBarberAppointments returns appointment list`() = runTest {
        val appointments = listOf(
            Appointment(appointmentId = "a1", barberProfileId = "b1", status = "PENDING"),
            Appointment(appointmentId = "a2", barberProfileId = "b1", status = "CONFIRMED")
        )
        whenever(apiService.getBarberAppointments("b1"))
            .thenReturn(Response.success(ApiResponse(success = true, data = appointments, error = null)))

        val result = repository.getBarberAppointments("b1")

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
    }

    // ── TC-MOB-REPO-08 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-08 getLeaveRequests returns leave list`() = runTest {
        val leaves = listOf(
            LeaveRequest(leaveRequestId = "lr1", requestedDate = "2025-06-15", status = "PENDING"),
            LeaveRequest(leaveRequestId = "lr2", requestedDate = "2025-06-20", status = "APPROVED")
        )
        whenever(apiService.getLeaveRequests("b1"))
            .thenReturn(Response.success(ApiResponse(success = true, data = leaves, error = null)))

        val result = repository.getLeaveRequests("b1")

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
        assertEquals("APPROVED", result.getOrNull()?.last()?.status)
    }

    // ── TC-MOB-REPO-09 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-09 submitLeaveRequest returns created leave request`() = runTest {
        val created = LeaveRequest(
            leaveRequestId = "lr-new",
            barberProfileId = "b1",
            requestedDate = "2025-07-01",
            reason = "Personal",
            status = "PENDING"
        )
        val request = LeaveSubmitRequest(requestedDate = "2025-07-01", reason = "Personal")
        whenever(apiService.submitLeaveRequest("b1", request))
            .thenReturn(Response.success(ApiResponse(success = true, data = created, error = null)))

        val result = repository.submitLeaveRequest("b1", request)

        assertTrue(result.isSuccess)
        assertEquals("lr-new", result.getOrNull()?.leaveRequestId)
        assertEquals("PENDING", result.getOrNull()?.status)
    }

    // ── TC-MOB-REPO-10 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-10 getIncomeRecords returns income list`() = runTest {
        val records = listOf(
            IncomeRecord(incomeRecordId = "ir1", netAmount = 280.0, platformFee = 70.0),
            IncomeRecord(incomeRecordId = "ir2", netAmount = 400.0, platformFee = 100.0)
        )
        whenever(apiService.getBarberIncome("b1"))
            .thenReturn(Response.success(ApiResponse(success = true, data = records, error = null)))

        val result = repository.getIncomeRecords("b1")

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
        assertEquals(280.0, result.getOrNull()?.first()?.netAmount)
    }

    // ── TC-MOB-REPO-11 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-11 getAllPosts returns post list`() = runTest {
        val posts = listOf(
            Post(postId = "p1", content = "Fresh cuts today!", likesCount = 5),
            Post(postId = "p2", content = "New styles available", likesCount = 12)
        )
        whenever(apiService.getAllPosts())
            .thenReturn(Response.success(ApiResponse(success = true, data = posts, error = null)))

        val result = repository.getAllPosts()

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
        assertEquals("Fresh cuts today!", result.getOrNull()?.first()?.content)
    }

    // ── TC-MOB-REPO-12 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-12 getBarberAppointments returns failure on network error`() = runTest {
        whenever(apiService.getBarberAppointments(any()))
            .thenReturn(Response.error(401, "Unauthorized".toResponseBody()))

        val result = repository.getBarberAppointments("b1")

        assertTrue(result.isFailure)
        assertNotNull(result.exceptionOrNull())
    }
}
