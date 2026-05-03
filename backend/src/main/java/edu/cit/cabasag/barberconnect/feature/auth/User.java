package edu.cit.cabasag.barberconnect.feature.auth;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Date;

/**
 * Vertical Slice Architecture — Auth Feature
 * Domain model representing a registered user of the BarberConnect platform.
 */
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
    private edu.cit.cabasag.barberconnect.feature.barber.BarberProfile barberProfile;

    public enum UserRole {
        CUSTOMER, BARBER, ADMIN
    }
}
