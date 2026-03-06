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
public class HaircutStyle {
    
    private String haircut_style_id;
    private String barber_profile_id; // Reference to BarberProfile barber_profile_id
    private String name;
    private String description;
    private BigDecimal basePrice;
    private Integer durationMinutes;
    private String imageUrl;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // References to related data
    private List<String> styleOptionIds; // References to StyleOption style_option_ids
}