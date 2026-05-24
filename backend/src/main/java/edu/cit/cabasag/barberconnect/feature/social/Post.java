package edu.cit.cabasag.barberconnect.feature.social;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Vertical Slice Architecture — Social Feature
 * Domain model for barber posts in the feed.
 */
@Data @NoArgsConstructor @AllArgsConstructor
public class Post {
    private String post_id;
    private String barber_profile_id;
    private String barberUserId;
    private String barberFullName;
    private String barberProfileImageUrl;
    private String barberShopName;
    private String content;
    private String imageUrl;
    private Integer likesCount = 0;
    private Integer commentsCount = 0;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> commentIds;
    private List<String> reactionIds;
}
