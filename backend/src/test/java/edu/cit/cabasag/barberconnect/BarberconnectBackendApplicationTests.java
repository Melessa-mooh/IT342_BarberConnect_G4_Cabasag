package edu.cit.cabasag.barberconnect;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.google.firebase.auth.FirebaseAuth;
import com.google.cloud.firestore.Firestore;

@SpringBootTest
class BarberconnectBackendApplicationTests {

	// Firebase beans require real credentials to initialize.
	// Mock them so the context loads cleanly in CI / local test runs.
	@MockBean
	FirebaseAuth firebaseAuth;

	@MockBean
	Firestore firestore;

	@Test
	void contextLoads() {
	}

}
