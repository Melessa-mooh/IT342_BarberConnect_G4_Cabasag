package edu.cit.cabasag.barberconnect.security;

import edu.cit.cabasag.barberconnect.model.User;
import edu.cit.cabasag.barberconnect.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Date;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        try {
            // Extract Google user information
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            String googleId = oAuth2User.getAttribute("sub");
            if (googleId == null || googleId.trim().isEmpty()) {
                googleId = oAuth2User.getAttribute("id");
            }
            
            log.info("Google OAuth2 success for email: {}", email);
            log.debug("Google user attributes: {}", oAuth2User.getAttributes());
            
            if (email == null || email.trim().isEmpty()) {
                throw new RuntimeException("Email not provided by Google OAuth2");
            }
            
            if (googleId == null || googleId.trim().isEmpty()) {
                throw new RuntimeException("Google ID not provided by OAuth2");
            }
            
            // Check if user exists in Firestore
            Optional<User> existingUser = userService.findByEmail(email);
            
            User user;
            if (existingUser.isPresent()) {
                user = existingUser.get();
                log.info("Existing user found: {}", user.getUser_id());
            } else {
                // Create new user in Firestore
                user = createNewUser(googleId, email, name);
                log.info("New user created: {}", user.getUser_id());
            }
            
            // Generate JWT token
            String token = jwtUtil.generateToken(
                user.getUser_id(),
                user.getEmail(),
                user.getRole().name()
            );
            
            // Build redirect URL safely
            String callbackPath = "/auth/callback";
            String redirectUrl = frontendUrl + callbackPath + "?token=" + token + "&success=true";
            
            log.info("Redirecting to: {}", redirectUrl);
            response.sendRedirect(redirectUrl);
            
        } catch (Exception e) {
            log.error("OAuth2 authentication failed: {}", e.getMessage(), e);
            
            // Build error redirect URL safely
            String callbackPath = "/auth/callback";
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Authentication failed";
            String errorUrl = frontendUrl + callbackPath + "?success=false&error=" + 
                             java.net.URLEncoder.encode(errorMessage, "UTF-8");
            
            log.info("Redirecting to error URL: {}", errorUrl);
            response.sendRedirect(errorUrl);
        }
    }

    private User createNewUser(String googleId, String email, String name) {
        User user = new User();
        user.setUser_id(googleId);
        user.setEmail(email);
        
        // Parse name into firstName and lastName
        if (name != null && !name.trim().isEmpty()) {
            String[] nameParts = name.trim().split("\\s+");
            user.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                user.setLastName(String.join(" ", java.util.Arrays.copyOfRange(nameParts, 1, nameParts.length)));
            } else {
                user.setLastName("");
            }
        } else {
            user.setFirstName("Google");
            user.setLastName("User");
        }
        
        user.setPhoneNumber(""); // User can update later
        user.setRole(User.UserRole.CUSTOMER); // Default role
        user.setIsActive(true);
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        
        return userService.save(user);
    }
}
