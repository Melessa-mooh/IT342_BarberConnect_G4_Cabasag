package edu.cit.cabasag.barberconnect.feature.social;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/** Vertical Slice Architecture — Social Feature: Customer feedback/rating for a barber appointment. */
@Data @NoArgsConstructor @AllArgsConstructor
public class Feedback {
    private String feedback_id;
    private String appointment_id;
    private String customer_id;
    private String barber_profile_id;
    private Integer rating; // 1-5 stars
    private String comment;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
}
