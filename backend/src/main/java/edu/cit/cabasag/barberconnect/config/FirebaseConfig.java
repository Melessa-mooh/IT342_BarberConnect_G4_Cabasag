package edu.cit.cabasag.barberconnect.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import javax.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.service-account-key:}")
    private String serviceAccountKeyPath;

    @Value("${firebase.project.id:barberconnect-db}")
    private String projectId;

    @Value("${FIREBASE_PROJECT_ID:}")
    private String firebaseProjectId;

    @Value("${firebase.storage.bucket:}")
    private String storageBucket;

    private static final String FIREBASE_SERVICE_ACCOUNT_JSON_ENV = "FIREBASE_SERVICE_ACCOUNT_JSON";
    private static final String FIREBASE_SERVICE_ACCOUNT_BASE64_ENV = "FIREBASE_SERVICE_ACCOUNT_BASE64";

    @PostConstruct
    public void initializeFirebase() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                        .setCredentials(loadFirebaseCredentials());

                String resolvedProjectId = firstNonBlank(firebaseProjectId, projectId);
                if (resolvedProjectId != null) {
                    optionsBuilder.setProjectId(resolvedProjectId);
                }

                if (storageBucket != null && !storageBucket.isEmpty()) {
                    optionsBuilder.setStorageBucket(storageBucket);
                }

                FirebaseApp.initializeApp(optionsBuilder.build());
                log.info("Firebase initialized successfully");
            }
        } catch (Exception e) {
            log.error("Failed to initialize Firebase: {}", e.getMessage());
            throw new IllegalStateException("Firebase Admin SDK could not be initialized", e);
        }
    }

    @Bean
    public FirebaseAuth firebaseAuth() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                return FirebaseAuth.getInstance(FirebaseApp.getInstance());
            }
            throw new IllegalStateException("Firebase app is not initialized");
        } catch (Exception e) {
            log.error("Failed to get FirebaseAuth instance: {}", e.getMessage());
            throw new IllegalStateException("FirebaseAuth bean could not be created", e);
        }
    }

    private GoogleCredentials loadFirebaseCredentials() throws Exception {
        String serviceAccountBase64 = normalizeEnvValue(System.getenv(FIREBASE_SERVICE_ACCOUNT_BASE64_ENV));
        if (serviceAccountBase64 != null) {
            byte[] decoded = Base64.getMimeDecoder().decode(serviceAccountBase64.replaceAll("\\s+", ""));
            try (InputStream serviceAccount = new ByteArrayInputStream(decoded)) {
                log.info("Loading Firebase credentials from {}", FIREBASE_SERVICE_ACCOUNT_BASE64_ENV);
                return GoogleCredentials.fromStream(serviceAccount);
            }
        }

        String serviceAccountJson = normalizeEnvValue(System.getenv(FIREBASE_SERVICE_ACCOUNT_JSON_ENV));
        if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
            serviceAccountJson = serviceAccountJson
                    .replace("\\n", "\n")
                    .replace("\\\"", "\"");
            try (InputStream serviceAccount = new ByteArrayInputStream(
                    serviceAccountJson.getBytes(StandardCharsets.UTF_8))) {
                log.info("Loading Firebase credentials from {}", FIREBASE_SERVICE_ACCOUNT_JSON_ENV);
                return GoogleCredentials.fromStream(serviceAccount);
            }
        }

        if (serviceAccountKeyPath != null && !serviceAccountKeyPath.isBlank()) {
            Resource resource = resolveServiceAccountResource(serviceAccountKeyPath);
            if (resource.exists()) {
                try (InputStream serviceAccount = resource.getInputStream()) {
                    log.info("Loading Firebase credentials from configured service account key");
                    return GoogleCredentials.fromStream(serviceAccount);
                }
            }
            log.warn("Service account key file not found: {}", serviceAccountKeyPath);
        }

        log.warn("Firebase service account JSON/key not configured. Trying application default credentials.");
        return GoogleCredentials.getApplicationDefault();
    }

    private Resource resolveServiceAccountResource(String configuredPath) {
        String keyPath = configuredPath.trim();
        if (keyPath.startsWith("classpath:")) {
            return new ClassPathResource(keyPath.substring("classpath:".length()));
        }
        Resource fileResource = new FileSystemResource(keyPath);
        return fileResource.exists() ? fileResource : new ClassPathResource(keyPath);
    }

    private String normalizeEnvValue(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        if (normalized.isBlank()) return null;
        if (normalized.length() >= 2 && normalized.startsWith("\"") && normalized.endsWith("\"")) {
            normalized = normalized.substring(1, normalized.length() - 1).trim();
        }
        return normalized.isBlank() ? null : normalized;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isBlank()) return value.trim();
        }
        return null;
    }
}
