package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StyleOption {
    
    private String style_option_id;
    private String haircut_style_id; // Reference to HaircutStyle haircut_style_id
    private String name; // e.g., "Beard Trim", "Hot Towel Shave", "Hair Coloring"
    private String description;
    private BigDecimal additionalPrice;
    private Integer additionalTimeMinutes = 0;
    private Boolean isActive = true;
}