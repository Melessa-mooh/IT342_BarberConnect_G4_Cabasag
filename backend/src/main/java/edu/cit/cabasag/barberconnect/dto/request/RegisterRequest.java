package edu.cit.cabasag.barberconnect.dto.request;

import edu.cit.cabasag.barberconnect.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Firebase UID is required")
    private String firebaseUid;
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(\\+63|0)?[9][0-9]{9}$", message = "Invalid Philippine phone number format. Use format: +639XXXXXXXXX or 09XXXXXXXXX")
    private String phoneNumber;
    
    @NotNull(message = "User role is required")
    private User.UserRole role;
    
    // Barber-specific fields (optional, only for barber registration)
    private String bio;
    private Integer yearsExperience;
}