package edu.cit.cabasag.barberconnect.ui.barber

import android.net.Uri
import android.os.Bundle
import android.graphics.Color
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import edu.cit.cabasag.barberconnect.BarberConnectApp
import edu.cit.cabasag.barberconnect.databinding.ActivityBarberFeedBinding
import edu.cit.cabasag.barberconnect.model.Comment
import edu.cit.cabasag.barberconnect.model.Post
import edu.cit.cabasag.barberconnect.repository.BarberRepository
import edu.cit.cabasag.barberconnect.ui.adapter.PostAdapter
import edu.cit.cabasag.barberconnect.util.TokenManager
import edu.cit.cabasag.barberconnect.util.UiState
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModel
import edu.cit.cabasag.barberconnect.viewmodel.BarberViewModelFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class BarberFeedActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBarberFeedBinding
    private lateinit var viewModel: BarberViewModel
    private lateinit var adapter: PostAdapter
    private lateinit var repository: BarberRepository
    private var currentUserId: String? = null
    private var selectedPostImageUri: Uri? = null

    private val postImagePicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        selectedPostImageUri = uri
        binding.ivSelectedPostImage.visibility = if (uri != null) View.VISIBLE else View.GONE
        binding.btnRemovePostImage.visibility = if (uri != null) View.VISIBLE else View.GONE
        if (uri != null) binding.ivSelectedPostImage.setImageURI(uri)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBarberFeedBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val barberProfileId = intent.getStringExtra("barberProfileId") ?: ""
        BarberMobileNav.setup(
            activity = this,
            activeItem = "Social Feed",
            barberProfileId = barberProfileId,
            menuButton = binding.btnMenu,
            overlay = binding.drawerOverlay,
            drawer = binding.drawerPanel,
            closeButton = binding.btnCloseDrawer,
            items = listOf(
                binding.drawerItem1,
                binding.drawerItem2,
                binding.drawerItem3,
                binding.drawerItem4,
                binding.drawerItem5,
                binding.drawerItem6,
                binding.drawerItem7
            ),
            logoutButton = binding.btnLogout
        )

        val api = (application as BarberConnectApp).retrofitClient.apiService
        repository = BarberRepository(api)
        viewModel = ViewModelProvider(this, BarberViewModelFactory(repository))[BarberViewModel::class.java]

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

        // Show create-post panel for barbers
        binding.createPostCard.visibility = View.VISIBLE
        binding.btnChoosePostImage.setOnClickListener { postImagePicker.launch("image/*") }
        binding.btnRemovePostImage.setOnClickListener {
            selectedPostImageUri = null
            binding.ivSelectedPostImage.setImageDrawable(null)
            binding.ivSelectedPostImage.visibility = View.GONE
            binding.btnRemovePostImage.visibility = View.GONE
        }
        binding.btnPost.setOnClickListener {
            val content = binding.etPostContent.text?.toString()?.trim() ?: ""
            if (barberProfileId.isBlank()) {
                Toast.makeText(this, "Barber profile not loaded. Refresh your profile and try again.", Toast.LENGTH_LONG).show()
                return@setOnClickListener
            }
            if (content.isBlank() && selectedPostImageUri == null) {
                Toast.makeText(this, "Add a caption or choose an image.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewModel.createPost(barberProfileId, content, selectedPostImageUri?.toMultipartPart("file", "post"))
        }

        viewModel.createPostState.observe(this) { state ->
            when (state) {
                is UiState.Loading -> binding.btnPost.isEnabled = false
                is UiState.Success -> {
                    binding.btnPost.isEnabled = true
                    binding.etPostContent.text?.clear()
                    selectedPostImageUri = null
                    binding.ivSelectedPostImage.setImageDrawable(null)
                    binding.ivSelectedPostImage.visibility = View.GONE
                    binding.btnRemovePostImage.visibility = View.GONE
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
                    binding.tvError.visibility = if (state.data.isEmpty()) View.VISIBLE else View.GONE
                    binding.tvError.text = if (state.data.isEmpty()) "No posts yet. Share the first update." else ""
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
            setPadding(40, 24, 40, 8)
            setBackgroundColor(Color.WHITE)
        }
        val commentsBox = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        val commentsScroll = ScrollView(this).apply {
            addView(commentsBox)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                resources.displayMetrics.density.times(220).toInt()
            ).apply { setMargins(0, 0, 0, 16) }
        }
        val input = EditText(this).apply {
            hint = "Write a comment"
            minLines = 1
            maxLines = 3
            setTextColor(Color.parseColor("#111827"))
            setHintTextColor(Color.parseColor("#6B7280"))
            backgroundTintList = android.content.res.ColorStateList.valueOf(Color.parseColor("#9CA3AF"))
        }
        container.addView(commentsScroll)
        container.addView(input)
        renderComments(emptyList(), commentsBox, "Loading comments...")

        val dialog = AlertDialog.Builder(this)
            .setTitle("Comments")
            .setView(container)
            .setNegativeButton("Close", null)
            .setPositiveButton("Post", null)
            .create()

        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(Color.parseColor("#F97316"))
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(Color.parseColor("#6B7280"))
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
                            loadDialogComments(postId, commentsBox)
                            viewModel.loadPosts()
                        },
                        onFailure = { Toast.makeText(this@BarberFeedActivity, it.message, Toast.LENGTH_LONG).show() }
                    )
                }
            }
            loadDialogComments(postId, commentsBox)
        }
        dialog.show()
    }

    private fun loadDialogComments(postId: String, commentsBox: LinearLayout) {
        lifecycleScope.launch {
            repository.getComments(postId).fold(
                onSuccess = { comments -> renderComments(comments, commentsBox) },
                onFailure = { renderComments(emptyList(), commentsBox, it.message ?: "Failed to load comments") }
            )
        }
    }

    private fun renderComments(
        comments: List<Comment>,
        commentsBox: LinearLayout,
        emptyMessage: String = "No comments yet. Be the first."
    ) {
        commentsBox.removeAllViews()
        if (comments.isEmpty()) {
            commentsBox.addView(commentText(emptyMessage, muted = true))
            return
        }
        comments.forEach { comment ->
            val user = comment.commenterName?.takeIf { name -> name.isNotBlank() } ?: "User"
            val date = comment.createdAt?.takeIf { created -> created.isNotBlank() }?.let { created -> "\n$created" }.orEmpty()
            commentsBox.addView(commentText("$user$date\n${comment.content.orEmpty()}"))
        }
    }

    private fun commentText(text: String, muted: Boolean = false): TextView = TextView(this).apply {
        this.text = text
        setTextColor(Color.parseColor(if (muted) "#6B7280" else "#111827"))
        textSize = 14f
        setPadding(0, 0, 0, 16)
    }

    private fun Uri.toMultipartPart(fieldName: String, prefix: String): MultipartBody.Part? {
        val cacheFile = File(cacheDir, "$prefix-upload-${System.currentTimeMillis()}.jpg")
        return try {
            contentResolver.openInputStream(this)?.use { input ->
                cacheFile.outputStream().use { output -> input.copyTo(output) }
            } ?: return null
            val body = cacheFile.asRequestBody("image/*".toMediaTypeOrNull())
            MultipartBody.Part.createFormData(fieldName, cacheFile.name, body)
        } catch (_: Exception) {
            null
        }
    }
}
