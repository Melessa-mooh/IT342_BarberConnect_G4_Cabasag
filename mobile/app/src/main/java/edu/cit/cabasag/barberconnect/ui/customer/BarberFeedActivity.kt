package edu.cit.cabasag.barberconnect.ui.customer

import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityBarberFeedBinding
import edu.cit.cabasag.barberconnect.model.Comment
import edu.cit.cabasag.barberconnect.model.Post
import edu.cit.cabasag.barberconnect.repository.CustomerRepository
import edu.cit.cabasag.barberconnect.ui.adapter.PostAdapter
import edu.cit.cabasag.barberconnect.util.TokenManager
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModel
import edu.cit.cabasag.barberconnect.viewmodel.CustomerViewModelFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

class BarberFeedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBarberFeedBinding
    private lateinit var viewModel: CustomerViewModel
    private lateinit var adapter: PostAdapter
    private lateinit var repository: CustomerRepository
    private var currentUserId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBarberFeedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val api = (application as BarberConnectApp).retrofitClient.apiService
        repository = CustomerRepository(api)
        viewModel = ViewModelProvider(this, CustomerViewModelFactory(repository))[CustomerViewModel::class.java]

        lifecycleScope.launch {
            currentUserId = TokenManager(this@BarberFeedActivity).getUser().first()?.resolvedUserId
        }

        adapter = PostAdapter(
            onCommentsClick = { showCommentsDialog(it) },
            onLikeClick = { post ->
                val uid = currentUserId
                if (uid.isNullOrBlank()) {
                    Toast.makeText(this, "Please sign in again.", Toast.LENGTH_SHORT).show()
                } else {
                    viewModel.addReaction(post.postId.orEmpty(), uid)
                }
            }
        )
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
                    binding.tvError.visibility = if (state.data.isEmpty()) View.VISIBLE else View.GONE
                    binding.tvError.text = if (state.data.isEmpty()) "No posts yet. Check back soon!" else ""
                }
                is UiState.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.tvError.visibility     = View.VISIBLE
                    binding.tvError.text           = state.message
                }
                else -> Unit
            }
        }

        viewModel.reactionState.observe(this) { state ->
            when (state) {
                is UiState.Success -> {
                    Toast.makeText(this, "Reaction saved.", Toast.LENGTH_SHORT).show()
                    viewModel.resetReactionState()
                    viewModel.loadPosts()
                }
                is UiState.Error -> {
                    Toast.makeText(this, state.message, Toast.LENGTH_SHORT).show()
                    viewModel.resetReactionState()
                }
                else -> Unit
            }
        }

        viewModel.loadPosts()
    }

    private fun showCommentsDialog(post: Post) {
        val postId = post.postId ?: return
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(40, 20, 40, 0)
        }
        val status = TextView(this).apply { text = "Loading comments..." }
        val input = EditText(this).apply {
            hint = "Write a comment"
            minLines = 1
            maxLines = 3
        }
        container.addView(status)
        container.addView(input)

        val dialog = AlertDialog.Builder(this)
            .setTitle("Comments")
            .setView(container)
            .setNegativeButton("Close", null)
            .setPositiveButton("Post", null)
            .create()

        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val uid = currentUserId
                val content = input.text?.toString()?.trim().orEmpty()
                if (uid.isNullOrBlank()) {
                    Toast.makeText(this, "Please sign in again.", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
                if (content.isBlank()) {
                    input.error = "Comment cannot be empty"
                    return@setOnClickListener
                }
                lifecycleScope.launch {
                    repository.addComment(postId, uid, content).fold(
                        onSuccess = {
                            Toast.makeText(this@BarberFeedActivity, "Comment added.", Toast.LENGTH_SHORT).show()
                            input.text?.clear()
                            loadDialogComments(postId, status)
                            viewModel.loadPosts()
                        },
                        onFailure = { Toast.makeText(this@BarberFeedActivity, it.message, Toast.LENGTH_LONG).show() }
                    )
                }
            }
            loadDialogComments(postId, status)
        }
        dialog.show()
    }

    private fun loadDialogComments(postId: String, status: TextView) {
        lifecycleScope.launch {
            repository.getComments(postId).fold(
                onSuccess = { comments -> status.text = formatComments(comments) },
                onFailure = { status.text = it.message ?: "Failed to load comments" }
            )
        }
    }

    private fun formatComments(comments: List<Comment>): String {
        if (comments.isEmpty()) return "No comments yet. Be the first."
        return comments.joinToString(separator = "\n\n") {
            val user = it.commenterName?.takeIf { name -> name.isNotBlank() } ?: "User"
            "$user: ${it.content.orEmpty()}"
        }
    }
}
