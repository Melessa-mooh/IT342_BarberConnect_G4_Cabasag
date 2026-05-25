package edu.cit.cabasag.barberconnect;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import edu.cit.cabasag.barberconnect.factory.UserFactory;
import edu.cit.cabasag.barberconnect.feature.auth.User;
import edu.cit.cabasag.barberconnect.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.Optional;

@SpringBootApplication
@Slf4j
public class BarberconnectBackendApplication {

	// ─── Admin credentials ────────────────────────────────────────────────────
	private static final String ADMIN_EMAIL_ENV = "BARBERCONNECT_ADMIN_EMAIL";
	private static final String ADMIN_PASSWORD_ENV = "BARBERCONNECT_ADMIN_PASSWORD";
	private static final String DEFAULT_ADMIN_EMAIL = "admin@barberconnect.com";
	private static final String ADMIN_NAME = "Admin";
	// ─────────────────────────────────────────────────────────────────────────

	public static void main(String[] args) {
		SpringApplication.run(BarberconnectBackendApplication.class, args);
	}

	/**
	 * Seed the admin account on startup when configured through environment variables.
	 */
	@Bean
	CommandLineRunner initAdmin(UserService userService,
	                            FirebaseAuth firebaseAuth,
	                            UserFactory userFactory) {
		return args -> {
			String adminEmail = envOrDefault(ADMIN_EMAIL_ENV, DEFAULT_ADMIN_EMAIL);
			String adminPassword = System.getenv(ADMIN_PASSWORD_ENV);
			if (adminPassword == null || adminPassword.isBlank()) {
				log.info("Skipping default admin creation: {} is not set.", ADMIN_PASSWORD_ENV);
				return;
			}

			try {
				String uid = ensureFirebaseAdminAccount(firebaseAuth, adminEmail, adminPassword);
				ensureFirestoreAdminRecord(userService, userFactory, uid, adminEmail);
				log.info("=====> Admin account ready: {} <=====", adminEmail);
			} catch (Exception e) {
				log.error("Failed to initialise admin account: {}", e.getMessage());
			}
		};
	}

	// ── Step 1: create or fetch the Firebase Auth user ──────────────────────
	private String ensureFirebaseAdminAccount(FirebaseAuth firebaseAuth, String adminEmail, String adminPassword) throws FirebaseAuthException {
		try {
			// Try to fetch existing Firebase account
			UserRecord existing = firebaseAuth.getUserByEmail(adminEmail);
			// Update password in case it was changed externally
			UserRecord.UpdateRequest update = new UserRecord.UpdateRequest(existing.getUid())
					.setPassword(adminPassword)
					.setDisplayName(ADMIN_NAME)
					.setEmailVerified(true);
			firebaseAuth.updateUser(update);
			log.info("Admin Firebase account already exists — credentials refreshed.");
			return existing.getUid();
		} catch (FirebaseAuthException e) {
			// Account doesn't exist → create it
			UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
					.setEmail(adminEmail)
					.setPassword(adminPassword)
					.setDisplayName(ADMIN_NAME)
					.setEmailVerified(true);
			UserRecord created = firebaseAuth.createUser(createRequest);
			log.info("Admin Firebase account created with uid: {}", created.getUid());
			return created.getUid();
		}
	}

	// ── Step 2: create or promote the Firestore user record ─────────────────
	private void ensureFirestoreAdminRecord(UserService userService,
	                                        UserFactory userFactory,
	                                        String uid,
	                                        String adminEmail) {
		Optional<User> userOpt = userService.findByEmail(adminEmail);

		if (userOpt.isPresent()) {
			User user = userOpt.get();
			if (user.getRole() != User.UserRole.ADMIN) {
				user.setRole(User.UserRole.ADMIN);
				userService.save(user);
				log.info("Existing user elevated to ADMIN: {}", adminEmail);
			}
		} else {
			// First time — create the Firestore record
			User adminUser = userFactory.createUser(uid, ADMIN_NAME, "", adminEmail, "ADMIN");
			userService.save(adminUser);
			log.info("Admin Firestore record created for: {}", adminEmail);
		}
	}

	private String envOrDefault(String key, String fallback) {
		String value = System.getenv(key);
		return value == null || value.isBlank() ? fallback : value.trim();
	}
}
