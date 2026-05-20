package edu.cit.cabasag.barberconnect.ui.customer

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.R
import edu.cit.cabasag.barberconnect.databinding.ActivityBookingBinding
import edu.cit.cabasag.barberconnect.model.BookingRequest
import edu.cit.cabasag.barberconnect.model.HaircutStyle
import edu.cit.cabasag.barberconnect.repository.CustomerRepository
import edu.cit.cabasag.barberconnect.ui.adapter.HaircutStyleAdapter
import edu.cit.cabasag.barberconnect.util.TokenManager
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModel
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModelFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class BookingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBookingBinding
    private lateinit var viewModel: CustomerViewModel
    private lateinit var styleAdapter: HaircutStyleAdapter

    private val barberId by lazy { intent.getStringExtra("barberId") ?: "" }

    // Time slots matching the web app
    private val timeSlots = listOf(
        "9:00 AM", "10:00 AM", "11:00 AM",
        "1:00 PM", "2:00 PM",  "3:00 PM", "4:00 PM"
    )

    private var selectedStyle: HaircutStyle? = null
    private var selectedDateMillis: Long = System.currentTimeMillis()
    private var selectedTime: String? = null
    private var bookedSlots: List<String> = emptyList()
    private var leaveDates: List<String> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBookingBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val api        = (application as BarberConnectApp).retrofitClient.apiService
        val repository = CustomerRepository(api)
        viewModel = ViewModelProvider(this, CustomerViewModelFactory(repository))[CustomerViewModel::class.java]

        // Show barber info
        val firstName = intent.getStringExtra("barberFirstName") ?: ""
        val lastName  = intent.getStringExtra("barberLastName")  ?: ""
        val rating    = intent.getStringExtra("barberRating")    ?: "0.0"
        val exp       = intent.getIntExtra("barberExp", 0)
        binding.tvBarberName.text = "$firstName $lastName".trim()
        binding.tvBarberMeta.text = "⭐ $rating  •  $exp yrs experience"

        setupStyleRecycler()
        observeViewModel()

        // Load data
        viewModel.loadHaircutStyles(barberId)
        viewModel.loadLeaveDates(barberId)
        viewModel.loadBarberAppointments(barberId)

        // Calendar listener
        binding.calendarView.minDate = System.currentTimeMillis() - 1000
        binding.calendarView.setOnDateChangeListener { _, year, month, day ->
            val cal = Calendar.getInstance().apply { set(year, month, day) }
            selectedDateMillis = cal.timeInMillis
            val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(cal.time)
            binding.tvSelectedDate.text = "Selected: $dateStr"

            val isLeave = leaveDates.contains(dateStr)
            binding.tvLeaveWarning.visibility = if (isLeave) View.VISIBLE else View.GONE

            // Refresh time slots for the new date
            refreshTimeSlots(dateStr)
        }

        binding.btnConfirmBooking.setOnClickListener { confirmBooking() }
    }

    private fun setupStyleRecycler() {
        styleAdapter = HaircutStyleAdapter { style ->
            selectedStyle = style
            updateTotal()
        }
        binding.recyclerStyles.layoutManager = LinearLayoutManager(this)
        binding.recyclerStyles.adapter = styleAdapter
    }

    private fun observeViewModel() {
        viewModel.haircutStyles.observe(this) { state ->
            when (state) {
                is UiState.Loading -> binding.progressStyles.visibility = View.VISIBLE
                is UiState.Success -> {
                    binding.progressStyles.visibility = View.GONE
                    styleAdapter.submitList(state.data.filter { it.isActive == true })
                }
                is UiState.Error -> {
                    binding.progressStyles.visibility = View.GONE
                    Toast.makeText(this, state.message, Toast.LENGTH_SHORT).show()
                }
                else -> Unit
            }
        }

        viewModel.leaveDates.observe(this) { dates ->
            leaveDates = dates
        }

        viewModel.barberAppointments.observe(this) { appointments ->
            // Build booked slot strings for the currently selected date
            val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                .format(Date(selectedDateMillis))
            bookedSlots = appointments
                .filter { apt ->
                    apt.appointmentDateTime?.startsWith(dateStr) == true
                }
                .mapNotNull { apt ->
                    apt.appointmentDateTime?.let { dt ->
                        try {
                            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                            val d = sdf.parse(dt.take(19)) ?: return@mapNotNull null
                            SimpleDateFormat("h:mm a", Locale.US).format(d)
                        } catch (_: Exception) { null }
                    }
                }
            refreshTimeSlots(dateStr)
        }

        viewModel.bookingState.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.btnConfirmBooking.isEnabled = false
                    binding.btnConfirmBooking.text = "Booking…"
                }
                is UiState.Success -> {
                    binding.btnConfirmBooking.isEnabled = true
                    binding.btnConfirmBooking.text = "Confirm Booking"
                    Toast.makeText(this, "Booking confirmed!", Toast.LENGTH_LONG).show()
                    viewModel.resetBookingState()
                    finish()
                }
                is UiState.Error -> {
                    binding.btnConfirmBooking.isEnabled = true
                    binding.btnConfirmBooking.text = "Confirm Booking"
                    binding.tvBookingError.visibility = View.VISIBLE
                    binding.tvBookingError.text = state.message
                    viewModel.resetBookingState()
                }
                else -> Unit
            }
        }
    }

    private fun refreshTimeSlots(dateStr: String) {
        binding.gridTimeSlots.removeAllViews()
        timeSlots.forEach { slot ->
            val isBooked = bookedSlots.any { it.equals(slot, ignoreCase = true) }
            val btn = Button(this).apply {
                text = slot
                isEnabled = !isBooked
                setBackgroundColor(
                    getColor(
                        when {
                            slot == selectedTime -> R.color.brown_primary
                            isBooked            -> R.color.gray_border
                            else                -> R.color.white
                        }
                    )
                )
                setTextColor(
                    getColor(
                        if (slot == selectedTime || isBooked) android.R.color.white
                        else R.color.brown_primary
                    )
                )
                setPadding(8, 16, 8, 16)
                val params = android.widget.GridLayout.LayoutParams().apply {
                    width  = 0
                    height = android.widget.GridLayout.LayoutParams.WRAP_CONTENT
                    columnSpec = android.widget.GridLayout.spec(
                        android.widget.GridLayout.UNDEFINED, 1, 1f
                    )
                    setMargins(6, 6, 6, 6)
                }
                layoutParams = params
                setOnClickListener {
                    if (!isBooked) {
                        selectedTime = slot
                        refreshTimeSlots(dateStr)
                    }
                }
            }
            binding.gridTimeSlots.addView(btn)
        }
    }

    private fun updateTotal() {
        val price = selectedStyle?.basePrice ?: 0.0
        binding.tvTotalPrice.text = "Total: ₱${"%.2f".format(price)}"
    }

    private fun confirmBooking() {
        val style = selectedStyle
        val time  = selectedTime

        if (style == null) {
            binding.tvBookingError.visibility = View.VISIBLE
            binding.tvBookingError.text = "Please select a haircut style."
            return
        }
        if (time == null) {
            binding.tvBookingError.visibility = View.VISIBLE
            binding.tvBookingError.text = "Please select a time slot."
            return
        }

        val dateStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            .format(Date(selectedDateMillis))
        if (leaveDates.contains(dateStr)) {
            binding.tvBookingError.visibility = View.VISIBLE
            binding.tvBookingError.text = "Barber is on leave this day. Choose another date."
            return
        }

        binding.tvBookingError.visibility = View.GONE

        // Build ISO 8601 datetime
        val sdfIn  = SimpleDateFormat("yyyy-MM-dd h:mm a", Locale.US)
        val parsed = sdfIn.parse("$dateStr $time") ?: run {
            Toast.makeText(this, "Invalid date/time", Toast.LENGTH_SHORT).show()
            return
        }
        val isoDateTime = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
            .apply { timeZone = TimeZone.getTimeZone("UTC") }
            .format(parsed)

        val paymentMethod = when (binding.radioPayment.checkedRadioButtonId) {
            R.id.radioCard    -> "CARD"
            R.id.radioDigital -> "DIGITAL_WALLET"
            else              -> "CASH"
        }

        lifecycleScope.launch {
            val tokenManager = TokenManager(this@BookingActivity)
            val user = tokenManager.getUser().first()
            val customerId = user?.firebaseUid ?: run {
                Toast.makeText(this@BookingActivity, "Not logged in", Toast.LENGTH_SHORT).show()
                return@launch
            }

            viewModel.bookAppointment(
                BookingRequest(
                    customerId          = customerId,
                    barberProfileId     = barberId,
                    haircutStyleId      = style.haircutStyleId ?: "",
                    appointmentDateTime = isoDateTime,
                    totalPrice          = style.basePrice ?: 0.0,
                    paymentMethod       = paymentMethod
                )
            )
        }
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
