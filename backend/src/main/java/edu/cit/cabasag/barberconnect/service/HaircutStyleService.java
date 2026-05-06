package edu.cit.cabasag.barberconnect.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import edu.cit.cabasag.barberconnect.feature.catalog.HaircutStyle;
import edu.cit.cabasag.barberconnect.feature.catalog.StyleOption;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
@RequiredArgsConstructor
@Slf4j
public class HaircutStyleService {

    private final FirebaseService firebaseService;
    private final CloudinaryService cloudinaryService;

    private static final String HAIRCUTS_COLLECTION = "haircut_styles";
    private static final String OPTIONS_COLLECTION = "style_options";

    @SuppressWarnings("null")
    public HaircutStyle createHaircutStyle(String barberProfileId, String name, String description,
                                           java.math.BigDecimal basePrice, Integer durationMinutes,
                                           MultipartFile file) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            String haircutStyleId = UUID.randomUUID().toString();
            String imageUrl = null;

            if (file != null && !file.isEmpty()) {
                imageUrl = cloudinaryService.uploadProfilePicture("haircuts/" + barberProfileId, file);
            }

            HaircutStyle style = new HaircutStyle();
            style.setHaircut_style_id(haircutStyleId);
            style.setBarber_profile_id(barberProfileId);
            style.setName(name);
            style.setDescription(description);
            style.setBasePrice(basePrice);
            style.setDurationMinutes(durationMinutes);
            style.setImageUrl(imageUrl);
            style.setIsActive(true);
            style.setCreatedAt(new java.util.Date().toString());
            style.setUpdatedAt(new java.util.Date().toString());
            style.setStyleOptionIds(new ArrayList<>());

            db.collection(HAIRCUTS_COLLECTION).document(java.util.Objects.requireNonNullElse(haircutStyleId, "")).set(style).get();

            return style;

        } catch (Exception e) {
            log.error("Failed to create haircut style: {}", e.getMessage());
            throw new RuntimeException("Failed to create haircut style: " + e.getMessage());
        }
    }

    public List<HaircutStyle> getHaircutStylesForBarber(String barberProfileId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            QuerySnapshot query = db.collection(HAIRCUTS_COLLECTION)
                    .whereEqualTo("barber_profile_id", barberProfileId)
                    .get().get();

            List<HaircutStyle> styles = new ArrayList<>();
            for (QueryDocumentSnapshot doc : query.getDocuments()) {
                HaircutStyle style = doc.toObject(HaircutStyle.class);
                if (Boolean.TRUE.equals(style.getIsActive())) {
                    styles.add(style);
                }
            }
            return styles;

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to fetch haircut styles: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch haircut styles: " + e.getMessage());
        }
    }

    @SuppressWarnings("null")
    public HaircutStyle updateHaircutStyle(String haircutStyleId, String name, String description,
                                           java.math.BigDecimal basePrice, Integer durationMinutes) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            var docRef = db.collection(HAIRCUTS_COLLECTION).document(java.util.Objects.requireNonNullElse(haircutStyleId, ""));
            var snapshot = docRef.get().get();

            if (!snapshot.exists()) {
                throw new RuntimeException("Haircut style not found");
            }

            Map<String, Object> updates = new HashMap<>();
            if (name != null) updates.put("name", name);
            if (description != null) updates.put("description", description);
            if (basePrice != null) updates.put("basePrice", basePrice);
            if (durationMinutes != null) updates.put("durationMinutes", durationMinutes);
            updates.put("updatedAt", new java.util.Date().toString());

            docRef.update(updates).get();

            return docRef.get().get().toObject(HaircutStyle.class);

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to update haircut style: {}", e.getMessage());
            throw new RuntimeException("Failed to update haircut style: " + e.getMessage());
        }
    }

    @SuppressWarnings("null")
    public void deleteHaircutStyle(String haircutStyleId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            db.collection(HAIRCUTS_COLLECTION).document(java.util.Objects.requireNonNullElse(haircutStyleId, "")).update("isActive", false).get();

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to delete haircut style: {}", e.getMessage());
            throw new RuntimeException("Failed to delete haircut style: " + e.getMessage());
        }
    }

    @SuppressWarnings("null")
    public StyleOption createStyleOption(String haircutStyleId, String name, String description,
                                         java.math.BigDecimal additionalPrice, Integer additionalTimeMinutes) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            String styleOptionId = UUID.randomUUID().toString();

            StyleOption option = new StyleOption();
            option.setStyle_option_id(styleOptionId);
            option.setHaircut_style_id(haircutStyleId);
            option.setName(name);
            option.setDescription(description);
            option.setAdditionalPrice(additionalPrice);
            option.setAdditionalTimeMinutes(additionalTimeMinutes);
            option.setIsActive(true);

            db.collection(OPTIONS_COLLECTION).document(java.util.Objects.requireNonNullElse(styleOptionId, "")).set(option).get();

            // Optionally, add to the parent's styleOptionIds array
            // Here we rely on querying the child documents since the frontend fetches them
            
            return option;

        } catch (Exception e) {
            log.error("Failed to create style option: {}", e.getMessage());
            throw new RuntimeException("Failed to create style option: " + e.getMessage());
        }
    }

    public List<StyleOption> getStyleOptionsForHaircut(String haircutStyleId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            QuerySnapshot query = db.collection(OPTIONS_COLLECTION)
                    .whereEqualTo("haircut_style_id", haircutStyleId)
                    .get().get();

            List<StyleOption> options = new ArrayList<>();
            for (QueryDocumentSnapshot doc : query.getDocuments()) {
                StyleOption option = doc.toObject(StyleOption.class);
                if (Boolean.TRUE.equals(option.getIsActive())) {
                    options.add(option);
                }
            }
            return options;

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to fetch style options: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch style options: " + e.getMessage());
        }
    }

    @SuppressWarnings("null")
    public void deleteStyleOption(String styleOptionId) {
        try {
            Firestore db = firebaseService.getFirestore();
            if (db == null) throw new RuntimeException("Firestore not available");

            db.collection(OPTIONS_COLLECTION).document(java.util.Objects.requireNonNullElse(styleOptionId, "")).update("isActive", false).get();

        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to delete style option: {}", e.getMessage());
            throw new RuntimeException("Failed to delete style option: " + e.getMessage());
        }
    }
}
