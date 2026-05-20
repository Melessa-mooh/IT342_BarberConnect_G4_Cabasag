package edu.cit.cabasag.barberconnect.viewmodel

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import edu.cit.cabasag.barberconnect.model.*
import edu.cit.cabasag.barberconnect.repository.CustomerRepository
import edu.cit.cabasag.barberconnect.util.UiState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.mockito.kotlin.*

/**
 * TC-MOB-VM-01 through TC-MOB-VM-06
 * ViewModel tests — LiveData observed synchronously via InstantTaskExecutorRule.
 */
@OptIn(ExperimentalCoroutinesApi::class)
class CustomerViewModelTest {

    @get:Rule
    val instantTaskRule = InstantTaskExecutorRule()

    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var repository: CustomerRepository
    private lateinit var viewModel: CustomerViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        repository = mock()
        viewModel  = CustomerViewModel(repository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    // ── TC-MOB-VM-01 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-01 loadBarbers emits Success with barber list`() = runTest {
        val barbers = listOf(
            Barber(id = "b1", firstName = "Juan", lastName = "Cruz"),
            Barber(id = "b2", firstName = "Pedro", lastName = "Santos")
        )
        whenever(repository.getAvailableBarbers()).thenReturn(Result.success(barbers))

        viewModel.loadBarbers()

        val state = viewModel.barbers.value
        assertTrue(state is UiState.Success)
        assertEquals(2, (state as UiState.Success).data.size)
    }

    // ── TC-MOB-VM-02 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-02 loadBarbers emits Error on failure`() = runTest {
        whenever(repository.getAvailableBarbers())
            .thenReturn(Result.failure(Exception("Network error")))

        viewModel.loadBarbers()

        val state = viewModel.barbers.value
        assertTrue(state is UiState.Error)
        assertEquals("Network error", (state as UiState.Error).message)
    }

    // ── TC-MOB-VM-03 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-03 loadHaircutStyles emits Success with style list`() = runTest {
        val styles = listOf(
            HaircutStyle(haircutStyleId = "s1", name = "Fade", basePrice = 250.0, isActive = true),
            HaircutStyle(haircutStyleId = "s2", name = "Pompadour", basePrice = 350.0, isActive = true)
        )
        whenever(repository.getHaircutStyles("b1")).thenReturn(Result.success(styles))

        viewModel.loadHaircutStyles("b1")

        val state = viewModel.haircutStyles.value
        assertTrue(state is UiState.Success)
        assertEquals(2, (state as UiState.Success).data.size)
    }

    // ── TC-MOB-VM-04 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-04 bookAppointment emits Success on valid request`() = runTest {
        val appointment = Appointment(
            appointmentId = "appt-001",
            status        = "PENDING",
            totalPrice    = 350.0
        )
        val request = BookingRequest(
            customerId          = "cust-001",
            barberProfileId     = "b1",
            haircutStyleId      = "s1",
            appointmentDateTime = "2025-06-15T10:00:00Z",
            totalPrice          = 350.0,
            paymentMethod       = "CASH"
        )
        whenever(repository.bookAppointment(request)).thenReturn(Result.success(appointment))

        viewModel.bookAppointment(request)

        val state = viewModel.bookingState.value
        assertTrue(state is UiState.Success)
        assertEquals("PENDING", (state as UiState.Success).data.status)
    }

    // ── TC-MOB-VM-05 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-05 bookAppointment emits Error when barber is on leave`() = runTest {
        val request = BookingRequest(
            customerId          = "cust-001",
            barberProfileId     = "b1",
            haircutStyleId      = "s1",
            appointmentDateTime = "2025-06-15T10:00:00Z",
            totalPrice          = 350.0,
            paymentMethod       = "CASH"
        )
        whenever(repository.bookAppointment(request))
            .thenReturn(Result.failure(Exception("Barber is on approved leave on 2025-06-15")))

        viewModel.bookAppointment(request)

        val state = viewModel.bookingState.value
        assertTrue(state is UiState.Error)
        assertTrue((state as UiState.Error).message.contains("approved leave"))
    }

    // ── TC-MOB-VM-06 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-06 resetBookingState sets state back to Idle`() = runTest {
        val appointment = Appointment(appointmentId = "a1", status = "PENDING")
        val request = BookingRequest("c1", "b1", "s1", "2025-06-15T10:00:00Z", 200.0, "CASH")
        whenever(repository.bookAppointment(request)).thenReturn(Result.success(appointment))

        viewModel.bookAppointment(request)
        viewModel.resetBookingState()

        assertTrue(viewModel.bookingState.value is UiState.Idle)
    }
}
