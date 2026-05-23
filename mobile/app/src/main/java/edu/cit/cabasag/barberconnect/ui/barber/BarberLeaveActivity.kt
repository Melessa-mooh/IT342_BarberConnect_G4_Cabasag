package edu.cit.cabasag.barberconnect.ui.barber

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityBarberLeaveBinding
import edu.cit.cabasag.barberconnect.repository.BarberRepository
import edu.cit.cabasag.barberconnect.ui.adapter.LeaveRequestAdapter
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModel
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModelFactory

class BarberLeaveActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBarberLeaveBinding
    private lateinit var viewModel: BarberViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBarberLeaveBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val barberProfileId = intent.getStringExtra("barberProfileId") ?: ""
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

        val api        = (application as BarberConnectApp).retrofitClient.apiService
        val repository = BarberRepository(api)
        viewModel = ViewModelProvider(this, BarberViewModelFactory(repository))[BarberViewModel::class.java]

        val adapter = LeaveRequestAdapter()
        binding.recyclerLeave.layoutManager = LinearLayoutManager(this)
        binding.recyclerLeave.adapter = adapter

        // Submit leave request
        binding.btnSubmitLeave.setOnClickListener {
            val date   = binding.etLeaveDate.text?.toString()?.trim() ?: ""
            val reason = binding.etLeaveReason.text?.toString()?.trim() ?: ""

            if (date.isBlank()) {
                binding.tvLeaveError.visibility = View.VISIBLE
                binding.tvLeaveError.text = "Please enter a date (YYYY-MM-DD)."
                return@setOnClickListener
            }
            binding.tvLeaveError.visibility = View.GONE
            viewModel.submitLeaveRequest(barberProfileId, date, reason)
        }

        viewModel.submitLeaveState.observe(this) { state ->
            when (state) {
                is UiState.Loading -> binding.btnSubmitLeave.isEnabled = false
                is UiState.Success -> {
                    binding.btnSubmitLeave.isEnabled = true
                    Toast.makeText(this, "Leave request submitted!", Toast.LENGTH_SHORT).show()
                    binding.etLeaveDate.text?.clear()
                    binding.etLeaveReason.text?.clear()
                    viewModel.resetSubmitLeaveState()
                    viewModel.loadLeaveRequests(barberProfileId) // refresh list
                }
                is UiState.Error -> {
                    binding.btnSubmitLeave.isEnabled = true
                    binding.tvLeaveError.visibility = View.VISIBLE
                    binding.tvLeaveError.text = state.message
                    viewModel.resetSubmitLeaveState()
                }
                else -> Unit
            }
        }

        viewModel.leaveRequests.observe(this) { state ->
            when (state) {
                is UiState.Loading -> binding.progressBar.visibility = View.VISIBLE
                is UiState.Success -> {
                    binding.progressBar.visibility = View.GONE
                    adapter.submitList(state.data.sortedByDescending { it.requestedDate })
                }
                is UiState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this, state.message, Toast.LENGTH_SHORT).show()
                }
                else -> Unit
            }
        }

        viewModel.loadLeaveRequests(barberProfileId)
    }
}
