package edu.cit.cabasag.barberconnect.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import edu.cit.cabasag.barberconnect.databinding.ItemPostBinding
import edu.cit.cabasag.barberconnect.model.Post
import java.text.SimpleDateFormat
import java.util.*

class PostAdapter : ListAdapter<Post, PostAdapter.ViewHolder>(DIFF) {

    inner class ViewHolder(private val b: ItemPostBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(post: Post) {
            val barberId = post.barberProfileId ?: "Barber"
            b.tvPostAvatar.text  = barberId.firstOrNull()?.uppercaseChar()?.toString() ?: "B"
            b.tvPostBarber.text  = "Barber ···${barberId.takeLast(6)}"
            b.tvPostContent.text = post.content ?: ""
            b.tvPostLikes.text   = "❤ ${post.likesCount ?: 0}"
            b.tvPostComments.text = "💬 ${post.commentsCount ?: 0}"

            // Format date
            val rawDate = post.createdAt ?: ""
            b.tvPostDate.text = try {
                val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                val d = sdf.parse(rawDate.take(19))
                if (d != null) SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(d)
                else rawDate
            } catch (_: Exception) { rawDate }
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
