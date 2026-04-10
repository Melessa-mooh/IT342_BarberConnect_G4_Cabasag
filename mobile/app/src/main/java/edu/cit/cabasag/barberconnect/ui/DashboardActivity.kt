package edu.cit.cabasag.barberconnect.ui

import android.content.Intent
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import edu.cit.cabasag.barberconnect.databinding.ActivityDashboardBinding
import edu.cit.cabasag.barberconnect.network.RetrofitClient
import edu.cit.cabasag.barberconnect.repository.AuthRepository
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
        setupClickListeners()

        viewModel.loggedOut.observe(this) { loggedOut ->
            if (loggedOut) navigateToLogin()
        }
    }

    private fun setupViewModel() {
        val tokenManager = TokenManager(this)
        val repository   = AuthRepository(RetrofitClient.apiService, tokenManager)
        viewModel = ViewModelProvider(this, AuthViewModelFactory(repository))[AuthViewModel::class.java]
    }

    private fun loadUserData() {
        lifecycleScope.launch {
            val user = viewModel.getUser().first()
            if (user == null) {
                navigateToLogin()
                return@launch
            }

            // Welcome message
            binding.tvWelcome.text = "Welcome, ${user.firstName}!"
            binding.tvEmail.text   = user.email ?: ""
            binding.tvRole.text    = "Role: ${user.role ?: "USER"}"

            // Avatar circle with initials
            val initials = user.initials()
            binding.tvAvatar.text = initials
            // Give the avatar a circular shape programmatically
            val shape = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(resources.getColor(edu.cit.cabasag.barberconnect.R.color.brown_primary, theme))
            }
            binding.tvAvatar.background = shape
        }
    }

    private fun setupClickListeners() {
        binding.btnLogout.setOnClickListener {
            viewModel.logout()
        }
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
