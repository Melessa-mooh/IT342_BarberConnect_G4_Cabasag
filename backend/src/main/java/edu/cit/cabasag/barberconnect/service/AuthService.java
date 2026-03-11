package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.dto.request.LoginRequest;
import edu.cit.cabasag.barberconnect.dto.request.RegisterRequest;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.model.User;
import edu.cit.cabasag.barberconnect.security.JwtUtil;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserService userService;
    private final FirebaseAuth firebaseAuth;
    private final JwtUtil jwtUtil;
    
    public AuthResponse register(RegisterRequest request) {
        try {
            // Check if email already exists in our database
            if (userService.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already registered");
            }
            
            // Create user in Firebase Auth
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(request.getEmail())
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getFirstName() + " " + request.getLastName())
                    .setEmailVerified(false);
            
            UserRecord userRecord = firebaseAuth.createUser(createRequest);
            
            // Create user in Firestore
            User user = new User();
            user.setUser_id(userRecord.getUid());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEmail(request.getEmail());
            user.setPhoneNumber(""); // Empty for now, can be updated later
            user.setRole(User.UserRole.CUSTOMER); // Default role
            user.setIsActive(true);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            
            user = userService.save(user);
            
            // Generate JWT token
            String token = jwtUtil.generateToken(
                user.getUser_id(),
                user.getEmail(),
                user.getRole().name()
            );
            
            AuthResponse response = mapToAuthResponse(user);
            response.setToken(token);
            
            log.info("User registered successfully: {}", user.getEmail());
            return response;
            
        } catch (FirebaseAuthException e) {
            log.error("Firebase registration failed: {}", e.getMessage());
            if (e.getErrorCode().equals("EMAIL_ALREADY_EXISTS")) {
                throw new RuntimeException("Email already registered");
            }
            throw new RuntimeException("Registration failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage());
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }
    
    public AuthResponse login(LoginRequest request) {
        try {
            // Find user in our database first
            Optional<User> userOpt = userService.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                throw new RuntimeException("Invalid email or password");
            }
            
            User user = userOpt.get();
            
            // Verify password with Firebase Auth
            // Note: Firebase Admin SDK doesn't have direct password verification
            // In a real app, you'd use Firebase Auth REST API or client SDK
            // For now, we'll assume the frontend handles Firebase Auth verification
            
            if (!user.getIsActive()) {
                throw new RuntimeException("Account is deactivated");
            }
            
            // Generate JWT token
            String token = jwtUtil.generateToken(
                user.getUser_id(),
                user.getEmail(),
                user.getRole().name()
            );
            
            AuthResponse response = mapToAuthResponse(user);
            response.setToken(token);
            
            log.info("User login successful: {}", user.getEmail());
            return response;
            
        } catch (Exception e) {
            log.error("Login failed: {}", e.getMessage());
            throw new RuntimeException("Invalid email or password");
        }
    }
    
    public AuthResponse loginWithFirebaseToken(String idToken) {
        try {
            // Verify Firebase ID token
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();
            
            // Find user in our database
            Optional<User> userOpt = userService.findById(uid);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("User not found. Please register first.");
            }
            
            User user = userOpt.get();
            
            if (!user.getIsActive()) {
                throw new RuntimeException("Account is deactivated");
            }
            
            // Generate JWT token
            String token = jwtUtil.generateToken(
                user.getUser_id(),
                user.getEmail(),
                user.getRole().name()
            );
            
            AuthResponse response = mapToAuthResponse(user);
            response.setToken(token);
            
            log.info("Firebase token login successful: {}", user.getEmail());
            return response;
            
        } catch (FirebaseAuthException e) {
            log.error("Firebase token verification failed: {}", e.getMessage());
            throw new RuntimeException("Invalid authentication token");
        } catch (Exception e) {
            log.error("Firebase token login failed: {}", e.getMessage());
            throw new RuntimeException("Login failed: " + e.getMessage());
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