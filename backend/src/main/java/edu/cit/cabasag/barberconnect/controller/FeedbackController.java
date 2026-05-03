package edu.cit.cabasag.barberconnect.controller;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.model.Comment;
import edu.cit.cabasag.barberconnect.model.Feedback;
import edu.cit.cabasag.barberconnect.service.FirebaseService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class FeedbackController {

    private final FirebaseService firebaseService;

    private static final String FEEDBACK_COL = "feedback";
    private static final String COMMENTS_COL = "comments";
    private static final String APPOINTMENTS_COL   = "appointments";
    private static final String BARBER_PROFILES_COL = "barber_profiles";

    // ─────────────────────────────────────────────────────────────────────────
    // POST /feedback   (customer submits feedback for a completed appointment)
    // Body: { "appointmentId":"", "customerId":"", "barberProfileId":"", "rating":5, "comment":"" }
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @SuppressWarnings("null")
    public ResponseEntity<ApiResponse<Feedback>> submitFeedback(@RequestBody Map<String, Object> body) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            String appointmentId   = (String) body.get("appointmentId");
            String customerId      = (String) body.get("customerId");
            String barberProfileId = (String) body.get("barberProfileId");
            Object ratingObj       = body.get("rating");
            String comment         = (String) body.getOrDefault("comment", "");

            if (appointmentId == null || customerId == null || barberProfileId == null || ratingObj == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("appointmentId, customerId, barberProfileId, rating are required"));
            }
            int rating = ((Number) ratingObj).intValue();

            // Verify appointment exists and is COMPLETED
            var apptSnap = db.collection(APPOINTMENTS_COL).document(appointmentId).get().get();
            if (!apptSnap.exists()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Appointment not found: " + appointmentId));
            }
            String status = apptSnap.getString("status");
            if (!"COMPLETED".equalsIgnoreCase(status)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Feedback can only be submitted for COMPLETED appointments"));
            }

            // Write feedback document
            String        feedbackId = UUID.randomUUID().toString();
            LocalDateTime now        = LocalDateTime.now();

            Map<String, Object> doc = new HashMap<>();
            doc.put("feedback_id",       feedbackId);
            doc.put("appointment_id",    appointmentId);
            doc.put("customer_id",       customerId);
            doc.put("barber_profile_id", barberProfileId);
            doc.put("rating",            rating);
            doc.put("comment",           comment);
            doc.put("isActive",          true);
            doc.put("createdAt",         now.toString());
            db.collection(FEEDBACK_COL).document(feedbackId).set(doc).get();

            // Recalculate barber average rating
            var profileRef  = db.collection(BARBER_PROFILES_COL).document(barberProfileId);
            var profileSnap = profileRef.get().get();
            if (profileSnap.exists()) {
                Double  currentRating = profileSnap.getDouble("rating");
                Long    totalReviewsL = profileSnap.getLong("totalReviews");
                double  cur   = currentRating == null ? 0.0 : currentRating;
                long    total = totalReviewsL  == null ? 0L  : totalReviewsL;
                double  newAvg = ((cur * total) + rating) / (total + 1);
                newAvg = BigDecimal.valueOf(newAvg).setScale(2, RoundingMode.HALF_UP).doubleValue();
                profileRef.update("rating", newAvg, "totalReviews", total + 1).get();
            }

            Feedback fb = new Feedback();
            fb.setFeedback_id(feedbackId);
            fb.setAppointment_id(appointmentId);
            fb.setCustomer_id(customerId);
            fb.setBarber_profile_id(barberProfileId);
            fb.setRating(rating);
            fb.setComment(comment);
            fb.setIsActive(true);
            fb.setCreatedAt(now);

            log.info("Feedback {} submitted for appointment {}", feedbackId, appointmentId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(fb));

        } catch (Exception e) {
            log.error("Failed to submit feedback: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /feedback/{feedbackId}/reply
    // Body: { "barberProfileId": "", "replyContent": "" }
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/{feedbackId}/reply")
    @PreAuthorize("isAuthenticated()")
    @SuppressWarnings("null")
    public ResponseEntity<ApiResponse<Comment>> replyToFeedback(
            @PathVariable String feedbackId,
            @RequestBody Map<String, String> body) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            String barberProfileId = body.get("barberProfileId");
            String replyContent    = body.get("replyContent");

            if (barberProfileId == null || replyContent == null || replyContent.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("barberProfileId and replyContent are required"));
            }

            // Verify feedback exists
            var fbSnap = db.collection(FEEDBACK_COL).document(feedbackId).get().get();
            if (!fbSnap.exists()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Feedback not found: " + feedbackId));
            }

            String        commentId = UUID.randomUUID().toString();
            LocalDateTime now       = LocalDateTime.now();

            // Write reply as a Comment — post_id holds feedbackId as parentId
            Map<String, Object> cDoc = new HashMap<>();
            cDoc.put("comment_id", commentId);
            cDoc.put("post_id",    feedbackId);       // parent is the feedbackId
            cDoc.put("user_id",    barberProfileId);
            cDoc.put("content",    replyContent);
            cDoc.put("isActive",   true);
            cDoc.put("isReply",    true);
            cDoc.put("createdAt",  now.toString());
            cDoc.put("updatedAt",  now.toString());
            db.collection(COMMENTS_COL).document(commentId).set(cDoc).get();

            // Update feedback doc with replyCommentId
            db.collection(FEEDBACK_COL).document(feedbackId)
                    .update("replyCommentId", commentId).get();

            Comment comment = new Comment();
            comment.setComment_id(commentId);
            comment.setPost_id(feedbackId);
            comment.setUser_id(barberProfileId);
            comment.setContent(replyContent);
            comment.setIsActive(true);
            comment.setCreatedAt(now);
            comment.setUpdatedAt(now);

            log.info("Barber {} replied to feedback {}", barberProfileId, feedbackId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(comment));

        } catch (Exception e) {
            log.error("Failed to reply to feedback {}: {}", feedbackId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /feedback/barber/{barberProfileId}
    //   Returns feedback + optional replyContent per item
    // ─────────────────────────────────────────────────────────────────────────

    @Data @AllArgsConstructor
    public static class FeedbackWithReply {
        private String  feedbackId;
        private String  appointmentId;
        private String  customerId;
        private String  barberProfileId;
        private Integer rating;
        private String  comment;
        private Boolean isActive;
        private String  createdAt;
        private String  replyCommentId;
        private String  replyContent;   // null if no reply yet
    }

    @GetMapping("/barber/{barberProfileId}")
    public ResponseEntity<ApiResponse<List<FeedbackWithReply>>> getFeedbackForBarber(
            @PathVariable String barberProfileId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            QuerySnapshot fbSnap = db.collection(FEEDBACK_COL)
                    .whereEqualTo("barber_profile_id", barberProfileId)
                    .get().get();

            List<FeedbackWithReply> result = new ArrayList<>();

            for (QueryDocumentSnapshot doc : fbSnap.getDocuments()) {
                String replyCommentId = doc.getString("replyCommentId");
                String replyContent   = null;

                // Fetch the reply comment if exists
                if (replyCommentId != null && !replyCommentId.isBlank()) {
                    var replyDoc = db.collection(COMMENTS_COL).document(replyCommentId).get().get();
                    if (replyDoc.exists()) {
                        replyContent = replyDoc.getString("content");
                    }
                }

                Long ratingL = doc.getLong("rating");
                result.add(new FeedbackWithReply(
                        doc.getString("feedback_id"),
                        doc.getString("appointment_id"),
                        doc.getString("customer_id"),
                        doc.getString("barber_profile_id"),
                        ratingL == null ? null : ratingL.intValue(),
                        doc.getString("comment"),
                        Boolean.TRUE.equals(doc.getBoolean("isActive")),
                        doc.getString("createdAt"),
                        replyCommentId,
                        replyContent
                ));
            }

            return ResponseEntity.ok(ApiResponse.success(result));

        } catch (Exception e) {
            log.error("Failed to fetch feedback for barber {}: {}", barberProfileId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
