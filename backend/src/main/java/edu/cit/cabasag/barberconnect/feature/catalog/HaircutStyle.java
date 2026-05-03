package edu.cit.cabasag.barberconnect.feature.catalog;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Vertical Slice Architecture — Catalog Feature
 * Domain model representing a haircut service offered by a barber.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HaircutStyle {

    private String haircut_style_id;
    private String barber_profile_id;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private Integer durationMinutes;
    private String imageUrl;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> styleOptionIds;
}
