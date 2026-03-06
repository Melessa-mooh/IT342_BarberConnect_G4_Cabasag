package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    
    private String post_id;
    private String barber_profile_id; // Reference to BarberProfile barber_profile_id
    private String content;
    private String imageUrl;
    private Integer likesCount = 0;
    private Integer commentsCount = 0;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // References to related data
    private List<String> commentIds; // References to Comment comment_ids
    private List<String> reactionIds; // References to Reaction reaction_ids
}