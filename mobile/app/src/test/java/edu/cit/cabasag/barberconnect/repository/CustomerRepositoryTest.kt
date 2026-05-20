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
 * TC-MOB-REPO-01 through TC-MOB-REPO-06
 * Unit tests for CustomerRepository — all network calls are mocked.
 */
class CustomerRepositoryTest {

    private lateinit var apiService: ApiService
    private lateinit var repository: CustomerRepository

    @Before
    fun setUp() {
        apiService = mock()
        repository = CustomerRepository(apiService)
    }

    // ── TC-MOB-REPO-01 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-01 getAvailableBarbers returns success with barber list`() = runTest {
        val barbers = listOf(
            Barber(id = "b1", firstName = "Juan", lastName = "Cruz"),
            Barber(id = "b2", firstName = "Pedro", lastName = "Santos")
        )
        whenever(apiService.getAvailableBarbers())
            .thenReturn(Response.success(ApiResponse(success = true, data = barbers, error = null)))

        val result = repository.getAvailableBarbers()

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
        assertEquals("Juan", result.getOrNull()?.first()?.firstName)
    }

    // ── TC-MOB-REPO-02 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-02 getAvailableBarbers returns failure on HTTP error`() = runTest {
        whenever(apiService.getAvailableBarbers())
            .thenReturn(Response.error(500, "Internal Server Error".toResponseBody()))

        val result = repository.getAvailableBarbers()

        assertTrue(result.isFailure)
        assertNotNull(result.exceptionOrNull())
    }

    // ── TC-MOB-REPO-03 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-03 getHaircutStyles returns styles for barber`() = runTest {
        val styles = listOf(
            HaircutStyle(haircutStyleId = "s1", name = "Fade", basePrice = 250.0),
            HaircutStyle(haircutStyleId = "s2", name = "Pompadour", basePrice = 350.0)
        )
        whenever(apiService.getHaircutStyles("barber-001"))
            .thenReturn(Response.success(ApiResponse(success = true, data = styles, error = null)))

        val result = repository.getHaircutStyles("barber-001")

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
        assertEquals("Fade", result.getOrNull()?.first()?.name)
    }

    // ── TC-MOB-REPO-04 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-04 getApprovedLeaveDates returns date list`() = runTest {
        val dates = listOf("2025-06-15", "2025-06-20")
        whenever(apiService.getApprovedLeaveDates("barber-001"))
            .thenReturn(Response.success(ApiResponse(success = true, data = dates, error = null)))

        val result = repository.getApprovedLeaveDates("barber-001")

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
        assertTrue(result.getOrNull()!!.contains("2025-06-15"))
    }

    // ── TC-MOB-REPO-05 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-05 bookAppointment returns created appointment`() = runTest {
        val appointment = Appointment(
            appointmentId   = "appt-001",
            customerId      = "cust-001",
            barberProfileId = "barber-001",
            status          = "PENDING",
            totalPrice      = 350.0
        )
        val request = BookingRequest(
            customerId          = "cust-001",
            barberProfileId     = "barber-001",
            haircutStyleId      = "style-001",
            appointmentDateTime = "2025-06-15T10:00:00Z",
            totalPrice          = 350.0,
            paymentMethod       = "CASH"
        )
        whenever(apiService.bookAppointment(request))
            .thenReturn(Response.success(ApiResponse(success = true, data = appointment, error = null)))

        val result = repository.bookAppointment(request)

        assertTrue(result.isSuccess)
        assertEquals("appt-001", result.getOrNull()?.appointmentId)
        assertEquals("PENDING", result.getOrNull()?.status)
    }

    // ── TC-MOB-REPO-06 ────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-REPO-06 getCustomerAppointments returns appointment list`() = runTest {
        val appointments = listOf(
            Appointment(appointmentId = "a1", customerId = "cust-001", status = "PENDING"),
            Appointment(appointmentId = "a2", customerId = "cust-001", status = "COMPLETED")
        )
        whenever(apiService.getCustomerAppointments("cust-001"))
            .thenReturn(Response.success(ApiResponse(success = true, data = appointments, error = null)))

        val result = repository.getCustomerAppointments("cust-001")

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
    }
}
