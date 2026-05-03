package edu.cit.cabasag.barberconnect.feature.social;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/** Vertical Slice Architecture — Social Feature: Emoji reaction to a post. */
@Data @NoArgsConstructor @AllArgsConstructor
public class Reaction {
    private String reaction_id;
    private String post_id;
    private String user_id;
    private ReactionType type;
    private LocalDateTime createdAt;

    public enum ReactionType { LIKE, LOVE, FIRE, CLAP }
}
