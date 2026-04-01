package edu.cit.cabasag.barberconnect.service;

import edu.cit.cabasag.barberconnect.model.User;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentSnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final FirebaseService firebaseService;
    private static final String COLLECTION_NAME = "users";
    
    public Optional<User> findById(String firebaseUid) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return Optional.empty();
            
            DocumentSnapshot document = db.collection(COLLECTION_NAME)
                    .document(Objects.requireNonNull(firebaseUid))
                    .get()
                    .get();
            
            if (document.exists()) {
                return Optional.of(document.toObject(User.class));
            }
            return Optional.empty();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding user by ID: {}", e.getMessage());
            return Optional.empty();
        }
    }
    
    public Optional<User> findByEmail(String email) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return Optional.empty();
            
            var query = db.collection(COLLECTION_NAME)
                    .whereEqualTo("email", email)
                    .limit(1)
                    .get()
                    .get();
            
            if (!query.isEmpty()) {
                return Optional.of(query.getDocuments().get(0).toObject(User.class));
            }
            return Optional.empty();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error finding user by email: {}", e.getMessage());
            return Optional.empty();
        }
    }
    
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }
    
    public boolean existsByPhoneNumber(String phoneNumber) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) return false;
            
            var query = db.collection(COLLECTION_NAME)
                    .whereEqualTo("phoneNumber", phoneNumber)
                    .limit(1)
                    .get()
                    .get();
            
            return !query.isEmpty();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error checking phone number existence: {}", e.getMessage());
            return false;
        }
    }
    
    public User save(User user) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");
            
            if (user.getCreatedAt() == null) {
                user.setCreatedAt(new Date());
            }
            user.setUpdatedAt(new Date());
            
            Map<String, Object> userData = convertToMap(user);
            
            db.collection(COLLECTION_NAME)
                    .document(Objects.requireNonNull(user.getUser_id()))
                    .set(Objects.requireNonNull(userData))
                    .get();
            
            return user;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Error saving user: {}", e.getMessage());
            throw new RuntimeException("Failed to save user", e);
        }
    }
    
    private Map<String, Object> convertToMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("user_id", user.getUser_id());
        map.put("firstName", user.getFirstName());
        map.put("lastName", user.getLastName());
        map.put("email", user.getEmail());
        map.put("phoneNumber", user.getPhoneNumber());
        map.put("role", user.getRole().toString());
        map.put("isActive", user.getIsActive());
        map.put("createdAt", user.getCreatedAt());
        map.put("updatedAt", user.getUpdatedAt());
        return map;
    }
}