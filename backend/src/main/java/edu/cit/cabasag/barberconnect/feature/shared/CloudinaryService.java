package edu.cit.cabasag.barberconnect.feature.shared;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Vertical Slice Architecture — Shared Infrastructure
 * Handles image uploads to Cloudinary for all feature slices.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadProfilePicture(String userId, MultipartFile file) throws IOException {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> options = (Map<String, Object>) ObjectUtils.asMap(
                    "folder", "barberconnect/profiles/" + userId,
                    "use_filename", true,
                    "unique_filename", true,
                    "overwrite", true
            );
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), options);
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new RuntimeException("Cloudinary upload failed: " + e.getMessage());
        }
    }
}
