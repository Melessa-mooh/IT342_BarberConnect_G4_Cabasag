package edu.cit.cabasag.barberconnect.model

import com.google.gson.annotations.SerializedName

data class Post(
    @SerializedName("post_id")           val postId: String? = null,
    @SerializedName("barber_profile_id") val barberProfileId: String? = null,
    @SerializedName("user_id")           val userId: String? = null,
    val content: String? = null,
    val imageUrl: String? = null,
    val likesCount: Int? = null,
    val commentsCount: Int? = null,
    val isActive: Boolean? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)
