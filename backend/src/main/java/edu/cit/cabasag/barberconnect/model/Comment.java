package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    
    private String comment_id;
    private String post_id; // Reference to Post post_id
    private String user_id; // Reference to User user_id
    private String content;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}