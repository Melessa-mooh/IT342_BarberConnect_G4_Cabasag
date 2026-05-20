package edu.cit.cabasag.barberconnect.feature.catalog;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * Vertical Slice Architecture — Catalog Feature
 * Domain model representing a haircut service offered by a barber.
 *
 * Note: createdAt/updatedAt stored as Object to handle both String and
 * Date/Timestamp formats that may exist in Firestore from different code versions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class HaircutStyle {

    private String haircut_style_id;
    private String barber_profile_id;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private Integer durationMinutes;
    private String imageUrl;
    private Boolean isActive = true;
    private Object createdAt;   // flexible: String or Date/Timestamp
    private Object updatedAt;   // flexible: String or Date/Timestamp
    private List<String> styleOptionIds;
}
