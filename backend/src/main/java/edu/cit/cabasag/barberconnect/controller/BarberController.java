package edu.cit.cabasag.barberconnect.controller;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.feature.admin.LeaveRequest;
import edu.cit.cabasag.barberconnect.service.BarberService;
import edu.cit.cabasag.barberconnect.service.FirebaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/barbers")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class BarberController {

    private final BarberService  barberService;
    private final FirebaseService firebaseService;

    private static final String LEAVE_REQUESTS_COLLECTION = "leave_requests";

    // ─────────────────────────────────────────────────────────────────────────
    // Existing endpoints
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/public/available")
    public ResponseEntity<ApiResponse<List<AuthResponse.BarberProfileResponse>>> getAvailableBarbers() {
        try {
            List<AuthResponse.BarberProfileResponse> barbers = barberService.getAllAvailableBarbers();
            return ResponseEntity.ok(ApiResponse.success(barbers));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<ApiResponse<AuthResponse.BarberProfileResponse>> getBarberById(@PathVariable String id) {
        try {
            AuthResponse.BarberProfileResponse barber = barberService.getBarberById(id);
            return ResponseEntity.ok(ApiResponse.success(barber));
        } catch (Exception e) {
            // Fallback: the post may store the Firebase UID as barber_profile_id.
            // Try looking up by user_id in barber_profiles.
            try {
                com.google.cloud.firestore.Firestore db = firebaseService.getFirestore();
                if (db != null) {
                    var snap = db.collection("barber_profiles")
                            .whereEqualTo("user_id", id)
                            .limit(1).get().get();
                    if (!snap.isEmpty()) {
                        edu.cit.cabasag.barberconnect.feature.barber.BarberProfile profile =
                                snap.getDocuments().get(0).toObject(
                                        edu.cit.cabasag.barberconnect.feature.barber.BarberProfile.class);
                        if (profile != null) {
                            edu.cit.cabasag.barberconnect.feature.auth.User user = null;
                            var userSnap = db.collection("users").document(id).get().get();
                            if (userSnap.exists()) {
                                user = userSnap.toObject(edu.cit.cabasag.barberconnect.feature.auth.User.class);
                            }
                            final edu.cit.cabasag.barberconnect.feature.auth.User finalUser = user;
                            AuthResponse.BarberProfileResponse resp = AuthResponse.BarberProfileResponse.builder()
                                    .id(profile.getBarber_profile_id())
                                    .firstName(finalUser != null ? finalUser.getFirstName() : "")
                                    .lastName(finalUser != null ? finalUser.getLastName() : "")
                                    .bio(profile.getBio())
                                    .yearsExperience(profile.getYearsExperience())
                                    .rating(profile.getRating() != null ? profile.getRating().toString() : "0.0")
                                    .totalReviews(profile.getTotalReviews())
                                    .profileImageUrl(profile.getProfileImageUrl())
                                    .gcashNumber(profile.getGcashNumber())
                                    .isAvailable(profile.getIsAvailable())
                                    .build();
                            return ResponseEntity.ok(ApiResponse.success(resp));
                        }
                    }
                }
            } catch (Exception fallbackEx) {
                log.warn("Fallback lookup by user_id also failed for id={}: {}", id, fallbackEx.getMessage());
            }
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<AuthResponse.BarberProfileResponse>> updateBarberProfile(
            @PathVariable String userId,
            @RequestBody edu.cit.cabasag.barberconnect.dto.request.UpdateBarberProfileRequest request) {
        try {
            AuthResponse.BarberProfileResponse updatedProfile = barberService.updateProfile(userId, request);
            return ResponseEntity.ok(ApiResponse.success(updatedProfile));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /barbers/{userId}/profile-picture  — upload via Cloudinary
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping(value = "/{userId}/profile-picture", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<String>> uploadProfilePicture(
            @PathVariable String userId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            edu.cit.cabasag.barberconnect.service.CloudinaryService cloudinaryService =
                    applicationContext.getBean(edu.cit.cabasag.barberconnect.service.CloudinaryService.class);

            String imageUrl = cloudinaryService.uploadProfilePicture("barbers/" + userId, file);

            com.google.cloud.firestore.Firestore db = firebaseService.getFirestore();
            if (db != null) {
                // 1. Update users.profileImageUrl (field-level, no overwrite)
                java.util.Map<String, Object> userUpdates = new java.util.HashMap<>();
                userUpdates.put("profileImageUrl", imageUrl);
                userUpdates.put("updatedAt", new java.util.Date());
                db.collection("users").document(userId).update(userUpdates).get();

                // 2. Update barber_profiles.profileImageUrl (canonical source of truth)
                var profileQuery = db.collection("barber_profiles")
                        .whereEqualTo("user_id", userId)
                        .limit(1).get().get();
                if (!profileQuery.isEmpty()) {
                    String profileDocId = profileQuery.getDocuments().get(0).getId();
                    db.collection("barber_profiles").document(profileDocId)
                      .update("profileImageUrl", imageUrl).get();
                    log.info("Updated barber_profiles.profileImageUrl for user {}", userId);
                } else {
                    log.warn("No barber_profiles doc found for user {} — image saved to users only", userId);
                }
            }

            log.info("Profile picture uploaded for user {}: {}", userId, imageUrl);
            return ResponseEntity.ok(ApiResponse.success(imageUrl));
        } catch (Exception e) {
            log.error("Failed to upload profile picture for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private org.springframework.context.ApplicationContext applicationContext;

    @org.springframework.beans.factory.annotation.Autowired
    public void setApplicationContext(org.springframework.context.ApplicationContext ctx) {
        this.applicationContext = ctx;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: GET /barbers/public/{barberProfileId}/leave-dates
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns all APPROVED leave dates for a specific barber.
     * Used by customer booking page to block unavailable dates.
     * Public endpoint — no auth required.
     */
    @GetMapping("/public/{barberProfileId}/leave-dates")
    public ResponseEntity<ApiResponse<List<String>>> getApprovedLeaveDates(
            @PathVariable String barberProfileId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            QuerySnapshot snapshot = db.collection("leave_requests")
                    .whereEqualTo("barberProfileId", barberProfileId)
                    .whereEqualTo("status", "APPROVED")
                    .get().get();

            List<String> dates = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                String d = doc.getString("requestedDate");
                if (d != null) dates.add(d);
            }

            return ResponseEntity.ok(ApiResponse.success(dates));

        } catch (Exception e) {
            log.error("Failed to fetch approved leave dates for barber {}: {}", barberProfileId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: POST /barbers/{barberProfileId}/leave-request
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Barber submits a leave request for a specific date.
     *
     * Request body: { "requestedDate": "2026-05-10", "reason": "Family event" }
     */
    @PostMapping("/{barberProfileId}/leave-request")
    @SuppressWarnings("null")
    public ResponseEntity<ApiResponse<LeaveRequest>> createLeaveRequest(
            @PathVariable String barberProfileId,
            @RequestBody Map<String, String> body) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            String requestedDate = body.get("requestedDate");
            String reason        = body.getOrDefault("reason", "");

            if (requestedDate == null || requestedDate.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("requestedDate is required (yyyy-MM-dd)"));
            }

            String leaveId = UUID.randomUUID().toString();
            Date   now     = new Date();

            Map<String, Object> doc = new HashMap<>();
            doc.put("leaveRequestId",  leaveId);
            doc.put("barberProfileId", barberProfileId);
            doc.put("requestedDate",   requestedDate);
            doc.put("reason",          reason);
            doc.put("status",          LeaveRequest.LeaveStatus.PENDING.name());
            doc.put("createdAt",       now);
            doc.put("resolvedAt",      null);

            db.collection(LEAVE_REQUESTS_COLLECTION).document(leaveId).set(doc).get();

            LeaveRequest leaveRequest = new LeaveRequest(
                    leaveId, barberProfileId, requestedDate, reason,
                    LeaveRequest.LeaveStatus.PENDING, now, null);

            log.info("Leave request created: {} for barberProfileId={}", leaveId, barberProfileId);
            return ResponseEntity.ok(ApiResponse.success(leaveRequest));

        } catch (Exception e) {
            log.error("Failed to create leave request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: GET /barbers/{barberProfileId}/leave-requests
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns all leave requests submitted by a specific barber.
     */
    @GetMapping("/{barberProfileId}/leave-requests")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getLeaveRequests(
            @PathVariable String barberProfileId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            QuerySnapshot snapshot = db.collection(LEAVE_REQUESTS_COLLECTION)
                    .whereEqualTo("barberProfileId", barberProfileId)
                    .get()
                    .get();

            List<LeaveRequest> results = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                LeaveRequest lr = new LeaveRequest();
                lr.setLeaveRequestId(doc.getString("leaveRequestId"));
                lr.setBarberProfileId(doc.getString("barberProfileId"));
                lr.setRequestedDate(doc.getString("requestedDate"));
                lr.setReason(doc.getString("reason"));
                String statusStr = doc.getString("status");
                if (statusStr != null) {
                    lr.setStatus(LeaveRequest.LeaveStatus.valueOf(statusStr));
                }
                lr.setCreatedAt(doc.getDate("createdAt"));
                lr.setResolvedAt(doc.getDate("resolvedAt"));
                results.add(lr);
            }

            return ResponseEntity.ok(ApiResponse.success(results));

        } catch (Exception e) {
            log.error("Failed to fetch leave requests for barber {}: {}", barberProfileId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: GET /barbers/{barberProfileId}/income
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{barberProfileId}/income")
    public ResponseEntity<ApiResponse<List<edu.cit.cabasag.barberconnect.feature.income.IncomeRecord>>> getBarberIncome(
            @PathVariable String barberProfileId) {
        try {
            List<edu.cit.cabasag.barberconnect.feature.income.IncomeRecord> records = barberService.getIncomeRecords(barberProfileId);
            return ResponseEntity.ok(ApiResponse.success(records));
        } catch (Exception e) {
            log.error("Failed to fetch income records for barber {}: {}", barberProfileId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: GET /barbers/{barberProfileId}/leave-dates
    // Returns only APPROVED leave dates (no auth required — see SecurityConfig)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{barberProfileId}/leave-dates")
    public ResponseEntity<ApiResponse<List<String>>> getLeaveDates(
            @PathVariable String barberProfileId) {
        try {
            List<String> dates = barberService.getApprovedLeaveDates(barberProfileId);
            return ResponseEntity.ok(ApiResponse.success(dates));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}