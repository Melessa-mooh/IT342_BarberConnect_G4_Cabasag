package edu.cit.cabasag.barberconnect.ui.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.cit.cabasag.barberconnect.databinding.ItemPostBinding
import edu.cit.cabasag.barberconnect.model.Post
import java.text.SimpleDateFormat
import java.util.Locale

class PostAdapter(
    private val onCommentsClick: (Post) -> Unit = {},
    private val onLikeClick: (Post) -> Unit = {}
) : ListAdapter<Post, PostAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val b: ItemPostBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(post: Post) {
            val barberId = post.barberProfileId ?: "Barber"
            b.tvPostAvatar.text = barberId.firstOrNull()?.uppercaseChar()?.toString() ?: "B"
            b.tvPostBarber.text = "Barber ...${barberId.takeLast(6)}"
            b.tvPostContent.text = post.content.orEmpty()
            b.tvPostLikes.text = "Like ${post.likesCount ?: 0}"
            b.tvPostComments.text = "Comments ${post.commentsCount ?: 0}"
            b.tvPostLikes.setOnClickListener { onLikeClick(post) }
            b.tvPostComments.setOnClickListener { onCommentsClick(post) }

            if (!post.imageUrl.isNullOrBlank()) {
                b.ivPostImage.visibility = View.GONE
            } else {
                b.ivPostImage.visibility = View.GONE
            }

            val rawDate = post.createdAt.orEmpty()
            b.tvPostDate.text = try {
                val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                val parsed = sdf.parse(rawDate.take(19))
                if (parsed != null) {
                    SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(parsed)
                } else {
                    rawDate
                }
            } catch (_: Exception) {
                rawDate
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) = ViewHolder(
        ItemPostBinding.inflate(LayoutInflater.from(parent.context), parent, false)
    )

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<Post>() {
            override fun areItemsTheSame(a: Post, b: Post) = a.postId == b.postId
            override fun areContentsTheSame(a: Post, b: Post) = a == b
        }
    }
}
