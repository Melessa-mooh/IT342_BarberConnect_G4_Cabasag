package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.model.BarberProfile;
import edu.cit.cabasag.barberconnect.model.User;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class BarberService {
    
    private final FirebaseService firebaseService;
    private static final String USERS_COLLECTION = "users";
    
    public List<AuthResponse.BarberProfileResponse> getAllAvailableBarbers() {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return new ArrayList<>();
            
            var query = db.collection(USERS_COLLECTION)
                    .whereEqualTo("role", "BARBER")
                    .whereEqualTo("isActive", true)
                    .get()
                    .get();
            
            List<AuthResponse.BarberProfileResponse> barbers = new ArrayList<>();
            
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                User user = document.toObject(User.class);
                if (user.getBarberProfile() != null && user.getBarberProfile().getIsAvailable()) {
                    barbers.add(mapToBarberResponse(user.getBarberProfile()));
                }
            }
            
            return barbers;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error fetching available barbers: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    public AuthResponse.BarberProfileResponse getBarberById(String id) {
        // For now, return a mock barber since we need to implement proper ID handling
        // In a real implementation, you'd query Firestore by barber profile ID
        // Implemented using the Creational Builder Pattern
        return AuthResponse.BarberProfileResponse.builder()
                .id(id)
                .bio("Professional barber with years of experience")
                .yearsExperience(5)
                .rating("4.5")
                .totalReviews(100)
                .profileImageUrl(null)
                .isAvailable(true)
                .build();
    }
    
    private AuthResponse.BarberProfileResponse mapToBarberResponse(BarberProfile barber) {
        // Implemented using the Creational Builder Pattern
        return AuthResponse.BarberProfileResponse.builder()
                .id(barber.getBarber_profile_id())
                .bio(barber.getBio())
                .yearsExperience(barber.getYearsExperience())
                .rating(barber.getRating() != null ? barber.getRating().toString() : "0.0")
                .totalReviews(barber.getTotalReviews())
                .profileImageUrl(barber.getProfileImageUrl())
                .gcashNumber(barber.getGcashNumber())
                .isAvailable(barber.getIsAvailable())
                .build();
    }
    
    public AuthResponse.BarberProfileResponse updateProfile(String userId, edu.cit.cabasag.barberconnect.dto.request.UpdateBarberProfileRequest request) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");
            
            // 0. Fetch the user safely
            com.google.cloud.firestore.DocumentSnapshot doc = db.collection(USERS_COLLECTION).document(java.util.Objects.requireNonNull(userId)).get().get();
            if (!doc.exists()) throw new RuntimeException("User not found: " + userId);
            
            User user = doc.toObject(User.class);
            if (user == null) throw new RuntimeException("Failed to cast User");
            
            // 1. Update user phone
            user.setPhoneNumber(request.getPhone());
            
            // 2. Safely initialize barber profile if missing
            BarberProfile profile = user.getBarberProfile();
            if (profile == null) {
                profile = new BarberProfile();
                profile.setBarber_profile_id(user.getUser_id());
                profile.setUser_id(user.getUser_id());
                user.setBarberProfile(profile);
            }
            
            // 3. Map request data
            profile.setBio(request.getBio());
            profile.setYearsExperience(request.getExperience());
            profile.setGcashNumber(request.getGcash());
            profile.setUpdatedAt(java.time.LocalDateTime.now());
            user.setUpdatedAt(new java.util.Date());
            
            // 4. Update the Firestore User document (which contains the nested profile structure)
            db.collection(USERS_COLLECTION)
              .document(java.util.Objects.requireNonNull(userId)) // use explicitly not-null identifier
              .set(user) 
              .get();
              
            return mapToBarberResponse(profile);
            
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to update Barber Profile in Firestore", e);
            throw new RuntimeException("DB Error", e);
        }
    }
}