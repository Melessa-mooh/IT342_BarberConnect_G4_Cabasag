package edu.cit.cabasag.barberconnect.feature.social;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/** Vertical Slice Architecture — Social Feature: Comment on a barber post. */
@Data @NoArgsConstructor @AllArgsConstructor
public class Comment {
    private String comment_id;
    private String post_id;
    private String user_id;
    private String commenterName;
    private String profileImageUrl;
    private String content;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
