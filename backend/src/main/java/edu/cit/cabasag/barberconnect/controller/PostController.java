package edu.cit.cabasag.barberconnect.controller;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.feature.social.Comment;
import edu.cit.cabasag.barberconnect.feature.social.Post;
import edu.cit.cabasag.barberconnect.feature.social.Reaction;
import edu.cit.cabasag.barberconnect.service.CloudinaryService;
import edu.cit.cabasag.barberconnect.service.FirebaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PostController {

    private final FirebaseService   firebaseService;
    private final CloudinaryService cloudinaryService;

    private static final String POSTS_COL     = "posts";
    private static final String COMMENTS_COL  = "comments";
    private static final String REACTIONS_COL = "reactions";

    // ─────────────────────────────────────────────────────────────────────────
    // POST /posts   (multipart: barberProfileId, content, file?)
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE,
            MediaType.APPLICATION_JSON_VALUE})
    @PreAuthorize("isAuthenticated()")
    @SuppressWarnings("null")
    public ResponseEntity<ApiResponse<Post>> createPost(
            @RequestParam("barberProfileId") String barberProfileId,
            @RequestParam("content")         String content,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            // Optional image upload
            String imageUrl = null;
            if (file != null && !file.isEmpty()) {
                imageUrl = cloudinaryService.uploadProfilePicture("posts/" + barberProfileId, file);
            }

            String        postId = UUID.randomUUID().toString();
            LocalDateTime now    = LocalDateTime.now();

            Map<String, Object> doc = new HashMap<>();
            doc.put("post_id",            postId);
            doc.put("barber_profile_id",  barberProfileId);
            doc.put("content",            content);
            doc.put("imageUrl",           imageUrl);
            doc.put("likesCount",         0);
            doc.put("commentsCount",      0);
            doc.put("isActive",           true);
            doc.put("createdAt",          now.toString());
            doc.put("updatedAt",          now.toString());

            db.collection(POSTS_COL).document(postId).set(doc).get();

            Post post = new Post();
            post.setPost_id(postId);
            post.setBarber_profile_id(barberProfileId);
            post.setContent(content);
            post.setImageUrl(imageUrl);
            post.setLikesCount(0);
            post.setCommentsCount(0);
            post.setIsActive(true);
            post.setCreatedAt(now);
            post.setUpdatedAt(now);

            log.info("Post created: {} for barberProfileId={}", postId, barberProfileId);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(post));

        } catch (Exception e) {
            log.error("Failed to create post: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /posts   (all active posts, newest first)
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<Post>>> getAllPosts() {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            QuerySnapshot snap = db.collection(POSTS_COL)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(50)
                    .get().get();

            List<Post> posts = mapPosts(snap);
            return ResponseEntity.ok(ApiResponse.success(posts));

        } catch (Exception e) {
            log.error("Failed to fetch posts: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /posts/barber/{barberProfileId}
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/barber/{barberProfileId}")
    public ResponseEntity<ApiResponse<List<Post>>> getPostsByBarber(@PathVariable String barberProfileId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            QuerySnapshot snap = db.collection(POSTS_COL)
                    .whereEqualTo("barber_profile_id", barberProfileId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .get().get();

            return ResponseEntity.ok(ApiResponse.success(mapPosts(snap)));

        } catch (Exception e) {
            log.error("Failed to fetch posts for barber {}: {}", barberProfileId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /posts/{postId}/reactions
    // Body: { "userId": "", "type": "LIKE | LOVE | FIRE | CLAP" }
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/{postId}/reactions")
    @PreAuthorize("isAuthenticated()")
    @SuppressWarnings("null")
    public ResponseEntity<ApiResponse<Reaction>> addReaction(
            @PathVariable String postId,
            @RequestBody Map<String, String> body) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            String userId   = body.get("userId");
            String typeStr  = body.get("type");
            if (userId == null || typeStr == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("userId and type are required"));
            }
            Reaction.ReactionType reactionType = Reaction.ReactionType.valueOf(typeStr.toUpperCase());

            // Check if this user already reacted to this post
            QuerySnapshot existing = db.collection(REACTIONS_COL)
                    .whereEqualTo("post_id", postId)
                    .whereEqualTo("user_id", userId)
                    .limit(1).get().get();

            String reactionId;
            if (!existing.isEmpty()) {
                // Update existing reaction
                reactionId = existing.getDocuments().get(0).getId();
                db.collection(REACTIONS_COL).document(reactionId)
                        .update("type", reactionType.name()).get();
            } else {
                // Create new reaction
                reactionId = UUID.randomUUID().toString();
                Map<String, Object> doc = new HashMap<>();
                doc.put("reaction_id", reactionId);
                doc.put("post_id",     postId);
                doc.put("user_id",     userId);
                doc.put("type",        reactionType.name());
                doc.put("createdAt",   LocalDateTime.now().toString());
                db.collection(REACTIONS_COL).document(reactionId).set(doc).get();
            }

            // Recalculate likesCount on the post
            long count = db.collection(REACTIONS_COL)
                    .whereEqualTo("post_id", postId)
                    .count().get().get().getCount();
            db.collection(POSTS_COL).document(postId).update("likesCount", (int) count).get();

            Reaction reaction = new Reaction();
            reaction.setReaction_id(reactionId);
            reaction.setPost_id(postId);
            reaction.setUser_id(userId);
            reaction.setType(reactionType);
            reaction.setCreatedAt(LocalDateTime.now());

            return ResponseEntity.ok(ApiResponse.success(reaction));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid reaction type. Use: LIKE, LOVE, FIRE, CLAP"));
        } catch (Exception e) {
            log.error("Failed to add reaction to post {}: {}", postId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /posts/{postId}/comments
    // Body: { "userId": "", "content": "" }
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/{postId}/comments")
    @PreAuthorize("isAuthenticated()")
    @SuppressWarnings("null")
    public ResponseEntity<ApiResponse<Comment>> addComment(
            @PathVariable String postId,
            @RequestBody Map<String, String> body) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            String userId  = body.get("userId");
            String content = body.get("content");
            if (userId == null || content == null || content.isBlank()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("userId and content are required"));
            }

            String        commentId = UUID.randomUUID().toString();
            LocalDateTime now       = LocalDateTime.now();

            Map<String, Object> doc = new HashMap<>();
            doc.put("comment_id", commentId);
            doc.put("post_id",    postId);
            doc.put("user_id",    userId);
            doc.put("content",    content);
            doc.put("isActive",   true);
            doc.put("createdAt",  now.toString());
            doc.put("updatedAt",  now.toString());
            db.collection(COMMENTS_COL).document(commentId).set(doc).get();

            // Increment commentsCount
            var postRef = db.collection(POSTS_COL).document(postId);
            var postSnap = postRef.get().get();
            if (postSnap.exists()) {
                Long current = postSnap.getLong("commentsCount");
                postRef.update("commentsCount", (current == null ? 0 : current) + 1).get();
            }

            Comment comment = new Comment();
            comment.setComment_id(commentId);
            comment.setPost_id(postId);
            comment.setUser_id(userId);
            comment.setContent(content);
            comment.setIsActive(true);
            comment.setCreatedAt(now);
            comment.setUpdatedAt(now);

            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(comment));

        } catch (Exception e) {
            log.error("Failed to add comment to post {}: {}", postId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /posts/{postId}/comments
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<List<Comment>>> getComments(@PathVariable String postId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Firestore not available"));

            // No orderBy to avoid requiring a composite Firestore index.
            // Sort by createdAt in Java instead.
            QuerySnapshot snap = db.collection(COMMENTS_COL)
                    .whereEqualTo("post_id", postId)
                    .get().get();

            List<Comment> comments = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snap.getDocuments()) {
                Comment c = new Comment();
                c.setComment_id(doc.getString("comment_id"));
                c.setPost_id(doc.getString("post_id"));
                c.setUser_id(doc.getString("user_id"));
                c.setContent(doc.getString("content"));
                c.setIsActive(Boolean.TRUE.equals(doc.getBoolean("isActive")));
                String ca = doc.getString("createdAt");
                if (ca != null) {
                    try { c.setCreatedAt(LocalDateTime.parse(ca)); } catch (Exception ignored) {}
                }
                comments.add(c);
            }

            // Sort ascending by createdAt in Java (avoids composite index requirement)
            comments.sort((a, b) -> {
                if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                if (a.getCreatedAt() == null) return -1;
                if (b.getCreatedAt() == null) return 1;
                return a.getCreatedAt().compareTo(b.getCreatedAt());
            });

            return ResponseEntity.ok(ApiResponse.success(comments));

        } catch (Exception e) {
            log.error("Failed to fetch comments for post {}: {}", postId, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── helper ──────────────────────────────────────────────────────────────

    private List<Post> mapPosts(QuerySnapshot snap) {
        List<Post> list = new ArrayList<>();
        for (QueryDocumentSnapshot doc : snap.getDocuments()) {
            Post p = new Post();
            p.setPost_id(doc.getString("post_id"));
            p.setBarber_profile_id(doc.getString("barber_profile_id"));
            p.setContent(doc.getString("content"));
            p.setImageUrl(doc.getString("imageUrl"));
            Long likes = doc.getLong("likesCount");
            p.setLikesCount(likes == null ? 0 : likes.intValue());
            Long comments = doc.getLong("commentsCount");
            p.setCommentsCount(comments == null ? 0 : comments.intValue());
            p.setIsActive(Boolean.TRUE.equals(doc.getBoolean("isActive")));
            String ca = doc.getString("createdAt");
            if (ca != null) p.setCreatedAt(LocalDateTime.parse(ca));
            list.add(p);
        }
        return list;
    }
}
