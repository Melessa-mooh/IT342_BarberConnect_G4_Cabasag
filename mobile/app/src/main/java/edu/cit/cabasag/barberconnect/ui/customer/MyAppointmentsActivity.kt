package edu.cit.cabasag.barberconnect.ui.customer

import android.app.AlertDialog
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.RatingBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityMyAppointmentsBinding
import edu.cit.cabasag.barberconnect.model.Appointment
import edu.cit.cabasag.barberconnect.model.FeedbackRequest
import edu.cit.cabasag.barberconnect.repository.CustomerRepository
import edu.cit.cabasag.barberconnect.ui.adapter.AppointmentAdapter
import edu.cit.cabasag.barberconnect.util.TokenManager
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModel
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModelFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class MyAppointmentsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMyAppointmentsBinding
    private lateinit var viewModel: CustomerViewModel
    private lateinit var adapter: AppointmentAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMyAppointmentsBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val api        = (application as BarberConnectApp).retrofitClient.apiService
        val repository = CustomerRepository(api)
        viewModel = ViewModelProvider(this, CustomerViewModelFactory(repository))[CustomerViewModel::class.java]

        adapter = AppointmentAdapter { appt -> showFeedbackDialog(appt) }
        binding.recyclerAppointments.layoutManager = LinearLayoutManager(this)
        binding.recyclerAppointments.adapter = adapter

        observeViewModel()

        lifecycleScope.launch {
            val user = TokenManager(this@MyAppointmentsActivity).getUser().first()
            val uid  = user?.resolvedUserId
            if (uid != null) {
                viewModel.loadMyAppointments(uid)
            } else {
                binding.tvError.visibility = View.VISIBLE
                binding.tvError.text = "Not logged in."
            }
        }
    }

    private fun observeViewModel() {
        viewModel.myAppointments.observe(this) { state ->
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

        viewModel.feedbackState.observe(this) { state ->
            when (state) {
                is UiState.Success -> {
                    Toast.makeText(this, "Feedback submitted!", Toast.LENGTH_SHORT).show()
                    viewModel.resetFeedbackState()
                }
                is UiState.Error -> {
                    Toast.makeText(this, state.message, Toast.LENGTH_SHORT).show()
                    viewModel.resetFeedbackState()
                }
                else -> Unit
            }
        }
    }

    private fun showFeedbackDialog(appt: Appointment) {
        // Build a simple dialog with RatingBar + EditText
        val ratingBar = RatingBar(this).apply {
            numStars    = 5
            stepSize    = 1f
            rating      = 5f
        }
        val etComment = EditText(this).apply {
            hint = "Leave a comment (optional)"
            setTextColor(Color.parseColor("#111827"))
            setHintTextColor(Color.parseColor("#6B7280"))
            backgroundTintList = ColorStateList.valueOf(Color.parseColor("#9CA3AF"))
        }
        val container = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(48, 24, 48, 0)
            addView(ratingBar)
            addView(etComment)
        }

        AlertDialog.Builder(this)
            .setTitle("Rate your experience")
            .setView(container)
            .setPositiveButton("Submit") { _, _ ->
                lifecycleScope.launch {
                    val user = TokenManager(this@MyAppointmentsActivity).getUser().first()
                    val uid  = user?.resolvedUserId ?: return@launch
                    viewModel.submitFeedback(
                        FeedbackRequest(
                            appointmentId  = appt.appointmentId ?: "",
                            customerId     = uid,
                            barberProfileId = appt.barberProfileId ?: "",
                            rating         = ratingBar.rating.toInt(),
                            comment        = etComment.text.toString()
                        )
                    )
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
