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
                .isAvailable(barber.getIsAvailable())
                .build();
    }
}