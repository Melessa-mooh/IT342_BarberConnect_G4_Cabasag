package edu.cit.cabasag.barberconnect.feature.shared;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Vertical Slice Architecture — Shared Infrastructure
 * Provides the Firestore database instance to all feature slices.
 */
@Service
@Slf4j
public class FirebaseService {

    public Firestore getFirestore() {
        try {
            return FirestoreClient.getFirestore();
        } catch (Exception e) {
            log.error("Failed to get Firestore instance: {}", e.getMessage());
            return null;
        }
    }
}
