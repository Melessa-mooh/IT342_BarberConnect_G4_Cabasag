package edu.cit.cabasag.barberconnect.ui.barber

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityBarberFeedBinding
import edu.cit.cabasag.barberconnect.repository.BarberRepository
import edu.cit.cabasag.barberconnect.ui.adapter.PostAdapter
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModel
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModelFactory

class BarberFeedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBarberFeedBinding
    private lateinit var viewModel: BarberViewModel
    private lateinit var adapter: PostAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBarberFeedBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val barberProfileId = intent.getStringExtra("barberProfileId") ?: ""

        val api        = (application as BarberConnectApp).retrofitClient.apiService
        val repository = BarberRepository(api)
        viewModel = ViewModelProvider(this, BarberViewModelFactory(repository))[BarberViewModel::class.java]

        adapter = PostAdapter()
        binding.recyclerPosts.layoutManager = LinearLayoutManager(this)
        binding.recyclerPosts.adapter = adapter

        // Show create-post panel for barbers
        binding.createPostCard.visibility = View.VISIBLE
        binding.btnPost.setOnClickListener {
            val content = binding.etPostContent.text?.toString()?.trim() ?: ""
            if (content.isBlank()) {
                Toast.makeText(this, "Post content cannot be empty.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewModel.createPost(barberProfileId, content)
        }

        viewModel.createPostState.observe(this) { state ->
            when (state) {
                is UiState.Loading -> binding.btnPost.isEnabled = false
                is UiState.Success -> {
                    binding.btnPost.isEnabled = true
                    binding.etPostContent.text?.clear()
                    Toast.makeText(this, "Post published!", Toast.LENGTH_SHORT).show()
                    viewModel.resetCreatePostState()
                    viewModel.loadPosts() // refresh feed
                }
                is UiState.Error -> {
                    binding.btnPost.isEnabled = true
                    Toast.makeText(this, state.message, Toast.LENGTH_SHORT).show()
                    viewModel.resetCreatePostState()
                }
                else -> Unit
            }
        }

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
