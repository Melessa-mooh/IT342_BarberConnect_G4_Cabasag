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
        AuthResponse.BarberProfileResponse barber = new AuthResponse.BarberProfileResponse();
        barber.setId(id);
        barber.setBio("Professional barber with years of experience");
        barber.setYearsExperience(5);
        barber.setRating("4.5");
        barber.setTotalReviews(100);
        barber.setProfileImageUrl(null);
        barber.setIsAvailable(true);
        
        return barber;
    }
    
    private AuthResponse.BarberProfileResponse mapToBarberResponse(BarberProfile barber) {
        AuthResponse.BarberProfileResponse response = new AuthResponse.BarberProfileResponse();
        response.setId(barber.getBarber_profile_id());
        response.setBio(barber.getBio());
        response.setYearsExperience(barber.getYearsExperience());
        response.setRating(barber.getRating().toString());
        response.setTotalReviews(barber.getTotalReviews());
        response.setProfileImageUrl(barber.getProfileImageUrl());
        response.setIsAvailable(barber.getIsAvailable());
        
        return response;
    }
}