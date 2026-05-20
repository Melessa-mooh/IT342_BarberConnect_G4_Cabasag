package edu.cit.cabasag.barberconnect.ui

import android.content.Intent
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityDashboardBinding
import edu.cit.cabasag.barberconnect.repository.AuthRepository
import edu.cit.cabasag.barberconnect.ui.customer.CustomerBarberListActivity
import edu.cit.cabasag.barberconnect.ui.customer.MyAppointmentsActivity
import edu.cit.cabasag.barberconnect.ui.customer.BarberFeedActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberScheduleActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberLeaveActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberIncomeActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberFeedActivity as BarberSocialFeedActivity
import edu.cit.cabasag.barberconnect.util.TokenManager
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModel
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModelFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class DashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDashboardBinding
    private lateinit var viewModel: AuthViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViewModel()
        loadUserData()

        viewModel.loggedOut.observe(this) { loggedOut ->
            if (loggedOut) navigateToLogin()
        }
    }

    private fun setupViewModel() {
        val tokenManager = TokenManager(this)
        val apiService   = (application as BarberConnectApp).retrofitClient.apiService
        val repository   = AuthRepository(apiService, tokenManager)
        viewModel = ViewModelProvider(this, AuthViewModelFactory(repository))[AuthViewModel::class.java]
    }

    private fun loadUserData() {
        lifecycleScope.launch {
            val user = viewModel.getUser().first()
            if (user == null) {
                navigateToLogin()
                return@launch
            }

            // Header info
            binding.tvWelcome.text = "Welcome, ${user.firstName}!"
            binding.tvEmail.text   = user.email ?: ""
            binding.tvRole.text    = "Role: ${user.role ?: "USER"}"

            // Avatar circle
            binding.tvAvatar.text = user.initials()
            val shape = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(resources.getColor(edu.cit.cabasag.barberconnect.R.color.brown_primary, theme))
            }
            binding.tvAvatar.background = shape

            // Role-aware nav buttons
            when (user.role?.uppercase()) {
                "CUSTOMER" -> showCustomerButtons()
                "BARBER"   -> showBarberButtons(user.barberProfile?.id)
                else       -> binding.navButtonsContainer.visibility = View.GONE
            }

            binding.btnLogout.setOnClickListener { viewModel.logout() }
        }
    }

    private fun showCustomerButtons() {
        binding.navButtonsContainer.visibility = View.VISIBLE
        binding.btnNav1.apply {
            visibility = View.VISIBLE
            text = "Browse Barbers & Book"
            setOnClickListener { start<CustomerBarberListActivity>() }
        }
        binding.btnNav2.apply {
            visibility = View.VISIBLE
            text = "My Appointments"
            setOnClickListener { start<MyAppointmentsActivity>() }
        }
        binding.btnNav3.apply {
            visibility = View.VISIBLE
            text = "Barber Feed"
            setOnClickListener { start<BarberFeedActivity>() }
        }
    }

    private fun showBarberButtons(barberProfileId: String?) {
        binding.navButtonsContainer.visibility = View.VISIBLE
        binding.btnNav1.apply {
            visibility = View.VISIBLE
            text = "My Schedule"
            setOnClickListener {
                start<BarberScheduleActivity> {
                    putExtra("barberProfileId", barberProfileId)
                }
            }
        }
        binding.btnNav2.apply {
            visibility = View.VISIBLE
            text = "Leave Requests"
            setOnClickListener {
                start<BarberLeaveActivity> {
                    putExtra("barberProfileId", barberProfileId)
                }
            }
        }
        binding.btnNav3.apply {
            visibility = View.VISIBLE
            text = "Income"
            setOnClickListener {
                start<BarberIncomeActivity> {
                    putExtra("barberProfileId", barberProfileId)
                }
            }
        }
        binding.btnNav4.apply {
            visibility = View.VISIBLE
            text = "Social Feed"
            setOnClickListener {
                start<BarberSocialFeedActivity> {
                    putExtra("barberProfileId", barberProfileId)
                }
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private inline fun <reified T> start(block: Intent.() -> Unit = {}) {
        startActivity(Intent(this, T::class.java).apply(block))
    }

    private fun navigateToLogin() {
        startActivity(
            Intent(this, LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
        )
        finish()
    }
}
