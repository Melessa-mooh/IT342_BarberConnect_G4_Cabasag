package edu.cit.cabasag.barberconnect.feature.catalog;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

/**
 * Vertical Slice Architecture — Catalog Feature
 * Domain model representing an add-on option for a haircut style.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StyleOption {

    private String style_option_id;
    private String haircut_style_id;
    private String name;
    private String description;
    private BigDecimal additionalPrice;
    private Integer additionalTimeMinutes;
    private Boolean isActive = true;
}
