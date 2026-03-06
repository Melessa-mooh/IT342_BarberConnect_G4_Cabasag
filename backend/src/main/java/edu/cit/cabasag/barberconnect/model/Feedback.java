package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    
    private String feedback_id;
    private String appointment_id; // Reference to Appointment appointment_id
    private String customer_id; // Reference to User user_id
    private String barber_profile_id; // Reference to BarberProfile barber_profile_id
    private Integer rating; // 1-5 stars
    private String comment;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
}