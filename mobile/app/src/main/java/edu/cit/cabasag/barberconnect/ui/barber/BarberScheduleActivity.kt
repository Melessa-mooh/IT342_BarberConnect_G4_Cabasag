package edu.cit.cabasag.barberconnect.ui.barber

import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.R
import edu.cit.cabasag.barberconnect.databinding.ActivityBarberScheduleBinding
import edu.cit.cabasag.barberconnect.repository.BarberRepository
import edu.cit.cabasag.barberconnect.ui.adapter.AppointmentAdapter
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModel
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModelFactory

class BarberScheduleActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBarberScheduleBinding
    private lateinit var viewModel: BarberViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBarberScheduleBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val barberProfileId = intent.getStringExtra("barberProfileId") ?: ""
        setupNavigation(barberProfileId)
        setupScheduleTabs(barberProfileId)

        val api        = (application as BarberConnectApp).retrofitClient.apiService
        val repository = BarberRepository(api)
        viewModel = ViewModelProvider(this, BarberViewModelFactory(repository))[BarberViewModel::class.java]

        val adapter = AppointmentAdapter(
            onComplete = { appointment ->
                val appointmentId = appointment.appointmentId
                if (appointmentId.isNullOrBlank()) {
                    Toast.makeText(this, "Appointment ID missing.", Toast.LENGTH_SHORT).show()
                } else {
                    viewModel.completeAppointment(appointmentId)
                }
            }
        )
        binding.recyclerAppointments.layoutManager = LinearLayoutManager(this)
        binding.recyclerAppointments.adapter = adapter

        viewModel.appointments.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.tvError.visibility     = View.GONE
                    binding.tvEmpty.visibility     = View.GONE
                }
                is UiState.Success -> {
                    binding.progressBar.visibility = View.GONE
                    val sorted = state.data.sortedByDescending { it.appointmentDateTime }
                    binding.tvCalendarSummary.text = "${sorted.size} appointment${if (sorted.size == 1) "" else "s"} loaded. Use Appointments for booking details and status."
                    if (sorted.isEmpty()) {
                        binding.tvEmpty.visibility = View.VISIBLE
                    } else {
                        binding.tvEmpty.visibility = View.GONE
                        adapter.submitList(sorted)
                    }
                }
                is UiState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.tvError.visibility     = View.VISIBLE
                    binding.tvError.text           = state.message
                }
                else -> Unit
            }
        }

        viewModel.completeAppointmentState.observe(this) { state ->
            when (state) {
                is UiState.Success -> {
                    Toast.makeText(this, "Appointment marked complete.", Toast.LENGTH_SHORT).show()
                    viewModel.resetCompleteAppointmentState()
                    viewModel.loadAppointments(barberProfileId)
                }
                is UiState.Error -> {
                    Toast.makeText(this, state.message, Toast.LENGTH_SHORT).show()
                    viewModel.resetCompleteAppointmentState()
                }
                else -> Unit
            }
        }

        viewModel.loadAppointments(barberProfileId)
    }

    private fun setupNavigation(barberProfileId: String) {
        BarberMobileNav.setup(
            activity = this,
            activeItem = "Schedule",
            barberProfileId = barberProfileId,
            menuButton = binding.btnMenu,
            overlay = binding.drawerOverlay,
            drawer = binding.drawerPanel,
            closeButton = binding.btnCloseDrawer,
            items = listOf(
                binding.drawerItem1,
                binding.drawerItem2,
                binding.drawerItem3,
                binding.drawerItem4,
                binding.drawerItem5,
                binding.drawerItem6,
                binding.drawerItem7
            ),
            logoutButton = binding.btnLogout
        )
    }

    private fun setupScheduleTabs(barberProfileId: String) {
        val tabs = listOf(binding.tabCalendar, binding.tabAppointments, binding.tabTimeOff, binding.tabSettings)
        fun select(active: TextView) {
            tabs.forEach {
                it.background = tabDrawable(it == active)
                it.setTextColor(getColor(if (it == active) R.color.white else R.color.gray_text_dark))
            }
            binding.panelCalendar.visibility = if (active == binding.tabCalendar) View.VISIBLE else View.GONE
            binding.panelAppointments.visibility = if (active == binding.tabAppointments) View.VISIBLE else View.GONE
            binding.panelTimeOff.visibility = if (active == binding.tabTimeOff) View.VISIBLE else View.GONE
            binding.panelSettings.visibility = if (active == binding.tabSettings) View.VISIBLE else View.GONE
        }
        binding.tabCalendar.setOnClickListener { select(binding.tabCalendar) }
        binding.tabAppointments.setOnClickListener { select(binding.tabAppointments) }
        binding.tabTimeOff.setOnClickListener { select(binding.tabTimeOff) }
        binding.tabSettings.setOnClickListener { select(binding.tabSettings) }
        binding.btnOpenLeave.setOnClickListener {
            startActivity(android.content.Intent(this, BarberLeaveActivity::class.java).apply {
                putExtra("barberProfileId", barberProfileId)
            })
        }
        select(binding.tabCalendar)
    }

    private fun tabDrawable(active: Boolean) = GradientDrawable().apply {
        cornerRadius = resources.displayMetrics.density * 10
        setColor(getColor(if (active) R.color.orange_accent else R.color.white))
        if (!active) setStroke((resources.displayMetrics.density).toInt(), getColor(R.color.gray_border_soft))
    }
}
