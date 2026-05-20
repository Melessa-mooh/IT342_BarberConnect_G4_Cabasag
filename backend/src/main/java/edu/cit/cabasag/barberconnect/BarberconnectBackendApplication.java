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
	private static final String ADMIN_EMAIL    = "admin@barberconnect.com";
	private static final String ADMIN_PASSWORD = "admin123";
	private static final String ADMIN_NAME     = "Admin";
	// ─────────────────────────────────────────────────────────────────────────

	public static void main(String[] args) {
		SpringApplication.run(BarberconnectBackendApplication.class, args);
	}

	/**
	 * Seed the admin account on every startup (idempotent).
	 * Credentials:
	 *   Email    : admin@barberconnect.com
	 *   Password : admin123
	 *   Role     : ADMIN
	 */
	@Bean
	CommandLineRunner initAdmin(UserService userService,
	                            FirebaseAuth firebaseAuth,
	                            UserFactory userFactory) {
		return args -> {
			try {
				String uid = ensureFirebaseAdminAccount(firebaseAuth);
				ensureFirestoreAdminRecord(userService, userFactory, uid);
				log.info("=====> Admin account ready: {} <=====", ADMIN_EMAIL);
			} catch (Exception e) {
				log.error("Failed to initialise admin account: {}", e.getMessage());
			}
		};
	}

	// ── Step 1: create or fetch the Firebase Auth user ──────────────────────
	private String ensureFirebaseAdminAccount(FirebaseAuth firebaseAuth) throws FirebaseAuthException {
		try {
			// Try to fetch existing Firebase account
			UserRecord existing = firebaseAuth.getUserByEmail(ADMIN_EMAIL);
			// Update password in case it was changed externally
			UserRecord.UpdateRequest update = new UserRecord.UpdateRequest(existing.getUid())
					.setPassword(ADMIN_PASSWORD)
					.setDisplayName(ADMIN_NAME)
					.setEmailVerified(true);
			firebaseAuth.updateUser(update);
			log.info("Admin Firebase account already exists — credentials refreshed.");
			return existing.getUid();
		} catch (FirebaseAuthException e) {
			// Account doesn't exist → create it
			UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
					.setEmail(ADMIN_EMAIL)
					.setPassword(ADMIN_PASSWORD)
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
	                                        String uid) {
		Optional<User> userOpt = userService.findByEmail(ADMIN_EMAIL);

		if (userOpt.isPresent()) {
			User user = userOpt.get();
			if (user.getRole() != User.UserRole.ADMIN) {
				user.setRole(User.UserRole.ADMIN);
				userService.save(user);
				log.info("Existing user elevated to ADMIN: {}", ADMIN_EMAIL);
			}
		} else {
			// First time — create the Firestore record
			User adminUser = userFactory.createUser(uid, ADMIN_NAME, "", ADMIN_EMAIL, "ADMIN");
			userService.save(adminUser);
			log.info("Admin Firestore record created for: {}", ADMIN_EMAIL);
		}
	}
}
