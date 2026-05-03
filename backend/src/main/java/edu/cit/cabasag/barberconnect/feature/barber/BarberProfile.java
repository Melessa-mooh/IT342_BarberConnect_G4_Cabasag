package edu.cit.cabasag.barberconnect.feature.barber;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Vertical Slice Architecture — Barber Feature
 * Domain model representing a barber's professional profile.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BarberProfile {

    private String barber_profile_id;
    private String user_id;
    private String bio;
    private Integer yearsExperience;
    private BigDecimal rating = BigDecimal.ZERO;
    private Integer totalReviews = 0;
    private String profileImageUrl;
    private Boolean isAvailable = true;
    private String gcashNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<edu.cit.cabasag.barberconnect.feature.catalog.HaircutStyle> haircutStyles;
    private List<edu.cit.cabasag.barberconnect.feature.appointment.Appointment> appointments;
    private List<edu.cit.cabasag.barberconnect.feature.social.Post> posts;
}
