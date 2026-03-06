package edu.cit.cabasag.barberconnect.controller;

import edu.cit.cabasag.barberconnect.dto.request.GoogleAuthRequest;
import edu.cit.cabasag.barberconnect.dto.request.LoginRequest;
import edu.cit.cabasag.barberconnect.dto.request.RegisterRequest;
import edu.cit.cabasag.barberconnect.dto.request.UpdateProfileRequest;
import edu.cit.cabasag.barberconnect.dto.response.ApiResponse;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"})
public class AuthController {
    
    private final AuthService authService;
    
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
    
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleAuth(@Valid @RequestBody GoogleAuthRequest request) {
        try {
            AuthResponse response = authService.googleAuth(request.getIdToken(), request.getRole());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Google authentication failed", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/profile/{userId}")
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(
            @PathVariable String userId, 
            @Valid @RequestBody UpdateProfileRequest request) {
        try {
            AuthResponse response = authService.updateProfile(userId, request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("Profile update failed", e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}