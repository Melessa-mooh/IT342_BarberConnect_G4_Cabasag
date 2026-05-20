package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.dto.request.LoginRequest;
import edu.cit.cabasag.barberconnect.dto.request.RegisterRequest;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.feature.auth.User;
import edu.cit.cabasag.barberconnect.factory.UserFactory;
import edu.cit.cabasag.barberconnect.security.JwtUtil;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserService userService;
    private final FirebaseAuth firebaseAuth;
    private final JwtUtil jwtUtil;
    private final UserFactory userFactory;
    private final RestTemplate restTemplate;

    /** Firebase Auth REST API key — used only for email/password sign-in verification. */
    @Value("${firebase.web-api-key}")
    private String firebaseWebApiKey;

    private static final String FIREBASE_SIGN_IN_URL =
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=";

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

            // Create user in Firestore using our Factory Pattern
            User user = userFactory.createUser(
                userRecord.getUid(),
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                request.getRole()
            );

            user = userService.save(user);

            // Generate JWT token
            String token = jwtUtil.generateToken(
                    user.getUser_id(),
                    user.getEmail(),
                    user.getRole().name());

            AuthResponse response = mapToAuthResponse(user);
            response.setToken(token);

            log.info("User registered successfully: {}", user.getEmail());
            return response;

        } catch (FirebaseAuthException e) {
            log.error("Firebase registration failed: {}", e.getMessage());
            if (String.valueOf(e.getErrorCode()).equals("EMAIL_ALREADY_EXISTS")) {
                throw new RuntimeException("Email already registered");
            }
            throw new RuntimeException("Registration failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage());
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }

    /**
     * Verifies email + password against Firebase Auth REST API before issuing a JWT.
     * Returns HTTP 401 (via RuntimeException caught in the controller) on bad credentials.
     */
    public AuthResponse login(LoginRequest request) {
        // Step 1: verify password via Firebase Auth REST API
        verifyPasswordWithFirebase(request.getEmail(), request.getPassword());

        // Step 2: load user from Firestore
        Optional<User> userOpt = userService.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        // Step 3: issue JWT
        String token = jwtUtil.generateToken(
                user.getUser_id(),
                user.getEmail(),
                user.getRole().name());

        AuthResponse response = mapToAuthResponse(user);
        response.setToken(token);

        log.info("User login successful: {}", user.getEmail());
        return response;
    }

    /**
     * Calls the Firebase Auth signInWithPassword REST endpoint to verify credentials.
     * Throws RuntimeException("Invalid email or password") on any failure so the
     * controller can return HTTP 401.
     * Package-private to allow unit test stubbing via Mockito spy.
     */
    void verifyPasswordWithFirebase(String email, String password) {
        try {
            String url = FIREBASE_SIGN_IN_URL + firebaseWebApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "email", email,
                    "password", password,
                    "returnSecureToken", true
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, entity, Map.class);

            log.debug("Firebase password verification succeeded for: {}", email);
        } catch (HttpClientErrorException e) {
            log.warn("Firebase password verification failed for {}: {}", email, e.getStatusCode());
            throw new RuntimeException("Invalid email or password");
        } catch (Exception e) {
            log.error("Firebase password verification error for {}: {}", email, e.getMessage());
            throw new RuntimeException("Invalid email or password");
        }
    }

    public AuthResponse loginWithFirebaseToken(String idToken) {
        try {
            // Verify Firebase ID token
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
            String uid = decodedToken.getUid();

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
                    user.getRole().name());

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

        // Load barberProfile — might be null on the User object if not embedded in Firestore
        var bp = user.getBarberProfile();
        if (bp == null && user.getRole() == User.UserRole.BARBER) {
            bp = userService.findBarberProfileByUserId(user.getUser_id()).orElse(null);
        }

        if (bp != null) {
            AuthResponse.BarberProfileResponse barberResponse = new AuthResponse.BarberProfileResponse();
            barberResponse.setId(bp.getBarber_profile_id()); // ← the UUID, not the Firebase UID
            barberResponse.setBio(bp.getBio());
            barberResponse.setYearsExperience(bp.getYearsExperience());
            barberResponse.setRating(bp.getRating() != null ? bp.getRating().toString() : "0");
            barberResponse.setTotalReviews(bp.getTotalReviews() != null ? bp.getTotalReviews() : 0);
            barberResponse.setProfileImageUrl(bp.getProfileImageUrl());
            barberResponse.setIsAvailable(bp.getIsAvailable() != null ? bp.getIsAvailable() : true);
            response.setBarberProfile(barberResponse);
        }

        return response;
    }
}