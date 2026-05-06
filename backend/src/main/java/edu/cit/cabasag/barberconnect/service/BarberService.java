package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.feature.barber.BarberProfile;
import edu.cit.cabasag.barberconnect.feature.income.IncomeRecord;
import edu.cit.cabasag.barberconnect.feature.auth.User;
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
                try {
                    User user = document.toObject(User.class);
                    BarberProfile profile = user.getBarberProfile();

                    // Fallback: if embedded barberProfile is missing or has no ID,
                    // look it up in the barber_profiles collection
                    if (profile == null || profile.getBarber_profile_id() == null) {
                        String userId = document.getId();
                        var profileQuery = db.collection("barber_profiles")
                                .whereEqualTo("user_id", userId)
                                .get().get();
                        if (!profileQuery.isEmpty()) {
                            profile = profileQuery.getDocuments().get(0).toObject(BarberProfile.class);
                        }
                    }

                    if (profile != null && Boolean.TRUE.equals(profile.getIsAvailable())) {
                        barbers.add(mapToBarberResponse(profile, user));
                    }
                } catch (Exception e) {
                    // Log and skip barbers with deserialization issues
                    log.warn("Failed to deserialize barber profile for document {}: {}", document.getId(), e.getMessage());
                    // Try to fix the document by updating it
                    try {
                        fixBarberProfileTimestamps(db, document.getId());
                        log.info("Fixed timestamps for barber: {}", document.getId());
                    } catch (Exception fixError) {
                        log.error("Failed to fix timestamps for barber {}: {}", document.getId(), fixError.getMessage());
                    }
                }
            }
            
            return barbers;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error fetching available barbers: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Helper method to fix timestamp fields in existing barber profiles
     */
    @SuppressWarnings("null")
    private void fixBarberProfileTimestamps(Firestore db, String userId) throws ExecutionException, InterruptedException {
        var docRef = db.collection(USERS_COLLECTION).document(java.util.Objects.requireNonNullElse(userId, ""));
        var doc = docRef.get().get();
        
        if (!doc.exists()) return;
        
        var data = doc.getData();
        if (data == null) return;
        
        @SuppressWarnings("unchecked")
        var barberProfile = (java.util.Map<String, Object>) data.get("barberProfile");
        if (barberProfile == null) return;
        
        // Replace any HashMap timestamps with proper Date objects
        if (barberProfile.get("createdAt") instanceof java.util.Map) {
            barberProfile.put("createdAt", new java.util.Date());
        }
        if (barberProfile.get("updatedAt") instanceof java.util.Map) {
            barberProfile.put("updatedAt", new java.util.Date());
        }
        
        data.put("barberProfile", barberProfile);
        docRef.set(data).get();
    }
    
    public AuthResponse.BarberProfileResponse getBarberById(String id) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            // Strategy 1: look in the separate barber_profiles collection (admin-created barbers)
            var query = db.collection("barber_profiles")
                    .whereEqualTo("barber_profile_id", id)
                    .get()
                    .get();

            if (!query.isEmpty()) {
                BarberProfile profile = query.getDocuments().get(0).toObject(BarberProfile.class);
                String uid = profile.getUser_id();
                User userDoc = null;
                if (uid != null) {
                    var userSnap = db.collection(USERS_COLLECTION).document(uid).get().get();
                    if (userSnap.exists()) {
                        userDoc = userSnap.toObject(User.class);
                    }
                }
                return mapToBarberResponse(profile, userDoc);
            }

            // Strategy 2: look in users collection for embedded barberProfile
            // (self-registered barbers whose barberProfile.barber_profile_id == id)
            var usersQuery = db.collection(USERS_COLLECTION)
                    .whereEqualTo("role", "BARBER")
                    .get()
                    .get();

            for (var userDoc : usersQuery.getDocuments()) {
                try {
                    User user = userDoc.toObject(User.class);
                    BarberProfile profile = user.getBarberProfile();
                    if (profile != null && id.equals(profile.getBarber_profile_id())) {
                        return mapToBarberResponse(profile, user);
                    }
                    // Also check if the Firebase UID itself is used as the profile ID
                    if (profile != null && id.equals(user.getUser_id())) {
                        if (profile.getBarber_profile_id() == null) {
                            profile.setBarber_profile_id(user.getUser_id());
                        }
                        return mapToBarberResponse(profile, user);
                    }
                } catch (Exception e) {
                    log.warn("Skipping user doc {} during getBarberById fallback: {}", userDoc.getId(), e.getMessage());
                }
            }

            throw new RuntimeException("Barber profile not found for id: " + id);

        } catch (InterruptedException | ExecutionException e) {
            log.error("Error fetching barber by ID: {}", e.getMessage());
            throw new RuntimeException("Error fetching barber by ID", e);
        }
    }
    
    
    private AuthResponse.BarberProfileResponse mapToBarberResponse(BarberProfile barber, User user) {
        // Implemented using the Creational Builder Pattern
        return AuthResponse.BarberProfileResponse.builder()
                .id(barber.getBarber_profile_id())
                .firstName(user != null ? user.getFirstName() : "")
                .lastName(user != null ? user.getLastName() : "")
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
                profile.setCreatedAt(new java.util.Date());
                user.setBarberProfile(profile);
            }
            
            // 3. Map request data - Use Date for compatibility
            profile.setBio(request.getBio());
            profile.setYearsExperience(request.getExperience());
            profile.setGcashNumber(request.getGcash());
            profile.setUpdatedAt(new java.util.Date());
            user.setUpdatedAt(new java.util.Date());
            
            // 4. Update the Firestore User document (which contains the nested profile structure)
            db.collection(USERS_COLLECTION)
              .document(java.util.Objects.requireNonNull(userId))
              .set(user) 
              .get();
              
            // Also sync to the separate barber_profiles collection
            try {
                var profileQuery = db.collection("barber_profiles")
                        .whereEqualTo("user_id", userId)
                        .get().get();
                if (!profileQuery.isEmpty()) {
                    String profileDocId = profileQuery.getDocuments().get(0).getId();
                    java.util.Map<String, Object> profileUpdate = new java.util.HashMap<>();
                    profileUpdate.put("bio", request.getBio());
                    profileUpdate.put("yearsExperience", request.getExperience());
                    profileUpdate.put("gcashNumber", request.getGcash());
                    profileUpdate.put("updatedAt", new java.util.Date().toString());
                    if (request.getIsAvailable() != null) {
                        profileUpdate.put("isAvailable", request.getIsAvailable());
                    }
                    db.collection("barber_profiles").document(profileDocId)
                      .update(profileUpdate).get();
                    log.info("Synced barber_profiles doc {} for user {}", profileDocId, userId);
                }
            } catch (Exception syncEx) {
                log.warn("Could not sync barber_profiles for user {}: {}", userId, syncEx.getMessage());
            }
              
            log.info("Successfully updated barber profile for user: {}", userId);
            return mapToBarberResponse(profile, user);
            
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to update Barber Profile in Firestore", e);
            throw new RuntimeException("DB Error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error updating barber profile", e);
            throw new RuntimeException("Failed to update profile: " + e.getMessage(), e);
        }
    }

    public List<IncomeRecord> getIncomeRecords(String barberProfileId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            var query = db.collection("income_records")
                    .whereEqualTo("barber_profile_id", barberProfileId)
                    .get()
                    .get();

            List<IncomeRecord> records = new ArrayList<>();
            for (QueryDocumentSnapshot doc : query.getDocuments()) {
                records.add(doc.toObject(IncomeRecord.class));
            }
            
            // Sort in memory by recordedAt DESCENDING
            records.sort((a, b) -> {
                if (a.getRecordedAt() == null && b.getRecordedAt() == null) return 0;
                if (a.getRecordedAt() == null) return 1;
                if (b.getRecordedAt() == null) return -1;
                return b.getRecordedAt().compareTo(a.getRecordedAt());
            });
            
            return records;

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to fetch income records for barber {}: {}", barberProfileId, e.getMessage());
            throw new RuntimeException("Failed to fetch income records", e);
        }
    }

    public List<String> getApprovedLeaveDates(String barberProfileId) {
        try {
            Firestore db = firebaseService.getFirestore();

            var snap = db.collection("leave_requests")
                    .whereEqualTo("barberProfileId", barberProfileId)
                    .get().get();

            List<String> dates = new ArrayList<>();
            for (var doc : snap.getDocuments()) {
                String status = doc.getString("status");
                String date = doc.getString("requestedDate");
                if ("APPROVED".equals(status) && date != null) {
                    dates.add(date);
                }
            }
            return dates;
        } catch (Exception e) {
            log.error("Failed to get approved leave dates: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}