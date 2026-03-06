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
import org.springframework.core.io.Resource;

import javax.annotation.PostConstruct;
import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {
    
    @Value("${firebase.service-account-key:}")
    private String serviceAccountKeyPath;
    
    @Value("${firebase.project.id:barberconnect-db}")
    private String projectId;
    
    @PostConstruct
    public void initializeFirebase() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder();
                
                // Try to load service account key if provided
                if (serviceAccountKeyPath != null && !serviceAccountKeyPath.isEmpty()) {
                    try {
                        // Remove "classpath:" prefix if present
                        String keyPath = serviceAccountKeyPath.replace("classpath:", "");
                        Resource resource = new ClassPathResource(keyPath);
                        
                        if (resource.exists()) {
                            InputStream serviceAccount = resource.getInputStream();
                            optionsBuilder.setCredentials(GoogleCredentials.fromStream(serviceAccount));
                            log.info("Firebase initialized with service account key");
                        } else {
                            log.warn("Service account key file not found: {}", serviceAccountKeyPath);
                            // Initialize with application default credentials for development
                            optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
                        }
                    } catch (Exception e) {
                        log.warn("Failed to load service account key, using application default credentials: {}", e.getMessage());
                        try {
                            optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
                        } catch (Exception ex) {
                            log.warn("Application default credentials not available, initializing without credentials for development");
                        }
                    }
                } else {
                    log.info("No service account key configured, using application default credentials");
                    try {
                        optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
                    } catch (Exception e) {
                        log.warn("Application default credentials not available, initializing without credentials for development");
                    }
                }
                
                // Set project ID if available
                if (projectId != null && !projectId.isEmpty()) {
                    optionsBuilder.setProjectId(projectId);
                }
                
                FirebaseApp.initializeApp(optionsBuilder.build());
                log.info("Firebase initialized successfully");
            }
        } catch (Exception e) {
            log.error("Failed to initialize Firebase: {}", e.getMessage());
            // Initialize a minimal Firebase app for development
            try {
                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseOptions options = FirebaseOptions.builder()
                        .setProjectId(projectId != null ? projectId : "barberconnect-dev")
                        .build();
                    FirebaseApp.initializeApp(options);
                    log.info("Firebase initialized with minimal configuration for development");
                }
            } catch (Exception ex) {
                log.error("Failed to initialize Firebase even with minimal configuration: {}", ex.getMessage());
            }
        }
    }
    
    @Bean
    public FirebaseAuth firebaseAuth() {
        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                return FirebaseAuth.getInstance();
            } else {
                log.warn("Firebase app not initialized, FirebaseAuth will not be available");
                return null;
            }
        } catch (Exception e) {
            log.error("Failed to get FirebaseAuth instance: {}", e.getMessage());
            return null;
        }
    }
}