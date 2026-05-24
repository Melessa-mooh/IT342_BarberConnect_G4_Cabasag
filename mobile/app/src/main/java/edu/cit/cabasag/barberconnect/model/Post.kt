package edu.cit.cabasag.barberconnect.model

import com.google.gson.annotations.SerializedName

data class Post(
    @SerializedName("post_id") val postId: String? = null,
    @SerializedName("barber_profile_id") val barberProfileId: String? = null,
    @SerializedName(value = "user_id", alternate = ["barberUserId", "barber_user_id"]) val userId: String? = null,
    @SerializedName(value = "barberFullName", alternate = ["barber_full_name", "barberName", "barber_name"]) val barberFullName: String? = null,
    @SerializedName(value = "barberProfileImageUrl", alternate = ["barber_profile_image_url"]) val barberProfileImageUrl: String? = null,
    @SerializedName(value = "barberShopName", alternate = ["barber_shop_name", "shopName"]) val barberShopName: String? = null,
    val content: String? = null,
    @SerializedName(value = "imageUrl", alternate = ["image_url"]) val imageUrl: String? = null,
    @SerializedName(value = "likesCount", alternate = ["likes_count"]) val likesCount: Int? = null,
    @SerializedName(value = "commentsCount", alternate = ["comments_count"]) val commentsCount: Int? = null,
    @SerializedName(value = "isActive", alternate = ["is_active"]) val isActive: Boolean? = null,
    @SerializedName(value = "createdAt", alternate = ["created_at"]) val createdAt: String? = null,
    @SerializedName(value = "updatedAt", alternate = ["updated_at"]) val updatedAt: String? = null
)
