package edu.cit.cabasag.barberconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    
    @NotBlank(message = "First name is required")
    @Size(min = 2, message = "First name must be at least 2 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(min = 2, message = "Last name must be at least 2 characters")
    private String lastName;
    
    private String phoneNumber; // Optional
    
    // Barber-specific fields (optional)
    private String bio;
    private Integer yearsExperience;
    private Boolean isAvailable;
}