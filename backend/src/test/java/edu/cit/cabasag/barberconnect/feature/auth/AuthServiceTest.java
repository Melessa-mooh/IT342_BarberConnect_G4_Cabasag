package edu.cit.cabasag.barberconnect.feature.auth;

import edu.cit.cabasag.barberconnect.dto.request.LoginRequest;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.factory.UserFactory;
import edu.cit.cabasag.barberconnect.security.JwtUtil;
import edu.cit.cabasag.barberconnect.service.AuthService;
import edu.cit.cabasag.barberconnect.service.UserService;
import com.google.firebase.auth.FirebaseAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Tests — Auth Feature Slice
 * TC-AUTH-01 through TC-AUTH-04
 *
 * Password verification uses the Firebase Auth REST API via RestTemplate.
 * We inject a mock RestTemplate via ReflectionTestUtils so no real HTTP call
 * is made during tests.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Auth Feature — AuthService Tests")
class AuthServiceTest {

    @Mock private UserService  userService;
    @Mock private FirebaseAuth firebaseAuth;
    @Mock private JwtUtil      jwtUtil;
    @Mock private UserFactory  userFactory;
    @Mock private RestTemplate restTemplate;

    @InjectMocks private AuthService authService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setUser_id("uid-001");
        mockUser.setFirstName("Juan");
        mockUser.setLastName("dela Cruz");
        mockUser.setEmail("juan@test.com");
        mockUser.setRole(User.UserRole.CUSTOMER);
        mockUser.setIsActive(true);

        // Inject the dummy API key and the mock RestTemplate into the service
        ReflectionTestUtils.setField(authService, "firebaseWebApiKey", "test-api-key");
        ReflectionTestUtils.setField(authService, "restTemplate", restTemplate);
    }

    // ── TC-AUTH-01 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-01: login() returns AuthResponse when Firebase verifies credentials")
    void login_validCredentials_returnsAuthResponse() {
        // Arrange — RestTemplate returns a 200 OK (password accepted)
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("idToken", "firebase-id-token")));
        when(userService.findByEmail("juan@test.com")).thenReturn(Optional.of(mockUser));
        when(jwtUtil.generateToken(anyString(), anyString(), anyString()))
                .thenReturn("mocked.jwt.token");

        LoginRequest request = new LoginRequest();
        request.setEmail("juan@test.com");
        request.setPassword("password123");

        // Act
        AuthResponse result = authService.login(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("juan@test.com");
        assertThat(result.getToken()).isEqualTo("mocked.jwt.token");
        verify(jwtUtil).generateToken(eq("uid-001"), eq("juan@test.com"), eq("CUSTOMER"));
    }

    // ── TC-AUTH-02 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-02: login() throws RuntimeException when user not found in Firestore")
    void login_userNotFound_throwsException() {
        // Arrange — Firebase accepts the password but user isn't in Firestore
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("idToken", "firebase-id-token")));
        when(userService.findByEmail(anyString())).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest();
        request.setEmail("notfound@test.com");
        request.setPassword("password");

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid email or password");
    }

    // ── TC-AUTH-03 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-03: login() throws RuntimeException when account is deactivated")
    void login_deactivatedAccount_throwsException() {
        // Arrange
        mockUser.setIsActive(false);
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("idToken", "firebase-id-token")));
        when(userService.findByEmail("juan@test.com")).thenReturn(Optional.of(mockUser));

        LoginRequest request = new LoginRequest();
        request.setEmail("juan@test.com");
        request.setPassword("password123");

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("deactivated");
    }

    // ── TC-AUTH-04 ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("TC-AUTH-04: login() throws RuntimeException when Firebase rejects the password")
    void login_wrongPassword_throwsException() {
        // Arrange — Firebase returns 400 Bad Request for wrong password
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST,
                        "INVALID_PASSWORD"));

        LoginRequest request = new LoginRequest();
        request.setEmail("juan@test.com");
        request.setPassword("wrongpassword");

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid email or password");

        // Firestore should never be queried if Firebase rejects the password
        verify(userService, never()).findByEmail(anyString());
    }
}
