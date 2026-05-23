package edu.cit.cabasag.barberconnect.ui

import android.content.Intent
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.R
import edu.cit.cabasag.barberconnect.databinding.ActivityDashboardBinding
import edu.cit.cabasag.barberconnect.model.Appointment
import edu.cit.cabasag.barberconnect.model.AuthResponse
import edu.cit.cabasag.barberconnect.model.Barber
import edu.cit.cabasag.barberconnect.model.Post
import edu.cit.cabasag.barberconnect.repository.AuthRepository
import edu.cit.cabasag.barberconnect.repository.CustomerRepository
import edu.cit.cabasag.barberconnect.ui.adapter.AppointmentAdapter
import edu.cit.cabasag.barberconnect.ui.adapter.BarberAdapter
import edu.cit.cabasag.barberconnect.ui.adapter.PostAdapter
import edu.cit.cabasag.barberconnect.ui.barber.BarberFeedActivity as BarberSocialFeedActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberIncomeActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberLeaveActivity
import edu.cit.cabasag.barberconnect.ui.barber.BarberScheduleActivity
import edu.cit.cabasag.barberconnect.ui.customer.BarberFeedActivity
import edu.cit.cabasag.barberconnect.ui.customer.BookingActivity
import edu.cit.cabasag.barberconnect.ui.customer.CustomerBarberListActivity
import edu.cit.cabasag.barberconnect.ui.customer.MyAppointmentsActivity
import edu.cit.cabasag.barberconnect.util.TokenManager
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModel
import edu.cit.cabasag.barberconnect.viewmodel.AuthViewModelFactory
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModel
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModelFactory
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class DashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDashboardBinding
    private lateinit var viewModel: AuthViewModel
    private lateinit var customerViewModel: CustomerViewModel
    private lateinit var postAdapter: PostAdapter
    private lateinit var barberAdapter: BarberAdapter
    private lateinit var appointmentAdapter: AppointmentAdapter

    private var barberProfileId: String? = null
    private var currentCustomerId: String? = null
    private var customerDashboardReady = false
    private var latestAppointments: List<Appointment> = emptyList()
    private var selectedDateKey: String = dateKey(Calendar.getInstance().timeInMillis)
    private var barbersById: Map<String, Barber> = emptyMap()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupViewModels()
        viewModel.refreshCurrentUser()
        setupDrawerShell()
        loadUserData()

        viewModel.loggedOut.observe(this) { loggedOut ->
            if (loggedOut) navigateToLogin()
        }
    }

    private fun setupViewModels() {
        val tokenManager = TokenManager(this)
        val apiService = (application as BarberConnectApp).retrofitClient.apiService
        viewModel = ViewModelProvider(
            this,
            AuthViewModelFactory(AuthRepository(apiService, tokenManager))
        )[AuthViewModel::class.java]
        customerViewModel = ViewModelProvider(
            this,
            CustomerViewModelFactory(CustomerRepository(apiService))
        )[CustomerViewModel::class.java]
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
            bindWelcomeCard(user)

            when (user.role?.uppercase()) {
                "CUSTOMER" -> showCustomerDashboard(user)
                "BARBER" -> showBarberDashboard()
                "ADMIN" -> showAdminDashboard()
                else -> showCustomerDashboard(user)
            }
        }
    }

    private fun bindWelcomeCard(user: AuthResponse) {
        binding.tvWelcome.text = "Welcome, ${user.firstName ?: "there"}"
        binding.tvEmail.text = user.email.orEmpty()
        binding.tvRole.text = user.role ?: "USER"
        binding.tvAvatar.text = user.initials()
        binding.tvAvatar.background = circleDrawable(
            if (user.role.equals("BARBER", ignoreCase = true)) R.color.navy_panel else R.color.orange_accent
        )
    }

    private fun showCustomerDashboard(user: AuthResponse) {
        currentCustomerId = user.resolvedUserId
        binding.headerBar.setBackgroundColor(getColor(R.color.white))
        binding.tvHeaderBrand.setTextColor(getColor(R.color.navy_dark))
        binding.customerHomeContainer.visibility = View.VISIBLE
        binding.dashboardMenuContainer.visibility = View.GONE
        binding.tvDashboardTitle.text = "Barber Feed"
        binding.tvDashboardSubtitle.text = "Latest posts from all barbers"

        setupCustomerDashboardOnce()
        customerViewModel.loadPosts()
        customerViewModel.loadBarbers()
        currentCustomerId?.let { customerViewModel.loadMyAppointments(it) }

        configureDrawer(
            dark = false,
            items = listOf(
                DrawerItem("Dashboard / Barber Feed", true) { scrollDashboardToTop() },
                DrawerItem("My Bookings") { start<MyAppointmentsActivity>() },
                DrawerItem("Profile") { start<ProfileActivity>() }
            )
        )
    }

    private fun setupCustomerDashboardOnce() {
        if (customerDashboardReady) return
        customerDashboardReady = true

        postAdapter = PostAdapter(
            onCommentsClick = { start<BarberFeedActivity>() },
            onLikeClick = { post -> reactToPost(post) },
            barberNameProvider = { post -> barbersById[post.barberProfileId]?.displayName()?.ifBlank { null } }
        )
        barberAdapter = BarberAdapter { barber -> openBooking(barber) }
        appointmentAdapter = AppointmentAdapter()

        binding.recyclerDashboardPosts.layoutManager = LinearLayoutManager(this)
        binding.recyclerDashboardPosts.adapter = postAdapter
        binding.recyclerDashboardBarbers.layoutManager = LinearLayoutManager(this)
        binding.recyclerDashboardBarbers.adapter = barberAdapter
        binding.recyclerDashboardAppointments.layoutManager = LinearLayoutManager(this)
        binding.recyclerDashboardAppointments.adapter = appointmentAdapter

        binding.btnSeeAllFeed.setOnClickListener { start<BarberFeedActivity>() }
        binding.btnSeeAllBarbers.setOnClickListener { start<CustomerBarberListActivity>() }
        binding.btnSeeAllAppointments.setOnClickListener { start<MyAppointmentsActivity>() }
        binding.calendarDashboard.setOnDateChangeListener { _, year, month, dayOfMonth ->
            val selected = Calendar.getInstance().apply { set(year, month, dayOfMonth, 0, 0, 0) }
            selectedDateKey = dateKey(selected.timeInMillis)
            updateAppointmentPreview()
        }
        binding.tvSelectedDate.text = selectedDateLabel(selectedDateKey)

        observeCustomerDashboard()
    }

    private fun observeCustomerDashboard() {
        customerViewModel.posts.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.progressFeed.visibility = View.VISIBLE
                    binding.tvFeedEmpty.visibility = View.GONE
                }
                is UiState.Success -> {
                    binding.progressFeed.visibility = View.GONE
                    val posts = state.data.take(5)
                    binding.tvFeedEmpty.visibility = if (posts.isEmpty()) View.VISIBLE else View.GONE
                    postAdapter.submitList(posts)
                }
                is UiState.Error -> {
                    binding.progressFeed.visibility = View.GONE
                    binding.tvFeedEmpty.visibility = View.VISIBLE
                    binding.tvFeedEmpty.text = state.message
                }
                else -> Unit
            }
        }

        customerViewModel.barbers.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.progressBarbers.visibility = View.VISIBLE
                    binding.tvBarbersEmpty.visibility = View.GONE
                }
                is UiState.Success -> {
                    binding.progressBarbers.visibility = View.GONE
                    val barbers = state.data
                    barbersById = barbers.mapNotNull { barber -> barber.id?.let { it to barber } }.toMap()
                    binding.tvBarbersCount.text = "${barbers.size} barber${if (barbers.size == 1) "" else "s"} available"
                    binding.tvBarbersEmpty.visibility = if (barbers.isEmpty()) View.VISIBLE else View.GONE
                    barberAdapter.submitList(barbers.take(4))
                    postAdapter.submitList(postAdapter.currentList.toList())
                }
                is UiState.Error -> {
                    binding.progressBarbers.visibility = View.GONE
                    binding.tvBarbersEmpty.visibility = View.VISIBLE
                    binding.tvBarbersEmpty.text = state.message
                }
                else -> Unit
            }
        }

        customerViewModel.myAppointments.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.progressAppointments.visibility = View.VISIBLE
                    binding.tvAppointmentsEmpty.visibility = View.GONE
                }
                is UiState.Success -> {
                    binding.progressAppointments.visibility = View.GONE
                    latestAppointments = state.data.sortedBy { it.appointmentDateTime.orEmpty() }
                    updateAppointmentPreview()
                }
                is UiState.Error -> {
                    binding.progressAppointments.visibility = View.GONE
                    binding.tvAppointmentsEmpty.visibility = View.VISIBLE
                    binding.tvAppointmentsEmpty.text = state.message
                }
                else -> Unit
            }
        }

        customerViewModel.reactionState.observe(this) { state ->
            if (state is UiState.Error) {
                Toast.makeText(this, state.message, Toast.LENGTH_SHORT).show()
                customerViewModel.resetReactionState()
            } else if (state is UiState.Success) {
                customerViewModel.resetReactionState()
            }
        }
    }

    private fun updateAppointmentPreview() {
        binding.tvSelectedDate.text = selectedDateLabel(selectedDateKey)
        val selectedAppointments = latestAppointments.filter { appointment ->
            appointmentDateKey(appointment) == selectedDateKey
        }
        val upcoming = if (selectedAppointments.isNotEmpty()) {
            selectedAppointments
        } else {
            latestAppointments.filter { appointmentDateKey(it) >= selectedDateKey }.take(3)
        }
        binding.tvAppointmentsEmpty.visibility = if (upcoming.isEmpty()) View.VISIBLE else View.GONE
        binding.tvAppointmentsEmpty.text = if (selectedAppointments.isEmpty()) {
            "No appointments for this date. Upcoming bookings will appear here."
        } else {
            "No appointments for this date."
        }
        appointmentAdapter.submitList(upcoming.take(4))
    }

    private fun reactToPost(post: Post) {
        val postId = post.postId ?: return
        val userId = currentCustomerId ?: return
        customerViewModel.addReaction(postId, userId)
    }

    private fun showBarberDashboard() {
        binding.headerBar.setBackgroundColor(getColor(R.color.navy_dark))
        binding.tvHeaderBrand.setTextColor(getColor(R.color.white))
        binding.customerHomeContainer.visibility = View.GONE
        binding.dashboardMenuContainer.visibility = View.VISIBLE
        binding.tvDashboardTitleLegacy.text = "Overview"
        binding.tvDashboardSubtitleLegacy.text = "Welcome back. Here's what's happening today."
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
        binding.customerHomeContainer.visibility = View.GONE
        binding.dashboardMenuContainer.visibility = View.VISIBLE
        binding.tvDashboardTitleLegacy.text = "Admin"
        binding.tvDashboardSubtitleLegacy.text = "Admin dashboard is available on web"
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

    private fun openBooking(barber: Barber) {
        startActivity(
            Intent(this, BookingActivity::class.java).apply {
                putExtra("barberId", barber.id)
                putExtra("barberFirstName", barber.firstName)
                putExtra("barberLastName", barber.lastName)
                putExtra("barberBio", barber.bio)
                putExtra("barberRating", barber.rating)
                putExtra("barberExp", barber.yearsExperience ?: 0)
            }
        )
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

    private fun scrollDashboardToTop() {
        binding.customerHomeContainer.requestFocus()
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

    private fun appointmentDateKey(appointment: Appointment): String {
        val raw = appointment.appointmentDateTime.orEmpty()
        return try {
            val input = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val parsed = input.parse(raw.take(19))
            if (parsed != null) {
                SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(parsed)
            } else {
                raw.take(10)
            }
        } catch (_: Exception) {
            raw.take(10)
        }
    }

    private fun selectedDateLabel(key: String): String {
        return try {
            val parsed = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(key)
            val label = if (parsed != null) {
                SimpleDateFormat("EEEE, MMM d", Locale.getDefault()).format(parsed)
            } else {
                key
            }
            "Selected: $label"
        } catch (_: Exception) {
            "Selected: $key"
        }
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

    private companion object {
        fun dateKey(timeInMillis: Long): String =
            SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(timeInMillis))
    }
}
