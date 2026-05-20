package edu.cit.cabasag.barberconnect.model

import com.google.gson.annotations.SerializedName

data class Post(
    @SerializedName("post_id")           val postId: String? = null,
    @SerializedName("barber_profile_id") val barberProfileId: String? = null,
    val content: String? = null,
    val imageUrl: String? = null,
    val likesCount: Int? = null,
    val commentsCount: Int? = null,
    val createdAt: String? = null
)
