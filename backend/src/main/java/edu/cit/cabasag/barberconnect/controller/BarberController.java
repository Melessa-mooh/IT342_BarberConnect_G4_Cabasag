package edu.cit.cabasag.barberconnect.controller;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.model.LeaveRequest;
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
}