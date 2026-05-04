package edu.cit.cabasag.barberconnect.feature.auth;

import edu.cit.cabasag.barberconnect.dto.request.LoginRequest;
import edu.cit.cabasag.barberconnect.dto.response.AuthResponse;
import edu.cit.cabasag.barberconnect.factory.UserFactory;
import edu.cit.cabasag.barberconnect.feature.auth.User;
import edu.cit.cabasag.barberconnect.security.JwtUtil;
import edu.cit.cabasag.barberconnect.service.UserService;
import com.google.firebase.auth.FirebaseAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Tests — Auth Feature Slice
 * TC-AUTH-01 through TC-AUTH-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Auth Feature — AuthService Tests")
class AuthServiceTest {

    @Mock private UserService userService;
    @Mock private FirebaseAuth firebaseAuth;
    @Mock private JwtUtil jwtUtil;
    @Mock private UserFactory userFactory;
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
    }

    @Test
    @DisplayName("TC-AUTH-01: login() returns AuthResponse on valid credentials")
    void login_validCredentials_returnsAuthResponse() throws Exception {
        // Arrange — LoginRequest uses @Data (setters, no all-args constructor)
        LoginRequest request = new LoginRequest();
        request.setEmail("juan@test.com");
        request.setPassword("password123");

        when(userService.findByEmail("juan@test.com")).thenReturn(Optional.of(mockUser));
        when(jwtUtil.generateToken(anyString(), anyString(), anyString())).thenReturn("mocked.jwt.token");

        // Act
        AuthResponse result = authService.login(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("juan@test.com");
        assertThat(result.getToken()).isEqualTo("mocked.jwt.token");
        verify(jwtUtil).generateToken(eq("uid-001"), eq("juan@test.com"), eq("CUSTOMER"));
    }

    @Test
    @DisplayName("TC-AUTH-02: login() throws RuntimeException when user not found")
    void login_userNotFound_throwsException() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("notfound@test.com");
        request.setPassword("password");
        when(userService.findByEmail(anyString())).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("TC-AUTH-03: login() throws RuntimeException when account is deactivated")
    void login_deactivatedAccount_throwsException() {
        // Arrange
        mockUser.setIsActive(false);
        LoginRequest request = new LoginRequest();
        request.setEmail("juan@test.com");
        request.setPassword("password123");
        when(userService.findByEmail("juan@test.com")).thenReturn(Optional.of(mockUser));

        // Act & Assert
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(RuntimeException.class);
    }
}
