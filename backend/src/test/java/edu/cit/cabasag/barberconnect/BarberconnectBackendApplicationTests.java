package edu.cit.cabasag.barberconnect;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.google.firebase.auth.FirebaseAuth;
import com.google.cloud.firestore.Firestore;

@SpringBootTest
@org.springframework.test.context.TestPropertySource(properties = {
    "jwt.secret=test-secret-key-for-unit-tests-only-32chars",
    "jwt.expiration=86400000",
    "jwt.refresh-expiration=604800000",
    "firebase.web-api-key=test-firebase-web-api-key",
    "cloudinary.cloud-name=test-cloud",
    "cloudinary.api-key=123456789",
    "cloudinary.api-secret=test-cloudinary-secret",
    "spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
    "cors.allowed-origins=http://localhost:5173",
    "frontend.url=http://localhost:5173"
})
class BarberconnectBackendApplicationTests {

    // Firebase beans require real credentials to initialize.
    // Mock them so the context loads cleanly in CI / local test runs.
    @MockitoBean
    FirebaseAuth firebaseAuth;

    @MockitoBean
    Firestore firestore;

    @Test
    void contextLoads() {
    }
}
