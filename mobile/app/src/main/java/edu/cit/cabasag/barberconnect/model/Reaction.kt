package edu.cit.cabasag.barberconnect.model

import com.google.gson.annotations.SerializedName

data class Reaction(
    @SerializedName("reaction_id") val reactionId: String? = null,
    @SerializedName("post_id") val postId: String? = null,
    @SerializedName("user_id") val userId: String? = null,
    val type: String? = null,
    val createdAt: String? = null
)
