package edu.cit.cabasag.barberconnect.ui.customer

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityCustomerBarberListBinding
import edu.cit.cabasag.barberconnect.model.Barber
import edu.cit.cabasag.barberconnect.repository.CustomerRepository
import edu.cit.cabasag.barberconnect.ui.adapter.BarberAdapter
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModel
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModelFactory

class CustomerBarberListActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCustomerBarberListBinding
    private lateinit var viewModel: CustomerViewModel
    private lateinit var adapter: BarberAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCustomerBarberListBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val api        = (application as BarberConnectApp).retrofitClient.apiService
        val repository = CustomerRepository(api)
        viewModel = ViewModelProvider(this, CustomerViewModelFactory(repository))[CustomerViewModel::class.java]

        setupRecycler()
        observeBarbers()
        viewModel.loadBarbers()
    }

    private fun setupRecycler() {
        adapter = BarberAdapter { barber -> openBooking(barber) }
        binding.recyclerBarbers.layoutManager = LinearLayoutManager(this)
        binding.recyclerBarbers.adapter = adapter
    }

    private fun observeBarbers() {
        viewModel.barbers.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.tvError.visibility     = View.GONE
                }
                is UiState.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.tvError.visibility     = View.GONE
                    adapter.submitList(state.data)
                }
                is UiState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.tvError.visibility     = View.VISIBLE
                    binding.tvError.text           = state.message
                }
                else -> Unit
            }
        }
    }

    private fun openBooking(barber: Barber) {
        startActivity(
            Intent(this, BookingActivity::class.java).apply {
                putExtra("barberId",        barber.id)
                putExtra("barberFirstName", barber.firstName)
                putExtra("barberLastName",  barber.lastName)
                putExtra("barberBio",       barber.bio)
                putExtra("barberRating",    barber.rating)
                putExtra("barberExp",       barber.yearsExperience ?: 0)
            }
        )
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
