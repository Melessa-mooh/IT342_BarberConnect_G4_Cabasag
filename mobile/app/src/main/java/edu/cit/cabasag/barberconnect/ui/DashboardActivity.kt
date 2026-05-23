package edu.cit.cabasag.barberconnect.ui

import android.content.Intent
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.R
import edu.cit.cabasag.barberconnect.databinding.ActivityDashboardBinding
import edu.cit.cabasag.barberconnect.repository.AuthRepository
import edu.cit.cabasag.barberconnect.ui.barber.BarberFeedActivity as BarberSocialFeedActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberIncomeActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberLeaveActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberScheduleActivity
import edu.cit.cabasag.barberconnect.ui.customer.BarberFeedActivity
import edu.cit.cabasag.barberconnect.ui.customer.CustomerBarberListActivity
import edu.cit.cabasag.barberconnect.ui.customer.MyAppointmentsActivity
import edu.cit.cabasag.barberconnect.util.TokenManager
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModel
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModelFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class DashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDashboardBinding
    private lateinit var viewModel: AuthViewModel
    private var barberProfileId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViewModel()
        viewModel.refreshCurrentUser()
        setupDrawerShell()
        loadUserData()

        viewModel.loggedOut.observe(this) { loggedOut ->
            if (loggedOut) navigateToLogin()
        }
    }

    private fun setupViewModel() {
        val tokenManager = TokenManager(this)
        val apiService = (application as BarberConnectApp).retrofitClient.apiService
        val repository = AuthRepository(apiService, tokenManager)
        viewModel = ViewModelProvider(this, AuthViewModelFactory(repository))[AuthViewModel::class.java]
    }

    private fun setupDrawerShell() {
        binding.btnMenu.setOnClickListener { openDrawer() }
        binding.btnCloseDrawer.setOnClickListener { closeDrawer() }
        binding.drawerOverlay.setOnClickListener { closeDrawer() }
        binding.btnLogout.setOnClickListener { viewModel.logout() }
        binding.welcomeCard.setOnClickListener { start<ProfileActivity>() }
    }

    private fun loadUserData() {
        lifecycleScope.launch {
            val user = viewModel.getUser().first()
            if (user == null) {
                navigateToLogin()
                return@launch
            }

            barberProfileId = user.barberProfile?.id ?: user.resolvedUserId
            binding.tvWelcome.text = "Welcome, ${user.firstName ?: "there"}"
            binding.tvEmail.text = user.email.orEmpty()
            binding.tvRole.text = user.role ?: "USER"
            binding.tvAvatar.text = user.initials()
            binding.tvAvatar.background = circleDrawable(
                if (user.role.equals("BARBER", ignoreCase = true)) R.color.navy_panel else R.color.orange_accent
            )

            when (user.role?.uppercase()) {
                "CUSTOMER" -> showCustomerDashboard()
                "BARBER" -> showBarberDashboard()
                "ADMIN" -> showAdminDashboard()
                else -> showCustomerDashboard()
            }
        }
    }

    private fun showCustomerDashboard() {
        binding.headerBar.setBackgroundColor(getColor(R.color.white))
        binding.tvHeaderBrand.setTextColor(getColor(R.color.navy_dark))
        binding.tvDashboardTitle.text = "Barber Feed"
        binding.tvDashboardSubtitle.text = "Latest posts from all barbers"
        binding.tvPrimaryIcon.text = "F"
        binding.tvPrimaryTitle.text = "Barber Feed"
        binding.tvPrimarySubtitle.text = "View posts, style updates, comments, and barber work"
        binding.tvSecondaryTitle.text = "Available Barbers"
        binding.tvTertiaryTitle.text = "Calendar / My Appointments"
        binding.cardQuaternary.visibility = View.GONE

        binding.cardPrimary.setOnClickListener { start<BarberFeedActivity>() }
        binding.cardSecondary.setOnClickListener { start<CustomerBarberListActivity>() }
        binding.cardTertiary.setOnClickListener { start<MyAppointmentsActivity>() }

        configureDrawer(
            dark = false,
            items = listOf(
                DrawerItem("Dashboard / Barber Feed", true) { start<BarberFeedActivity>() },
                DrawerItem("My Bookings") { start<MyAppointmentsActivity>() },
                DrawerItem("Profile") { start<ProfileActivity>() }
            )
        )
    }

    private fun showBarberDashboard() {
        binding.headerBar.setBackgroundColor(getColor(R.color.navy_dark))
        binding.tvHeaderBrand.setTextColor(getColor(R.color.white))
        binding.tvDashboardTitle.text = "Overview"
        binding.tvDashboardSubtitle.text = "Welcome back. Here's what's happening today."
        binding.tvPrimaryIcon.text = "P"
        binding.tvPrimaryTitle.text = "Monthly Income"
        binding.tvPrimarySubtitle.text = "Your 80% share from completed appointments"
        binding.tvSecondaryTitle.text = "Appointments"
        binding.tvTertiaryTitle.text = "Recent Appointments"
        binding.tvQuaternaryTitle.text = "Quick Stats"
        binding.cardQuaternary.visibility = View.VISIBLE

        binding.cardPrimary.setOnClickListener { openBarberIncome() }
        binding.cardSecondary.setOnClickListener { openBarberSchedule() }
        binding.cardTertiary.setOnClickListener { openBarberSchedule() }
        binding.cardQuaternary.setOnClickListener { toastCurrentOverview() }

        configureDrawer(
            dark = true,
            items = listOf(
                DrawerItem("Overview", true) { toastCurrentOverview() },
                DrawerItem("Schedule") { openBarberSchedule() },
                DrawerItem("Haircut Catalog") { showUnavailable("Haircut Catalog") },
                DrawerItem("Social Feed") { openBarberFeed() },
                DrawerItem("Income Analytics") { openBarberIncome() },
                DrawerItem("Ratings") { showUnavailable("Ratings") },
                DrawerItem("Profile") { start<ProfileActivity>() }
            )
        )
    }

    private fun showAdminDashboard() {
        binding.tvDashboardTitle.text = "Admin"
        binding.tvDashboardSubtitle.text = "Admin dashboard is available on web"
        binding.tvPrimaryIcon.text = "A"
        binding.tvPrimaryTitle.text = "Admin Dashboard"
        binding.tvPrimarySubtitle.text = "Use the web dashboard for admin tools"
        binding.tvSecondaryTitle.text = "Profile"
        binding.tvTertiaryTitle.text = "Sign Out"
        binding.cardQuaternary.visibility = View.GONE
        binding.cardPrimary.setOnClickListener { showUnavailable("Admin Dashboard") }
        binding.cardSecondary.setOnClickListener { start<ProfileActivity>() }
        binding.cardTertiary.setOnClickListener { viewModel.logout() }
        configureDrawer(
            dark = false,
            items = listOf(
                DrawerItem("Dashboard", true) { showUnavailable("Admin Dashboard") },
                DrawerItem("Profile") { start<ProfileActivity>() },
                DrawerItem("Sign Out") { viewModel.logout() }
            )
        )
    }

    private fun configureDrawer(dark: Boolean, items: List<DrawerItem>) {
        binding.drawerPanel.setBackgroundColor(getColor(if (dark) R.color.navy_dark else R.color.white))
        binding.tvDrawerTitle.setTextColor(getColor(if (dark) R.color.white else R.color.navy_dark))
        binding.btnCloseDrawer.setTextColor(getColor(if (dark) R.color.white else R.color.navy_dark))

        val itemViews = listOf(
            binding.drawerItem1,
            binding.drawerItem2,
            binding.drawerItem3,
            binding.drawerItem4,
            binding.drawerItem5,
            binding.drawerItem6,
            binding.drawerItem7
        )

        itemViews.forEachIndexed { index, textView ->
            val item = items.getOrNull(index)
            if (item == null) {
                textView.visibility = View.GONE
            } else {
                textView.visibility = View.VISIBLE
                textView.text = item.label
                textView.setTextColor(getColor(if (item.active) R.color.orange_accent else if (dark) R.color.white else R.color.gray_text_dark))
                textView.background = if (item.active) roundedDrawable(R.color.orange_soft) else null
                textView.setOnClickListener {
                    closeDrawer()
                    item.action()
                }
            }
        }
    }

    private fun openBarberSchedule() {
        start<BarberScheduleActivity> { putExtra("barberProfileId", barberProfileId) }
    }

    private fun openBarberFeed() {
        start<BarberSocialFeedActivity> { putExtra("barberProfileId", barberProfileId) }
    }

    private fun openBarberIncome() {
        start<BarberIncomeActivity> { putExtra("barberProfileId", barberProfileId) }
    }

    @Suppress("unused")
    private fun openBarberLeave() {
        start<BarberLeaveActivity> { putExtra("barberProfileId", barberProfileId) }
    }

    private fun openDrawer() {
        binding.drawerOverlay.alpha = 0f
        binding.drawerOverlay.visibility = View.VISIBLE
        binding.drawerPanel.visibility = View.VISIBLE
        binding.drawerPanel.post {
            val offscreen = binding.drawerPanel.width.toFloat()
            binding.drawerPanel.translationX = offscreen
            binding.drawerOverlay.animate().alpha(1f).setDuration(140).start()
            binding.drawerPanel.animate().translationX(0f).setDuration(180).start()
        }
    }

    private fun closeDrawer() {
        val offscreen = binding.drawerPanel.width.toFloat().takeIf { it > 0f }
            ?: (280f * resources.displayMetrics.density)
        binding.drawerOverlay.animate()
            .alpha(0f)
            .setDuration(120)
            .withEndAction { binding.drawerOverlay.visibility = View.GONE }
            .start()
        binding.drawerPanel.animate()
            .translationX(offscreen)
            .setDuration(160)
            .withEndAction {
                binding.drawerPanel.visibility = View.GONE
                binding.drawerPanel.translationX = 0f
            }
            .start()
    }

    private fun toastCurrentOverview() {
        Toast.makeText(this, "Overview is open.", Toast.LENGTH_SHORT).show()
    }

    private fun showUnavailable(label: String) {
        Toast.makeText(this, "$label is not available in the mobile app yet.", Toast.LENGTH_SHORT).show()
    }

    private fun circleDrawable(colorRes: Int) = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(getColor(colorRes))
    }

    private fun roundedDrawable(colorRes: Int) = GradientDrawable().apply {
        cornerRadius = resources.displayMetrics.density * 12
        setColor(getColor(colorRes))
    }

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

    private data class DrawerItem(
        val label: String,
        val active: Boolean = false,
        val action: () -> Unit
    )
}
