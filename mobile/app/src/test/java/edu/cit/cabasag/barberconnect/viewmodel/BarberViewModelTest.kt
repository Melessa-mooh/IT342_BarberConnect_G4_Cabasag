package edu.cit.cabasag.barberconnect.viewmodel

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import edu.cit.cabasag.barberconnect.model.*
import edu.cit.cabasag.barberconnect.repository.BarberRepository
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
 * TC-MOB-VM-07 through TC-MOB-VM-12
 */
@OptIn(ExperimentalCoroutinesApi::class)
class BarberViewModelTest {

    @get:Rule
    val instantTaskRule = InstantTaskExecutorRule()

    private val testDispatcher = UnconfinedTestDispatcher()
    private lateinit var repository: BarberRepository
    private lateinit var viewModel: BarberViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        repository = mock()
        viewModel  = BarberViewModel(repository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    // ── TC-MOB-VM-07 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-07 loadAppointments emits Success with appointment list`() = runTest {
        val appointments = listOf(
            Appointment(appointmentId = "a1", status = "PENDING"),
            Appointment(appointmentId = "a2", status = "CONFIRMED")
        )
        whenever(repository.getBarberAppointments("b1")).thenReturn(Result.success(appointments))

        viewModel.loadAppointments("b1")

        val state = viewModel.appointments.value
        assertTrue(state is UiState.Success)
        assertEquals(2, (state as UiState.Success).data.size)
    }

    // ── TC-MOB-VM-08 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-08 loadLeaveRequests emits Success with leave list`() = runTest {
        val leaves = listOf(
            LeaveRequest(leaveRequestId = "lr1", requestedDate = "2025-06-15", status = "PENDING")
        )
        whenever(repository.getLeaveRequests("b1")).thenReturn(Result.success(leaves))

        viewModel.loadLeaveRequests("b1")

        val state = viewModel.leaveRequests.value
        assertTrue(state is UiState.Success)
        assertEquals(1, (state as UiState.Success).data.size)
    }

    // ── TC-MOB-VM-09 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-09 submitLeaveRequest emits Success on valid input`() = runTest {
        val created = LeaveRequest(
            leaveRequestId = "lr-new",
            requestedDate  = "2025-07-01",
            status         = "PENDING"
        )
        whenever(repository.submitLeaveRequest("b1", LeaveSubmitRequest("2025-07-01", "Personal")))
            .thenReturn(Result.success(created))

        viewModel.submitLeaveRequest("b1", "2025-07-01", "Personal")

        val state = viewModel.submitLeaveState.value
        assertTrue(state is UiState.Success)
        assertEquals("PENDING", (state as UiState.Success).data.status)
    }

    // ── TC-MOB-VM-10 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-10 loadIncomeRecords emits Success with records`() = runTest {
        val records = listOf(
            IncomeRecord(incomeRecordId = "ir1", netAmount = 280.0),
            IncomeRecord(incomeRecordId = "ir2", netAmount = 400.0)
        )
        whenever(repository.getIncomeRecords("b1")).thenReturn(Result.success(records))

        viewModel.loadIncomeRecords("b1")

        val state = viewModel.incomeRecords.value
        assertTrue(state is UiState.Success)
        assertEquals(2, (state as UiState.Success).data.size)
    }

    // ── TC-MOB-VM-11 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-11 loadPosts emits Success with post list`() = runTest {
        val posts = listOf(
            Post(postId = "p1", content = "Fresh cuts!"),
            Post(postId = "p2", content = "New styles")
        )
        whenever(repository.getAllPosts()).thenReturn(Result.success(posts))

        viewModel.loadPosts()

        val state = viewModel.posts.value
        assertTrue(state is UiState.Success)
        assertEquals(2, (state as UiState.Success).data.size)
    }

    // ── TC-MOB-VM-12 ──────────────────────────────────────────────────────────

    @Test
    fun `TC-MOB-VM-12 loadAppointments emits Error on failure`() = runTest {
        whenever(repository.getBarberAppointments("b1"))
            .thenReturn(Result.failure(Exception("Unauthorized")))

        viewModel.loadAppointments("b1")

        val state = viewModel.appointments.value
        assertTrue(state is UiState.Error)
        assertEquals("Unauthorized", (state as UiState.Error).message)
    }
}
