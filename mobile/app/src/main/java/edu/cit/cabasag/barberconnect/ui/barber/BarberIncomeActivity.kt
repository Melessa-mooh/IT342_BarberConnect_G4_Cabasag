package edu.cit.cabasag.barberconnect.ui.barber

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityBarberIncomeBinding
import edu.cit.cabasag.barberconnect.repository.BarberRepository
import edu.cit.cabasag.barberconnect.ui.adapter.IncomeRecordAdapter
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModel
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModelFactory

class BarberIncomeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBarberIncomeBinding
    private lateinit var viewModel: BarberViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBarberIncomeBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val barberProfileId = intent.getStringExtra("barberProfileId") ?: ""

        val api        = (application as BarberConnectApp).retrofitClient.apiService
        val repository = BarberRepository(api)
        viewModel = ViewModelProvider(this, BarberViewModelFactory(repository))[BarberViewModel::class.java]

        val adapter = IncomeRecordAdapter()
        binding.recyclerIncome.layoutManager = LinearLayoutManager(this)
        binding.recyclerIncome.adapter = adapter

        viewModel.incomeRecords.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.tvError.visibility     = View.GONE
                }
                is UiState.Success -> {
                    binding.progressBar.visibility = View.GONE
                    adapter.submitList(state.data)

                    // Update summary card
                    val totalNet = state.data.sumOf { it.netAmount ?: 0.0 }
                    val totalFee = state.data.sumOf { it.platformFee ?: 0.0 }
                    binding.tvTotalNet.text        = "₱${"%.2f".format(totalNet)}"
                    binding.tvTotalPlatformFee.text = "Platform fees paid: ₱${"%.2f".format(totalFee)}"
                }
                is UiState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.tvError.visibility     = View.VISIBLE
                    binding.tvError.text           = state.message
                }
                else -> Unit
            }
        }

        viewModel.loadIncomeRecords(barberProfileId)
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
