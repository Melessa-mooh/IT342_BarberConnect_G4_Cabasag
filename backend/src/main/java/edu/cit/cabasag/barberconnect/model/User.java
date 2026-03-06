package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    private String user_id; // Firebase UID as primary key
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber; // Philippine format: +63 9XX XXX XXXX
    private UserRole role;
    private Boolean isActive = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Reference to barber profile (if user is a barber)
    private BarberProfile barberProfile;
    
    public enum UserRole {
        CUSTOMER, BARBER, ADMIN
    }
}