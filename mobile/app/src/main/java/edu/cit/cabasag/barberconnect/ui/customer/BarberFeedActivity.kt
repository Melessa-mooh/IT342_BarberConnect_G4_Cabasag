package edu.cit.cabasag.barberconnect.ui.customer

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityBarberFeedBinding
import edu.cit.cabasag.barberconnect.repository.CustomerRepository
import edu.cit.cabasag.barberconnect.ui.adapter.PostAdapter
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModel
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModelFactory

class BarberFeedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBarberFeedBinding
    private lateinit var viewModel: CustomerViewModel
    private lateinit var adapter: PostAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBarberFeedBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val api        = (application as BarberConnectApp).retrofitClient.apiService
        val repository = CustomerRepository(api)
        viewModel = ViewModelProvider(this, CustomerViewModelFactory(repository))[CustomerViewModel::class.java]

        adapter = PostAdapter()
        binding.recyclerPosts.layoutManager = LinearLayoutManager(this)
        binding.recyclerPosts.adapter = adapter

        // Customers only view — hide create post panel
        binding.createPostCard.visibility = View.GONE

        viewModel.posts.observe(this) { state ->
            when (state) {
                is UiState.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.tvError.visibility     = View.GONE
                }
                is UiState.Success -> {
                    binding.progressBar.visibility = View.GONE
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

        viewModel.loadPosts()
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
