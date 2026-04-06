package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BarberProfile {
    
    private String barber_profile_id;
    private String user_id; // Reference to User user_id
    private String bio;
    private Integer yearsExperience;
    private BigDecimal rating = BigDecimal.ZERO;
    private Integer totalReviews = 0;
    private String profileImageUrl;
    private Boolean isAvailable = true;
    private String gcashNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // References to related data
    private List<HaircutStyle> haircutStyles;
    private List<Appointment> appointments;
    private List<Post> posts;
}