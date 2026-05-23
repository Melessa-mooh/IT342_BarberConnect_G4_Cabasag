package edu.cit.cabasag.barberconnect.controller;

import edu.cit.cabasag.barberconnect.dto.request.LoginRequest;
import edu.cit.cabasag.barberconnect.dto.request.RegisterRequest;
import edu.cit.cabasag.barberconnect.dto.request.UpdateBarberProfileRequest;
import edu.cit.cabasag.barberconnect.dto.request.UpdateProfileRequest;
import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.feature.auth.User;
import edu.cit.cabasag.barberconnect.security.JwtUtil;
import edu.cit.cabasag.barberconnect.service.AuthService;
import edu.cit.cabasag.barberconnect.service.BarberService;
import edu.cit.cabasag.barberconnect.service.CloudinaryService;
import edu.cit.cabasag.barberconnect.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "*"})
public class AuthController {
    
    private final AuthService authService;
    private final UserService userService;
    private final CloudinaryService cloudinaryService;
    private final JwtUtil jwtUtil;
    private final BarberService barberService;
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Registration failed", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Login failed", e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/firebase-login")
    public ResponseEntity<ApiResponse<AuthResponse>> firebaseLogin(@RequestBody Map<String, String> request) {
        try {
            String idToken = request.get("idToken");
            if (idToken == null || idToken.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("ID token is required"));
            }
            
            AuthResponse response = authService.loginWithFirebaseToken(idToken);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Firebase login failed", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String uid = (String) authentication.getPrincipal();
            
            User user = userService.findById(uid)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            AuthResponse response = mapToAuthResponse(user);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Get current user failed", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Public endpoint to look up a user's display name by Firebase UID.
     *  Used by barber schedule popup to show customer names. */
    @GetMapping("/user/{uid}")
    public ResponseEntity<ApiResponse<Map<String, String>>> getUserName(@PathVariable String uid) {
        try {
            User user = userService.findById(uid).orElse(null);
            if (user == null) {
                return ResponseEntity.ok(ApiResponse.success(Map.of("firstName", "Customer", "lastName", "")));
            }
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                "lastName",  user.getLastName()  != null ? user.getLastName()  : ""
            )));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success(Map.of("firstName", "Customer", "lastName", "")));
        }
    }
    
    @PostMapping("/profile/image")
    public ResponseEntity<ApiResponse<String>> uploadProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String uid = (String) authentication.getPrincipal();

            log.info("Profile image upload request for user: {}", uid);

            User user = userService.findById(uid)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String profileImageUrl = cloudinaryService.uploadProfilePicture(uid, file);

            // Update users collection (field-level, preserves all other fields)
            userService.updateProfilePicture(uid, profileImageUrl);

            // If barber, also update barber_profiles.profileImageUrl
            if (user.getRole() == User.UserRole.BARBER) {
                try {
                    com.google.cloud.firestore.Firestore db =
                            com.google.firebase.cloud.FirestoreClient.getFirestore();
                    if (db != null) {
                        var profileQuery = db.collection("barber_profiles")
                                .whereEqualTo("user_id", uid)
                                .limit(1).get().get();
                        if (!profileQuery.isEmpty()) {
                            String profileDocId = profileQuery.getDocuments().get(0).getId();
                            db.collection("barber_profiles").document(profileDocId)
                              .update("profileImageUrl", profileImageUrl).get();
                            log.info("Updated barber_profiles.profileImageUrl for user {}", uid);
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Could not update barber_profiles profileImageUrl: {}", ex.getMessage());
                }
            }

            log.info("User {} profile picture updated", uid);
            return ResponseEntity.ok(ApiResponse.success(profileImageUrl));
        } catch (Exception e) {
            log.error("Profile image upload failed: ", e);
            return ResponseEntity.badRequest().body(ApiResponse.error("File upload failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Boolean>> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                boolean isValid = jwtUtil.validateToken(token);
                return ResponseEntity.ok(ApiResponse.success(isValid));
            }
            return ResponseEntity.ok(ApiResponse.success(false));
        } catch (Exception e) {
            log.error("Token validation failed", e);
            return ResponseEntity.ok(ApiResponse.success(false));
        }
    }

    /**
     * POST /auth/refresh
     * Accepts a valid (non-expired) refresh token and issues a new access token + refresh token pair.
     * Returns HTTP 401 if the refresh token is invalid or expired.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, String>>> refreshToken(
            @RequestBody Map<String, String> body) {
        try {
            String refreshToken = body.get("refreshToken");
            if (refreshToken == null || refreshToken.isBlank()) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Refresh token is required"));
            }

            // Validate the token is a refresh token and is not expired
            if (!jwtUtil.isRefreshToken(refreshToken) || jwtUtil.isTokenExpired(refreshToken)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid or expired refresh token"));
            }

            String uid = jwtUtil.extractUid(refreshToken);
            User user = userService.findById(uid)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!user.getIsActive()) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Account is deactivated"));
            }

            String newAccessToken  = jwtUtil.generateToken(uid, user.getEmail(), user.getRole().name());
            String newRefreshToken = jwtUtil.generateRefreshToken(uid);

            log.info("Token refreshed for user: {}", uid);
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("token", newAccessToken, "refreshToken", newRefreshToken)));

        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Token refresh failed"));
        }
    }
    
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String uid = (String) authentication.getPrincipal();

            log.info("Profile update request for user: {}", uid);

            User user = userService.findById(uid)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Always update basic user fields
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
                user.setPhoneNumber(request.getPhoneNumber());
            }

            user = userService.save(user);
            log.info("Basic user fields saved for: {}", uid);

            // For BARBERs: delegate barber-specific fields to BarberService
            // which writes directly to barber_profiles (canonical source of truth)
            if (user.getRole() == User.UserRole.BARBER) {
                try {
                    UpdateBarberProfileRequest barberRequest = new UpdateBarberProfileRequest();
                    barberRequest.setPhone(user.getPhoneNumber());
                    barberRequest.setBio(request.getBio());
                    barberRequest.setExperience(request.getYearsExperience() != null ? request.getYearsExperience() : 0);
                    barberRequest.setGcash(null); // not sent from ProfilePage — preserved via merge
                    barberRequest.setIsAvailable(request.getIsAvailable());
                    barberService.updateProfile(uid, barberRequest);
                    log.info("Barber profile fields saved to barber_profiles for: {}", uid);
                } catch (Exception ex) {
                    log.warn("Could not update barber_profiles: {}", ex.getMessage());
                }
            }

            AuthResponse response = mapToAuthResponse(user);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Profile update failed", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    private AuthResponse mapToAuthResponse(User user) {
        AuthResponse response = new AuthResponse();
        response.setFirebaseUid(user.getUser_id());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setEmail(user.getEmail());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setRole(user.getRole());
        response.setActive(user.getIsActive());
        response.setProfileImageUrl(user.getProfileImageUrl());

        // Always load barberProfile from barber_profiles collection (canonical source of truth)
        if (user.getRole() == User.UserRole.BARBER) {
            var bp = userService.findBarberProfileByUserId(user.getUser_id()).orElse(null);
            if (bp != null) {
                AuthResponse.BarberProfileResponse barberResponse = new AuthResponse.BarberProfileResponse();
                barberResponse.setId(bp.getBarber_profile_id());
                barberResponse.setBio(bp.getBio());
                barberResponse.setYearsExperience(bp.getYearsExperience());
                barberResponse.setRating(bp.getRating() != null ? bp.getRating().toString() : "0");
                barberResponse.setTotalReviews(bp.getTotalReviews() != null ? bp.getTotalReviews() : 0);
                barberResponse.setProfileImageUrl(bp.getProfileImageUrl());
                barberResponse.setIsAvailable(bp.getIsAvailable() != null ? bp.getIsAvailable() : true);
                barberResponse.setGcashNumber(bp.getGcashNumber());
                response.setBarberProfile(barberResponse);
            }
        }

        return response;
    }
}
