package edu.cit.cabasag.barberconnect.ui.barber

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
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
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val barberProfileId = intent.getStringExtra("barberProfileId") ?: ""

        val api        = (application as BarberConnectApp).retrofitClient.apiService
        val repository = BarberRepository(api)
        viewModel = ViewModelProvider(this, BarberViewModelFactory(repository))[BarberViewModel::class.java]

        // No feedback callback for barber view
        val adapter = AppointmentAdapter()
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

        viewModel.loadAppointments(barberProfileId)
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
