package edu.cit.cabasag.barberconnect.model

import com.google.gson.annotations.SerializedName

data class Comment(
    @SerializedName("comment_id") val commentId: String? = null,
    @SerializedName("post_id") val postId: String? = null,
    @SerializedName("user_id") val userId: String? = null,
    val content: String? = null,
    val isActive: Boolean? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val commenterName: String? = null,
    val profileImageUrl: String? = null
)
