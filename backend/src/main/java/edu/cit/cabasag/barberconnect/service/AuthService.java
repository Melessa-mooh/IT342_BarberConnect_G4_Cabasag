package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.dto.request.LoginRequest;
import edu.cit.cabasag.barberconnect.dto.request.RegisterRequest;
import edu.cit.cabasag.barberconnect.dto.request.UpdateProfileRequest;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.model.BarberProfile;
import edu.cit.cabasag.barberconnect.model.User;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserService userService;
    private final FirebaseAuth firebaseAuth;
    
    public AuthResponse register(RegisterRequest request) {
        // Clean phone number (remove spaces and formatting)
        String cleanedPhoneNumber = request.getPhoneNumber().replaceAll("\\s+", "");
        
        // Check if user already exists
        if (userService.findById(request.getFirebaseUid()).isPresent()) {
            throw new RuntimeException("User already exists");
        }
        
        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        
        if (userService.existsByPhoneNumber(cleanedPhoneNumber)) {
            throw new RuntimeException("Phone number already registered");
        }
        
        // Create user
        User user = new User();
        user.setUser_id(request.getFirebaseUid());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(cleanedPhoneNumber);
        user.setRole(request.getRole());
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        // If registering as barber, create barber profile
        if (request.getRole() == User.UserRole.BARBER) {
            BarberProfile barberProfile = new BarberProfile();
            barberProfile.setUser_id(user.getUser_id());
            barberProfile.setBio(request.getBio());
            barberProfile.setYearsExperience(request.getYearsExperience() != null ? request.getYearsExperience() : 0);
            barberProfile.setRating(BigDecimal.ZERO);
            barberProfile.setTotalReviews(0);
            barberProfile.setIsAvailable(true);
            barberProfile.setCreatedAt(LocalDateTime.now());
            barberProfile.setUpdatedAt(LocalDateTime.now());
            
            user.setBarberProfile(barberProfile);
        }
        
        user = userService.save(user);
        
        return mapToAuthResponse(user);
    }
    
    public AuthResponse login(LoginRequest request) {
        try {
            log.debug("Login request received with idToken: {}", request.getIdToken() != null ? "present" : "null");
            
            if (firebaseAuth == null) {
                log.error("Firebase authentication is not available");
                throw new RuntimeException("Firebase authentication is not available");
            }
            
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(request.getIdToken());
            String uid = decodedToken.getUid();
            log.debug("Firebase token verified for user: {}", uid);
            
            User user = userService.findById(uid)
                .orElseThrow(() -> {
                    log.warn("User not found in database: {}", uid);
                    return new RuntimeException("User not found. Please register first.");
                });
            
            if (!user.getIsActive()) {
                log.warn("Inactive user attempted login: {}", uid);
                throw new RuntimeException("Account is deactivated");
            }
            
            log.info("User login successful: {}", uid);
            return mapToAuthResponse(user);
            
        } catch (FirebaseAuthException e) {
            log.error("Firebase authentication failed: {}", e.getMessage());
            throw new RuntimeException("Invalid authentication token");
        } catch (Exception e) {
            log.error("Login failed with unexpected error: {}", e.getMessage(), e);
            throw new RuntimeException("Login failed: " + e.getMessage());
        }
    }
    
    public AuthResponse googleAuth(String idToken, User.UserRole role) {
        try {
            log.debug("Google auth request received for role: {}", role);
            
            if (firebaseAuth == null) {
                log.error("Firebase authentication is not available");
                throw new RuntimeException("Firebase authentication is not available");
            }
            
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();
            String name = decodedToken.getName();
            
            log.debug("Firebase token verified for Google user: {} ({})", uid, email);
            
            // Check if user already exists
            User existingUser = userService.findById(uid).orElse(null);
            
            if (existingUser != null) {
                log.info("Existing Google user login: {}", uid);
                // User exists, return their data
                if (!existingUser.getIsActive()) {
                    throw new RuntimeException("Account is deactivated");
                }
                return mapToAuthResponse(existingUser);
            }
            
            log.info("Creating new Google user: {} ({})", uid, email);
            
            // User doesn't exist, create new user with Google info
            User newUser = new User();
            newUser.setUser_id(uid);
            newUser.setEmail(email);
            newUser.setRole(role);
            newUser.setIsActive(true);
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setUpdatedAt(LocalDateTime.now());
            
            // Parse name into firstName and lastName
            if (name != null && !name.trim().isEmpty()) {
                String[] nameParts = name.trim().split("\\s+");
                newUser.setFirstName(nameParts[0]);
                if (nameParts.length > 1) {
                    newUser.setLastName(String.join(" ", java.util.Arrays.copyOfRange(nameParts, 1, nameParts.length)));
                } else {
                    newUser.setLastName("");
                }
            } else {
                newUser.setFirstName("Google");
                newUser.setLastName("User");
            }
            
            // Set placeholder phone number (user can update later)
            newUser.setPhoneNumber("");
            
            // If registering as barber, create basic barber profile
            if (role == User.UserRole.BARBER) {
                BarberProfile barberProfile = new BarberProfile();
                barberProfile.setUser_id(newUser.getUser_id());
                barberProfile.setBio(""); // User can update later
                barberProfile.setYearsExperience(0); // User can update later
                barberProfile.setRating(BigDecimal.ZERO);
                barberProfile.setTotalReviews(0);
                barberProfile.setIsAvailable(true);
                barberProfile.setCreatedAt(LocalDateTime.now());
                barberProfile.setUpdatedAt(LocalDateTime.now());
                
                newUser.setBarberProfile(barberProfile);
            }
            
            newUser = userService.save(newUser);
            log.info("New Google user created successfully: {}", uid);
            
            return mapToAuthResponse(newUser);
            
        } catch (FirebaseAuthException e) {
            log.error("Firebase authentication failed for Google auth: {}", e.getMessage());
            throw new RuntimeException("Invalid authentication token");
        } catch (Exception e) {
            log.error("Google auth failed with unexpected error: {}", e.getMessage(), e);
            throw new RuntimeException("Google authentication failed: " + e.getMessage());
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
            BarberProfile bp = user.getBarberProfile();
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
    
    public AuthResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userService.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Update basic user information
        if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
            user.setFirstName(request.getFirstName().trim());
        }
        
        if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
            user.setLastName(request.getLastName().trim());
        }
        
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
            // Check if phone number is already taken by another user
            if (userService.existsByPhoneNumber(request.getPhoneNumber()) && 
                !request.getPhoneNumber().equals(user.getPhoneNumber())) {
                throw new RuntimeException("Phone number already registered");
            }
            user.setPhoneNumber(request.getPhoneNumber());
        }
        
        // Update barber profile if user is a barber
        if (user.getRole() == User.UserRole.BARBER) {
            BarberProfile barberProfile = user.getBarberProfile();
            if (barberProfile == null) {
                // Create barber profile if it doesn't exist
                barberProfile = new BarberProfile();
                barberProfile.setUser_id(user.getUser_id());
                barberProfile.setRating(BigDecimal.ZERO);
                barberProfile.setTotalReviews(0);
                barberProfile.setCreatedAt(LocalDateTime.now());
                user.setBarberProfile(barberProfile);
            }
            
            if (request.getBio() != null) {
                barberProfile.setBio(request.getBio());
            }
            
            if (request.getYearsExperience() != null) {
                barberProfile.setYearsExperience(request.getYearsExperience());
            }
            
            if (request.getProfileImageUrl() != null) {
                barberProfile.setProfileImageUrl(request.getProfileImageUrl());
            }
            
            if (request.getIsAvailable() != null) {
                barberProfile.setIsAvailable(request.getIsAvailable());
            }
            
            barberProfile.setUpdatedAt(LocalDateTime.now());
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        user = userService.save(user);
        
        return mapToAuthResponse(user);
    }
}