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
import java.util.UUID;
import java.util.concurrent.ExecutionException;

/**
 * Canonical barber profile location: the "barber_profiles" Firestore collection.
 *
 * Migration note: self-registered barbers previously had their profile embedded
 * inside the "users" document. The migrateEmbeddedProfiles() method (called once
 * via the admin migration endpoint) copies any such embedded profiles into the
 * canonical collection and removes the embedded copy.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BarberService {

    private final FirebaseService firebaseService;
    private static final String USERS_COLLECTION        = "users";
    private static final String PROFILES_COLLECTION     = "barber_profiles";

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    public List<AuthResponse.BarberProfileResponse> getAllAvailableBarbers() {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return new ArrayList<>();

            // Single source of truth: barber_profiles collection
            var profilesSnap = db.collection(PROFILES_COLLECTION)
                    .whereEqualTo("isAvailable", true)
                    .get().get();

            List<AuthResponse.BarberProfileResponse> barbers = new ArrayList<>();
            for (QueryDocumentSnapshot profileDoc : profilesSnap.getDocuments()) {
                try {
                    BarberProfile profile = profileDoc.toObject(BarberProfile.class);
                    if (profile == null) continue;

                    // Fetch the associated user for name fields
                    User user = null;
                    String uid = profile.getUser_id();
                    if (uid != null) {
                        var userSnap = db.collection(USERS_COLLECTION).document(uid).get().get();
                        if (userSnap.exists()) {
                            user = userSnap.toObject(User.class);
                            // Skip inactive users
                            if (user != null && Boolean.FALSE.equals(user.getIsActive())) continue;
                        }
                    }
                    barbers.add(mapToBarberResponse(profile, user));
                } catch (Exception e) {
                    log.warn("Skipping barber profile doc {}: {}", profileDoc.getId(), e.getMessage());
                }
            }
            return barbers;

        } catch (InterruptedException | ExecutionException e) {
            log.error("Error fetching available barbers: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Looks up a barber profile by its barber_profile_id from the canonical
     * barber_profiles collection only. No multi-strategy fallback needed.
     */
    public AuthResponse.BarberProfileResponse getBarberById(String id) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            var snap = db.collection(PROFILES_COLLECTION)
                    .whereEqualTo("barber_profile_id", id)
                    .limit(1)
                    .get().get();

            if (snap.isEmpty()) {
                throw new RuntimeException("Barber profile not found for id: " + id);
            }

            BarberProfile profile = snap.getDocuments().get(0).toObject(BarberProfile.class);
            if (profile == null) throw new RuntimeException("Failed to deserialize barber profile: " + id);

            User user = null;
            if (profile.getUser_id() != null) {
                var userSnap = db.collection(USERS_COLLECTION)
                        .document(profile.getUser_id()).get().get();
                if (userSnap.exists()) user = userSnap.toObject(User.class);
            }
            return mapToBarberResponse(profile, user);

        } catch (InterruptedException | ExecutionException e) {
            log.error("Error fetching barber by ID {}: {}", id, e.getMessage());
            throw new RuntimeException("Error fetching barber by ID", e);
        }
    }

    /**
     * One-time migration: copies embedded barberProfile objects from the "users"
     * collection into the canonical "barber_profiles" collection, then removes
     * the embedded copy from the user document.
     *
     * Safe to call multiple times — skips profiles that already exist in
     * barber_profiles.
     *
     * @return number of profiles migrated
     */
    public int migrateEmbeddedProfiles() {
        int migrated = 0;
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            var barbersSnap = db.collection(USERS_COLLECTION)
                    .whereEqualTo("role", "BARBER")
                    .get().get();

            for (QueryDocumentSnapshot userDoc : barbersSnap.getDocuments()) {
                try {
                    User user = userDoc.toObject(User.class);
                    if (user == null) continue;

                    BarberProfile embedded = user.getBarberProfile();
                    if (embedded == null) continue; // nothing to migrate

                    // Ensure the profile has an ID
                    if (embedded.getBarber_profile_id() == null) {
                        embedded.setBarber_profile_id(user.getUser_id());
                    }
                    embedded.setUser_id(user.getUser_id());

                    // Check if already in canonical collection
                    var existing = db.collection(PROFILES_COLLECTION)
                            .whereEqualTo("barber_profile_id", embedded.getBarber_profile_id())
                            .limit(1).get().get();

                    if (!existing.isEmpty()) {
                        log.debug("Profile {} already in barber_profiles — skipping",
                                embedded.getBarber_profile_id());
                        continue;
                    }

                    // Write to canonical collection
                    if (embedded.getCreatedAt() == null) embedded.setCreatedAt(new java.util.Date());
                    if (embedded.getUpdatedAt() == null) embedded.setUpdatedAt(new java.util.Date());

                    db.collection(PROFILES_COLLECTION)
                            .document(embedded.getBarber_profile_id())
                            .set(embedded).get();

                    // Remove embedded copy from user document
                    db.collection(USERS_COLLECTION)
                            .document(userDoc.getId())
                            .update("barberProfile", null).get();

                    log.info("Migrated embedded profile {} for user {}",
                            embedded.getBarber_profile_id(), user.getUser_id());
                    migrated++;

                } catch (Exception e) {
                    log.warn("Failed to migrate profile for user doc {}: {}",
                            userDoc.getId(), e.getMessage());
                }
            }
        } catch (InterruptedException | ExecutionException e) {
            log.error("Migration failed: {}", e.getMessage());
            throw new RuntimeException("Migration failed", e);
        }
        log.info("Migration complete. {} profiles migrated.", migrated);
        return migrated;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Profile update
    // ─────────────────────────────────────────────────────────────────────────

    public AuthResponse.BarberProfileResponse updateProfile(
            String userId,
            edu.cit.cabasag.barberconnect.dto.request.UpdateBarberProfileRequest request) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            // 1. Update phone on the user document
            var userDocRef = db.collection(USERS_COLLECTION).document(
                    java.util.Objects.requireNonNull(userId));
            var userSnap = userDocRef.get().get();
            if (!userSnap.exists()) throw new RuntimeException("User not found: " + userId);

            User user = userSnap.toObject(User.class);
            if (user == null) throw new RuntimeException("Failed to cast User");
            user.setPhoneNumber(request.getPhone());
            user.setUpdatedAt(new java.util.Date());
            userDocRef.set(user).get();

            // 2. Update the canonical barber_profiles document
            var profileQuery = db.collection(PROFILES_COLLECTION)
                    .whereEqualTo("user_id", userId)
                    .limit(1).get().get();

            BarberProfile profile;
            String profileDocId;

            if (!profileQuery.isEmpty()) {
                profileDocId = profileQuery.getDocuments().get(0).getId();
                profile = profileQuery.getDocuments().get(0).toObject(BarberProfile.class);
                if (profile == null) profile = new BarberProfile();
            } else {
                // First-time profile creation for self-registered barber
                profileDocId = userId;
                profile = new BarberProfile();
                profile.setBarber_profile_id(userId);
                profile.setUser_id(userId);
                profile.setCreatedAt(new java.util.Date());
                profile.setRating(java.math.BigDecimal.ZERO);
                profile.setTotalReviews(0);
                profile.setIsAvailable(true);
            }

            profile.setBio(request.getBio());
            profile.setYearsExperience(request.getExperience());
            profile.setGcashNumber(request.getGcash());
            if (request.getIsAvailable() != null) {
                profile.setIsAvailable(request.getIsAvailable());
            }
            profile.setUpdatedAt(new java.util.Date());

            // Use a field-level update map instead of set() to avoid wiping
            // existing fields (rating, totalReviews, profileImageUrl, etc.)
            java.util.Map<String, Object> updates = new java.util.HashMap<>();
            updates.put("bio",             request.getBio());
            updates.put("yearsExperience", request.getExperience());
            updates.put("gcashNumber",     request.getGcash());
            updates.put("updatedAt",       new java.util.Date());
            if (request.getIsAvailable() != null) {
                updates.put("isAvailable", request.getIsAvailable());
            }
            // Ensure user_id and barber_profile_id are always present
            updates.put("user_id",            userId);
            if (profile.getBarber_profile_id() != null) {
                updates.put("barber_profile_id", profile.getBarber_profile_id());
            }

            // Use set with merge=true so existing fields are preserved
            db.collection(PROFILES_COLLECTION)
              .document(profileDocId)
              .set(updates, com.google.cloud.firestore.SetOptions.merge())
              .get();
            log.info("Updated barber profile {} for user {}", profileDocId, userId);

            return mapToBarberResponse(profile, user);

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to update Barber Profile in Firestore", e);
            throw new RuntimeException("DB Error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error updating barber profile", e);
            throw new RuntimeException("Failed to update profile: " + e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Income records
    // ─────────────────────────────────────────────────────────────────────────

    public List<IncomeRecord> getIncomeRecords(String barberProfileId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            var query = db.collection("income_records")
                    .whereEqualTo("barber_profile_id", barberProfileId)
                    .get().get();

            List<IncomeRecord> records = new ArrayList<>();
            for (QueryDocumentSnapshot doc : query.getDocuments()) {
                records.add(doc.toObject(IncomeRecord.class));
            }

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
                String date   = doc.getString("requestedDate");
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

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private AuthResponse.BarberProfileResponse mapToBarberResponse(BarberProfile barber, User user) {
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
}
