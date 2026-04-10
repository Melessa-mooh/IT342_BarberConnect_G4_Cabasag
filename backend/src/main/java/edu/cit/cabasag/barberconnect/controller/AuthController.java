package edu.cit.cabasag.barberconnect.controller;

import edu.cit.cabasag.barberconnect.dto.request.LoginRequest;
import edu.cit.cabasag.barberconnect.dto.request.RegisterRequest;
import edu.cit.cabasag.barberconnect.dto.request.UpdateProfileRequest;
import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.model.User;
import edu.cit.cabasag.barberconnect.security.JwtUtil;
import edu.cit.cabasag.barberconnect.service.AuthService;
import edu.cit.cabasag.barberconnect.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000", "*"})
public class AuthController {
    
    private final AuthService authService;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    
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
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
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
    
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String uid = (String) authentication.getPrincipal();
            
            log.info("Profile update request for user: {}", uid);
            log.info("Request data: firstName={}, lastName={}, phoneNumber={}", 
                    request.getFirstName(), request.getLastName(), request.getPhoneNumber());
            
            User user = userService.findById(uid)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            log.info("Current user data: firstName={}, lastName={}, phoneNumber={}", 
                    user.getFirstName(), user.getLastName(), user.getPhoneNumber());
            
            // Update basic user information
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
                log.info("Updating phone number from '{}' to '{}'", user.getPhoneNumber(), request.getPhoneNumber());
                user.setPhoneNumber(request.getPhoneNumber());
            }
            
            // Update barber-specific information if user is a barber
            if (user.getRole() == User.UserRole.BARBER && user.getBarberProfile() != null) {
                var barberProfile = user.getBarberProfile();
                if (request.getBio() != null) {
                    barberProfile.setBio(request.getBio());
                }
                if (request.getYearsExperience() != null) {
                    barberProfile.setYearsExperience(request.getYearsExperience());
                }
                if (request.getIsAvailable() != null) {
                    barberProfile.setIsAvailable(request.getIsAvailable());
                }
            }
            
            // Save updated user
            user = userService.save(user);
            log.info("User saved successfully. New phone number: {}", user.getPhoneNumber());
            
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
        
        if (user.getBarberProfile() != null) {
            var bp = user.getBarberProfile();
            AuthResponse.BarberProfileResponse barberResponse = new AuthResponse.BarberProfileResponse();
            barberResponse.setId(bp.getBarber_profile_id());
            barberResponse.setBio(bp.getBio());
            barberResponse.setYearsExperience(bp.getYearsExperience());
            barberResponse.setRating(bp.getRating().toString());
            barberResponse.setTotalReviews(bp.getTotalReviews());
            barberResponse.setProfileImageUrl(bp.getProfileImageUrl());
            barberResponse.setIsAvailable(bp.getIsAvailable());
            
            response.setBarberProfile(barberResponse);
        }
        
        return response;
    }
}
