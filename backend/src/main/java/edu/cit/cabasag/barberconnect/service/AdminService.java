package edu.cit.cabasag.barberconnect.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.AggregateQuerySnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import edu.cit.cabasag.barberconnect.dto.request.CreateBarberRequest;
import edu.cit.cabasag.barberconnect.factory.UserFactory;
import edu.cit.cabasag.barberconnect.model.LeaveRequest;
import edu.cit.cabasag.barberconnect.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final FirebaseService firebaseService;
    private final FirebaseAuth   firebaseAuth;
    private final UserFactory    userFactory;

    // ─────────────────────────────────────────────────────────────────────────
    // Existing: Shop Statistics
    // ─────────────────────────────────────────────────────────────────────────

    public Map<String, Object> getShopStatistics() {
        Map<String, Object> stats = new HashMap<>();
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            // 1. Total Appointments
            AggregateQuerySnapshot appointmentsSnapshot = db.collection("appointments")
                    .count()
                    .get()
                    .get();
            stats.put("totalAppointments", appointmentsSnapshot.getCount());

            // 2. Active Barbers
            AggregateQuerySnapshot barbersSnapshot = db.collection("users")
                    .whereEqualTo("role", "BARBER")
                    .whereEqualTo("isActive", true)
                    .count()
                    .get()
                    .get();
            stats.put("activeBarbers", barbersSnapshot.getCount());

            // 3. Total Customers
            AggregateQuerySnapshot customersSnapshot = db.collection("users")
                    .whereEqualTo("role", "CUSTOMER")
                    .count()
                    .get()
                    .get();
            stats.put("totalCustomers", customersSnapshot.getCount());

            // 4. Total Revenue (sum of all COMPLETED appointments)
            QuerySnapshot revenueSnapshot = db.collection("appointments")
                    .whereEqualTo("status", "COMPLETED")
                    .get()
                    .get();
            double totalRevenue = 0.0;
            for (QueryDocumentSnapshot doc : revenueSnapshot.getDocuments()) {
                Double price = doc.getDouble("totalPrice");
                if (price != null) totalRevenue += price;
            }
            stats.put("totalRevenue", totalRevenue);

            return stats;

        } catch (Exception e) {
            log.error("Failed to aggregate shop statistics: {}", e.getMessage());
            stats.put("totalAppointments", 0);
            stats.put("activeBarbers", 0);
            stats.put("totalCustomers", 0);
            stats.put("totalRevenue", 0);
            return stats;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: Create Barber Account
    // POST /api/v1/admin/barbers/create
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Creates a full barber account:
     *   1. Firebase Auth user (email + password)
     *   2. Firestore "users" document  (role = BARBER, isActive = true)
     *   3. Firestore "barber_profiles" document (isAvailable = true, rating = 0)
     *
     * @param request CreateBarberRequest with firstName, lastName, email, password, phoneNumber
     * @return the saved User object
     * @throws RuntimeException if email already exists or any Firestore/Firebase call fails
     */
    @SuppressWarnings("null")
    public User createBarberAccount(CreateBarberRequest request) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            // ── Step 1: Create Firebase Auth account ──────────────────────────
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(request.getEmail().trim())
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getFirstName().trim() + " " + request.getLastName().trim())
                    .setEmailVerified(true); // Admin-created accounts are pre-verified

            UserRecord userRecord = firebaseAuth.createUser(createRequest);
            String uid = userRecord.getUid();
            log.info("Firebase Auth account created for barber: {} (uid={})", request.getEmail(), uid);

            // ── Step 2: Build and save the User document ───────────────────────
            User user = userFactory.createUser(
                    uid,
                    request.getFirstName().trim(),
                    request.getLastName().trim(),
                    request.getEmail().trim(),
                    "BARBER"
            );
            // Override phone number (factory defaults to empty string)
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
                user.setPhoneNumber(request.getPhoneNumber().trim());
            }

            Map<String, Object> userData = buildUserMap(user);
            db.collection("users").document(uid).set(userData).get();
            log.info("Firestore 'users' document written for barber uid={}", uid);

            // ── Step 3: Create the barber_profile document ─────────────────────
            String profileId = UUID.randomUUID().toString();
            Map<String, Object> profileData = buildBarberProfileMap(profileId, uid);
            db.collection("barber_profiles").document(profileId).set(profileData).get();
            log.info("Firestore 'barber_profiles' document written (profileId={})", profileId);

            return user;

        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            log.error("Firebase Auth error creating barber: {}", e.getMessage());
            // Provide a friendlier message for duplicate emails
            if ("EMAIL_ALREADY_EXISTS".equalsIgnoreCase(String.valueOf(e.getErrorCode()))) {
                throw new RuntimeException("Email is already registered: " + request.getEmail());
            }
            throw new RuntimeException("Failed to create Firebase account: " + e.getMessage());
        } catch (InterruptedException | ExecutionException e) {
            log.error("Firestore error creating barber: {}", e.getMessage());
            throw new RuntimeException("Failed to save barber data: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEW: Deactivate (soft-delete) Barber Account
    // DELETE /api/v1/admin/barbers/{userId}
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Soft-deletes a barber account:
     *   1. Sets isActive = false on the "users" document
     *   2. Sets isAvailable = false on the matching "barber_profiles" document
     *   Firebase Auth record is intentionally left intact.
     *
     * @param userId Firebase UID of the barber to deactivate
     * @throws RuntimeException if the user is not found, is not a BARBER, or Firestore fails
     */
    @SuppressWarnings("null")
    public void deactivateBarberAccount(String userId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            // ── Step 1: Verify the user exists and is a BARBER ────────────────
            var userDoc = db.collection("users").document(userId).get().get();
            if (!userDoc.exists()) {
                throw new RuntimeException("User not found: " + userId);
            }
            String role = userDoc.getString("role");
            if (!"BARBER".equalsIgnoreCase(role)) {
                throw new RuntimeException("User " + userId + " is not a BARBER (role=" + role + ")");
            }

            // ── Step 2: Deactivate the user document ──────────────────────────
            Map<String, Object> userUpdate = new HashMap<>();
            userUpdate.put("isActive", false);
            userUpdate.put("updatedAt", new Date());
            db.collection("users").document(userId).update(userUpdate).get();
            log.info("User '{}' deactivated (isActive=false)", userId);

            // ── Step 3: Mark barber profile as unavailable ────────────────────
            QuerySnapshot profileQuery = db.collection("barber_profiles")
                    .whereEqualTo("user_id", userId)
                    .limit(1)
                    .get()
                    .get();

            if (!profileQuery.isEmpty()) {
                String profileDocId = profileQuery.getDocuments().get(0).getId();
                Map<String, Object> profileUpdate = new HashMap<>();
                profileUpdate.put("isAvailable", false);
                profileUpdate.put("updatedAt", LocalDateTime.now().toString());
                db.collection("barber_profiles").document(profileDocId).update(profileUpdate).get();
                log.info("BarberProfile '{}' set isAvailable=false for user '{}'", profileDocId, userId);
            } else {
                log.warn("No barber_profile found for user '{}' — only user doc was deactivated", userId);
            }

        } catch (InterruptedException | ExecutionException e) {
            log.error("Firestore error deactivating barber '{}': {}", userId, e.getMessage());
            throw new RuntimeException("Failed to deactivate barber account: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /** Converts a User object into the Firestore-safe map (mirrors UserService.convertToMap). */
    private Map<String, Object> buildUserMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("user_id",          user.getUser_id());
        map.put("firstName",        user.getFirstName());
        map.put("lastName",         user.getLastName());
        map.put("email",            user.getEmail());
        map.put("phoneNumber",      user.getPhoneNumber());
        map.put("role",             user.getRole().toString());   // "BARBER"
        map.put("isActive",         user.getIsActive());          // true
        map.put("profileImageUrl",  null);
        map.put("createdAt",        user.getCreatedAt());
        map.put("updatedAt",        user.getUpdatedAt());
        return map;
    }

    /** Builds the initial barber_profiles Firestore document. */
    private Map<String, Object> buildBarberProfileMap(String profileId, String userId) {
        Map<String, Object> map = new HashMap<>();
        map.put("barber_profile_id", profileId);
        map.put("user_id",           userId);
        map.put("bio",               "");
        map.put("yearsExperience",   0);
        map.put("rating",            0.0);
        map.put("totalReviews",      0);
        map.put("profileImageUrl",   null);
        map.put("isAvailable",       true);
        map.put("gcashNumber",       "");
        map.put("createdAt",         LocalDateTime.now().toString());
        map.put("updatedAt",         LocalDateTime.now().toString());
        return map;
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // NEW: Leave Request Management (Admin)
    // ──────────────────────────────────────────────────────────────────────────────

    private static final String LEAVE_COLLECTION = "leave_requests";

    /** Returns all PENDING leave requests (all barbers). */
    public List<LeaveRequest> getPendingLeaveRequests() {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            QuerySnapshot snapshot = db.collection(LEAVE_COLLECTION)
                    .whereEqualTo("status", LeaveRequest.LeaveStatus.PENDING.name())
                    .get().get();

            return mapLeaveRequests(snapshot);

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to fetch pending leave requests: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    /** Approves a leave request: status = APPROVED, resolvedAt = now. */
    public LeaveRequest approveLeaveRequest(String leaveRequestId) {
        return resolveLeaveRequest(leaveRequestId, LeaveRequest.LeaveStatus.APPROVED);
    }

    /** Declines a leave request: status = DECLINED, resolvedAt = now. */
    public LeaveRequest declineLeaveRequest(String leaveRequestId) {
        return resolveLeaveRequest(leaveRequestId, LeaveRequest.LeaveStatus.DECLINED);
    }

    @SuppressWarnings("null")
    private LeaveRequest resolveLeaveRequest(String leaveRequestId, LeaveRequest.LeaveStatus newStatus) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            var docRef = db.collection(LEAVE_COLLECTION).document(leaveRequestId);
            var snap   = docRef.get().get();
            if (!snap.exists()) throw new RuntimeException("Leave request not found: " + leaveRequestId);

            Date now = new Date();
            Map<String, Object> updates = new HashMap<>();
            updates.put("status",     newStatus.name());
            updates.put("resolvedAt", now);
            docRef.update(updates).get();

            // Re-fetch and return updated document
            var updated = docRef.get().get();
            LeaveRequest lr = new LeaveRequest();
            lr.setLeaveRequestId(updated.getString("leaveRequestId"));
            lr.setBarberProfileId(updated.getString("barberProfileId"));
            lr.setRequestedDate(updated.getString("requestedDate"));
            lr.setReason(updated.getString("reason"));
            lr.setStatus(newStatus);
            lr.setCreatedAt(updated.getDate("createdAt"));
            lr.setResolvedAt(now);

            log.info("Leave request {} set to {}", leaveRequestId, newStatus);
            return lr;

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to resolve leave request {}: {}", leaveRequestId, e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    private List<LeaveRequest> mapLeaveRequests(QuerySnapshot snapshot) {
        List<LeaveRequest> list = new ArrayList<>();
        for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
            LeaveRequest lr = new LeaveRequest();
            lr.setLeaveRequestId(doc.getString("leaveRequestId"));
            lr.setBarberProfileId(doc.getString("barberProfileId"));
            lr.setRequestedDate(doc.getString("requestedDate"));
            lr.setReason(doc.getString("reason"));
            String s = doc.getString("status");
            if (s != null) lr.setStatus(LeaveRequest.LeaveStatus.valueOf(s));
            lr.setCreatedAt(doc.getDate("createdAt"));
            lr.setResolvedAt(doc.getDate("resolvedAt"));
            list.add(lr);
        }
        return list;
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // NEW: GET /api/v1/admin/attendance/today
    // ──────────────────────────────────────────────────────────────────────────────

    /** Simple DTO returned per barber for today’s attendance. */
    @Data @AllArgsConstructor
    public static class AttendanceRecord {
        private String userId;
        private String firstName;
        private String lastName;
        private String profileImageUrl;
        private String attendanceStatus; // "WORKING" | "ON_LEAVE" | "ABSENT"
    }

    /**
     * Builds today’s attendance list for all active barbers.
     * Status logic:
     *   • barberProfileId in approved-leave set → ON_LEAVE
     *   • isAvailable == true → WORKING
     *   • else → ABSENT
     */
    public List<AttendanceRecord> getTodayAttendance() {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            // Step 1: today's date string
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

            // Step 2: barberProfileIds on approved leave today
            QuerySnapshot leaveSnap = db.collection(LEAVE_COLLECTION)
                    .whereEqualTo("requestedDate", today)
                    .whereEqualTo("status", LeaveRequest.LeaveStatus.APPROVED.name())
                    .get().get();

            Set<String> onLeaveProfileIds = new HashSet<>();
            for (QueryDocumentSnapshot doc : leaveSnap.getDocuments()) {
                String pid = doc.getString("barberProfileId");
                if (pid != null) onLeaveProfileIds.add(pid);
            }

            // Step 3: all active barbers from "users"
            QuerySnapshot barbersSnap = db.collection("users")
                    .whereEqualTo("role", "BARBER")
                    .whereEqualTo("isActive", true)
                    .get().get();

            // Step 4: fetch barber_profiles to get barber_profile_id for each user
            QuerySnapshot profilesSnap = db.collection("barber_profiles").get().get();
            // Build map: user_id → barber_profile_id
            Map<String, String> userToProfileId = new HashMap<>();
            Map<String, Boolean> profileAvailability = new HashMap<>();
            for (QueryDocumentSnapshot pDoc : profilesSnap.getDocuments()) {
                String uid  = pDoc.getString("user_id");
                String pid  = pDoc.getString("barber_profile_id");
                Boolean avail = pDoc.getBoolean("isAvailable");
                if (uid != null && pid != null) {
                    userToProfileId.put(uid, pid);
                    profileAvailability.put(pid, Boolean.TRUE.equals(avail));
                }
            }

            // Step 5: build attendance records
            List<AttendanceRecord> records = new ArrayList<>();
            for (QueryDocumentSnapshot bDoc : barbersSnap.getDocuments()) {
                String userId    = bDoc.getString("user_id");
                String firstName = bDoc.getString("firstName");
                String lastName  = bDoc.getString("lastName");
                String imageUrl  = bDoc.getString("profileImageUrl");
                String profileId = userToProfileId.getOrDefault(userId, "");

                String status;
                if (onLeaveProfileIds.contains(profileId)) {
                    status = "ON_LEAVE";
                } else if (Boolean.TRUE.equals(profileAvailability.get(profileId))) {
                    status = "WORKING";
                } else {
                    status = "ABSENT";
                }

                records.add(new AttendanceRecord(userId, firstName, lastName, imageUrl, status));
            }

            return records;

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to calculate today’s attendance: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // NEW: GET /api/v1/admin/income/barbers
    // ──────────────────────────────────────────────────────────────────────────────

    @Data
    @AllArgsConstructor
    public static class BarberIncomeSummary {
        private String barberProfileId;
        private String firstName;
        private String lastName;
        private java.math.BigDecimal totalNetAmount;
        private java.math.BigDecimal totalPlatformFee;
        private int totalAppointments;
    }

    public List<BarberIncomeSummary> getBarberIncomeSummaries() {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            // Fetch all income records
            QuerySnapshot incomeSnap = db.collection("income_records").get().get();

            // Group by barber_profile_id
            Map<String, BarberIncomeSummary> summaries = new HashMap<>();

            for (QueryDocumentSnapshot doc : incomeSnap.getDocuments()) {
                String barberProfileId = doc.getString("barber_profile_id");
                if (barberProfileId == null) continue;

                java.math.BigDecimal netAmount = java.math.BigDecimal.ZERO;
                Object netObj = doc.get("netAmount");
                if (netObj instanceof Number) {
                    netAmount = new java.math.BigDecimal(netObj.toString());
                }

                java.math.BigDecimal platformFee = java.math.BigDecimal.ZERO;
                Object feeObj = doc.get("platformFee");
                if (feeObj instanceof Number) {
                    platformFee = new java.math.BigDecimal(feeObj.toString());
                }

                BarberIncomeSummary summary = summaries.getOrDefault(barberProfileId,
                        new BarberIncomeSummary(barberProfileId, "Unknown", "Barber", java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, 0));

                summary.setTotalNetAmount(summary.getTotalNetAmount().add(netAmount));
                summary.setTotalPlatformFee(summary.getTotalPlatformFee().add(platformFee));
                summary.setTotalAppointments(summary.getTotalAppointments() + 1);

                summaries.put(barberProfileId, summary);
            }

            // Fetch barber names
            // 1. barber_profiles to get user_id
            // 2. users to get firstName and lastName
            QuerySnapshot profilesSnap = db.collection("barber_profiles").get().get();
            Map<String, String> profileToUserId = new HashMap<>();
            for (QueryDocumentSnapshot doc : profilesSnap.getDocuments()) {
                String pid = doc.getString("barber_profile_id");
                String uid = doc.getString("user_id");
                if (pid != null && uid != null) {
                    profileToUserId.put(pid, uid);
                }
            }

            QuerySnapshot usersSnap = db.collection("users").get().get();
            Map<String, QueryDocumentSnapshot> userMap = new HashMap<>();
            for (QueryDocumentSnapshot doc : usersSnap.getDocuments()) {
                userMap.put(doc.getId(), doc);
            }

            for (BarberIncomeSummary summary : summaries.values()) {
                String userId = profileToUserId.get(summary.getBarberProfileId());
                if (userId != null && userMap.containsKey(userId)) {
                    QueryDocumentSnapshot userDoc = userMap.get(userId);
                    summary.setFirstName(userDoc.getString("firstName"));
                    summary.setLastName(userDoc.getString("lastName"));
                }
            }

            return new ArrayList<>(summaries.values());

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to fetch barber income summaries: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch barber income summaries: " + e.getMessage());
        }
    }
}
