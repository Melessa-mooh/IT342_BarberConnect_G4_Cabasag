package edu.cit.cabasag.barberconnect.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    private String user_id; // Firebase UID as primary key
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber; // Philippine format: +63 900 000 0000
    private UserRole role;
    private String profileImageUrl;
    private Boolean isActive = true;
    private Date createdAt;
    private Date updatedAt;
    
    // Reference to barber profile (if user is a barber)
    private BarberProfile barberProfile;
    
    public enum UserRole {
        CUSTOMER, BARBER, ADMIN
    }
}