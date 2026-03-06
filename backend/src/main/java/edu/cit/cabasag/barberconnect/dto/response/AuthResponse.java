package edu.cit.cabasag.barberconnect.dto.response;

import edu.cit.cabasag.barberconnect.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    private String firebaseUid;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private User.UserRole role;
    private boolean isActive;
    private BarberProfileResponse barberProfile;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BarberProfileResponse {
        private String id;
        private String bio;
        private Integer yearsExperience;
        private String rating;
        private Integer totalReviews;
        private String profileImageUrl;
        private Boolean isAvailable;
    }
}