package edu.cit.cabasag.barberconnect.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    
    private String firstName;
    private String lastName;
    
    @Pattern(regexp = "^(\\+63|0)?[9][0-9]{9}$", message = "Invalid Philippine phone number format")
    private String phoneNumber;
    
    // Barber-specific fields
    private String bio;
    private Integer yearsExperience;
    private String profileImageUrl;
    private Boolean isAvailable;
}